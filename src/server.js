// src/server.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const ugcRoutes = require('./ugcRoutes');

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve static files (admin dashboard, etc.)
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'review-ugc-engine', time: new Date().toISOString() });
});

// Admin dashboard HTML
app.get('/admin/ugc', (req, res) => {
  res.sendFile(path.join(publicPath, 'ugc-admin.html'));
});

app.use('/api/ugc', ugcRoutes);

app.listen(PORT, () => {
  console.log(`✅ Review UGC Engine running at http://localhost:${PORT}`);
});
