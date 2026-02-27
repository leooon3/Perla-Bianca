/**
 * prices.js — Carica tariffe dinamiche dall'API e popola la tabella #prezzi
 */

const esc = (s) =>
  String(s ?? "").replace(/[<>&"']/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" }[c])
  );

export function initPrices() {
  const tbody = document.getElementById("pricesTbody");
  if (!tbody) return;

  fetch("/api/prices?property=perla-bianca")
    .then((r) => r.json())
    .then((prices) => {
      if (!Array.isArray(prices) || !prices.length) return; // keep static fallback

      tbody.innerHTML = prices
        .map((p) => {
          const periodo =
            p.dal && p.al ? `${esc(p.dal)} &ndash; ${esc(p.al)}` : "&mdash;";
          const notte  = p.prezzoNotte ? `€${p.prezzoNotte}` : "&mdash;";
          const min    = p.minNotti    ? `${p.minNotti} notti min.` : "&mdash;";
          const pulizie = p.pulizie   ? `€${p.pulizie}` : "&mdash;";
          return `
          <tr>
            <td>${esc(p.stagione)}</td>
            <td>${periodo}</td>
            <td class="price-highlight">${notte}</td>
            <td>${min}</td>
            <td>${pulizie}</td>
          </tr>`;
        })
        .join("");
    })
    .catch(() => {
      // Graceful: static table remains visible
    });
}
