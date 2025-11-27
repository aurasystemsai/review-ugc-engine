const express = require('express');
const db = require('./db');

const router = express.Router();

const nowISO = () => new Date().toISOString();

// Submit a new review / UGC item
router.post('/submit', (req, res) => {
  const {
    customerId,
    productId,
    orderId,
    channel,
    type = 'review',
    rating,
    text,
    mediaUrl
  } = req.body || {};

  if (!productId || !rating || !text) {
    return res.status(400).json({
      error: 'productId, rating and text are required'
    });
  }

  const aiScore = Math.round((0.8 + Math.random() * 0.2) * 100) / 100;

  const sql = `
    INSERT INTO ugc_reviews
      (customer_id, product_id, order_id, channel, type, rating, text, media_url,
       status, ai_score, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    customerId || null,
    productId,
    orderId || null,
    channel || 'web',
    type,
    rating,
    text,
    mediaUrl || null,
    'pending',
    aiScore,
    nowISO(),
    nowISO()
  ];

  db.run(sql, params, function (err) {
    if (err) {
      console.error('DB insert error', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({
      id: this.lastID,
      status: 'pending',
      aiScore
    });
  });
});

// Get all pending items for moderation
router.get('/moderation/pending', (req, res) => {
  const sql = `
    SELECT *
    FROM ugc_reviews
    WHERE status = 'pending'
    ORDER BY created_at DESC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('DB select error', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(rows);
  });
});

// Approve a specific review
router.post('/moderation/:id/approve', (req, res) => {
  const id = req.params.id;

  const sql = `
    UPDATE ugc_reviews
    SET status = 'approved',
        updated_at = ?
    WHERE id = ?
  `;

  db.run(sql, [nowISO(), id], function (err) {
    if (err) {
      console.error('DB update error', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.json({ success: true });
  });
});

// Get approved reviews for a product
router.get('/product/:productId', (req, res) => {
  const productId = req.params.productId;

  const sql = `
    SELECT *
    FROM ugc_reviews
    WHERE product_id = ?
      AND status = 'approved'
    ORDER BY created_at DESC
  `;

  db.all(sql, [productId], (err, rows) => {
    if (err) {
      console.error('DB select error', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(rows);
  });
});

module.exports = router;
