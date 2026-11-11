import { describe, it, expect, beforeAll, afterAll } from 'vitest';
const request = require('supertest');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { randomUUID } = require('crypto');
const sharp = require('sharp');
require('dotenv').config();

// Unique, test-suffixed database and upload root; Vitest runs files sequentially.
const runId = randomUUID();
const dbName = 'borsal-traceability-' + runId + '-test';
const uri = new URL(process.env.MONGODB_URI);
uri.pathname = '/' + dbName;
const uploadRoot = path.join(os.tmpdir(), 'borsal-traceability-' + runId);
process.env.BORSAL_UPLOADS_DIR = uploadRoot;
const app = require('../app');
const FabricPiece = require('../models/FabricPiece');
const photoPath = path.resolve(__dirname, '../../data/test/TEST1.png');
const markerPath = path.resolve(__dirname, '../../data/test/markers.json');
const hasFixture = fs.existsSync(photoPath) && fs.existsSync(markerPath);
const fixture = hasFixture ? JSON.parse(fs.readFileSync(markerPath, 'utf8'))['TEST1.png'] : null;
const corners = [[10, 10], [190, 10], [190, 190], [10, 190]];
const rectangle = [[0, 0], [10, 0], [10, 10], [0, 10]];
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const notice = 'Confirmed geometry is based on a previous analysis; confirm the geometry again to base it on this photo.';
let image;

beforeAll(async () => {
  await mongoose.connect(uri.toString());
  const background = await sharp({ create: { width: 200, height: 200, channels: 3, background: { r: 255, g: 220, b: 0 } } }).png().toBuffer();
  const cloth = await sharp({ create: { width: 80, height: 70, channels: 3, background: { r: 30, g: 60, b: 140 } } }).png().toBuffer();
  image = await sharp(background).composite([{ input: cloth, left: 60, top: 65 }]).png().toBuffer();
});

afterAll(async () => {
  if (mongoose.connection.name === dbName) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  const resolved = path.resolve(uploadRoot);
  if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || path.basename(resolved) !== 'borsal-traceability-' + runId) throw new Error('Unsafe test cleanup path');
  fs.rmSync(resolved, { recursive: true, force: true });
  delete process.env.BORSAL_UPLOADS_DIR;
});

async function upload(endpoint = '/api/fabrics/from-photo', real = false) {
  let req = request(app).post(endpoint)
    .attach('photo', real ? fs.readFileSync(photoPath) : image, { filename: 'fabric.png', contentType: 'image/png' })
    .field('markerCornersPx', JSON.stringify(real ? fixture.markerCornersPx : corners))
    .field('markerSizeCm', String(real ? fixture.markerSizeCm : 10));
  if (endpoint === '/api/fabrics/from-photo') req = req.field('name', 'Traceable fabric');
  const res = await req;
  expect(res.status, JSON.stringify(res.body)).toBe(endpoint === '/api/fabrics/from-photo' ? 201 : 200);
  return res;
}
async function confirm(fabric, extra = {}) {
  const res = await request(app).post('/api/fabrics/' + fabric._id + '/confirm-geometry')
    .send({ polygonCm: fabric.analysis?.suggestedPolygonCm || rectangle, source: 'suggested', ...extra });
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  return res;
}
async function get(id) {
  const res = await request(app).get('/api/fabrics/' + id);
  expect(res.status).toBe(200);
  return res.body;
}
function expectedBasis(analysis, matchesSuggestion = true) {
  return {
    analysisId: analysis.analysisId, photoPath: analysis.photoPath, calibrationSource: analysis.calibrationSource,
    markerSizeCm: analysis.markerSizeCm, markerCornersPx: analysis.markerCornersPx, scale: analysis.scale,
    suggestedPolygonCm: analysis.suggestedPolygonCm, analysisCreatedAt: analysis.createdAt, matchesSuggestion,
  };
}

describe('Phase 1b photo and geometry traceability', () => {
  it.skipIf(!hasFixture)('registers TEST1 with a UUID and confirms the exact analysis snapshot', async () => {
    const fabric = (await upload(undefined, true)).body.fabric;
    expect(fabric.analysis.analysisId).toMatch(uuidPattern);
    const res = await confirm(fabric);
    expect(res.body.fabric.geometry.basis).toEqual(expectedBasis(fabric.analysis));
    expect(res.body.fabric.geometry.basis.markerSizeCm).toBe(10);
    expect(res.body.fabric.geometry.basis.scale).toBeDefined();
    expect(res.body.geometryBasedOnCurrentAnalysis).toBe(true);
    expect((await get(fabric._id)).geometryBasedOnCurrentAnalysis).toBe(true);
  });
  it('marks a manually shifted polygon as different from the suggestion', async () => {
    const fabric = (await upload()).body.fabric;
    const polygon = structuredClone(fabric.analysis.suggestedPolygonCm);
    polygon[0][0] += 0.5;
    const res = await confirm(fabric, { polygonCm: polygon, source: 'manual' });
    expect(res.body.fabric.geometry.basis.analysisId).toBe(fabric.analysis.analysisId);
    expect(res.body.fabric.geometry.basis.matchesSuggestion).toBe(false);
  });
  it('preserves confirmed basis and old photos on reanalysis, then archives the old basis on reconfirmation', async () => {
    const fabric = (await upload()).body.fabric;
    const first = (await confirm(fabric)).body.fabric;
    const replaced = await upload('/api/fabrics/' + fabric._id + '/analyze-photo');
    const after = await get(fabric._id);
    expect(after.analysis.analysisId).toMatch(uuidPattern);
    expect(after.analysis.analysisId).not.toBe(fabric.analysis.analysisId);
    expect(after.analysisHistory.map((entry) => entry.analysisId)).toContain(fabric.analysis.analysisId);
    expect(after.geometry).toEqual(first.geometry);
    expect(after.status).toBe(first.status);
    expect(after.geometryBasedOnCurrentAnalysis).toBe(false);
    expect(replaced.body.geometryBasedOnCurrentAnalysis).toBe(false);
    expect(replaced.body.notice).toBe(notice);
    expect(fs.existsSync(fabric.analysis.photoPath)).toBe(true);
    expect(fs.existsSync(after.analysis.photoPath)).toBe(true);
    const reconfirmed = await confirm(after);
    const current = reconfirmed.body.fabric;
    expect(current.geometry.version).toBe(first.geometry.version + 1);
    expect(current.geometryHistory.at(-1)).toEqual(first.geometry);
    expect(current.geometry.basis.analysisId).toBe(after.analysis.analysisId);
    expect(reconfirmed.body.geometryBasedOnCurrentAnalysis).toBe(true);
    expect((await get(fabric._id)).geometryBasedOnCurrentAnalysis).toBe(true);
  });
  it('accepts historical analysis IDs and stores a detached snapshot of all basis values', async () => {
    const fabric = (await upload()).body.fabric;
    await upload('/api/fabrics/' + fabric._id + '/analyze-photo');
    const res = await confirm(fabric, { basedOnAnalysisId: fabric.analysis.analysisId });
    expect(res.body.fabric.geometry.basis).toEqual(expectedBasis(fabric.analysis));
    expect(res.body.geometryBasedOnCurrentAnalysis).toBe(false);
    expect((await get(fabric._id)).geometryBasedOnCurrentAnalysis).toBe(false);
    const snapshot = res.body.fabric.geometry.basis;
    // Changing the original analysis data must not mutate the persisted basis.
    await FabricPiece.collection.updateOne({ _id: new mongoose.Types.ObjectId(fabric._id) }, {
      $set: { 'analysisHistory.0.markerCornersPx': [[1, 2]], 'analysisHistory.0.scale.pxPerCmApprox': 999, 'analysisHistory.0.suggestedPolygonCm': rectangle },
    });
    expect((await get(fabric._id)).geometry.basis).toEqual(snapshot);
    expect(fs.existsSync(snapshot.photoPath)).toBe(true);
  });
  it('rejects an unknown analysis ID without changing any document field', async () => {
    const fabric = (await upload()).body.fabric;
    await confirm(fabric);
    const before = await FabricPiece.findById(fabric._id).lean();
    const res = await request(app).post('/api/fabrics/' + fabric._id + '/confirm-geometry')
      .send({ polygonCm: rectangle, source: 'manual', basedOnAnalysisId: randomUUID() });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('basedOnAnalysisId');
    expect(await FabricPiece.findById(fabric._id).lean()).toEqual(before);
  });
  it('supports manual confirmation without any analysis or basis', async () => {
    const created = await request(app).post('/api/fabrics').send({ name: 'No analysis' });
    expect(created.status).toBe(201);
    const res = await confirm(created.body, { source: 'manual' });
    expect(res.body.fabric.geometry.basis).toBeUndefined();
    expect(res.body.geometryBasedOnCurrentAnalysis).toBeNull();
    expect((await get(created.body._id)).geometryBasedOnCurrentAnalysis).toBeNull();
  });
  it('confirms legacy analyses without assigning or requiring an analysis ID', async () => {
    const legacyAnalysis = {
      photoPath: 'legacy-photo.png', markerSizeCm: 10, markerCornersPx: corners,
      calibrationSource: 'manual-dev', scale: { pxPerCmApprox: 18, perspectiveSkew: 0 },
      suggestedPolygonCm: rectangle, createdAt: new Date('2026-01-01T00:00:00Z'),
    };
    const inserted = await FabricPiece.collection.insertOne({ name: 'Legacy analysis', analysis: legacyAnalysis });
    const fabric = await get(inserted.insertedId);
    const res = await confirm(fabric, { source: 'manual' });
    expect(res.body.fabric.geometry.basis.analysisId).toBeUndefined();
    expect(res.body.fabric.geometry.basis.photoPath).toBe('legacy-photo.png');
    expect(res.body.fabric.analysis.analysisId).toBeUndefined();
    expect(res.body.geometryBasedOnCurrentAnalysis).toBeNull();
    expect((await get(fabric._id)).geometryBasedOnCurrentAnalysis).toBeNull();
  });
  it('keeps confirm-geometry strict and rejects unknown extra fields', async () => {
    const fabric = (await upload()).body.fabric;
    const before = await FabricPiece.findById(fabric._id).lean();
    const res = await request(app).post('/api/fabrics/' + fabric._id + '/confirm-geometry')
      .send({ polygonCm: rectangle, source: 'manual', unexpected: true });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('unexpected');
    expect(await FabricPiece.findById(fabric._id).lean()).toEqual(before);
  });
  it('archives basis unchanged on PUT and leaves the unconfirmed geometry without basis', async () => {
    const fabric = (await upload()).body.fabric;
    const first = (await confirm(fabric)).body.fabric;
    const res = await request(app).put('/api/fabrics/' + fabric._id + '/geometry').send({ polygonCm: rectangle });
    expect(res.status).toBe(200);
    expect(res.body.geometryHistory.at(-1)).toEqual(first.geometry);
    expect(res.body.geometry.basis).toBeUndefined();
    expect(res.body.geometry.confirmed).toBe(false);
    expect((await get(fabric._id)).geometryBasedOnCurrentAnalysis).toBeNull();
  });
  it('normalizes clockwise suggestions and applies the 1e-6 coordinate tolerance', async () => {
    const fabric = (await upload()).body.fabric;
    const normalized = structuredClone(fabric.analysis.suggestedPolygonCm);
    await FabricPiece.collection.updateOne({ _id: new mongoose.Types.ObjectId(fabric._id) }, {
      $set: { 'analysis.suggestedPolygonCm': [...normalized].reverse() },
    });
    const within = structuredClone(normalized);
    within[0][0] += 0.0000005;
    expect((await confirm(fabric, { polygonCm: within })).body.fabric.geometry.basis.matchesSuggestion).toBe(true);
    const outside = structuredClone(normalized);
    outside[0][0] += 0.000002;
    expect((await confirm(fabric, { polygonCm: outside })).body.fabric.geometry.basis.matchesSuggestion).toBe(false);
  });
  it('returns null before confirmation and never stores or adds the derived flag to the list', async () => {
    const fabric = (await upload()).body.fabric;
    const res = await upload('/api/fabrics/' + fabric._id + '/analyze-photo');
    expect(res.body.geometryBasedOnCurrentAnalysis).toBeNull();
    expect(res.body.notice).toBeUndefined();
    expect((await get(fabric._id)).geometryBasedOnCurrentAnalysis).toBeNull();
    await confirm(await get(fabric._id));
    expect((await FabricPiece.collection.findOne({ _id: new mongoose.Types.ObjectId(fabric._id) })).geometryBasedOnCurrentAnalysis).toBeUndefined();
    const list = await request(app).get('/api/fabrics');
    expect(list.body.find((entry) => entry._id === fabric._id).geometryBasedOnCurrentAnalysis).toBeUndefined();
  });
  it('accepts explicitly selecting the current analysis ID', async () => {
    const fabric = (await upload()).body.fabric;
    const res = await confirm(fabric, { basedOnAnalysisId: fabric.analysis.analysisId });
    expect(res.body.geometryBasedOnCurrentAnalysis).toBe(true);
    expect(res.body.fabric.geometry.basis).toEqual(expectedBasis(fabric.analysis));
  });
});
