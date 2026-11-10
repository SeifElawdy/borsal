// src/routes/fabrics.js
// Express router for fabric piece operations

const express = require('express');
const mongoose = require('mongoose');
const { z } = require('zod');
const FabricPiece = require('../models/FabricPiece');

const router = express.Router();

// Zod validation schema for creating a fabric piece
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

/**
 * POST /api/fabrics
 * Validates request body with Zod, creates document, returns 201 with created object.
 */
router.post('/', async (req, res) => {
  try {
    const parseResult = createFabricPieceSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        issues: parseResult.error.issues,
      });
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
 * Returns 400 for invalid ObjectId, 404 if not found.
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

module.exports = router;

