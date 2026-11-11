// src/server.js
// Entry point: connects to MongoDB then starts the HTTP server.
// The Express app itself lives in src/app.js so tests can import it without side effects.

const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./db/connect');
const app = require('./app');

const PORT = process.env.PORT || 3000;

/**
 * Connects to MongoDB then starts listening on PORT.
 */
async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

// Start server if executed directly (not required as a module)
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
