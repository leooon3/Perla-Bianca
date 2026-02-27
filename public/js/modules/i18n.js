/**
 * i18n.js — Sistema di internazionalizzazione
 * Carica le traduzioni da /js/i18n/{lang}.json
 */

const SUPPORTED_LANGS = ["it", "en", "fr", "de"];

let currentLang = "it";
let translations = {};

/**
 * Restituisce la traduzione per la chiave data.
 * @param {string} key
 * @returns {string}
 */
export function t(key) {
  return translations[key] ?? key;
}

/**
 * Restituisce la lingua attiva.
 * @returns {string}
 */
export function getLang() {
  return currentLang;
}

/**
 * Aggiorna il testo del bottone "Oggi" di FullCalendar.
 * @param {string} lang
 */
export function updateTodayBtnText(lang) {
  const btn = document.querySelector(".fc-today-button");
  if (!btn) return;
  const labels = { it: "Oggi", fr: "Aujourd'hui", de: "Heute", en: "Today" };
  btn.textContent = labels[lang] ?? "Today";
  btn.style.textTransform = "capitalize";
}

/**
 * Applica le traduzioni al DOM e aggiorna il calendario se presente.
 * Esposta globalmente per i bottoni HTML (onclick="changeLanguage('en')").
 * @param {string} lang
 */
async function applyLanguage(lang) {
  // Carica il JSON se non è la lingua già in memoria
  if (lang !== currentLang || Object.keys(translations).length === 0) {
    try {
      const res = await fetch(`/js/i18n/${lang}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      translations = await res.json();
    } catch (err) {
      // fallback silenzioso — lingua non disponibile, si usa 'it'
      if (lang !== "it") {
        await applyLanguage("it");
        return;
      }
    }
  }

  currentLang = lang;
  localStorage.setItem("preferredLang", lang);

  // Aggiorna testi
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (translations[key]) el.textContent = translations[key];
  });

  // Aggiorna placeholder
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (translations[key]) el.placeholder = translations[key];
  });

  // Aggiorna calendario se presente
  if (window.calendar && typeof window.calendar.setOption === "function") {
    window.calendar.setOption("locale", lang);
    updateTodayBtnText(lang);
  }

  // Aggiorna CSS variable per testo eventi FullCalendar
  document.documentElement.style.setProperty(
    "--busy-text",
    t("cal_busy")
  );

  document.body.classList.remove("lang-loading");

  // GA4: traccia cambio lingua (solo se non è il caricamento iniziale)
  if (typeof gtag === "function" && document.readyState === "complete") {
    gtag("event", "select_language", { language: lang });
  }
}

/**
 * Inizializza il sistema i18n: rileva lingua e applica le traduzioni.
 * Deve essere awaited prima degli altri moduli (calendar usa currentLang).
 */
export async function initI18n() {
  // Rileva lingua preferita
  let lang = localStorage.getItem("preferredLang");

  if (!lang) {
    const userLang = (navigator.language || navigator.userLanguage || "it")
      .toLowerCase()
      .slice(0, 2);
    lang = SUPPORTED_LANGS.includes(userLang) ? userLang : "en";
  }

  // Esponi globalmente per i bottoni onclick nel footer
  window.changeLanguage = applyLanguage;

  await applyLanguage(lang);
}
