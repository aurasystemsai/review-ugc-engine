// src/db.js
// AURA • Review UGC Engine – SQLite layer

const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, '..', 'ugc.db');

// ---------------------------------------------------------------------------
// Open DB
// ---------------------------------------------------------------------------

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('[DB] Failed to open database:', err.message);
  } else {
    console.log('[DB] Connected to UGC SQLite database:', DB_PATH);
  }
});

// ---------------------------------------------------------------------------
// Init schema
// ---------------------------------------------------------------------------

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS ugc (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id         TEXT NOT NULL,
  customer_id     TEXT,
  product_id      TEXT NOT NULL,
  order_id        TEXT,
  channel         TEXT,
  type            TEXT,
  rating          INTEGER,
  text            TEXT,
  media_url       TEXT,
  status          TEXT NOT NULL DEFAULT 'pending',
  ai_score        REAL,
  ai_label        TEXT,
  ai_reasons      TEXT,
  moderator_id    TEXT,
  moderator_notes TEXT,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);
`;

db.serialize(() => {
  db.run(CREATE_TABLE_SQL, (err) => {
    if (err) {
      console.error('[DB] Error creating UGC table:', err);
      return;
    }
    console.log('[DB] UGC table ready');
    seedDemoRowIfEmpty();
  });
});

// ---------------------------------------------------------------------------
// Seed one demo row (only if table is empty)
// ---------------------------------------------------------------------------

function seedDemoRowIfEmpty() {
  db.get('SELECT COUNT(*) AS count FROM ugc', (err, row) => {
    if (err) {
      console.error('[DB] Failed to count UGC rows:', err);
      return;
    }

    if (row.count > 0) {
      console.log('[DB] UGC table already has data, skipping seed');
      return;
    }

    const now = new Date().toISOString();

    const demo = {
      site_id: 'demo-site',
      customer_id: 'cust_001',
      product_id: 'prod_abc123',
      order_id: null,
      channel: 'web',
      type: 'review',
      rating: 5,
      text: 'Love this bracelet, still shiny after showers.',
      media_url: 'https://example.com/bracelet-1.jpg',
      status: 'pending',
      ai_score: 0.93,
      ai_label: 'looks_real_positive',
      ai_reasons:
        'Natural language, product-specific details, no obvious spam patterns.',
      moderator_id: null,
      moderator_notes: null,
      created_at: now,
      updated_at: now,
    };

    const sql = `
      INSERT INTO ugc (
        site_id, customer_id, product_id, order_id, channel, type, rating,
        text, media_url, status, ai_score, ai_label, ai_reasons,
        moderator_id, moderator_notes, created_at, updated_at
      )
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `;

    const params = [
      demo.site_id,
      demo.customer_id,
      demo.product_id,
      demo.order_id,
      demo.channel,
      demo.type,
      demo.rating,
      demo.text,
      demo.media_url,
      demo.status,
      demo.ai_score,
      demo.ai_label,
      demo.ai_reasons,
      demo.moderator_id,
      demo.moderator_notes,
      demo.created_at,
      demo.updated_at,
    ];

    db.run(sql, params, function (err2) {
      if (err2) {
        console.error('[DB] Error seeding demo UGC row:', err2);
      } else {
        console.log('[DB] Seeded demo UGC row with id', this.lastID);
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Helpers used by routes
// ---------------------------------------------------------------------------

// Insert a new UGC record
function insertUGC(record, callback) {
  const now = new Date().toISOString();
  const sql = `
    INSERT INTO ugc (
      site_id, customer_id, product_id, order_id, channel, type, rating,
      text, media_url, status, ai_score, ai_label, ai_reasons,
      moderator_id, moderator_notes, created_at, updated_at
    )
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `;

  const params = [
    record.site_id,
    record.customer_id || null,
    record.product_id,
    record.order_id || null,
    record.channel || null,
    record.type || null,
    record.rating || null,
    record.text,
    record.media_url || null,
    record.status || 'pending',
    record.ai_score || null,
    record.ai_label || null,
    record.ai_reasons || null,
    record.moderator_id || null,
    record.moderator_notes || null,
    record.created_at || now,
    record.updated_at || now,
  ];

  db.run(sql, params, function (err) {
    if (err) return callback(err);
    const saved = {
      id: this.lastID,
      ...record,
      created_at: record.created_at || now,
      updated_at: record.updated_at || now,
    };
    callback(null, saved);
  });
}

// Get all pending items, optionally filtered by site_id
function getPendingBySite(siteId, callback) {
  if (siteId) {
    db.all(
      `
      SELECT *
      FROM ugc
      WHERE status = 'pending' AND site_id = ?
      ORDER BY created_at DESC
    `,
      [siteId],
      callback
    );
  } else {
    db.all(
      `
      SELECT *
      FROM ugc
      WHERE status = 'pending'
      ORDER BY created_at DESC
    `,
      [],
      callback
    );
  }
}

// Get approved reviews for a given site + product
function getApprovedBySiteAndProduct(siteId, productId, callback) {
  db.all(
    `
    SELECT *
    FROM ugc
    WHERE status = 'approved'
      AND site_id = ?
      AND product_id = ?
    ORDER BY created_at DESC
  `,
    [siteId, productId],
    callback
  );
}

// Approve a UGC item and return the updated row
function approveUGC(id, moderatorId, moderatorNotes, callback) {
  const now = new Date().toISOString();

  db.run(
    `
    UPDATE ugc
    SET status = 'approved',
        moderator_id = ?,
        moderator_notes = ?,
        updated_at = ?
    WHERE id = ?
  `,
    [moderatorId, moderatorNotes, now, id],
    function (err) {
      if (err) return callback(err);
      if (this.changes === 0) return callback(null, null);

      db.get('SELECT * FROM ugc WHERE id = ?', [id], callback);
    }
  );
}

// ---------------------------------------------------------------------------

module.exports = {
  db,
  insertUGC,
  getPendingBySite,
  getApprovedBySiteAndProduct,
  approveUGC,
};
