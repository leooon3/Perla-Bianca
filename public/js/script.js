document.addEventListener("DOMContentLoaded", function () {
  // ============================================================
  // CONFIGURAZIONE LINGUA & UTILITÀ
  // ============================================================

  // 1. RILEVAMENTO AUTOMATICO LINGUA
  let currentLang = localStorage.getItem("preferredLang");

  if (!currentLang) {
    const userLang = (
      navigator.language || navigator.userLanguage
    ).toLowerCase();
    if (userLang.startsWith("it")) {
      currentLang = "it";
    } else if (userLang.startsWith("fr")) {
      currentLang = "fr";
    } else if (userLang.startsWith("de")) {
      currentLang = "de";
    } else {
      currentLang = "en"; // Default Inglese per tutti gli altri
    }
  }

  // 2. Dizionario Completo delle Traduzioni
  const translations = {
    it: {
      nav_home: "Home",
      nav_servizi: "Servizi",
      nav_galleria: "Galleria",
      nav_prezzi: "Prezzi",
      nav_calendario: "Calendario",
      nav_recensioni: "Recensioni",
      nav_dove: "Dove Siamo",
      nav_chisiamo: "Chi Siamo",
      nav_contatti: "Contatti",
      hero_title: "La Tua Casa al Mare",
      hero_subtitle: "Per una vacanza indimenticabile",
      hero_cta: "Prenota Ora",
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
      gallery_title: "Galleria",
      prezzi_title: "Prezzi & Disponibilità",
      tab_stagione: "Stagione",
      tab_prezzo: "Prezzo a Notte",
      stagione_alta: "Alta Stagione (Luglio - Agosto)",
      stagione_media: "Media Stagione (Giugno, Settembre)",
      stagione_bassa: "Bassa Stagione (Ottobre - Maggio)",
      prezzi_disclaimer:
        "Per verificare le date disponibili e prenotare, compila il modulo nella sezione Contatti.",
      calendar_title: "Verifica Disponibilità",
      calendar_sub: "Le date segnate in rosso non sono disponibili.",
      reviews_title: "Cosa Dicono i Nostri Ospiti",
      reviews_sub: "Hai soggiornato qui di recente?",
      reviews_btn: "Scrivi una Recensione",
      location_title: "Dove Siamo",
      about_sup: "L'Ospitalità",
      about_title: "Benvenuti a Casa Vostra",
      about_p1:
        "Ciao! Siamo Riccardo e Maria. Abbiamo ristrutturato 'Perla Bianca' pensando esattamente a quello che cerchiamo noi quando viaggiamo: pulizia impeccabile, comfort moderni e quel calore che solo una casa vera può dare.",
      about_p2:
        "Siamo innamorati della nostra città e saremo felici di consigliarvi i ristoranti migliori e le spiagge più nascoste.",
      superhost_label: "Superhost Approvato",
      superhost_desc: "Risposte veloci e massima cura",
      contact_title: "Contattaci",
      placeholder_nome: "Nome",
      placeholder_email: "Email",
      placeholder_msg: "Messaggio",
      btn_send: "Invia",
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
      cookie_text:
        "Utilizziamo cookie tecnici per garantirti la migliore esperienza. Continuando a navigare accetti l'uso dei cookie.",
      cookie_btn: "Ho capito",
      "404_meta_title": "Pagina non trovata - Perla Bianca",
      "404_title": "404",
      "404_subtitle": "Ops! Ti sei perso?",
      "404_text":
        "Sembra che questa stanza non esista nella nostra casa vacanze.",
      "404_btn": "Torna alla Home",
      review_page_title: "Lascia una Recensione - Perla Bianca",
      review_back_home: "Torna alla Home",
      review_form_title: "La tua opinione conta",
      review_form_subtitle:
        "Ci auguriamo tu abbia passato un soggiorno indimenticabile.",
      review_label_name: "Nome e Cognome",
      review_placeholder_name: "Es. Mario Rossi",
      review_label_from: "Dal",
      review_label_to: "Al",
      review_label_rating: "Valutazione",
      review_label_message: "La tua esperienza",
      review_placeholder_message:
        "Cosa ti è piaciuto di più? Consiglieresti la casa?",
      review_btn_submit: "Pubblica Recensione",
      footer_copyright_simple: "© 2025 Perla Bianca Casa Vacanze",
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
      // Extra per tooltip calendario
      cal_tooltip_title: "Date Selezionate",
      cal_tooltip_btn: "Richiedi Disponibilità",
      cal_req_msg_start: "Salve, vorrei chiedere disponibilità dal",
      cal_req_msg_end: "al",
      cal_busy: '"Occupato"',
    },
    en: {
      nav_home: "Home",
      nav_servizi: "Services",
      nav_galleria: "Gallery",
      nav_prezzi: "Prices",
      nav_calendario: "Calendar",
      nav_recensioni: "Reviews",
      nav_dove: "Location",
      nav_chisiamo: "About Us",
      nav_contatti: "Contact",
      hero_title: "Your Home by the Sea",
      hero_subtitle: "For an unforgettable holiday",
      hero_cta: "Book Now",
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
      gallery_title: "Gallery",
      prezzi_title: "Prices & Availability",
      tab_stagione: "Season",
      tab_prezzo: "Price per Night",
      stagione_alta: "High Season (July - August)",
      stagione_media: "Mid Season (June, September)",
      stagione_bassa: "Low Season (October - May)",
      prezzi_disclaimer:
        "To check available dates and book, fill out the form in the Contact section.",
      calendar_title: "Check Availability",
      calendar_sub: "Dates marked in red are unavailable.",
      reviews_title: "What Our Guests Say",
      reviews_sub: "Have you stayed here recently?",
      reviews_btn: "Write a Review",
      location_title: "Location",
      about_sup: "Hospitality",
      about_title: "Welcome to Your Home",
      about_p1:
        "Hi! We are Riccardo and Maria. We renovated 'Perla Bianca' thinking exactly about what we look for when we travel: impeccable cleanliness, modern comforts, and the warmth only a real home can give.",
      about_p2:
        "We are in love with our city and will be happy to recommend the best restaurants and hidden beaches.",
      superhost_label: "Approved Superhost",
      superhost_desc: "Fast responses and maximum care",
      contact_title: "Contact Us",
      placeholder_nome: "Name",
      placeholder_email: "Email",
      placeholder_msg: "Message",
      btn_send: "Send",
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
      cookie_text:
        "We use technical cookies to ensure the best experience. By continuing to browse, you accept the use of cookies.",
      cookie_btn: "Got it",
      "404_meta_title": "Page Not Found - Perla Bianca",
      "404_title": "404",
      "404_subtitle": "Oops! Are you lost?",
      "404_text": "It seems this room doesn't exist in our holiday home.",
      "404_btn": "Back to Home",
      review_page_title: "Leave a Review - Perla Bianca",
      review_back_home: "Back to Home",
      review_form_title: "Your opinion matters",
      review_form_subtitle: "We hope you had an unforgettable stay.",
      review_label_name: "Name and Surname",
      review_placeholder_name: "E.g. John Doe",
      review_label_from: "From",
      review_label_to: "To",
      review_label_rating: "Rating",
      review_label_message: "Your experience",
      review_placeholder_message:
        "What did you like the most? Would you recommend the house?",
      review_btn_submit: "Publish Review",
      footer_copyright_simple: "© 2025 Perla Bianca Vacation Rental",
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
      cal_tooltip_title: "Selected Dates",
      cal_tooltip_btn: "Request Availability",
      cal_req_msg_start: "Hi, I would like to ask for availability from",
      cal_req_msg_end: "to",
      cal_busy: '"Busy"',
    },
    fr: {
      nav_home: "Accueil",
      nav_servizi: "Services",
      nav_galleria: "Galerie",
      nav_prezzi: "Tarifs",
      nav_calendario: "Calendrier",
      nav_recensioni: "Avis",
      nav_dove: "Emplacement",
      nav_chisiamo: "À Propos",
      nav_contatti: "Contact",
      hero_title: "Votre Maison à la Mer",
      hero_subtitle: "Pour des vacances inoubliables",
      hero_cta: "Réserver",
      servizi_title: "Confort et Détente à Portée de Main",
      serv_wifi_title: "Wi-Fi Gratuit",
      serv_wifi_desc: "Restez connecté facilement pendant votre séjour.",
      serv_centro_title: "À trois minutes du centre",
      serv_centro_desc:
        "Rejoignez le cœur de la ville en seulement 3 minutes à pied.",
      serv_ac_title: "Climatisation",
      serv_ac_desc: "Environnements frais et confortables en toute saison.",
      serv_kitchen_title: "Cuisine Équipée",
      serv_kitchen_desc: "Tout ce qu'il faut pour préparer vos plats préférés.",
      serv_beds_title: "Jusqu'à cinq couchages",
      serv_beds_desc:
        "Accueille jusqu'à cinq personnes dans des chambres spacieuses.",
      serv_beach_title: "Accès à la Plage",
      serv_beach_desc: "Plage dorée à quelques pas de la maison.",
      gallery_title: "Galerie",
      prezzi_title: "Tarifs & Disponibilité",
      tab_stagione: "Saison",
      tab_prezzo: "Prix par Nuit",
      stagione_alta: "Haute Saison (Juillet - Août)",
      stagione_media: "Moyenne Saison (Juin, Septembre)",
      stagione_bassa: "Basse Saison (Octobre - Mai)",
      prezzi_disclaimer:
        "Pour vérifier les dates disponibles et réserver, remplissez le formulaire dans la section Contact.",
      calendar_title: "Vérifier la Disponibilité",
      calendar_sub: "Les dates marquées en rouge ne sont pas disponibles.",
      reviews_title: "Ce que disent nos hôtes",
      reviews_sub: "Vous avez séjourné ici récemment ?",
      reviews_btn: "Écrire un avis",
      location_title: "Où sommes-nous",
      about_sup: "L'Hospitalité",
      about_title: "Bienvenue chez vous",
      about_p1:
        "Bonjour ! Nous sommes Riccardo et Maria. Nous avons rénové 'Perla Bianca' en pensant exactement à ce que nous recherchons lorsque nous voyageons : une propreté impeccable, un confort moderne et cette chaleur que seule une vraie maison peut offrir.",
      about_p2:
        "Nous sommes amoureux de notre ville et nous serons heureux de vous recommander les meilleurs restaurants et les plages les plus secrètes.",
      superhost_label: "Superhost Approuvé",
      superhost_desc: "Réponses rapides et soin maximal",
      contact_title: "Contactez-nous",
      placeholder_nome: "Nom",
      placeholder_email: "Email",
      placeholder_msg: "Message",
      btn_send: "Envoyer",
      footer_desc:
        "Votre oasis de détente à deux pas de la mer. Réservez dès aujourd'hui vos vacances de rêve en toute autonomie.",
      footer_explore: "Explorer",
      footer_gallery: "Galerie Photos",
      footer_reviews: "Nos Avis",
      footer_info: "Info",
      info_checkin: "Check-in : dès 15h00",
      info_checkout: "Check-out : avant 10h00",
      info_parking: "Parking disponible",
      info_pets: "Animaux admis (sur demande)",
      footer_rights: "Tous droits réservés.",
      footer_admin: "Espace Réservé",
      cookie_text:
        "Nous utilisons des cookies techniques pour vous garantir la meilleure expérience. En continuant à naviguer, vous acceptez l'utilisation de cookies.",
      cookie_btn: "J'ai compris",
      "404_meta_title": "Page non trouvée - Perla Bianca",
      "404_title": "404",
      "404_subtitle": "Oups ! Vous êtes perdu ?",
      "404_text":
        "Il semble que cette pièce n'existe pas dans notre maison de vacances.",
      "404_btn": "Retour à l'accueil",
      review_page_title: "Laisser un avis - Perla Bianca",
      review_back_home: "Retour à l'accueil",
      review_form_title: "Votre opinion compte",
      review_form_subtitle:
        "Nous espérons que vous avez passé un séjour inoubliable.",
      review_label_name: "Prénom et Nom",
      review_placeholder_name: "Ex. Jean Dupont",
      review_label_from: "Du",
      review_label_to: "Au",
      review_label_rating: "Note",
      review_label_message: "Votre expérience",
      review_placeholder_message:
        "Qu'avez-vous le plus aimé ? Recommanderiez-vous la maison ?",
      review_btn_submit: "Publier l'avis",
      footer_copyright_simple: "© 2025 Perla Bianca Location de Vacances",
      js_email_invalid: "Veuillez entrer une adresse email valide.",
      js_sending: "Envoi en cours…",
      js_msg_success: "Message envoyé avec succès ! 😊",
      js_error: "Erreur : ",
      js_loading_reviews: "Chargement des avis...",
      js_no_reviews: "Aucun avis disponible pour le moment.",
      js_host_response: "Réponse de l'hôte :",
      js_stay_date: "Séjour :",
      js_calendar_req:
        "Bonjour, je voudrais demander la disponibilité pour le jour",
      js_calendar_prompt:
        "Faites défiler jusqu'au formulaire de contact pour envoyer la demande.",
      cal_tooltip_title: "Dates Sélectionnées",
      cal_tooltip_btn: "Demander Disponibilité",
      cal_req_msg_start: "Bonjour, je voudrais demander la disponibilité du",
      cal_req_msg_end: "au",
      cal_busy: '"Occupé"',
    },
    de: {
      nav_home: "Startseite",
      nav_servizi: "Dienste",
      nav_galleria: "Galerie",
      nav_prezzi: "Preise",
      nav_calendario: "Kalender",
      nav_recensioni: "Bewertungen",
      nav_dove: "Lage",
      nav_chisiamo: "Über Uns",
      nav_contatti: "Kontakt",
      hero_title: "Ihr Zuhause am Meer",
      hero_subtitle: "Für einen unvergesslichen Urlaub",
      hero_cta: "Jetzt Buchen",
      servizi_title: "Komfort und Entspannung",
      serv_wifi_title: "Kostenloses WLAN",
      serv_wifi_desc:
        "Bleiben Sie während Ihres Aufenthalts einfach in Verbindung.",
      serv_centro_title: "Drei Minuten vom Zentrum",
      serv_centro_desc:
        "Erreichen Sie das Herz der Stadt in nur 3 Minuten zu Fuß.",
      serv_ac_title: "Klimaanlage",
      serv_ac_desc: "Frische und komfortable Umgebung zu jeder Jahreszeit.",
      serv_kitchen_title: "Volle ausgestattete Küche",
      serv_kitchen_desc:
        "Alles, was Sie brauchen, um Ihre Lieblingsgerichte zuzubereiten.",
      serv_beds_title: "Bis zu fünf Schlafplätze",
      serv_beds_desc: "Platz für bis zu fünf Personen in geräumigen Zimmern.",
      serv_beach_title: "Strandzugang",
      serv_beach_desc: "Goldener Strand nur wenige Schritte vom Haus entfernt.",
      gallery_title: "Galerie",
      prezzi_title: "Preise & Verfügbarkeit",
      tab_stagione: "Saison",
      tab_prezzo: "Preis pro Nacht",
      stagione_alta: "Hochsaison (Juli - August)",
      stagione_media: "Zwischensaison (Juni, September)",
      stagione_bassa: "Nebensaison (Oktober - Mai)",
      prezzi_disclaimer:
        "Um verfügbare Daten zu prüfen und zu buchen, füllen Sie das Formular im Bereich Kontakt aus.",
      calendar_title: "Verfügbarkeit Prüfen",
      calendar_sub: "Rot markierte Daten sind nicht verfügbar.",
      reviews_title: "Was unsere Gäste sagen",
      reviews_sub: "Waren Sie kürzlich hier?",
      reviews_btn: "Bewertung schreiben",
      location_title: "Lage",
      about_sup: "Gastfreundschaft",
      about_title: "Willkommen zu Hause",
      about_p1:
        "Hallo! Wir sind Riccardo und Maria. Wir haben 'Perla Bianca' renoviert und dabei genau an das gedacht, was wir selbst auf Reisen suchen: makellose Sauberkeit, modernen Komfort und die Wärme, die nur ein echtes Zuhause bieten kann.",
      about_p2:
        "Wir lieben unsere Stadt und empfehlen Ihnen gerne die besten Restaurants und versteckten Strände.",
      superhost_label: "Anerkannter Superhost",
      superhost_desc: "Schnelle Antworten und maximale Sorgfalt",
      contact_title: "Kontaktieren Sie uns",
      placeholder_nome: "Name",
      placeholder_email: "E-Mail",
      placeholder_msg: "Nachricht",
      btn_send: "Senden",
      footer_desc:
        "Ihre Oase der Entspannung nur wenige Schritte vom Meer entfernt. Buchen Sie noch heute Ihren Traumurlaub.",
      footer_explore: "Erkunden",
      footer_gallery: "Fotogalerie",
      footer_reviews: "Über uns",
      footer_info: "Info",
      info_checkin: "Check-in: ab 15:00 Uhr",
      info_checkout: "Check-out: bis 10:00 Uhr",
      info_parking: "Parkplatz vorhanden",
      info_pets: "Haustiere erlaubt (auf Anfrage)",
      footer_rights: "Alle Rechte vorbehalten.",
      footer_admin: "Reservierter Bereich",
      cookie_text:
        "Wir verwenden technische Cookies, um das beste Erlebnis zu gewährleisten. Durch Weiterblättern akzeptieren Sie die Verwendung von Cookies.",
      cookie_btn: "Verstanden",
      "404_meta_title": "Seite nicht gefunden - Perla Bianca",
      "404_title": "404",
      "404_subtitle": "Hoppla! Haben Sie sich verirrt?",
      "404_text":
        "Es scheint, dass dieser Raum in unserem Ferienhaus nicht existiert.",
      "404_btn": "Zurück zur Startseite",
      review_page_title: "Bewertung abgeben - Perla Bianca",
      review_back_home: "Zurück zur Startseite",
      review_form_title: "Ihre Meinung zählt",
      review_form_subtitle:
        "Wir hoffen, Sie hatten einen unvergesslichen Aufenthalt.",
      review_label_name: "Vor- und Nachname",
      review_placeholder_name: "Z.B. Max Mustermann",
      review_label_from: "Von",
      review_label_to: "Bis",
      review_label_rating: "Bewertung",
      review_label_message: "Ihre Erfahrung",
      review_placeholder_message:
        "Was hat Ihnen am besten gefallen? Würden Sie das Haus weiterempfehlen?",
      review_btn_submit: "Bewertung veröffentlichen",
      footer_copyright_simple: "© 2025 Perla Bianca Ferienwohnung",
      js_email_invalid: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
      js_sending: "Wird gesendet…",
      js_msg_success: "Nachricht erfolgreich gesendet! 😊",
      js_error: "Fehler: ",
      js_loading_reviews: "Bewertungen werden geladen...",
      js_no_reviews: "Noch keine Bewertungen verfügbar.",
      js_host_response: "Antwort des Gastgebers:",
      js_stay_date: "Aufenthalt:",
      js_calendar_req:
        "Hallo, ich möchte die Verfügbarkeit für den Tag anfragen",
      js_calendar_prompt:
        "Scrollen Sie zum Kontaktformular, um die Anfrage zu senden.",
      cal_tooltip_title: "Ausgewählte Daten",
      cal_tooltip_btn: "Verfügbarkeit anfragen",
      cal_req_msg_start: "Hallo, ich möchte die Verfügbarkeit vom",
      cal_req_msg_end: "bis zum",
      cal_busy: '"Belegt"',
    },
  };

  const updateTodayBtnText = (lang) => {
    const btn = document.querySelector(".fc-today-button");
    if (btn) {
      if (lang === "it") btn.textContent = "Oggi";
      else if (lang === "fr") btn.textContent = "Aujourd'hui";
      else if (lang === "de") btn.textContent = "Heute";
      else btn.textContent = "Today";
      btn.style.textTransform = "capitalize";
    }
  };

  const t = (key) => translations[currentLang][key] || key;

  window.changeLanguage = function (lang) {
    currentLang = lang;
    localStorage.setItem("preferredLang", lang);

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (translations[lang][key]) {
        el.textContent = translations[lang][key];
      }
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (translations[lang][key]) {
        el.placeholder = translations[lang][key];
      }
    });

    if (window.calendar && typeof window.calendar.setOption === "function") {
      window.calendar.setOption("locale", lang);
      updateTodayBtnText(lang);
    }

    // Aggiornamento CSS variabile per testo eventi calendario
    document.documentElement.style.setProperty("--busy-text", t("cal_busy"));
    document.body.classList.remove("lang-loading");
  };

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
                <div class="w-12 h-12 rounded-full bg-linear-to-br from-blue-50 to-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg border border-blue-200 shadow-sm shrink-0">
                  ${initials}
                </div>
                <div>
                  <h3 class="font-bold text-gray-900 text-lg leading-tight">${nome}</h3>
                  <div class="flex -mt-0.5">${starsHTML}</div>
                </div>
              </div>

              <div class="relative z-10 grow">
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

        if (!votoInput.value) {
          alert("Per favore, seleziona un numero di stelle.");
          return;
        }
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
  // 9. CALENDARIO FULLCALENDAR (LOGICA TAP-TAP + TOOLTIP)
  // ============================================================
  {
    const calendarEl = document.getElementById("calendar");

    // Funzione helper per rimuovere il tooltip se esiste
    const removeTooltip = () => {
      const existing = document.querySelector(".calendar-tooltip");
      if (existing) existing.remove();
    };

    if (calendarEl) {
      const isMobile = window.innerWidth < 768;
      let selectionStart = null; // Memorizza il primo click

      window.calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",
        locale: currentLang,
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
        unselectAuto: true, // Chiude la selezione se clicchi fuori

        // --- A. GESTIONE DEI DUE CLICK ---
        dateClick: function (info) {
          removeTooltip(); // Pulisci vecchi tooltip

          if (selectionStart === null) {
            // 1. PRIMO CLICK
            selectionStart = info.date;
            window.calendar.unselect(); // Pulisci selezioni precedenti

            // Pulisci classi custom precedenti
            document
              .querySelectorAll(".fc-day-selected-start")
              .forEach((el) => el.classList.remove("fc-day-selected-start"));
            // Evidenzia la data cliccata (Blu Scuro)
            info.dayEl.classList.add("fc-day-selected-start");

            // NESSUNO SCROLL QUI!
          } else {
            // 2. SECONDO CLICK
            const clickedDate = info.date;

            // Se clicco indietro nel tempo, resetto e riparto da qui
            if (clickedDate < selectionStart) {
              selectionStart = clickedDate;
              document
                .querySelectorAll(".fc-day-selected-start")
                .forEach((el) => el.classList.remove("fc-day-selected-start"));
              info.dayEl.classList.add("fc-day-selected-start");
              return;
            }

            // Selezione valida -> Creo il range
            const endDateExclusive = new Date(clickedDate);
            endDateExclusive.setDate(endDateExclusive.getDate() + 1);

            window.calendar.select({
              start: selectionStart,
              end: endDateExclusive,
            });

            // Resetto variabili di stato
            selectionStart = null;
            document
              .querySelectorAll(".fc-day-selected-start")
              .forEach((el) => el.classList.remove("fc-day-selected-start"));
          }
        },

        // --- B. QUANDO IL RANGE È SELEZIONATO (CREA TOOLTIP) ---
        select: function (info) {
          removeTooltip(); // Sicurezza

          // 1. Calcolo Date
          const endDate = new Date(info.end);
          endDate.setDate(endDate.getDate() - 1); // Correzione visiva
          const startStr = info.start.toLocaleDateString("it-IT");
          const endStr = endDate.toLocaleDateString("it-IT");

          // 2. Trova l'elemento DOM dell'ultima data per posizionare il tooltip
          // FullCalendar usa data-date="YYYY-MM-DD"
          const isoDate = endDate.toISOString().split("T")[0];
          const dayEl = document.querySelector(`[data-date="${isoDate}"]`);

          if (dayEl) {
            // 3. Crea il Tooltip HTML
            const tooltip = document.createElement("div");
            tooltip.className = "calendar-tooltip";

            const title = t("cal_tooltip_title");
            const btnText = t("cal_tooltip_btn");
            const rangeText = `${startStr} - ${endStr}`;

            tooltip.innerHTML = `
              <h4>${title}</h4>
              <p>${rangeText}</p>
              <button id="tooltipBtn">${btnText}</button>
            `;
            // Aggiungi al body per evitare problemi di overflow/z-index
            document.body.appendChild(tooltip);

            // 4. Posizionamento (Popper-like logic semplificata)
            const rect = dayEl.getBoundingClientRect();
            const scrollTop =
              window.pageYOffset || document.documentElement.scrollTop;
            const scrollLeft =
              window.pageXOffset || document.documentElement.scrollLeft;

            // Posiziona sopra la cella
            let top = rect.top + scrollTop - tooltip.offsetHeight - 10;
            let left =
              rect.left + scrollLeft + rect.width / 2 - tooltip.offsetWidth / 2;

            // Fix per mobile: se esce a destra o sinistra
            if (left < 10) left = 10;
            if (left + tooltip.offsetWidth > window.innerWidth) {
              left = window.innerWidth - tooltip.offsetWidth - 10;
            }

            tooltip.style.top = `${top}px`;
            tooltip.style.left = `${left}px`;

            // 5. Evento Click sul Bottone del Tooltip
            document
              .getElementById("tooltipBtn")
              .addEventListener("click", () => {
                const msgInput = document.querySelector(
                  'textarea[name="messaggio"]'
                );
                const contactSection = document.getElementById("contatti");

                // Compila Messaggio
                // Compila Messaggio
                const msgText = `${t("cal_req_msg_start")} ${startStr} ${t(
                  "cal_req_msg_end"
                )} ${endStr}.`;

                if (msgInput) msgInput.value = msgText;

                // SCROLLA ORA (e solo ora)
                if (contactSection) {
                  contactSection.scrollIntoView({ behavior: "smooth" });
                }

                // Effetto visivo form
                const form = document.getElementById("contactForm");
                if (form) {
                  form.classList.add("ring-2", "ring-blue-500");
                  setTimeout(
                    () => form.classList.remove("ring-2", "ring-blue-500"),
                    2000
                  );
                }

                removeTooltip(); // Chiudi tooltip
              });
          }
        },

        // Pulisci tooltip se clicco fuori o cambio vista
        unselect: function () {
          // removeTooltip();
        },

        datesSet: function () {
          updateTodayBtnText(currentLang);
          removeTooltip(); // Pulisci se cambio mese
        },
        events: "/api/calendar",
        eventSourceFailure: function (error) {
          console.error("Calendar Error:", error);
        },
      });
      window.calendar.render();

      // Chiudi tooltip se clicco ovunque nel documento (eccetto il tooltip stesso)
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
  }

  // ============================================================
  // 10. METEO (Open-Meteo)
  // ============================================================
  {
    const lat = 40.305595082113115;
    const lon = 17.67639558647628;
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
