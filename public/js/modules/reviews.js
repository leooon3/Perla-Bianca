/**
 * reviews.js — Visualizzazione recensioni da Google Sheets
 */

import { t } from "./i18n.js";
import { escapeHTML } from "./utils.js";

const REVIEWS_API_URL = "/api/reviews";

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export async function initReviews() {
  const reviewsContainer = document.getElementById("reviewsContainer");
  const averageRatingContainer = document.getElementById("averageRating");
  if (!reviewsContainer || !averageRatingContainer) return;

  try {
    reviewsContainer.innerHTML = `
      <div class="col-span-full flex justify-center py-10">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        <span class="ml-3 text-gray-500">${t("js_loading_reviews")}</span>
      </div>`;

    const response = await fetch(REVIEWS_API_URL);
    if (!response.ok) throw new Error("Error loading reviews");
    const data = await response.json();

    const approvedReviews = data.filter(
      (row) => row.Approvato && row.Approvato.toUpperCase() === "SI"
    );

    if (approvedReviews.length === 0) {
      reviewsContainer.innerHTML = `<p class="text-center text-gray-500 col-span-full py-10">${t("js_no_reviews")}</p>`;
      averageRatingContainer.innerHTML = "";
      return;
    }

    let totalRating = 0;
    let reviewsHtml = "";

    approvedReviews.forEach((review) => {
      const nome = escapeHTML(review["Nome e Cognome"] || "Ospite");
      const testo = escapeHTML(review["Recensione"] || "");
      const dataSoggiorno = escapeHTML(review["Data Soggiorno"] || "");
      const voto = parseInt(review["Valutazione"], 10) || 0;
      const initials = getInitials(nome);

      totalRating += voto;

      const rispostaAdmin = review["Risposta"]
        ? `<div class="mt-4 ml-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg text-sm text-gray-700">
            <p class="font-bold text-blue-800 text-xs mb-1 uppercase tracking-wider">${t("js_host_response")}</p>
            <p class="italic">"${escapeHTML(review["Risposta"])}"</p>
           </div>`
        : "";

      const starsHTML = Array(5)
        .fill(0)
        .map((_, i) =>
          i < voto
            ? '<span class="text-yellow-400 text-lg">★</span>'
            : '<span class="text-gray-200 text-lg">★</span>'
        )
        .join("");

      reviewsHtml += `
        <div class="group relative bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full">
          <div class="absolute top-4 right-6 text-8xl text-blue-50 font-serif opacity-50 select-none pointer-events-none group-hover:text-blue-100 transition-colors">"</div>
          <div class="flex items-center gap-4 mb-4 relative z-10">
            <div class="w-12 h-12 rounded-full bg-linear-to-br from-blue-50 to-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg border border-blue-200 shadow-sm shrink-0">
              ${initials}
            </div>
            <div>
              <h3 class="font-bold text-gray-900 text-lg leading-tight">${nome}</h3>
              <div class="flex -mt-0.5">${starsHTML}</div>
            </div>
          </div>
          <div class="relative z-10 grow">
            <p class="text-gray-600 leading-relaxed italic text-[0.95rem]">"${testo}"</p>
            ${rispostaAdmin}
          </div>
          ${dataSoggiorno ? `
          <div class="mt-5 pt-4 border-t border-gray-50 text-xs text-gray-400 font-medium uppercase tracking-wider relative z-10 flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            ${t("js_stay_date")} ${dataSoggiorno}
          </div>` : ""}
        </div>`;
    });

    const average = (totalRating / approvedReviews.length).toFixed(1);
    const fullStarsCount = Math.round(average);
    const averageStars = "★".repeat(fullStarsCount) + "☆".repeat(5 - fullStarsCount);

    averageRatingContainer.innerHTML = `
      <div class="bg-white rounded-2xl p-8 shadow-lg border border-blue-50 inline-flex flex-col md:flex-row items-center gap-6 md:gap-10 transform hover:-translate-y-1 transition duration-300">
        <div class="text-center md:text-left">
          <div class="text-5xl font-extrabold text-blue-600 leading-none">${average}</div>
          <div class="text-xs text-gray-400 uppercase font-semibold mt-2">${t("rating_out_of")}</div>
        </div>
        <div class="h-12 w-px bg-gray-200 hidden md:block"></div>
        <div class="text-center md:text-left">
          <div class="text-2xl text-yellow-400 tracking-wider mb-1">${averageStars}</div>
          <p class="text-gray-500 font-medium">${t("rating_based_on_pre")} <span class="text-blue-600 font-bold">${approvedReviews.length}</span> ${t("rating_based_on_post")}</p>
        </div>
      </div>`;

    reviewsContainer.innerHTML = reviewsHtml;
  } catch (error) {
    reviewsContainer.innerHTML = `<div class="col-span-full text-center p-6 bg-red-50 rounded-xl border border-red-100 text-red-600"><p>Unable to load reviews.</p></div>`;
  }
}
