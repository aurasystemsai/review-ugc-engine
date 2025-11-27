// public/widget.js
// AURA • Reviews Widget – floating launcher + panel

(function () {
  'use strict';

  if (!window.AURA_WIDGET) {
    window.AURA_WIDGET = {};
  }

  /**
   * Inject minimal styles once
   */
  function ensureStyles() {
    if (document.getElementById('aura-reviews-styles')) return;

    var css = `
      .aura-rw-root {
        position: fixed;
        z-index: 999999;
        bottom: 20px;
        right: 20px;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Inter", sans-serif;
      }

      .aura-rw-launcher {
        background: radial-gradient(circle at 0 0, #00f0ff 0, #00111a 45%, #00040a 100%);
        border-radius: 999px;
        padding: 10px 16px;
        display: flex;
        align-items: center;
        gap: 8px;
        border: 1px solid rgba(0, 240, 255, 0.4);
        box-shadow: 0 18px 45px rgba(0, 0, 0, 0.6);
        cursor: pointer;
        color: #e7f6ff;
        font-size: 13px;
        font-weight: 500;
        backdrop-filter: blur(18px);
      }

      .aura-rw-launcher-icon {
        width: 22px;
        height: 22px;
        border-radius: 999px;
        border: 1px solid rgba(0, 240, 255, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 700;
        background: radial-gradient(circle at 30% 0, #00f0ff 0, #041726 65%, #00040a 100%);
        color: #e7f6ff;
      }

      .aura-rw-launcher-label {
        white-space: nowrap;
      }

      .aura-rw-panel {
        position: fixed;
        z-index: 999998;
        bottom: 72px;
        right: 20px;
        width: min(420px, 100vw - 32px);
        max-height: min(520px, 80vh);
        background: radial-gradient(circle at top, #061122 0, #020611 55%, #000208 100%);
        border-radius: 18px;
        border: 1px solid rgba(0, 240, 255, 0.32);
        box-shadow: 0 26px 60px rgba(0, 0, 0, 0.85);
        color: #e7f6ff;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        opacity: 0;
        transform: translateY(12px);
        pointer-events: none;
        transition: opacity 0.18s ease-out, transform 0.18s ease-out;
      }

      .aura-rw-panel--open {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
      }

      .aura-rw-header {
        padding: 14px 16px 10px;
        border-bottom: 1px solid rgba(0, 240, 255, 0.18);
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
      }

      .aura-rw-title-block {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .aura-rw-title {
        font-size: 14px;
        font-weight: 600;
      }

      .aura-rw-subtitle {
        font-size: 11px;
        color: #9fb3d8;
      }

      .aura-rw-close {
        border-radius: 999px;
        width: 26px;
        height: 26px;
        border: 1px solid rgba(159, 179, 216, 0.5);
        background: transparent;
        color: #9fb3d8;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 14px;
      }

      .aura-rw-body {
        padding: 10px 16px 14px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        overflow: auto;
      }

      .aura-rw-form {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 10px 10px 10px;
        border-radius: 14px;
        border: 1px solid rgba(0, 240, 255, 0.2);
        background: radial-gradient(circle at top left, rgba(0, 240, 255, 0.16) 0, rgba(0, 240, 255, 0.02) 46%, rgba(0, 0, 0, 0.8) 100%);
      }

      .aura-rw-label {
        font-size: 11px;
        color: #9fb3d8;
        margin-bottom: 2px;
      }

      .aura-rw-stars-select {
        display: inline-flex;
        gap: 2px;
        font-size: 15px;
        cursor: pointer;
      }

      .aura-rw-star {
        opacity: 0.5;
      }

      .aura-rw-star--active {
        opacity: 1;
        color: #ffd76b;
      }

      .aura-rw-textarea {
        resize: vertical;
        min-height: 60px;
        max-height: 120px;
        border-radius: 10px;
        border: 1px solid rgba(159, 179, 216, 0.6);
        background: rgba(1, 4, 12, 0.9);
        padding: 6px 8px;
        color: #e7f6ff;
        font-size: 12px;
      }

      .aura-rw-textarea:focus {
        outline: none;
        border-color: rgba(0, 240, 255, 0.9);
        box-shadow: 0 0 0 1px rgba(0, 240, 255, 0.6);
      }

      .aura-rw-submit {
        margin-top: 4px;
        align-self: flex-end;
        padding: 6px 10px;
        border-radius: 999px;
        border: none;
        background: linear-gradient(120deg, #00f0ff, #00c8ff);
        color: #04101a;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
      }

      .aura-rw-status {
        font-size: 11px;
        color: #9fb3d8;
        min-height: 14px;
      }

      .aura-rw-status--error {
        color: #ff6b80;
      }

      .aura-rw-status--success {
        color: #5fffd3;
      }

      .aura-rw-reviews-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-top: 4px;
      }

      .aura-rw-review-card {
        border-radius: 12px;
        border: 1px solid rgba(159, 179, 216, 0.35);
        padding: 8px 10px;
        background: radial-gradient(circle at top left, rgba(0, 240, 255, 0.08) 0, rgba(1, 5, 16, 0.95) 60%);
      }

      .aura-rw-review-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
        gap: 6px;
      }

      .aura-rw-review-name {
        font-size: 12px;
        font-weight: 500;
      }

      .aura-rw-review-stars {
        font-size: 11px;
        color: #ffd76b;
      }

      .aura-rw-review-text {
        font-size: 11px;
        color: #c0d4ff;
      }

      .aura-rw-empty {
        font-size: 11px;
        color: #7c8fb4;
      }

      @media (max-width: 600px) {
        .aura-rw-panel {
          right: 16px;
          left: 16px;
          width: auto;
        }

        .aura-rw-root {
          right: 16px;
          bottom: 16px;
        }
      }
    `;

    var styleEl = document.createElement('style');
    styleEl.id = 'aura-reviews-styles';
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  }

  /**
   * Utility: fetch JSON with error handling
   */
  function fetchJson(url, opts) {
    return fetch(url, opts || {}).then(function (res) {
      if (!res.ok) {
        var err = new Error('HTTP ' + res.status + ' for ' + url);
        err.status = res.status;
        throw err;
      }
      return res.json();
    });
  }

  /**
   * Build productId from URL – works on any platform
   */
  function getProductId() {
    var path = window.location.pathname || '/';
    var origin = window.location.origin || '';
    return 'url:' + origin + path;
  }

  /**
   * Mount reviews widget
   * opts: { apiBase, config, siteId }
   */
  window.AURA_WIDGET.mountReviews = function mountReviews(opts) {
    ensureStyles();

    var apiBase = (opts && opts.apiBase) || '';
    var siteId = (opts && opts.siteId) || ('domain:' + window.location.hostname.replace(/^www\./, ''));
    var productId = getProductId();

    // Root container
    var existingRoot = document.getElementById('aura-rw-root');
    if (existingRoot) {
      // Already mounted
      return;
    }

    var root = document.createElement('div');
    root.id = 'aura-rw-root';
    root.className = 'aura-rw-root';

    root.innerHTML = `
      <div class="aura-rw-launcher" aria-label="Open reviews" role="button">
        <div class="aura-rw-launcher-icon">A</div>
        <div class="aura-rw-launcher-label">Reviews</div>
      </div>
      <div class="aura-rw-panel" aria-hidden="true">
        <div class="aura-rw-header">
          <div class="aura-rw-title-block">
            <div class="aura-rw-title">Customer reviews</div>
            <div class="aura-rw-subtitle">For this page</div>
          </div>
          <button type="button" class="aura-rw-close" aria-label="Close reviews">&times;</button>
        </div>
        <div class="aura-rw-body">
          <form class="aura-rw-form">
            <div>
              <div class="aura-rw-label">Your rating</div>
              <div class="aura-rw-stars-select" data-rating="5" aria-label="Choose rating">
                <span data-value="1" class="aura-rw-star aura-rw-star--active">★</span>
                <span data-value="2" class="aura-rw-star aura-rw-star--active">★</span>
                <span data-value="3" class="aura-rw-star aura-rw-star--active">★</span>
                <span data-value="4" class="aura-rw-star aura-rw-star--active">★</span>
                <span data-value="5" class="aura-rw-star aura-rw-star--active">★</span>
              </div>
            </div>
            <div>
              <div class="aura-rw-label">Your review</div>
              <textarea class="aura-rw-textarea" name="text" required placeholder="Share your experience..."></textarea>
            </div>
            <button type="submit" class="aura-rw-submit">Submit review</button>
            <div class="aura-rw-status"></div>
          </form>

          <div class="aura-rw-reviews-list" data-role="reviews-list">
            <div class="aura-rw-empty">Loading reviews…</div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(root);

    var launcher = root.querySelector('.aura-rw-launcher');
    var panel = root.querySelector('.aura-rw-panel');
    var closeBtn = root.querySelector('.aura-rw-close');
    var form = root.querySelector('.aura-rw-form');
    var textarea = root.querySelector('.aura-rw-textarea');
    var statusEl = root.querySelector('.aura-rw-status');
    var starsContainer = root.querySelector('.aura-rw-stars-select');
    var reviewsList = root.querySelector('[data-role="reviews-list"]');

    // Toggle helpers
    function openPanel() {
      panel.classList.add('aura-rw-panel--open');
      panel.setAttribute('aria-hidden', 'false');
    }
    function closePanel() {
      panel.classList.remove('aura-rw-panel--open');
      panel.setAttribute('aria-hidden', 'true');
    }

    launcher.addEventListener('click', function () {
      if (panel.classList.contains('aura-rw-panel--open')) {
        closePanel();
      } else {
        openPanel();
      }
    });

    closeBtn.addEventListener('click', function () {
      closePanel();
    });

    // Rating stars interaction
    function setRating(val) {
      var rating = Math.min(5, Math.max(1, val || 5));
      starsContainer.setAttribute('data-rating', String(rating));
      var stars = starsContainer.querySelectorAll('.aura-rw-star');
      stars.forEach(function (star) {
        var v = Number(star.getAttribute('data-value'));
        if (v <= rating) {
          star.classList.add('aura-rw-star--active');
        } else {
          star.classList.remove('aura-rw-star--active');
        }
      });
    }

    starsContainer.addEventListener('click', function (evt) {
      var target = evt.target;
      if (!target || !target.getAttribute) return;
      var v = Number(target.getAttribute('data-value'));
      if (!v) return;
      setRating(v);
    });

    setRating(5); // default

    // Load approved reviews for this page
    function renderReviews(items) {
      reviewsList.innerHTML = '';
      if (!items || !items.length) {
        reviewsList.innerHTML = '<div class="aura-rw-empty">No reviews yet. Be the first to leave one.</div>';
        return;
      }

      items.forEach(function (item) {
        var card = document.createElement('div');
        card.className = 'aura-rw-review-card';

        var name = item.customer_id || 'Verified buyer';
        var rating = Number(item.rating || 5);
        var stars = '★★★★★☆☆☆☆☆'.slice(0, rating);

        card.innerHTML = `
          <div class="aura-rw-review-header">
            <div class="aura-rw-review-name">${escapeHtml(name)}</div>
            <div class="aura-rw-review-stars">${stars}</div>
          </div>
          <div class="aura-rw-review-text">${escapeHtml(item.text || '')}</div>
        `;
        reviewsList.appendChild(card);
      });
    }

    function escapeHtml(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function loadReviews() {
      var url = apiBase + '/api/ugc/product/' + encodeURIComponent(productId);
      fetchJson(url)
        .then(function (items) {
          renderReviews(items || []);
        })
        .catch(function () {
          reviewsList.innerHTML = '<div class="aura-rw-empty">Unable to load reviews right now.</div>';
        });
    }

    loadReviews();

    // Submit handler
    form.addEventListener('submit', function (evt) {
      evt.preventDefault();
      statusEl.textContent = '';
      statusEl.classList.remove('aura-rw-status--error', 'aura-rw-status--success');

      var rating = Number(starsContainer.getAttribute('data-rating') || 5);
      var text = (textarea.value || '').trim();
      if (!text) {
        statusEl.textContent = 'Please write a short review.';
        statusEl.classList.add('aura-rw-status--error');
        return;
      }

      var payload = {
        customer_id: null,
        product_id: productId,
        rating: rating,
        text: text,
        media_url: null,
        channel: 'web-widget',
        site_id: siteId
      };

      var url = apiBase + '/api/ugc/submit';

      fetchJson(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
        .then(function () {
          statusEl.textContent = 'Thanks for your review! It will appear once approved.';
          statusEl.classList.add('aura-rw-status--success');
          textarea.value = '';
          setRating(5);
          // Reload approved reviews a bit later
          setTimeout(loadReviews, 1500);
        })
        .catch(function (err) {
          console.error('[AURA Reviews] Submit failed', err);
          statusEl.textContent = 'Something went wrong. Please try again in a moment.';
          statusEl.classList.add('aura-rw-status--error');
        });
    });
  };
})();
