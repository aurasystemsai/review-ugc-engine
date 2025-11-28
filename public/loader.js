// public/loader.js
(function () {
  // ---- helper: wait for DOM ----
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  ready(async function () {
    try {
      // ---- 1) identify site ----
      var scriptTag = document.currentScript;
      var siteId =
        (scriptTag && scriptTag.getAttribute("data-aura-site-id")) ||
        ("domain:" + window.location.hostname);

      // ---- 2) fetch config ----
      var configUrl =
        "https://review-ugc-engine.onrender.com/api/aura-config?site_id=" +
        encodeURIComponent(siteId);

      var res = await fetch(configUrl, { credentials: "omit" });

      if (!res.ok) {
        console.warn("[AURA Loader] No config for site:", siteId, res.status);
        return;
      }

      var config = await res.json();

      // no tools enabled? bail
      if (!config.tools || !config.tools.reviews || !config.tools.reviews.enabled) {
        console.log("[AURA Loader] Reviews disabled for", siteId);
        return;
      }

      // ---- 3) inject global CSS for FAB + modal ----
      var style = document.createElement("style");
      style.id = "aura-loader-styles";
      style.textContent = `
        .aura-reviews-fab {
          position: fixed !important;
          right: 24px !important;
          bottom: 24px !important;
          z-index: 999999 !important;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 999px;
          border: 1px solid rgba(0, 240, 255, 0.45);
          background: radial-gradient(circle at 0% 0%, #00f0ff, #0077ff);
          color: #020617;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text",
            "Inter", sans-serif;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.02em;
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
          cursor: pointer;
          transition: transform 0.18s ease-out,
                      box-shadow 0.18s ease-out,
                      opacity 0.18s ease-out;
          opacity: 0.96;
        }
        .aura-reviews-fab:hover {
          transform: translateY(-3px);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.65);
          opacity: 1;
        }
        .aura-reviews-fab:active {
          transform: translateY(0);
          box-shadow: 0 14px 30px rgba(0, 0, 0, 0.55);
        }
        .aura-reviews-fab__dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #020617;
        }

        .aura-reviews-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 999998;
          background: radial-gradient(circle at top, rgba(0, 240, 255, 0.14), transparent),
                      radial-gradient(circle at bottom, rgba(0, 0, 0, 0.92), rgba(0, 0, 0, 0.96));
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .aura-reviews-modal-panel {
          position: relative;
          width: min(420px, 96vw);
          max-height: min(520px, 90vh);
          background: radial-gradient(circle at 0% 0%, #020617, #020617) padding-box,
                      linear-gradient(135deg, rgba(0, 240, 255, 0.6), rgba(37, 99, 235, 0.6)) border-box;
          border-radius: 24px;
          border: 1px solid transparent;
          overflow: hidden;
          box-shadow: 0 40px 120px rgba(0, 0, 0, 0.8);
          display: flex;
          flex-direction: column;
        }
        .aura-reviews-modal-header {
          padding: 16px 18px 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #e5f4ff;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text",
            "Inter", sans-serif;
        }
        .aura-reviews-modal-title {
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .aura-reviews-modal-badge {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 999px;
          background: rgba(0, 240, 255, 0.12);
          border: 1px solid rgba(0, 240, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .aura-reviews-modal-close {
          border: none;
          outline: none;
          background: transparent;
          color: #9ca3af;
          cursor: pointer;
          padding: 4px;
          border-radius: 999px;
          transition: background 0.16s ease-out, color 0.16s ease-out;
        }
        .aura-reviews-modal-close:hover {
          background: rgba(148, 163, 184, 0.12);
          color: #e5f4ff;
        }
        .aura-reviews-modal-body {
          padding: 0 18px 16px;
          color: #9fb3d8;
          font-size: 13px;
          line-height: 1.6;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text",
            "Inter", sans-serif;
        }
        .aura-reviews-modal-frame {
          border: none;
          width: 100%;
          flex: 1 1 auto;
          min-height: 280px;
          background: transparent;
        }

        @media (max-width: 640px) {
          .aura-reviews-fab {
            right: 16px !important;
            bottom: 16px !important;
            padding: 9px 15px;
            font-size: 13px;
          }
        }
      `;
      document.head.appendChild(style);

      // ---- 4) create floating button ----
      var fab = document.createElement("button");
      fab.id = "aura-reviews-fab";
      fab.className = "aura-reviews-fab";
      fab.type = "button";

      fab.innerHTML = `
        <span class="aura-reviews-fab__dot"></span>
        <span>Reviews</span>
      `;

      fab.addEventListener("click", function () {
        openModal(siteId);
      });

      document.body.appendChild(fab);

      console.log("[AURA Loader] FAB injected for", siteId);
    } catch (err) {
      console.error("[AURA Loader] failed:", err);
    }
  });

  // ---- modal ----
  function openModal(siteId) {
    // if already open, do nothing
    if (document.getElementById("aura-reviews-modal-backdrop")) return;

    var backdrop = document.createElement("div");
    backdrop.id = "aura-reviews-modal-backdrop";
    backdrop.className = "aura-reviews-modal-backdrop";

    backdrop.innerHTML = `
      <div class="aura-reviews-modal-panel">
        <div class="aura-reviews-modal-header">
          <div class="aura-reviews-modal-title">
            <span>AURA Reviews</span>
            <span class="aura-reviews-modal-badge">beta</span>
          </div>
          <button class="aura-reviews-modal-close" type="button" aria-label="Close">
            ✕
          </button>
        </div>
        <div class="aura-reviews-modal-body">
          Submit and moderate user-generated reviews powered by your AURA OS.
        </div>
        <iframe
          class="aura-reviews-modal-frame"
          src="https://review-ugc-engine.onrender.com/admin/ugc"
          loading="lazy"
        ></iframe>
      </div>
    `;

    backdrop.addEventListener("click", function (e) {
      if (e.target === backdrop) {
        backdrop.remove();
      }
    });

    backdrop
      .querySelector(".aura-reviews-modal-close")
      .addEventListener("click", function () {
        backdrop.remove();
      });

    document.body.appendChild(backdrop);
  }
})();
