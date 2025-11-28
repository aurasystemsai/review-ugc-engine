// public/widget.js
// AURA • Universal front-end widget
// This runs on ANY site (Shopify, Framer, Wix, etc.)
// It creates a floating "Reviews" button bottom-right + a small panel.

(function () {
  // Avoid double-loading
  if (window.AURA_WIDGET_LOADED) return;
  window.AURA_WIDGET_LOADED = true;

  // ---------------------------------------------------------------------------
  // 1) Inject widget styles (scoped + high z-index so pages can't easily break it)
  // ---------------------------------------------------------------------------
  function injectStyles() {
    if (document.getElementById('aura-widget-styles')) return;

    const style = document.createElement('style');
    style.id = 'aura-widget-styles';
    style.textContent = `
      .aura-widget-reset {
        all: initial;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;
      }

      .aura-widget-root {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 2147483000; /* above most stuff */
      }

      .aura-widget-button {
        position: fixed;
        bottom: 24px;
        right: 24px;
        pointer-events: auto;
      }

      .aura-widget-button-inner {
        all: unset;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 10px 18px;
        border-radius: 999px;
        background: linear-gradient(135deg, #00f0ff, #00c8ff);
        color: #05080f;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.55);
        transition:
          transform 160ms ease-out,
          box-shadow 160ms ease-out,
          opacity 160ms ease-out;
        opacity: 0.96;
      }

      .aura-widget-button-inner:hover {
        transform: translateY(-1px);
        box-shadow: 0 22px 60px rgba(0, 0, 0, 0.65);
        opacity: 1;
      }

      .aura-widget-button-inner:active {
        transform: translateY(0);
        box-shadow: 0 8px 26px rgba(0, 0, 0, 0.75);
      }

      .aura-widget-pill-dot {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: #05080f;
      }

      /* Panel */
      .aura-widget-panel {
        position: fixed;
        bottom: 80px;
        right: 24px;
        width: min(420px, calc(100vw - 32px));
        max-height: min(520px, calc(100vh - 120px));
        pointer-events: auto;
        background: rgba(5, 8, 15, 0.98);
        border-radius: 22px;
        border: 1px solid rgba(0, 240, 255, 0.22);
        box-shadow: 0 32px 90px rgba(0, 0, 0, 0.85);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        opacity: 0;
        transform: translateY(6px);
        visibility: hidden;
        transition:
          opacity 140ms ease-out,
          transform 140ms ease-out,
          visibility 140ms ease-out;
      }

      .aura-widget-panel[data-open="true"] {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }

      .aura-widget-panel-header {
        padding: 14px 18px 10px;
        border-bottom: 1px solid rgba(0, 240, 255, 0.16);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .aura-widget-panel-title {
        color: #e7f6ff;
        font-size: 14px;
        font-weight: 600;
      }

      .aura-widget-panel-sub {
        color: #9fb3d8;
        font-size: 12px;
        margin-top: 2px;
      }

      .aura-widget-close {
        all: unset;
        width: 24px;
        height: 24px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: #9fb3d8;
        cursor: pointer;
        border: 1px solid rgba(159, 179, 216, 0.4);
      }

      .aura-widget-close:hover {
        color: #ffffff;
        border-color: rgba(0, 240, 255, 0.7);
      }

      .aura-widget-panel-body {
        padding: 12px 18px 16px;
        color: #c6d7ff;
        font-size: 13px;
        overflow: auto;
      }

      .aura-widget-tag {
        display: inline-flex;
        padding: 3px 8px;
        border-radius: 999px;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        border: 1px solid rgba(0, 240, 255, 0.4);
        color: #00f0ff;
        margin-bottom: 6px;
      }

      .aura-widget-link {
        color: #00f0ff;
        cursor: pointer;
        font-size: 12px;
        text-decoration: underline;
      }

      .aura-widget-link:hover {
        color: #5fffd3;
      }

      @media (max-width: 640px) {
        .aura-widget-button {
          bottom: 16px;
          right: 16px;
        }
        .aura-widget-button-inner {
          padding: 9px 16px;
          font-size: 13px;
        }
        .aura-widget-panel {
          bottom: 72px;
          right: 16px;
          width: min(400px, calc(100vw - 24px));
        }
      }
    `;
    document.head.appendChild(style);
  }

  // ---------------------------------------------------------------------------
  // 2) Create DOM elements
  // ---------------------------------------------------------------------------
  function createWidget() {
    injectStyles();

    const root = document.createElement('div');
    root.className = 'aura-widget-root aura-widget-reset';

    // Floating button wrapper
    const btnWrapper = document.createElement('div');
    btnWrapper.className = 'aura-widget-button';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'aura-widget-button-inner';

    const dot = document.createElement('span');
    dot.className = 'aura-widget-pill-dot';

    const label = document.createElement('span');
    label.textContent = 'Reviews';

    btn.appendChild(dot);
    btn.appendChild(label);
    btnWrapper.appendChild(btn);

    // Panel
    const panel = document.createElement('div');
    panel.className = 'aura-widget-panel';
    panel.setAttribute('data-open', 'false');

    const header = document.createElement('div');
    header.className = 'aura-widget-panel-header';

    const titleWrap = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'aura-widget-panel-title';
    title.textContent = 'AURA • Review UGC Engine';

    const sub = document.createElement('div');
    sub.className = 'aura-widget-panel-sub';
    sub.textContent = 'Moderate customer reviews & UGC before they hit your site.';

    titleWrap.appendChild(title);
    titleWrap.appendChild(sub);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'aura-widget-close';
    closeBtn.innerHTML = '×';

    header.appendChild(titleWrap);
    header.appendChild(closeBtn);

    const body = document.createElement('div');
    body.className = 'aura-widget-panel-body';

    const tag = document.createElement('div');
    tag.className = 'aura-widget-tag';
    tag.textContent = 'Reviews enabled';

    const copy = document.createElement('p');
    copy.textContent =
      'Your site is connected to the AURA Review UGC Engine. Reviews and photos will be captured via API or integrations and held for moderation.';

    const link = document.createElement('span');
    link.className = 'aura-widget-link';
    link.textContent = 'Open moderation dashboard';
    link.addEventListener('click', function () {
      window.open('https://review-ugc-engine.onrender.com/admin/ugc', '_blank', 'noopener');
    });

    body.appendChild(tag);
    body.appendChild(copy);
    body.appendChild(link);

    panel.appendChild(header);
    panel.appendChild(body);

    root.appendChild(btnWrapper);
    root.appendChild(panel);

    document.body.appendChild(root);

    // -----------------------------------------------------------------------
    // 3) Wire up interactions
    // -----------------------------------------------------------------------
    function togglePanel() {
      const isOpen = panel.getAttribute('data-open') === 'true';
      panel.setAttribute('data-open', isOpen ? 'false' : 'true');
    }

    btn.addEventListener('click', togglePanel);
    closeBtn.addEventListener('click', togglePanel);

    // Click outside to close
    document.addEventListener('click', function (evt) {
      if (panel.getAttribute('data-open') !== 'true') return;
      const target = evt.target;
      if (!panel.contains(target) && !btnWrapper.contains(target)) {
        panel.setAttribute('data-open', 'false');
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 4) Initialise when DOM is ready
  // ---------------------------------------------------------------------------
  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  ready(createWidget);
})();
