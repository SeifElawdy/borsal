// src/vision/extractContour.js
// Image-based fabric contour extraction and calibration using OpenCV.js and Sharp
//
// INPUT CONVENTIONS & ASSUMPTIONS:
// - Image coordinates are pixels, origin top-left, y pointing down.
// - The marker is a square of known side S cm, defined by 4 corners: [top-left, top-right, bottom-right, bottom-left].
// - ASSUMPTION: The entire fabric scrap lies completely INSIDE the marker square, on a roughly
//   uniform background, with nothing else inside the square except the fabric.

const sharp = require('sharp');
const { getCV } = require('./opencv');
const { computeScaleInfo, applyHomographyToPolygon } = require('../geometry/homography');
const { area, dimensions, normalizeToCounterClockwise, validatePolygon } = require('../geometry/polygon');

/**
 * Computes the optimal binarization threshold using Otsu's method from histogram
 * built exclusively from pixels inside the region of interest (ROI).
 *
 * @param {object} gray8uMat - Grayscale 8-bit OpenCV Mat
 * @param {object} roiMaskMat - Binary 8-bit OpenCV Mat (255 inside ROI, 0 outside)
 * @returns {number} Optimal threshold integer between 0 and 255
 */
function computeOtsuThresholdROI(gray8uMat, roiMaskMat) {
  const hist = new Uint32Array(256);
  const grayData = gray8uMat.data;
  const maskData = roiMaskMat.data;
  const totalPixels = gray8uMat.rows * gray8uMat.cols;

  let totalRoiPixels = 0;
  let sumTotal = 0;

  for (let i = 0; i < totalPixels; i++) {
    if (maskData[i] > 0) {
      const val = grayData[i];
      hist[val]++;
      totalRoiPixels++;
      sumTotal += val;
    }
  }

  if (totalRoiPixels === 0) {
    return 0;
  }

  let weightB = 0;
  let sumB = 0;
  let maxVariance = -1;
  let optimalThreshold = 0;

  for (let t = 0; t < 256; t++) {
    weightB += hist[t];
    if (weightB === 0) continue;
    const weightF = totalRoiPixels - weightB;
    if (weightF === 0) break;

    sumB += t * hist[t];
    const meanB = sumB / weightB;
    const meanF = (sumTotal - sumB) / weightF;
    const diff = meanB - meanF;
    const varianceBetween = weightB * weightF * diff * diff;

    if (varianceBetween > maxVariance) {
      maxVariance = varianceBetween;
      optimalThreshold = t;
    }
  }

  return optimalThreshold;
}

/**
 * Extracts the boundary contour of a fabric scrap lying inside a known square calibration marker.
 *
 * @param {Buffer} imageBuffer - Raw image file buffer (PNG/JPEG/etc.)
 * @param {Array<[number, number]>} markerCornersPx - 4 corners [TL, TR, BR, BL] in pixel coordinates
 * @param {number} markerSizeCm - Physical side length of the marker square in centimeters
 * @param {object} [options={}] - Processing options
 * @param {number} [options.roiShrink=0.03] - Fraction to shrink marker quadrilateral toward its centroid
 * @param {number} [options.ringFraction=0.03] - Fraction of ROI size used for background sample ring
 * @param {number} [options.epsilonCm=0.05] - Tolerance for polygon simplification in centimeters
 * @returns {Promise<object>} Extraction result with coordinates, stats, validation, warnings, and debug buffers
 */
async function extractFabricContour(imageBuffer, markerCornersPx, markerSizeCm, options = {}) {
  // Argument validation
  if (!Buffer.isBuffer(imageBuffer) && !(imageBuffer instanceof Uint8Array)) {
    throw new Error('imageBuffer must be a Buffer or Uint8Array');
  }
  if (!Array.isArray(markerCornersPx) || markerCornersPx.length !== 4) {
    throw new Error('markerCornersPx must be an array of exactly 4 [x, y] points');
  }
  for (const pt of markerCornersPx) {
    if (!Array.isArray(pt) || pt.length !== 2 || typeof pt[0] !== 'number' || typeof pt[1] !== 'number' || !Number.isFinite(pt[0]) || !Number.isFinite(pt[1])) {
      throw new Error('All marker corner coordinates must be finite numbers');
    }
  }
  if (typeof markerSizeCm !== 'number' || markerSizeCm <= 0 || !Number.isFinite(markerSizeCm)) {
    throw new Error('markerSizeCm must be a positive finite number');
  }

  const cv = await getCV();
  const warnings = [];

  // Track all created OpenCV Mats for guaranteed cleanup in finally block
  const matsToDelete = [];
  function track(m) {
    if (m) matsToDelete.push(m);
    return m;
  }

  try {
    // 1. Decode image with sharp to 3-channel raw RGB
    const { data: rawRgbData, info } = await sharp(imageBuffer)
      .toColourspace('srgb')
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const width = info.width;
    const height = info.height;

    const imgMat = track(new cv.Mat(height, width, cv.CV_8UC3));
    imgMat.data.set(rawRgbData);

    // 2. Compute homography and scale info from marker corners
    const { H, pxPerCmApprox, perspectiveSkew } = computeScaleInfo(markerCornersPx, markerSizeCm);

    // 3. Region of interest (ROI): shrink marker quadrilateral toward centroid
    const roiShrink = typeof options.roiShrink === 'number' ? options.roiShrink : 0.03;
    let cx = 0;
    let cy = 0;
    for (const p of markerCornersPx) {
      cx += p[0];
      cy += p[1];
    }
    cx /= 4;
    cy /= 4;

    const factor = 1 - roiShrink;
    const roiCorners = markerCornersPx.map((p) => [cx + (p[0] - cx) * factor, cy + (p[1] - cy) * factor]);
    const flatRoi = roiCorners.flatMap((p) => [Math.round(p[0]), Math.round(p[1])]);

    const roiMask = track(cv.Mat.zeros(height, width, cv.CV_8UC1));
    const roiMatPts = track(cv.matFromArray(4, 1, cv.CV_32SC2, flatRoi));
    cv.fillConvexPoly(roiMask, roiMatPts, new cv.Scalar(255));

    // 4. Convert RGB to Lab and estimate background color from outer ring
    const labMat = track(new cv.Mat());
    cv.cvtColor(imgMat, labMat, cv.COLOR_RGB2Lab);

    const ringFraction = typeof options.ringFraction === 'number' ? options.ringFraction : 0.03;
    const innerFactor = 1 - (roiShrink + ringFraction);
    const innerCorners = markerCornersPx.map((p) => [cx + (p[0] - cx) * innerFactor, cy + (p[1] - cy) * innerFactor]);
    const flatInner = innerCorners.flatMap((p) => [Math.round(p[0]), Math.round(p[1])]);

    const innerMask = track(cv.Mat.zeros(height, width, cv.CV_8UC1));
    const innerMatPts = track(cv.matFromArray(4, 1, cv.CV_32SC2, flatInner));
    cv.fillConvexPoly(innerMask, innerMatPts, new cv.Scalar(255));

    const ringMask = track(new cv.Mat());
    cv.subtract(roiMask, innerMask, ringMask);

    // Collect Lab values inside ring mask and compute per-channel median
    const ringData = ringMask.data;
    const labData = labMat.data;
    const Ls = [];
    const As = [];
    const Bs = [];
    const totalPixels = width * height;

    for (let i = 0; i < totalPixels; i++) {
      if (ringData[i] > 0) {
        Ls.push(labData[i * 3]);
        As.push(labData[i * 3 + 1]);
        Bs.push(labData[i * 3 + 2]);
      }
    }

    if (Ls.length === 0) {
      warnings.push('ROI ring mask contains no pixels; background estimation fell back to center');
      Ls.push(128);
      As.push(128);
      Bs.push(128);
    }

    Ls.sort((a, b) => a - b);
    As.sort((a, b) => a - b);
    Bs.sort((a, b) => a - b);
    const medianL = Ls[Math.floor(Ls.length / 2)];
    const medianA = As[Math.floor(As.length / 2)];
    const medianB = Bs[Math.floor(Bs.length / 2)];
    const backgroundLab = [medianL, medianA, medianB];

    // Check if more than 5% of ring pixels are far (> 25 Euclidean Lab distance) from median
    let farRingPixels = 0;
    for (let i = 0; i < Ls.length; i++) {
      const d = Math.hypot(Ls[i] - medianL, As[i] - medianA, Bs[i] - medianB);
      if (d > 25) {
        farRingPixels++;
      }
    }
    if (Ls.length > 0 && farRingPixels / Ls.length > 0.05) {
      warnings.push('Fabric may touch the marker border or the background is not uniform');
    }

    // 5. Compute Euclidean Lab distance to background color for ROI pixels
    const distMat = track(cv.Mat.zeros(height, width, cv.CV_32FC1));
    const roiData = roiMask.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (roiData[idx] > 0) {
          const l = labData[idx * 3];
          const a = labData[idx * 3 + 1];
          const b = labData[idx * 3 + 2];
          const d = Math.hypot(l - medianL, a - medianA, b - medianB);
          distMat.floatPtr(y, x)[0] = d;
        }
      }
    }

    // Blur lightly with 5x5 Gaussian
    const blurredDist = track(new cv.Mat());
    cv.GaussianBlur(distMat, blurredDist, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);

    // Scale to 8-bit (distance 100 maps to 255 -> factor 2.55)
    const gray8u = track(new cv.Mat());
    cv.convertScaleAbs(blurredDist, gray8u, 2.55, 0);

    // Compute Otsu threshold exclusively from ROI pixels
    const optimalThreshold8u = computeOtsuThresholdROI(gray8u, roiMask);
    const thresholdUsedLab = Number((optimalThreshold8u / 2.55).toFixed(2));

    if (thresholdUsedLab < 8) {
      warnings.push('Threshold used is below 8 Lab units; fabric color is very close to background and result is unreliable');
    }

    // Apply threshold and mask to ROI
    const rawBinary = track(new cv.Mat());
    cv.threshold(gray8u, rawBinary, optimalThreshold8u, 255, cv.THRESH_BINARY);
    cv.bitwise_and(rawBinary, roiMask, rawBinary);

    // 6. Clean mask: morphological CLOSE then OPEN
    // Morphological opening intentionally removes loose frayed threads and tiny fiber spurs,
    // ensuring the extracted contour represents a conservative, physically usable cutting edge.
    let kSize = Math.round(0.12 * pxPerCmApprox);
    if (kSize < 3) kSize = 3;
    if (kSize % 2 === 0) kSize += 1;

    const kernel = track(cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(kSize, kSize)));
    const cleanedMask = track(new cv.Mat());
    cv.morphologyEx(rawBinary, cleanedMask, cv.MORPH_CLOSE, kernel);
    cv.morphologyEx(cleanedMask, cleanedMask, cv.MORPH_OPEN, kernel);
    cv.bitwise_and(cleanedMask, roiMask, cleanedMask);

    // 7. Find external contours and select the largest exceeding 1% of ROI area
    const contours = track(new cv.MatVector());
    const hierarchy = track(new cv.Mat());
    cv.findContours(cleanedMask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_NONE);

    const roiAreaPx = cv.countNonZero(roiMask);
    let largestContour = null;
    let maxArea = 0;

    for (let i = 0; i < contours.size(); i++) {
      const cnt = contours.get(i);
      const cntArea = cv.contourArea(cnt);
      if (cntArea >= roiAreaPx * 0.01 && cntArea > maxArea) {
        maxArea = cntArea;
        largestContour = cnt;
      }
    }

    // Prepare debug mask PNG
    const maskPng = await sharp(Buffer.from(cleanedMask.data), {
      raw: { width, height, channels: 1 },
    })
      .png()
      .toBuffer();

    // Prepare overlay canvas
    const overlayMat = track(imgMat.clone());
    const roiPtsVec = track(new cv.MatVector());
    roiPtsVec.push_back(roiMatPts);
    // Draw ROI quadrilateral in green [0, 255, 0]
    cv.polylines(overlayMat, roiPtsVec, true, new cv.Scalar(0, 255, 0), 2);

    if (!largestContour) {
      const overlayPng = await sharp(Buffer.from(overlayMat.data), {
        raw: { width, height, channels: 3 },
      })
        .png()
        .toBuffer();

      return {
        ok: false,
        polygonPx: [],
        polygonCm: [],
        stats: {
          widthCm: 0,
          heightCm: 0,
          areaCm2: 0,
          pxPerCmApprox: Number(pxPerCmApprox.toFixed(2)),
          perspectiveSkew: Number(perspectiveSkew.toFixed(4)),
          contourPointsRaw: 0,
          contourPointsSimplified: 0,
          thresholdUsed: thresholdUsedLab,
          backgroundLab,
        },
        validation: {
          valid: false,
          errors: ['No fabric contour found exceeding 1% of ROI area'],
        },
        warnings: [...warnings, 'No fabric contour found inside the marker ROI'],
        debug: {
          maskPng,
          overlayPng,
        },
      };
    }

    const contourPointsRaw = largestContour.rows;

    // 8. Simplify with cv.approxPolyDP preserving concave notches
    const epsilonCm = typeof options.epsilonCm === 'number' ? options.epsilonCm : 0.05;
    const epsilonPx = epsilonCm * pxPerCmApprox;
    const approx = track(new cv.Mat());
    cv.approxPolyDP(largestContour, approx, epsilonPx, true);
    const contourPointsSimplified = approx.rows;

    // Extract simplified polygon pixel points
    const polygonPx = [];
    const flatContourPts = [];
    for (let i = 0; i < approx.rows; i++) {
      const x = approx.intPtr(i, 0)[0];
      const y = approx.intPtr(i, 0)[1];
      polygonPx.push([x, y]);
      flatContourPts.push(x, y);
    }

    // Draw simplified contour in red [255, 0, 0] on overlay
    const contourMatPts = track(cv.matFromArray(approx.rows, 1, cv.CV_32SC2, flatContourPts));
    const contourPtsVec = track(new cv.MatVector());
    contourPtsVec.push_back(contourMatPts);
    cv.polylines(overlayMat, contourPtsVec, true, new cv.Scalar(255, 0, 0), 2);

    const overlayPng = await sharp(Buffer.from(overlayMat.data), {
      raw: { width, height, channels: 3 },
    })
      .png()
      .toBuffer();

    // 9. Convert simplified pixel points to cm, normalize CCW, compute dimensions/area, and validate
    const rawCm = applyHomographyToPolygon(H, polygonPx);
    const polygonCm = normalizeToCounterClockwise(rawCm);
    const dims = dimensions(polygonCm);
    const polyArea = area(polygonCm);
    const validation = validatePolygon(polygonCm);

    // 10. Check if any simplified point lies outside ROI mask or point count exceeds 300
    let hasPointOutsideRoi = false;
    for (const [x, y] of polygonPx) {
      const ix = Math.round(x);
      const iy = Math.round(y);
      if (ix < 0 || ix >= width || iy < 0 || iy >= height || roiMask.ucharPtr(iy, ix)[0] === 0) {
        hasPointOutsideRoi = true;
        break;
      }
    }
    if (hasPointOutsideRoi) {
      warnings.push('Simplified contour point lies outside the ROI mask');
    }
    if (contourPointsSimplified > 300) {
      warnings.push(`Simplified point count exceeds 300 points (${contourPointsSimplified} points)`);
    }

    return {
      ok: validation.valid,
      polygonPx,
      polygonCm,
      stats: {
        widthCm: Number(dims.widthCm.toFixed(4)),
        heightCm: Number(dims.heightCm.toFixed(4)),
        areaCm2: Number(polyArea.toFixed(4)),
        pxPerCmApprox: Number(pxPerCmApprox.toFixed(2)),
        perspectiveSkew: Number(perspectiveSkew.toFixed(4)),
        contourPointsRaw,
        contourPointsSimplified,
        thresholdUsed: thresholdUsedLab,
        backgroundLab,
      },
      validation,
      warnings,
      debug: {
        maskPng,
        overlayPng,
      },
    };
  } finally {
    // Guaranteed deletion of all allocated OpenCV Mat objects
    for (const mat of matsToDelete) {
      try {
        if (mat && typeof mat.delete === 'function') {
          mat.delete();
        }
      } catch {
        // Suppress errors during cleanup
      }
    }
  }
}

module.exports = {
  extractFabricContour,
  computeOtsuThresholdROI,
};

