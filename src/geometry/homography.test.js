// src/geometry/homography.test.js
// Tests for perspective transformation (homography) and scale calibration

import { describe, it, expect } from 'vitest';
const {
  solveLinearSystem,
  computeHomography,
  applyHomography,
  applyHomographyToPolygon,
  invertHomography,
  computeScaleInfo,
  reprojectionErrorCm,
} = require('./homography');
const { area, dimensions } = require('./polygon');

describe('Homography and Scale Calibration', () => {
  it('1. Pure scaling: marker 10 cm drawn as 200x200 square maps correctly and has near zero skew', () => {
    const srcPixels = [
      [100, 100],
      [300, 100],
      [300, 300],
      [100, 300],
    ];
    const dstPoints = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ];

    const H = computeHomography(srcPixels, dstPoints);

    // Pixel (100, 100) maps to (0, 0)
    const p1 = applyHomography(H, [100, 100]);
    expect(p1[0]).toBeCloseTo(0, 6);
    expect(p1[1]).toBeCloseTo(0, 6);

    // Pixel (300, 300) maps to (10, 10)
    const p2 = applyHomography(H, [300, 300]);
    expect(p2[0]).toBeCloseTo(10, 6);
    expect(p2[1]).toBeCloseTo(10, 6);

    // Pixel (200, 200) maps to (5, 5)
    const pCenter = applyHomography(H, [200, 200]);
    expect(pCenter[0]).toBeCloseTo(5, 6);
    expect(pCenter[1]).toBeCloseTo(5, 6);

    // Check computeScaleInfo
    const scaleInfo = computeScaleInfo(srcPixels, 10);
    expect(scaleInfo.pxPerCmApprox).toBeCloseTo(20, 6);
    expect(scaleInfo.perspectiveSkew).toBeCloseTo(0, 6);
  });

  it('2. Translation and rotation: a marker rotated 90 degrees maps corners consistently', () => {
    // Marker corners rotated 90 deg clockwise in image coordinates
    // Top-left at (300, 100), top-right at (300, 300), bottom-right at (100, 300), bottom-left at (100, 100)
    const srcPixels = [
      [300, 100],
      [300, 300],
      [100, 300],
      [100, 100],
    ];
    const dstPoints = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ];

    const H = computeHomography(srcPixels, dstPoints);

    const tl = applyHomography(H, [300, 100]);
    expect(tl[0]).toBeCloseTo(0, 6);
    expect(tl[1]).toBeCloseTo(0, 6);

    const tr = applyHomography(H, [300, 300]);
    expect(tr[0]).toBeCloseTo(10, 6);
    expect(tr[1]).toBeCloseTo(0, 6);

    const br = applyHomography(H, [100, 300]);
    expect(br[0]).toBeCloseTo(10, 6);
    expect(br[1]).toBeCloseTo(10, 6);

    const bl = applyHomography(H, [100, 100]);
    expect(bl[0]).toBeCloseTo(0, 6);
    expect(bl[1]).toBeCloseTo(10, 6);

    const center = applyHomography(H, [200, 200]);
    expect(center[0]).toBeCloseTo(5, 6);
    expect(center[1]).toBeCloseTo(5, 6);
  });

  it('3. Perspective (tilted camera): maps quadrilateral corners to targets with < 1e-6 error, centroid inside square, skew > 0.05', () => {
    const src = [
      [120, 80],
      [380, 100],
      [420, 340],
      [90, 320],
    ];
    const dst = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ];

    const H = computeHomography(src, dst);

    // Check all 4 corners map back to cm targets with error < 1e-6 cm
    for (let i = 0; i < 4; i++) {
      const mapped = applyHomography(H, src[i]);
      expect(mapped[0]).toBeCloseTo(dst[i][0], 6);
      expect(mapped[1]).toBeCloseTo(dst[i][1], 6);
    }

    // Reprojection error is about 0 (< 1e-6)
    const maxReprojErr = reprojectionErrorCm(H, src, dst);
    expect(maxReprojErr).toBeLessThan(1e-6);

    // Pixel centroid of quadrilateral
    const centroidX = (120 + 380 + 420 + 90) / 4; // 252.5
    const centroidY = (80 + 100 + 340 + 320) / 4;  // 210
    const mappedCentroid = applyHomography(H, [centroidX, centroidY]);

    // Must map inside the 10 cm x 10 cm square (between 0 and 10 on both axes)
    expect(mappedCentroid[0]).toBeGreaterThan(0);
    expect(mappedCentroid[0]).toBeLessThan(10);
    expect(mappedCentroid[1]).toBeGreaterThan(0);
    expect(mappedCentroid[1]).toBeLessThan(10);

    // Perspective skew > 0.05
    const scaleInfo = computeScaleInfo(src, 10);
    expect(scaleInfo.perspectiveSkew).toBeGreaterThan(0.05);
  });

  it('4. Round trip: invertHomography takes (5,5) cm back to pixel and forward again to (5,5)', () => {
    const src = [
      [120, 80],
      [380, 100],
      [420, 340],
      [90, 320],
    ];
    const dst = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ];

    const H = computeHomography(src, dst);
    const invH = invertHomography(H);

    // Map (5, 5) cm back to pixel coordinates
    const pixelPoint = applyHomography(invH, [5, 5]);

    // Map pixel point forward to cm
    const cmPoint = applyHomography(H, pixelPoint);

    expect(cmPoint[0]).toBeCloseTo(5, 6);
    expect(cmPoint[1]).toBeCloseTo(5, 6);
  });

  it('5. Real-use example: marker calibrates fabric polygon to 30 cm x 25 cm with area 750 cm2', () => {
    const markerPixels = [
      [0, 0],
      [200, 0],
      [200, 200],
      [0, 200],
    ];
    const markerDstCm = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ];
    const H = computeHomography(markerPixels, markerDstCm);

    const fabricPixels = [
      [400, 0],
      [1000, 0],
      [1000, 500],
      [400, 500],
    ];

    const fabricCm = applyHomographyToPolygon(H, fabricPixels);

    const minX = Math.min(...fabricCm.map((p) => p[0]));
    const maxX = Math.max(...fabricCm.map((p) => p[0]));
    const minY = Math.min(...fabricCm.map((p) => p[1]));
    const maxY = Math.max(...fabricCm.map((p) => p[1]));

    const widthCm = maxX - minX;
    const heightCm = maxY - minY;

    expect(widthCm).toBeCloseTo(30, 6);
    expect(heightCm).toBeCloseTo(25, 6);
    expect(area(fabricCm)).toBeCloseTo(750, 6);
  });

  it('6. Degenerate input: three collinear points, duplicates, fewer than 4 points, and NaN throw', () => {
    const dst = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ];

    // Three collinear source points
    expect(() =>
      computeHomography(
        [
          [0, 0],
          [5, 0],
          [10, 0],
          [0, 10],
        ],
        dst
      )
    ).toThrow(/collinear|degenerate|singular/i);

    // Duplicate source points
    expect(() =>
      computeHomography(
        [
          [0, 0],
          [0, 0],
          [10, 10],
          [0, 10],
        ],
        dst
      )
    ).toThrow(/duplicate|degenerate|singular/i);

    // Fewer than 4 points
    expect(() =>
      computeHomography(
        [
          [0, 0],
          [10, 0],
          [0, 10],
        ],
        dst
      )
    ).toThrow(/4 points/i);

    // NaN in points
    expect(() =>
      computeHomography(
        [
          [0, 0],
          [NaN, 0],
          [10, 10],
          [0, 10],
        ],
        dst
      )
    ).toThrow(/finite|nan/i);
  });

  it('7. applyHomography on a point that maps to infinity throws', () => {
    // Matrix with zero last row: w = 0*x + 0*y + 0 = 0
    const H = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ];

    expect(() => applyHomography(H, [10, 20])).toThrow(/maps to infinity/i);
  });
});

