// src/ugcRoutes.js
// AURA • Review UGC Engine routes (real AI, no placeholders)

const express = require('express');
const axios = require('axios');
const {
  insertUGC,
  getPendingBySite,
  getApprovedBySiteAndProduct,
  approveUGC,
} = require('./db');

const router = express.Router();

// ---------------------------------------------------------------------------
// AURA Core AI config
// ---------------------------------------------------------------------------

const AURA_CORE_URL = process.env.AURA_CORE_URL || 'http://localhost:4100';
const AURA_CORE_MODEL = process.env.AURA_CORE_MODEL || 'phi3';

// Call your local AURA Core AI server to score and classify a review.
// Expected JSON response (chat message content) is something like:
//
// {
//   "score": 0.93,
//   "label": "looks_real_positive",
//   "reasons": "Natural language, product-specific details, no obvious spam patterns."
// }
//
// If anything goes wrong, we fall back to a neutral score and mark it for review.
async function scoreWithAuraCore({ siteId, productId, rating, text }) {
  try {
    const systemPrompt = `
You are AURA Core AI, an internal moderation and quality model for ecommerce UGC.
Your job is to analyse customer reviews and return STRICT JSON with the keys:
- score: number between 0 and 1 (1 = extremely trustworthy & relevant)
- label: short snake_case label like "looks_real_positive", "possible_spam", "toxic_language", "mixed"
- reasons: short explanation for a human moderator.

Important:
- Respond with JSON ONLY. No prose, no extra text.
`.trim();

    const userPrompt = `
Site: ${siteId || 'unknown'}
Product: ${productId || 'unknown'}
Rating (1–5): ${rating || 'n/a'}

Review text:
"""${text || ''}"""
`.trim();

    const response = await axios.post(
      `${AURA_CORE_URL}/v1/chat/completions`,
      {
        model: AURA_CORE_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 256,
      },
      {
        timeout: 15_000,
      }
    );

    const content =
      response?.data?.choices?.[0]?.message?.content?.trim() || '{}';

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.error('[AURA CORE] Failed to parse JSON from model, raw:', content);
      parsed = {};
    }

    const score =
      typeof parsed.score === 'number' && !Number.isNaN(parsed.score)
        ? parsed.score
        : 0.5;

    const label = typeof parsed.label === 'string' ? parsed.label : 'ai_uncertain';
    const reasons =
      typeof parsed.reasons === 'string'
        ? parsed.reasons
        : 'AI could not provide clear reasons; manual review recommended.';

    return {
      ai_score: score,
      ai_label: label,
      ai_reasons: reasons,
    };
  } catch (err) {
    console.error('[AURA CORE] Error talking to AURA Core AI:', err.message);

    // Safe fallback – we still store the review but clearly flag it
    return {
      ai_score: 0.5,
      ai_label: 'ai_error',
      ai_reasons:
        'AURA Core AI was unavailable or returned an error; please review this manually.',
    };
  }
}

// ---------------------------------------------------------------------------
// POST /api/ugc/submit
// Called by the onsite widget to submit a new review / UGC item
// ---------------------------------------------------------------------------

router.post('/submit', async (req, res) => {
  try {
    const {
      site_id,
      customer_id,
      product_id,
      order_id,
      channel,
      type,
      rating,
      text,
      media_url,
    } = req.body || {};

    if (!site_id || !product_id || !text) {
      return res.status(400).json({
        error: 'site_id, product_id and text are required',
      });
    }

    // 1) Run through AURA Core AI for scoring / classification
    const ai = await scoreWithAuraCore({
      siteId: site_id,
      productId: product_id,
      rating,
      text,
    });

    const now = new Date().toISOString();

    // 2) Build row for SQLite
    const record = {
      site_id,
      customer_id: customer_id || null,
      product_id,
      order_id: order_id || null,
      channel: channel || 'web',
      type: type || 'review',
      rating: rating || null,
      text,
      media_url: media_url || null,
      status: 'pending', // always start in pending
      ai_score: ai.ai_score,
      ai_label: ai.ai_label,
      ai_reasons: ai.ai_reasons,
      moderator_id: null,
      moderator_notes: null,
      created_at: now,
      updated_at: now,
    };

    // 3) Persist to DB
    insertUGC(record, (err, saved) => {
      if (err) {
        console.error('[UGC] insertUGC error:', err);
        return res.status(500).json({ error: 'Failed to save UGC item' });
      }

      return res.json({
        ok: true,
        review: saved,
      });
    });
  } catch (err) {
    console.error('[UGC] /submit unexpected error:', err);
    res.status(500).json({ error: 'Unexpected server error' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/ugc/moderation/pending
// Optional ?site_id=xxx – filters by site, else returns all pending
// ---------------------------------------------------------------------------

router.get('/moderation/pending', (req, res) => {
  const { site_id } = req.query;

  getPendingBySite(site_id || null, (err, rows) => {
    if (err) {
      console.error('[UGC] getPendingBySite error:', err);
      return res.status(500).json({ error: 'Failed to fetch pending items' });
    }

    res.json(rows || []);
  });
});

// ---------------------------------------------------------------------------
// POST /api/ugc/moderation/:id/approve
// Body: { moderator_id?, moderator_notes? }
// Marks item as approved & moves it to the public feed
// ---------------------------------------------------------------------------

router.post('/moderation/:id/approve', (req, res) => {
  const { id } = req.params;
  const { moderator_id, moderator_notes } = req.body || {};

  if (!id) {
    return res.status(400).json({ error: 'Missing id parameter' });
  }

  approveUGC(
    id,
    moderator_id || 'system',
    moderator_notes || null,
    (err, updatedRow) => {
      if (err) {
        console.error('[UGC] approveUGC error:', err);
        return res.status(500).json({ error: 'Failed to approve item' });
      }

      if (!updatedRow) {
        return res.status(404).json({ error: 'UGC item not found' });
      }

      res.json({
        ok: true,
        review: updatedRow,
      });
    }
  );
});

// ---------------------------------------------------------------------------
// GET /api/ugc/approved
// Public endpoint for storefronts / widgets
// Requires ?site_id=xxx&product_id=yyy
// ---------------------------------------------------------------------------

router.get('/approved', (req, res) => {
  const { site_id, product_id } = req.query;

  if (!site_id || !product_id) {
    return res.status(400).json({
      error: 'site_id and product_id are required',
    });
  }

  getApprovedBySiteAndProduct(site_id, product_id, (err, rows) => {
    if (err) {
      console.error('[UGC] getApprovedBySiteAndProduct error:', err);
      return res.status(500).json({ error: 'Failed to fetch approved reviews' });
    }

    res.json(rows || []);
  });
});

// ---------------------------------------------------------------------------

module.exports = router;
