document.addEventListener('DOMContentLoaded', function() {
// Mobile navigation toggle
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('nav');
navToggle.addEventListener('click', () => {
navMenu.classList.toggle('open');
});

// Sticky header shadow on scroll
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
if (window.scrollY > 10) {
header.classList.add('shadow-lg');
} else {
header.classList.remove('shadow-lg');
}
});

// --- INIZIALIZZA CAROUSEL (con Swiper.js) ---
// (Assicurati che questo sia DENTRO 'DOMContentLoaded')

const images = [
  { src: './img/1.jpg', alt: 'camera ragazzi' },
  { src: './img/2.jpg', alt: 'camera matrimoniale' },
  { src: './img/3.jpg', alt: 'camera matrimoniale 2' },
  { src: './img/4.jpg', alt: 'cucina' },
  { src: './img/5.jpg', alt: 'bagno' },
  { src: './img/6.jpg', alt: 'salotto' },
  { src: './img/7.jpg', alt: 'salotto 2' },
  { src: './img/8.jpg', alt: 'cucina + isola' },
  { src: './img/9.jpg', alt: 'tv' },
  { src: './img/10.jpg', alt: 'camera ragazzi' },
  { src: './img/11.jpg', alt: 'sanitari' },
  { src: './img/12.jpg', alt: 'vista terrazzo' },
  { src: './img/13.jpg', alt: 'frigo + dispensa' },
  { src: './img/14.jpg', alt: 'balcone' },
  { src: './img/15.jpg', alt: 'disimpegno' }
];

const mainWrapper       = document.querySelector('.mainGallery .swiper-wrapper');
const thumbWrapper      = document.querySelector('.thumbnailGallery .swiper-wrapper');
const fullscreenWrapper = document.querySelector('.fullscreenGallery .swiper-wrapper');

// Popola tutti e tre i caroselli
images.forEach(img => {
  // Slide per Carosello Principale
  mainWrapper.innerHTML += `
    <div class="swiper-slide">
      <img src="${img.src}" alt="${img.alt}" class="w-full h-96 object-cover cursor-pointer">
    </div>
  `;
  // Slide per Thumbnail
  thumbWrapper.innerHTML += `
    <div class="swiper-slide">
      <img src="${img.src}" alt="${img.alt}" class="w-full h-24 object-cover rounded cursor-pointer">
    </div>
  `;
  // Slide per Fullscreen
  fullscreenWrapper.innerHTML += `
    <div class="swiper-slide">
      <img src="${img.src}" alt="${img.alt}" class="w-auto h-auto max-w-[90vw] max-h-[90vh] object-contain">
    </div>
  `;
});

// 1. Inizializza il carosello delle Thumbnail
const thumbnailSwiper = new Swiper(".thumbnailGallery", {
  spaceBetween: 10,
  slidesPerView: 4,
  freeMode: true,
  watchSlidesProgress: true,
});

// 2. Inizializza il carosello Fullscreen (prima del 'main')
const fullscreenSwiper = new Swiper(".fullscreenGallery", {
  loop: true,
  navigation: {
    nextEl: ".fullscreenGallery .swiper-button-next",
    prevEl: ".fullscreenGallery .swiper-button-prev",
  },
});

// 3. Inizializza il carosello Principale
const mainSwiper = new Swiper(".mainGallery", {
  spaceBetween: 10,
  navigation: {
    nextEl: ".mainGallery .swiper-button-next",
    prevEl: ".mainGallery .swiper-button-prev",
  },
  thumbs: {
    swiper: thumbnailSwiper, // Collega alle thumbnail
  },
  loop: true,
  autoplay: {
    delay: 4000,
    disableOnInteraction: false,
  },
  controller: { // Collega al carosello fullscreen
    control: fullscreenSwiper
  }
});

// 4. Collega il fullscreen al main (sincronizzazione inversa)
fullscreenSwiper.controller.control = mainSwiper;


// --- GESTIONE LIGHTBOX/FULLSCREEN ---
const modal = document.getElementById('fullscreenModal');
const closeModalBtn = document.getElementById('closeFsModal');

// Apri cliccando sul carosello principale
mainSwiper.on('click', function () {
  // Sincronizza (anche se il controller dovrebbe già averlo fatto)
  fullscreenSwiper.slideToLoop(mainSwiper.realIndex, 0); // 0ms di animazione
  
  // Mostra il modal
  modal.classList.remove('invisible', 'opacity-0');
});

// Chiudi cliccando la X
closeModalBtn.addEventListener('click', () => {
  modal.classList.add('invisible', 'opacity-0');
});

// Chiudi cliccando sullo sfondo nero (fuori dall'immagine)
modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.classList.add('invisible', 'opacity-0');
  }
});

// --- GESTIONE FORM CONTATTI (con Make.com Webhook) ---
const form = document.getElementById('contactForm');
const statusDiv = document.getElementById('formStatus');

// ⬇️ INCOLLA QUI IL TUO NUOVO URL WEBHOOK FORNITO DA MAKE.COM
const WEBHOOK_URL = 'https://hook.eu1.make.com/gjnnvnlf7yvfosvaedduhllyk4wj2iwe';

form.addEventListener('submit', function(e) {
  e.preventDefault();
  statusDiv.textContent = 'Invio in corso…';
  statusDiv.className = 'text-gray-700';

  const formData = {
    nome: form.nome.value.trim(),
    email: form.email.value.trim(),
    messaggio: form.messaggio.value.trim()
  };

  fetch(WEBHOOK_URL, {
    method: 'POST',
    // Make.com preferisce 'Content-Type' specificato
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formData),
  })
  .then(response => {
    // Make.com risponde con "Accepted" (testo) e status 200
    if (response.ok) {
      statusDiv.textContent = 'Messaggio inviato con successo! 😊';
      statusDiv.className   = 'text-green-600';
      form.reset();
    } else {
      console.error('Errore da Make.com:', response);
      statusDiv.textContent = 'Errore nell\'invio. Riprova più tardi.';
      statusDiv.className   = 'text-red-600';
    }
  })
  .catch(error => {
    console.error('Errore di rete:', error);
    statusDiv.textContent = 'Errore di connessione. Riprova più tardi.';
    statusDiv.className   = 'text-red-600';
  })
  .finally(() => {
    submitButton.disabled = false; // <-- AGGIUNGI: Riabilita il pulsante in ogni caso
  });
});

}); // Parentesi di chiusura del DOMContentLoaded