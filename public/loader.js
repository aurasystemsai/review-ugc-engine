// public/loader.js
// AURA • Universal Reviews Loader (customer-ready, hardcoded site_id)
// - Merchants paste ONE script tag on their site
// - MUST provide data-aura-site-id (hardcoded site id)
// - Adds a fixed bottom-right floating "Reviews" button
// - Opens the UGC admin console in a new tab for that site

(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  ready(async function () {
    try {
      // 1) Prevent duplicate injection
      if (document.getElementById("aura-reviews-fab")) return;

      const path = window.location.pathname || "";
      if (path.startsWith("/admin")) return; // safety – don’t show inside admin

      // 2) Determine site_id (HARD-CODED via data attribute)
      //    If it's missing, we do NOTHING – merchants must supply it.
      let scriptTag = document.currentScript;

      if (!scriptTag) {
        const scripts = document.getElementsByTagName("script");
        if (scripts && scripts.length) {
          scriptTag = scripts[scripts.length - 1];
        }
      }

      if (!scriptTag) {
        console.warn(
          "[AURA] loader.js could not find its <script> tag. FAB not injected."
        );
        return;
      }

      const siteIdAttr = scriptTag.getAttribute("data-aura-site-id");
      if (!siteIdAttr) {
        console.warn(
          "[AURA] data-aura-site-id is REQUIRED on the loader <script>. FAB not injected."
        );
        return;
      }

      const siteId = siteIdAttr.trim();
      if (!siteId) {
        console.warn(
          "[AURA] data-aura-site-id is empty. FAB not injected."
        );
        return;
      }

      // 3) OPTIONAL config call – only to allow explicit disable
      let reviewsEnabled = true;
      const configUrl =
        "https://review-ugc-engine.onrender.com/api/aura-config?site_id=" +
        encodeURIComponent(siteId);

      try {
        const res = await fetch(configUrl, { credentials: "omit" });
        if (res.ok) {
          const cfg = await res.json().catch(() => null);
          if (
            cfg &&
            cfg.tools &&
            cfg.tools.reviews &&
            cfg.tools.reviews.enabled === false
          ) {
            reviewsEnabled = false;
          }
        } else {
          console.warn("[AURA] Config fetch non-OK:", res.status);
        }
      } catch (err) {
        console.warn("[AURA] Config request failed (continuing):", err);
      }

      if (!reviewsEnabled) {
        console.log("[AURA] Reviews explicitly disabled for site:", siteId);
        return;
      }

      // 4) Create floating FAB
      const fab = document.createElement("button");
      fab.id = "aura-reviews-fab";
      fab.type = "button";

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

      // 5) Click → open proper admin page for THIS site_id
      fab.addEventListener("click", () => {
        const adminUrl =
          "https://review-ugc-engine.onrender.com/ugc-admin.html?site_id=" +
          encodeURIComponent(siteId);
        window.open(adminUrl, "_blank", "noopener,noreferrer");
      });

      document.body.appendChild(fab);

      setTimeout(() => {
        try {
          const cs = window.getComputedStyle(fab);
          console.log(
            `[AURA] FAB injected for ${siteId}. position=${cs.position} bottom=${cs.bottom} right=${cs.right}`
          );
        } catch (_) {}
      }, 200);
    } catch (errOuter) {
      console.warn("[AURA] Loader error:", errOuter);
    }
  });
})();
