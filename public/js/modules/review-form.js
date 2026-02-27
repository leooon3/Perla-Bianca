/**
 * review-form.js — Form invio recensione (solo lascia-recensione.html)
 */

import { t } from "./i18n.js";

export function initReviewForm() {
  const starContainer = document.getElementById("starContainer");
  const reviewForm = document.getElementById("internalReviewForm");
  const statusDiv = document.getElementById("reviewFormStatus");
  const submitBtn = document.getElementById("submitReviewBtn");
  const votoInput = document.getElementById("votoInput");

  if (!starContainer || !reviewForm) return;

  // ─── Stelle interattive ───
  const stars = starContainer.querySelectorAll(".star");
  const highlightStars = (rating) => {
    stars.forEach((star) => {
      const val = parseInt(star.getAttribute("data-value"));
      star.classList.toggle("text-yellow-400", val <= rating);
      star.classList.toggle("text-gray-300", val > rating);
    });
  };

  stars.forEach((star) => {
    star.addEventListener("click", () => {
      const val = parseInt(star.getAttribute("data-value"));
      votoInput.value = val;
      highlightStars(val);
    });
  });

  // ─── Submit ───
  reviewForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!votoInput.value) {
      alert(t("review_star_required"));
      return;
    }

    const arrivoValue = reviewForm.data_arrivo.value;
    const partenzaValue = reviewForm.data_partenza.value;

    if (arrivoValue && partenzaValue) {
      if (new Date(partenzaValue) <= new Date(arrivoValue)) {
        statusDiv.textContent = t("review_date_order");
        statusDiv.className =
          "text-center text-sm font-medium mt-4 p-3 rounded-lg bg-red-100 text-red-700 block";
        setTimeout(() => { statusDiv.className = "hidden"; }, 4000);
        return;
      }
    }

    submitBtn.disabled = true;
    submitBtn.textContent = t("js_sending");
    submitBtn.classList.add("opacity-75", "cursor-not-allowed");
    statusDiv.className = "hidden";

    const formatDate = (dateStr) => {
      if (!dateStr) return "";
      const [y, m, d] = dateStr.split("-");
      return `${d}/${m}/${y}`;
    };

    const dataFormattata = `${formatDate(arrivoValue)} - ${formatDate(partenzaValue)}`;

    const formData = {
      nome:          reviewForm.nome.value.trim(),
      voto:          reviewForm.voto.value,
      messaggio:     reviewForm.messaggio.value.trim(),
      dataSoggiorno: dataFormattata,
    };

    try {
      const response = await fetch("/api/submit-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      if (response.ok) {
        statusDiv.textContent = t("js_msg_success") + " Redirect...";
        statusDiv.className =
          "text-center text-sm font-medium mt-4 p-3 rounded-lg bg-green-100 text-green-700 block";
        setTimeout(() => { window.location.href = "index.html#recensioni"; }, 2000);
      } else {
        throw new Error(result.message || "Unknown Error");
      }
    } catch (error) {
      statusDiv.textContent = t("js_error") + error.message;
      statusDiv.className =
        "text-center text-sm font-medium mt-4 p-3 rounded-lg bg-red-100 text-red-700 block";
      submitBtn.disabled = false;
      submitBtn.textContent = t("review_btn_submit");
      submitBtn.classList.remove("opacity-75", "cursor-not-allowed");
    }
  });
}
