// src/server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const ugcRoutes = require('./ugcRoutes');

const app = express();
const PORT = process.env.PORT || 4001;

// ---------------------------------------------------------------------------
// Core middleware
// ---------------------------------------------------------------------------
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

// ---------------------------------------------------------------------------
// Admin auth (Basic Auth using .env)
// ---------------------------------------------------------------------------
const ADMIN_USER = process.env.ADMIN_USER || 'aura';
const ADMIN_PASS = process.env.ADMIN_PASS || 'changeme';

function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Basic ')) {
    // NOTE: string is single quoted, so the double quotes inside are fine
    res.setHeader('WWW-Authenticate', 'Basic realm="AURA Admin"');
    return res.status(401).send('Authentication required');
  }

  const base64 = authHeader.replace('Basic ', '');
  const [user, pass] = Buffer.from(base64, 'base64')
    .toString('utf8')
    .split(':');

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    return next();
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="AURA Admin"');
  return res.status(401).send('Invalid credentials');
}

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'review-ugc-engine',
    time: new Date().toISOString()
  });
});

// ---------------------------------------------------------------------------
// Admin dashboard (PROTECTED)
// ---------------------------------------------------------------------------
app.get('/admin/ugc', requireAdmin, (req, res) => {
  res.sendFile(path.join(publicPath, 'ugc-admin.html'));
});

// ---------------------------------------------------------------------------
// Protect moderation API
// ---------------------------------------------------------------------------
app.use('/api/ugc/moderation', requireAdmin);

// ---------------------------------------------------------------------------
// AURA Config API (used by loader.js for any platform)
// ---------------------------------------------------------------------------
app.get('/api/aura-config', (req, res) => {
  // e.g. "domain:aurasystemsai.com" or "shopify:dtpjewellry.myshopify.com"
  const siteId = req.query.site_id || `domain:${req.hostname}`;

  // Default "starter" plan
  let plan = 'starter';
  let tools = {
    reviews: { enabled: true },
    seo: { enabled: false },
    schema: { enabled: false }
  };

  // Example: treat your own sites as "pro"
  const proSites = [
    'domain:aurasystemsai.com',
    'domain:dtpjewellry.com',
    'shopify:dtpjewellry.myshopify.com'
  ];

  if (proSites.includes(siteId)) {
    plan = 'pro';
    tools = {
      reviews: { enabled: true },
      seo: { enabled: true },
      schema: { enabled: false } // enable later when ready
    };
  }

  res.json({
    siteId,
    plan,
    tools
  });
});

// ---------------------------------------------------------------------------
// Public UGC API (submit + fetch approved)
// ---------------------------------------------------------------------------
app.use('/api/ugc', ugcRoutes);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`✅ Review UGC Engine running at http://localhost:${PORT}`);
});
