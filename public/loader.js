// public/loader.js
(function (window, document) {
  function loadScript(src, cb) {
    var s = document.createElement("script");
    s.async = true;
    s.src = src;
    s.onload = cb;
    document.head.appendChild(s);
  }

  function initWidget(config) {
    // If widget script already loaded, just init
    if (window.AuraReviewsWidget && window.AuraReviewsWidget._ready) {
      window.AuraReviewsWidget.init(config);
      return;
    }

    // Otherwise load widget.js then init
    loadScript("/widget.js", function () {
      if (window.AuraReviewsWidget && window.AuraReviewsWidget._ready) {
        window.AuraReviewsWidget.init(config);
      } else {
        console.error("AURA Reviews widget failed to load.");
      }
    });
  }

  window.AuraReviewsWidget = window.AuraReviewsWidget || {};
  window.AuraReviewsWidget.init = initWidget;
})(window, document);
