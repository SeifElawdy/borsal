// src/routes/fabrics.test.js
// Integration tests for the fabrics API routes.
// Uses a real MongoDB connection (test database: original name + "-test").

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

// ─── Test database setup ─────────────────────────────────────────────────────
// Use the same connection string but append "-test" to the database name.
function buildTestUri(uri) {
  const url = new URL(uri);
  // The pathname starts with '/', e.g. '/borsal'
  url.pathname = url.pathname.replace(/([^/]+)$/, '$1-test');
  return url.toString();
}

const baseUri = process.env.MONGODB_URI;
const testUri = buildTestUri(baseUri);

// Import app AFTER dotenv so env vars are present
const app = require('../app');
const FabricPiece = require('../models/FabricPiece');

// ─── Test assets ─────────────────────────────────────────────────────────────
const test1Path = path.resolve(__dirname, '../../data/test/TEST1.png');
const markersPath = path.resolve(__dirname, '../../data/test/markers.json');
const realImageExists = fs.existsSync(test1Path) && fs.existsSync(markersPath);

let markersConfig = {};
if (realImageExists) {
  markersConfig = JSON.parse(fs.readFileSync(markersPath, 'utf8'));
}

// A tiny 1×1 white PNG (valid magic bytes) used for quick tests that don't need a real fabric image
const TINY_PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108020000009001' +
  '2e00000000c4944415478016360f8cfc000000002000170cd5de700000000049454e44ae426082',
  'hex'
);

// A file with wrong magic bytes (plain text)
const FAKE_PNG = Buffer.from('This is not an image at all');

beforeAll(async () => {
  await mongoose.connect(testUri);
});

afterAll(async () => {
  // Drop the test database to leave no trace
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

// ─── Helper ───────────────────────────────────────────────────────────────────
async function createTestFabric(name = 'Test Fabric') {
  const res = await request(app)
    .post('/api/fabrics')
    .send({ name });
  expect(res.status).toBe(201);
  return res.body;
}

// ─── POST /api/fabrics/:id/analyze-photo ─────────────────────────────────────
describe('POST /api/fabrics/:id/analyze-photo', () => {
  it.skipIf(!realImageExists)(
    'Returns 200 with widthCm 7.5..9.5 and does NOT modify geometry',
    async () => {
      const { markerCornersPx, markerSizeCm } = markersConfig['TEST1.png'];
      const fabric = await createTestFabric('Fabric for photo test');

      const res = await request(app)
        .post(`/api/fabrics/${fabric._id}/analyze-photo`)
        .attach('photo', test1Path)
        .field('markerCornersPx', JSON.stringify(markerCornersPx))
        .field('markerSizeCm', String(markerSizeCm));

      expect(res.status).toBe(200);
      expect(res.body.analysisSummary.widthCm).toBeGreaterThanOrEqual(7.5);
      expect(res.body.analysisSummary.widthCm).toBeLessThanOrEqual(9.5);
      expect(res.body.accuracyNote).toMatch(/User confirmation required/);

      // Geometry must NOT have been updated (still unconfirmed / absent)
      const refreshed = await FabricPiece.findById(fabric._id);
      expect(refreshed.geometry).toBeFalsy();
      expect(refreshed.status).toBe('DRAFT');
    }
  );

  it('Rejects a text file renamed to .png with 400', async () => {
    const fabric = await createTestFabric('Fabric fake png');

    // Need to supply corners that pass basic validation — use a 10×10 corner set
    // The TINY_PNG below is 1×1 so the corners must be inside it.
    // We test the magic-byte check, so the corners don't matter much; we use
    // a 100×100 dummy buffer as a workaround: but we cannot control sharp metadata
    // from FAKE_PNG (it will reject the metadata step). That is exactly what we want —
    // 400 before even running extraction.
    const res = await request(app)
      .post(`/api/fabrics/${fabric._id}/analyze-photo`)
      .attach('photo', FAKE_PNG, { filename: 'trick.png', contentType: 'image/png' })
      .field('markerCornersPx', JSON.stringify([[0, 0], [100, 0], [100, 100], [0, 100]]))
      .field('markerSizeCm', '10');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/magic bytes|not a valid/i);
  });

  it('Returns 400 when markerCornersPx field is missing', async () => {
    const fabric = await createTestFabric('Fabric missing field');

    const res = await request(app)
      .post(`/api/fabrics/${fabric._id}/analyze-photo`)
      .attach('photo', TINY_PNG, { filename: 'img.png', contentType: 'image/png' })
      .field('markerSizeCm', '10');
    // No markerCornersPx

    expect(res.status).toBe(400);
  });

  it('Returns 400 when a corner is outside image dimensions', async () => {
    const fabric = await createTestFabric('Fabric out-of-bounds corners');

    // TINY_PNG is 1×1; corners way outside
    const res = await request(app)
      .post(`/api/fabrics/${fabric._id}/analyze-photo`)
      .attach('photo', TINY_PNG, { filename: 'img.png', contentType: 'image/png' })
      .field('markerCornersPx', JSON.stringify([[500, 500], [600, 500], [600, 600], [500, 600]]))
      .field('markerSizeCm', '10');

    expect(res.status).toBe(400);
  });

  it('Returns 404 for a non-existent fabric id', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .post(`/api/fabrics/${fakeId}/analyze-photo`)
      .attach('photo', TINY_PNG, { filename: 'img.png', contentType: 'image/png' })
      .field('markerCornersPx', JSON.stringify([[0, 0], [1, 0], [1, 1], [0, 1]]))
      .field('markerSizeCm', '10');

    expect(res.status).toBe(404);
  });
});

// ─── POST /api/fabrics/:id/confirm-geometry ───────────────────────────────────
describe('POST /api/fabrics/:id/confirm-geometry', () => {
  // A simple valid rectangle polygon (10×10 cm)
  const RECT_POLYGON = [[0, 0], [10, 0], [10, 10], [0, 10]];
  // A self-intersecting bow-tie (invalid)
  const BOW_TIE = [[0, 0], [10, 10], [10, 0], [0, 10]];

  it('Returns 200, sets status CONFIRMED, geometry.confirmed true, version 1', async () => {
    const fabric = await createTestFabric('Fabric to confirm');

    const res = await request(app)
      .post(`/api/fabrics/${fabric._id}/confirm-geometry`)
      .send({ polygonCm: RECT_POLYGON, source: 'manual' });

    expect(res.status).toBe(200);
    expect(res.body.fabric.status).toBe('CONFIRMED');
    expect(res.body.fabric.geometry.confirmed).toBe(true);
    expect(res.body.fabric.geometry.version).toBe(1);
    expect(res.body.fabric.geometry.source).toBe('manual');
    expect(res.body.summary.areaCm2).toBeCloseTo(100, 1);
  });

  it('Returns 400 and saves nothing for a bow-tie (self-intersecting) polygon', async () => {
    const fabric = await createTestFabric('Fabric bow-tie');

    const res = await request(app)
      .post(`/api/fabrics/${fabric._id}/confirm-geometry`)
      .send({ polygonCm: BOW_TIE, source: 'manual' });

    expect(res.status).toBe(400);

    // Confirm nothing was saved
    const refreshed = await FabricPiece.findById(fabric._id);
    expect(refreshed.geometry).toBeFalsy();
    expect(refreshed.status).toBe('DRAFT');
  });

  it('Confirming twice bumps version to 2 and geometryHistory has 1 entry', async () => {
    const fabric = await createTestFabric('Fabric confirm twice');

    // First confirmation
    const res1 = await request(app)
      .post(`/api/fabrics/${fabric._id}/confirm-geometry`)
      .send({ polygonCm: RECT_POLYGON, source: 'manual' });
    expect(res1.status).toBe(200);
    expect(res1.body.fabric.geometry.version).toBe(1);

    // Second confirmation (slightly different polygon)
    const RECT2 = [[0, 0], [5, 0], [5, 5], [0, 5]];
    const res2 = await request(app)
      .post(`/api/fabrics/${fabric._id}/confirm-geometry`)
      .send({ polygonCm: RECT2, source: 'manual', expectedGeometryVersion: 1 });
    expect(res2.status).toBe(200);
    expect(res2.body.fabric.geometry.version).toBe(2);
    expect(res2.body.fabric.geometryHistory).toHaveLength(1);
    // The archived entry should be the first polygon
    expect(res2.body.fabric.geometryHistory[0].version).toBe(1);
  });
});

