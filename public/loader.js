// public/loader.js
(function () {
  'use strict';

  // ----------------------------------------------------
  // Small helper: run after DOM is ready
  // ----------------------------------------------------
  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  // ----------------------------------------------------
  // CSS for FAB + modal
  // ----------------------------------------------------
  var STYLES = `
  .aura-reviews-fab {
    position: fixed !important;
    right: 24px !important;
    bottom: 24px !important;
    z-index: 99999 !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 8px !important;
    padding: 10px 18px !important;
    border-radius: 999px !important;
    border: 1px solid rgba(0, 240, 255, 0.35) !important;
    background: radial-gradient(circle at 0% 0%, #00f0ff, #00a6ff) !important;
    color: #020617 !important;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif !important;
    font-size: 14px !important;
    font-weight: 600 !important;
    letter-spacing: 0.02em !important;
    cursor: pointer !important;
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(15, 23, 42, 0.9) !important;
    transition: transform 0.18s ease-out, box-shadow 0.18s ease-out, opacity 0.18s ease-out !important;
  }

  .aura-reviews-fab:hover {
    transform: translateY(-1px) !important;
    box-shadow: 0 22px 50px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(56, 189, 248, 0.75) !important;
  }

  .aura-reviews-fab:active {
    transform: translateY(0) scale(0.98) !important;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.7) !important;
  }

  .aura-reviews-fab .aura-reviews-fab__dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: #0f172a;
    box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.65);
  }

  .aura-reviews-fab .aura-reviews-fab__label {
    white-space: nowrap;
  }

  /* Backdrop + modal frame */
  .aura-reviews-modal-backdrop {
    position: fixed !important;
    inset: 0 !important;
    background: radial-gradient(circle at top, rgba(15, 23, 42, 0.95), rgba(2, 6, 23, 0.96)) !important;
    z-index: 99998 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 24px !important;
  }

  .aura-reviews-modal-frame {
    position: relative !important;
    width: min(980px, 100%) !important;
    height: min(640px, calc(100% - 32px)) !important;
    border-radius: 24px !important;
    background: radial-gradient(circle at top, #020617, #020617) !important;
    border: 1px solid rgba(56, 189, 248, 0.4) !important;
    box-shadow:
      0 40px 120px rgba(15, 23, 42, 0.95),
      0 0 0 1px rgba(15, 23, 42, 1),
      0 0 60px rgba(56, 189, 248, 0.35) !important;
    overflow: hidden !important;
  }

  .aura-reviews-modal-frame iframe {
    width: 100% !important;
    height: 100% !important;
    border: none !important;
    display: block !important;
  }

  .aura-reviews-modal-close {
    position: absolute !important;
    top: 12px !important;
    right: 12px !important;
    width: 32px !important;
    height: 32px !important;
    border-radius: 999px !important;
    border: 1px solid rgba(148, 163, 184, 0.6) !important;
    background: rgba(15, 23, 42, 0.85) !important;
    color: #e2e8f0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    cursor: pointer !important;
    font-size: 18px !important;
    font-weight: 500 !important;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.9) !important;
  }

  .aura-reviews-modal-close:hover {
    background: rgba(15, 23, 42, 1) !important;
  }

  /* Mobile tweaks */
  @media (max-width: 640px) {
    .aura-reviews-fab {
      right: 16px !important;
      bottom: 16px !important;
      padding: 9px 16px !important;
      font-size: 13px !important;
    }

    .aura-reviews-modal-backdrop {
      padding: 12px !important;
    }

    .aura-reviews-modal-frame {
      width: 100% !important;
      height: 100% !important;
      border-radius: 18px !important;
    }
  }
  `;

  // ----------------------------------------------------
  // Main loader
  // ----------------------------------------------------
  ready(async function () {
    try {
      // 1) Identify the script & site ID
      var scriptTag = document.currentScript || (function () {
        var scripts = document.getElementsByTagName('script');
        return scripts[scripts.length - 1];
      })();

      var siteId =
        scriptTag.getAttribute('data-aura-site-id') ||
        ('domain:' + window.location.hostname);

      // 2) Fetch config from your service
      var configUrl =
        (scriptTag.src.indexOf('review-ugc-engine.onrender.com') !== -1
          ? 'https://review-ugc-engine.onrender.com'
          : '') +
        '/api/aura-config?site_id=' +
        encodeURIComponent(siteId);

      var configRes = await fetch(configUrl, { credentials: 'omit' });
      if (!configRes.ok) {
        console.warn('[AURA Loader] Failed to load config', configRes.status);
        return;
      }

      var config = await configRes.json();
      if (!config || !config.tools || !config.tools.reviews || !config.tools.reviews.enabled) {
        // Reviews tool not enabled for this site – do nothing
        return;
      }

      // 3) Inject styles once
      if (!document.getElementById('aura-reviews-styles')) {
        var styleEl = document.createElement('style');
        styleEl.id = 'aura-reviews-styles';
        styleEl.textContent = STYLES;
        document.head.appendChild(styleEl);
      }

      // 4) Create FAB and attach it to BODY (not inside the embed)
      var fab = document.createElement('button');
      fab.id = 'aura-reviews-fab';
      fab.className = 'aura-reviews-fab';
      fab.type = 'button';

      fab.innerHTML =
        '<span class="aura-reviews-fab__dot"></span>' +
        '<span class="aura-reviews-fab__label">Reviews</span>';

      // Attach directly to <body> so transforms in Framer sections do not trap it
      (document.body || document.documentElement).appendChild(fab);

      // 5) Click → open admin modal in iframe
      fab.addEventListener('click', function (ev) {
        ev.preventDefault();
        openModal(siteId);
      });

      function openModal(siteId) {
        if (document.getElementById('aura-reviews-modal-backdrop')) {
          return; // already open
        }

        var backdrop = document.createElement('div');
        backdrop.id = 'aura-reviews-modal-backdrop';
        backdrop.className = 'aura-reviews-modal-backdrop';

        var frameWrapper = document.createElement('div');
        frameWrapper.className = 'aura-reviews-modal-frame';

        var closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'aura-reviews-modal-close';
        closeBtn.innerHTML = '&times;';

        var iframe = document.createElement('iframe');
        var base = 'https://review-ugc-engine.onrender.com';
        iframe.src = base + '/admin/ugc?site_id=' + encodeURIComponent(siteId);
        iframe.setAttribute('loading', 'lazy');
        iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');

        closeBtn.addEventListener('click', function () {
          document.body.removeChild(backdrop);
        });

        backdrop.addEventListener('click', function (e) {
          if (e.target === backdrop) {
            document.body.removeChild(backdrop);
          }
        });

        frameWrapper.appendChild(closeBtn);
        frameWrapper.appendChild(iframe);
        backdrop.appendChild(frameWrapper);
        (document.body || document.documentElement).appendChild(backdrop);
      }
    } catch (err) {
      console.error('[AURA Loader] Error initialising reviews widget', err);
    }
  });
})();
