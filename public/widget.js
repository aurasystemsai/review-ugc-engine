// public/widget.js
(function () {
  const API_BASE = "https://review-ugc-engine.onrender.com/api/ugc";

  function resolveProductId(container) {
    // 1) Explicit override on the container
    const explicit = container.getAttribute("data-product-id");
    if (explicit) return explicit;

    // 2) Shopify detection
    try {
      const sa = window.ShopifyAnalytics;
      if (sa && sa.meta && sa.meta.product && sa.meta.product.id) {
        return `shopify:${sa.meta.product.id}`;
      }
    } catch (e) {
      // ignore
    }

    // 3) Meta tag override (for headless / CMS)
    const meta = document.querySelector('meta[name="aura:product-id"]');
    if (meta && meta.content) return meta.content;

    // 4) Fallback: URL-based ID (works everywhere)
    return `url:${location.hostname}${location.pathname}`;
  }

  function injectStyles() {
    if (document.getElementById("aura-review-widget-styles")) return;

    const css = `
      .aura-reviews {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Inter", sans-serif;
        color: #0b1020;
        max-width: 600px;
      }
      .aura-reviews h3 {
        margin: 0 0 8px;
        font-size: 18px;
        font-weight: 600;
      }
      .aura-reviews p {
        margin: 0 0 8px;
        font-size: 13px;
        color: #4b5570;
      }
      .aura-reviews-list {
        border: 1px solid #e1e5f0;
        border-radius: 12px;
        padding: 12px 14px;
        margin-bottom: 16px;
        max-height: 260px;
        overflow-y: auto;
        background: #ffffff;
      }
      .aura-review-item {
        padding: 8px 0;
        border-bottom: 1px solid #eef1f7;
      }
      .aura-review-item:last-child {
        border-bottom: none;
      }
      .aura-review-rating {
        font-size: 13px;
        color: #f59e0b;
        margin-bottom: 4px;
      }
      .aura-review-text {
        font-size: 13px;
      }
      .aura-review-meta {
        font-size: 11px;
        color: #9aa3bd;
        margin-top: 4px;
      }
      .aura-review-form {
        border-radius: 12px;
        border: 1px solid #e1e5f0;
        padding: 12px 14px;
        background: #f8fafc;
      }
      .aura-field {
        margin-bottom: 8px;
        font-size: 13px;
      }
      .aura-field label {
        display: block;
        margin-bottom: 4px;
        font-weight: 500;
      }
      .aura-field input,
      .aura-field textarea,
      .aura-field select {
        width: 100%;
        border-radius: 8px;
        border: 1px solid #d0d7ec;
        padding: 6px 8px;
        font-size: 13px;
        font-family: inherit;
        box-sizing: border-box;
      }
      .aura-field textarea {
        resize: vertical;
        min-height: 60px;
      }
      .aura-submit-btn {
        border: none;
        border-radius: 999px;
        padding: 8px 16px;
        background: linear-gradient(135deg, #00f0ff, #00b3ff);
        color: #020617;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
      }
      .aura-message {
        margin-top: 6px;
        font-size: 12px;
      }
    `;

    const style = document.createElement("style");
    style.id = "aura-review-widget-styles";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function renderWidget(container) {
    injectStyles();

    const productId = resolveProductId(container);

    container.innerHTML = `
      <div class="aura-reviews">
        <h3>Customer Reviews</h3>
        <div class="aura-reviews-list" id="aura-reviews-list">
          <p>Loading reviews…</p>
        </div>

        <div class="aura-review-form">
          <h3>Write a review</h3>
          <form id="aura-review-form">
            <div class="aura-field">
              <label for="aura-rating">Rating</label>
              <select id="aura-rating" required>
                <option value="">Select…</option>
                <option value="5">5 – Amazing</option>
                <option value="4">4 – Good</option>
                <option value="3">3 – Okay</option>
                <option value="2">2 – Poor</option>
                <option value="1">1 – Bad</option>
              </select>
            </div>
            <div class="aura-field">
              <label for="aura-text">Review</label>
              <textarea id="aura-text" required></textarea>
            </div>
            <div class="aura-field">
              <label for="aura-name">Name (optional)</label>
              <input id="aura-name" placeholder="Your name" />
            </div>
            <div class="aura-field">
              <label for="aura-media">Photo URL (optional)</label>
              <input id="aura-media" placeholder="https://…" />
            </div>
            <button type="submit" class="aura-submit-btn">Submit review</button>
            <div class="aura-message" id="aura-message"></div>
          </form>
        </div>
      </div>
    `;

    const listEl = container.querySelector("#aura-reviews-list");
    const formEl = container.querySelector("#aura-review-form");
    const msgEl = container.querySelector("#aura-message");

    async function loadReviews() {
      try {
        const res = await fetch(`${API_BASE}/product/${encodeURIComponent(productId)}`);
        const data = await res.json();

        if (!Array.isArray(data) || data.length === 0) {
          listEl.innerHTML = `<p>No reviews yet. Be the first to review this product.</p>`;
          return;
        }

        listEl.innerHTML = "";
        data.forEach(item => {
          const div = document.createElement("div");
          div.className = "aura-review-item";
          const created = item.created_at ? new Date(item.created_at).toLocaleDateString() : "";
          const name = item.customer_id || "Customer";
          div.innerHTML = `
            <div class="aura-review-rating">⭐ ${item.rating} / 5</div>
            <div class="aura-review-text">${item.text || ""}</div>
            <div class="aura-review-meta">${name} • ${created}</div>
          `;
          listEl.appendChild(div);
        });
      } catch (e) {
        console.error(e);
        listEl.innerHTML = `<p>Could not load reviews.</p>`;
      }
    }

    formEl.addEventListener("submit", async (e) => {
      e.preventDefault();
      msgEl.textContent = "Submitting…";

      const rating = parseInt(container.querySelector("#aura-rating").value, 10);
      const text = container.querySelector("#aura-text").value.trim();
      const name = container.querySelector("#aura-name").value.trim() || "anonymous";
      const media = container.querySelector("#aura-media").value.trim() || null;

      try {
        const res = await fetch(`${API_BASE}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerId: name,
            productId,
            type: "review",
            rating,
            text,
            mediaUrl: media
          })
        });

        if (!res.ok) {
          msgEl.textContent = "Something went wrong. Please try again.";
          return;
        }

        msgEl.textContent = "Thanks! Your review is awaiting approval.";
        formEl.reset();
      } catch (err) {
        console.error(err);
        msgEl.textContent = "Could not submit. Please try again.";
      }
    });

    loadReviews();
  }

  function init() {
    const container =
      document.getElementById("aura-review-widget") ||
      document.querySelector("[data-aura-review-widget]");

    if (!container) return;
    renderWidget(container);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
