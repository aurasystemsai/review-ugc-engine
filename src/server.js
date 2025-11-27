// src/server.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config(); // Load .env file
const ugcRoutes = require('./ugcRoutes');

const app = express();
const PORT = process.env.PORT || 4001;

// ---------------------------
// Basic Auth Protection
// ---------------------------
const ADMIN_USER = process.env.ADMIN_USER || 'aura';
const ADMIN_PASS = process.env.ADMIN_PASS || 'changeme';

function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [type, credentials] = authHeader.split(' ');

  if (type !== 'Basic' || !credentials) {
    res.set('WWW-Authenticate', 'Basic realm="AURA UGC Admin"');
    return res.status(401).send('Authentication required.');
  }

  const decoded = Buffer.from(credentials, 'base64').toString();
  const [user, pass] = decoded.split(':');

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    return next();
  }

  res.set('WWW-Authenticate', 'Basic realm="AURA UGC Admin"');
  return res.status(401).send('Invalid credentials.');
}

// ---------------------------
// Middleware
// ---------------------------
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve static admin files
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

// Health check (public)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'review-ugc-engine',
    time: new Date().toISOString()
  });
});

// Admin dashboard (PROTECTED)
app.get('/admin/ugc', requireAdmin, (req, res) => {
  res.sendFile(path.join(publicPath, 'ugc-admin.html'));
});

// PROTECT moderation endpoints
app.use('/api/ugc/moderation', requireAdmin);

// Public API: submit + fetch approved
app.use('/api/ugc', ugcRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Review UGC Engine running at http://localhost:${PORT}`);
});
