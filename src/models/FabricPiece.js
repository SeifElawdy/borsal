// src/models/FabricPiece.js
// Mongoose schema and model for fabric pieces

const mongoose = require('mongoose');

// Sub-schema for piece geometry (populated when geometry is added)
const GeometrySchema = new mongoose.Schema(
  {
    polygonCm: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
    },
    holes: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
    },
    confirmed: {
      type: Boolean,
      default: false,
    },
    version: {
      type: Number,
      default: 1,
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

