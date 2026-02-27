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
  currentSection:   "dashboard",
  currentReviewTab: "attesa",
  currentMsgTab:    "nuovi",
  calendarInstance: null,
  fpInstance:       null,
  fpBlockInstance:  null,
  fpEditInstance:   null,
  currentEvent:     null,
  reviewsCache:     null, // raw array with .idx
  messagesCache:    null,
  pricesCache:      null,

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

    // Block modal listeners
    document.getElementById("blockForm")
      ?.addEventListener("submit", (e) => { e.preventDefault(); this.submitBlock(); });
    document.getElementById("blockModal")
      ?.addEventListener("click", (e) => { if (e.target === document.getElementById("blockModal")) this.closeBlockModal(); });

    // ESC key closes modals
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { this.closeAddModal(); this.closeEventModal(); this.closeBlockModal(); }
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
  // DASHBOARD (main panel show)
  // ══════════════════════════════════════════════════════════════

  showDashboard() {
    document.getElementById("loginScreen")?.classList.add("hidden");
    const dash = document.getElementById("dashboard");
    if (dash) dash.classList.remove("hidden");

    this.renderPropMenu();
    this.loadDashboard();
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

    if (name === "dashboard") {
      this.loadDashboard();
    }

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

    if (name === "messaggi") {
      this.messagesCache = null;
      this.loadMessages();
    }

    if (name === "prezzi") {
      this.pricesCache = null;
      this.loadPrices();
    }

    if (name === "log") {
      this.loadLog();
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
    this.messagesCache    = null;
    this.currentReviewTab = "attesa";

    // Reset review tab UI
    document.getElementById("revTabAttesa")?.classList.add("active");
    document.getElementById("revTabPubbliche")?.classList.remove("active");

    // Close menu
    document.getElementById("propMenu")?.classList.add("hidden");
    document.getElementById("propBtn")?.classList.remove("open");

    this.renderPropMenu();
    this.updateBadges();

    // Update dashPropLabel
    const current = PROPERTIES.find((p) => p.key === key);
    const dashLbl = document.getElementById("dashPropLabel");
    if (dashLbl && current) dashLbl.textContent = current.label;

    if (this.currentSection === "calendario") {
      this.loadCalendar();
    } else if (this.currentSection === "recensioni") {
      this.loadReviews();
    } else if (this.currentSection === "messaggi") {
      this.loadMessages();
    } else if (this.currentSection === "dashboard") {
      this.loadDashboard();
    } else if (this.currentSection === "prezzi") {
      this.loadPrices();
    } else if (this.currentSection === "log") {
      this.loadLog();
    }
  },

  // ══════════════════════════════════════════════════════════════
  // BADGES
  // ══════════════════════════════════════════════════════════════

  async updateBadges() {
    try {
      const [calRes, revRes, msgRes] = await Promise.all([
        this.fetchProtected(`/api/calendar?property=${this.currentProperty}`),
        this.fetchProtected(`/api/reviews?property=${this.currentProperty}`),
        this.fetchProtected(`/api/messages?property=${this.currentProperty}`),
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

      if (msgRes?.ok) {
        const messages = await msgRes.json();
        const unread = messages.filter((m) => m.letto !== "SI").length;
        const badge = document.getElementById("badgeMsg");
        if (badge) { badge.textContent = unread; badge.classList.toggle("hidden", unread === 0); }
      }
    } catch (e) {
      console.error("updateBadges error:", e);
    }
  },

  // ══════════════════════════════════════════════════════════════
  // DASHBOARD STATISTICHE
  // ══════════════════════════════════════════════════════════════

  async loadDashboard() {
    const container = document.getElementById("dashboardContent");
    if (!container) return;
    container.innerHTML = '<div class="dash-loading">Caricamento...</div>';

    // Update dashPropLabel
    const current = PROPERTIES.find((p) => p.key === this.currentProperty);
    const dashLbl = document.getElementById("dashPropLabel");
    if (dashLbl && current) dashLbl.textContent = current.label;

    try {
      const [calRes, revRes] = await Promise.all([
        this.fetchProtected(`/api/calendar?property=${this.currentProperty}`),
        this.fetchProtected(`/api/reviews?property=${this.currentProperty}`),
      ]);

      const events  = calRes?.ok  ? await calRes.json()  : [];
      const reviews = revRes?.ok  ? await revRes.json()  : [];

      const now   = new Date();
      const year  = now.getFullYear();
      const month = now.getMonth(); // 0-based

      // ── Prenotazioni questo mese ──
      const thisMonthStart = new Date(year, month, 1);
      const thisMonthEnd   = new Date(year, month + 1, 0); // last day of month
      const lastMonthStart = new Date(year, month - 1, 1);
      const lastMonthEnd   = new Date(year, month, 0);

      const bookingsThisMonth = events.filter((e) => {
        const s = new Date(e.start);
        return s >= thisMonthStart && s <= thisMonthEnd;
      });
      const bookingsLastMonth = events.filter((e) => {
        const s = new Date(e.start);
        return s >= lastMonthStart && s <= lastMonthEnd;
      });

      const trendDiff = bookingsThisMonth.length - bookingsLastMonth.length;
      let trendClass  = "flat";
      let trendText   = "= stesso del mese scorso";
      if (trendDiff > 0) { trendClass = "up";   trendText = `+${trendDiff} rispetto al mese scorso`; }
      if (trendDiff < 0) { trendClass = "down";  trendText = `${trendDiff} rispetto al mese scorso`; }

      // ── Tasso occupazione mese corrente ──
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const occupiedDays = new Set();
      events.forEach((e) => {
        const start = new Date(e.start);
        // end in Google Calendar is exclusive
        const end = e.end ? new Date(e.end) : new Date(start.getTime() + 24 * 60 * 60 * 1000);
        const cur = new Date(start);
        while (cur < end) {
          if (cur.getFullYear() === year && cur.getMonth() === month) {
            occupiedDays.add(cur.getDate());
          }
          cur.setDate(cur.getDate() + 1);
        }
      });
      const occupancyPct = Math.round((occupiedDays.size / daysInMonth) * 100);
      const monthNames = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno",
                          "Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
      const monthLabel = monthNames[month];

      // ── Prossimi check-in (7 giorni) ──
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const in7   = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const upcoming = events.filter((e) => {
        const s = new Date(e.start);
        return s >= today && s <= in7;
      }).sort((a, b) => new Date(a.start) - new Date(b.start));

      // ── Rating medio (solo recensioni approvate) ──
      const approved = reviews.filter((r) => r.Approvato?.toUpperCase() === "SI");
      const ratings  = approved.map((r) => parseInt(r.Valutazione) || 0).filter((v) => v > 0);
      const avgRating = ratings.length
        ? (ratings.reduce((s, v) => s + v, 0) / ratings.length).toFixed(1)
        : null;
      const avgNum    = avgRating ? parseFloat(avgRating) : 0;
      const fullStars = Math.round(avgNum);
      const starsHTML = "★".repeat(fullStars) + "☆".repeat(5 - fullStars);

      this.renderDashboard({
        bookingsThisMonth: bookingsThisMonth.length,
        trendClass,
        trendText,
        occupancyPct,
        monthLabel,
        upcoming,
        avgRating,
        avgNum,
        starsHTML,
        reviewCount: ratings.length,
      });
    } catch (e) {
      container.innerHTML = '<div class="dash-loading" style="color:#ef4444;">Errore di caricamento</div>';
      console.error("loadDashboard error:", e);
    }
  },

  renderDashboard(stats) {
    const container = document.getElementById("dashboardContent");
    if (!container) return;

    const checkinItems = stats.upcoming.length
      ? stats.upcoming.map((e) => {
          const d = new Date(e.start);
          const dateStr = d.toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
          return `<div class="checkin-item">
            <span class="checkin-name">${escapeHTML(e.realTitle || "Ospite")}</span>
            <span class="checkin-date">${dateStr}</span>
          </div>`;
        }).join("")
      : '<div class="checkin-empty">Nessun check-in nei prossimi 7 giorni</div>';

    const ratingHTML = stats.avgRating !== null
      ? `<div class="stat-value">${stats.avgRating}</div>
         <div class="stat-label">Rating medio</div>
         <div class="stat-sublabel">da ${stats.reviewCount} recension${stats.reviewCount === 1 ? "e" : "i"}</div>
         <div class="stat-stars">${stats.starsHTML}</div>`
      : `<div class="stat-value" style="font-size:1.5rem;color:#ccc;">—</div>
         <div class="stat-label">Rating medio</div>
         <div class="stat-sublabel">Nessuna recensione approvata</div>`;

    container.innerHTML = `
      <div class="dash-grid">
        <div class="stat-card">
          <div class="stat-icon">📅</div>
          <div class="stat-value">${stats.bookingsThisMonth}</div>
          <div class="stat-label">Prenotazioni questo mese</div>
          <div class="stat-trend ${stats.trendClass}">${stats.trendText}</div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-value">${stats.occupancyPct}%</div>
          <div class="stat-label">Tasso occupazione — ${stats.monthLabel}</div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🏠</div>
          <div class="stat-label">Prossimi check-in</div>
          <div class="checkin-list">${checkinItems}</div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⭐</div>
          ${ratingHTML}
        </div>
      </div>
    `;
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
  // BLOCCO RAPIDO DATE
  // ══════════════════════════════════════════════════════════════

  openBlockModal() {
    document.getElementById("blockModal")?.classList.remove("hidden");
    document.getElementById("blockForm")?.reset();
    if (this.fpBlockInstance) { this.fpBlockInstance.destroy(); this.fpBlockInstance = null; }
    this.fpBlockInstance = flatpickr("#blockDates", {
      mode: "range", locale: "it", minDate: "today", dateFormat: "d/m/Y",
    });
  },

  closeBlockModal() {
    document.getElementById("blockModal")?.classList.add("hidden");
    if (this.fpBlockInstance) { this.fpBlockInstance.destroy(); this.fpBlockInstance = null; }
  },

  async submitBlock() {
    const btn     = document.querySelector("#blockForm button[type='submit']");
    const tipo    = document.getElementById("blockType")?.value;
    const datesVal = document.getElementById("blockDates")?.value;
    const notes   = document.getElementById("blockNotes")?.value || "";

    if (!datesVal || !datesVal.includes(" to ")) {
      alert("Seleziona un intervallo di date valido (almeno 2 giorni).");
      return;
    }

    const parts = datesVal.split(" to ");
    const parseDate = (s) => {
      const [d, m, y] = s.split("/");
      return `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`;
    };
    const start   = parseDate(parts[0]);
    // end in Google Calendar è esclusivo → +1 giorno
    const endDate = new Date(parseDate(parts[1]));
    endDate.setDate(endDate.getDate() + 1);
    const end = endDate.toISOString().split("T")[0];

    btn.textContent = "Salvataggio..."; btn.disabled = true;
    try {
      const res = await this.fetchProtected("/api/calendar", {
        method: "POST",
        body: JSON.stringify({ start, end, title: tipo, description: notes, property: this.currentProperty }),
      });
      if (res?.ok) {
        await this.loadCalendar();
        this.closeBlockModal();
        await this.logActivity(`Blocco date: ${tipo}`, `${start} → ${parseDate(parts[1])}`);
      } else {
        alert("Errore durante il blocco del periodo.");
      }
    } catch (e) {
      alert("Errore: " + e.message);
    } finally {
      btn.textContent = "Blocca periodo"; btn.disabled = false;
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
        await this.logActivity("Aggiunta prenotazione", title + " · " + start);
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

    // Store for edit / cancel-edit
    this.currentEvent = event;

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
        <button class="btn-ev-edit" onclick="app.editEvent()">✏️ Modifica</button>
        <button class="btn-ev-close" onclick="app.closeEventModal()">Chiudi</button>
      </div>
    `;

    modal.classList.remove("hidden");
  },

  closeEventModal() {
    if (this.fpEditInstance) { this.fpEditInstance.destroy(); this.fpEditInstance = null; }
    this.currentEvent = null;
    document.getElementById("eventModal")?.classList.add("hidden");
  },

  editEvent() {
    const event = this.currentEvent;
    if (!event) return;

    const modal   = document.getElementById("eventModal");
    const content = document.getElementById("eventModalContent");
    if (!modal || !content) return;

    // Compute inclusive end date (Google Calendar end is exclusive for all-day)
    const startISO = event.start.toISOString().split("T")[0];
    const rawEnd   = event.end ? new Date(event.end.getTime()) : new Date(event.start.getTime());
    if (event.allDay && event.end) rawEnd.setDate(rawEnd.getDate() - 1);
    const endISO   = rawEnd.toISOString().split("T")[0];

    content.innerHTML = `
      <div class="modal-hd">
        <h3 class="modal-title">Modifica prenotazione</h3>
        <button class="modal-close" onclick="app.closeEventModal()">×</button>
      </div>

      <div class="form-group">
        <label class="form-label">Nome / Tipo</label>
        <input type="text" id="editEventTitle" class="form-field"
               value="${escapeHTML(event.title)}" />
      </div>

      <div class="form-group">
        <label class="form-label">Date</label>
        <input type="text" id="editEventDates" class="form-field" placeholder="Dal → Al" readonly />
      </div>

      <div class="form-group">
        <label class="form-label">Note</label>
        <textarea id="editEventDesc" class="form-field form-textarea"
                  style="height:70px">${escapeHTML(event.extendedProps.description)}</textarea>
      </div>

      <div class="ev-btns">
        <button class="btn-ev-del" onclick="app.deleteEvent('${event.id}')">Elimina</button>
        <button class="btn-ev-close" onclick="app.showEventModal(app.currentEvent)">Annulla</button>
        <button class="btn-ev-save" id="btnSaveEdit">💾 Salva</button>
      </div>
    `;

    // Init flatpickr on the dates field
    if (this.fpEditInstance) { this.fpEditInstance.destroy(); this.fpEditInstance = null; }
    this.fpEditInstance = flatpickr("#editEventDates", {
      mode:         "range",
      locale:       "it",
      dateFormat:   "d/m/Y",
      defaultDate:  [startISO, endISO],
    });

    document.getElementById("btnSaveEdit")
      ?.addEventListener("click", () => this.updateEvent());
  },

  async updateEvent() {
    const event = this.currentEvent;
    if (!event) return;

    const title    = document.getElementById("editEventTitle")?.value?.trim();
    const desc     = document.getElementById("editEventDesc")?.value?.trim() || "";
    const datesVal = document.getElementById("editEventDates")?.value;

    if (!title)    { alert("Inserisci un nome per la prenotazione."); return; }
    if (!datesVal) { alert("Seleziona le date."); return; }

    const parseDate = (s) => {
      const [d, m, y] = s.split("/");
      return `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`;
    };

    let start, end;
    if (datesVal.includes(" to ")) {
      const parts   = datesVal.split(" to ");
      start = parseDate(parts[0]);
      const endDate = new Date(parseDate(parts[1]));
      endDate.setDate(endDate.getDate() + 1);   // Google Calendar exclusive end
      end = endDate.toISOString().split("T")[0];
    } else {
      // Single-day booking
      start = parseDate(datesVal);
      const endDate = new Date(start);
      endDate.setDate(endDate.getDate() + 1);
      end = endDate.toISOString().split("T")[0];
    }

    const btn = document.getElementById("btnSaveEdit");
    if (btn) { btn.textContent = "Salvataggio…"; btn.disabled = true; }

    try {
      const res = await this.fetchProtected("/api/calendar", {
        method: "PATCH",
        body: JSON.stringify({
          eventId:     event.id,
          title,
          description: desc,
          start,
          end,
          property:    this.currentProperty,
        }),
      });
      if (res?.ok) {
        this.closeEventModal();
        await this.loadCalendar();
        this.updateBadges();
        await this.logActivity("Modificata prenotazione", `${title} (${start} → ${end})`);
      } else {
        alert("Errore durante l'aggiornamento.");
        if (btn) { btn.textContent = "💾 Salva"; btn.disabled = false; }
      }
    } catch (e) {
      alert("Errore: " + e.message);
      if (btn) { btn.textContent = "💾 Salva"; btn.disabled = false; }
    }
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
        await this.logActivity("Eliminata prenotazione", "ID: " + id);
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
        await this.logActivity("Approvata recensione", "Row #" + idx);
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
        await this.logActivity("Eliminata recensione", "Row #" + idx);
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
        await this.logActivity("Risposta aggiunta", "Row #" + idx);
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
  // MESSAGGI
  // ══════════════════════════════════════════════════════════════

  async loadMessages() {
    const list = document.getElementById("messaggiList");
    if (!list) return;
    list.innerHTML = '<div class="dash-loading">Caricamento messaggi...</div>';
    try {
      const res = await this.fetchProtected(`/api/messages?property=${this.currentProperty}`);
      if (!res) return;
      this.messagesCache = await res.json();
      this.renderMessages();
    } catch(e) {
      list.innerHTML = '<div class="dash-loading" style="color:#ef4444;">Errore caricamento</div>';
    }
  },

  renderMessages() {
    const list = document.getElementById("messaggiList");
    if (!list || !this.messagesCache) return;

    const isNuovi  = this.currentMsgTab === "nuovi";
    const filtered = isNuovi
      ? this.messagesCache.filter((m) => m.letto !== "SI")
      : this.messagesCache;

    if (!filtered.length) {
      list.innerHTML = `<div class="empty-state"><div class="empty-icon">${isNuovi ? "📬" : "💬"}</div>${isNuovi ? "Nessun messaggio non letto." : "Nessun messaggio ricevuto."}</div>`;
      return;
    }

    list.innerHTML = filtered.map((m) => `
      <div class="msg-card ${m.letto === "SI" ? "msg-read" : ""}">
        <div class="msg-header">
          <div>
            <span class="msg-name">${escapeHTML(m.nome)}</span>
            <span class="msg-email">${escapeHTML(m.email)}</span>
          </div>
          <div class="msg-meta-right">
            <span class="msg-date">${m.timestamp ? new Date(m.timestamp).toLocaleDateString("it-IT", {day:"2-digit",month:"short",year:"numeric"}) : "—"}</span>
            ${m.letto !== "SI" ? '<span class="msg-badge-new">NUOVO</span>' : ""}
          </div>
        </div>
        <p class="msg-body">${escapeHTML(m.messaggio)}</p>
        <div class="msg-actions">
          ${m.letto !== "SI"
            ? `<button class="btn-msg-read" onclick="app.markMsgRead(${m.idx})">✓ Segna letto</button>`
            : '<span class="msg-status-read">✓ Letto</span>'}
          ${m.risposto !== "SI"
            ? `<button class="btn-msg-replied" onclick="app.markMsgReplied(${m.idx})">↩ Segna risposto</button>`
            : '<span class="msg-status-replied">↩ Risposto</span>'}
        </div>
      </div>
    `).join("");
  },

  switchMsgTab(tab) {
    this.currentMsgTab = tab;
    document.getElementById("msgTabNuovi")?.classList.toggle("active", tab === "nuovi");
    document.getElementById("msgTabTutti")?.classList.toggle("active", tab === "tutti");
    this.renderMessages();
  },

  async markMsgRead(idx) {
    const res = await this.fetchProtected("/api/messages", {
      method: "POST", body: JSON.stringify({ action: "mark-read", idx }),
    });
    if (res?.ok) {
      if (this.messagesCache) {
        const m = this.messagesCache.find((x) => x.idx === idx);
        if (m) m.letto = "SI";
      }
      this.renderMessages();
      this.updateBadges();
    }
  },

  async markMsgReplied(idx) {
    const res = await this.fetchProtected("/api/messages", {
      method: "POST", body: JSON.stringify({ action: "mark-replied", idx }),
    });
    if (res?.ok) {
      if (this.messagesCache) {
        const m = this.messagesCache.find((x) => x.idx === idx);
        if (m) { m.risposto = "SI"; m.letto = "SI"; }
      }
      this.renderMessages();
      this.updateBadges();
    }
  },

  // ══════════════════════════════════════════════════════════════
  // LOG ATTIVITÀ
  // ══════════════════════════════════════════════════════════════

  async logActivity(azione, dettagli) {
    try {
      await this.fetchProtected("/api/log", {
        method: "POST",
        body: JSON.stringify({ azione, dettagli, proprieta: this.currentProperty }),
      });
    } catch(e) { console.warn("Log failed:", e.message); }
  },

  async loadLog() {
    const list = document.getElementById("logList");
    if (!list) return;
    list.innerHTML = '<div class="dash-loading">Caricamento log...</div>';
    try {
      const res = await this.fetchProtected("/api/log");
      if (!res) return;
      const entries = await res.json();
      if (!entries.length) {
        list.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div>Nessuna attività registrata.</div>';
        return;
      }
      list.innerHTML = `
        <div class="log-table">
          <div class="log-header">
            <span>Data/Ora</span><span>Admin</span><span>Azione</span><span>Dettagli</span><span>Struttura</span>
          </div>
          ${entries.map((e) => `
            <div class="log-row">
              <span class="log-time">${e.timestamp ? new Date(e.timestamp).toLocaleString("it-IT",{dateStyle:"short",timeStyle:"short"}) : "—"}</span>
              <span class="log-user">${escapeHTML(e.utente?.split("@")[0] || "—")}</span>
              <span class="log-action">${escapeHTML(e.azione)}</span>
              <span class="log-detail">${escapeHTML(e.dettagli || "—")}</span>
              <span class="log-prop">${escapeHTML(e.proprieta || "—")}</span>
            </div>`).join("")}
        </div>`;
    } catch(e) {
      list.innerHTML = '<div class="dash-loading" style="color:#ef4444;">Errore caricamento log</div>';
    }
  },

  // ══════════════════════════════════════════════════════════════
  // CSV EXPORT
  // ══════════════════════════════════════════════════════════════

  _downloadCSV(rows, filename) {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = rows.map((r) => r.map(esc).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  },

  async exportCalendarCSV() {
    const btn = document.getElementById("btnExportCal");
    if (btn) { btn.textContent = "…"; btn.disabled = true; }
    try {
      const res = await this.fetchProtected(`/api/calendar?property=${this.currentProperty}`);
      if (!res) return;
      const events = await res.json();
      const rows = [["Nome/Titolo", "Check-in", "Check-out", "Notti", "Note", "Tipo"]];
      for (const e of events) {
        const start  = new Date(e.start);
        const end    = new Date(e.end);
        const nights = Math.round((end - start) / 86_400_000);
        rows.push([
          e.realTitle || "—",
          e.start,
          e.end,
          nights,
          e.description || "",
          e.color === "#C4622D" ? "Blocco" : "Prenotazione",
        ]);
      }
      const date = new Date().toISOString().slice(0, 10);
      this._downloadCSV(rows, `prenotazioni-${this.currentProperty}-${date}.csv`);
    } catch (err) {
      console.error("Export cal CSV error:", err);
      alert("Errore export: " + err.message);
    } finally {
      if (btn) { btn.textContent = "📥 Esporta CSV"; btn.disabled = false; }
    }
  },

  async exportReviewsCSV() {
    const btn = document.getElementById("btnExportRev");
    if (btn) { btn.textContent = "…"; btn.disabled = true; }
    try {
      const res = await this.fetchProtected(`/api/reviews?property=${this.currentProperty}`);
      if (!res) return;
      const reviews = await res.json();
      const rows = [["Nome", "Voto", "Recensione", "Data Soggiorno", "Stato", "Risposta"]];
      for (const r of reviews) {
        rows.push([
          r["Nome e Cognome"] || "—",
          r["Valutazione"]    || "—",
          r["Recensione"]     || "—",
          r["Data Soggiorno"] || "—",
          (r["Approvato"] || "").toUpperCase() === "SI" ? "Pubblicata" : "In attesa",
          r["Risposta"] || "",
        ]);
      }
      const date = new Date().toISOString().slice(0, 10);
      this._downloadCSV(rows, `recensioni-${this.currentProperty}-${date}.csv`);
    } catch (err) {
      console.error("Export reviews CSV error:", err);
      alert("Errore export: " + err.message);
    } finally {
      if (btn) { btn.textContent = "📥 Esporta CSV"; btn.disabled = false; }
    }
  },

  // ══════════════════════════════════════════════════════════════
  // PREZZI
  // ══════════════════════════════════════════════════════════════

  async loadPrices() {
    const editor = document.getElementById("prezziEditor");
    if (!editor) return;
    editor.innerHTML = '<div class="dash-loading">Caricamento prezzi...</div>';
    const lbl = document.getElementById("prezziPropLabel");
    const current = PROPERTIES.find((p) => p.key === this.currentProperty);
    if (lbl && current) lbl.textContent = current.label;
    try {
      const res = await this.fetchProtected(`/api/prices?property=${this.currentProperty}`);
      if (!res) return;
      this.pricesCache = await res.json();
      this.renderPrices();
    } catch (e) {
      editor.innerHTML = '<div class="dash-loading" style="color:#ef4444;">Errore caricamento prezzi</div>';
    }
  },

  renderPrices() {
    const editor = document.getElementById("prezziEditor");
    if (!editor) return;
    const rows = this.pricesCache || [];
    if (!rows.length) {
      editor.innerHTML = '<div class="empty-state"><div class="empty-icon">💶</div>Nessuna tariffa trovata.</div>';
      return;
    }
    editor.innerHTML = `
      <div style="overflow-x:auto;">
        <table class="prices-table-admin">
          <thead>
            <tr>
              <th>Stagione</th>
              <th>Dal</th>
              <th>Al</th>
              <th>€/Notte</th>
              <th>Min.Notti</th>
              <th>Pulizie €</th>
              <th>Caparra</th>
              <th>Note</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="pricesTableBody">
            ${rows.map((r, i) => `
              <tr data-idx="${i}">
                <td><input class="price-input" value="${escapeHTML(r.stagione || "")}" data-field="stagione" style="min-width:120px;" /></td>
                <td><input class="price-input" value="${escapeHTML(r.dal || "")}" data-field="dal" style="width:72px;" placeholder="01/07" /></td>
                <td><input class="price-input" value="${escapeHTML(r.al || "")}" data-field="al" style="width:72px;" placeholder="31/08" /></td>
                <td><input class="price-input" type="number" value="${r.prezzoNotte || ""}" data-field="prezzoNotte" style="width:72px;" /></td>
                <td><input class="price-input" type="number" value="${r.minNotti || ""}" data-field="minNotti" style="width:62px;" /></td>
                <td><input class="price-input" type="number" value="${r.pulizie || ""}" data-field="pulizie" style="width:72px;" /></td>
                <td><input class="price-input" value="${escapeHTML(r.caparra || "")}" data-field="caparra" style="width:62px;" /></td>
                <td><input class="price-input" value="${escapeHTML(r.note || "")}" data-field="note" style="min-width:100px;" /></td>
                <td><button class="btn-del-price" onclick="app.deletePriceRow(${i})" title="Elimina">🗑</button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>`;
  },

  addPriceRow() {
    if (!this.pricesCache) this.pricesCache = [];
    this.pricesCache.push({
      stagione: "Nuova Stagione", dal: "", al: "",
      prezzoNotte: 0, minNotti: 1, pulizie: 0, caparra: "30%", note: "",
    });
    this.renderPrices();
  },

  deletePriceRow(idx) {
    if (!this.pricesCache) return;
    this.pricesCache.splice(idx, 1);
    this.renderPrices();
  },

  _collectPricesFromDOM() {
    const rows = document.querySelectorAll("#pricesTableBody tr");
    const data = [];
    rows.forEach((tr) => {
      const row = {};
      tr.querySelectorAll("[data-field]").forEach((inp) => {
        const field = inp.dataset.field;
        row[field] = inp.type === "number" ? (parseFloat(inp.value) || 0) : inp.value;
      });
      data.push(row);
    });
    return data;
  },

  async savePrices() {
    const btn = document.getElementById("btnSavePrices");
    if (btn) { btn.textContent = "Salvataggio..."; btn.disabled = true; }
    try {
      const prices = this._collectPricesFromDOM();
      const res = await this.fetchProtected("/api/prices", {
        method: "POST",
        body: JSON.stringify({ prices, property: this.currentProperty }),
      });
      if (res?.ok) {
        this.pricesCache = prices;
        await this.logActivity("Prezzi aggiornati", `${prices.length} righe — ${this.currentProperty}`);
        if (btn) btn.textContent = "✓ Salvato!";
        setTimeout(() => { if (btn) { btn.textContent = "💾 Salva prezzi"; btn.disabled = false; } }, 2000);
      } else {
        throw new Error(`HTTP ${res?.status}`);
      }
    } catch (e) {
      alert("Errore salvataggio: " + e.message);
      if (btn) { btn.textContent = "💾 Salva prezzi"; btn.disabled = false; }
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
