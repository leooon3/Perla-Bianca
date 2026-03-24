/**
 * i18n-simple.js — Internazionalizzazione per pagine statiche (home, struttura-2)
 * Non usa ES modules. Carica le traduzioni da /js/i18n/{lang}.json
 */
(async function () {
  const SUPPORTED = ["it", "en", "fr", "de", "es"];

  // 1. Rileva lingua (localStorage → browser → default EN)
  let lang = localStorage.getItem("preferredLang");
  if (!lang) {
    const userLang = (navigator.language || "en").toLowerCase().slice(0, 2);
    lang = SUPPORTED.includes(userLang) ? userLang : "en";
  }

  let translations = {};

  // 2. Carica JSON traduzioni
  async function loadTranslations(l) {
    try {
      const res = await fetch("/js/i18n/" + l + ".json");
      if (!res.ok) throw new Error("HTTP " + res.status);
      return await res.json();
    } catch {
      return l !== "en" ? loadTranslations("en") : {};
    }
  }

  // 3. Applica traduzioni al DOM
  function applyTranslations() {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (translations[key] !== undefined) el.textContent = translations[key];
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-html");
      if (translations[key] !== undefined) el.innerHTML = translations[key];
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-placeholder");
      if (translations[key] !== undefined) el.placeholder = translations[key];
    });
    document.documentElement.lang = lang;
  }

  // 4. Esponi changeLanguage globalmente (per i bottoni onclick nel footer)
  window.changeLanguage = async function (l) {
    lang = l;
    localStorage.setItem("preferredLang", l);
    translations = await loadTranslations(l);
    applyTranslations();
  };

  // 5. Init — applica subito dopo il DOM
  translations = await loadTranslations(lang);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyTranslations);
  } else {
    applyTranslations();
  }
})();
