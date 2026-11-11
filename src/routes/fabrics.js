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

// Schema for creating a new fabric piece
const createFabricPieceSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(1, 'Name must be at least 1 character')
    .max(100, 'Name must not exceed 100 characters'),
  fabricType: z.string().trim().optional(),
  massGrams: z.number().min(0, 'massGrams must be greater than or equal to 0').optional(),
  grainDirectionDeg: z
    .number()
    .min(0, 'grainDirectionDeg must be between 0 and 179')
    .max(179, 'grainDirectionDeg must be between 0 and 179')
    .optional(),
  status: z.enum(['DRAFT', 'CONFIRMED']).optional(),
  geometry: z
    .object({
      polygonCm: z.array(z.tuple([z.number(), z.number()])).optional(),
      holes: z.array(z.array(z.tuple([z.number(), z.number()]))).optional(),
      confirmed: z.boolean().optional(),
      version: z.number().optional(),
    })
    .optional(),
});

// Schema for updating fabric geometry via PUT (never sets confirmed: true)
const putGeometrySchema = z.object({
  polygonCm: z.array(z.tuple([z.number(), z.number()])),
  holes: z.array(z.array(z.tuple([z.number(), z.number()]))).optional().default([]),
});

// Schema for confirm-geometry body
const confirmGeometrySchema = z.object({
  polygonCm: z.array(z.tuple([z.number(), z.number()])),
  holes: z.array(z.array(z.tuple([z.number(), z.number()]))).optional().default([]),
  source: z.enum(['suggested', 'manual']),
});

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Check that the 4 corners form a convex quadrilateral.
 * We test that all 4 cross products of consecutive edges have the same sign.
 */
function isConvexQuad(pts) {
  let sign = 0;
  for (let i = 0; i < 4; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % 4];
    const c = pts[(i + 2) % 4];
    const cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    if (cross === 0) continue;
    const s = cross > 0 ? 1 : -1;
    if (sign === 0) sign = s;
    else if (s !== sign) return false;
  }
  return true;
}

/**
 * Area of a quadrilateral using the shoelace formula.
 */
function quadArea(pts) {
  let sum = 0;
  for (let i = 0; i < 4; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % 4];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

// ─── Routes ─────────────────────────────────────────────────────────────────

/**
 * POST /api/fabrics
 * Creates a new fabric piece.
 */
router.post('/', async (req, res) => {
  try {
    const parseResult = createFabricPieceSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', issues: parseResult.error.issues });
    }
    const created = await FabricPiece.create(parseResult.data);
    return res.status(201).json(created);
  } catch (error) {
    console.error('Unexpected error in POST /api/fabrics:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/fabrics
 * Returns all fabric pieces, newest first.
 */
router.get('/', async (req, res) => {
  try {
    const pieces = await FabricPiece.find().sort({ createdAt: -1 });
    return res.status(200).json(pieces);
  } catch (error) {
    console.error('Unexpected error in GET /api/fabrics:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/fabrics/:id
 * Returns one fabric piece by id.
 * 400 for invalid ObjectId, 404 if not found.
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ObjectId format' });
    }
    const piece = await FabricPiece.findById(id);
    if (!piece) {
      return res.status(404).json({ error: 'Fabric piece not found' });
    }
    return res.status(200).json(piece);
  } catch (error) {
    console.error('Unexpected error in GET /api/fabrics/:id:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/fabrics/:id/geometry
 * Updates the polygon geometry of a fabric piece.
 * NEVER sets confirmed: true (only confirm-geometry does that).
 */
router.put('/:id/geometry', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ObjectId format' });
    }
    const fabric = await FabricPiece.findById(id);
    if (!fabric) {
      return res.status(404).json({ error: 'Fabric piece not found' });
    }

    const parseResult = putGeometrySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', issues: parseResult.error.issues });
    }

    const { polygonCm, holes } = parseResult.data;
    const validation = validateWithHoles(polygonCm, holes);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Invalid geometry', errors: validation.errors });
    }

    const normalizedPolygon = normalizeToCounterClockwise(polygonCm);
    const previousVersion =
      fabric.geometry && typeof fabric.geometry.version === 'number'
        ? fabric.geometry.version
        : 0;
    const nextVersion = previousVersion + 1;

    // confirmed is always false here — only confirm-geometry can set it true
    fabric.geometry = {
      polygonCm: normalizedPolygon,
      holes,
      confirmed: false,
      version: nextVersion,
    };
    fabric.status = 'DRAFT';
    await fabric.save();

    const dims = dimensions(normalizedPolygon);
    const summary = {
      areaCm2: area(normalizedPolygon),
      netAreaCm2: validation.netAreaCm2,
      widthCm: dims.widthCm,
      heightCm: dims.heightCm,
    };

    return res.status(200).json({ ...fabric.toObject(), summary });
  } catch (error) {
    console.error('Unexpected error in PUT /api/fabrics/:id/geometry:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/fabrics/:id/analyze-photo
 * Accepts a multipart/form-data upload with:
 *   - photo (file, JPEG or PNG, max 10 MB)
 *   - markerCornersPx (JSON string: [[x,y],[x,y],[x,y],[x,y]] — TL, TR, BR, BL)
 *   - markerSizeCm (number, 1–100)
 *
 * Runs extractFabricContour and stores the analysis on the fabric document.
 * Does NOT modify geometry.
 */
router.post('/:id/analyze-photo', (req, res, next) => {
  // Run multer first (handles size limit and rough MIME check)
  upload.single('photo')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Photo exceeds the 10 MB size limit' });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    }
    if (err) return next(err);
    next();
  });
}, async (req, res) => {
  try {
    const { id } = req.params;

    // ── Validate fabric id ──────────────────────────────────────────────
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ObjectId format' });
    }

    // ── Check file was uploaded ─────────────────────────────────────────
    if (!req.file) {
      return res.status(400).json({ error: 'Field "photo" is required' });
    }

    // ── Magic-byte check ────────────────────────────────────────────────
    const imgType = detectImageType(req.file.buffer);
    if (!imgType) {
      return res.status(400).json({ error: 'File is not a valid JPEG or PNG (magic bytes mismatch)' });
    }

    // ── Validate other fields (cheap checks before the DB lookup) ───────
    if (!req.body.markerCornersPx) {
      return res.status(400).json({ error: 'Field "markerCornersPx" is required' });
    }
    if (!req.body.markerSizeCm) {
      return res.status(400).json({ error: 'Field "markerSizeCm" is required' });
    }

    // Parse markerCornersPx (expected as a JSON string from multipart)
    let corners;
    try {
      corners = JSON.parse(req.body.markerCornersPx);
    } catch {
      return res.status(400).json({ error: 'markerCornersPx must be a valid JSON string' });
    }

    const markerSizeCm = Number(req.body.markerSizeCm);
    if (!Number.isFinite(markerSizeCm) || markerSizeCm < 1 || markerSizeCm > 100) {
      return res.status(400).json({ error: 'markerSizeCm must be a number between 1 and 100' });
    }

    // Zod-validate corner structure (shape and finiteness only — bounds checked after metadata)
    const cornersSchema = z.array(
      z.tuple([z.number().finite(), z.number().finite()])
    ).length(4);

    const cornersResult = cornersSchema.safeParse(corners);
    if (!cornersResult.success) {
      return res.status(400).json({
        error: 'markerCornersPx must be an array of exactly 4 [x, y] pairs with finite numbers',
        issues: cornersResult.error.issues,
      });
    }

    // ── Look up fabric BEFORE image-dimension checks (so 404 wins over 400) ─
    const fabric = await FabricPiece.findById(id);
    if (!fabric) {
      return res.status(404).json({ error: 'Fabric piece not found' });
    }

    // ── Get image dimensions for corner bounds validation ────────────────
    let imgMeta;
    try {
      imgMeta = await sharp(req.file.buffer).metadata();
    } catch {
      return res.status(400).json({ error: 'Could not read image metadata' });
    }
    const imgWidth = imgMeta.width;
    const imgHeight = imgMeta.height;

    // All corners must be inside image bounds
    for (const [x, y] of cornersResult.data) {
      if (x < 0 || x > imgWidth || y < 0 || y > imgHeight) {
        return res.status(400).json({
          error: `Corner [${x}, ${y}] is outside the image dimensions (${imgWidth}×${imgHeight})`,
        });
      }
    }

    // Corners must form a convex quadrilateral
    if (!isConvexQuad(cornersResult.data)) {
      return res.status(400).json({ error: 'markerCornersPx must form a convex quadrilateral' });
    }

    // Quad area must be > 1% of the image area
    const qArea = quadArea(cornersResult.data);
    if (qArea < imgWidth * imgHeight * 0.01) {
      return res.status(400).json({ error: 'Marker quadrilateral area is less than 1% of the image area' });
    }

    // ── Save original photo to data/uploads/<fabricId>/<uuid>.<ext> ─────
    const uploadsDir = path.resolve(__dirname, '..', '..', 'data', 'uploads', id);
    fs.mkdirSync(uploadsDir, { recursive: true });

    const ext = imgType === 'jpeg' ? 'jpg' : 'png';
    const fileName = `${randomUUID()}.${ext}`;
    const photoPath = path.join(uploadsDir, fileName);
    fs.writeFileSync(photoPath, req.file.buffer);

    // ── Run contour extraction (no debug images) ────────────────────────
    const result = await extractFabricContour(
      req.file.buffer,
      cornersResult.data,
      markerSizeCm,
      { /* defaults */ }
    );

    if (!result.ok) {
      return res.status(422).json({
        error: 'Fabric contour extraction failed',
        warnings: result.warnings,
      });
    }

    // ── Store analysis on fabric document (no geometry change) ──────────
    const { pxPerCmApprox, perspectiveSkew, widthCm, heightCm, areaCm2 } = result.stats;
    fabric.analysis = {
      photoPath,
      markerCornersPx: cornersResult.data,
      markerSizeCm,
      scale: { pxPerCmApprox, perspectiveSkew },
      suggestedPolygonCm: result.polygonCm,
      stats: result.stats,
      warnings: result.warnings,
      createdAt: new Date(),
    };
    await fabric.save();

    const pointsCount = result.polygonCm.length;

    return res.status(200).json({
      analysisSummary: {
        widthCm,
        heightCm,
        areaCm2,
        pointsCount,
        warnings: result.warnings,
      },
      suggestedPolygonCm: result.polygonCm,
      validation: result.validation,
      accuracyNote:
        'Estimated from a photo; accuracy depends on calibration and photo quality (typically a few percent). User confirmation required before use.',
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/fabrics/:id/analyze-photo:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/fabrics/:id/confirm-geometry
 * Confirms the polygon geometry for a fabric piece and sets status to CONFIRMED.
 * Bumps version and archives the previous geometry in geometryHistory if one already existed.
 */
router.post('/:id/confirm-geometry', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ObjectId format' });
    }

    // Validate body
    const parseResult = confirmGeometrySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', issues: parseResult.error.issues });
    }

    const { polygonCm, holes, source } = parseResult.data;

    // Geometry validation (polygon + holes)
    const geoValidation = validateWithHoles(polygonCm, holes);
    if (!geoValidation.valid) {
      return res.status(400).json({ error: 'Invalid geometry', errors: geoValidation.errors });
    }

    const fabric = await FabricPiece.findById(id);
    if (!fabric) {
      return res.status(404).json({ error: 'Fabric piece not found' });
    }

    // If there is already a confirmed geometry, archive it before overwriting
    if (fabric.geometry && fabric.geometry.confirmed) {
      if (!Array.isArray(fabric.geometryHistory)) {
        fabric.geometryHistory = [];
      }
      fabric.geometryHistory.push({
        polygonCm: fabric.geometry.polygonCm,
        holes: fabric.geometry.holes,
        confirmed: fabric.geometry.confirmed,
        version: fabric.geometry.version,
        source: fabric.geometry.source,
        suggestedPolygonCm: fabric.geometry.suggestedPolygonCm,
        confirmedAt: fabric.geometry.confirmedAt,
      });
    }

    const normalizedPolygon = normalizeToCounterClockwise(polygonCm);

    // Determine new version: previous version + 1 (or 1 if no geometry yet)
    const previousVersion =
      fabric.geometry && typeof fabric.geometry.version === 'number'
        ? fabric.geometry.version
        : 0;
    const nextVersion = previousVersion + 1;

    // If source is "suggested", copy the analysis' suggestedPolygonCm for traceability
    let suggestedPolygonCm;
    if (source === 'suggested' && fabric.analysis && fabric.analysis.suggestedPolygonCm) {
      suggestedPolygonCm = fabric.analysis.suggestedPolygonCm;
    }

    fabric.geometry = {
      polygonCm: normalizedPolygon,
      holes,
      confirmed: true,
      version: nextVersion,
      source,
      suggestedPolygonCm,
      confirmedAt: new Date(),
    };
    fabric.status = 'CONFIRMED';

    // Mark nested arrays as modified (Mongoose won't detect mixed-type array changes automatically)
    fabric.markModified('geometry');
    fabric.markModified('geometryHistory');

    await fabric.save();

    // Build summary
    const dims = dimensions(normalizedPolygon);
    const summary = {
      areaCm2: Number(area(normalizedPolygon).toFixed(4)),
      netAreaCm2: Number(geoValidation.netAreaCm2.toFixed(4)),
      widthCm: Number(dims.widthCm.toFixed(4)),
      heightCm: Number(dims.heightCm.toFixed(4)),
    };

    return res.status(200).json({ fabric: fabric.toObject(), summary });
  } catch (error) {
    console.error('Unexpected error in POST /api/fabrics/:id/confirm-geometry:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
