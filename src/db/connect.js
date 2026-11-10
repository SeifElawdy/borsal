// src/db/connect.js
// Handles MongoDB connection using Mongoose and environment variables

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

/**
 * Connects to MongoDB using MONGODB_URI from environment.
 * On error, logs only the error message (never the connection string) and exits with code 1.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Database connection error: MONGODB_URI is not set in environment variables.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected');
  } catch (error) {
    // Log only the error message to avoid exposing credentials
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
}

module.exports = connectDB;
module.exports.connectDB = connectDB;

