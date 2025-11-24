document.addEventListener("DOMContentLoaded", function () {
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

        // --- NUOVA MODIFICA: VALIDAZIONE CLIENT ---
        // Controlliamo subito se la mail è valida prima di fare qualsiasi altra cosa
        const emailValue = form.email.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Regex: testo @ testo . testo

        if (!emailRegex.test(emailValue)) {
          statusDiv.textContent = "Inserisci un indirizzo email valido.";
          statusDiv.className = "text-red-600";

          // Nascondi l'errore dopo 3 secondi
          setTimeout(() => {
            statusDiv.textContent = "";
            statusDiv.className = "";
          }, 3000);

          return; // STOP! Non esegue il codice qui sotto
        }
        // ------------------------------------------

        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        statusDiv.textContent = "Invio in corso…";
        statusDiv.className = "text-gray-700";

        const formData = {
          nome: escapeHTML(form.nome.value.trim()),
          email: escapeHTML(emailValue), // Usiamo il valore già pulito
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
              statusDiv.textContent = "Messaggio inviato con successo! 😊";
              statusDiv.className = "text-green-600";
              form.reset();
              // Opzionale: rimuovi messaggio di successo dopo qualche secondo
              setTimeout(() => {
                statusDiv.textContent = "";
                statusDiv.className = "";
              }, 5000);
            } else {
              throw new Error(data?.message || "Errore sconosciuto");
            }
          })
          .catch((error) => {
            statusDiv.textContent = "Errore: " + error.message;
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
          </div>`;

        const response = await fetch(REVIEWS_API_URL);
        if (!response.ok) throw new Error("Errore nel caricamento");
        const data = await response.json();

        const approvedReviews = data.filter(
          (row) => row.Approvato && row.Approvato.toUpperCase() === "SI"
        );

        if (approvedReviews.length === 0) {
          reviewsContainer.innerHTML =
            '<p class="text-center text-gray-500 col-span-full py-10">Nessuna recensione ancora disponibile.</p>';
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
              </div>
              ${
                dataSoggiorno
                  ? `
                <div class="mt-5 pt-4 border-t border-gray-50 text-xs text-gray-400 font-medium uppercase tracking-wider relative z-10 flex items-center gap-1">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  Soggiorno: ${dataSoggiorno}
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
  // 7. PULSANTE TORNA SU (Versione Corretta)
  // ============================================================
  {
    const scrollTopBtn = document.getElementById("scrollTopBtn");

    // Esegui SOLO se il pulsante esiste (evita errori sulla pagina recensioni)
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
  // 8. INVIO RECENSIONI (Logica Stelle + Date + Invio)
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
              "⚠️ La data di partenza deve essere successiva all'arrivo.";
            statusDiv.className =
              "text-center text-sm font-medium mt-4 p-3 rounded-lg bg-red-100 text-red-700 block";
            // Nascondi errore dopo 4 secondi
            setTimeout(() => {
              statusDiv.className = "hidden";
            }, 4000);
            return; // Interrompe l'invio
          }
        }
        // Disabilita pulsante
        submitBtn.disabled = true;
        submitBtn.textContent = "Invio in corso...";
        submitBtn.classList.add("opacity-75", "cursor-not-allowed");
        statusDiv.className = "hidden";

        // Helper date: 2025-11-23 -> 23/11/2025
        const formatDate = (dateStr) => {
          if (!dateStr) return "";
          const [y, m, d] = dateStr.split("-");
          return `${d}/${m}/${y}`;
        };

        // Raccolta dati
        const arrivo = reviewForm.data_arrivo.value;
        const partenza = reviewForm.data_partenza.value;
        const dataFormattata = `${formatDate(arrivo)} - ${formatDate(
          partenza
        )}`;

        const formData = {
          nome: reviewForm.nome.value.trim(),
          voto: reviewForm.voto.value,
          messaggio: reviewForm.messaggio.value.trim(),
          dataSoggiorno: dataFormattata, // Inviamo la data custom
        };

        try {
          const response = await fetch("/api/submit-review", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          });

          const result = await response.json();

          if (response.ok) {
            statusDiv.textContent =
              "✅ Recensione inviata! Ti stiamo riportando alla Home...";
            statusDiv.className =
              "text-center text-sm font-medium mt-4 p-3 rounded-lg bg-green-100 text-green-700 block";

            // Redirect dopo 2 sec
            setTimeout(() => {
              window.location.href = "index.html#recensioni";
            }, 2000);
          } else {
            throw new Error(result.message || "Errore sconosciuto");
          }
        } catch (error) {
          console.error(error);
          statusDiv.textContent = "❌ Errore: " + error.message;
          statusDiv.className =
            "text-center text-sm font-medium mt-4 p-3 rounded-lg bg-red-100 text-red-700 block";

          // Riabilita solo se errore
          submitBtn.disabled = false;
          submitBtn.textContent = "Pubblica Recensione";
          submitBtn.classList.remove("opacity-75", "cursor-not-allowed");
        }
      });
    }
  }
});
