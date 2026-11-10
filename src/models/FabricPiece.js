// src/models/FabricPiece.js
// Mongoose schema and model for fabric pieces

const mongoose = require('mongoose');

// Sub-schema for piece geometry (optional, populated in later phases)
const GeometrySchema = new mongoose.Schema(
  {
    polygonCm: {
      type: [[Number]],
      default: undefined,
    },
    holes: {
      type: [[[Number]]],
      default: undefined,
    },
    confirmed: {
      type: Boolean,
      default: undefined,
    },
    version: {
      type: Number,
      default: undefined,
    },
  },
  { _id: false }
);

const FabricPieceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    fabricType: {
      type: String,
      trim: true,
    },
    massGrams: {
      type: Number,
      min: 0,
    },
    grainDirectionDeg: {
      type: Number,
      min: 0,
      max: 179,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'CONFIRMED'],
      default: 'DRAFT',
    },
    geometry: {
      type: GeometrySchema,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

const FabricPiece = mongoose.model('FabricPiece', FabricPieceSchema);

module.exports = FabricPiece;

