/**
 * analytics.js — GA4 tracking wrapper, scroll depth e CTA click
 * Per attivare: sostituisci G-XXXXXXXXXX con il tuo Measurement ID in
 * public/perla-bianca/index.html e public/index.html
 */

/**
 * Invia un evento a GA4. No-op se gtag non è caricato.
 * @param {string} name  - Nome evento GA4
 * @param {Object} params - Parametri evento
 */
export function track(name, params = {}) {
  if (typeof gtag === "function") gtag("event", name, params);
}

/**
 * Inizializza scroll depth tracking e CTA click tracking.
 */
export function initAnalytics() {
  _trackScrollDepth();
  _trackCTAClicks();
}

// ─── Scroll Depth ─────────────────────────────────────────────────────────────

function _trackScrollDepth() {
  const thresholds = [25, 50, 75, 90];
  const fired = new Set();

  window.addEventListener(
    "scroll",
    () => {
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;

      const pct = Math.round((window.scrollY / scrollable) * 100);
      thresholds.forEach((d) => {
        if (pct >= d && !fired.has(d)) {
          fired.add(d);
          track("scroll", { percent_scrolled: d });
        }
      });
    },
    { passive: true }
  );
}

// ─── CTA Clicks (via data-track-cta) ──────────────────────────────────────────

function _trackCTAClicks() {
  document.querySelectorAll("[data-track-cta]").forEach((el) => {
    el.addEventListener("click", () => {
      track("cta_click", { cta_label: el.getAttribute("data-track-cta") });
    });
  });
}
