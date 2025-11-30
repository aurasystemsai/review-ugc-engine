// public/loader.js
// AURA Reviews loader: supports both automatic init via <script data-aura-site-id>
// and manual init via AuraReviewsWidget.init(config)

(function (window, document) {
  "use strict";

  function loadScript(src, cb) {
    var s = document.createElement("script");
    s.async = true;
    s.src = src;
    s.onload = cb;
    s.onerror = function () {
      console.error("[AURA Reviews] Failed to load widget script:", src);
    };
    document.head.appendChild(s);
  }

  // Find the <script> tag that loaded this file
  function getCurrentScriptConfig() {
    var script = document.currentScript;

    if (!script) {
      var scripts = document.getElementsByTagName("script");
      if (scripts && scripts.length) {
        script = scripts[scripts.length - 1];
      }
    }

    if (!script) return null;

    var siteId = script.getAttribute("data-aura-site-id") || script.dataset.auraSiteId || "";
    var selector =
      script.getAttribute("data-aura-selector") ||
      script.dataset.auraSelector ||
      "#aura-reviews";

    return {
      siteId: siteId,
      selector: selector
    };
  }

  function ensureContainer(selector) {
    var el = document.querySelector(selector);
    if (el) return el;

    // If selector is an id (e.g. "#aura-reviews"), create it
    if (selector.charAt(0) === "#") {
      var id = selector.slice(1);
      el = document.createElement("div");
      el.id = id;
      document.body.appendChild(el);
      return el;
    }

    // Otherwise just create a default container at the end of <body>
    el = document.createElement("div");
    el.id = "aura-reviews";
    document.body.appendChild(el);
    return el;
  }

  function initWidgetWithConfig(config) {
    config = config || {};
    if (!config.siteId) {
      console.warn("[AURA Reviews] No siteId provided – widget will still render but cannot filter by domain.");
    }

    // Make sure the container exists
    if (config.selector) {
      ensureContainer(config.selector);
    } else {
      config.selector = "#aura-reviews";
      ensureContainer("#aura-reviews");
    }

    if (window.AuraReviewsWidget && window.AuraReviewsWidget._ready) {
      window.AuraReviewsWidget.init(config);
      return;
    }

    loadScript("/widget.js", function () {
      if (window.AuraReviewsWidget && window.AuraReviewsWidget._ready) {
        window.AuraReviewsWidget.init(config);
      } else {
        console.error("[AURA Reviews] widget.js loaded but AURA widget is not ready.");
      }
    });
  }

  // Expose global API for manual use
  window.AuraReviewsWidget = window.AuraReviewsWidget || {};
  window.AuraReviewsWidget.init = function (config) {
    initWidgetWithConfig(config || {});
  };

  // Auto init on DOM ready if script tag has data-aura-site-id
  function autoInitIfConfigured() {
    var cfg = getCurrentScriptConfig();
    if (!cfg || !cfg.siteId) return; // nothing to do

    initWidgetWithConfig(cfg);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoInitIfConfigured);
  } else {
    autoInitIfConfigured();
  }
})(window, document);
