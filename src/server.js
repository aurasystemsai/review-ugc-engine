// src/server.js - AURA UGC API with file persistence + AURA Core AI scoring + moderation + status tabs
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const app = express();
// Render will inject PORT. Locally we use 4001.
const PORT = process.env.PORT || 4001;

// URL of AURA Core AI (env in production, localhost in dev)
const AURA_CORE_URL =
  process.env.AURA_CORE_URL || "http://localhost:4100";

// ---------- PATHS ----------
const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "reviews.json");

// ---------- MIDDLEWARE ----------
app.use(cors());
app.use(express.json());

// ---------- UTIL: ENSURE / LOAD / SAVE ----------
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadReviews() {
  try {
    ensureDataDir();

    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, "[]", "utf8");
      return [];
    }

    const raw = fs.readFileSync(DATA_FILE, "utf8");
    if (!raw.trim()) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }

    console.warn("reviews.json did not contain an array, resetting.");
    return [];
  } catch (err) {
    console.error("Error loading reviews.json:", err);
    return [];
  }
}

function saveReviews(list) {
  try {
    ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving reviews.json:", err);
  }
}

// ---------- AI SCORING VIA AURA CORE ----------
async function scoreWithAuraCore({
  text,
  rating,
  channel,
  product_id,
  customer_id
}) {
  try {
    const response = await axios.post(
      `${AURA_CORE_URL}/api/ugc-score`,
      {
        text,
        rating,
        channel,
        product_id,
        customer_id
      },
      { timeout: 8000 }
    );

    const { ai_score, ai_label, ai_reasons } = response.data || {};

    if (
      typeof ai_score === "number" &&
      typeof ai_label === "string" &&
      typeof ai_reasons === "string"
    ) {
      return { ai_score, ai_label, ai_reasons };
    }

    throw new Error("Invalid response from AURA Core AI");
  } catch (err) {
    console.error("Error calling AURA Core AI:", err.message);

    const length = text.trim().length;
    let baseScore = 0.5;
    if (length > 40) baseScore += 0.2;
    if (rating >= 4) baseScore += 0.2;
    if (length < 15) baseScore -= 0.3;

    const ai_score = Math.max(0, Math.min(1, Number(baseScore.toFixed(2))));
    const ai_label =
      ai_score >= 0.85
        ? "looks_real_positive"
        : ai_score >= 0.6
        ? "needs_review"
        : "likely_spam_or_low_quality";

    const ai_reasons =
      "Fallback scoring used because AURA Core AI was unavailable.";

    return { ai_score, ai_label, ai_reasons };
  }
}

// ---------- IN-MEMORY DATA (BACKED BY FILE) ----------
let pendingReviews = loadReviews();

if (pendingReviews.length === 0) {
  pendingReviews = [
    {
      id: 1,
      site_id: "demo-site",
      customer_id: "cust_001",
      product_id: "prod_abc123",
      order_id: null,
      channel: "web",
      type: "review",
      rating: 5,
      text: "Love this bracelet, still shiny after showers.",
      media_url: "https://example.com/bracelet-1.jpg",
      status: "pending",
      ai_score: 0.93,
      ai_label: "looks_real_positive",
      ai_reasons:
        "Natural language, product-specific details, no obvious spam patterns.",
      moderator_id: null,
      moderator_notes: null,
      created_at: "2025-11-29T12:33:41Z",
      updated_at: "2025-11-29T12:33:41Z"
    }
  ];

  saveReviews(pendingReviews);
}

// ---------- HEALTH CHECK ----------
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "UGC Engine",
    auraCoreUrl: AURA_CORE_URL
  });
});

// ---------- GET ALL (status filter) ----------
app.get("/api/ugc/moderation/all", (req, res) => {
  const siteId = req.query.site_id;
  const statusParam = (req.query.status || "all").toLowerCase();

  if (!siteId) {
    return res.status(400).json({ error: "site_id query parameter required" });
  }

  let list = pendingReviews.filter((r) => r.site_id === siteId);

  if (statusParam !== "all") {
    list = list.filter(
      (r) => (r.status || "pending").toLowerCase() === statusParam
    );
  }

  res.json(list);
});

// ---------- LEGACY PENDING ----------
app.get("/api/ugc/moderation/pending", (req, res) => {
  const siteId = req.query.site_id;

  if (!siteId) {
    return res.status(400).json({ error: "site_id query parameter required" });
  }

  const results = pendingReviews.filter(
    (r) => r.site_id === siteId && (r.status || "pending") === "pending"
  );

  res.json(results);
});

// ---------- CREATE REVIEW ----------
app.post("/api/ugc/submit", async (req, res) => {
  const body = req.body;

  if (!body.site_id || !body.customer_id || !body.product_id || !body.text) {
    return res.status(400).json({
      error: "Required: site_id, customer_id, product_id, text"
    });
  }

  const now = new Date().toISOString();

  const { ai_score, ai_label, ai_reasons } = await scoreWithAuraCore({
    text: body.text,
    rating: body.rating,
    channel: body.channel,
    product_id: body.product_id,
    customer_id: body.customer_id
  });

  const maxId = pendingReviews.reduce(
    (max, r) => (r.id > max ? r.id : max),
    0
  );

  const newReview = {
    id: maxId + 1,
    site_id: body.site_id,
    customer_id: body.customer_id,
    product_id: body.product_id,
    order_id: body.order_id || null,
    channel: body.channel || "web",
    type: body.type || "review",
    rating: body.rating || null,
    text: body.text,
    media_url: body.media_url || null,
    status: "pending",
    ai_score,
    ai_label,
    ai_reasons,
    moderator_id: null,
    moderator_notes: null,
    created_at: now,
    updated_at: now
  };

  pendingReviews.push(newReview);
  saveReviews(pendingReviews);

  console.log("NEW REVIEW SAVED:", newReview);

  res.status(201).json(newReview);
});

// ---------- APPROVE ----------
app.post("/api/ugc/moderation/:id/approve", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { moderator_id, moderator_notes } = req.body || {};

  const index = pendingReviews.findIndex((r) => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Review not found" });
  }

  const now = new Date().toISOString();

  pendingReviews[index] = {
    ...pendingReviews[index],
    status: "approved",
    moderator_id: moderator_id || null,
    moderator_notes: moderator_notes || null,
    updated_at: now
  };

  saveReviews(pendingReviews);
  res.json(pendingReviews[index]);
});

// ---------- REJECT ----------
app.post("/api/ugc/moderation/:id/reject", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { moderator_id, moderator_notes } = req.body || {};

  const index = pendingReviews.findIndex((r) => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Review not found" });
  }

  const now = new Date().toISOString();

  pendingReviews[index] = {
    ...pendingReviews[index],
    status: "rejected",
    moderator_id: moderator_id || null,
    moderator_notes: moderator_notes || null,
    updated_at: now
  };

  saveReviews(pendingReviews);
  res.json(pendingReviews[index]);
});

// ---------- START SERVER ----------
app.listen(PORT, () => {
  console.log(
    `UGC API (persistent + AURA Core AI + moderation) running on port ${PORT}`
  );
});
