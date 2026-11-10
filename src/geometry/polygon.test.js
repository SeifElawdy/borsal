// src/geometry/polygon.test.js
// Tests for polygon geometric calculations and validations

import { describe, it, expect } from 'vitest';
const {
  signedArea,
  area,
  boundingBox,
  dimensions,
  pointInPolygon,
  validatePolygon,
  normalizeToCounterClockwise,
  validateWithHoles,
} = require('./polygon');

describe('Polygon geometry and validation', () => {
  it('Rectangle [[0,0],[20,0],[20,30],[0,30]]: area 600, width 20, height 30, valid', () => {
    const rect = [
      [0, 0],
      [20, 0],
      [20, 30],
      [0, 30],
    ];
    expect(area(rect)).toBeCloseTo(600);
    const dim = dimensions(rect);
    expect(dim.widthCm).toBeCloseTo(20);
    expect(dim.heightCm).toBeCloseTo(30);
    const validation = validatePolygon(rect);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('Triangle [[0,0],[10,0],[0,10]]: area 50, valid', () => {
    const tri = [
      [0, 0],
      [10, 0],
      [0, 10],
    ];
    expect(area(tri)).toBeCloseTo(50);
    const validation = validatePolygon(tri);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('L-shape (concave) [[0,0],[20,0],[20,10],[10,10],[10,30],[0,30]]: area 400, valid, bounding box 20 x 30', () => {
    const lShape = [
      [0, 0],
      [20, 0],
      [20, 10],
      [10, 10],
      [10, 30],
      [0, 30],
    ];
    expect(area(lShape)).toBeCloseTo(400);
    const bbox = boundingBox(lShape);
    expect(bbox.minX).toBeCloseTo(0);
    expect(bbox.minY).toBeCloseTo(0);
    expect(bbox.maxX).toBeCloseTo(20);
    expect(bbox.maxY).toBeCloseTo(30);
    const dim = dimensions(lShape);
    expect(dim.widthCm).toBeCloseTo(20);
    expect(dim.heightCm).toBeCloseTo(30);
    const validation = validatePolygon(lShape);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('Bow-tie (self-intersecting) [[0,0],[10,10],[10,0],[0,10]]: invalid, error mentions self-intersection', () => {
    const bowTie = [
      [0, 0],
      [10, 10],
      [10, 0],
      [0, 10],
    ];
    const validation = validatePolygon(bowTie);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((err) => /self-intersection/i.test(err))).toBe(true);
    expect(validation.errors.some((err) => /area/i.test(err))).toBe(false);
  });

  it('Edge case 1: Non-adjacent collinear edges that overlap are rejected as a self-intersection', () => {
    // Edge 0 connects [0, 0] to [20, 0] along y=0.
    // Edge 4 connects [15, 0] to [5, 0] along y=0, overlapping edge 0.
    const overlappingCollinear = [
      [0, 0],
      [20, 0],
      [20, 20],
      [15, 20],
      [15, 0],
      [5, 0],
      [5, 20],
      [0, 20],
    ];
    const validation = validatePolygon(overlappingCollinear);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((err) => /self-intersection/i.test(err))).toBe(true);
  });

  it('Edge case 2: A non-adjacent edge touching another edge\'s vertex is rejected as a self-intersection, while normal adjacent edges remain valid', () => {
    // Non-adjacent edge 0 ([0, 0] -> [20, 0]) touches vertex p3 [10, 0] shared by non-adjacent edges 2 and 3
    const touchingVertexPoly = [
      [0, 0],
      [20, 0],
      [20, 20],
      [10, 0],
      [0, 20],
    ];
    const validation = validatePolygon(touchingVertexPoly);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((err) => /self-intersection/i.test(err))).toBe(true);

    // Normal polygon where adjacent edges only touch at their shared vertices must remain valid
    const normalAdjacent = [
      [0, 0],
      [20, 0],
      [20, 20],
      [10, 10],
      [0, 20],
    ];
    const normalValidation = validatePolygon(normalAdjacent);
    expect(normalValidation.valid).toBe(true);
    expect(normalValidation.errors).toHaveLength(0);
  });

  it('Edge case 3: A hole touching the outer polygon boundary is rejected as invalid geometry, even if touching at only one point', () => {
    const outer = [
      [0, 0],
      [20, 0],
      [20, 30],
      [0, 30],
    ];
    // Hole touches outer bottom edge at exactly one point [5, 0]
    const holeTouchingAtOnePoint = [
      [5, 0],
      [10, 5],
      [5, 10],
    ];
    const res = validateWithHoles(outer, [holeTouchingAtOnePoint]);
    expect(res.valid).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
  });

  it('Collinear points [[0,0],[10,0],[20,0]]: invalid because of zero area', () => {
    const collinear = [
      [0, 0],
      [10, 0],
      [20, 0],
    ];
    const validation = validatePolygon(collinear);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((err) => /area/i.test(err))).toBe(true);
  });

  it('Fewer than 3 points: invalid', () => {
    const twoPoints = [
      [0, 0],
      [10, 0],
    ];
    const validation = validatePolygon(twoPoints);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((err) => /at least 3 points/i.test(err))).toBe(true);
  });

  it('A point containing NaN: invalid', () => {
    const nanPolygon = [
      [0, 0],
      [NaN, 10],
      [10, 10],
    ];
    const validation = validatePolygon(nanPolygon);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((err) => /finite|nan/i.test(err))).toBe(true);
  });

  it('Duplicate consecutive points: invalid', () => {
    const dupPolygon = [
      [0, 0],
      [10, 0],
      [10, 0],
      [0, 10],
    ];
    const validation = validatePolygon(dupPolygon);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((err) => /consecutive/i.test(err))).toBe(true);
  });

  it('Clockwise rectangle: signedArea is negative, and normalizeToCounterClockwise makes it positive', () => {
    const cwRect = [
      [0, 0],
      [0, 30],
      [20, 30],
      [20, 0],
    ];
    const sAreaBefore = signedArea(cwRect);
    expect(sAreaBefore).toBeLessThan(0);
    expect(sAreaBefore).toBeCloseTo(-600);

    const ccwRect = normalizeToCounterClockwise(cwRect);
    const sAreaAfter = signedArea(ccwRect);
    expect(sAreaAfter).toBeGreaterThan(0);
    expect(sAreaAfter).toBeCloseTo(600);
  });

  it('Rectangle with a valid hole [[5,5],[10,5],[10,10],[5,10]] inside [[0,0],[20,0],[20,30],[0,30]]: valid, netAreaCm2 = 600 - 25 = 575', () => {
    const outer = [
      [0, 0],
      [20, 0],
      [20, 30],
      [0, 30],
    ];
    const hole = [
      [5, 5],
      [10, 5],
      [10, 10],
      [5, 10],
    ];
    const res = validateWithHoles(outer, [hole]);
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
    expect(res.netAreaCm2).toBeCloseTo(575);
  });

  it('Hole outside the outer polygon: invalid', () => {
    const outer = [
      [0, 0],
      [20, 0],
      [20, 30],
      [0, 30],
    ];
    const hole = [
      [25, 25],
      [35, 25],
      [35, 35],
      [25, 35],
    ];
    const res = validateWithHoles(outer, [hole]);
    expect(res.valid).toBe(false);
    expect(res.errors.some((err) => err.startsWith('hole 0:'))).toBe(true);
  });

  it('Hole crossing the outer edge: invalid', () => {
    const outer = [
      [0, 0],
      [20, 0],
      [20, 30],
      [0, 30],
    ];
    const hole = [
      [15, 15],
      [25, 15],
      [25, 25],
      [15, 25],
    ];
    const res = validateWithHoles(outer, [hole]);
    expect(res.valid).toBe(false);
    expect(res.errors.some((err) => err.startsWith('hole 0:'))).toBe(true);
  });

  it('pointInPolygon: one point inside the L-shape, one in its missing notch (outside), one far away', () => {
    const lShape = [
      [0, 0],
      [20, 0],
      [20, 10],
      [10, 10],
      [10, 30],
      [0, 30],
    ];
    // Point inside the lower section
    const insidePoint = [5, 5];
    expect(pointInPolygon(insidePoint, lShape)).toBe(true);

    // Point in the missing top-right notch
    const notchPoint = [15, 20];
    expect(pointInPolygon(notchPoint, lShape)).toBe(false);

    // Point far away
    const farPoint = [100, 100];
    expect(pointInPolygon(farPoint, lShape)).toBe(false);
  });
});
