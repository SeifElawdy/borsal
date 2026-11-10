// src/geometry/polygon.js
// Pure geometric functions for 2D polygon validation and calculations in centimeters

const EPSILON = 1e-9;

/**
 * Calculates the signed area of a polygon using the Shoelace formula.
 * Returns a positive value for counter-clockwise polygons, negative for clockwise.
 *
 * @param {Array<[number, number]>} points
 * @returns {number}
 */
function signedArea(points) {
  if (!Array.isArray(points) || points.length < 3) return 0;
  let sum = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % n];
    sum += x1 * y2 - x2 * y1;
  }
  return sum / 2;
}

/**
 * Calculates the absolute area of a polygon.
 *
 * @param {Array<[number, number]>} points
 * @returns {number}
 */
function area(points) {
  return Math.abs(signedArea(points));
}

/**
 * Computes the axis-aligned bounding box of a polygon.
 *
 * @param {Array<[number, number]>} points
 * @returns {{ minX: number, minY: number, maxX: number, maxY: number }}
 */
function boundingBox(points) {
  if (!Array.isArray(points) || points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  let minX = points[0][0];
  let maxX = points[0][0];
  let minY = points[0][1];
  let maxY = points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [x, y] = points[i];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
}

/**
 * Computes width and height in centimeters from the bounding box.
 *
 * @param {Array<[number, number]>} points
 * @returns {{ widthCm: number, heightCm: number }}
 */
function dimensions(points) {
  const { minX, minY, maxX, maxY } = boundingBox(points);
  return {
    widthCm: maxX - minX,
    heightCm: maxY - minY,
  };
}

/**
 * Tests whether a point is inside a polygon using ray casting (even-odd rule).
 *
 * @param {[number, number]} point
 * @param {Array<[number, number]>} polygon
 * @returns {boolean}
 */
function pointInPolygon(point, polygon) {
  if (!Array.isArray(polygon) || polygon.length < 3) return false;
  const [px, py] = point;
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersect =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Helper to check if point q lies on line segment pr (assuming p, q, r are collinear).
 */
function onSegment(p, q, r) {
  return (
    q[0] <= Math.max(p[0], r[0]) + EPSILON &&
    q[0] >= Math.min(p[0], r[0]) - EPSILON &&
    q[1] <= Math.max(p[1], r[1]) + EPSILON &&
    q[1] >= Math.min(p[1], r[1]) - EPSILON
  );
}

/**
 * Helper to find orientation of ordered triplet (p, q, r):
 * 0 -> Collinear
 * 1 -> Clockwise
 * 2 -> Counter-clockwise
 */
function orientation(p, q, r) {
  const val = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]);
  if (Math.abs(val) < EPSILON) return 0;
  return val > 0 ? 1 : 2;
}

/**
 * Checks if two line segments ab and cd intersect (including collinear overlap and touching endpoints).
 *
 * @param {[number, number]} a
 * @param {[number, number]} b
 * @param {[number, number]} c
 * @param {[number, number]} d
 * @returns {boolean}
 */
function segmentsIntersect(a, b, c, d) {
  const o1 = orientation(a, b, c);
  const o2 = orientation(a, b, d);
  const o3 = orientation(c, d, a);
  const o4 = orientation(c, d, b);

  // General straddling case
  if (o1 !== o2 && o3 !== o4) {
    return true;
  }

  // Collinear or touching cases
  if (o1 === 0 && onSegment(a, c, b)) return true;
  if (o2 === 0 && onSegment(a, d, b)) return true;
  if (o3 === 0 && onSegment(c, a, d)) return true;
  if (o4 === 0 && onSegment(c, b, d)) return true;

  return false;
}

/**
 * Checks if a polygon has any self-intersecting non-adjacent edges.
 * Adjacent edges share a vertex and do not count as intersecting.
 *
 * @param {Array<[number, number]>} points
 * @returns {boolean}
 */
function hasSelfIntersection(points) {
  if (!Array.isArray(points)) return false;
  const n = points.length;
  if (n < 4) return false;

  for (let i = 0; i < n; i++) {
    const a = points[i];
    const b = points[(i + 1) % n];

    for (let j = i + 1; j < n; j++) {
      // Skip adjacent edges: (i, i+1) and wrap-around (0, n-1)
      if (Math.abs(i - j) <= 1 || (i === 0 && j === n - 1)) {
        continue;
      }

      const c = points[j];
      const d = points[(j + 1) % n];

      if (segmentsIntersect(a, b, c, d)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Validates a polygon against geometric and sanity rules. Collects ALL errors.
 * Rules:
 * 1. Array of at least 3 points.
 * 2. Every point is [number, number] with finite values (no NaN or Infinity).
 * 3. No two consecutive points are identical (including last and first).
 * 4. Area must be greater than 0.01 cm2.
 * 5. No self-intersection.
 * 6. All coordinates must be between -1000 and 1000.
 *
 * @param {Array<[number, number]>} points
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validatePolygon(points) {
  const errors = [];

  if (!Array.isArray(points)) {
    return { valid: false, errors: ['Polygon must be an array of points'] };
  }

  // Rule 1: At least 3 points
  if (points.length < 3) {
    errors.push('Polygon must have at least 3 points');
  }

  // Rule 2 & 6: Point structure, finite numbers, and [-1000, 1000] range
  let hasInvalidPoint = false;
  let hasOutOfRange = false;

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    if (
      !Array.isArray(pt) ||
      pt.length !== 2 ||
      typeof pt[0] !== 'number' ||
      typeof pt[1] !== 'number' ||
      !Number.isFinite(pt[0]) ||
      !Number.isFinite(pt[1])
    ) {
      hasInvalidPoint = true;
    } else {
      if (pt[0] < -1000 || pt[0] > 1000 || pt[1] < -1000 || pt[1] > 1000) {
        hasOutOfRange = true;
      }
    }
  }

  if (hasInvalidPoint) {
    errors.push('Every point must be [number, number] with finite values (no NaN or Infinity)');
  }
  if (hasOutOfRange) {
    errors.push('All coordinates must be between -1000 and 1000');
  }

  // Rule 3: No two consecutive points identical (last and first are consecutive too)
  if (!hasInvalidPoint && points.length >= 2) {
    let hasDuplicate = false;
    const n = points.length;
    for (let i = 0; i < n; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % n];
      if (Math.abs(p1[0] - p2[0]) < EPSILON && Math.abs(p1[1] - p2[1]) < EPSILON) {
        hasDuplicate = true;
        break;
      }
    }
    if (hasDuplicate) {
      errors.push('Consecutive points must not be identical (including last and first)');
    }
  }

  // Rule 5: No self-intersection (checked before area check to prioritize structural invalidity)
  let isSelfIntersecting = false;
  if (!hasInvalidPoint && points.length >= 4) {
    if (hasSelfIntersection(points)) {
      isSelfIntersecting = true;
      errors.push('Polygon has self-intersection');
    }
  }

  // Rule 4: Area > 0.01 cm2
  // Only evaluate area if not self-intersecting, preventing misleading zero-area errors for shapes like bow-ties
  if (!hasInvalidPoint && !isSelfIntersecting && points.length >= 3) {
    const polyArea = area(points);
    if (polyArea <= 0.01) {
      errors.push('Area must be greater than 0.01 cm2');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Returns a copy of the polygon points ordered counter-clockwise.
 *
 * @param {Array<[number, number]>} points
 * @returns {Array<[number, number]>}
 */
function normalizeToCounterClockwise(points) {
  if (!Array.isArray(points)) return [];
  const copy = points.map(p => [p[0], p[1]]);
  if (signedArea(copy) < 0) {
    copy.reverse();
  }
  return copy;
}

/**
 * Validates an outer polygon and its holes.
 * Checks outer and hole validity, hole vertices inside outer, and hole edges not intersecting outer edges.
 *
 * @param {Array<[number, number]>} outer
 * @param {Array<Array<[number, number]>>} [holes=[]]
 * @returns {{ valid: boolean, errors: string[], netAreaCm2?: number }}
 */
function validateWithHoles(outer, holes = []) {
  const errors = [];

  // Validate outer polygon
  const outerValidation = validatePolygon(outer);
  if (!outerValidation.valid) {
    errors.push(...outerValidation.errors);
  }

  const safeHoles = Array.isArray(holes) ? holes : [];

  safeHoles.forEach((hole, hIdx) => {
    const holeValidation = validatePolygon(hole);
    if (!holeValidation.valid) {
      holeValidation.errors.forEach(err => {
        errors.push(`hole ${hIdx}: ${err}`);
      });
    }

    if (Array.isArray(hole) && Array.isArray(outer)) {
      // Check that every vertex of the hole is inside the outer polygon
      let hasVertexOutside = false;
      for (const vertex of hole) {
        if (Array.isArray(vertex) && vertex.length === 2 && Number.isFinite(vertex[0]) && Number.isFinite(vertex[1])) {
          if (!pointInPolygon(vertex, outer)) {
            hasVertexOutside = true;
            break;
          }
        }
      }
      if (hasVertexOutside) {
        errors.push(`hole ${hIdx}: vertex is outside outer polygon`);
      }

      // Check that no hole edge intersects an outer edge
      let edgeIntersects = false;
      const nHole = hole.length;
      const nOuter = outer.length;
      if (nHole >= 2 && nOuter >= 2) {
        for (let i = 0; i < nHole; i++) {
          const hA = hole[i];
          const hB = hole[(i + 1) % nHole];
          for (let j = 0; j < nOuter; j++) {
            const oA = outer[j];
            const oB = outer[(j + 1) % nOuter];
            if (segmentsIntersect(hA, hB, oA, oB)) {
              edgeIntersects = true;
              break;
            }
          }
          if (edgeIntersects) break;
        }
      }
      if (edgeIntersects) {
        errors.push(`hole ${hIdx}: edge intersects outer polygon edge`);
      }
    }
  });

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const outerArea = area(outer);
  let totalHoleArea = 0;
  for (const hole of safeHoles) {
    totalHoleArea += area(hole);
  }
  const netAreaCm2 = outerArea - totalHoleArea;

  return {
    valid: true,
    errors: [],
    netAreaCm2,
  };
}

module.exports = {
  signedArea,
  area,
  boundingBox,
  dimensions,
  pointInPolygon,
  segmentsIntersect,
  hasSelfIntersection,
  validatePolygon,
  normalizeToCounterClockwise,
  validateWithHoles,
};

