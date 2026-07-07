// Vercel entry point. Referenced by vercel.json ("src": "index.js").
// IMPORTANT: this must NOT call app.listen() — Vercel's @vercel/node builder
// wraps the exported Express app as a serverless function itself. For local
// development, use `npm run dev` (src/server.js), which does call listen().
require('dotenv').config();
const app = require('./src/app');

module.exports = app;
