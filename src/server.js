const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const ugcRoutes = require('./ugcRoutes');

const app = express();
const PORT = process.env.PORT || 4001;

// ------------------------------------
// Middleware
// ------------------------------------
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (loader.js, widget.js, admin HTML)
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

// ------------------------------------
// Health check
// ------------------------------------
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'review-ugc-engine',
    time: new Date().toISOString()
  });
});

// ------------------------------------
// Admin auth (Basic Auth via .env)
// ------------------------------------
const ADMIN_USER = process.env.ADMIN_USER || 'aura';
const ADMIN_PASS = process.env.ADMIN_PASS || 'changeme';

function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="AURA Admin"');
    return res.status(401).send('Authentication required');
  }

  const base64 = authHeader.replace('Basic ', '');
  let decoded = '';

  try {
    decoded = Buffer.from(base64, 'base64').toString('utf8');
  } catch (e) {
    res.setHeader('WWW-Authenticate', 'Basic realm="AURA Admin"');
    return res.status(401).send('Invalid authentication header');
  }

  const [user, pass] = decoded.split(':');

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    return next();
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="AURA Admin"');
  return res.status(401).send('Invalid credentials');
}

// Admin dashboard HTML
app.get('/admin/ugc', requireAdmin, (req, res) => {
  res.sendFile(path.join(publicPath, 'ugc-admin.html'));
});

// ------------------------------------
// AURA Config API (used by loader.js)
// ------------------------------------
app.get('/api/aura-config', (req, res) => {
  const siteId = req.query.site_id || `domain:${req.hostname}`;

  // For now: hard-coded "pro" plan with all tools toggled on/off
  const plan = 'pro';
  const tools = {
    reviews: { enabled: true },
    seo: { enabled: true },
    schema: { enabled: false }
  };

  res.json({
    siteId,
    plan,
    tools
  });
});

// ------------------------------------
// UGC API (submit + fetch approved)
// ------------------------------------
app.use('/api/ugc', ugcRoutes);

// ------------------------------------
// Start server
// ------------------------------------
app.listen(PORT, () => {
  console.log(`✅ Review UGC Engine running at http://localhost:${PORT}`);
});
