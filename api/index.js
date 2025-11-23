const path = require('path');

// Import the main server app
const app = require('../backend/server.js');

// Export for Vercel serverless functions
module.exports = app;