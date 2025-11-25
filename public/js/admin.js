document.addEventListener("DOMContentLoaded", function () {
  // Funzione di utilità per la SICUREZZA (Sanitizzazione XSS)
  const escapeHtml = (str) => {
    if (!str) return "";
    return str.replace(
      /[&<>'"]/g,
      (tag) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "'": "&#39;",
          '"': "&quot;",
        }[tag])
    );
  };

  // Stato Globale
  let token = localStorage.getItem("adminKey");

  // ============================================================
  // 1. FUNZIONI CORE (API & LOGICA)
  // ============================================================
  // Definiamo qui le funzioni asincrone per renderle accessibili ovunque

  // --- RECENSIONI ---
  async function loadReviews() {
    const list = document.getElementById("reviewsList");
    if (!list) return;

    try {
      const res = await fetch("/api/reviews");
      const all = await res.json();

      // Filtra quelle NON approvate
      const pending = all
        .map((r, i) => ({ ...r, idx: i }))
        .filter((r) => !r.Approvato || r.Approvato.toUpperCase() !== "SI");

      if (pending.length === 0) {
        list.innerHTML = `<div class="p-4 bg-green-50 text-green-700 rounded-lg text-center text-sm border border-green-100">Nessuna recensione in attesa.</div>`;
        return;
      }

      list.innerHTML = pending
        .map(
          (r) => `
          <div class="border border-slate-200 p-4 rounded-xl hover:shadow-md transition bg-white">
              <div class="flex justify-between mb-2">
                  <span class="font-bold text-slate-700">${escapeHtml(
                    r["Nome e Cognome"] || "Ospite"
                  )}</span>
                  <span class="text-yellow-500 font-bold text-sm">★ ${
                    r.Valutazione
                  }</span>
              </div>
              <p class="text-slate-600 text-sm italic mb-3">"${escapeHtml(
                r.Recensione
              )}"</p>
              <div class="flex justify-between items-center mt-2 border-t border-slate-50 pt-2">
                  <span class="text-xs text-slate-400">${escapeHtml(
                    r["Data Soggiorno"] || "-"
                  )}</span>
                  <button class="approve-btn text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition font-bold" data-idx="${
                    r.idx
                  }">APPROVA</button>
              </div>
          </div>`
        )
        .join("");

      // Aggiungi listener ai bottoni generati dinamicamente
      document.querySelectorAll(".approve-btn").forEach((btn) => {
        btn.addEventListener("click", function () {
          approveReview(this.getAttribute("data-idx"));
        });
      });
    } catch (e) {
      console.error(e);
      list.innerHTML =
        '<p class="text-red-500 text-center text-sm">Errore caricamento recensioni</p>';
    }
  }

  async function approveReview(idx) {
    if (!confirm("Pubblicare questa recensione?")) return;
    try {
      await fetch("/api/approve-review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": token,
        },
        body: JSON.stringify({ rowIndex: idx }),
      });
      loadReviews();
    } catch (e) {
      alert("Errore approvazione: " + e.message);
    }
  }

  // --- CALENDARIO ---
  async function loadCalendar() {
    const list = document.getElementById("eventsList");
    if (!list) return;

    try {
      const res = await fetch("/api/calendar");
      const events = await res.json();

      // Filtra solo eventi futuri o attuali
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const futureEvents = events.filter((e) => new Date(e.end) >= now);

      if (futureEvents.length === 0) {
        list.innerHTML = `<div class="text-center text-slate-400 text-sm py-4">Nessuna prenotazione futura.</div>`;
        return;
      }

      list.innerHTML = futureEvents
        .map((e) => {
          const start = new Date(e.start).toLocaleDateString("it-IT", {
            day: "numeric",
            month: "short",
          });
          const end = new Date(e.end).toLocaleDateString("it-IT", {
            day: "numeric",
            month: "short",
          });

          return `
          <li class="flex justify-between items-center bg-white border border-slate-200 p-3 rounded-lg text-sm">
              <div>
                  <div class="font-bold text-slate-700">${escapeHtml(
                    e.realTitle || e.title
                  )}</div>
                  <div class="text-xs text-slate-500">${start} ➝ ${end}</div>
              </div>
              <button class="delete-event-btn text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition" title="Elimina" data-id="${
                e.id
              }">
                  ✕
              </button>
          </li>`;
        })
        .join("");

      // Listener cancellazione eventi
      document.querySelectorAll(".delete-event-btn").forEach((btn) => {
        btn.addEventListener("click", function () {
          deleteEvent(this.getAttribute("data-id"));
        });
      });
    } catch (e) {
      console.error(e);
      list.innerHTML =
        '<p class="text-red-500 text-center text-sm">Errore caricamento calendario</p>';
    }
  }

  async function deleteEvent(eventId) {
    if (
      !confirm(
        "Vuoi davvero cancellare questa prenotazione dal calendario Google?"
      )
    )
      return;
    try {
      await fetch("/api/calendar", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": token,
        },
        body: JSON.stringify({ eventId }),
      });
      loadCalendar();
    } catch (e) {
      alert("Errore cancellazione");
    }
  }

  // Wrapper per caricare tutto
  function loadData() {
    loadReviews();
    loadCalendar();
  }

  // ============================================================
  // 2. GESTIONE AUTENTICAZIONE E UI DASHBOARD
  // ============================================================
  {
    const loginOverlay = document.getElementById("loginOverlay");
    const dashboard = document.getElementById("dashboard");
    const loginForm = document.getElementById("loginForm");
    const loginError = document.getElementById("loginError");
    const passwordInput = document.getElementById("passwordInput");
    const togglePasswordBtn = document.getElementById("togglePassword");
    const logoutBtn = document.getElementById("logoutBtn");

    const showDashboard = () => {
      loginOverlay.classList.add("hidden");
      dashboard.classList.remove("hidden");
      loadData();
    };

    // Login Submit
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const pwd = passwordInput.value;
        if (pwd) {
          localStorage.setItem("adminKey", pwd);
          token = pwd;
          showDashboard();
        } else {
          loginError.classList.remove("hidden");
        }
      });
    }

    // Toggle Visibility Password
    if (togglePasswordBtn && passwordInput) {
      togglePasswordBtn.addEventListener("click", () => {
        const isPassword = passwordInput.getAttribute("type") === "password";
        passwordInput.setAttribute("type", isPassword ? "text" : "password");

        if (isPassword) {
          togglePasswordBtn.classList.remove("text-slate-400");
          togglePasswordBtn.classList.add("text-blue-600");
        } else {
          togglePasswordBtn.classList.add("text-slate-400");
          togglePasswordBtn.classList.remove("text-blue-600");
        }
      });
    }

    // Logout
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("adminKey");
        window.location.href = "index.html";
      });
    }

    // Check iniziale token
    if (token) showDashboard();
  }

  // ============================================================
  // 3. INIZIALIZZAZIONE INPUT E LISTENER AGGIORNAMENTO
  // ============================================================
  {
    // Flatpickr (Calendario Input)
    const fp = flatpickr("#dateRange", {
      mode: "range",
      dateFormat: "Y-m-d",
      locale: "it",
      minDate: "today",
    });

    // Form Aggiunta Evento
    const calendarForm = document.getElementById("calendarForm");
    if (calendarForm) {
      calendarForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const dates = fp.selectedDates;
        if (dates.length < 2) return alert("Seleziona data inizio e fine");

        const btn = document.getElementById("btnAddEvent");
        const originalText = btn.innerText;
        btn.innerText = "Salvataggio...";
        btn.disabled = true;

        const start = fp.formatDate(dates[0], "Y-m-d");
        // Google Calendar vuole fine esclusiva per eventi All Day (+1 giorno)
        const endDateObj = new Date(dates[1]);
        endDateObj.setDate(endDateObj.getDate() + 1);
        const end = endDateObj.toISOString().split("T")[0];

        const title = document.getElementById("bookingName").value;

        try {
          const res = await fetch("/api/calendar", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-admin-password": token,
            },
            body: JSON.stringify({ start, end, title }),
          });

          if (!res.ok) throw new Error("Errore durante il salvataggio");

          calendarForm.reset();
          fp.clear();
          loadCalendar();
          alert("Prenotazione aggiunta con successo!");
        } catch (err) {
          alert("Errore: " + err.message);
        } finally {
          btn.innerText = originalText;
          btn.disabled = false;
        }
      });
    }

    // Pulsanti "Aggiorna" manuali
    const refreshCalBtn = document.getElementById("refreshCalendar");
    if (refreshCalBtn) refreshCalBtn.addEventListener("click", loadCalendar);

    const refreshRevBtn = document.getElementById("refreshReviews");
    if (refreshRevBtn) refreshRevBtn.addEventListener("click", loadReviews);
  }
});
