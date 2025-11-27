// public/widget.js
// AURA • Review Widget v1.0
// Renders reviews + submission form inside #aura-review-widget

(function () {
  const ENGINE_ORIGIN = "https://review-ugc-engine.onrender.com";

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function ensureStyles() {
    if (document.getElementById("aura-review-widget-styles")) return;

    const css = `
      #aura-review-widget {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Inter", sans-serif;
        color: #e7f6ff;
        background: radial-gradient(circle at top, rgba(0,240,255,0.12), rgba(5,8,15,0.98));
        border-radius: 20px;
        border: 1px solid rgba(0,240,255,0.24);
        padding: 20px;
        box-shadow: 0 24px 60px rgba(0,0,0,0.6);
        max-width: 640px;
        margin: 24px auto;
      }

      #aura-review-widget * {
        box-sizing: border-box;
      }

      .aura-rw-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .aura-rw-title {
        font-size: 1.25rem;
        font-weight: 600;
        letter-spacing: 0.03em;
      }

      .aura-rw-badge {
        padding: 4px 10px;
        border-radius: 999px;
        border: 1px solid rgba(0,240,255,0.35);
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.11em;
        opacity: 0.9;
      }

      .aura-rw-list {
        margin: 12px 0 18px;
        max-height: 260px;
        overflow-y: auto;
        padding-right: 4px;
      }

      .aura-rw-review {
        border-radius: 14px;
        border: 1px solid rgba(0,240,255,0.16);
        padding: 10px 12px;
        margin-bottom: 8px;
        background: rgba(5,8,15,0.9);
      }

      .aura-rw-review-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
      }

      .aura-rw-rating {
        color: #ffdf6b;
        font-size: 0.9rem;
      }

      .aura-rw-name {
        font-size: 0.8rem;
        opacity: 0.8;
      }

      .aura-rw-text {
        font-size: 0.9rem;
        line-height: 1.5;
        opacity: 0.95;
      }

      .aura-rw-empty {
        font-size: 0.9rem;
        opacity: 0.8;
        font-style: italic;
      }

      .aura-rw-form {
        border-top: 1px solid rgba(0,240,255,0.2);
        padding-top: 12px;
        margin-top: 8px;
      }

      .aura-rw-form-row {
        display: flex;
        gap: 8px;
        margin-bottom: 8px;
      }

      .aura-rw-form-row .aura-rw-field {
        flex: 1;
      }

      .aura-rw-label {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.09em;
        opacity: 0.7;
        margin-bottom: 4px;
        display: block;
      }

      .aura-rw-input,
      .aura-rw-textarea,
      .aura-rw-select {
        width: 100%;
        border-radius: 10px;
        border: 1px solid rgba(0,240,255,0.25);
        background: rgba(3,6,14,0.9);
        color: #e7f6ff;
        padding: 7px 9px;
        font-size: 0.85rem;
        outline: none;
      }

      .aura-rw-textarea {
        min-height: 64px;
        resize: vertical;
      }

      .aura-rw-input:focus,
      .aura-rw-textarea:focus,
      .aura-rw-select:focus {
        border-color: #00f0ff;
        box-shadow: 0 0 0 1px rgba(0,240,255,0.3);
      }

      .aura-rw-submit {
        margin-top: 4px;
        width: 100%;
        border-radius: 999px;
        border: none;
        padding: 9px 14px;
        font-size: 0.9rem;
        font-weight: 500;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        background: linear-gradient(90deg, #00f0ff, #00c8ff);
        color: #02040a;
        cursor: pointer;
        box-shadow: 0 12px 36px rgba(0,240,255,0.35);
      }

      .aura-rw-submit:disabled {
        opacity: 0.6;
        cursor: default;
        box-shadow: none;
      }

      .aura-rw-status {
        margin-top: 6px;
        font-size: 0.8rem;
        opacity: 0.8;
      }

      .aura-rw-status--ok {
        color: #5fffd3;
      }

      .aura-rw-status--err {
        color: #ff4f6b;
      }
    `;

    const styleEl = document.createElement("style");
    styleEl.id = "aura-review-widget-styles";
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  }

  async function fetchApprovedReviews(productId) {
    const url =
      ENGINE_ORIGIN + "/api/ugc/product/" + encodeURIComponent(productId);

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error("Failed to fetch reviews, status " + res.status);
    }

    const data = await res.json();

    if (Array.isArray(data)) return data;
    if (Array.isArray(data.reviews)) return data.reviews;
    if (data && typeof data === "object") return [data];

    return [];
  }

  function render(container, productId, reviews) {
    const averageRating =
      reviews.length > 0
        ? (
            reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) /
            reviews.length
          ).toFixed(1)
        : null;

    const stars = (rating) => "★".repeat(rating || 0) + "☆".repeat(5 - (rating || 0));

    const reviewsHtml =
      reviews.length === 0
        ? `<div class="aura-rw-empty">No reviews yet – be the first to share your experience.</div>`
        : reviews
            .slice(0, 20)
            .map((r) => {
              const name =
                r.customer_id ||
                r.customer_name ||
                "Verified customer";
              const rating = Number(r.rating) || 5;
              const text = r.text || "";
              return `
                <article class="aura-rw-review">
                  <div class="aura-rw-review-header">
                    <div class="aura-rw-rating">${stars(rating)}</div>
                    <div class="aura-rw-name">${name}</div>
                  </div>
                  <div class="aura-rw-text">${text}</div>
                </article>
              `;
            })
            .join("");

    container.innerHTML = `
      <div class="aura-rw-header">
        <div class="aura-rw-title">Customer Reviews</div>
        <div class="aura-rw-badge">
          AURA • UGC Engine
        </div>
      </div>

      ${
        averageRating
          ? `<div style="font-size:0.9rem; margin-bottom:6px; opacity:0.85;">
               Average rating <strong>${averageRating}/5</strong> from ${reviews.length} review${
              reviews.length === 1 ? "" : "s"
            }.
             </div>`
          : ""
      }

      <div class="aura-rw-list">${reviewsHtml}</div>

      <form class="aura-rw-form">
        <div class="aura-rw-form-row">
          <div class="aura-rw-field">
            <label class="aura-rw-label">Name (optional)</label>
            <input class="aura-rw-input" name="name" autocomplete="name" />
          </div>
          <div class="aura-rw-field" style="max-width:120px;">
            <label class="aura-rw-label">Rating</label>
            <select class="aura-rw-select" name="rating" required>
              <option value="5">★★★★★</option>
              <option value="4">★★★★☆</option>
              <option value="3">★★★☆☆</option>
              <option value="2">★★☆☆☆</option>
              <option value="1">★☆☆☆☆</option>
            </select>
          </div>
        </div>

        <label class="aura-rw-label">Your review</label>
        <textarea class="aura-rw-textarea" name="text" required placeholder="Tell other shoppers what you think..."></textarea>

        <label class="aura-rw-label" style="margin-top:6px;">Photo URL (optional)</label>
        <input class="aura-rw-input" name="media_url" placeholder="https://..." />

        <button type="submit" class="aura-rw-submit">Submit review</button>
        <div class="aura-rw-status" aria-live="polite"></div>
      </form>
    `;

    const form = container.querySelector(".aura-rw-form");
    const statusEl = container.querySelector(".aura-rw-status");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      statusEl.textContent = "";
      statusEl.className = "aura-rw-status";
      const submitBtn = form.querySelector(".aura-rw-submit");
      submitBtn.disabled = true;

      const formData = new FormData(form);
      const payload = {
        customer_id: (formData.get("name") || "").trim() || "Anonymous",
        product_id: productId,
        rating: Number(formData.get("rating") || 5),
        text: (formData.get("text") || "").trim(),
        media_url: (formData.get("media_url") || "").trim() || null,
        channel: "web-widget"
      };

      try {
        const res = await fetch(ENGINE_ORIGIN + "/api/ugc/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          throw new Error("Submit failed with status " + res.status);
        }

        statusEl.textContent =
          "Thanks for your review. It will appear here once approved.";
        statusEl.classList.add("aura-rw-status--ok");
        form.reset();
        form.querySelector('select[name="rating"]').value = "5";
      } catch (err) {
        console.error("[AURA Widget] Submit failed:", err);
        statusEl.textContent =
          "Sorry, something went wrong. Please try again.";
        statusEl.classList.add("aura-rw-status--err");
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  async function init() {
    const container = document.getElementById("aura-review-widget");
    if (!container) return;

    const productId =
      container.getAttribute("data-product-id") ||
      "url:" + location.hostname + location.pathname;

    ensureStyles();

    // Skeleton while loading
    container.innerHTML = `
      <div class="aura-rw-header">
        <div class="aura-rw-title">Customer Reviews</div>
        <div class="aura-rw-badge">Loading…</div>
      </div>
      <div class="aura-rw-empty">Fetching reviews from AURA UGC Engine…</div>
    `;

    try {
      const reviews = await fetchApprovedReviews(productId);
      render(container, productId, reviews);
    } catch (err) {
      console.error("[AURA Widget] Failed to load reviews:", err);
      container.innerHTML = `
        <div class="aura-rw-header">
          <div class="aura-rw-title">Customer Reviews</div>
          <div class="aura-rw-badge">AURA • UGC Engine</div>
        </div>
        <div class="aura-rw-empty">
          We couldn't load reviews right now. You can still submit a review below.
        </div>
      `;
    }
  }

  ready(init);
})();
