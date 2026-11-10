// src/server.js
// Express application entry point

const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./db/connect');
const fabricsRouter = require('./routes/fabrics');

// Load environment variables from .env
dotenv.config();

const app = express();

// Middleware to parse incoming JSON payloads
app.use(express.json());

// Health check route
app.get('/health', (req, res) => {
  return res.status(200).json({ ok: true });
});

// Mount fabrics API router
app.use('/api/fabrics', fabricsRouter);

const PORT = process.env.PORT || 3000;

/**
 * Connects to MongoDB first, then starts listening on PORT.
 */
async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

// Start server if executed directly
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };

