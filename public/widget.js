// public/widget.js
// AURA • Floating Reviews Widget
// This file is loaded by loader.js and is responsible for the actual
// floating button + modal UI. It ALWAYS attaches to <body>, so it
// floats over any page builder (Framer, Shopify, Wix, etc.).

(function (window, document) {
  const WIDGET_ATTR = "data-aura-widget";
  const WIDGET_TYPE = "reviews";

  function log(...args) {
    if (window && window.console) {
      console.log("[AURA Reviews Widget]", ...args);
    }
  }

  function createModal(config) {
    const { apiBase, siteId, productId } = config;

    // Outer overlay
    const overlay = document.createElement("div");
    overlay.setAttribute(WIDGET_ATTR, WIDGET_TYPE + "-overlay");
    overlay.className = "aura-reviews-overlay";
    overlay.style.display = "none";

    // Modal frame
    const modal = document.createElement("div");
    modal.className = "aura-reviews-modal";

    // Header
    const header = document.createElement("div");
    header.className = "aura-reviews-modal-header";

    const title = document.createElement("h3");
    title.className = "aura-reviews-modal-title";
    title.textContent = "What customers are saying";

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "aura-reviews-modal-close";
    closeBtn.innerHTML = "&times;";

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Body
    const body = document.createElement("div");
    body.className = "aura-reviews-modal-body";

    const spinner = document.createElement("div");
    spinner.className = "aura-reviews-spinner";
    spinner.textContent = "Loading reviews…";

    body.appendChild(spinner);

    modal.appendChild(header);
    modal.appendChild(body);
    overlay.appendChild(modal);

    document.body.appendChild(overlay);

    // Close handlers
    function hide() {
      overlay.style.display = "none";
      document.body.style.overflow = "";
    }

    closeBtn.addEventListener("click", hide);
    overlay.addEventListener("click", function (evt) {
      if (evt.target === overlay) hide();
    });

    // Fetch reviews once, when first opened
    let loaded = false;

    async function loadReviews() {
      if (loaded) return;
      loaded = true;

      try {
        const url = `${apiBase}/api/ugc/product/${encodeURIComponent(
          productId || "default"
        )}`;
        log("Fetching approved reviews from", url);

        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch reviews");

        const data = await res.json();

        body.innerHTML = ""; // clear spinner

        if (!Array.isArray(data) || data.length === 0) {
          const empty = document.createElement("p");
          empty.className = "aura-reviews-empty";
          empty.textContent =
            "No reviews yet. Once customers start leaving reviews, they’ll appear here automatically.";
          body.appendChild(empty);
          return;
        }

        const list = document.createElement("div");
        list.className = "aura-reviews-list";

        data.forEach((item) => {
          const card = document.createElement("article");
          card.className = "aura-reviews-card";

          const rating = document.createElement("div");
          rating.className = "aura-reviews-rating";

          const stars = document.createElement("span");
          stars.className = "aura-reviews-stars";
          const r = item.rating || 5;
          stars.textContent = "★".repeat(r) + "☆".repeat(5 - r);

          const score = document.createElement("span");
          score.className = "aura-reviews-score";
          score.textContent = `${r}/5`;

          rating.appendChild(stars);
          rating.appendChild(score);

          const text = document.createElement("p");
          text.className = "aura-reviews-text";
          text.textContent =
            item.text ||
            "Customer review text will appear here when reviews are submitted.";

          card.appendChild(rating);
          card.appendChild(text);

          list.appendChild(card);
        });

        body.appendChild(list);
      } catch (err) {
        log("Error loading reviews", err);
        body.innerHTML = "";
        const error = document.createElement("p");
        error.className = "aura-reviews-error";
        error.textContent =
          "We could not load reviews just now. Please try again in a moment.";
        body.appendChild(error);
      }
    }

    return {
      show: function () {
        overlay.style.display = "flex";
        document.body.style.overflow = "hidden";
        loadReviews();
      },
      hide,
    };
  }

  function createFloatingButton(config) {
    // Avoid duplicates
    if (
      document.querySelector(
        `[${WIDGET_ATTR}="${WIDGET_TYPE}-fab"]`
      )
    ) {
      return;
    }

    const { label } = config;

    const fab = document.createElement("button");
    fab.type = "button";
    fab.setAttribute(WIDGET_ATTR, WIDGET_TYPE + "-fab");
    fab.className = "aura-reviews-fab";

    const dot = document.createElement("span");
    dot.className = "aura-reviews-fab-dot";

    const text = document.createElement("span");
    text.className = "aura-reviews-fab-label";
    text.textContent = label || "Reviews";

    fab.appendChild(dot);
    fab.appendChild(text);

    // Attach directly to <body> so it is truly floating
    document.body.appendChild(fab);

    return fab;
  }

  function initWidget(config) {
    const { apiBase, siteId } = config || {};

    if (!apiBase || !siteId) {
      log("Missing apiBase or siteId – widget will not initialise.", config);
      return;
    }

    log("Initialising reviews widget for", siteId, "via", apiBase);

    const modal = createModal(config);
    const fab = createFloatingButton(config);

    if (!fab) return;

    fab.addEventListener("click", function () {
      modal.show();
    });
  }

  // Public API called from loader.js
  window.AuraReviewsWidget = {
    init: function (config) {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
          initWidget(config);
        });
      } else {
        initWidget(config);
      }
    },
  };
})(window, document);
