//#region Configuration
const GOOGLE_CLIENT_ID =
  "980340338302-43hbupefo8neh0hbksdra5afdr95b6pj.apps.googleusercontent.com";

const app = {
  token: localStorage.getItem("adminToken"),
  otpData: null,

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

    // Email Form Listener
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

    // Calendar Form Listener
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
  //#endregion

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
    btn.innerText = "Sending...";
    btn.disabled = true;

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send-otp", email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error sending code");

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
    btn.innerText = "Verifying...";
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
      if (!res.ok) throw new Error(data.error || "Invalid code");

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
    window.location.href = "index.html";
  },
  //#endregion

  //#region Dashboard UI
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
  //#endregion

  //#region Protected API Helper
  fetchProtected: async function (url, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.token}`,
    };
    const res = await fetch(url, { ...options, headers });

    if (res.status === 401) {
      this.logout(); // Token expired
      return null;
    }
    return res;
  },
  //#endregion

  //#region Data Logic (Calendar & Reviews)
  loadCalendar: async function () {
    const list = document.getElementById("calendarList");
    if (!list) return;
    list.innerHTML = "<li class='text-slate-400'>Loading...</li>";
    try {
      // GET is public
      const res = await fetch("/api/calendar");
      const events = await res.json();

      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const future = events.filter((e) => new Date(e.end) >= now);

      if (!future.length) {
        list.innerHTML =
          "<li class='text-slate-500 italic'>No future bookings</li>";
        return;
      }

      list.innerHTML = future
        .map(
          (e) => `
                <li class="flex justify-between items-center bg-slate-50 p-3 rounded border border-slate-100 mb-2">
                    <div>
                        <div class="font-bold text-slate-700">${
                          e.realTitle || "Occupied"
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
      list.innerHTML = "<li class='text-red-500'>Load Error</li>";
    }
  },

  addEvent: async function (dates) {
    if (!dates || dates.length < 2) return alert("Select start and end dates");

    const start = dates[0].toLocaleDateString("en-CA");
    const endObj = new Date(dates[1]);
    endObj.setDate(endObj.getDate() + 1);
    const end = endObj.toLocaleDateString("en-CA");

    const titleInput = document.getElementById("eventName");
    const title = titleInput.value;

    // Get notes
    const notesInput = document.getElementById("eventNotes");
    const description = notesInput ? notesInput.value : "";

    try {
      const res = await this.fetchProtected("/api/calendar", {
        method: "POST",
        body: JSON.stringify({ start, end, title, description }),
      });

      if (res && res.ok) {
        document.getElementById("addEventForm").reset();
        if (document.querySelector("#eventDates")._flatpickr) {
          document.querySelector("#eventDates")._flatpickr.clear();
        }
        this.loadCalendar();
        alert("Booking saved!");
      } else {
        throw new Error("Save error");
      }
    } catch (e) {
      alert("Error: " + e.message);
    }
  },

  deleteEvent: async function (id) {
    if (!confirm("Really delete this booking?")) return;
    try {
      const res = await this.fetchProtected("/api/calendar", {
        method: "DELETE",
        body: JSON.stringify({ eventId: id }),
      });
      if (res && res.ok) {
        this.loadCalendar();
      } else {
        alert("Delete error");
      }
    } catch (e) {
      alert(e.message);
    }
  },

  loadReviews: async function () {
    const list = document.getElementById("reviewsList");
    const filterSelect = document.getElementById("reviewFilter");
    if (!list || !filterSelect) return;

    const filterMode = filterSelect.value;

    list.innerHTML =
      "<div class='text-center text-slate-400 py-4'>Loading...</div>";

    try {
      const res = await fetch("/api/reviews");
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
          "<div class='text-center py-6 bg-slate-50 text-slate-500 rounded-lg border border-slate-100'>No reviews in this category.</div>";
        return;
      }

      list.innerHTML = filtered
        .map((r) => {
          const isApproved = r.Approvato && r.Approvato.toUpperCase() === "SI";
          const currentReply = r.Risposta || "";

          let adminActions = "";

          if (!isApproved) {
            adminActions = `<button onclick="app.approveReview(${r.idx})" class="w-full mt-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded transition">APPROVE AND PUBLISH</button>`;
          } else {
            adminActions = `
              <div class="mt-4 pt-3 border-t border-slate-100">
                <label class="text-xs font-bold text-slate-500 uppercase">Your Reply:</label>
                <textarea 
                  id="reply-${r.idx}" 
                  class="w-full mt-1 p-2 text-sm border border-slate-300 rounded bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none transition" 
                  rows="2" 
                  placeholder="Write a public reply..."
                >${currentReply}</textarea>
                
                <div class="flex gap-2 mt-2">
                  <button onclick="app.saveReply(${r.idx})" class="flex-1 bg-slate-800 text-white text-xs font-bold py-2 rounded hover:bg-slate-900 transition">
                    SAVE REPLY
                  </button>
                  <button onclick="app.deleteReview(${r.idx})" class="flex-1 bg-white border border-red-200 text-red-500 text-xs font-bold py-2 rounded hover:bg-red-50 transition">
                    DELETE
                  </button>
                </div>
              </div>
            `;
          }

          return `
                <div class="border border-slate-200 p-4 rounded-xl bg-white hover:shadow-md transition mb-3 relative">
                    ${
                      isApproved
                        ? '<span class="absolute top-2 right-2 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold border border-green-200">PUBLISHED</span>'
                        : '<span class="absolute top-2 right-2 text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold border border-yellow-200">PENDING</span>'
                    }
                    <div class="flex justify-between items-center mb-1 pr-20">
                        <span class="font-bold text-slate-700 truncate">${
                          r["Nome e Cognome"] || "Guest"
                        }</span> 
                    </div>
                    <div class="text-yellow-400 text-xs font-bold mb-2">★ ${
                      r.Valutazione
                    }</div>
                    <p class="text-sm italic text-slate-600 mb-2 wrap-break-word">"${
                      r.Recensione
                    }"</p>
                    <div class="text-xs text-slate-400 mb-2">Stay: ${
                      r["Data Soggiorno"] || "-"
                    }</div>
                    
                    ${adminActions}
                </div>
            `;
        })
        .join("");
    } catch (e) {
      console.error(e);
      list.innerHTML =
        "<p class='text-red-500 text-center'>Error loading reviews</p>";
    }
  },

  approveReview: async function (idx) {
    if (!confirm("Publish this review on the website?")) return;
    try {
      const res = await this.fetchProtected("/api/approve-review", {
        method: "POST",
        body: JSON.stringify({ rowIndex: idx }),
      });
      if (res && res.ok) {
        this.loadReviews();
      } else {
        alert("Approval error");
      }
    } catch (e) {
      alert("Error: " + e.message);
    }
  },

  deleteReview: async function (idx) {
    if (!confirm("WARNING: Permanently delete this review?")) return;
    try {
      const res = await this.fetchProtected("/api/delete-review", {
        method: "POST",
        body: JSON.stringify({ rowIndex: idx }),
      });
      if (res && res.ok) {
        this.loadReviews();
      } else {
        alert("Delete error");
      }
    } catch (e) {
      alert("Error: " + e.message);
    }
  },

  saveReply: async function (idx) {
    const replyText = document.getElementById(`reply-${idx}`).value;
    const btn = event.target;
    const originalText = btn.innerText;

    btn.innerText = "Saving...";
    btn.disabled = true;

    try {
      const res = await this.fetchProtected("/api/reply-review", {
        method: "POST",
        body: JSON.stringify({ rowIndex: idx, replyText: replyText }),
      });

      if (res && res.ok) {
        alert("Reply saved!");
        btn.innerText = "SAVED!";
        setTimeout(() => {
          btn.innerText = originalText;
          btn.disabled = false;
        }, 2000);
      } else {
        throw new Error("Save error");
      }
    } catch (e) {
      alert("Error: " + e.message);
      btn.innerText = originalText;
      btn.disabled = false;
    }
  },
  //#endregion
};

// Initialize on load
document.addEventListener("DOMContentLoaded", () => app.init());
