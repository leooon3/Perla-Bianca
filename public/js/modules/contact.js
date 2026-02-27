/**
 * contact.js — Form di contatto con validazione e invio email
 */

import { t } from "./i18n.js";
import { escapeHTML } from "./utils.js";
import { track } from "./analytics.js";

export function initContact() {
  const form = document.getElementById("contactForm");
  const statusDiv = document.getElementById("formStatus");
  if (!form || !statusDiv) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const emailValue = form.email.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(emailValue)) {
      statusDiv.textContent = t("js_email_invalid");
      statusDiv.className = "text-red-600";
      setTimeout(() => { statusDiv.textContent = ""; statusDiv.className = ""; }, 3000);
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    statusDiv.textContent = t("js_sending");
    statusDiv.className = "text-gray-700";

    const formData = {
      nome:      escapeHTML(form.nome.value.trim()),
      email:     escapeHTML(emailValue),
      messaggio: escapeHTML(form.messaggio.value.trim()),
      honeypot:  form.honeypot.value,
    };

    fetch("/api/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
      .then(async (response) => {
        let data;
        try { data = await response.json(); } catch (err) {}

        if (response.ok) {
          track("generate_lead", { form_type: "contact" });
          statusDiv.textContent = t("js_msg_success");
          statusDiv.className = "text-green-600";
          form.reset();
          setTimeout(() => { statusDiv.textContent = ""; statusDiv.className = ""; }, 5000);
        } else {
          throw new Error(data?.message || "Unknown Error");
        }
      })
      .catch((error) => {
        statusDiv.textContent = t("js_error") + error.message;
        statusDiv.className = "text-red-600";
        setTimeout(() => { statusDiv.textContent = ""; statusDiv.className = ""; }, 5000);
      })
      .finally(() => { submitButton.disabled = false; });
  });
}
