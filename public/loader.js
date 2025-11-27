// public/loader.js
// AURA OS Universal Loader – minimal, reviews-only

(function () {
  'use strict';

  // -------------------------------
  // Helper: safely get current <script> tag
  // -------------------------------
  function getCurrentScript() {
    if (document.currentScript) return document.currentScript;
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  }

  var scriptEl = getCurrentScript();
  if (!scriptEl) {
    console.warn('[AURA Loader] No script element found.');
    return;
  }

  // -------------------------------
  // Config from script tag
  // -------------------------------
  var rawSiteId = scriptEl.getAttribute('data-aura-site-id');
  var hostname = window.location.hostname.replace(/^www\./, '');
  var siteId = rawSiteId && rawSiteId.trim()
    ? rawSiteId.trim()
    : 'domain:' + hostname;

  // Derive API base from script src, but allow override
  var scriptSrc = scriptEl.getAttribute('src') || '';
  var apiBase;
  try {
    apiBase = new URL(scriptSrc, window.location.origin).origin;
  } catch (e) {
    apiBase = window.location.origin;
  }
  var overrideApi = scriptEl.getAttribute('data-aura-api');
  if (overrideApi && overrideApi.trim()) {
    apiBase = overrideApi.trim().replace(/\/+$/, '');
  }

  // -------------------------------
  // Small helpers
  // -------------------------------
  function fetchJson(url) {
    return fetch(url, {
      credentials: 'omit',
      headers: { 'Accept': 'application/json' }
    }).then(function (res) {
      if (!res.ok) {
        throw new Error('HTTP ' + res.status + ' for ' + url);
      }
      return res.json();
    });
  }

  function onDomReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function loadWidgetScript(apiBase, config, context) {
    // Avoid double-loading
    if (window.AURA_WIDGET && window.AURA_WIDGET.loaded) {
      if (typeof window.AURA_WIDGET.mountReviews === 'function') {
        window.AURA_WIDGET.mountReviews({
          apiBase: apiBase,
          config: config,
          siteId: context.siteId
        });
      }
      return;
    }

    var s = document.createElement('script');
    s.src = apiBase + '/widget.js';
    s.async = true;
    s.defer = true;
    s.onload = function () {
      if (window.AURA_WIDGET && typeof window.AURA_WIDGET.mountReviews === 'function') {
        window.AURA_WIDGET.loaded = true;
        window.AURA_WIDGET.mountReviews({
          apiBase: apiBase,
          config: config,
          siteId: context.siteId
        });
      } else {
        console.warn('[AURA Loader] widget.js loaded but AURA_WIDGET.mountReviews is missing');
      }
    };
    s.onerror = function (err) {
      console.error('[AURA Loader] Failed to load widget.js', err);
    };
    document.head.appendChild(s);
  }

  // -------------------------------
  // Main: fetch config, then load widget
  // -------------------------------
  var configUrl = apiBase + '/api/aura-config?site_id=' + encodeURIComponent(siteId);

  fetchJson(configUrl)
    .then(function (config) {
      try {
        var reviewsEnabled =
          config &&
          config.tools &&
          config.tools.reviews &&
          config.tools.reviews.enabled;

        if (!reviewsEnabled) {
          console.info('[AURA Loader] Reviews tool disabled for siteId ' + siteId);
          return;
        }

        onDomReady(function () {
          loadWidgetScript(apiBase, config, { siteId: siteId });
        });
      } catch (e) {
        console.error('[AURA Loader] Error handling config', e);
      }
    })
    .catch(function (err) {
      console.error('[AURA Loader] Failed to fetch /api/aura-config', err);
    });
})();

