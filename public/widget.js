(function () {
  const script =
    document.currentScript ||
    document.querySelector('script[data-aura-site-id]') ||
    document.querySelector('script[src*="widget.js"]');

  if (!script) {
    console.warn('[AURA] widget.js: no script tag found');
    return;
  }

  const siteId = script.getAttribute('data-aura-site-id') || '';
  const serviceBase =
    script.getAttribute('data-aura-service') ||
    (window.location.hostname === 'localhost'
      ? 'http://localhost:4001'
      : 'https://review-ugc-engine.onrender.com');

  const productId =
    script.getAttribute('data-aura-product-id') ||
    window.location.pathname ||
    'page';

  // -----------------------------
  // Styles
  // -----------------------------
  function injectStyles() {
    if (document.getElementById('aura-review-styles')) return;

    const style = document.createElement('style');
    style.id = 'aura-review-styles';
    style.textContent = `
      .aura-review-button {
        position: fixed;
        right: 24px;
        bottom: 24px;
        z-index: 99999;
        background: radial-gradient(circle at top left, #00f0ff, #0073ff);
        color: #ffffff;
        border: none;
        border-radius: 999px;
        padding: 10px 18px;
        font-size: 14px;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        box-shadow: 0 18px 35px rgba(0, 0, 0, 0.55);
        cursor: pointer;
      }

      .aura-review-overlay {
        position: fixed;
        inset: 0;
        background: rgba(3, 7, 18, 0.78);
        z-index: 99998;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .aura-review-modal {
        width: 100%;
        max-width: 420px;
        background: rgba(10, 15, 30, 0.96);
        border-radius: 18px;
        border: 1px solid rgba(0, 240, 255, 0.24);
        padding: 20px 22px;
        color: #e7f6ff;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        box-shadow: 0 26px 60px rgba(0, 0, 0, 0.8);
      }

      .aura-review-modal h3 {
        margin: 0 0 4px 0;
        font-size: 18px;
      }

      .aura-review-modal p {
        margin: 0 0 16px 0;
        font-size: 13px;
        color: #9fb3d8;
      }

      .aura-review-field {
        margin-bottom: 10px;
      }

      .aura-review-field label {
        display: block;
        font-size: 12px;
        margin-bottom: 4px;
      }

      .aura-review-field select,
      .aura-review-field textarea {
        width: 100%;
        border-radius: 10px;
        border: 1px solid rgba(148, 163, 184, 0.6);
        background: rgba(15, 23, 42, 0.95);
        color: #e5e7eb;
        font-size: 13px;
        padding: 7px 8px;
        resize: vertical;
        min-height: 72px;
      }

      .aura-review-actions {
        margin-top: 12px;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }

      .aura-review-btn-secondary {
        background: transparent;
        border-radius: 999px;
        border: 1px solid rgba(148, 163, 184, 0.8);
        color: #e5e7eb;
        padding: 7px 14px;
        font-size: 13px;
        cursor: pointer;
      }

      .aura-review-btn-primary {
        background: linear-gradient(135deg, #00f0ff, #00c4ff);
        border-radius: 999px;
        border: none;
        color: #020617;
        padding: 7px 16px;
        font-size: 13px;
        cursor: pointer;
      }

      .aura-review-status {
        margin-top: 8px;
        font-size: 12px;
        color: #9fb3d8;
      }
    `;
    document.head.appendChild(style);
  }

  // -----------------------------
  // UI elements
  // -----------------------------
  let overlayEl = null;

  function closeOverlay() {
    if (overlayEl && overlayEl.parentNode) {
      overlayEl.parentNode.removeChild(overlayEl);
    }
    overlayEl = null;
  }

  function openOverlay() {
    if (overlayEl) return;

    overlayEl = document.createElement('div');
    overlayEl.className = 'aura-review-overlay';

    overlayEl.innerHTML = `
      <div class="aura-review-modal">
        <h3>Share your experience</h3>
        <p>Help us improve by leaving a quick review.</p>

        <div class="aura-review-field">
          <label for="aura-review-rating">Rating</label>
          <select id="aura-review-rating">
            <option value="5">★★★★★ – 5</option>
            <option value="4">★★★★☆ – 4</option>
            <option value="3">★★★☆☆ – 3</option>
            <option value="2">★★☆☆☆ – 2</option>
            <option value="1">★☆☆☆☆ – 1</option>
          </select>
        </div>

        <div class="aura-review-field">
          <label for="aura-review-text">Review</label>
          <textarea id="aura-review-text" placeholder="What do you think?"></textarea>
        </div>

        <div class="aura-review-actions">
          <button type="button" class="aura-review-btn-secondary" id="aura-review-cancel">Cancel</button>
          <button type="button" class="aura-review-btn-primary" id="aura-review-submit">Submit</button>
        </div>

        <div class="aura-review-status" id="aura-review-status"></div>
      </div>
    `;

    document.body.appendChild(overlayEl);

    document
      .getElementById('aura-review-cancel')
      .addEventListener('click', closeOverlay);

    document
      .getElementById('aura-review-submit')
      .addEventListener('click', submitReview);
  }

  function createFloatingButton() {
    if (document.getElementById('aura-review-button')) return;

    const btn = document.createElement('button');
    btn.id = 'aura-review-button';
    btn.className = 'aura-review-button';
    btn.textContent = 'Reviews';

    btn.addEventListener('click', openOverlay);

    document.body.appendChild(btn);
  }

  // -----------------------------
  // Submit handler
  // -----------------------------
  function submitReview() {
    const ratingEl = document.getElementById('aura-review-rating');
    const textEl = document.getElementById('aura-review-text');
    const statusEl = document.getElementById('aura-review-status');

    if (!ratingEl || !textEl) return;

    const rating = parseInt(ratingEl.value, 10);
    const text = (textEl.value || '').trim();

    if (!text) {
      statusEl.textContent = 'Please write a few words before submitting.';
      return;
    }

    statusEl.textContent = 'Submitting...';

    const payload = {
      customerId: null,
      productId,
      orderId: null,
      channel: 'web',
      type: 'review',
      rating,
      text,
      mediaUrl: null,
      siteId
    };

    fetch(serviceBase + '/api/ugc/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then((res) => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(() => {
        statusEl.textContent = 'Thanks! Your review is pending moderation.';
        setTimeout(closeOverlay, 1200);
      })
      .catch((err) => {
        console.error('[AURA] Submit error', err);
        statusEl.textContent =
          'Sorry, something went wrong. Please try again in a moment.';
      });
  }

  // -----------------------------
  // Boot
  // -----------------------------
  function boot() {
    injectStyles();
    createFloatingButton();
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    boot();
  } else {
    document.addEventListener('DOMContentLoaded', boot);
  }
})();
