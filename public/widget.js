// public/widget.js
(function (window, document) {
  "use strict";

  var API_BASE = "https://review-ugc-engine.onrender.com";

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function createStarRating(rating) {
    rating = Number(rating || 0);
    if (!rating) return "";
    var full = "★".repeat(rating);
    var empty = "☆".repeat(Math.max(0, 5 - rating));
    return '<span class="aura-rating">' + full + empty + "</span>";
  }

  function renderReviews(container, reviews, config) {
    container.innerHTML = "";

    if (!reviews.length) {
      container.innerHTML =
        '<div class="aura-empty">No reviews yet. Be the first to review.</div>';
      return;
    }

    var list = document.createElement("div");
    list.className = "aura-reviews-list";

    reviews.forEach(function (r) {
      var card = document.createElement("div");
      card.className = "aura-review-card";

      var stars = createStarRating(r.rating);
      var mediaHtml = "";

      if (r.media_url) {
        mediaHtml =
          '<div class="aura-review-media"><img src="' +
          escapeHtml(r.media_url) +
          '" alt="Customer photo" loading="lazy" /></div>';
      }

      card.innerHTML =
        '<div class="aura-review-header">' +
        (r.customer_id
          ? '<div class="aura-review-author">' +
            escapeHtml(r.customer_id) +
            "</div>"
          : '<div class="aura-review-author">Verified customer</div>') +
        '<div class="aura-review-rating">' +
        stars +
        "</div>" +
        "</div>" +
        '<div class="aura-review-text">' +
        escapeHtml(r.text || "") +
        "</div>" +
        mediaHtml;

      list.appendChild(card);
    });

    container.appendChild(list);
  }

  function fetchApproved(siteId, cb) {
    var url =
      API_BASE +
      "/api/ugc/moderation/all?site_id=" +
      encodeURIComponent(siteId) +
      "&status=approved";

    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error("API " + res.status);
        return res.json();
      })
      .then(function (data) {
        cb(null, Array.isArray(data) ? data : []);
      })
      .catch(function (err) {
        console.error("[AURA Reviews] Failed to load reviews:", err);
        cb(err, []);
      });
  }

  function applyBaseStyles() {
    if (document.getElementById("aura-reviews-style")) return;

    var css = `
      .aura-reviews-list {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 12px;
      }
      @media (min-width: 768px) {
        .aura-reviews-list {
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        }
      }
      .aura-review-card {
        border-radius: 18px;
        border: 1px solid rgba(15, 23, 42, 0.6);
        padding: 12px 14px;
        background: radial-gradient(circle at top left, rgba(15, 23, 42, 0.96), rgba(6, 10, 19, 0.98));
        color: #e7f6ff;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Inter", sans-serif;
      }
      .aura-review-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 6px;
        margin-bottom: 4px;
      }
      .aura-review-author {
        font-size: 13px;
        font-weight: 500;
      }
      .aura-review-rating {
        font-size: 14px;
        color: #fde047;
      }
      .aura-review-text {
        font-size: 13px;
        line-height: 1.5;
        margin-bottom: 6px;
      }
      .aura-review-media img {
        max-width: 100%;
        border-radius: 14px;
        margin-top: 4px;
        display: block;
      }
      .aura-empty {
        font-size: 13px;
        color: #9fb3d8;
        padding: 10px;
        border-radius: 12px;
        border: 1px dashed rgba(148, 163, 184, 0.6);
      }
      .aura-rating {
        letter-spacing: 1px;
      }
    `;

    var style = document.createElement("style");
    style.id = "aura-reviews-style";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function init(config) {
    config = config || {};
    var siteId = config.siteId || "demo-site";
    var selector = config.selector || "#aura-reviews";
    var container = document.querySelector(selector);

    if (!container) {
      console.error(
        "[AURA Reviews] Container not found for selector:",
        selector
      );
      return;
    }

    applyBaseStyles();

    container.innerHTML =
      '<div class="aura-empty">Loading reviews from AURA…</div>';

    fetchApproved(siteId, function (err, reviews) {
      if (err) {
        container.innerHTML =
          '<div class="aura-empty">Unable to load reviews right now.</div>';
        return;
      }
      renderReviews(container, reviews, config);
    });
  }

  window.AuraReviewsWidget = window.AuraReviewsWidget || {};
  window.AuraReviewsWidget._ready = true;
  window.AuraReviewsWidget.init = init;
})(window, document);
