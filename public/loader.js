// public/loader.js
// AURA OS Loader v1.1
// One global script that can enable multiple tools (reviews, SEO, schema, etc.)
// Reads site configuration from the AURA backend and only activates allowed tools.

(function () {
  const ENGINE_ORIGIN = "https://review-ugc-engine.onrender.com";

  // ---------------------------------------------------------------------------
  // Script + site identification
  // ---------------------------------------------------------------------------

  function findLoaderScript() {
    const scripts = document.getElementsByTagName("script");
    for (let i = scripts.length - 1; i >= 0; i--) {
      const s = scripts[i];
      const src = s.getAttribute("src") || "";
      if (src.includes("/loader.js")) return s;
    }
    return null;
  }

  function resolveSiteId() {
    const scriptTag = findLoaderScript();

    // 1) Explicit site ID on the script tag
    if (scriptTag) {
      const explicit = scriptTag.getAttribute("data-aura-site-id");
      if (explicit && explicit.trim()) return explicit.trim();
    }

    // 2) Generic domain-based ID (works for any site)
    return "domain:" + location.hostname;
  }

  // ---------------------------------------------------------------------------
  // Platform / page detection
  // ---------------------------------------------------------------------------

  function detectPlatform() {
    try {
      if (window.Shopify && window.Shopify.shop) return "shopify";
      if (window.ShopifyAnalytics && window.ShopifyAnalytics.meta) return "shopify";
    } catch (e) {
      // ignore
    }
    return "generic";
  }

  function isProductPage() {
    const platform = detectPlatform();

    if (platform === "shopify") {
      try {
        const sa = window.ShopifyAnalytics;
        if (sa && sa.meta && sa.meta.product && sa.meta.product.id) return true;
      } catch (e) {}
    }

    const metaType = document.querySelector('meta[name="aura:page-type"]');
    if (metaType && metaType.content === "product") return true;

    const path = location.pathname.toLowerCase();
    if (path.includes("/products/") || path.includes("/product/")) return true;

    return false;
  }

  function resolveProductId() {
    const platform = detectPlatform();

    if (platform === "shopify") {
      try {
        const sa = window.ShopifyAnalytics;
        if (sa && sa.meta && sa.meta.product && sa.meta.product.id) {
          return "shopify:" + sa.meta.product.id;
        }
      } catch (e) {}
    }

    const meta = document.querySelector('meta[name="aura:product-id"]');
    if (meta && meta.content) return meta.content;

    return "url:" + location.hostname + location.pathname;
  }

  // ---------------------------------------------------------------------------
  // DOM helpers
  // ---------------------------------------------------------------------------

  function injectReviewContainer(productId) {
    if (document.getElementById("aura-review-widget")) return;

    const container = document.createElement("div");
    container.id = "aura-review-widget";
    container.setAttribute("data-product-id", productId);

    const anchor =
      document.querySelector("[data-aura-ugc-anchor]") ||
      document.querySelector(".ProductInfo") ||
      document.querySelector(".product__info") ||
      document.querySelector("#ProductInfo") ||
      document.body;

    anchor.appendChild(container);
  }

  function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[src="' + src + '"]')) {
        return resolve();
      }
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed to load " + src));
      document.head.appendChild(s);
    });
  }

  // ---------------------------------------------------------------------------
  // Config fetching
  // ---------------------------------------------------------------------------

  async function fetchAuraConfig(siteId) {
    const url =
      ENGINE_ORIGIN +
      "/api/aura-config?site_id=" +
      encodeURIComponent(siteId);

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error("Config fetch failed with status " + res.status);
    }
    return res.json();
  }

  // ---------------------------------------------------------------------------
  // Tool initialisation
  // ---------------------------------------------------------------------------

  async function initReviewsTool(config) {
    if (!config.tools || !config.tools.reviews || !config.tools.reviews.enabled) {
      return;
    }

    if (!isProductPage()) return;

    const productId = resolveProductId();
    injectReviewContainer(productId);

    try {
      await loadScriptOnce(ENGINE_ORIGIN + "/widget.js");
    } catch (e) {
      console.error("[AURA Loader] Failed to load reviews widget:", e);
    }
  }

  async function initAllTools() {
    const siteId = resolveSiteId();

    let config;
    try {
      config = await fetchAuraConfig(siteId);
    } catch (e) {
      console.error("[AURA Loader] Could not load config, falling back to reviews only:", e);
      // Safe fallback: reviews on, others off
      config = {
        siteId,
        plan: "fallback",
        tools: {
          reviews: { enabled: true }
        }
      };
    }

    // Future: await initSEOTool(config); await initSchemaTool(config); etc.
    await initReviewsTool(config);
  }

  function start() {
    const metaDisable = document.querySelector('meta[name="aura:disable-loader"]');
    if (metaDisable && metaDisable.content === "true") return;

    initAllTools();
  }

  if (typeof window !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start);
    } else {
      start();
    }
  }
})();
