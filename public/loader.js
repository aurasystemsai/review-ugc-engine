// public/loader.js
// AURA • Universal Reviews Loader (MVP)
// - Customers paste ONE script tag
// - We detect their site, check config, and inject a FAB
// - FAB is fixed bottom-right with inline styles (no CSS conflicts)
// - Clicking FAB opens the AURA reviews admin in a new tab

(function () {
  // ---------- helper: run when DOM is ready ----------
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  ready(async function () {
    try {
      // 1) Don’t run twice, don’t run on admin
      if (document.getElementById("aura-reviews-fab")) return;

      var path = window.location.pathname || "";
      if (path.startsWith("/admin")) {
        // Hide FAB on your admin pages
        return;
      }

      // 2) Identify site
      var scriptTag = document.currentScript;
      var siteId =
        (scriptTag && scriptTag.getAttribute("data-aura-site-id")) ||
        ("domain:" + window.location.hostname);

      // 3) Ask your API which tools are enabled
      var configUrl =
        "https://review-ugc-engine.onrender.com/api/aura-config?site_id=" +
        encodeURIComponent(siteId);

      var res;
      try {
        res = await fetch(configUrl, { credentials: "omit" });
      } catch (err) {
        console.warn("[AURA] Config request failed:", err);
        return;
      }

      if (!res.ok) {
        console.warn("[AURA] Config fetch failed with status:", res.status);
        return;
      }

      var config;
      try {
        config = await res.json();
      } catch (err) {
        console.warn("[AURA] Failed to parse config JSON:", err);
        return;
      }

      // 4) If reviews tool is not enabled, stop
      if (
        !config ||
        !config.tools ||
        !config.tools.reviews ||
        !config.tools.reviews.enabled
      ) {
        console.log("[AURA] Reviews tool disabled for this site:", siteId);
        return;
      }

      // 5) Create floating FAB with INLINE styles (no CSS overrides)
      var fab = document.createElement("button");
      fab.id = "aura-reviews-fab";
      fab.type = "button";
      fab.textContent = "Reviews";

      // Inline styles so we ignore whatever builder (Framer, Shopify, Wix, etc.)
      fab.style.position = "fixed";
      fab.style.right = "24px";
      fab.style.bottom = "24px";
      fab.style.zIndex = "2147483647";
      fab.style.padding = "10px 18px";
      fab.style.borderRadius = "999px";
      fab.style.border = "1px solid rgba(0, 240, 255, 0.45)";
      fab.style.background =
        "radial-gradient(circle at 0% 0%, #00f0ff, #0077ff)";
      fab.style.color = "#02111f";
      fab.style.fontFamily =
        'system-ui,-apple-system,BlinkMacSystemFont,"SF Pro Text","Inter",sans-serif';
      fab.style.fontSize = "14px";
      fab.style.fontWeight = "600";
      fab.style.letterSpacing = "0.02em";
      fab.style.cursor = "pointer";
      fab.style.boxShadow = "0 18px 40px rgba(0, 0, 0, 0.65)";
      fab.style.display = "inline-flex";
      fab.style.alignItems = "center";
      fab.style.gap = "8px";
      fab.style.backgroundClip = "padding-box";

      // Small pulse dot
      var dot = document.createElement("span");
      dot.style.display = "inline-block";
      dot.style.width = "8px";
      dot.style.height = "8px";
      dot.style.borderRadius = "999px";
      dot.style.background = "#02111f";
      dot.style.boxShadow = "0 0 0 3px rgba(2, 17, 31, 0.6)";

      var label = document.createElement("span");
      label.textContent = "Reviews";

      fab.textContent = "";
      fab.appendChild(dot);
      fab.appendChild(label);

      // Debug: log final computed position once
      setTimeout(function () {
        try {
          var cs = window.getComputedStyle(fab);
          console.log(
            "[AURA] FAB injected. position=" +
              cs.position +
              " bottom=" +
              cs.bottom +
              " right=" +
              cs.right
          );
        } catch (_) {}
      }, 100);

      // 6) Click -> open admin in new tab for now (MVP)
      fab.addEventListener("click", function () {
        var adminUrl =
          "https://review-ugc-engine.onrender.com/admin/ugc?site_id=" +
          encodeURIComponent(siteId);

        window.open(adminUrl, "_blank", "noopener,noreferrer");
      });

      // 7) Attach to body
      document.body.appendChild(fab);
    } catch (errOuter) {
      console.warn("[AURA] Loader error:", errOuter);
    }
  });
})();
