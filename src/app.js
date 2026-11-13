// src/app.js
// Builds and exports the Express application WITHOUT starting the server or connecting to the DB.
// This separation allows the app to be imported in tests without side effects.

const express = require('express');
const fabricsRouter = require('./routes/fabrics');

const app = express();

// Parse incoming JSON payloads
app.use(express.json());

// Health check — no DB required
app.get('/health', (req, res) => {
  return res.status(200).json({ ok: true });
});

// Mount fabrics router
app.use('/api/fabrics', fabricsRouter);
// Explicitly enabled, loopback-only MVP concept flow; disabled by default.
app.use('/api', require('./routes/concepts'));

module.exports = app;

