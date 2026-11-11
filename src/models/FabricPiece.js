// src/models/FabricPiece.js
// Mongoose schema and model for fabric pieces

const mongoose = require('mongoose');

// Sub-schema for piece geometry (populated after confirm-geometry)
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
    // "suggested" | "manual" — set by confirm-geometry
    source: {
      type: String,
      enum: ['suggested', 'manual'],
    },
    // Copy of suggestedPolygonCm at time of confirmation (traceability)
    suggestedPolygonCm: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
    },
    confirmedAt: {
      type: Date,
    },
  },
  { _id: false }
);

// Sub-schema for a previous geometry snapshot stored in geometryHistory
const GeometryHistorySchema = new mongoose.Schema(
  {
    polygonCm: { type: mongoose.Schema.Types.Mixed },
    holes: { type: mongoose.Schema.Types.Mixed },
    confirmed: { type: Boolean },
    version: { type: Number },
    source: { type: String },
    suggestedPolygonCm: { type: mongoose.Schema.Types.Mixed },
    confirmedAt: { type: Date },
  },
  { _id: false }
);

// Sub-schema for the latest photo-analysis result
const AnalysisSchema = new mongoose.Schema(
  {
    // Path on disk where the original photo was saved (relative to project root)
    photoPath: { type: String },
    markerCornersPx: { type: mongoose.Schema.Types.Mixed },
    markerSizeCm: { type: Number },
    // Scale calibration info
    scale: {
      pxPerCmApprox: { type: Number },
      perspectiveSkew: { type: Number },
    },
    // Polygon suggested by extractFabricContour (in cm, CCW)
    suggestedPolygonCm: { type: mongoose.Schema.Types.Mixed },
    // Raw stats returned by extractFabricContour
    stats: { type: mongoose.Schema.Types.Mixed },
    warnings: { type: mongoose.Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
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
    // History of previously confirmed geometries — never deleted
    geometryHistory: {
      type: [GeometryHistorySchema],
      default: [],
    },
    // Latest photo analysis result (overwritten on each new analyze-photo call)
    analysis: {
      type: AnalysisSchema,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

const FabricPiece = mongoose.model('FabricPiece', FabricPieceSchema);

module.exports = FabricPiece;
