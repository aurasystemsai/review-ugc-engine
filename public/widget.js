// public/widget.js
// AURA • Floating Reviews Launcher
// Loaded by loader.js after /api/aura-config says reviews.enabled === true

(function () {
  // Avoid double-init if the script is injected twice
  if (window.AURA_REVIEW_WIDGET_LOADED) return;
  window.AURA_REVIEW_WIDGET_LOADED = true;

  const CONFIG = window.__AURA_CONFIG__ || {};
  const siteId = CONFIG.siteId || "unknown-site";

  // ---------------------------------------------------------------------------
  // Create root container – ALWAYS fixed to the viewport
  // ---------------------------------------------------------------------------
  const root = document.createElement("div");
  root.id = "aura-review-widget";

  Object.assign(root.style, {
    position: "fixed",
    right: "32px",
    bottom: "32px",
    zIndex: "999999",          // sit above Framer / Shopify UI
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "auto",
  });

  // ---------------------------------------------------------------------------
  // Button UI
  // ---------------------------------------------------------------------------
  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-label", "Open reviews");
  button.setAttribute("data-aura-site-id", siteId);

  Object.assign(button.style, {
    background: "linear-gradient(135deg,#00f0ff,#00c8ff)",
    color: "#02030a",
    borderRadius: "999px",
    padding: "10px 20px",
    border: "none",
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "Inter", sans-serif',
    fontWeight: "600",
    fontSize: "14px",
    letterSpacing: "0.02em",
    boxShadow: "0 18px 40px rgba(0, 0, 0, 0.45)",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    transition: "transform 0.15s ease-out, box-shadow 0.15s ease-out",
    outline: "none",
  });

  // Little glowing dot
  const dot = document.createElement("span");
  Object.assign(dot.style, {
    width: "10px",
    height: "10px",
    borderRadius: "999px",
    background: "#02030a",
    boxShadow: "0 0 0 2px rgba(2, 3, 10, 0.4)",
  });

  const label = document.createElement("span");
  label.textContent = "Reviews";

  button.appendChild(dot);
  button.appendChild(label);

  // Hover / active states
  button.addEventListener("mouseenter", () => {
    button.style.transform = "translateY(-2px)";
    button.style.boxShadow = "0 22px 50px rgba(0, 0, 0, 0.55)";
  });

  button.addEventListener("mouseleave", () => {
    button.style.transform = "translateY(0)";
    button.style.boxShadow = "0 18px 40px rgba(0, 0, 0, 0.45)";
  });

  button.addEventListener("mousedown", () => {
    button.style.transform = "translateY(1px) scale(0.98)";
  });

  button.addEventListener("mouseup", () => {
    button.style.transform = "translateY(-2px)";
  });

  // ---------------------------------------------------------------------------
  // Click behaviour (placeholder for now)
  // ---------------------------------------------------------------------------
  button.addEventListener("click", () => {
    // For now, just prove wiring works.
    // Later we’ll swap this for a proper drawer / panel pulling from /api/ugc.
    alert("AURA Reviews launcher clicked – next step is wiring the UI.");
  });

  // Put everything on the page
  root.appendChild(button);
  document.body.appendChild(root);

  // ---------------------------------------------------------------------------
  // Responsive tweaks – slightly closer to the edges on mobile
  // ---------------------------------------------------------------------------
  function updatePosition() {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    root.style.right = isMobile ? "16px" : "32px";
    root.style.bottom = isMobile ? "16px" : "32px";
  }

  updatePosition();
  window.addEventListener("resize", updatePosition);
})();
