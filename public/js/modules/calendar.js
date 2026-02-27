/**
 * calendar.js — FullCalendar con selezione tap-tap e tooltip
 * Dipendenze: FullCalendar (globale CDN), t() e getLang() da i18n.js
 */

import { t, getLang, updateTodayBtnText } from "./i18n.js";

export function initCalendar() {
  const calendarEl = document.getElementById("calendar");
  if (!calendarEl) return;

  const isMobile = window.innerWidth < 768;
  let selectionStart = null;

  const removeTooltip = () => {
    const existing = document.querySelector(".calendar-tooltip");
    if (existing) existing.remove();
  };

  window.calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    locale: getLang(),
    headerToolbar: {
      left: "",
      center: "prev title next",
      right: "today",
    },
    height: "auto",
    contentHeight: isMobile ? 400 : 500,
    firstDay: 1,
    selectable: true,
    selectMirror: true,
    unselectAuto: true,

    dateClick: function (info) {
      removeTooltip();

      if (selectionStart === null) {
        selectionStart = info.date;
        window.calendar.unselect();
        document
          .querySelectorAll(".fc-day-selected-start")
          .forEach((el) => el.classList.remove("fc-day-selected-start"));
        info.dayEl.classList.add("fc-day-selected-start");
      } else {
        const clickedDate = info.date;

        if (clickedDate < selectionStart) {
          selectionStart = clickedDate;
          document
            .querySelectorAll(".fc-day-selected-start")
            .forEach((el) => el.classList.remove("fc-day-selected-start"));
          info.dayEl.classList.add("fc-day-selected-start");
          return;
        }

        const endDateExclusive = new Date(clickedDate);
        endDateExclusive.setDate(endDateExclusive.getDate() + 1);

        window.calendar.select({ start: selectionStart, end: endDateExclusive });
        selectionStart = null;
        document
          .querySelectorAll(".fc-day-selected-start")
          .forEach((el) => el.classList.remove("fc-day-selected-start"));
      }
    },

    select: function (info) {
      removeTooltip();

      const endDate = new Date(info.end);
      endDate.setDate(endDate.getDate() - 1);
      const localeMap = { it: "it-IT", en: "en-GB", fr: "fr-FR", de: "de-DE" };
      const dateLocale = localeMap[getLang()] || "it-IT";
      const startStr = info.start.toLocaleDateString(dateLocale);
      const endStr = endDate.toLocaleDateString(dateLocale);

      const isoDate = endDate.toISOString().split("T")[0];
      const dayEl = document.querySelector(`[data-date="${isoDate}"]`);

      if (dayEl) {
        const tooltip = document.createElement("div");
        tooltip.className = "calendar-tooltip";
        tooltip.innerHTML = `
          <h4>${t("cal_tooltip_title")}</h4>
          <p>${startStr} - ${endStr}</p>
          <button id="tooltipBtn">${t("cal_tooltip_btn")}</button>
        `;
        document.body.appendChild(tooltip);

        const rect = dayEl.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        let top = rect.top + scrollTop - tooltip.offsetHeight - 10;
        let left = rect.left + scrollLeft + rect.width / 2 - tooltip.offsetWidth / 2;
        if (left < 10) left = 10;
        if (left + tooltip.offsetWidth > window.innerWidth) {
          left = window.innerWidth - tooltip.offsetWidth - 10;
        }
        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;

        document.getElementById("tooltipBtn").addEventListener("click", () => {
          const msgInput = document.querySelector('textarea[name="messaggio"]');
          const contactSection = document.getElementById("contatti");
          const msgText = `${t("cal_req_msg_start")} ${startStr} ${t("cal_req_msg_end")} ${endStr}.`;

          if (msgInput) msgInput.value = msgText;
          if (contactSection) contactSection.scrollIntoView({ behavior: "smooth" });

          const form = document.getElementById("contactForm");
          if (form) {
            form.classList.add("ring-2", "ring-blue-500");
            setTimeout(() => form.classList.remove("ring-2", "ring-blue-500"), 2000);
          }
          removeTooltip();
        });
      }
    },

    unselect: function () {
      // intentionally empty
    },

    datesSet: function () {
      updateTodayBtnText(getLang());
      removeTooltip();
    },

    events: "/api/calendar",
    eventSourceFailure: function (error) {
      console.error("Calendar Error:", error);
    },
  });

  window.calendar.render();

  document.addEventListener("click", (e) => {
    if (
      !e.target.closest(".calendar-tooltip") &&
      !e.target.closest(".fc-daygrid-day") &&
      !e.target.closest(".fc-event")
    ) {
      removeTooltip();
    }
  });
}
