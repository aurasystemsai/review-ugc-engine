// public/loader.js
// AURA • Universal Reviews Loader (Stable Build, relaxed config)
// - Works everywhere (Framer, Shopify, Webflow, etc.)
// - Adds a fixed bottom-right floating Reviews button
// - Fully inline styles (no CSS overrides)
// - Opens admin in new tab (MVP version)

(function () {
  // ---------------- helper: run when DOM ready ----------------
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  ready(async function () {
    try {
      // ---------------- 1. Prevent duplicate injection ----------------
      if (document.getElementById("aura-reviews-fab")) return;

      // Skip admin/dashboard pages (optional safeguard)
      const path = window.location.pathname || "";
      if (path.startsWith("/admin")) return;

      // ---------------- 2. Identify the site ----------------
      const scriptTag = document.currentScript;
      const siteId =
        (scriptTag && scriptTag.getAttribute("data-aura-site-id")) ||
        "domain:" + window.location.hostname;

      // ---------------- 3. Try to fetch site config (OPTIONAL) ----------------
      // If this fails, we STILL show the FAB.
      let config = null;
      let reviewsEnabled = true; // default: enabled

      const configUrl =
        "https://review-ugc-engine.onrender.com/api/aura-config?site_id=" +
        encodeURIComponent(siteId);

      try {
        const res = await fetch(configUrl, { credentials: "omit" });

        if (res.ok) {
          try {
            config = await res.json();
            if (
              config &&
              config.tools &&
              config.tools.reviews &&
              config.tools.reviews.enabled === false
            ) {
              reviewsEnabled = false;
            }
          } catch (errParse) {
            console.warn("[AURA] Failed to parse config JSON:", errParse);
          }
        } else {
          console.warn("[AURA] Config fetch non-OK:", res.status);
          // non-OK ⇒ just fall back to default (enabled)
        }
      } catch (err) {
        console.warn("[AURA] Config request failed:", err);
        // network error ⇒ fall back to default (enabled)
      }

      // ---------------- 4. Stop only if config explicitly disabled reviews ----------------
      if (!reviewsEnabled) {
        console.log("[AURA] Reviews explicitly disabled for site:", siteId);
        return;
      }

      // ---------------- 5. Create floating FAB ----------------
      const fab = document.createElement("button");
      fab.id = "aura-reviews-fab";
      fab.type = "button";

      // Inline styles (immune to builders/themes)
      Object.assign(fab.style, {
        position: "fixed",
        right: "24px",
        bottom: "24px",
        zIndex: "2147483647",
        padding: "10px 18px",
        borderRadius: "999px",
        border: "1px solid rgba(0,240,255,0.45)",
        background: "radial-gradient(circle at 0% 0%, #00f0ff, #0077ff)",
        color: "#02111f",
        fontFamily:
          'system-ui,-apple-system,BlinkMacSystemFont,"SF Pro Text","Inter",sans-serif',
        fontSize: "14px",
        fontWeight: "600",
        letterSpacing: "0.02em",
        cursor: "pointer",
        boxShadow: "0 18px 40px rgba(0,0,0,0.65)",
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        backgroundClip: "padding-box",
        transition: "transform 0.2s ease, box-shadow 0.3s ease",
      });

      fab.onmouseenter = () => {
        fab.style.transform = "translateY(-2px)";
        fab.style.boxShadow = "0 22px 45px rgba(0,240,255,0.3)";
      };
      fab.onmouseleave = () => {
        fab.style.transform = "translateY(0)";
        fab.style.boxShadow = "0 18px 40px rgba(0,0,0,0.65)";
      };

      // ---------------- 6. Inner elements ----------------
      const dot = document.createElement("span");
      Object.assign(dot.style, {
        display: "inline-block",
        width: "8px",
        height: "8px",
        borderRadius: "999px",
        background: "#02111f",
        boxShadow: "0 0 0 3px rgba(2,17,31,0.6)",
      });

      const label = document.createElement("span");
      label.textContent = "Reviews";

      fab.appendChild(dot);
      fab.appendChild(label);

      // ---------------- 7. Click → open admin in new tab ----------------
      fab.addEventListener("click", () => {
        const adminUrl =
          "https://review-ugc-engine.onrender.com/ugc-admin.html?site_id=" +
          encodeURIComponent(siteId);
        window.open(adminUrl, "_blank", "noopener,noreferrer");
      });

      // ---------------- 8. Add to page ----------------
      document.body.appendChild(fab);

      // ---------------- 9. Debug log ----------------
      setTimeout(() => {
        try {
          const cs = window.getComputedStyle(fab);
          console.log(
            `[AURA] FAB injected. position=${cs.position} bottom=${cs.bottom} right=${cs.right}`
          );
        } catch (_) {}
      }, 200);
    } catch (errOuter) {
      console.warn("[AURA] Loader error:", errOuter);
    }
  });
})();
