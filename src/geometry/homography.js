// src/geometry/homography.js
// Pure mathematical module for 2D perspective transformation (homography) and scale calibration
// Real-world coordinates: CENTIMETERS. Image coordinates: PIXELS.

const EPSILON = 1e-12;

/**
 * Solves a linear system A * x = b for a square matrix A using Gaussian elimination with partial pivoting.
 *
 * @param {Array<Array<number>>} A - n x n matrix of coefficients
 * @param {Array<number>} b - Vector of length n
 * @returns {Array<number>} Solution vector x of length n
 * @throws {Error} If matrix is singular (pivot absolute value < 1e-12)
 */
function solveLinearSystem(A, b) {
  if (!Array.isArray(A) || !Array.isArray(b)) {
    throw new Error('A must be a 2D array and b must be a 1D array');
  }
  const n = A.length;
  if (n === 0 || b.length !== n) {
    throw new Error('Dimension mismatch between matrix A and vector b');
  }

  // Create augmented matrix [A | b] to avoid mutating inputs
  const M = new Array(n);
  for (let i = 0; i < n; i++) {
    if (!Array.isArray(A[i]) || A[i].length !== n) {
      throw new Error('Matrix A must be square');
    }
    M[i] = [...A[i], b[i]];
  }

  // Forward elimination with partial pivoting
  for (let k = 0; k < n; k++) {
    let pivotRow = k;
    let maxVal = Math.abs(M[k][k]);

    for (let i = k + 1; i < n; i++) {
      const val = Math.abs(M[i][k]);
      if (val > maxVal) {
        maxVal = val;
        pivotRow = i;
      }
    }

    if (maxVal < EPSILON) {
      throw new Error('Singular matrix');
    }

    // Swap current row with pivot row if necessary
    if (pivotRow !== k) {
      const temp = M[k];
      M[k] = M[pivotRow];
      M[pivotRow] = temp;
    }

    // Eliminate entries below pivot
    for (let i = k + 1; i < n; i++) {
      const factor = M[i][k] / M[k][k];
      for (let j = k; j <= n; j++) {
        M[i][j] -= factor * M[k][j];
      }
    }
  }

  // Back substitution
  const x = new Array(n);
  for (let i = n - 1; i >= 0; i--) {
    let sum = M[i][n];
    for (let j = i + 1; j < n; j++) {
      sum -= M[i][j] * x[j];
    }
    x[i] = sum / M[i][i];
  }

  return x;
}

/**
 * Computes a 3x3 homography matrix H such that dst ~ H * src.
 * Normalized with H[2][2] = 1.
 *
 * @param {Array<[number, number]>} srcPoints - Array of 4 [x, y] pixel coordinates
 * @param {Array<[number, number]>} dstPoints - Array of 4 [x, y] real-world coordinates in cm
 * @returns {Array<Array<number>>} 3x3 homography matrix
 * @throws {Error} If inputs are invalid or degenerate (e.g. collinear points or duplicates)
 */
function computeHomography(srcPoints, dstPoints) {
  // Validate point counts
  if (!Array.isArray(srcPoints) || srcPoints.length !== 4 || !Array.isArray(dstPoints) || dstPoints.length !== 4) {
    throw new Error('Both srcPoints and dstPoints must be arrays of exactly 4 points');
  }

  // Validate finite numeric values
  const allPoints = [...srcPoints, ...dstPoints];
  for (const pt of allPoints) {
    if (
      !Array.isArray(pt) ||
      pt.length !== 2 ||
      typeof pt[0] !== 'number' ||
      typeof pt[1] !== 'number' ||
      !Number.isFinite(pt[0]) ||
      !Number.isFinite(pt[1])
    ) {
      throw new Error('All point coordinates must be finite numbers');
    }
  }

  // Check for duplicate points in source
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      const dist = Math.hypot(srcPoints[i][0] - srcPoints[j][0], srcPoints[i][1] - srcPoints[j][1]);
      if (dist < 1e-9) {
        throw new Error('Degenerate source points: duplicate points detected');
      }
    }
  }

  // Check for 3 or more collinear points in source (area of triangle formed by any 3 points ~ 0)
  const triplets = [
    [0, 1, 2],
    [0, 1, 3],
    [0, 2, 3],
    [1, 2, 3],
  ];
  for (const [i1, i2, i3] of triplets) {
    const p1 = srcPoints[i1];
    const p2 = srcPoints[i2];
    const p3 = srcPoints[i3];
    const cross = (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0]);
    if (Math.abs(cross) < 1e-9) {
      throw new Error('Degenerate source points: three or more collinear points detected');
    }
  }

  // Build the standard 8x8 linear system for 4 point correspondences
  const A = [];
  const b = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = srcPoints[i];
    const [u, v] = dstPoints[i];

    // Row 2*i:   x*h00 + y*h01 + 1*h02 - x*u*h20 - y*u*h21 = u
    A.push([x, y, 1, 0, 0, 0, -x * u, -y * u]);
    b.push(u);

    // Row 2*i+1: x*h10 + y*h11 + 1*h12 - x*v*h20 - y*v*h21 = v
    A.push([0, 0, 0, x, y, 1, -x * v, -y * v]);
    b.push(v);
  }

  try {
    const h = solveLinearSystem(A, b);
    return [
      [h[0], h[1], h[2]],
      [h[3], h[4], h[5]],
      [h[6], h[7], 1],
    ];
  } catch (err) {
    throw new Error(`Degenerate points: ${err.message}`);
  }
}

/**
 * Applies a 3x3 homography matrix to a 2D point [x, y].
 *
 * @param {Array<Array<number>>} H - 3x3 homography matrix
 * @param {[number, number]} point - Input [x, y] coordinates
 * @returns {[number, number]} Transformed [x', y'] coordinates
 * @throws {Error} If the point maps to infinity (|w| < 1e-12)
 */
function applyHomography(H, [x, y]) {
  const w = H[2][0] * x + H[2][1] * y + H[2][2];
  if (Math.abs(w) < EPSILON) {
    throw new Error('Point maps to infinity');
  }

  const mappedX = (H[0][0] * x + H[0][1] * y + H[0][2]) / w;
  const mappedY = (H[1][0] * x + H[1][1] * y + H[1][2]) / w;

  return [mappedX, mappedY];
}

/**
 * Maps an array of 2D polygon vertices using a homography matrix.
 *
 * @param {Array<Array<number>>} H - 3x3 homography matrix
 * @param {Array<[number, number]>} points - Array of [x, y] coordinates
 * @returns {Array<[number, number]>} Array of transformed [x', y'] coordinates
 */
function applyHomographyToPolygon(H, points) {
  if (!Array.isArray(points)) return [];
  return points.map((pt) => applyHomography(H, pt));
}

/**
 * Computes the 3x3 inverse of a homography matrix using the adjugate/determinant formula.
 * Normalizes so result[2][2] = 1 if it is non-zero.
 *
 * @param {Array<Array<number>>} H - 3x3 homography matrix
 * @returns {Array<Array<number>>} Inverted 3x3 homography matrix
 * @throws {Error} If matrix determinant is near zero (|det| < 1e-12)
 */
function invertHomography(H) {
  // Compute cofactors
  const c00 = H[1][1] * H[2][2] - H[1][2] * H[2][1];
  const c01 = H[1][2] * H[2][0] - H[1][0] * H[2][2];
  const c02 = H[1][0] * H[2][1] - H[1][1] * H[2][0];

  const c10 = H[0][2] * H[2][1] - H[0][1] * H[2][2];
  const c11 = H[0][0] * H[2][2] - H[0][2] * H[2][0];
  const c12 = H[0][1] * H[2][0] - H[0][0] * H[2][1];

  const c20 = H[0][1] * H[1][2] - H[0][2] * H[1][1];
  const c21 = H[0][2] * H[1][0] - H[0][0] * H[1][2];
  const c22 = H[0][0] * H[1][1] - H[0][1] * H[1][0];

  const det = H[0][0] * c00 + H[0][1] * c01 + H[0][2] * c02;
  if (Math.abs(det) < EPSILON) {
    throw new Error('Matrix is singular (determinant is near zero)');
  }

  // Inverted matrix via transposed cofactor matrix divided by determinant
  const inv = [
    [c00 / det, c10 / det, c20 / det],
    [c01 / det, c11 / det, c21 / det],
    [c02 / det, c12 / det, c22 / det],
  ];

  // Normalize so result[2][2] = 1 if non-zero
  if (Math.abs(inv[2][2]) > EPSILON) {
    const scale = inv[2][2];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        inv[r][c] /= scale;
      }
    }
  }

  return inv;
}

/**
 * Computes scale calibration and homography for a known square marker.
 *
 * @param {Array<[number, number]>} srcPixels - 4 corner pixels: [top-left, top-right, bottom-right, bottom-left]
 * @param {number} markerSizeCm - Physical side length of square marker in centimeters
 * @returns {{ H: Array<Array<number>>, pxPerCmApprox: number, perspectiveSkew: number }}
 */
function computeScaleInfo(srcPixels, markerSizeCm) {
  if (typeof markerSizeCm !== 'number' || markerSizeCm <= 0) {
    throw new Error('markerSizeCm must be a positive number');
  }

  const S = markerSizeCm;
  // Destination coordinates matching top-left, top-right, bottom-right, bottom-left in cm
  const dstPoints = [
    [0, 0],
    [S, 0],
    [S, S],
    [0, S],
  ];

  const H = computeHomography(srcPixels, dstPoints);

  // Calculate pixel lengths of the 4 outer sides: top, right, bottom, left
  const s0 = Math.hypot(srcPixels[1][0] - srcPixels[0][0], srcPixels[1][1] - srcPixels[0][1]);
  const s1 = Math.hypot(srcPixels[2][0] - srcPixels[1][0], srcPixels[2][1] - srcPixels[1][1]);
  const s2 = Math.hypot(srcPixels[3][0] - srcPixels[2][0], srcPixels[3][1] - srcPixels[2][1]);
  const s3 = Math.hypot(srcPixels[0][0] - srcPixels[3][0], srcPixels[0][1] - srcPixels[3][1]);

  const avgSide = (s0 + s1 + s2 + s3) / 4;
  const pxPerCmApprox = avgSide / S;

  const minSide = Math.min(s0, s1, s2, s3);
  const maxSide = Math.max(s0, s1, s2, s3);
  const perspectiveSkew = avgSide > 0 ? (maxSide - minSide) / avgSide : 0;

  return {
    H,
    pxPerCmApprox,
    perspectiveSkew,
  };
}

/**
 * Calculates the maximum reprojection error between mapped source points and destination points in cm.
 *
 * @param {Array<Array<number>>} H - 3x3 homography matrix
 * @param {Array<[number, number]>} srcPoints - Source points
 * @param {Array<[number, number]>} dstPoints - Target points
 * @returns {number} Maximum Euclidean error distance in centimeters
 */
function reprojectionErrorCm(H, srcPoints, dstPoints) {
  let maxError = 0;
  for (let i = 0; i < srcPoints.length; i++) {
    const mapped = applyHomography(H, srcPoints[i]);
    const err = Math.hypot(mapped[0] - dstPoints[i][0], mapped[1] - dstPoints[i][1]);
    if (err > maxError) {
      maxError = err;
    }
  }
  return maxError;
}

module.exports = {
  solveLinearSystem,
  computeHomography,
  applyHomography,
  applyHomographyToPolygon,
  invertHomography,
  computeScaleInfo,
  reprojectionErrorCm,
};

