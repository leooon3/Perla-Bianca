const escapeHTML = (str) => {
  if (str == null) return "";
  return String(str).replace(/[&<>'"]/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  }[c]));
};

// ─── Config ────────────────────────────────────────────────────────────────
const GOOGLE_CLIENT_ID =
  "980340338302-43hbupefo8neh0hbksdra5afdr95b6pj.apps.googleusercontent.com";

const PROPERTIES = [
  { key: "perla-bianca", label: "Perla Bianca", active: true },
  { key: "struttura-2",  label: "Struttura 2",  active: false },
];

// ─── App ───────────────────────────────────────────────────────────────────
const app = {
  token:            localStorage.getItem("adminToken"),
  otpData:          null,
  currentProperty:  PROPERTIES[0].key,
  currentSection:   "calendario",
  currentReviewTab: "attesa",
  calendarInstance: null,
  fpInstance:       null,
  reviewsCache:     null, // raw array with .idx

  // ══════════════════════════════════════════════════════════════
  // INIT & AUTH
  // ══════════════════════════════════════════════════════════════

  init() {
    if (this.token) {
      this.showDashboard();
    } else {
      this.initGoogleLogin();
    }

    // Login form listeners
    document.getElementById("emailAuthForm")
      ?.addEventListener("submit", (e) => {
        e.preventDefault();
        // Se step2 è visibile (OTP inserito), invio Enter → verifica OTP
        // altrimenti → invia OTP via email
        const step2 = document.getElementById("step2");
        if (step2 && !step2.classList.contains("hidden")) {
          this.verifyOtp();
        } else {
          this.sendOtp();
        }
      });
    document.getElementById("verifyBtn")
      ?.addEventListener("click", () => this.verifyOtp());
    document.getElementById("backBtn")
      ?.addEventListener("click", () => {
        document.getElementById("step2").classList.add("hidden");
        document.getElementById("step1").classList.remove("hidden");
      });

    // Logout
    document.getElementById("logoutBtn")
      ?.addEventListener("click", () => this.logout());

    // Close property menu on outside click
    document.addEventListener("click", (e) => {
      const wrap = document.getElementById("propWrap");
      if (wrap && !wrap.contains(e.target)) {
        document.getElementById("propMenu")?.classList.add("hidden");
        document.getElementById("propBtn")?.classList.remove("open");
      }
    });

    // Close modals on backdrop click
    document.getElementById("addModal")
      ?.addEventListener("click", (e) => {
        if (e.target === document.getElementById("addModal")) this.closeAddModal();
      });
    document.getElementById("eventModal")
      ?.addEventListener("click", (e) => {
        if (e.target === document.getElementById("eventModal")) this.closeEventModal();
      });

    // ESC key closes modals
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { this.closeAddModal(); this.closeEventModal(); }
    });
  },

  initGoogleLogin() {
    if (!window.google) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (r) => this.handleGoogleLogin(r),
    });
    const btn = document.getElementById("googleBtnContainer");
    if (btn) {
      window.google.accounts.id.renderButton(btn, {
        theme: "outline", size: "large", type: "standard",
      });
    }
  },

  async handleGoogleLogin(response) {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "google-login", token: response.credential }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore Google login");
      this.loginSuccess(data.token);
    } catch (err) {
      this.showError(err.message);
    }
  },

  async sendOtp() {
    const email = document.getElementById("emailInput")?.value;
    if (!email) return;
    const btn = document.querySelector("#step1 button");
    btn.textContent = "Invio..."; btn.disabled = true;
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
      btn.textContent = "Ricevi Codice"; btn.disabled = false;
    }
  },

  async verifyOtp() {
    const code = document.getElementById("otpInput")?.value?.trim().replace(/\D/g, "");
    if (!code || code.length !== 6) return;
    const btn = document.getElementById("verifyBtn");
    btn.textContent = "Verifica..."; btn.disabled = true;
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action:  "verify-otp",
          email:   this.otpData.email,
          hash:    this.otpData.hash,
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
      btn.textContent = "Accedi"; btn.disabled = false;
    }
  },

  loginSuccess(token) {
    localStorage.setItem("adminToken", token);
    this.token = token;
    this.showDashboard();
  },

  logout() {
    localStorage.removeItem("adminToken");
    window.location.href = "/";
  },

  showError(msg) {
    const el = document.getElementById("errorMsg");
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle("hidden", !msg);
  },

  // ══════════════════════════════════════════════════════════════
  // DASHBOARD
  // ══════════════════════════════════════════════════════════════

  showDashboard() {
    document.getElementById("loginScreen")?.classList.add("hidden");
    const dash = document.getElementById("dashboard");
    if (dash) dash.classList.remove("hidden");

    this.renderPropMenu();
    this.loadCalendar();
    this.updateBadges();
  },

  showSection(name) {
    if (this.currentSection === name) return;
    this.currentSection = name;

    // Update nav buttons
    document.querySelectorAll(".nav-sec-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.section === name);
    });

    // Show/hide sections
    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    document.querySelectorAll(".section").forEach((sec) => {
      sec.classList.toggle("active", sec.id === `section${cap(name)}`);
    });

    if (name === "calendario") {
      // Re-init or just resize if already exists
      if (this.calendarInstance) {
        setTimeout(() => this.calendarInstance.updateSize(), 50);
      } else {
        this.loadCalendar();
      }
    }

    if (name === "recensioni") {
      this.reviewsCache = null;
      this.loadReviews();
    }
  },

  // ══════════════════════════════════════════════════════════════
  // PROPERTY SWITCHER
  // ══════════════════════════════════════════════════════════════

  renderPropMenu() {
    const menu  = document.getElementById("propMenu");
    const label = document.getElementById("propLabel");
    if (!menu) return;

    const current = PROPERTIES.find((p) => p.key === this.currentProperty);
    if (label) label.textContent = current?.label || "";

    menu.innerHTML = PROPERTIES.map((p) => `
      <button
        class="prop-item ${p.key === this.currentProperty ? "cur" : ""}"
        onclick="${p.active ? `app.selectProperty('${p.key}')` : ""}"
        ${!p.active ? "disabled" : ""}
      >
        <span class="prop-dot ${p.active ? "on" : "off"}"></span>
        ${escapeHTML(p.label)}
        ${!p.active
          ? '<span style="margin-left:auto;font-size:0.67rem;color:#bbb;font-weight:400;">presto</span>'
          : ""}
      </button>
    `).join("");
  },

  togglePropMenu() {
    const menu = document.getElementById("propMenu");
    const btn  = document.getElementById("propBtn");
    const open = !menu.classList.contains("hidden");
    menu.classList.toggle("hidden", open);
    btn.classList.toggle("open", !open);
  },

  selectProperty(key) {
    if (key === this.currentProperty) { this.togglePropMenu(); return; }

    this.currentProperty  = key;
    this.reviewsCache     = null;
    this.currentReviewTab = "attesa";

    // Reset review tab UI
    document.getElementById("revTabAttesa")?.classList.add("active");
    document.getElementById("revTabPubbliche")?.classList.remove("active");

    // Close menu
    document.getElementById("propMenu")?.classList.add("hidden");
    document.getElementById("propBtn")?.classList.remove("open");

    this.renderPropMenu();
    this.updateBadges();

    if (this.currentSection === "calendario") {
      this.loadCalendar();
    } else {
      this.loadReviews();
    }
  },

  // ══════════════════════════════════════════════════════════════
  // BADGES
  // ══════════════════════════════════════════════════════════════

  async updateBadges() {
    try {
      const [calRes, revRes] = await Promise.all([
        this.fetchProtected(`/api/calendar?property=${this.currentProperty}`),
        this.fetchProtected(`/api/reviews?property=${this.currentProperty}`),
      ]);

      if (calRes?.ok) {
        const events = await calRes.json();
        const now = new Date(); now.setHours(0, 0, 0, 0);
        const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const count = events.filter((e) => {
          const s = new Date(e.start);
          return s >= now && s <= in7;
        }).length;
        const badge = document.getElementById("badgeCal");
        if (badge) { badge.textContent = count; badge.classList.toggle("hidden", count === 0); }
      }

      if (revRes?.ok) {
        const reviews = await revRes.json();
        const pending = reviews.filter(
          (r) => !r.Approvato || r.Approvato.toUpperCase() !== "SI"
        ).length;
        const badge = document.getElementById("badgeRev");
        if (badge) { badge.textContent = pending; badge.classList.toggle("hidden", pending === 0); }
        const countEl = document.getElementById("countAttesa");
        if (countEl) {
          countEl.textContent = pending;
          countEl.classList.toggle("zero", pending === 0);
        }
      }
    } catch (e) {
      console.error("updateBadges error:", e);
    }
  },

  // ══════════════════════════════════════════════════════════════
  // CALENDAR
  // ══════════════════════════════════════════════════════════════

  async loadCalendar() {
    const calEl = document.getElementById("calendarEl");
    if (!calEl) return;

    if (this.calendarInstance) {
      this.calendarInstance.destroy();
      this.calendarInstance = null;
    }

    calEl.innerHTML = '<div class="list-loading">Caricamento calendario...</div>';

    try {
      const res = await this.fetchProtected(`/api/calendar?property=${this.currentProperty}`);
      if (!res) return;
      const events = await res.json();

      calEl.innerHTML = "";

      this.calendarInstance = new FullCalendar.Calendar(calEl, {
        initialView:  "dayGridMonth",
        locale:       "it",
        firstDay:     1,
        headerToolbar: { left: "prev,next today", center: "title", right: "" },
        buttonText:   { today: "Oggi" },
        height:       "auto",

        events: events.map((e) => ({
          id:    e.id,
          title: e.realTitle || "Occupato",
          start: e.start,
          end:   e.end,
          backgroundColor: "#1B3A5C",
          borderColor:     "#1B3A5C",
          textColor:       "#ffffff",
          extendedProps:   { description: e.description || "" },
        })),

        // Click on empty day → open add modal pre-filled with that date
        dateClick: (info) => {
          this.openAddModal(info.dateStr);
        },

        // Click on event → detail modal
        eventClick: (info) => {
          info.jsEvent.preventDefault();
          this.showEventModal(info.event);
        },
      });

      this.calendarInstance.render();
    } catch (e) {
      calEl.innerHTML = '<div class="list-loading" style="color:#ef4444;">Errore di caricamento</div>';
    }
  },

  // ══════════════════════════════════════════════════════════════
  // ADD BOOKING MODAL
  // ══════════════════════════════════════════════════════════════

  openAddModal(dateStr) {
    const modal = document.getElementById("addModal");
    if (!modal) return;
    modal.classList.remove("hidden");

    // Reset form
    document.getElementById("addEventForm")?.reset();
    const nameEl = document.getElementById("eventName");
    if (nameEl) { nameEl.readOnly = false; nameEl.style.opacity = ""; }

    // Destroy previous flatpickr instance
    if (this.fpInstance) { this.fpInstance.destroy(); this.fpInstance = null; }

    // Init flatpickr — pre-fill with the clicked date
    this.fpInstance = flatpickr("#eventDates", {
      mode:        "range",
      locale:      "it",
      minDate:     "today",
      dateFormat:  "d/m/Y",
      defaultDate: dateStr ? [dateStr] : null,
    });

    // Blocked date checkbox
    const blockCheck = document.getElementById("isBlockedDate");
    if (blockCheck && nameEl) {
      blockCheck.onchange = (e) => {
        if (e.target.checked) {
          nameEl.value = "NON DISPONIBILE";
          nameEl.readOnly = true;
          nameEl.style.opacity = "0.5";
        } else {
          nameEl.value = "";
          nameEl.readOnly = false;
          nameEl.style.opacity = "";
        }
      };
    }

    // Form submit
    const form = document.getElementById("addEventForm");
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        this.addEvent(this.fpInstance?.selectedDates);
      };
    }

    setTimeout(() => nameEl?.focus(), 80);
  },

  closeAddModal() {
    document.getElementById("addModal")?.classList.add("hidden");
    if (this.fpInstance) { this.fpInstance.destroy(); this.fpInstance = null; }
  },

  async addEvent(dates) {
    if (!dates || dates.length < 2) return alert("Seleziona le date di inizio e fine.");

    const start = dates[0].toLocaleDateString("en-CA");
    const endObj = new Date(dates[1]);
    endObj.setDate(endObj.getDate() + 1);
    const end = endObj.toLocaleDateString("en-CA");

    const title       = document.getElementById("eventName")?.value || "";
    const description = document.getElementById("eventNotes")?.value || "";

    const btn = document.querySelector("#addEventForm .btn-submit");
    if (btn) { btn.textContent = "Salvataggio..."; btn.disabled = true; }

    try {
      const res = await this.fetchProtected("/api/calendar", {
        method: "POST",
        body: JSON.stringify({ start, end, title, description, property: this.currentProperty }),
      });
      if (res?.ok) {
        this.closeAddModal();
        await this.loadCalendar();
        this.updateBadges();
      } else {
        throw new Error("Errore di salvataggio");
      }
    } catch (e) {
      alert("Errore: " + e.message);
    } finally {
      if (btn) { btn.textContent = "Salva prenotazione"; btn.disabled = false; }
    }
  },

  // ══════════════════════════════════════════════════════════════
  // EVENT DETAIL MODAL
  // ══════════════════════════════════════════════════════════════

  showEventModal(event) {
    const modal   = document.getElementById("eventModal");
    const content = document.getElementById("eventModalContent");
    if (!modal || !content) return;

    const start = event.start;
    const end   = event.end ? new Date(event.end.getTime()) : null;
    if (end && event.allDay) end.setDate(end.getDate() - 1);

    const fmt = (d) => d.toLocaleDateString("it-IT", {
      day: "2-digit", month: "long", year: "numeric",
    });
    const startStr = fmt(start);
    const endStr   = end && end.toDateString() !== start.toDateString() ? fmt(end) : "";

    content.innerHTML = `
      <div class="modal-hd">
        <h3 class="modal-title">${escapeHTML(event.title)}</h3>
        <button class="modal-close" onclick="app.closeEventModal()">×</button>
      </div>

      <div class="ev-row">
        <span class="ev-row-icon">📅</span>
        <span class="ev-row-text" style="font-weight:600; color:#333;">
          ${startStr}${endStr ? " → " + endStr : ""}
        </span>
      </div>

      ${event.extendedProps.description
        ? `<div class="ev-row">
             <span class="ev-row-icon">📝</span>
             <span class="ev-row-text">${escapeHTML(event.extendedProps.description)}</span>
           </div>`
        : `<p class="ev-no-notes">Nessuna nota aggiunta.</p>`
      }

      <div class="ev-btns">
        <button class="btn-ev-del" onclick="app.deleteEvent('${event.id}')">Elimina</button>
        <button class="btn-ev-close" onclick="app.closeEventModal()">Chiudi</button>
      </div>
    `;

    modal.classList.remove("hidden");
  },

  closeEventModal() {
    document.getElementById("eventModal")?.classList.add("hidden");
  },

  async deleteEvent(id) {
    if (!confirm("Eliminare questa prenotazione?")) return;
    try {
      const res = await this.fetchProtected("/api/calendar", {
        method: "DELETE",
        body: JSON.stringify({ eventId: id, property: this.currentProperty }),
      });
      if (res?.ok) {
        this.closeEventModal();
        await this.loadCalendar();
        this.updateBadges();
      } else {
        alert("Errore di eliminazione");
      }
    } catch (e) {
      alert(e.message);
    }
  },

  // ══════════════════════════════════════════════════════════════
  // REVIEWS
  // ══════════════════════════════════════════════════════════════

  async loadReviews() {
    const list = document.getElementById("reviewsList");
    if (!list) return;

    // Fetch only if cache is empty
    if (!this.reviewsCache) {
      list.innerHTML = '<div class="list-loading">Caricamento recensioni...</div>';
      try {
        const res = await this.fetchProtected(`/api/reviews?property=${this.currentProperty}`);
        if (!res) return;
        const all = await res.json();
        this.reviewsCache = all.map((r, i) => ({ ...r, idx: i }));
      } catch (e) {
        list.innerHTML = '<div class="list-loading" style="color:#ef4444;">Errore nel caricamento</div>';
        return;
      }
    }

    this.renderReviews();
  },

  renderReviews() {
    const list = document.getElementById("reviewsList");
    if (!list || !this.reviewsCache) return;

    const isAttesa = this.currentReviewTab === "attesa";

    const filtered = this.reviewsCache.filter((r) =>
      isAttesa
        ? !r.Approvato || r.Approvato.toUpperCase() !== "SI"
        : r.Approvato && r.Approvato.toUpperCase() === "SI"
    );

    if (!filtered.length) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${isAttesa ? "✅" : "⭐"}</div>
          ${isAttesa
            ? "Nessuna recensione in attesa di approvazione."
            : "Nessuna recensione pubblicata."}
        </div>`;
      return;
    }

    list.innerHTML = filtered.map((r) => {
      const isApproved = r.Approvato?.toUpperCase() === "SI";
      const rating     = Math.min(5, Math.max(0, parseInt(r.Valutazione) || 0));
      const stars      = "★".repeat(rating) + "☆".repeat(5 - rating);
      const reply      = r.Risposta || "";

      const actions = isApproved
        ? `<div class="rev-reply">
             <label>La tua risposta pubblica:</label>
             <textarea rows="2" id="reply-${r.idx}" placeholder="Scrivi una risposta...">${escapeHTML(reply)}</textarea>
             <div class="rev-reply-btns">
               <button class="btn-save-reply" onclick="app.saveReply(${r.idx}, event)">Salva risposta</button>
               <button class="btn-del-rev" onclick="app.deleteReview(${r.idx})">Elimina</button>
             </div>
           </div>`
        : `<div class="rev-pending-btns">
             <button class="btn-approve" onclick="app.approveReview(${r.idx})">Approva e Pubblica</button>
             <button class="btn-del-rev" onclick="app.deleteReview(${r.idx})">Elimina</button>
           </div>`;

      return `
        <div class="rev-card">
          <div class="rev-card-top">
            <div>
              <div class="rev-name">${escapeHTML(r["Nome e Cognome"]) || "Ospite"}</div>
              <div class="rev-rating">${stars}</div>
            </div>
            <span class="rev-status ${isApproved ? "published" : "pending"}">
              ${isApproved ? "PUBBLICATA" : "IN ATTESA"}
            </span>
          </div>
          <p class="rev-text">"${escapeHTML(r.Recensione)}"</p>
          <div class="rev-date">Soggiorno: ${escapeHTML(r["Data Soggiorno"]) || "—"}</div>
          ${actions}
        </div>`;
    }).join("");
  },

  switchReviewTab(tab) {
    if (this.currentReviewTab === tab) return;
    this.currentReviewTab = tab;
    document.getElementById("revTabAttesa")?.classList.toggle("active", tab === "attesa");
    document.getElementById("revTabPubbliche")?.classList.toggle("active", tab === "pubblicate");
    this.renderReviews();
  },

  async approveReview(idx) {
    if (!confirm("Pubblicare la recensione sul sito?")) return;
    try {
      const res = await this.fetchProtected("/api/approve-review", {
        method: "POST",
        body: JSON.stringify({ rowIndex: idx, property: this.currentProperty }),
      });
      if (res?.ok) {
        this.reviewsCache = null;
        await this.loadReviews();
        this.updateBadges();
      } else {
        alert("Errore di approvazione");
      }
    } catch (e) {
      alert("Errore: " + e.message);
    }
  },

  async deleteReview(idx) {
    if (!confirm("Eliminare permanentemente questa recensione?")) return;
    try {
      const res = await this.fetchProtected("/api/delete-review", {
        method: "POST",
        body: JSON.stringify({ rowIndex: idx, property: this.currentProperty }),
      });
      if (res?.ok) {
        this.reviewsCache = null;
        await this.loadReviews();
        this.updateBadges();
      } else {
        alert("Errore di eliminazione");
      }
    } catch (e) {
      alert(e.message);
    }
  },

  async saveReply(idx, ev) {
    const replyText = document.getElementById(`reply-${idx}`)?.value || "";
    const btn       = ev.target;
    const origText  = btn.textContent;
    btn.textContent = "Salvataggio..."; btn.disabled = true;

    try {
      const res = await this.fetchProtected("/api/reply-review", {
        method: "POST",
        body: JSON.stringify({ rowIndex: idx, replyText, property: this.currentProperty }),
      });
      if (res?.ok) {
        btn.textContent = "Salvata ✓";
        // Update cache locally — avoids a full re-fetch
        const cached = this.reviewsCache?.find((r) => r.idx === idx);
        if (cached) cached.Risposta = replyText;
        setTimeout(() => { btn.textContent = origText; btn.disabled = false; }, 2000);
      } else {
        throw new Error("Errore di salvataggio");
      }
    } catch (e) {
      alert("Errore: " + e.message);
      btn.textContent = origText; btn.disabled = false;
    }
  },

  // ══════════════════════════════════════════════════════════════
  // API HELPER
  // ══════════════════════════════════════════════════════════════

  async fetchProtected(url, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      Authorization:  `Bearer ${this.token}`,
    };
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) { this.logout(); return null; }
    return res;
  },
};

document.addEventListener("DOMContentLoaded", () => app.init());
