const express = require('express');
const db = require('./db');
const router = express.Router();

function generateAIScore() {
  return Math.round((Math.random() * (0.99 - 0.6) + 0.6) * 100) / 100;
}

// POST /api/ugc/submit
router.post('/submit', (req, res) => {
  const { customerId, productId, type, rating = null, text = null, mediaUrl = null } = req.body;

  if (!customerId || !productId || !type) {
    return res.status(400).json({ error: 'customerId, productId and type are required' });
  }

  const now = new Date().toISOString();
  const aiScore = generateAIScore();
  const status = 'pending';

  db.run(
    `INSERT INTO ugc_items (customer_id, product_id, type, rating, text, media_url, status, ai_score, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [customerId, productId, type, rating, text, mediaUrl, status, aiScore, now, now],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to save item' });
      res.json({ id: this.lastID, status, aiScore });
    }
  );
});

// GET /api/ugc/moderation/pending
router.get('/moderation/pending', (req, res) => {
  db.all(`SELECT * FROM ugc_items WHERE status='pending' ORDER BY created_at ASC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to load items' });
    res.json(rows);
  });
});

// POST /api/ugc/moderation/:id/approve
router.post('/moderation/:id/approve', (req, res) => {
  const id = req.params.id;
  db.run(`UPDATE ugc_items SET status='approved' WHERE id=?`, [id], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to approve' });
    res.json({ success: true });
  });
});

// GET /api/ugc/product/:productId
router.get('/product/:productId', (req, res) => {
  const productId = req.params.productId;
  db.all(`SELECT * FROM ugc_items WHERE product_id=? AND status='approved'`, [productId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch' });
    res.json(rows);
  });
});

module.exports = router;
