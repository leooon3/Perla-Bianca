document.addEventListener("DOMContentLoaded", function () {
  // ============================================================
  // CONFIGURAZIONE LINGUA & UTILITÀ
  // ============================================================

  // 1. RILEVAMENTO AUTOMATICO LINGUA

  let currentLang = localStorage.getItem("preferredLang");

  // Se non ha scelto, controlla la lingua del browser/telefono
  if (!currentLang) {
    const userLang = navigator.language || navigator.userLanguage;
    // Se la lingua del dispositivo inizia con 'it', usa italiano.
    // Per QUALSIASI altra lingua (francese, tedesco, cinese...), usa Inglese.
    currentLang = userLang.startsWith("it") ? "it" : "en";
  }
  // 2. Dizionario Completo delle Traduzioni
  const translations = {
    it: {
      // Navigazione
      nav_home: "Home",
      nav_servizi: "Servizi",
      nav_galleria: "Galleria",
      nav_prezzi: "Prezzi",
      nav_calendario: "Calendario",
      nav_recensioni: "Recensioni",
      nav_dove: "Dove Siamo",
      nav_chisiamo: "Chi Siamo",
      nav_contatti: "Contatti",

      // Hero
      hero_title: "La Tua Casa al Mare",
      hero_subtitle: "Per una vacanza indimenticabile",
      hero_cta: "Prenota Ora",

      // Servizi
      servizi_title: "Comfort e Relax a Portata di Mano",
      serv_wifi_title: "Wi-Fi Gratuito",
      serv_wifi_desc: "Connettiti facilmente durante il tuo soggiorno.",
      serv_centro_title: "A tre minuti dal centro",
      serv_centro_desc:
        "Raggiungi il cuore della città in soli 3 minuti a piedi.",
      serv_ac_title: "Aria Condizionata",
      serv_ac_desc: "Ambienti freschi e confortevoli in ogni stagione.",
      serv_kitchen_title: "Cucina Attrezzata",
      serv_kitchen_desc:
        "Tutto il necessario per preparare i tuoi piatti preferiti.",
      serv_beds_title: "Fino a cinque posti letto",
      serv_beds_desc: "Ospita fino a cinque persone in camere spaziose.",
      serv_beach_title: "Accesso alla Spiaggia",
      serv_beach_desc: "Spiaggia dorata a pochi passi dalla casa.",

      // Galleria
      gallery_title: "Galleria",

      // Prezzi
      prezzi_title: "Prezzi & Disponibilità",
      tab_stagione: "Stagione",
      tab_prezzo: "Prezzo a Notte",
      stagione_alta: "Alta Stagione (Luglio - Agosto)",
      stagione_media: "Media Stagione (Giugno, Settembre)",
      stagione_bassa: "Bassa Stagione (Ottobre - Maggio)",
      prezzi_disclaimer:
        "Per verificare le date disponibili e prenotare, compila il modulo nella sezione Contatti.",

      // Calendario
      calendar_title: "Verifica Disponibilità",
      calendar_sub: "Le date segnate in rosso non sono disponibili.",

      // Recensioni
      reviews_title: "Cosa Dicono i Nostri Ospiti",
      reviews_sub: "Hai soggiornato qui di recente?",
      reviews_btn: "Scrivi una Recensione",

      // Dove Siamo
      location_title: "Dove Siamo",

      // Chi Siamo
      about_sup: "L'Ospitalità",
      about_title: "Benvenuti a Casa Vostra",
      about_p1:
        "Ciao! Siamo Riccardo e Maria. Abbiamo ristrutturato 'Perla Bianca' pensando esattamente a quello che cerchiamo noi quando viaggiamo: pulizia impeccabile, comfort moderni e quel calore che solo una casa vera può dare.",
      about_p2:
        "Siamo innamorati della nostra città e saremo felici di consigliarvi i ristoranti migliori e le spiagge più nascoste.",
      superhost_label: "Superhost Approvato",
      superhost_desc: "Risposte veloci e massima cura",

      // Contatti
      contact_title: "Contattaci",
      placeholder_nome: "Nome",
      placeholder_email: "Email",
      placeholder_msg: "Messaggio",
      btn_send: "Invia",

      // Footer
      footer_desc:
        "La tua oasi di relax a due passi dal mare. Prenota oggi la tua vacanza da sogno in totale autonomia.",
      footer_explore: "Esplora",
      footer_gallery: "Galleria Foto",
      footer_reviews: "Dicono di noi",
      footer_info: "Info",
      info_checkin: "Check-in: dalle 15:00",
      info_checkout: "Check-out: entro le 10:00",
      info_parking: "Parcheggio disponibile",
      info_pets: "Animali ammessi (su richiesta)",
      footer_rights: "Tutti i diritti riservati.",
      footer_admin: "Area Riservata",

      // Cookie
      cookie_text:
        "Utilizziamo cookie tecnici per garantirti la migliore esperienza. Continuando a navigare accetti l'uso dei cookie.",
      cookie_btn: "Ho capito",

      // --- STRINGHE JS DINAMICHE ---
      js_email_invalid: "Inserisci un indirizzo email valido.",
      js_sending: "Invio in corso…",
      js_msg_success: "Messaggio inviato con successo! 😊",
      js_error: "Errore: ",
      js_loading_reviews: "Caricamento recensioni...",
      js_no_reviews: "Nessuna recensione ancora disponibile.",
      js_host_response: "Risposta dell'Host:",
      js_stay_date: "Soggiorno:",
      js_calendar_req: "Salve, vorrei chiedere disponibilità per il giorno",
      js_calendar_prompt: "Scorri al form contatti per inviare la richiesta.",
    },
    en: {
      // Nav
      nav_home: "Home",
      nav_servizi: "Services",
      nav_galleria: "Gallery",
      nav_prezzi: "Prices",
      nav_calendario: "Calendar",
      nav_recensioni: "Reviews",
      nav_dove: "Location",
      nav_chisiamo: "About Us",
      nav_contatti: "Contact",

      // Hero
      hero_title: "Your Home by the Sea",
      hero_subtitle: "For an unforgettable holiday",
      hero_cta: "Book Now",

      // Services
      servizi_title: "Comfort and Relax at Your Fingertips",
      serv_wifi_title: "Free Wi-Fi",
      serv_wifi_desc: "Stay connected easily during your stay.",
      serv_centro_title: "Three minutes from center",
      serv_centro_desc: "Reach the heart of the city in just a 3-minute walk.",
      serv_ac_title: "Air Conditioning",
      serv_ac_desc: "Fresh and comfortable environments in every season.",
      serv_kitchen_title: "Fully Equipped Kitchen",
      serv_kitchen_desc: "Everything you need to prepare your favorite meals.",
      serv_beds_title: "Up to five beds",
      serv_beds_desc: "Accommodates up to five people in spacious rooms.",
      serv_beach_title: "Beach Access",
      serv_beach_desc: "Golden beach just a few steps from the house.",

      // Gallery
      gallery_title: "Gallery",

      // Prices
      prezzi_title: "Prices & Availability",
      tab_stagione: "Season",
      tab_prezzo: "Price per Night",
      stagione_alta: "High Season (July - August)",
      stagione_media: "Mid Season (June, September)",
      stagione_bassa: "Low Season (October - May)",
      prezzi_disclaimer:
        "To check available dates and book, fill out the form in the Contact section.",

      // Calendar
      calendar_title: "Check Availability",
      calendar_sub: "Dates marked in red are unavailable.",

      // Reviews
      reviews_title: "What Our Guests Say",
      reviews_sub: "Have you stayed here recently?",
      reviews_btn: "Write a Review",

      // Location
      location_title: "Location",

      // About
      about_sup: "Hospitality",
      about_title: "Welcome to Your Home",
      about_p1:
        "Hi! We are Riccardo and Maria. We renovated 'Perla Bianca' thinking exactly about what we look for when we travel: impeccable cleanliness, modern comforts, and the warmth only a real home can give.",
      about_p2:
        "We are in love with our city and will be happy to recommend the best restaurants and hidden beaches.",
      superhost_label: "Approved Superhost",
      superhost_desc: "Fast responses and maximum care",

      // Contact
      contact_title: "Contact Us",
      placeholder_nome: "Name",
      placeholder_email: "Email",
      placeholder_msg: "Message",
      btn_send: "Send",

      // Footer
      footer_desc:
        "Your oasis of relaxation just steps from the sea. Book your dream vacation independently today.",
      footer_explore: "Explore",
      footer_gallery: "Photo Gallery",
      footer_reviews: "About Us",
      footer_info: "Info",
      info_checkin: "Check-in: from 3:00 PM",
      info_checkout: "Check-out: by 10:00 AM",
      info_parking: "Parking available",
      info_pets: "Pets allowed (on request)",
      footer_rights: "All rights reserved.",
      footer_admin: "Admin Area",

      // Cookie
      cookie_text:
        "We use technical cookies to ensure the best experience. By continuing to browse, you accept the use of cookies.",
      cookie_btn: "Got it",

      // --- JS STRINGS ---
      js_email_invalid: "Please enter a valid email address.",
      js_sending: "Sending...",
      js_msg_success: "Message sent successfully! 😊",
      js_error: "Error: ",
      js_loading_reviews: "Loading reviews...",
      js_no_reviews: "No reviews available yet.",
      js_host_response: "Host Response:",
      js_stay_date: "Stay:",
      js_calendar_req: "Hi, I would like to ask for availability for the day",
      js_calendar_prompt: "Scroll to contact form to send request.",
    },
  };
  const updateTodayBtnText = (lang) => {
    const btn = document.querySelector(".fc-today-button");
    if (btn) {
      // .textContent cancella tutto quello che c'era prima e mette solo il nuovo testo
      btn.textContent = lang === "it" ? "Oggi" : "Today";
      // Assicuriamoci che la prima lettera sia maiuscola (se non lo fa il CSS)
      btn.style.textTransform = "capitalize";
    }
  };

  // Funzione Helper per ottenere traduzioni nel codice JS
  const t = (key) => translations[currentLang][key] || key;

  // Funzione Cambio Lingua Globale
  window.changeLanguage = function (lang) {
    currentLang = lang;
    localStorage.setItem("preferredLang", lang);

    // 1. Aggiorna testi HTML statici
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (translations[lang][key]) {
        el.textContent = translations[lang][key];
      }
    });

    // 2. Aggiorna Placeholders
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (translations[lang][key]) {
        el.placeholder = translations[lang][key];
      }
    });

    if (window.calendar && typeof window.calendar.setOption === "function") {
      // A. Aggiorna la lingua interna
      window.calendar.setOption("locale", lang);

      // B. Aggiorna SUBITO il bottone visivamente
      updateTodayBtnText(lang);
    }
    const busyString = lang === "it" ? '"Occupato"' : '"Busy"';
    document.documentElement.style.setProperty("--busy-text", busyString);
  };

  // Applica la lingua salvata all'avvio
  window.changeLanguage(currentLang);

  // Funzione di utilità per la SICUREZZA (Sanitizzazione XSS)
  const escapeHTML = (str) => {
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

  // ============================================================
  // 1. GESTIONE MENU MOBILE E NAVIGAZIONE
  // ============================================================
  {
    const navToggle = document.querySelector(".nav-toggle");
    const navMenu = document.querySelector("nav");

    if (navToggle && navMenu) {
      navToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        navMenu.classList.toggle("open");
        navToggle.textContent = navMenu.classList.contains("open") ? "✕" : "☰";
      });

      navMenu.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
          navMenu.classList.remove("open");
          navToggle.textContent = "☰";
        });
      });

      document.addEventListener("click", (e) => {
        if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
          navMenu.classList.remove("open");
          navToggle.textContent = "☰";
        }
      });
    }
  }

  // ============================================================
  // 2. HEADER STICKY
  // ============================================================
  {
    const header = document.getElementById("header");
    if (header) {
      window.addEventListener("scroll", () => {
        if (window.scrollY > 10) {
          header.classList.add("shadow-lg");
        } else {
          header.classList.remove("shadow-lg");
        }
      });
    }
  }

  // ============================================================
  // 3. GALLERIA FOTOGRAFICA E LIGHTBOX
  // ============================================================
  {
    const images = [
      { src: "./img/1.webp", alt: "camera ragazzi" },
      { src: "./img/2.webp", alt: "camera matrimoniale" },
      { src: "./img/3.webp", alt: "camera matrimoniale 2" },
      { src: "./img/4.webp", alt: "cucina" },
      { src: "./img/5.webp", alt: "bagno" },
      { src: "./img/6.webp", alt: "salotto" },
      { src: "./img/7.webp", alt: "salotto 2" },
      { src: "./img/8.webp", alt: "cucina + isola" },
      { src: "./img/9.webp", alt: "tv" },
      { src: "./img/10.webp", alt: "camera ragazzi" },
      { src: "./img/11.webp", alt: "sanitari" },
      { src: "./img/12.webp", alt: "vista terrazzo" },
      { src: "./img/13.webp", alt: "frigo + dispensa" },
      { src: "./img/14.webp", alt: "balcone" },
      { src: "./img/15.webp", alt: "disimpegno" },
    ];

    const mainWrapper = document.querySelector(".mainGallery .swiper-wrapper");
    const thumbWrapper = document.querySelector(
      ".thumbnailGallery .swiper-wrapper"
    );
    const fullscreenWrapper = document.querySelector(
      ".fullscreenGallery .swiper-wrapper"
    );

    if (mainWrapper && thumbWrapper && fullscreenWrapper) {
      images.forEach((img) => {
        mainWrapper.innerHTML += `
          <div class="swiper-slide">
            <img src="${img.src}" alt="${img.alt}" class="w-full h-96 object-cover cursor-pointer">
          </div>`;
        thumbWrapper.innerHTML += `
          <div class="swiper-slide">
            <img src="${img.src}" alt="${img.alt}" class="w-full h-24 object-cover rounded cursor-pointer">
          </div>`;
        fullscreenWrapper.innerHTML += `
          <div class="swiper-slide">
            <img src="${img.src}" alt="${img.alt}" class="w-auto h-auto max-w-[90vw] max-h-[90vh] object-contain">
          </div>`;
      });

      const thumbnailSwiper = new Swiper(".thumbnailGallery", {
        spaceBetween: 10,
        slidesPerView: 4,
        freeMode: true,
        watchSlidesProgress: true,
      });

      const fullscreenSwiper = new Swiper(".fullscreenGallery", {
        loop: true,
        navigation: {
          nextEl: ".fullscreenGallery .swiper-button-next",
          prevEl: ".fullscreenGallery .swiper-button-prev",
        },
      });

      const mainSwiper = new Swiper(".mainGallery", {
        spaceBetween: 10,
        loop: true,
        autoplay: {
          delay: 4000,
          disableOnInteraction: false,
        },
        navigation: {
          nextEl: ".mainGallery .swiper-button-next",
          prevEl: ".mainGallery .swiper-button-prev",
        },
        thumbs: {
          swiper: thumbnailSwiper,
        },
        controller: {
          control: fullscreenSwiper,
        },
      });

      fullscreenSwiper.controller.control = mainSwiper;

      const modal = document.getElementById("fullscreenModal");
      const closeModalBtn = document.getElementById("closeFsModal");

      if (modal && closeModalBtn) {
        mainSwiper.on("click", () => {
          fullscreenSwiper.slideToLoop(mainSwiper.realIndex, 0);
          modal.classList.remove("invisible", "opacity-0");
        });

        const closeModal = () => modal.classList.add("invisible", "opacity-0");
        closeModalBtn.addEventListener("click", closeModal);
        modal.addEventListener("click", (e) => {
          if (e.target === modal) closeModal();
        });
      }
    }
  }

  // ============================================================
  // 4. FORM CONTATTI
  // ============================================================
  {
    const form = document.getElementById("contactForm");
    const statusDiv = document.getElementById("formStatus");
    const API_URL = "/api/email";

    if (form && statusDiv) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();

        // Validazione email
        const emailValue = form.email.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(emailValue)) {
          statusDiv.textContent = t("js_email_invalid");
          statusDiv.className = "text-red-600";
          setTimeout(() => {
            statusDiv.textContent = "";
            statusDiv.className = "";
          }, 3000);
          return;
        }

        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        statusDiv.textContent = t("js_sending");
        statusDiv.className = "text-gray-700";

        const formData = {
          nome: escapeHTML(form.nome.value.trim()),
          email: escapeHTML(emailValue),
          messaggio: escapeHTML(form.messaggio.value.trim()),
          honeypot: form.honeypot.value,
        };

        fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
          .then(async (response) => {
            let data;
            try {
              data = await response.json();
            } catch (err) {}

            if (response.ok) {
              statusDiv.textContent = t("js_msg_success");
              statusDiv.className = "text-green-600";
              form.reset();
              setTimeout(() => {
                statusDiv.textContent = "";
                statusDiv.className = "";
              }, 5000);
            } else {
              throw new Error(data?.message || "Errore sconosciuto");
            }
          })
          .catch((error) => {
            statusDiv.textContent = t("js_error") + error.message;
            statusDiv.className = "text-red-600";
            setTimeout(() => {
              statusDiv.textContent = "";
              statusDiv.className = "";
            }, 5000);
          })
          .finally(() => {
            submitButton.disabled = false;
          });
      });
    }
  }

  // ============================================================
  // 5. VISUALIZZAZIONE RECENSIONI
  // ============================================================
  {
    const REVIEWS_API_URL = "/api/reviews";
    const reviewsContainer = document.getElementById("reviewsContainer");
    const averageRatingContainer = document.getElementById("averageRating");

    const getInitials = (name) => {
      if (!name) return "?";
      const parts = name.trim().split(" ");
      if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
      return (
        parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
      ).toUpperCase();
    };

    async function fetchAndDisplayReviews() {
      if (!reviewsContainer || !averageRatingContainer) return;

      try {
        reviewsContainer.innerHTML = `
          <div class="col-span-full flex justify-center py-10">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            <span class="ml-3 text-gray-500">${t("js_loading_reviews")}</span>
          </div>`;

        const response = await fetch(REVIEWS_API_URL);
        if (!response.ok) throw new Error("Errore nel caricamento");
        const data = await response.json();

        const approvedReviews = data.filter(
          (row) => row.Approvato && row.Approvato.toUpperCase() === "SI"
        );

        if (approvedReviews.length === 0) {
          reviewsContainer.innerHTML = `<p class="text-center text-gray-500 col-span-full py-10">${t(
            "js_no_reviews"
          )}</p>`;
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

          // Traduzione dinamica etichetta risposta
          const rispostaAdmin = review["Risposta"]
            ? `
              <div class="mt-4 ml-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg text-sm text-gray-700">
                <p class="font-bold text-blue-800 text-xs mb-1 uppercase tracking-wider">${t(
                  "js_host_response"
                )}</p>
                <p class="italic">"${escapeHTML(review["Risposta"])}"</p>
              </div>
              `
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
              <div class="absolute top-4 right-6 text-8xl text-blue-50 font-serif opacity-50 select-none pointer-events-none group-hover:text-blue-100 transition-colors">”</div>
              <div class="flex items-center gap-4 mb-4 relative z-10">
                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg border border-blue-200 shadow-sm flex-shrink-0">
                  ${initials}
                </div>
                <div>
                  <h3 class="font-bold text-gray-900 text-lg leading-tight">${nome}</h3>
                  <div class="flex -mt-0.5">${starsHTML}</div>
                </div>
              </div>

              <div class="relative z-10 flex-grow">
                <p class="text-gray-600 leading-relaxed italic text-[0.95rem]">"${testo}"</p>
                ${rispostaAdmin} 
              </div>

              ${
                dataSoggiorno
                  ? `
                <div class="mt-5 pt-4 border-t border-gray-50 text-xs text-gray-400 font-medium uppercase tracking-wider relative z-10 flex items-center gap-1">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  ${t("js_stay_date")} ${dataSoggiorno}
                </div>`
                  : ""
              }
            </div>`;
        });

        const average = (totalRating / approvedReviews.length).toFixed(1);
        const fullStarsCount = Math.round(average);
        const averageStars =
          "★".repeat(fullStarsCount) + "☆".repeat(5 - fullStarsCount);

        averageRatingContainer.innerHTML = `
          <div class="bg-white rounded-2xl p-8 shadow-lg border border-blue-50 inline-flex flex-col md:flex-row items-center gap-6 md:gap-10 transform hover:-translate-y-1 transition duration-300">
              <div class="text-center md:text-left">
                <div class="text-5xl font-extrabold text-blue-600 leading-none">${average}</div>
                <div class="text-xs text-gray-400 uppercase font-semibold mt-2">Su 5.0</div>
              </div>
              <div class="h-12 w-px bg-gray-200 hidden md:block"></div> <div class="text-center md:text-left">
                 <div class="text-2xl text-yellow-400 tracking-wider mb-1">${averageStars}</div>
                 <p class="text-gray-500 font-medium">Basato su <span class="text-blue-600 font-bold">${approvedReviews.length}</span> recensioni verificate</p>
              </div>
          </div>`;

        reviewsContainer.innerHTML = reviewsHtml;
      } catch (error) {
        reviewsContainer.innerHTML = `<div class="col-span-full text-center p-6 bg-red-50 rounded-xl border border-red-100 text-red-600"><p>Impossibile caricare le recensioni.</p></div>`;
      }
    }
    fetchAndDisplayReviews();
  }

  // ============================================================
  // 6. SCROLL REVEAL
  // ============================================================
  {
    const revealElements = document.querySelectorAll(".reveal");
    const revealOnScroll = () => {
      const windowHeight = window.innerHeight;
      const elementVisible = 100;
      revealElements.forEach((reveal) => {
        if (
          reveal.getBoundingClientRect().top <
          windowHeight - elementVisible
        ) {
          reveal.classList.add("active");
        }
      });
    };
    window.addEventListener("scroll", revealOnScroll);
    revealOnScroll();
  }

  // ============================================================
  // 7. PULSANTE TORNA SU
  // ============================================================
  {
    const scrollTopBtn = document.getElementById("scrollTopBtn");

    if (scrollTopBtn) {
      window.addEventListener("scroll", () => {
        if (window.scrollY > 300) {
          scrollTopBtn.style.opacity = "1";
          scrollTopBtn.style.pointerEvents = "auto";
        } else {
          scrollTopBtn.style.opacity = "0";
          scrollTopBtn.style.pointerEvents = "none";
        }
      });

      scrollTopBtn.addEventListener("click", (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  }

  // ============================================================
  // 8. INVIO RECENSIONI (Solo pagina recensioni)
  // ============================================================
  {
    const starContainer = document.getElementById("starContainer");
    const votoInput = document.getElementById("votoInput");
    const reviewForm = document.getElementById("internalReviewForm");
    const statusDiv = document.getElementById("reviewFormStatus");
    const submitBtn = document.getElementById("submitReviewBtn");

    if (starContainer && reviewForm) {
      // --- A. LOGICA VISIVA STELLE ---
      const stars = starContainer.querySelectorAll(".star");
      const highlightStars = (rating) => {
        stars.forEach((star) => {
          const val = parseInt(star.getAttribute("data-value"));
          if (val <= rating) {
            star.classList.remove("text-gray-300");
            star.classList.add("text-yellow-400");
          } else {
            star.classList.add("text-gray-300");
            star.classList.remove("text-yellow-400");
          }
        });
      };

      stars.forEach((star) => {
        star.addEventListener("click", () => {
          const val = parseInt(star.getAttribute("data-value"));
          votoInput.value = val;
          highlightStars(val);
        });
      });

      // --- B. INVIO DATI A VERCEL ---
      reviewForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const arrivoValue = reviewForm.data_arrivo.value;
        const partenzaValue = reviewForm.data_partenza.value;

        // --- VALIDAZIONE DATE ---
        if (arrivoValue && partenzaValue) {
          const dArrivo = new Date(arrivoValue);
          const dPartenza = new Date(partenzaValue);

          if (dPartenza <= dArrivo) {
            statusDiv.textContent =
              "La data di partenza deve essere successiva all'arrivo.";
            statusDiv.className =
              "text-center text-sm font-medium mt-4 p-3 rounded-lg bg-red-100 text-red-700 block";
            setTimeout(() => {
              statusDiv.className = "hidden";
            }, 4000);
            return;
          }
        }

        submitBtn.disabled = true;
        submitBtn.textContent = t("js_sending"); // Usa traduzione
        submitBtn.classList.add("opacity-75", "cursor-not-allowed");
        statusDiv.className = "hidden";

        const formatDate = (dateStr) => {
          if (!dateStr) return "";
          const [y, m, d] = dateStr.split("-");
          return `${d}/${m}/${y}`;
        };

        const arrivo = reviewForm.data_arrivo.value;
        const partenza = reviewForm.data_partenza.value;
        const dataFormattata = `${formatDate(arrivo)} - ${formatDate(
          partenza
        )}`;

        const formData = {
          nome: reviewForm.nome.value.trim(),
          voto: reviewForm.voto.value,
          messaggio: reviewForm.messaggio.value.trim(),
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
            setTimeout(() => {
              window.location.href = "index.html#recensioni";
            }, 2000);
          } else {
            throw new Error(result.message || "Errore sconosciuto");
          }
        } catch (error) {
          statusDiv.textContent = t("js_error") + error.message;
          statusDiv.className =
            "text-center text-sm font-medium mt-4 p-3 rounded-lg bg-red-100 text-red-700 block";
          submitBtn.disabled = false;
          submitBtn.textContent = "Pubblica Recensione";
          submitBtn.classList.remove("opacity-75", "cursor-not-allowed");
        }
      });
    }
  }

  // ============================================================
  // 9. CALENDARIO FULLCALENDAR
  // ============================================================
  {
    const calendarEl = document.getElementById("calendar");

    if (calendarEl) {
      window.calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",
        locale: currentLang, // Usa la lingua corrente
        headerToolbar: {
          left: "prev,next",
          center: "title",
          right: "today",
        },
        height: "auto",
        contentHeight: 500,
        firstDay: 1,
        datesSet: function () {
          // Scatta ogni volta che cambi mese o vista
          updateTodayBtnText(currentLang);
        },
        events: "/api/calendar",

        dateClick: function (info) {
          const contactSection = document.getElementById("contatti");
          if (contactSection) {
            contactSection.scrollIntoView({ behavior: "smooth" });
          }

          const msgInput = document.querySelector('textarea[name="messaggio"]');
          if (msgInput) {
            const dateParts = info.dateStr.split("-");
            const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;

            // Messaggio tradotto
            msgInput.value = `${t("js_calendar_req")} ${formattedDate}.`;
            msgInput.focus();
          }
        },

        eventSourceFailure: function (error) {
          console.error("Errore caricamento eventi calendario:", error);
        },
      });
      window.calendar.render();

      // Nota: FullCalendar richiede il pacchetto Locales per tradurre automaticamente giorni/mesi
      // Se vuoi che cambi "January" in "Gennaio" dinamicamente, dovresti includere i locale files di FC
      // o ricaricare il calendario al cambio lingua.
    }
  }

  // ============================================================
  // 10. METEO (Open-Meteo)
  // ============================================================
  {
    const lat = 40.4018;
    const lon = 17.6329;
    const weatherWidget = document.getElementById("weatherWidget");

    const getWeatherIcon = (code) => {
      if (code === 0) return "☀️";
      if (code >= 1 && code <= 3) return "⛅";
      if (code >= 45 && code <= 48) return "🌫️";
      if (code >= 51 && code <= 67) return "🌧️";
      if (code >= 71 && code <= 77) return "❄️";
      if (code >= 80 && code <= 82) return "🌦️";
      if (code >= 95) return "⛈️";
      return "🌡️";
    };

    if (weatherWidget) {
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`
      )
        .then((res) => res.json())
        .then((data) => {
          const temp = Math.round(data.current.temperature_2m);
          const code = data.current.weather_code;

          document.getElementById("weatherTemp").textContent = `${temp}°C`;
          document.getElementById("weatherIcon").textContent =
            getWeatherIcon(code);
          weatherWidget.classList.remove("hidden");
        })
        .catch((err) => console.error("Err meteo:", err));
    }
  }
});
