// public/loader.js
// AURA • Universal Reviews Loader
// - Injects a floating "Reviews" FAB on any site
// - Public mode: in-page modal with real reviews + real submit
// - Admin mode: opens AURA UGC Admin in a new tab

(function () {
  // ------------------ Helpers ------------------

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  // Inject CSS once
  function injectStyles() {
    if (document.getElementById("aura-reviews-loader-styles")) return;

    var css = `
      #aura-reviews-fab {
        position: fixed;
        right: 24px;
        bottom: 24px;
        z-index: 2147483647;
      }
      .aura-reviews-fab {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 9px 18px;
        border-radius: 999px;
        border: 1px solid rgba(0, 240, 255, 0.45);
        background: radial-gradient(circle at 0% 0%, #00f0ff, #00f7ff);
        box-shadow:
          0 0 20px rgba(0, 240, 255, 0.6),
          0 18px 45px rgba(0, 0, 0, 0.55);
        color: #021018;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif;
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 0.02em;
        cursor: pointer;
        transition:
          transform 0.18s ease-out,
          box-shadow 0.18s ease-out,
          opacity 0.18s ease-out;
      }
      .aura-reviews-fab__dot {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: #021018;
        box-shadow: 0 0 12px rgba(0,0,0,0.4);
      }
      .aura-reviews-fab__label {
        white-space: nowrap;
      }
      .aura-reviews-fab:hover {
        transform: translateY(-1px);
        box-shadow:
          0 0 24px rgba(0, 240, 255, 0.8),
          0 22px 50px rgba(0, 0, 0, 0.7);
      }
      .aura-reviews-fab:active {
        transform: translateY(1px) scale(0.98);
      }
      @media (max-width: 640px) {
        .aura-reviews-fab {
          right: 16px !important;
          bottom: 16px !important;
          padding: 8px 16px;
          font-size: 13px;
        }
      }

      /* Modal backdrop + shell */
      .aura-reviews-modal-backdrop {
        position: fixed;
        inset: 0;
        background: radial-gradient(circle at top, rgba(0, 240, 255, 0.09), transparent 60%) rgba(2, 4, 12, 0.86);
        backdrop-filter: blur(14px);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 2147483646;
      }
      .aura-reviews-modal-backdrop.aura-open {
        display: flex;
      }
      .aura-reviews-modal-frame {
        width: min(960px, 92vw);
        max-height: min(640px, 90vh);
        background: radial-gradient(circle at top left, rgba(0, 240, 255, 0.15), transparent 60%) #050815;
        border-radius: 24px;
        border: 1px solid rgba(0, 240, 255, 0.26);
        box-shadow: 0 28px 80px rgba(0, 0, 0, 0.85);
        padding: 20px 22px 18px;
        display: flex;
        flex-direction: column;
        color: #e7f6ff;
        overflow: hidden;
      }
      .aura-reviews-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding-bottom: 10px;
        border-bottom: 1px solid rgba(0, 240, 255, 0.16);
      }
      .aura-reviews-modal-title {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        font-size: 16px;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: #e7f6ff;
      }
      .aura-reviews-modal-dot {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: #00f0ff;
        box-shadow: 0 0 16px rgba(0, 240, 255, 0.8);
      }
      .aura-reviews-modal-close {
        border: none;
        background: transparent;
        color: #9fb3d8;
        font-size: 22px;
        cursor: pointer;
        padding: 2px 8px;
        border-radius: 999px;
        transition: background 0.12s ease-out, color 0.12s ease-out;
      }
      .aura-reviews-modal-close:hover {
        background: rgba(159, 179, 216, 0.16);
        color: #ffffff;
      }
      .aura-reviews-modal-body {
        display: grid;
        grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
        gap: 20px;
        padding-top: 14px;
        overflow: auto;
      }
      @media (max-width: 768px) {
        .aura-reviews-modal-frame {
          width: min(100vw, 480px);
          max-height: min(640px, 98vh);
          border-radius: 20px;
          padding: 16px 16px 14px;
        }
        .aura-reviews-modal-body {
          grid-template-columns: minmax(0, 1fr);
          gap: 16px;
        }
      }
      .aura-reviews-subtitle {
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        color: #9fb3d8;
        margin: 0 0 8px;
      }

      .aura-reviews-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-height: 280px;
        overflow: auto;
        padding-right: 4px;
      }
      .aura-reviews-empty {
        font-size: 13px;
        color: #9fb3d8;
        padding: 8px 0;
      }
      .aura-review-card {
        border-radius: 14px;
        border: 1px solid rgba(0, 240, 255, 0.12);
        background: radial-gradient(circle at top left, rgba(0,240,255,0.10), rgba(5,11,26,0.95));
        padding: 10px 12px;
        box-shadow: 0 14px 30px rgba(0, 0, 0, 0.55);
      }
      .aura-review-rating {
        margin-bottom: 4px;
      }
      .aura-star {
        font-size: 14px;
        color: rgba(159, 179, 216, 0.4);
      }
      .aura-star--full {
        color: #ffd66b;
      }
      .aura-review-text {
        font-size: 13px;
        line-height: 1.4;
        color: #e7f6ff;
        margin-bottom: 6px;
      }
      .aura-review-meta {
        font-size: 11px;
        color: #9fb3d8;
      }
      .aura-review-photo {
        margin-top: 6px;
        max-width: 100%;
        border-radius: 10px;
        border: 1px solid rgba(148,163,184,0.4);
      }

      .aura-reviews-form-section {
        border-radius: 16px;
        border: 1px solid rgba(0, 240, 255, 0.12);
        background: radial-gradient(circle at top right, rgba(0, 240, 255, 0.12), rgba(5, 9, 22, 0.96));
        padding: 10px 12px 12px;
      }
      .aura-reviews-form {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .aura-field {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .aura-field label {
        font-size: 12px;
        color: #9fb3d8;
      }
      .aura-required {
        color: #ff4f6b;
        margin-left: 2px;
      }
      .aura-optional {
        color: #586480;
        font-weight: 400;
      }
      .aura-field input,
      .aura-field select,
      .aura-field textarea {
        border-radius: 999px;
        border: 1px solid rgba(0, 240, 255, 0.22);
        background: rgba(3, 8, 20, 0.9);
        color: #e7f6ff;
        font-size: 13px;
        padding: 6px 10px;
        outline: none;
        font-family: inherit;
      }
      .aura-field textarea {
        border-radius: 12px;
        resize: vertical;
        min-height: 64px;
      }
      .aura-field input:focus,
      .aura-field select:focus,
      .aura-field textarea:focus {
        border-color: rgba(0, 240, 255, 0.75);
        box-shadow: 0 0 0 1px rgba(0, 240, 255, 0.35);
      }

      .aura-primary-btn {
        margin-top: 4px;
        border-radius: 999px;
        border: 1px solid rgba(0, 240, 255, 0.5);
        background: radial-gradient(circle at 0% 0%, #00f0ff, #00f7ff);
        color: #021018;
        font-size: 13px;
        font-weight: 600;
        padding: 7px 14px;
        cursor: pointer;
        align-self: flex-start;
        box-shadow:
          0 0 16px rgba(0, 240, 255, 0.7),
          0 14px 30px rgba(0, 0, 0, 0.6);
        transition:
          transform 0.14s ease-out,
          box-shadow 0.14s ease-out;
      }
      .aura-primary-btn:hover {
        transform: translateY(-1px);
        box-shadow:
          0 0 18px rgba(0, 240, 255, 0.9),
          0 18px 40px rgba(0, 0, 0, 0.75);
      }
      .aura-primary-btn:active {
        transform: translateY(1px) scale(0.97);
      }

      .aura-form-status {
        margin-top: 4px;
        font-size: 11px;
      }
      .aura-form-status--neutral {
        color: #9fb3d8;
      }
      .aura-form-status--success {
        color: #5fffd3;
      }
      .aura-form-status--error {
        color: #ff4f6b;
      }
    `;

    var styleEl = document.createElement("style");
    styleEl.id = "aura-reviews-loader-styles";
    styleEl.type = "text/css";
    styleEl.appendChild(document.createTextNode(css));
    document.head.appendChild(styleEl);
  }

  // ------------------ Main loader ------------------

  ready(async function () {
    try {
      if (document.getElementById("aura-reviews-fab")) return;

      var path = window.location.pathname || "";
      if (path.startsWith("/admin")) return; // don't show on admin

      // Identify scriptTag
      var scriptTag = document.currentScript;
      if (!scriptTag) {
        var scripts = document.getElementsByTagName("script");
        scriptTag = scripts[scripts.length - 1];
      }

      var scriptSrc = scriptTag.getAttribute("src") || "";
      var apiBase =
        scriptTag.getAttribute("data-aura-api") ||
        (function () {
          try {
            return new URL(scriptSrc).origin;
          } catch (e) {
            return "https://review-ugc-engine.onrender.com";
          }
        })();

      var siteIdAttr = scriptTag.getAttribute("data-aura-site-id");
      var siteId =
        siteIdAttr && siteIdAttr.trim().length > 0
          ? siteIdAttr.trim()
          : "domain:" + window.location.hostname;

      var modeAttr = (scriptTag.getAttribute("data-aura-mode") || "").toLowerCase();

      // Product ID: from attribute or path
      var productIdAttr = scriptTag.getAttribute("data-aura-product-id");
      var productId =
        (productIdAttr && productIdAttr.trim()) ||
        window.location.pathname ||
        "page";

      // Try to fetch config (for plan / enable flags)
      var config = null;
      try {
        var cfgRes = await fetch(
          apiBase + "/api/aura-config?site_id=" + encodeURIComponent(siteId),
          { credentials: "omit" }
        );
        if (cfgRes.ok) {
          config = await cfgRes.json();
        }
      } catch (e) {
        // optional, fail silently
      }

      var finalMode =
        modeAttr ||
        (config && config.mode && String(config.mode).toLowerCase()) ||
        "public";

      var reviewsEnabled =
        !config ||
        // if no config, assume enabled
        (config.tools &&
          config.tools.reviews &&
          config.tools.reviews.enabled);

      if (!reviewsEnabled) {
        console.log("[AURA] Reviews disabled for site:", siteId);
        return;
      }

      injectStyles();

      // Create FAB
      var fab = document.createElement("button");
      fab.id = "aura-reviews-fab";
      fab.className = "aura-reviews-fab";
      fab.type = "button";
      fab.setAttribute("aria-label", "Open reviews");

      fab.innerHTML =
        '<span class="aura-reviews-fab__dot"></span>' +
        '<span class="aura-reviews-fab__label">Reviews</span>';

      document.body.appendChild(fab);

      console.log(
        "[AURA] FAB injected.",
        "mode=" + finalMode,
        "site=" + siteId,
        "product=" + productId
      );

      if (finalMode === "admin") {
        attachAdminBehaviour(fab, apiBase, siteId);
      } else {
        attachPublicBehaviour(fab, apiBase, productId);
      }
    } catch (err) {
      console.error("[AURA] Loader error:", err);
    }
  });

  // ------------------ Admin behaviour ------------------

  function attachAdminBehaviour(fab, apiBase, siteId) {
    fab.addEventListener("click", function () {
      var adminUrl =
        apiBase +
        "/admin/ugc?site_id=" +
        encodeURIComponent(siteId || "domain:" + window.location.hostname);
      window.open(adminUrl, "_blank", "noopener,noreferrer");
    });
  }

  // ------------------ Public behaviour ------------------

  function attachPublicBehaviour(fab, apiBase, productId) {
    var modalCreated = false;
    var backdrop = null;

    fab.addEventListener("click", function () {
      if (!modalCreated) {
        backdrop = buildReviewsModal(apiBase, productId);
        document.body.appendChild(backdrop);
        modalCreated = true;
      }
      openModal(backdrop);
    });
  }

  function buildReviewsModal(apiBase, productId) {
    var backdrop = document.createElement("div");
    backdrop.id = "aura-reviews-modal-backdrop";
    backdrop.className = "aura-reviews-modal-backdrop";
    backdrop.setAttribute("aria-hidden", "true");

    var frame = document.createElement("div");
    frame.className = "aura-reviews-modal-frame";
    frame.setAttribute("role", "dialog");
    frame.setAttribute("aria-modal", "true");

    var header = document.createElement("div");
    header.className = "aura-reviews-modal-header";
    header.innerHTML =
      '<div class="aura-reviews-modal-title">' +
      '<span class="aura-reviews-modal-dot"></span>' +
      '<span>AURA Reviews</span>' +
      "</div>" +
      '<button type="button" class="aura-reviews-modal-close" aria-label="Close">&times;</button>';

    var body = document.createElement("div");
    body.className = "aura-reviews-modal-body";

    // Reviews list
    var reviewsSection = document.createElement("div");
    reviewsSection.className = "aura-reviews-list-section";
    reviewsSection.innerHTML =
      '<h3 class="aura-reviews-subtitle">What customers are saying</h3>' +
      '<div class="aura-reviews-list" id="aura-reviews-list">' +
      '<div class="aura-reviews-empty">Loading reviews...</div>' +
      "</div>";

    // Form
    var formSection = document.createElement("div");
    formSection.className = "aura-reviews-form-section";
    formSection.innerHTML =
      '<h3 class="aura-reviews-subtitle">Leave a review</h3>' +
      '<form class="aura-reviews-form" id="aura-reviews-form">' +
      '  <div class="aura-field">' +
      '    <label>Name (optional)</label>' +
      '    <input type="text" name="name" placeholder="Jane Doe" />' +
      "  </div>" +
      '  <div class="aura-field">' +
      '    <label>Rating<span class="aura-required">*</span></label>' +
      '    <select name="rating" required>' +
      '      <option value="">Select rating</option>' +
      '      <option value="5">★★★★★ – Love it</option>' +
      '      <option value="4">★★★★☆ – Great</option>' +
      '      <option value="3">★★★☆☆ – Okay</option>' +
      '      <option value="2">★★☆☆☆ – Not great</option>' +
      '      <option value="1">★☆☆☆☆ – Terrible</option>' +
      "    </select>" +
      "  </div>" +
      '  <div class="aura-field">' +
      '    <label>Review<span class="aura-required">*</span></label>' +
      '    <textarea name="text" rows="3" placeholder="Tell us what you think..." required></textarea>' +
      "  </div>" +
      '  <div class="aura-field">' +
      '    <label>Photo URL <span class="aura-optional">(optional)</span></label>' +
      '    <input type="url" name="media_url" placeholder="https://..." />' +
      "  </div>" +
      '  <button type="submit" class="aura-primary-btn">Submit review</button>' +
      '  <div class="aura-form-status" id="aura-form-status"></div>' +
      "</form>";

    body.appendChild(reviewsSection);
    body.appendChild(formSection);

    frame.appendChild(header);
    frame.appendChild(body);
    backdrop.appendChild(frame);

    var closeBtn = header.querySelector(".aura-reviews-modal-close");
    closeBtn.addEventListener("click", function () {
      closeModal(backdrop);
    });

    backdrop.addEventListener("click", function (e) {
      if (e.target === backdrop) {
        closeModal(backdrop);
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closeModal(backdrop);
      }
    });

    fetchReviews(apiBase, productId);
    attachFormSubmit(apiBase, productId);

    return backdrop;
  }

  function openModal(backdrop) {
    if (!backdrop) return;
    backdrop.classList.add("aura-open");
    backdrop.setAttribute("aria-hidden", "false");
  }

  function closeModal(backdrop) {
    if (!backdrop) return;
    backdrop.classList.remove("aura-open");
    backdrop.setAttribute("aria-hidden", "true");
  }

  // ------------------ Real LIVE endpoints ------------------

  // GET /api/ugc/product/:productId → approved reviews
  function fetchReviews(apiBase, productId) {
    var listEl = document.getElementById("aura-reviews-list");
    if (!listEl) return;

    var endpoint =
      apiBase + "/api/ugc/product/" + encodeURIComponent(productId || "page");

    fetch(endpoint)
      .then(function (res) {
        if (!res.ok) throw new Error("Failed to fetch reviews");
        return res.json();
      })
      .then(function (data) {
        if (!Array.isArray(data) || data.length === 0) {
          listEl.innerHTML =
            '<div class="aura-reviews-empty">No reviews yet — be the first to leave one.</div>';
          return;
        }

        listEl.innerHTML = "";
        data.forEach(function (row) {
          var card = document.createElement("article");
          card.className = "aura-review-card";

          var rating = Number(row.rating || 0);
          var stars = "";
          for (var i = 0; i < 5; i++) {
            stars +=
              i < rating
                ? '<span class="aura-star aura-star--full">★</span>'
                : '<span class="aura-star">★</span>';
          }

          var text = row.text || "";
          var name = row.customer_id || "Verified customer";
          var createdAt = row.created_at
            ? new Date(row.created_at).toLocaleDateString()
            : "";

          card.innerHTML =
            '<div class="aura-review-rating">' +
            stars +
            "</div>" +
            '<div class="aura-review-text">' +
            text +
            "</div>" +
            '<div class="aura-review-meta">' +
            name +
            (createdAt ? " • " + createdAt : "") +
            "</div>";

          if (row.media_url) {
            var img = document.createElement("img");
            img.src = row.media_url;
            img.alt = "Customer photo";
            img.className = "aura-review-photo";
            img.loading = "lazy";
            card.appendChild(img);
          }

          listEl.appendChild(card);
        });
      })
      .catch(function (err) {
        console.warn("[AURA] Review load error:", err);
        listEl.innerHTML =
          '<div class="aura-reviews-empty">Unable to load reviews right now.</div>';
      });
  }

  // POST /api/ugc/submit → create pending review
  function attachFormSubmit(apiBase, productId) {
    var form = document.getElementById("aura-reviews-form");
    var statusEl = document.getElementById("aura-form-status");
    if (!form || !statusEl) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      statusEl.textContent = "Submitting...";
      statusEl.className = "aura-form-status aura-form-status--neutral";

      var formData = new FormData(form);
      var rating = Number(formData.get("rating"));
      var text = (formData.get("text") || "").trim();
      var name = (formData.get("name") || "").trim();
      var mediaUrl = (formData.get("media_url") || "").trim();

      if (!rating || !text) {
        statusEl.textContent = "Please include both rating and review text.";
        statusEl.className = "aura-form-status aura-form-status--error";
        return;
      }

      var payload = {
        customerId: name || null,
        productId: productId || "page",
        orderId: null,
        channel: "web_widget",
        type: "review",
        rating: rating,
        text: text,
        mediaUrl: mediaUrl || null
      };

      fetch(apiBase + "/api/ugc/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          if (!res.ok) throw new Error("Submit failed");
          return res.json();
        })
        .then(function () {
          statusEl.textContent =
            "Thanks for your review! It will appear once approved.";
          statusEl.className = "aura-form-status aura-form-status--success";
          form.reset();
          setTimeout(function () {
            fetchReviews(apiBase, productId);
          }, 1200);
        })
        .catch(function (err) {
          console.warn("[AURA] Review submit failed:", err);
          statusEl.textContent =
            "Something went wrong. Please try again later.";
          statusEl.className = "aura-form-status aura-form-status--error";
        });
    });
  }
})();
