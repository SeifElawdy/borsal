// src/vision/extractContour.test.js
// Tests for image-based fabric contour extraction and calibration

import { describe, it, expect } from 'vitest';
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { extractFabricContour } = require('./extractContour');

// Deterministic 32-bit PRNG (Mulberry32) for reproducible noise generation
function createRng(seed) {
  let s = seed >>> 0;
  return function () {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('Fabric contour extraction (src/vision/extractContour.js)', () => {
  it('A) SYNTHETIC GROUND-TRUTH: 400x300 px rectangle on yellow background', async () => {
    // 1000x1000 yellow background (255, 220, 0)
    // Dark-blue fabric (30, 60, 140) at x 300..700, y 350..650
    const width = 1000;
    const height = 1000;
    const rawRgb = Buffer.alloc(width * height * 3);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 3;
        if (x >= 300 && x < 700 && y >= 350 && y < 650) {
          rawRgb[idx] = 30;
          rawRgb[idx + 1] = 60;
          rawRgb[idx + 2] = 140;
        } else {
          rawRgb[idx] = 255;
          rawRgb[idx + 1] = 220;
          rawRgb[idx + 2] = 0;
        }
      }
    }

    const imageBuffer = await sharp(rawRgb, { raw: { width, height, channels: 3 } }).png().toBuffer();
    const markerCornersPx = [
      [100, 100],
      [900, 100],
      [900, 900],
      [100, 900],
    ];
    const markerSizeCm = 10; // 80 px/cm

    const result = await extractFabricContour(imageBuffer, markerCornersPx, markerSizeCm);

    expect(result.ok).toBe(true);
    expect(result.validation.valid).toBe(true);
    expect(result.validation.errors).toHaveLength(0);

    // Expected width: 400 px / 80 px/cm = 5.0 cm (tolerance 3% covers approxPolyDP & morphological ops)
    expect(result.stats.widthCm).toBeGreaterThanOrEqual(5.0 * 0.97);
    expect(result.stats.widthCm).toBeLessThanOrEqual(5.0 * 1.03);

    // Expected height: 300 px / 80 px/cm = 3.75 cm (tolerance 3%)
    expect(result.stats.heightCm).toBeGreaterThanOrEqual(3.75 * 0.97);
    expect(result.stats.heightCm).toBeLessThanOrEqual(3.75 * 1.03);

    // Expected area: 18.75 cm2 (tolerance 3%)
    expect(result.stats.areaCm2).toBeGreaterThanOrEqual(18.75 * 0.97);
    expect(result.stats.areaCm2).toBeLessThanOrEqual(18.75 * 1.03);
  });

  it('B) SYNTHETIC CONCAVE: L-shaped fabric', async () => {
    // Union of [300..700, 350..450] (400x100) and [300..400, 450..650] (100x200)
    // Area = 60000 px^2 / (80^2) = 9.375 cm2
    const width = 1000;
    const height = 1000;
    const rawRgb = Buffer.alloc(width * height * 3);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 3;
        const inArm1 = x >= 300 && x < 700 && y >= 350 && y < 450;
        const inArm2 = x >= 300 && x < 400 && y >= 450 && y < 650;
        if (inArm1 || inArm2) {
          rawRgb[idx] = 30;
          rawRgb[idx + 1] = 60;
          rawRgb[idx + 2] = 140;
        } else {
          rawRgb[idx] = 255;
          rawRgb[idx + 1] = 220;
          rawRgb[idx + 2] = 0;
        }
      }
    }

    const imageBuffer = await sharp(rawRgb, { raw: { width, height, channels: 3 } }).png().toBuffer();
    const markerCornersPx = [
      [100, 100],
      [900, 100],
      [900, 900],
      [100, 900],
    ];
    const markerSizeCm = 10;

    const result = await extractFabricContour(imageBuffer, markerCornersPx, markerSizeCm);

    expect(result.ok).toBe(true);
    expect(result.validation.valid).toBe(true);

    // Expected area: 9.375 cm2 within 4%
    expect(result.stats.areaCm2).toBeGreaterThanOrEqual(9.375 * 0.96);
    expect(result.stats.areaCm2).toBeLessThanOrEqual(9.375 * 1.04);

    // Simplified polygon has between 5 and 12 points
    expect(result.stats.contourPointsSimplified).toBeGreaterThanOrEqual(5);
    expect(result.stats.contourPointsSimplified).toBeLessThanOrEqual(12);
  });

  it('C) NOISE & FRAYED THREADS: robustness against channel noise and thin thread protrusions', async () => {
    const width = 1000;
    const height = 1000;
    const rawRgb = Buffer.alloc(width * height * 3);
    const rng = createRng(12345);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 3;
        let r = 255;
        let g = 220;
        let b = 0;

        if (x >= 300 && x < 700 && y >= 350 && y < 650) {
          r = 30;
          g = 60;
          b = 140;
        }

        // Add thin 1-pixel "threads" (15 px lines) sticking out of the rectangle edges
        if (x >= 285 && x < 300 && y === 400) { r = 30; g = 60; b = 140; }
        if (x >= 700 && x < 715 && y === 500) { r = 30; g = 60; b = 140; }
        if (x === 450 && y >= 335 && y < 350) { r = 30; g = 60; b = 140; }
        if (x === 550 && y >= 650 && y < 665) { r = 30; g = 60; b = 140; }

        // +/-8 per-channel noise
        const nR = Math.floor(rng() * 17) - 8;
        const nG = Math.floor(rng() * 17) - 8;
        const nB = Math.floor(rng() * 17) - 8;

        rawRgb[idx] = Math.max(0, Math.min(255, r + nR));
        rawRgb[idx + 1] = Math.max(0, Math.min(255, g + nG));
        rawRgb[idx + 2] = Math.max(0, Math.min(255, b + nB));
      }
    }

    const imageBuffer = await sharp(rawRgb, { raw: { width, height, channels: 3 } }).png().toBuffer();
    const markerCornersPx = [
      [100, 100],
      [900, 100],
      [900, 900],
      [100, 900],
    ];
    const markerSizeCm = 10;

    const result = await extractFabricContour(imageBuffer, markerCornersPx, markerSizeCm);

    expect(result.ok).toBe(true);
    expect(result.validation.valid).toBe(true);

    // Area must stay within 5% of 18.75 cm2
    expect(result.stats.areaCm2).toBeGreaterThanOrEqual(18.75 * 0.95);
    expect(result.stats.areaCm2).toBeLessThanOrEqual(18.75 * 1.05);
  });

  it('D) FAILURE: image with only background (no fabric) returns ok:false without throwing', async () => {
    const width = 800;
    const height = 800;
    // Uniform yellow image
    const rawRgb = Buffer.alloc(width * height * 3);
    for (let i = 0; i < width * height; i++) {
      rawRgb[i * 3] = 255;
      rawRgb[i * 3 + 1] = 220;
      rawRgb[i * 3 + 2] = 0;
    }

    const imageBuffer = await sharp(rawRgb, { raw: { width, height, channels: 3 } }).png().toBuffer();
    const markerCornersPx = [
      [100, 100],
      [700, 100],
      [700, 700],
      [100, 700],
    ];
    const markerSizeCm = 10;

    let result;
    expect(async () => {
      result = await extractFabricContour(imageBuffer, markerCornersPx, markerSizeCm);
    }).not.toThrow();

    result = await extractFabricContour(imageBuffer, markerCornersPx, markerSizeCm);
    expect(result.ok).toBe(false);
    expect(result.validation.valid).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  const test1Path = path.resolve(__dirname, '..', '..', 'data', 'test', 'TEST1.png');
  const markersPath = path.resolve(__dirname, '..', '..', 'data', 'test', 'markers.json');
  const realImageExists = fs.existsSync(test1Path) && fs.existsSync(markersPath);

  it.skipIf(!realImageExists)('E) REAL IMAGE: TEST1.png plausibility checks', async () => {
    const imageBuffer = fs.readFileSync(test1Path);
    const markersConfig = JSON.parse(fs.readFileSync(markersPath, 'utf8'));
    const { markerCornersPx, markerSizeCm } = markersConfig['TEST1.png'];

    const result = await extractFabricContour(imageBuffer, markerCornersPx, markerSizeCm);

    // Plausibility checks
    expect(result.ok).toBe(true);
    expect(result.validation.valid).toBe(true);
    expect(result.stats.widthCm).toBeGreaterThanOrEqual(7.5);
    expect(result.stats.widthCm).toBeLessThanOrEqual(9.5);
    expect(result.stats.heightCm).toBeGreaterThanOrEqual(7.8);
    expect(result.stats.heightCm).toBeLessThanOrEqual(9.8);
    expect(result.stats.areaCm2).toBeGreaterThanOrEqual(45);
    expect(result.stats.areaCm2).toBeLessThanOrEqual(80);
    expect(result.stats.contourPointsSimplified).toBeGreaterThanOrEqual(8);
    expect(result.stats.contourPointsSimplified).toBeLessThanOrEqual(200);

    // Every polygon point inside 0..10 cm square with 0.2 cm tolerance
    for (const [x, y] of result.polygonCm) {
      expect(x).toBeGreaterThanOrEqual(-0.2);
      expect(x).toBeLessThanOrEqual(10.2);
      expect(y).toBeGreaterThanOrEqual(-0.2);
      expect(y).toBeLessThanOrEqual(10.2);
    }
  });
});

