// src/routes/fabrics.js
// Express router for fabric piece operations

const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');

const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const sharp = require('sharp');
const { z } = require('zod');

const FabricPiece = require('../models/FabricPiece');
const { extractFabricContour } = require('../vision/extractContour');
// Reuse the tested offline measurement implementation; no CLI/filesystem output is invoked.
const { measurePhoto } = require('../../experiments/automatic-calibration/measurement');
const { presetProfile } = require('../../experiments/automatic-calibration/mat');
const {
  area,
  dimensions,
  normalizeToCounterClockwise,
  validateWithHoles,
} = require('../geometry/polygon');

const router = express.Router();

// ─── Multer configuration ───────────────────────────────────────────────────
// Use memory storage so we can inspect magic bytes before saving.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter(_req, file, cb) {
    // First check MIME type declared by client
    if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
      return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'photo'));
    }
    cb(null, true);
  },
});

/**
 * Verify real file format from magic bytes.
 * PNG: starts with 89 50 4E 47
 * JPEG: starts with FF D8 FF
 * Returns 'png', 'jpeg', or null.
 */
function detectImageType(buffer) {
  if (buffer.length >= 4 &&
      buffer[0] === 0x89 && buffer[1] === 0x50 &&
      buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'png';
  }
  if (buffer.length >= 3 &&
      buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'jpeg';
  }
  return null;
}

// ─── Zod schemas ────────────────────────────────────────────────────────────

// TS-002: manual creation is retained for development and existing tests only.
const metadataShape = {
  name: z.string().trim().min(1, 'Name must be at least 1 character').max(100),
  fabricType: z.string().trim().max(50).optional(),
  massGrams: z.number().finite().min(0).optional(),
  grainDirectionDeg: z.number().finite().min(0).lt(180).optional(),
};
const createFabricPieceSchema = z.object(metadataShape).strict();
const optionalMultipartNumber = (schema) => z.preprocess(
  (value) => typeof value === 'string'
    ? (value.trim() === '' ? undefined : Number(value)) : value,
  schema.optional()
);
// TS-001: legacy developer-only manual calibration; preset registration is preferred.
const calibrationShape = {
  markerCornersPx: z.string().min(1, 'markerCornersPx is required'),
  markerSizeCm: optionalMultipartNumber(z.number().finite().min(1).max(100))
    .refine((value) => value !== undefined, 'markerSizeCm is required'),
};
const fromPhotoSchema = z.object({
  ...metadataShape,
  fabricType: z.preprocess(
    (value) => typeof value === 'string' && value.trim() === '' ? undefined : value,
    metadataShape.fabricType
  ),
  massGrams: optionalMultipartNumber(z.number().finite().min(0)),
  grainDirectionDeg: optionalMultipartNumber(z.number().finite().min(0).lt(180)),
  matPreset: z.enum(['a4', 'large']).optional(),
  markerCornersPx: calibrationShape.markerCornersPx.optional(),
  markerSizeCm: calibrationShape.markerSizeCm.optional(),
}).strict().superRefine((value, ctx) => {
  if (value.matPreset) {
    if (value.markerCornersPx !== undefined || value.markerSizeCm !== undefined)
      ctx.addIssue({ code: 'custom', message: 'Use matPreset OR legacy developer-only marker inputs, not both' });
  } else if (value.markerCornersPx === undefined || value.markerSizeCm === undefined) {
    ctx.addIssue({ code: 'custom', message: 'matPreset (a4 or large) is required; manual marker inputs are legacy/dev-only' });
  }
});
const calibrationSchema = z.object(calibrationShape).strict();
const putGeometrySchema = z.object({
  polygonCm: z.array(z.tuple([z.number(), z.number()])),
  holes: z.array(z.array(z.tuple([z.number(), z.number()]))).optional().default([]),
}).strict();
const confirmGeometrySchema = putGeometrySchema.extend({
  source: z.enum(['suggested', 'manual']),
  basedOnAnalysisId: z.string().optional(),
  expectedGeometryVersion: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).optional(),
});

// Shared calibration checks for both photo endpoints.
function isConvexQuad(pts) {
  let sign = 0;
  for (let i = 0; i < 4; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % 4];
    const c = pts[(i + 2) % 4];
    const cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    if (cross === 0) return false;
    const current = Math.sign(cross);
    if (sign && current !== sign) return false;
    sign = current;
  }
  return true;
}

function quadArea(pts) {
  let sum = 0;
  for (let i = 0; i < 4; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % 4];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

const accuracyNote = 'Estimated from a photo; accuracy depends on calibration and photo quality (typically a few percent). User confirmation required before use.';
const devNotice = 'markerCornersPx and markerSizeCm are developer-only temporary inputs (TS-001); automatic marker detection is planned.';
// Override only for isolated test uploads; default preserves the existing path convention.
const uploadsRoot = path.resolve(process.env.BORSAL_UPLOADS_DIR || path.join(__dirname, '..', '..', 'data', 'uploads'));

function validationError(res, error) {
  const unknown = error.issues.filter((issue) => issue.code === 'unrecognized_keys')
    .flatMap((issue) => issue.keys);
  return res.status(400).json({
    error: unknown.length ? 'Unknown or forbidden fields: ' + unknown.join(', ') : 'Validation failed',
    issues: error.issues,
  });
}

function uploadPhoto(req, res, next) {
  upload.single('photo')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE'
        ? 'Photo exceeds the 10 MB size limit' : 'Upload error: ' + err.message });
    }
    if (err) return next(err);
    next();
  });
}

function validatePhoto(req, res) {
  if (!req.file) {
    res.status(400).json({ error: 'Field "photo" is required' });
    return null;
  }
  const type = detectImageType(req.file.buffer);
  if (!type) res.status(400).json({ error: 'File is not a valid JPEG or PNG (magic bytes mismatch)' });
  return type;
}

function parseCorners(value, res) {
  let corners;
  try { corners = JSON.parse(value); } catch {
    res.status(400).json({ error: 'markerCornersPx must be a valid JSON string' });
    return null;
  }
  const parsed = z.array(z.tuple([z.number().finite(), z.number().finite()])).length(4).safeParse(corners);
  if (!parsed.success) {
    res.status(400).json({ error: 'markerCornersPx must be an array of exactly 4 [x, y] pairs with finite numbers', issues: parsed.error.issues });
    return null;
  }
  return parsed.data;
}

async function validateCorners(buffer, corners, res) {
  let meta;
  try { meta = await sharp(buffer).metadata(); } catch {
    res.status(400).json({ error: 'Could not read image metadata' });
    return false;
  }
  if (corners.some(([x, y]) => x < 0 || x > meta.width || y < 0 || y > meta.height)) {
    res.status(400).json({ error: 'Corner is outside the image dimensions' });
    return false;
  }
  if (!isConvexQuad(corners)) {
    res.status(400).json({ error: 'markerCornersPx must form a convex quadrilateral' });
    return false;
  }
  if (quadArea(corners) <= meta.width * meta.height * 0.01) {
    res.status(400).json({ error: 'Marker quadrilateral area must exceed 1% of the image area' });
    return false;
  }
  return true;
}

async function analyze(buffer, corners, size, res) {
  const result = await extractFabricContour(buffer, corners, size, {});
  if (result.ok !== true || result.validation?.valid !== true) {
    res.status(422).json({ error: 'Fabric contour extraction failed', warnings: result.warnings, validation: result.validation });
    return null;
  }
  return result;
}

async function analyzeAutomatic(buffer, matPreset, res) {
  // Decode before running CV so truncated/invalid files are client errors, not server errors.
  try { await sharp(buffer, { limitInputPixels: 24000000 }).stats(); } catch {
    res.status(400).json({ error: 'Could not decode image (maximum 24 million pixels)' });
    return null;
  }
  const { report } = await measurePhoto(buffer, presetProfile(matPreset));
  if (!report.detection.ok || !report.computed || report.validation?.valid !== true) {
    res.status(422).json({ error: 'Automatic fabric measurement failed', reason: report.reason,
      diagnostics: report.detection.diagnostics, validation: report.validation, warnings: report.warnings });
    return null;
  }
  return {
    polygonCm: report.polygonCm, validation: report.validation, warnings: report.warnings,
    stats: { ...report.computed, pxPerCmApprox: report.detection.calibration.pxPerCmApprox,
      perspectiveSkew: report.detection.calibration.perspectiveSkew },
    calibrationEvidence: { ...report.detection, coordinateFrame: 'EXIF-normalized original image',
      originalPhotoSha256: report.imageSha256, status: report.status, limitations: report.limitations },
  };
}

async function savePhoto(id, type, buffer) {
  const directory = path.join(uploadsRoot, String(id));
  const photoPath = path.join(directory, randomUUID() + (type === 'jpeg' ? '.jpg' : '.png'));
  await fs.promises.mkdir(directory, { recursive: true });
  try {
    await fs.promises.writeFile(photoPath, buffer, { flag: 'wx' });
  } catch (error) {
    await removePhoto(photoPath);
    throw error;
  }
  return photoPath;
}

async function removePhoto(photoPath) {
  try { await fs.promises.unlink(photoPath); } catch (error) {
    if (error.code !== 'ENOENT') console.error('Photo cleanup failed:', error.code);
  }
  // Only remove this fabric directory if empty; never remove historic photos.
  try { await fs.promises.rmdir(path.dirname(photoPath)); } catch (error) {
    if (!['ENOENT', 'ENOTEMPTY', 'EEXIST'].includes(error.code)) console.error('Upload directory cleanup failed:', error.code);
  }
}

function buildAnalysis(photoPath, corners, size, result) {
  return {
    analysisId: randomUUID(), photoPath, markerCornersPx: corners, markerSizeCm: size,
    scale: { pxPerCmApprox: result.stats.pxPerCmApprox, perspectiveSkew: result.stats.perspectiveSkew },
    suggestedPolygonCm: result.polygonCm, stats: result.stats, warnings: result.warnings,
    createdAt: new Date(), calibrationSource: result.calibrationEvidence ? 'auto-marker' : 'manual-dev',
    ...(result.calibrationEvidence ? { calibrationEvidence: result.calibrationEvidence } : {}),
  };
}

function analysisResponse(result) {
  const { widthCm, heightCm, areaCm2 } = result.stats;
  return {
    analysisSummary: { widthCm, heightCm, areaCm2, pointsCount: result.polygonCm.length, warnings: result.warnings },
    suggestedPolygonCm: result.polygonCm, validation: result.validation,
    ...(result.calibrationEvidence ? {
      accuracyNote: 'Automatic photo measurement; physical accuracy is unverified. Geometry confirmation required before manufacturing decisions.',
      calibration: result.calibrationEvidence,
    } : { accuracyNote, devNotice }),
  };
}

function frozen(fabric, res) {
  if ((fabric.availabilityStatus || 'AVAILABLE') === 'AVAILABLE') return false;
  res.status(409).json({ error: 'Fabric is reserved or consumed; geometry is frozen' });
  return true;
}

function versionConflict(res) {
  return res.status(409).json({ error: 'Fabric changed; reload and retry', code: 'FABRIC_VERSION_CONFLICT' });
}

// Extra save predicates supplement Mongoose optimisticConcurrency. In particular,
// legacy raw records without __v must also have exactly one first-save winner.
function guardSave(fabric) {
  fabric.$where = { availabilityStatus: { $in: ['AVAILABLE', null] } };
  if (fabric.__v === undefined) fabric.$where.__v = { $exists: false };
}

function isSaveConflict(error) {
  return error instanceof mongoose.Error.VersionError || error instanceof mongoose.Error.DocumentNotFoundError;
}

// Freshness comparison tolerates orientation and a changed starting vertex.
function sameOutline(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length || !left.length) return false;
  const a = normalizeToCounterClockwise(left), b = normalizeToCounterClockwise(right);
  return b.some((_, offset) => a.every((point, i) => point.every((v, j) => Math.abs(v - b[(i + offset) % b.length][j]) <= 1e-6)));
}

// Derived per response, never persisted (legacy IDs cannot establish a match).
function geometryBasedOnCurrentAnalysis(fabric) {
  const geometry = fabric.geometry;
  if (!geometry?.confirmed || !geometry.basis?.analysisId || !fabric.analysis?.analysisId) return null;
  return geometry.basis.analysisId === fabric.analysis.analysisId;
}

function geometryBasis(analysis, normalizedPolygon) {
  if (!analysis) return undefined;
  analysis = analysis.toObject ? analysis.toObject() : analysis;
  const suggested = normalizeToCounterClockwise(analysis.suggestedPolygonCm);
  const matchesSuggestion = normalizedPolygon.length === suggested.length &&
    normalizedPolygon.every((point, i) => point.every((value, j) => Math.abs(value - suggested[i][j]) <= 1e-6));
  // Clone nested arrays, scale and timestamp too; future analyses cannot change this basis.
  return structuredClone({
    analysisId: analysis.analysisId,
    photoPath: analysis.photoPath,
    calibrationSource: analysis.calibrationSource,
    ...(analysis.calibrationEvidence ? { calibrationEvidence: analysis.calibrationEvidence } : {}),
    markerSizeCm: analysis.markerSizeCm,
    markerCornersPx: analysis.markerCornersPx,
    scale: analysis.scale?.toObject ? analysis.scale.toObject() : analysis.scale,
    suggestedPolygonCm: analysis.suggestedPolygonCm,
    analysisCreatedAt: analysis.createdAt,
    matchesSuggestion,
  });
}

function archiveGeometry(fabric) {
  if (fabric.geometry) {
    fabric.geometryHistory.push(fabric.geometry.toObject());
    fabric.markModified('geometryHistory');
  }
}

// TS-002: metadata-only creation is retained for development and tests.
router.post('/', async (req, res) => {
  try {
    const parsed = createFabricPieceSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);
    const fabric = await FabricPiece.create(parsed.data);
    return res.status(201).json(fabric);
  } catch (error) {
    console.error('Unexpected error in POST /api/fabrics:', error.name);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const pieces = await FabricPiece.find().sort({ createdAt: -1 });
    return res.status(200).json(pieces);
  } catch (error) {
    console.error('Unexpected error in GET /api/fabrics:', error.name);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/** Image-first registration: automatic mat presets or TS-001 legacy developer calibration. */
router.post('/from-photo', uploadPhoto, async (req, res) => {
  let photoPath;
  try {
    const type = validatePhoto(req, res);
    if (!type) return;
    const parsed = fromPhotoSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);
    const { markerCornersPx, markerSizeCm, matPreset, ...metadata } = parsed.data;
    let corners, size = markerSizeCm, result;
    if (matPreset) {
      result = await analyzeAutomatic(req.file.buffer, matPreset, res);
      if (result) {
        // Compatibility fields describe the detected center reference square, not a single tag.
        corners = result.calibrationEvidence.calibration.markerCentersPx;
        size = result.calibrationEvidence.profile.spanCm;
      }
    } else {
      corners = parseCorners(markerCornersPx, res);
      if (!corners || !await validateCorners(req.file.buffer, corners, res)) return;
      result = await analyze(req.file.buffer, corners, markerSizeCm, res);
    }
    if (!result) return;
    const id = new mongoose.Types.ObjectId();
    photoPath = await savePhoto(id, type, req.file.buffer);
    const fabric = await FabricPiece.create({
      _id: id, ...metadata, registrationSource: 'photo', status: 'DRAFT', availabilityStatus: 'AVAILABLE',
      analysis: buildAnalysis(photoPath, corners, size, result),
    });
    return res.status(201).json({ fabric, ...analysisResponse(result), ...(matPreset ? {} : { legacyDevOnly: true }) });
  } catch (error) {
    if (photoPath) await removePhoto(photoPath);
    console.error('Unexpected error in POST /api/fabrics/from-photo:', error.name);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid ObjectId format' });
    const piece = await FabricPiece.findById(id);
    if (!piece) return res.status(404).json({ error: 'Fabric piece not found' });
    return res.status(200).json({ ...piece.toObject(), geometryBasedOnCurrentAnalysis: geometryBasedOnCurrentAnalysis(piece) });
  } catch (error) {
    console.error('Unexpected error in GET /api/fabrics/:id:', error.name);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/geometry', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid ObjectId format' });
    const fabric = await FabricPiece.findById(id);
    if (!fabric) return res.status(404).json({ error: 'Fabric piece not found' });
    if (frozen(fabric, res)) return;
    const parsed = putGeometrySchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);
    const { polygonCm, holes } = parsed.data;
    const validation = validateWithHoles(polygonCm, holes);
    if (!validation.valid) return res.status(400).json({ error: 'Invalid geometry', errors: validation.errors });
    const normalizedPolygon = normalizeToCounterClockwise(polygonCm);
    const previousVersion = fabric.geometry?.version || 0;
    if (fabric.geometry?.confirmed) archiveGeometry(fabric);
    fabric.geometry = { polygonCm: normalizedPolygon, holes, confirmed: false, version: previousVersion + 1 };
    fabric.status = 'DRAFT';
    guardSave(fabric);
    await fabric.save();
    const dims = dimensions(normalizedPolygon);
    const summary = {
      areaCm2: area(normalizedPolygon), netAreaCm2: validation.netAreaCm2,
      widthCm: dims.widthCm, heightCm: dims.heightCm,
    };
    return res.status(200).json({ ...fabric.toObject(), summary });
  } catch (error) {
    if (isSaveConflict(error)) return versionConflict(res);
    console.error('Unexpected error in PUT /api/fabrics/:id/geometry:', error.name);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/** Replace analysis only. TS-001: marker inputs are developer-only and temporary. */
router.post('/:id/analyze-photo', uploadPhoto, async (req, res) => {
  let photoPath;
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid ObjectId format' });
    const fabric = await FabricPiece.findById(id);
    if (!fabric) return res.status(404).json({ error: 'Fabric piece not found' });
    if (frozen(fabric, res)) return;
    const type = validatePhoto(req, res);
    if (!type) return;
    const parsed = calibrationSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);
    const corners = parseCorners(parsed.data.markerCornersPx, res);
    if (!corners) return;
    if (!await validateCorners(req.file.buffer, corners, res)) return;
    const result = await analyze(req.file.buffer, corners, parsed.data.markerSizeCm, res);
    if (!result) return;
    // Do not write a photo before extraction has succeeded.
    photoPath = await savePhoto(fabric._id, type, req.file.buffer);
    if (fabric.analysis) fabric.analysisHistory.push(fabric.analysis.toObject());
    fabric.analysis = buildAnalysis(photoPath, corners, parsed.data.markerSizeCm, result);
    guardSave(fabric);
    await fabric.save();
    return res.status(200).json({
      ...analysisResponse(result),
      geometryBasedOnCurrentAnalysis: geometryBasedOnCurrentAnalysis(fabric),
      ...(fabric.geometry?.confirmed ? {
        notice: 'Confirmed geometry is based on a previous analysis; confirm the geometry again to base it on this photo.',
      } : {}),
    });
  } catch (error) {
    if (photoPath) await removePhoto(photoPath);
    if (isSaveConflict(error)) return versionConflict(res);
    console.error('Unexpected error in POST /api/fabrics/:id/analyze-photo:', error.name);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/confirm-geometry', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid ObjectId format' });
    const fabric = await FabricPiece.findById(id);
    if (!fabric) return res.status(404).json({ error: 'Fabric piece not found' });
    if (frozen(fabric, res)) return;
    const parsed = confirmGeometrySchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);
    const { polygonCm, holes, source, basedOnAnalysisId, expectedGeometryVersion } = parsed.data;
    const geoValidation = validateWithHoles(polygonCm, holes);
    if (!geoValidation.valid) return res.status(400).json({ error: 'Invalid geometry', errors: geoValidation.errors });
    const previousVersion = fabric.geometry?.version || 0;
    if (expectedGeometryVersion !== undefined && expectedGeometryVersion !== previousVersion) return versionConflict(res);
    let basisAnalysis = fabric.analysis;
    if (basedOnAnalysisId !== undefined) {
      if (basisAnalysis?.analysisId !== basedOnAnalysisId) {
        if (fabric.analysisHistory.some((entry) => entry.analysisId === basedOnAnalysisId))
          return res.status(409).json({ error: 'Confirmation must use the current analysis', code: 'STALE_ANALYSIS' });
        return res.status(400).json({ error: 'basedOnAnalysisId does not match a current or historical analysis' });
      }
    } else if (basisAnalysis?.analysisId && !sameOutline(polygonCm, basisAnalysis.suggestedPolygonCm) &&
        !(fabric.geometry?.basis?.analysisId === basisAnalysis.analysisId && sameOutline(polygonCm, fabric.geometry.polygonCm))) {
      return res.status(409).json({ error: 'Edited geometry requires the current basedOnAnalysisId', code: 'CURRENT_ANALYSIS_REQUIRED' });
    }
    // Existing geometry edits (including holes) must acknowledge its current revision.
    const currentHoles = fabric.geometry?.holes || [];
    if (expectedGeometryVersion === undefined && fabric.geometry &&
        (!sameOutline(polygonCm, fabric.geometry.polygonCm) || holes.length !== currentHoles.length ||
         holes.some((hole, i) => !sameOutline(hole, currentHoles[i]))))
      return res.status(409).json({ error: 'Changed geometry requires expectedGeometryVersion', code: 'CURRENT_GEOMETRY_REQUIRED' });
    // Retain the replaced draft as well as confirmed versions for complete history.
    archiveGeometry(fabric);
    let suggestedPolygonCm;
    if (source === 'suggested' && basisAnalysis?.suggestedPolygonCm) suggestedPolygonCm = basisAnalysis.suggestedPolygonCm;
    const normalizedPolygon = normalizeToCounterClockwise(polygonCm);
    fabric.geometry = {
      polygonCm: normalizedPolygon, holes, confirmed: true, version: previousVersion + 1,
      source, suggestedPolygonCm, confirmedAt: new Date(),
      basis: geometryBasis(basisAnalysis, normalizedPolygon),
    };
    fabric.status = 'CONFIRMED';
    fabric.markModified('geometry');
    fabric.markModified('geometryHistory');
    guardSave(fabric);
    await fabric.save();
    const dims = dimensions(normalizedPolygon);
    const summary = {
      areaCm2: Number(area(normalizedPolygon).toFixed(4)),
      netAreaCm2: Number(geoValidation.netAreaCm2.toFixed(4)),
      widthCm: Number(dims.widthCm.toFixed(4)), heightCm: Number(dims.heightCm.toFixed(4)),
    };
    return res.status(200).json({ fabric: fabric.toObject(), summary, geometryBasedOnCurrentAnalysis: geometryBasedOnCurrentAnalysis(fabric) });
  } catch (error) {
    if (isSaveConflict(error)) return versionConflict(res);
    console.error('Unexpected error in POST /api/fabrics/:id/confirm-geometry:', error.name);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
