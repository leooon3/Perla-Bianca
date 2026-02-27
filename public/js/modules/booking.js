/**
 * booking.js — Date picker nella sezione disponibilità.
 * Quando l'utente seleziona un intervallo, pre-compila il textarea
 * del form contatti e scrolla alla sezione.
 */

import { getLang } from "./i18n.js";

// Modelli di messaggio per lingua
const MSG_TEMPLATES = {
  it: (from, to) =>
    `Ciao! Vorrei prenotare Perla Bianca dal ${from} al ${to}.\nPotete confermarmi la disponibilità e i dettagli per procedere?`,
  en: (from, to) =>
    `Hello! I would like to book Perla Bianca from ${from} to ${to}.\nCould you please confirm availability and share the booking details?`,
  de: (from, to) =>
    `Hallo! Ich möchte Perla Bianca vom ${from} bis ${to} buchen.\nKönnten Sie bitte die Verfügbarkeit bestätigen und die Details mitteilen?`,
  fr: (from, to) =>
    `Bonjour ! Je souhaite réserver Perla Bianca du ${from} au ${to}.\nPouvez-vous confirmer la disponibilité et nous donner les détails ?`,
};

export function initBooking() {
  const input = document.getElementById("bookingDates");
  const btn   = document.getElementById("bookingBtn");
  if (!input || !btn) return;
  if (typeof flatpickr === "undefined") return; // CDN non caricato

  // Inizializza date picker range
  flatpickr(input, {
    mode:       "range",
    locale:     "it",
    dateFormat: "d/m/Y",
    minDate:    "today",
  });

  btn.addEventListener("click", () => {
    const val = input.value?.trim();

    if (!val || !val.includes(" to ")) {
      // Nessuna data o intervallo incompleto — shake visivo
      input.classList.add("booking-dates-error");
      setTimeout(() => input.classList.remove("booking-dates-error"), 800);
      return;
    }

    const [from, to] = val.split(" to ");
    const lang       = getLang();
    const template   = MSG_TEMPLATES[lang] ?? MSG_TEMPLATES.it;
    const message    = template(from, to);

    // Pre-compila textarea
    const textarea = document.getElementById("contactMessaggio");
    if (textarea) {
      textarea.value = message;
    }

    // Scrolla al form contatti e focalizza il campo nome
    const contactSection = document.getElementById("contatti");
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => {
        document.getElementById("contactNome")?.focus();
      }, 600);
    }
  });
}
