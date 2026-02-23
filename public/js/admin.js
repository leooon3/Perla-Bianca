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
      <div style="background:white; border-radius:14px; border:1px solid #E8E0D4; padding:1.4rem 1.25rem; box-shadow:0 2px 12px rgba(0,0,0,0.05);">
        <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:1.1rem;">
          <span style="font-size:1.25rem;">${p.icon}</span>
          <h4 style="font-family:'Playfair Display',serif; font-size:1.1rem; font-weight:700; color:#1B3A5C; margin:0;">${p.label}</h4>
          ${
            !p.active
              ? '<span style="margin-left:auto; font-size:0.68rem; background:#F0EBE3; color:#aaa; padding:0.2rem 0.6rem; border-radius:50px; font-weight:600; letter-spacing:0.05em;">Prossimamente</span>'
              : ""
          }
        </div>
        ${
          p.active
            ? `
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; margin-bottom:1rem;">
            <div style="background:#EEF2F8; border-radius:10px; padding:0.875rem; text-align:center;">
              <div style="font-size:1.6rem; font-weight:700; color:#1B3A5C; min-height:2rem;" id="ov-bookings-${p.key}">
                <span style="display:inline-block; width:1.5rem; height:0.375rem; background:rgba(27,58,92,0.2); border-radius:4px; margin-top:0.75rem;"></span>
              </div>
              <div style="font-size:0.7rem; color:#6a88aa; margin-top:0.3rem; line-height:1.4;">prenotazioni<br>nei prossimi 7 giorni</div>
            </div>
            <div style="background:#FBF0E8; border-radius:10px; padding:0.875rem; text-align:center;">
              <div style="font-size:1.6rem; font-weight:700; color:#C4622D; min-height:2rem;" id="ov-pending-${p.key}">
                <span style="display:inline-block; width:1.5rem; height:0.375rem; background:rgba(196,98,45,0.2); border-radius:4px; margin-top:0.75rem;"></span>
              </div>
              <div style="font-size:0.7rem; color:#b07050; margin-top:0.3rem; line-height:1.4;">recensioni<br>in attesa</div>
            </div>
          </div>
          <button
            onclick="app.switchTab('${p.key}')"
            style="width:100%; font-size:0.75rem; font-weight:700; padding:0.6rem; border-radius:8px; background:#C4622D; color:white; border:none; cursor:pointer; font-family:'Inter',sans-serif; letter-spacing:0.08em; transition:background 0.2s;"
            onmouseover="this.style.background='#d4784a'"
            onmouseout="this.style.background='#C4622D'"
          >
            Gestisci →
          </button>
        `
            : `<p style="font-size:0.85rem; color:#bbb; font-style:italic; margin:0;">Struttura non ancora configurata.</p>`
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

    nav.innerHTML = PROPERTIES.map((p) => {
      const isActive = this.currentProperty === p.key;
      const isDisabled = !p.active;
      const baseStyle = `padding:0.9rem 1.5rem; font-size:0.82rem; font-weight:600; border-bottom:2.5px solid; background:none; font-family:'Inter',sans-serif; letter-spacing:0.04em; transition:color 0.2s, border-color 0.2s; cursor:${isDisabled ? "not-allowed" : "pointer"};`;
      const stateStyle = isActive
        ? "border-color:#C4622D; color:#C4622D;"
        : isDisabled
        ? "border-color:transparent; color:#ccc;"
        : "border-color:transparent; color:#888;";
      const hoverAttrs = (!isDisabled && !isActive)
        ? `onmouseover="this.style.color='#1B3A5C'" onmouseout="this.style.color='#888'"`
        : "";
      return `
      <button
        onclick="${p.active ? `app.switchTab('${p.key}')` : ""}"
        ${isDisabled ? "disabled" : ""}
        style="${baseStyle}${stateStyle}"
        ${hoverAttrs}
      >
        ${p.icon} ${p.label}
        ${!p.active ? '<span style="margin-left:0.4rem; font-size:0.62rem; font-weight:500; background:#F0EBE3; color:#bbb; padding:0.15rem 0.45rem; border-radius:4px;">presto</span>' : ""}
      </button>`;
    }).join("");
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
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:1rem;">
            <h3 style="font-family:'Playfair Display',serif; font-size:1.1rem; color:#1B3A5C; margin:0;">📅 Aggiungi Prenotazione</h3>
          </div>
          <form id="addEventForm" style="background:#FAF8F4; padding:1.1rem; border-radius:12px; border:1px solid #E8E0D4; display:flex; flex-direction:column; gap:0.65rem;">
            <div style="display:flex; align-items:center; gap:0.6rem;">
              <input
                type="checkbox"
                id="isBlockedDate"
                style="width:1rem; height:1rem; accent-color:#C4622D; cursor:pointer;"
              />
              <label
                for="isBlockedDate"
                style="font-size:0.72rem; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:0.08em; cursor:pointer; user-select:none;"
              >
                Segna come Chiuso / Manutenzione
              </label>
            </div>
            <input
              type="text"
              id="eventName"
              placeholder="Nome Ospite"
              style="width:100%; padding:0.65rem 0.875rem; border:1.5px solid #E8E0D4; border-radius:8px; font-size:0.875rem; background:white; font-family:'Inter',sans-serif; outline:none; transition:border-color 0.2s;"
              onfocus="this.style.borderColor='#1B3A5C'" onblur="this.style.borderColor='#E8E0D4'"
              required
            />
            <input
              type="text"
              id="eventDates"
              placeholder="Seleziona Date..."
              style="width:100%; padding:0.65rem 0.875rem; border:1.5px solid #E8E0D4; border-radius:8px; font-size:0.875rem; background:white; font-family:'Inter',sans-serif; outline:none;"
              required
            />
            <textarea
              id="eventNotes"
              placeholder="Note interne (es. Pagamento, telefono...)"
              style="width:100%; padding:0.65rem 0.875rem; border:1.5px solid #E8E0D4; border-radius:8px; font-size:0.875rem; background:white; font-family:'Inter',sans-serif; outline:none; height:5rem; resize:none; transition:border-color 0.2s;"
              onfocus="this.style.borderColor='#1B3A5C'" onblur="this.style.borderColor='#E8E0D4'"
            ></textarea>
            <button
              type="submit"
              style="width:100%; background:#C4622D; color:white; padding:0.7rem; border:none; border-radius:8px; font-size:0.82rem; font-weight:700; cursor:pointer; font-family:'Inter',sans-serif; letter-spacing:0.06em; transition:background 0.2s;"
              onmouseover="this.style.background='#d4784a'" onmouseout="this.style.background='#C4622D'"
            >
              Aggiungi Prenotazione / Blocco
            </button>
          </form>
        </div>

        <!-- Reviews -->
        <div>
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:1rem;">
            <h3 style="font-family:'Playfair Display',serif; font-size:1.1rem; color:#1B3A5C; margin:0;">⭐ Recensioni</h3>
            <button onclick="app.loadReviews()" style="background:none; border:none; font-size:0.8rem; color:#C4622D; font-weight:600; cursor:pointer; font-family:'Inter',sans-serif; letter-spacing:0.04em; text-decoration:underline; text-underline-offset:3px;">
              Aggiorna
            </button>
          </div>
          <div style="margin-bottom:1rem;">
            <select
              id="reviewFilter"
              onchange="app.loadReviews()"
              style="width:100%; padding:0.65rem 0.875rem; border:1.5px solid #E8E0D4; border-radius:8px; font-size:0.875rem; background:#FAF8F4; font-family:'Inter',sans-serif; outline:none; cursor:pointer;"
            >
              <option value="pending" selected>Da Approvare (In attesa)</option>
              <option value="approved">Già Approvate (Pubbliche)</option>
              <option value="all">Tutte le recensioni</option>
            </select>
          </div>
          <div id="reviewsList" style="display:flex; flex-direction:column; gap:0.75rem; max-height:420px; overflow-y:auto; padding-right:0.25rem; font-size:0.875rem;"></div>
        </div>

      </div>

      <!-- Full Calendar -->
      <div>
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:1rem;">
          <h3 style="font-family:'Playfair Display',serif; font-size:1.1rem; color:#1B3A5C; margin:0;">📆 Calendario Prenotazioni</h3>
          <button onclick="app.loadCalendar()" style="background:none; border:none; font-size:0.8rem; color:#C4622D; font-weight:600; cursor:pointer; font-family:'Inter',sans-serif; letter-spacing:0.04em; text-decoration:underline; text-underline-offset:3px;">
            Aggiorna
          </button>
        </div>
        <div id="calendarEl" style="border-radius:12px; overflow:hidden; border:1px solid #E8E0D4;"></div>
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
      <div style="background:white; border-radius:20px; box-shadow:0 32px 80px rgba(0,0,0,0.22); width:100%; max-width:360px; padding:1.75rem;" id="eventModalInner">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.25rem;">
          <h3 style="font-family:'Playfair Display',serif; font-size:1.15rem; color:#1B3A5C; margin:0; padding-right:1rem; line-height:1.3;">
            ${escapeHTML(event.title)}
          </h3>
          <button
            onclick="document.getElementById('eventDetailModal').remove()"
            style="background:none; border:none; color:#bbb; font-size:1.6rem; line-height:1; cursor:pointer; flex-shrink:0; padding:0; transition:color 0.2s;"
            onmouseover="this.style.color='#555'" onmouseout="this.style.color='#bbb'"
          >×</button>
        </div>

        <div style="display:flex; flex-direction:column; gap:0.6rem; margin-bottom:1.5rem; font-size:0.875rem; color:#555;">
          <div style="display:flex; align-items:center; gap:0.75rem; background:#FAF8F4; border-radius:9px; padding:0.7rem 0.875rem;">
            <span style="font-size:1rem;">📅</span>
            <span style="font-weight:600; color:#333;">${startStr}${endStr ? " → " + endStr : ""}</span>
          </div>
          ${
            event.extendedProps.description
              ? `
            <div style="display:flex; align-items:flex-start; gap:0.75rem; background:#FAF8F4; border-radius:9px; padding:0.7rem 0.875rem;">
              <span style="font-size:1rem; margin-top:0.1rem;">📝</span>
              <span style="white-space:pre-wrap; line-height:1.55;">${escapeHTML(
                event.extendedProps.description
              )}</span>
            </div>
          `
              : '<p style="color:#ccc; font-style:italic; font-size:0.78rem; padding:0 0.25rem; margin:0;">Nessuna nota aggiunta.</p>'
          }
        </div>

        <div style="display:flex; gap:0.6rem;">
          <button
            onclick="app.deleteEvent('${event.id}'); document.getElementById('eventDetailModal').remove();"
            style="flex:1; background:white; border:1.5px solid #fca5a5; color:#ef4444; font-size:0.82rem; font-weight:700; padding:0.65rem; border-radius:10px; cursor:pointer; font-family:'Inter',sans-serif; letter-spacing:0.04em; transition:background 0.2s;"
            onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='white'"
          >
            Elimina
          </button>
          <button
            onclick="document.getElementById('eventDetailModal').remove()"
            style="flex:1; background:#F0EBE3; color:#555; font-size:0.82rem; font-weight:700; padding:0.65rem; border-radius:10px; border:none; cursor:pointer; font-family:'Inter',sans-serif; letter-spacing:0.04em; transition:background 0.2s;"
            onmouseover="this.style.background='#E8E0D4'" onmouseout="this.style.background='#F0EBE3'"
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
      "<div style='text-align:center; color:#bbb; padding:1rem 0; font-size:0.85rem; font-family:Inter,sans-serif;'>Caricamento...</div>";

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
          "<div style='text-align:center; padding:1.5rem; background:#FAF8F4; color:#aaa; border-radius:10px; border:1px solid #E8E0D4; font-size:0.84rem; font-family:Inter,sans-serif;'>Nessuna recensione in questa categoria.</div>";
        return;
      }

      list.innerHTML = filtered
        .map((r) => {
          const isApproved = r.Approvato && r.Approvato.toUpperCase() === "SI";
          const currentReply = r.Risposta || "";

          let adminActions = "";

          if (!isApproved) {
            adminActions = `
              <button
                onclick="app.approveReview(${r.idx})"
                style="display:block; width:100%; margin-top:0.6rem; font-size:0.72rem; font-weight:700; padding:0.55rem; background:#C4622D; color:white; border:none; border-radius:7px; cursor:pointer; font-family:'Inter',sans-serif; letter-spacing:0.08em; transition:background 0.2s;"
                onmouseover="this.style.background='#d4784a'" onmouseout="this.style.background='#C4622D'"
              >APPROVA E PUBBLICA</button>`;
          } else {
            adminActions = `
              <div style="margin-top:0.875rem; padding-top:0.75rem; border-top:1px solid #F0EBE3;">
                <label style="font-size:0.68rem; font-weight:700; color:#aaa; text-transform:uppercase; letter-spacing:0.1em;">La tua risposta:</label>
                <textarea
                  id="reply-${r.idx}"
                  style="display:block; width:100%; margin-top:0.4rem; padding:0.55rem 0.75rem; font-size:0.82rem; border:1.5px solid #E8E0D4; border-radius:7px; background:#FAF8F4; font-family:'Inter',sans-serif; outline:none; resize:none; transition:border-color 0.2s;"
                  rows="2"
                  placeholder="Scrivi una risposta pubblica..."
                  onfocus="this.style.borderColor='#1B3A5C'" onblur="this.style.borderColor='#E8E0D4'"
                >${escapeHTML(currentReply)}</textarea>
                <div style="display:flex; gap:0.5rem; margin-top:0.5rem;">
                  <button
                    onclick="app.saveReply(${r.idx}, event)"
                    style="flex:1; background:#1B3A5C; color:white; font-size:0.72rem; font-weight:700; padding:0.5rem; border:none; border-radius:7px; cursor:pointer; font-family:'Inter',sans-serif; letter-spacing:0.06em; transition:background 0.2s;"
                    onmouseover="this.style.background='#244b73'" onmouseout="this.style.background='#1B3A5C'"
                  >SALVA RISPOSTA</button>
                  <button
                    onclick="app.deleteReview(${r.idx})"
                    style="flex:1; background:white; border:1.5px solid #fca5a5; color:#ef4444; font-size:0.72rem; font-weight:700; padding:0.5rem; border-radius:7px; cursor:pointer; font-family:'Inter',sans-serif; letter-spacing:0.06em; transition:background 0.2s;"
                    onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='white'"
                  >ELIMINA</button>
                </div>
              </div>
            `;
          }

          return `
            <div style="border:1px solid #E8E0D4; padding:1rem 1.1rem; border-radius:12px; background:white; box-shadow:0 1px 4px rgba(0,0,0,0.04); position:relative; transition:box-shadow 0.2s;" onmouseover="this.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)'" onmouseout="this.style.boxShadow='0 1px 4px rgba(0,0,0,0.04)'">
              ${
                isApproved
                  ? '<span style="position:absolute; top:0.6rem; right:0.75rem; font-size:0.65rem; font-weight:700; background:#dcfce7; color:#15803d; padding:0.2rem 0.55rem; border-radius:50px; border:1px solid #bbf7d0; letter-spacing:0.06em;">PUBBLICATA</span>'
                  : '<span style="position:absolute; top:0.6rem; right:0.75rem; font-size:0.65rem; font-weight:700; background:#fef9c3; color:#a16207; padding:0.2rem 0.55rem; border-radius:50px; border:1px solid #fde68a; letter-spacing:0.06em;">IN ATTESA</span>'
              }
              <div style="margin-bottom:0.25rem; padding-right:5.5rem;">
                <span style="font-weight:700; color:#1B3A5C; font-size:0.9rem;">${
                  escapeHTML(r["Nome e Cognome"]) || "Ospite"
                }</span>
              </div>
              <div style="color:#f59e0b; font-size:0.75rem; font-weight:700; margin-bottom:0.4rem;">★ ${escapeHTML(r.Valutazione)}</div>
              <p style="font-size:0.84rem; font-style:italic; color:#555; margin:0 0 0.35rem; word-break:break-word; line-height:1.55;">"${escapeHTML(r.Recensione)}"</p>
              <div style="font-size:0.72rem; color:#bbb; margin-bottom:0.25rem;">Soggiorno: ${
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
        "<p style='color:#ef4444; text-align:center; font-size:0.85rem;'>Errore nel caricamento recensioni</p>";
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
