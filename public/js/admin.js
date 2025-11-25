// public/js/admin.js

// === CONFIGURAZIONE ===
// Incolla qui sotto il tuo Client ID preso da Google Cloud Console
const GOOGLE_CLIENT_ID =
  "980340338302-43hbupefo8neh0hbksdra5afdr95b6pj.apps.googleusercontent.com";

const app = {
  token: localStorage.getItem("adminToken"),
  otpData: null,

  init: function () {
    // Se l'utente non ha configurato l'ID, avvisiamo
    if (GOOGLE_CLIENT_ID.includes("INCOLLA_QUI")) {
      console.error(
        "ERRORE: Devi inserire il Google Client ID nel file js/admin.js"
      );
      alert(
        "Configurazione mancante: Inserisci il Google Client ID nel codice."
      );
      return;
    }

    if (this.token) {
      this.showDashboard();
    } else {
      this.initGoogleLogin();
    }

    // Listener Form Email
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

    // Listener Form Calendario
    const eventDates = document.getElementById("eventDates");
    if (eventDates) {
      const fp = flatpickr("#eventDates", {
        mode: "range",
        locale: "it",
        minDate: "today",
      });
      document
        .getElementById("addEventForm")
        .addEventListener("submit", (e) => {
          e.preventDefault();
          this.addEvent(fp.selectedDates);
        });
    }
  },

  // --- AUTENTICAZIONE ---
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
      if (!res.ok) throw new Error(data.error || "Errore login Google");

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
    btn.innerText = "Invio in corso...";
    btn.disabled = true;

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send-otp", email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore invio codice");

      this.otpData = data; // Salviamo hash e email
      document.getElementById("step1").classList.add("hidden");
      document.getElementById("step2").classList.remove("hidden");
      this.showError(""); // Pulisci errori
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
    location.reload();
  },

  showDashboard: function () {
    const loginScreen = document.getElementById("loginScreen");
    const dashboard = document.getElementById("dashboard");
    if (loginScreen) loginScreen.classList.add("hidden");
    if (dashboard) dashboard.classList.remove("hidden");

    this.loadCalendar();
    this.loadReviews();
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

  // --- API HELPER PROTETTO ---
  fetchProtected: async function (url, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.token}`,
    };
    const res = await fetch(url, { ...options, headers });

    if (res.status === 401) {
      this.logout(); // Token scaduto
      return null;
    }
    return res;
  },

  // --- LOGICA DATI ---
  loadCalendar: async function () {
    const list = document.getElementById("calendarList");
    if (!list) return;
    list.innerHTML = "<li class='text-slate-400'>Caricamento...</li>";
    try {
      // GET è pubblica, usiamo fetch normale
      const res = await fetch("/api/calendar");
      const events = await res.json();

      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const future = events.filter((e) => new Date(e.end) >= now);

      if (!future.length) {
        list.innerHTML =
          "<li class='text-slate-500 italic'>Nessuna prenotazione futura</li>";
        return;
      }

      list.innerHTML = future
        .map(
          (e) => `
                <li class="flex justify-between items-center bg-slate-50 p-3 rounded border border-slate-100 mb-2">
                    <div>
                        <div class="font-bold text-slate-700">${
                          e.realTitle || "Occupato"
                        }</div>
                        <div class="text-xs text-slate-500">${
                          e.start.split("T")[0]
                        }</div>
                    </div>
                    <button onclick="app.deleteEvent('${
                      e.id
                    }')" class="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition">✕</button>
                </li>
            `
        )
        .join("");
    } catch (e) {
      list.innerHTML = "<li class='text-red-500'>Errore caricamento</li>";
    }
  },

  addEvent: async function (dates) {
    if (!dates || dates.length < 2)
      return alert("Seleziona una data di inizio e fine");

    // Formatta le date per Google Calendar (YYYY-MM-DD)
    const start = dates[0].toLocaleDateString("en-CA"); // YYYY-MM-DD locale safe
    const endObj = new Date(dates[1]);
    endObj.setDate(endObj.getDate() + 1); // Google vuole la data di fine esclusiva (+1 giorno)
    const end = endObj.toLocaleDateString("en-CA");

    const titleInput = document.getElementById("eventName");
    const title = titleInput.value;

    try {
      const res = await this.fetchProtected("/api/calendar", {
        method: "POST",
        body: JSON.stringify({ start, end, title }),
      });

      if (res && res.ok) {
        document.getElementById("addEventForm").reset();
        if (document.querySelector("#eventDates")._flatpickr) {
          document.querySelector("#eventDates")._flatpickr.clear();
        }
        this.loadCalendar();
        alert("Prenotazione salvata!");
      } else {
        throw new Error("Errore salvataggio");
      }
    } catch (e) {
      alert("Errore: " + e.message);
    }
  },

  deleteEvent: async function (id) {
    if (!confirm("Vuoi davvero cancellare questa prenotazione?")) return;
    try {
      const res = await this.fetchProtected("/api/calendar", {
        method: "DELETE",
        body: JSON.stringify({ eventId: id }),
      });
      if (res && res.ok) {
        this.loadCalendar();
      } else {
        alert("Errore durante la cancellazione");
      }
    } catch (e) {
      alert(e.message);
    }
  },

  loadReviews: async function () {
    const list = document.getElementById("reviewsList");
    if (!list) return;

    try {
      const res = await fetch("/api/reviews");
      const all = await res.json();
      // Mostra solo quelle NON approvate
      const pending = all
        .map((r, i) => ({ ...r, idx: i }))
        .filter((r) => !r.Approvato || r.Approvato.toUpperCase() !== "SI");

      if (!pending.length) {
        list.innerHTML =
          "<div class='text-center py-6 bg-green-50 text-green-700 rounded-lg border border-green-100'>Tutte le recensioni sono state approvate! ✅</div>";
        return;
      }

      list.innerHTML = pending
        .map(
          (r) => `
                <div class="border border-slate-200 p-4 rounded-xl bg-white hover:shadow-md transition mb-3">
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-bold text-slate-700">${
                          r["Nome e Cognome"] || "Ospite"
                        }</span> 
                        <span class="text-yellow-400 text-sm font-bold">★ ${
                          r.Valutazione
                        }</span>
                    </div>
                    <p class="text-sm italic text-slate-600 mb-4">"${
                      r.Recensione
                    }"</p>
                    <button onclick="app.approveReview(${
                      r.idx
                    })" class="w-full text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded transition">PUBBLICA RECENSIONE</button>
                </div>
            `
        )
        .join("");
    } catch (e) {
      list.innerHTML =
        "<p class='text-red-500 text-center'>Errore caricamento recensioni</p>";
    }
  },

  approveReview: async function (idx) {
    if (!confirm("Sei sicuro di voler pubblicare questa recensione sul sito?"))
      return;
    try {
      const res = await this.fetchProtected("/api/approve-review", {
        method: "POST",
        body: JSON.stringify({ rowIndex: idx }),
      });
      if (res && res.ok) {
        this.loadReviews();
      } else {
        alert("Errore approvazione");
      }
    } catch (e) {
      alert("Errore: " + e.message);
    }
  },
};

// Inizializza tutto al caricamento
document.addEventListener("DOMContentLoaded", () => app.init());
