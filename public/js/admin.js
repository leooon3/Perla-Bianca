const escapeHTML = (str) => {
  if (str == null) return "";
  return String(str).replace(/[&<>'"]/g, (tag) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  }[tag]));
};

//#region Configuration
const GOOGLE_CLIENT_ID =
  "980340338302-43hbupefo8neh0hbksdra5afdr95b6pj.apps.googleusercontent.com";

const PROPERTIES = [
  { key: "perla-bianca", label: "Perla Bianca", icon: "🏠", active: true },
  { key: "struttura-2", label: "Struttura 2", icon: "🏡", active: false },
];
//#endregion

const app = {
  token: localStorage.getItem("adminToken"),
  otpData: null,
  currentProperty: PROPERTIES[0].key,
  flatpickrInstance: null,
  calendarInstance: null,

  init: function () {
    if (GOOGLE_CLIENT_ID.includes("INCOLLA_QUI")) {
      console.error("ERROR: Insert Google Client ID in js/admin.js");
      alert("Missing Configuration: Insert Google Client ID in code.");
      return;
    }

    if (this.token) {
      this.showDashboard();
    } else {
      this.initGoogleLogin();
    }

    const emailForm = document.getElementById("emailAuthForm");
    if (emailForm) {
      emailForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.sendOtp();
      });
    }

    const verifyBtn = document.getElementById("verifyBtn");
    if (verifyBtn) verifyBtn.addEventListener("click", () => this.verifyOtp());

    const backBtn = document.getElementById("backBtn");
    if (backBtn)
      backBtn.addEventListener("click", () => {
        document.getElementById("step2").classList.add("hidden");
        document.getElementById("step1").classList.remove("hidden");
      });

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) logoutBtn.addEventListener("click", () => this.logout());
  },

  //#region Authentication Logic
  initGoogleLogin: function () {
    if (!window.google) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => this.handleGoogleLogin(response),
    });

    const btnContainer = document.getElementById("googleBtnContainer");
    if (btnContainer) {
      window.google.accounts.id.renderButton(btnContainer, {
        theme: "outline",
        size: "large",
        type: "standard",
      });
    }
  },

  handleGoogleLogin: async function (response) {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "google-login",
          token: response.credential,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Google login error");
      this.loginSuccess(data.token);
    } catch (err) {
      this.showError(err.message);
    }
  },

  sendOtp: async function () {
    const emailInput = document.getElementById("emailInput");
    if (!emailInput) return;
    const email = emailInput.value;

    const btn = document.querySelector("#step1 button");
    const oldText = btn.innerText;
    btn.innerText = "Invio...";
    btn.disabled = true;

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send-otp", email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore invio codice");

      this.otpData = data;
      document.getElementById("step1").classList.add("hidden");
      document.getElementById("step2").classList.remove("hidden");
      this.showError("");
    } catch (err) {
      this.showError(err.message);
    } finally {
      btn.innerText = oldText;
      btn.disabled = false;
    }
  },

  verifyOtp: async function () {
    const codeInput = document.getElementById("otpInput");
    const code = codeInput.value;
    if (!code) return;

    const btn = document.getElementById("verifyBtn");
    const oldText = btn.innerText;
    btn.innerText = "Verifica...";
    btn.disabled = true;

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify-otp",
          email: this.otpData.email,
          hash: this.otpData.hash,
          expires: this.otpData.expires,
          code,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Codice non valido");
      this.loginSuccess(data.token);
    } catch (err) {
      this.showError(err.message);
    } finally {
      btn.innerText = oldText;
      btn.disabled = false;
    }
  },

  loginSuccess: function (token) {
    localStorage.setItem("adminToken", token);
    this.token = token;
    this.showDashboard();
  },

  logout: function () {
    localStorage.removeItem("adminToken");
    window.location.href = "/";
  },
  //#endregion

  //#region Dashboard UI
  showDashboard: function () {
    const loginScreen = document.getElementById("loginScreen");
    const dashboard = document.getElementById("dashboard");
    if (loginScreen) loginScreen.classList.add("hidden");
    if (dashboard) dashboard.classList.remove("hidden");

    this.renderOverview();
    this.renderTabs();
    this.renderTabContent(this.currentProperty);
  },

  showError: function (msg) {
    const el = document.getElementById("errorMsg");
    if (el) {
      el.innerText = msg;
      el.classList.toggle("hidden", !msg);
    } else if (msg) {
      alert(msg);
    }
  },
  //#endregion

  //#region Overview
  renderOverview: function () {
    const grid = document.getElementById("overviewGrid");
    if (!grid) return;

    grid.innerHTML = PROPERTIES.map(
      (p) => `
      <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div class="flex items-center gap-2 mb-4">
          <span class="text-xl">${p.icon}</span>
          <h4 class="font-bold text-slate-700">${p.label}</h4>
          ${
            !p.active
              ? '<span class="ml-auto text-xs bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full font-medium">Prossimamente</span>'
              : ""
          }
        </div>
        ${
          p.active
            ? `
          <div class="grid grid-cols-2 gap-3 mb-4">
            <div class="bg-blue-50 rounded-lg p-3 text-center">
              <div class="text-2xl font-bold text-blue-600" id="ov-bookings-${p.key}">
                <span class="inline-block w-6 h-1.5 bg-blue-200 rounded animate-pulse mt-3"></span>
              </div>
              <div class="text-xs text-blue-400 mt-1">prenotazioni<br>nei prossimi 7 giorni</div>
            </div>
            <div class="bg-amber-50 rounded-lg p-3 text-center">
              <div class="text-2xl font-bold text-amber-500" id="ov-pending-${p.key}">
                <span class="inline-block w-6 h-1.5 bg-amber-200 rounded animate-pulse mt-3"></span>
              </div>
              <div class="text-xs text-amber-400 mt-1">recensioni<br>in attesa</div>
            </div>
          </div>
          <button
            onclick="app.switchTab('${p.key}')"
            class="w-full text-xs font-bold py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-900 transition"
          >
            Gestisci →
          </button>
        `
            : `<p class="text-sm text-slate-400 italic">Struttura non ancora configurata.</p>`
        }
      </div>
    `
    ).join("");

    PROPERTIES.filter((p) => p.active).forEach((p) =>
      this.loadOverviewStats(p.key)
    );
  },

  loadOverviewStats: async function (propertyKey) {
    try {
      const [calRes, revRes] = await Promise.all([
        this.fetchProtected(`/api/calendar?property=${propertyKey}`),
        this.fetchProtected(`/api/reviews?property=${propertyKey}`),
      ]);

      if (calRes && calRes.ok) {
        const events = await calRes.json();
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const upcoming = events.filter((e) => {
          const start = new Date(e.start);
          return start >= now && start <= in7;
        });
        const el = document.getElementById(`ov-bookings-${propertyKey}`);
        if (el) el.textContent = upcoming.length;
      }

      if (revRes && revRes.ok) {
        const reviews = await revRes.json();
        const pending = reviews.filter(
          (r) => !r.Approvato || r.Approvato.toUpperCase() !== "SI"
        );
        const el = document.getElementById(`ov-pending-${propertyKey}`);
        if (el) el.textContent = pending.length;
      }
    } catch (e) {
      console.error("Overview stats error:", e);
    }
  },
  //#endregion

  //#region Property Tabs
  renderTabs: function () {
    const nav = document.getElementById("tabNav");
    if (!nav) return;

    nav.innerHTML = PROPERTIES.map(
      (p) => `
      <button
        onclick="${p.active ? `app.switchTab('${p.key}')` : ""}"
        ${!p.active ? "disabled" : ""}
        class="px-6 py-4 text-sm font-semibold border-b-2 transition ${
          this.currentProperty === p.key
            ? "border-blue-600 text-blue-600"
            : p.active
            ? "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200 cursor-pointer"
            : "border-transparent text-slate-300 cursor-not-allowed"
        }"
      >
        ${p.icon} ${p.label}
        ${
          !p.active
            ? '<span class="ml-1.5 text-[10px] font-normal bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">presto</span>'
            : ""
        }
      </button>
    `
    ).join("");
  },

  switchTab: function (propertyKey) {
    const prop = PROPERTIES.find((p) => p.key === propertyKey);
    if (!prop || !prop.active) return;

    // Destroy existing calendar before switching
    if (this.calendarInstance) {
      this.calendarInstance.destroy();
      this.calendarInstance = null;
    }

    this.currentProperty = propertyKey;
    this.renderTabs();
    this.renderTabContent(propertyKey);
  },

  renderTabContent: function (propertyKey) {
    const content = document.getElementById("tabContent");
    if (!content) return;

    content.innerHTML = `
      <!-- Top section: Add form + Reviews -->
      <div class="grid md:grid-cols-2 gap-6 mb-8">

        <!-- Add Event Form -->
        <div>
          <h3 class="font-bold text-base mb-4">📅 Aggiungi Prenotazione</h3>
          <form id="addEventForm" class="bg-slate-50 p-4 rounded-lg space-y-3">
            <div class="flex items-center gap-2">
              <input
                type="checkbox"
                id="isBlockedDate"
                class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
              />
              <label
                for="isBlockedDate"
                class="text-xs font-bold text-slate-500 uppercase cursor-pointer select-none"
              >
                Segna come Chiuso / Manutenzione
              </label>
            </div>
            <input
              type="text"
              id="eventName"
              placeholder="Nome Ospite"
              class="w-full p-2 border rounded text-sm transition-colors"
              required
            />
            <input
              type="text"
              id="eventDates"
              placeholder="Seleziona Date..."
              class="w-full p-2 border rounded text-sm bg-white"
              required
            />
            <textarea
              id="eventNotes"
              placeholder="Note interne (es. Pagamento, telefono...)"
              class="w-full p-2 border rounded text-sm h-20 resize-none"
            ></textarea>
            <button
              type="submit"
              class="w-full bg-blue-600 text-white py-2 rounded text-sm font-bold hover:bg-blue-700"
            >
              Aggiungi Prenotazione / Blocco
            </button>
          </form>
        </div>

        <!-- Reviews -->
        <div>
          <div class="flex justify-between items-center mb-4">
            <h3 class="font-bold text-base">⭐ Recensioni</h3>
            <button onclick="app.loadReviews()" class="text-blue-500 text-sm hover:underline">
              Aggiorna
            </button>
          </div>
          <div class="mb-4">
            <select
              id="reviewFilter"
              onchange="app.loadReviews()"
              class="w-full p-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="pending" selected>Da Approvare (In attesa)</option>
              <option value="approved">Già Approvate (Pubbliche)</option>
              <option value="all">Tutte le recensioni</option>
            </select>
          </div>
          <div id="reviewsList" class="space-y-3 max-h-[420px] overflow-y-auto text-sm pr-1"></div>
        </div>

      </div>

      <!-- Full Calendar -->
      <div>
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-bold text-base">📆 Calendario Prenotazioni</h3>
          <button onclick="app.loadCalendar()" class="text-blue-500 text-sm hover:underline">
            Aggiorna
          </button>
        </div>
        <div id="calendarEl" class="rounded-lg overflow-hidden border border-slate-200"></div>
      </div>
    `;

    this.initTabListeners();
    this.loadCalendar();
    this.loadReviews();
  },

  initTabListeners: function () {
    if (this.flatpickrInstance) {
      this.flatpickrInstance.destroy();
      this.flatpickrInstance = null;
    }

    const eventDates = document.getElementById("eventDates");
    if (eventDates) {
      this.flatpickrInstance = flatpickr("#eventDates", {
        mode: "range",
        locale: "it",
        minDate: "today",
      });

      const blockCheck = document.getElementById("isBlockedDate");
      const nameInput = document.getElementById("eventName");

      if (blockCheck && nameInput) {
        blockCheck.addEventListener("change", (e) => {
          if (e.target.checked) {
            nameInput.value = "NON DISPONIBILE";
            nameInput.readOnly = true;
            nameInput.classList.add(
              "bg-slate-200",
              "text-slate-500",
              "cursor-not-allowed"
            );
          } else {
            nameInput.value = "";
            nameInput.readOnly = false;
            nameInput.classList.remove(
              "bg-slate-200",
              "text-slate-500",
              "cursor-not-allowed"
            );
          }
        });
      }

      document.getElementById("addEventForm").addEventListener("submit", (e) => {
        e.preventDefault();
        this.addEvent(this.flatpickrInstance.selectedDates);
      });
    }
  },
  //#endregion

  //#region Protected API Helper
  fetchProtected: async function (url, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.token}`,
    };
    const res = await fetch(url, { ...options, headers });

    if (res.status === 401) {
      this.logout();
      return null;
    }
    return res;
  },
  //#endregion

  //#region Calendar
  loadCalendar: async function () {
    const calEl = document.getElementById("calendarEl");
    if (!calEl) return;

    calEl.innerHTML =
      '<div class="text-slate-400 text-center py-12">Caricamento calendario...</div>';

    try {
      const res = await this.fetchProtected(
        `/api/calendar?property=${this.currentProperty}`
      );
      if (!res) return;
      const events = await res.json();

      if (this.calendarInstance) {
        this.calendarInstance.destroy();
        this.calendarInstance = null;
      }
      calEl.innerHTML = "";

      this.calendarInstance = new FullCalendar.Calendar(calEl, {
        initialView: "dayGridMonth",
        locale: "it",
        headerToolbar: {
          left: "prev,next today",
          center: "title",
          right: "",
        },
        buttonText: { today: "Oggi" },
        height: "auto",
        eventTimeFormat: { hour: "2-digit", minute: "2-digit" },
        events: events.map((e) => ({
          id: e.id,
          title: e.realTitle || "Occupato",
          start: e.start,
          end: e.end,
          backgroundColor: "#1B3A5C",
          borderColor: "#1B3A5C",
          textColor: "#ffffff",
          extendedProps: { description: e.description || "" },
        })),
        eventClick: (info) => {
          info.jsEvent.preventDefault();
          this.showEventModal(info.event);
        },
        eventClassNames: "cursor-pointer",
      });

      this.calendarInstance.render();
    } catch (e) {
      calEl.innerHTML =
        '<p class="text-red-500 text-center py-4">Errore di caricamento</p>';
    }
  },

  showEventModal: function (event) {
    document.getElementById("eventDetailModal")?.remove();

    const start = event.start;
    const end = event.end ? new Date(event.end.getTime()) : null;
    // All-day events have exclusive end date — show inclusive
    if (end && event.allDay) end.setDate(end.getDate() - 1);

    const fmt = (d) =>
      d.toLocaleDateString("it-IT", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

    const startStr = fmt(start);
    const endStr =
      end && end.toDateString() !== start.toDateString() ? fmt(end) : "";

    const modal = document.createElement("div");
    modal.id = "eventDetailModal";
    modal.className =
      "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4";

    modal.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" id="eventModalInner">
        <div class="flex justify-between items-start mb-5">
          <h3 class="font-bold text-lg text-slate-800 pr-4 leading-tight">
            ${escapeHTML(event.title)}
          </h3>
          <button
            onclick="document.getElementById('eventDetailModal').remove()"
            class="text-slate-400 hover:text-slate-600 text-2xl leading-none flex-shrink-0"
          >×</button>
        </div>

        <div class="space-y-3 text-sm text-slate-600 mb-6">
          <div class="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2.5">
            <span class="text-base">📅</span>
            <span class="font-medium">${startStr}${endStr ? " &rarr; " + endStr : ""}</span>
          </div>
          ${
            event.extendedProps.description
              ? `
            <div class="flex items-start gap-3 bg-slate-50 rounded-lg px-3 py-2.5">
              <span class="text-base mt-0.5">📝</span>
              <span class="whitespace-pre-wrap leading-relaxed">${escapeHTML(
                event.extendedProps.description
              )}</span>
            </div>
          `
              : '<p class="text-slate-400 italic text-xs px-1">Nessuna nota aggiunta.</p>'
          }
        </div>

        <div class="flex gap-2">
          <button
            onclick="app.deleteEvent('${event.id}'); document.getElementById('eventDetailModal').remove();"
            class="flex-1 bg-red-50 border border-red-200 text-red-500 text-sm font-bold py-2.5 rounded-xl hover:bg-red-100 transition"
          >
            Elimina
          </button>
          <button
            onclick="document.getElementById('eventDetailModal').remove()"
            class="flex-1 bg-slate-100 text-slate-600 text-sm font-bold py-2.5 rounded-xl hover:bg-slate-200 transition"
          >
            Chiudi
          </button>
        </div>
      </div>
    `;

    // Click outside to close
    modal.addEventListener("click", (e) => {
      if (!document.getElementById("eventModalInner").contains(e.target)) {
        modal.remove();
      }
    });

    document.body.appendChild(modal);
  },

  addEvent: async function (dates) {
    if (!dates || dates.length < 2)
      return alert("Seleziona date di inizio e fine");

    const start = dates[0].toLocaleDateString("en-CA");
    const endObj = new Date(dates[1]);
    endObj.setDate(endObj.getDate() + 1);
    const end = endObj.toLocaleDateString("en-CA");

    const titleInput = document.getElementById("eventName");
    const title = titleInput.value;

    const notesInput = document.getElementById("eventNotes");
    const description = notesInput ? notesInput.value : "";

    try {
      const res = await this.fetchProtected("/api/calendar", {
        method: "POST",
        body: JSON.stringify({
          start,
          end,
          title,
          description,
          property: this.currentProperty,
        }),
      });

      if (res && res.ok) {
        document.getElementById("addEventForm").reset();
        if (this.flatpickrInstance) this.flatpickrInstance.clear();
        this.loadCalendar();
        this.loadOverviewStats(this.currentProperty);
        alert("Prenotazione salvata!");
      } else {
        throw new Error("Errore di salvataggio");
      }
    } catch (e) {
      alert("Errore: " + e.message);
    }
  },

  deleteEvent: async function (id) {
    if (!confirm("Davvero vuoi eliminare questa prenotazione?")) return;
    try {
      const res = await this.fetchProtected("/api/calendar", {
        method: "DELETE",
        body: JSON.stringify({ eventId: id, property: this.currentProperty }),
      });
      if (res && res.ok) {
        this.loadCalendar();
        this.loadOverviewStats(this.currentProperty);
      } else {
        alert("Errore di eliminazione");
      }
    } catch (e) {
      alert(e.message);
    }
  },
  //#endregion

  //#region Reviews
  loadReviews: async function () {
    const list = document.getElementById("reviewsList");
    const filterSelect = document.getElementById("reviewFilter");
    if (!list || !filterSelect) return;

    const filterMode = filterSelect.value;

    list.innerHTML =
      "<div class='text-center text-slate-400 py-4'>Caricamento...</div>";

    try {
      const res = await this.fetchProtected(
        `/api/reviews?property=${this.currentProperty}`
      );
      if (!res) return;
      const all = await res.json();

      const allWithIndex = all.map((r, i) => ({ ...r, idx: i }));

      let filtered = [];
      if (filterMode === "pending") {
        filtered = allWithIndex.filter(
          (r) => !r.Approvato || r.Approvato.toUpperCase() !== "SI"
        );
      } else if (filterMode === "approved") {
        filtered = allWithIndex.filter(
          (r) => r.Approvato && r.Approvato.toUpperCase() === "SI"
        );
      } else {
        filtered = allWithIndex;
      }

      if (!filtered.length) {
        list.innerHTML =
          "<div class='text-center py-6 bg-slate-50 text-slate-500 rounded-lg border border-slate-100'>Nessuna recensione in questa categoria.</div>";
        return;
      }

      list.innerHTML = filtered
        .map((r) => {
          const isApproved = r.Approvato && r.Approvato.toUpperCase() === "SI";
          const currentReply = r.Risposta || "";

          let adminActions = "";

          if (!isApproved) {
            adminActions = `<button onclick="app.approveReview(${r.idx})" class="w-full mt-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded transition">APPROVA E PUBBLICA</button>`;
          } else {
            adminActions = `
              <div class="mt-4 pt-3 border-t border-slate-100">
                <label class="text-xs font-bold text-slate-500 uppercase">La tua risposta:</label>
                <textarea
                  id="reply-${r.idx}"
                  class="w-full mt-1 p-2 text-sm border border-slate-300 rounded bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none transition"
                  rows="2"
                  placeholder="Scrivi una risposta pubblica..."
                >${escapeHTML(currentReply)}</textarea>
                <div class="flex gap-2 mt-2">
                  <button onclick="app.saveReply(${r.idx}, event)" class="flex-1 bg-slate-800 text-white text-xs font-bold py-2 rounded hover:bg-slate-900 transition">
                    SALVA RISPOSTA
                  </button>
                  <button onclick="app.deleteReview(${r.idx})" class="flex-1 bg-white border border-red-200 text-red-500 text-xs font-bold py-2 rounded hover:bg-red-50 transition">
                    ELIMINA
                  </button>
                </div>
              </div>
            `;
          }

          return `
            <div class="border border-slate-200 p-4 rounded-xl bg-white hover:shadow-md transition mb-3 relative">
              ${
                isApproved
                  ? '<span class="absolute top-2 right-2 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold border border-green-200">PUBBLICATA</span>'
                  : '<span class="absolute top-2 right-2 text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold border border-yellow-200">IN ATTESA</span>'
              }
              <div class="flex justify-between items-center mb-1 pr-20">
                <span class="font-bold text-slate-700 truncate">${
                  escapeHTML(r["Nome e Cognome"]) || "Ospite"
                }</span>
              </div>
              <div class="text-yellow-400 text-xs font-bold mb-2">★ ${escapeHTML(
                r.Valutazione
              )}</div>
              <p class="text-sm italic text-slate-600 mb-2 wrap-break-word">"${escapeHTML(
                r.Recensione
              )}"</p>
              <div class="text-xs text-slate-400 mb-2">Soggiorno: ${
                escapeHTML(r["Data Soggiorno"]) || "-"
              }</div>
              ${adminActions}
            </div>
          `;
        })
        .join("");
    } catch (e) {
      console.error(e);
      list.innerHTML =
        "<p class='text-red-500 text-center'>Errore nel caricamento recensioni</p>";
    }
  },

  approveReview: async function (idx) {
    if (!confirm("Pubblicare la recensione sul sito?")) return;
    try {
      const res = await this.fetchProtected("/api/approve-review", {
        method: "POST",
        body: JSON.stringify({ rowIndex: idx, property: this.currentProperty }),
      });
      if (res && res.ok) {
        this.loadReviews();
        this.loadOverviewStats(this.currentProperty);
      } else {
        alert("Errore di approvazione");
      }
    } catch (e) {
      alert("Errore: " + e.message);
    }
  },

  deleteReview: async function (idx) {
    if (!confirm("ATTENZIONE: Eliminare permanentemente questa recensione?"))
      return;
    try {
      const res = await this.fetchProtected("/api/delete-review", {
        method: "POST",
        body: JSON.stringify({ rowIndex: idx, property: this.currentProperty }),
      });
      if (res && res.ok) {
        this.loadReviews();
      } else {
        alert("Errore di eliminazione");
      }
    } catch (e) {
      alert(e.message);
    }
  },

  saveReply: async function (idx, ev) {
    const replyText = document.getElementById(`reply-${idx}`).value;
    const btn = ev.target;
    const originalText = btn.innerText;

    btn.innerText = "Salvataggio...";
    btn.disabled = true;

    try {
      const res = await this.fetchProtected("/api/reply-review", {
        method: "POST",
        body: JSON.stringify({
          rowIndex: idx,
          replyText,
          property: this.currentProperty,
        }),
      });

      if (res && res.ok) {
        btn.innerText = "SALVATA! ✓";
        setTimeout(() => {
          btn.innerText = originalText;
          btn.disabled = false;
        }, 2000);
      } else {
        throw new Error("Errore di salvataggio");
      }
    } catch (e) {
      alert("Errore: " + e.message);
      btn.innerText = originalText;
      btn.disabled = false;
    }
  },
  //#endregion
};

// Initialize on load
document.addEventListener("DOMContentLoaded", () => app.init());
