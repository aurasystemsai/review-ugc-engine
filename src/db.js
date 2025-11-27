const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'ugc.db');
const db = new sqlite3.Database(dbPath);

// Create table if it doesn't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS ugc_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id TEXT,
      product_id TEXT,
      order_id TEXT,
      channel TEXT,
      type TEXT,
      rating INTEGER,
      text TEXT,
      media_url TEXT,
      status TEXT,
      ai_score REAL,
      moderator_id TEXT,
      moderator_notes TEXT,
      created_at TEXT,
      updated_at TEXT
    )
  `);
});

module.exports = db;
