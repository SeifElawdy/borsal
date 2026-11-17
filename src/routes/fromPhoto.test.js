import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
const request = require('supertest');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { randomUUID } = require('crypto');
const sharp = require('sharp');
require('dotenv').config();

// A unique database and temporary upload root prevent sharing production/test data.
const uri = new URL(process.env.MONGODB_URI);
const runId = randomUUID();
uri.pathname = '/borsal-phase1-' + runId + '-test';
const uploadRoot = path.join(os.tmpdir(), 'borsal-phase1-' + runId);
process.env.BORSAL_UPLOADS_DIR = uploadRoot;
const app = require('../app');
const FabricPiece = require('../models/FabricPiece');
const realPhoto = path.resolve(__dirname, '../../data/test/TEST1.png');
const markerFile = path.resolve(__dirname, '../../data/test/markers.json');
const hasFixture = fs.existsSync(realPhoto) && fs.existsSync(markerFile);
const fixture = hasFixture ? JSON.parse(fs.readFileSync(markerFile, 'utf8'))['TEST1.png'] : null;
const polygon = [[0, 0], [10, 0], [10, 10], [0, 10]];
const corners = [[10, 10], [190, 10], [190, 190], [10, 190]];
let photo;
let blank;

beforeAll(async () => {
  await mongoose.connect(uri.toString());
  blank = await sharp({ create: { width: 200, height: 200, channels: 3, background: { r: 255, g: 220, b: 0 } } }).png().toBuffer();
  const fabric = await sharp({ create: { width: 80, height: 70, channels: 3, background: { r: 30, g: 60, b: 140 } } }).png().toBuffer();
  photo = await sharp(blank).composite([{ input: fabric, left: 60, top: 65 }]).png().toBuffer();
});

afterAll(async () => {
  vi.restoreAllMocks();
  if (mongoose.connection.name === 'borsal-phase1-' + runId + '-test') await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  const resolved = path.resolve(uploadRoot);
  if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !path.basename(resolved).startsWith('borsal-phase1-')) throw new Error('Unsafe test cleanup path');
  fs.rmSync(resolved, { recursive: true, force: true });
  delete process.env.BORSAL_UPLOADS_DIR;
});

function files(directory = uploadRoot) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? files(path.join(directory, entry.name)) : [path.join(directory, entry.name)]
  ).sort();
}
function upload(endpoint = '/api/fabrics/from-photo', fields = {}, image = photo) {
  const values = { name: 'Photo fabric', markerCornersPx: JSON.stringify(corners), markerSizeCm: '10', ...fields };
  if (endpoint !== '/api/fabrics/from-photo') delete values.name;
  let req = request(app).post(endpoint).attach('photo', image, { filename: '../../client.png', contentType: 'image/png' });
  for (const [key, value] of Object.entries(values)) if (value !== null) req = req.field(key, value);
  return req;
}
async function unchangedFailure(fields, image, status) {
  const before = await FabricPiece.countDocuments();
  const beforeFiles = files();
  const res = await upload(undefined, fields, image);
  expect(res.status, JSON.stringify(res.body)).toBe(status);
  expect(await FabricPiece.countDocuments()).toBe(before);
  expect(files()).toEqual(beforeFiles);
  return res;
}
async function create() {
  const res = await request(app).post('/api/fabrics').send({ name: 'Manual fabric' });
  expect(res.status).toBe(201);
  return res.body;
}
async function confirm(id, extra = {}) {
  const current = await FabricPiece.findById(id);
  return request(app).post('/api/fabrics/' + id + '/confirm-geometry').send({ polygonCm: polygon, source: 'manual', basedOnAnalysisId: current.analysis?.analysisId, ...extra });
}

describe('Phase 1 image-first registration', () => {
  it.skipIf(!hasFixture)('registers TEST1 only after analysis, with one document and a contained photo', async () => {
    const before = await FabricPiece.countDocuments();
    const beforeFiles = files();
    const res = await upload(undefined, {
      name: 'TEST1 fabric', fabricType: 'cotton', massGrams: '25.5', grainDirectionDeg: '179.5',
      markerCornersPx: JSON.stringify(fixture.markerCornersPx), markerSizeCm: String(fixture.markerSizeCm),
    }, fs.readFileSync(realPhoto));
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    expect(await FabricPiece.countDocuments()).toBe(before + 1);
    expect(files()).toHaveLength(beforeFiles.length + 1);
    const fabric = res.body.fabric;
    expect(fabric.status).toBe('DRAFT');
    expect(fabric.availabilityStatus).toBe('AVAILABLE');
    expect(fabric.registrationSource).toBe('photo');
    expect(fabric.analysis.calibrationSource).toBe('manual-dev');
    expect(fabric.geometry?.confirmed).not.toBe(true);
    expect(fabric.geometry).toBeUndefined();
    expect(fabric.massGrams).toBe(25.5);
    expect(fabric.grainDirectionDeg).toBe(179.5);
    expect(fs.existsSync(fabric.analysis.photoPath)).toBe(true);
    expect(path.dirname(fabric.analysis.photoPath)).toBe(path.join(uploadRoot, fabric._id));
    expect(path.basename(fabric.analysis.photoPath)).toMatch(/^[0-9a-f-]{36}\.png$/);
    expect(res.body.analysisSummary.widthCm).toBeGreaterThanOrEqual(7.5);
    expect(res.body.analysisSummary.widthCm).toBeLessThanOrEqual(9.5);
    expect(res.body.validation.valid).toBe(true);
    expect(res.body.devNotice).toBe('markerCornersPx and markerSizeCm are developer-only temporary inputs (TS-001); automatic marker detection is planned.');
  });
  it('rejects missing photo without persistence', async () => {
    const count = await FabricPiece.countDocuments();
    const beforeFiles = files();
    const res = await request(app).post('/api/fabrics/from-photo').field('name', 'Missing photo');
    expect(res.status).toBe(400);
    expect(await FabricPiece.countDocuments()).toBe(count);
    expect(files()).toEqual(beforeFiles);
  });
  it.each([
    ['unsupported MIME', Buffer.from('fake'), 'text/plain'],
    ['photo over 10 MB', Buffer.alloc(10 * 1024 * 1024 + 1), 'image/png'],
  ])('rejects %s without persistence', async (_name, image, contentType) => {
    const count = await FabricPiece.countDocuments();
    const beforeFiles = files();
    const res = await request(app).post('/api/fabrics/from-photo')
      .attach('photo', image, { filename: 'image.png', contentType }).field('name', 'Bad photo');
    expect(res.status).toBe(400);
    expect(await FabricPiece.countDocuments()).toBe(count);
    expect(files()).toEqual(beforeFiles);
  });
  it('rejects fake PNG without a document or file', async () => { await unchangedFailure({}, Buffer.from('not a PNG'), 400); });
  it('rejects missing name without a document or file', async () => { await unchangedFailure({ name: null }, photo, 400); });
  it('rejects out-of-bounds corners without a document or file', async () => { await unchangedFailure({ markerCornersPx: '[[0,0],[300,0],[300,300],[0,300]]' }, photo, 400); });
  it('rejects background-only extraction without a document or file', async () => {
    const res = await unchangedFailure({}, blank, 422);
    expect(res.body.validation.valid).toBe(false);
    expect(res.body.validation.errors.length).toBeGreaterThan(0);
    expect(res.body.warnings.length).toBeGreaterThan(0);
  });
  it.each([
    ['negative mass', { massGrams: '-1' }], ['grain over range', { grainDirectionDeg: '200' }],
    ['grain at 180', { grainDirectionDeg: '180' }], ['empty name', { name: ' ' }],
    ['non-number mass', { massGrams: 'abc' }], ['infinite mass', { massGrams: 'Infinity' }],
    ['long fabric type', { fabricType: 'a'.repeat(51) }], ['invalid corners JSON', { markerCornersPx: '{' }],
    ['missing marker size', { markerSizeCm: '' }], ['nonconvex corners', { markerCornersPx: '[[10,10],[190,10],[20,20],[10,190]]' }],
  ])('rejects %s without persistence', async (_name, fields) => { await unchangedFailure(fields, photo, 400); });
  it('treats optional empty multipart values as absent', async () => {
    const res = await upload(undefined, { massGrams: ' ', grainDirectionDeg: '', fabricType: '' });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    expect(res.body.fabric.massGrams).toBeUndefined();
    expect(res.body.fabric.grainDirectionDeg).toBeUndefined();
    expect(res.body.fabric.fabricType).toBeUndefined();
  });
  it('removes the photo if document creation fails', async () => {
    const stub = vi.spyOn(FabricPiece, 'create').mockRejectedValueOnce(new Error('simulated database failure'));
    try {
      const res = await unchangedFailure({}, photo, 500);
      expect(res.body).toEqual({ error: 'Internal server error' });
      expect(stub).toHaveBeenCalledOnce();
    } finally { stub.mockRestore(); }
  });
  it('rejects server fields on photo registration with their names and no persistence', async () => {
    const res = await unchangedFailure({ status: 'CONFIRMED', availabilityStatus: 'RESERVED' }, photo, 400);
    expect(res.body.error).toContain('status');
    expect(res.body.error).toContain('availabilityStatus');
  });
});

describe('Phase 1 consistency guards', () => {
  it('returns AVAILABLE for a raw legacy document on both read endpoints', async () => {
    const { insertedId } = await FabricPiece.collection.insertOne({ name: 'Legacy' });
    const res = await request(app).get('/api/fabrics/' + insertedId);
    expect(res.status).toBe(200);
    expect(res.body.availabilityStatus).toBe('AVAILABLE');
    const list = await request(app).get('/api/fabrics');
    expect(list.body.find((item) => item._id === String(insertedId)).availabilityStatus).toBe('AVAILABLE');
    expect((await FabricPiece.collection.findOne({ _id: insertedId })).availabilityStatus).toBeUndefined();
  });
  it('archives replacement analyses and keeps geometry unchanged, including after confirmation', async () => {
    const fabric = await create();
    const endpoint = '/api/fabrics/' + fabric._id + '/analyze-photo';
    expect((await upload(endpoint)).status).toBe(200);
    const first = await FabricPiece.findById(fabric._id).lean();
    expect((await upload(endpoint)).status).toBe(200);
    const second = await FabricPiece.findById(fabric._id).lean();
    expect(String(second._id)).toBe(fabric._id);
    expect(second.analysisHistory).toHaveLength(1);
    expect(second.analysisHistory[0]).toEqual(first.analysis);
    expect(second.geometry).toEqual(first.geometry);
    expect(second.status).toBe('DRAFT');
    expect((await confirm(fabric._id)).status).toBe(200);
    const confirmed = await FabricPiece.findById(fabric._id).lean();
    expect((await upload(endpoint)).status).toBe(200);
    const third = await FabricPiece.findById(fabric._id).lean();
    expect(third.geometry).toEqual(confirmed.geometry);
    expect(third.status).toBe('CONFIRMED');
    expect(third.analysisHistory).toHaveLength(2);
    const beforeFiles = files();
    const failed = await upload(endpoint, {}, blank);
    expect(failed.status).toBe(422);
    expect(files()).toEqual(beforeFiles);
    expect(await FabricPiece.findById(fabric._id).lean()).toEqual(third);
  });
  it.each(['RESERVED', 'CONSUMED'])('freezes every geometry write for %s fabrics', async (availabilityStatus) => {
    const fabric = await create();
    await FabricPiece.collection.updateOne({ _id: new mongoose.Types.ObjectId(fabric._id) }, { $set: { availabilityStatus } });
    const before = await FabricPiece.findById(fabric._id).lean();
    const beforeFiles = files();
    const responses = [
      await request(app).post('/api/fabrics/' + fabric._id + '/analyze-photo'),
      await request(app).post('/api/fabrics/' + fabric._id + '/confirm-geometry').send({}),
      await upload('/api/fabrics/' + fabric._id + '/analyze-photo'),
      await confirm(fabric._id),
      await request(app).put('/api/fabrics/' + fabric._id + '/geometry').send({ polygonCm: polygon }),
    ];
    for (const res of responses) {
      expect(res.status).toBe(409);
      expect(res.body).toEqual({ error: 'Fabric is reserved or consumed; geometry is frozen' });
    }
    expect(await FabricPiece.findById(fabric._id).lean()).toEqual(before);
    expect(files()).toEqual(beforeFiles);
  });
  it('rejects client-supplied server fields on manual creation', async () => {
    const before = await FabricPiece.countDocuments();
    const res = await request(app).post('/api/fabrics').send({
      name: 'Forbidden', status: 'CONFIRMED', availabilityStatus: 'RESERVED', geometry: { confirmed: true },
      geometryHistory: [], analysis: {}, analysisHistory: [], registrationSource: 'photo',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), _id: new mongoose.Types.ObjectId().toString(),
    });
    expect(res.status).toBe(400);
    for (const field of ['status', 'availabilityStatus', 'geometry', 'geometryHistory', 'analysis', 'analysisHistory', 'registrationSource', 'createdAt', 'updatedAt', '_id']) expect(res.body.error).toContain(field);
    expect(await FabricPiece.countDocuments()).toBe(before);
  });
  it('rejects confirmed:true on PUT without changing the document', async () => {
    const fabric = await create();
    const before = await FabricPiece.findById(fabric._id).lean();
    const res = await request(app).put('/api/fabrics/' + fabric._id + '/geometry').send({ polygonCm: polygon, confirmed: true });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('confirmed');
    expect(await FabricPiece.findById(fabric._id).lean()).toEqual(before);
  });
  it('archives confirmed and draft geometry with monotonically increasing versions 1, 2, 3', async () => {
    const fabric = await create();
    const first = await confirm(fabric._id);
    expect(first.status).toBe(200);
    expect(first.body.fabric.geometry.version).toBe(1);
    const updated = await request(app).put('/api/fabrics/' + fabric._id + '/geometry').send({ polygonCm: [[0, 0], [5, 0], [5, 5], [0, 5]] });
    expect(updated.status).toBe(200);
    expect(updated.body.geometryHistory).toEqual([first.body.fabric.geometry]);
    expect(updated.body.geometry.confirmed).toBe(false);
    expect(updated.body.geometry.version).toBe(2);
    expect(updated.body.status).toBe('DRAFT');
    const third = await confirm(fabric._id, { expectedGeometryVersion: 2 });
    expect(third.status).toBe(200);
    expect(third.body.fabric.geometry.version).toBe(3);
    expect(third.body.fabric.geometryHistory).toEqual([first.body.fabric.geometry, updated.body.geometry]);
  });
});
