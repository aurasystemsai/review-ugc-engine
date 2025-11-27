(function () {
  if (window.__AURA_LOADER_INITIALISED__) return;
  window.__AURA_LOADER_INITIALISED__ = true;

  const currentScript =
    document.currentScript ||
    document.querySelector('script[data-aura-site-id]') ||
    document.querySelector('script[src*="loader.js"]');

  if (!currentScript) {
    console.warn('[AURA] loader.js: no script tag found');
    return;
  }

  const siteIdAttr = currentScript.getAttribute('data-aura-site-id');
  const siteId = siteIdAttr || `domain:${window.location.hostname}`;

  const explicitService = currentScript.getAttribute('data-aura-service');
  const serviceBase =
    explicitService ||
    (window.location.hostname === 'localhost'
      ? 'http://localhost:4001'
      : 'https://review-ugc-engine.onrender.com');

  const configUrl =
    serviceBase + '/api/aura-config?site_id=' + encodeURIComponent(siteId);

  function injectScript(src, extraAttrs) {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;

    if (extraAttrs) {
      Object.keys(extraAttrs).forEach((key) => {
        s.setAttribute(key, extraAttrs[key]);
      });
    }

    document.head.appendChild(s);
  }

  fetch(configUrl)
    .then((res) => {
      if (!res.ok) throw new Error('Config HTTP ' + res.status);
      return res.json();
    })
    .then((config) => {
      if (!config || !config.tools) {
        console.warn('[AURA] Invalid config payload', config);
        return;
      }

      const tools = config.tools;

      // Reviews widget
      if (tools.reviews && tools.reviews.enabled) {
        injectScript(serviceBase + '/widget.js', {
          'data-aura-site-id': siteId,
          'data-aura-service': serviceBase
        });
      }

      // In future: SEO tool, Schema tool, etc.
      // if (tools.seo && tools.seo.enabled) { ... }
      // if (tools.schema && tools.schema.enabled) { ... }
    })
    .catch((err) => {
      console.error('[AURA] Failed to load config', err);
    });
})();
