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

  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true; // Disabilita durante l'invio

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
    submitButton.disabled = false; 
  });
});
// --- GESTIONE RECENSIONI (Google Sheets come Database) ---

const SHEET_ID = '1LYQ6nRrLQSm5IQt7p5yhxN4-Hu18W8XBZsPcT2otQ8E'; 
const SHEET_NAME = 'Risposte del modulo 1'; 
const REVIEWS_API_URL = `https://opensheet.elk.sh/${SHEET_ID}/${encodeURIComponent(SHEET_NAME)}`;

const reviewsContainer = document.getElementById('reviewsContainer');
const averageRatingContainer = document.getElementById('averageRating');

// Funzione helper per ottenere le iniziali dal nome (es. "Mario Rossi" -> "MR")
function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

async function fetchAndDisplayReviews() {
  try {
    reviewsContainer.innerHTML = `
      <div class="col-span-full flex justify-center py-10">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>`;
    
    const response = await fetch(REVIEWS_API_URL);
    
    if (!response.ok) throw new Error('Errore nel caricamento');

    const data = await response.json();

    // Filtra solo le approvate ('SI', 'Si', 'si')
    const approvedReviews = data.filter(row => row.Approvato && row.Approvato.toUpperCase() === 'SI');

    if (approvedReviews.length === 0) {
      reviewsContainer.innerHTML = '<p class="text-center text-gray-500 col-span-full py-10">Nessuna recensione ancora disponibile.</p>';
      averageRatingContainer.innerHTML = '';
      return;
    }

    let totalRating = 0;
    let reviewsHtml = '';

    approvedReviews.forEach(review => {
      const nome = review['Nome e Cognome'] || 'Ospite';
      const voto = parseInt(review['Valutazione'], 10) || 0;
      const testo = review['Recensione'] || '';
      const rawDate = review['Data Soggiorno'] || '';
      
      // Formattiamo la data se presente (opzionale, per pulizia)
      const dataDisplay = rawDate ? rawDate.split(' ')[0] : ''; 

      totalRating += voto;

      const initials = getInitials(nome);
      
      // Stelle: usiamo SVG o caratteri. Qui uso caratteri con Tailwind per i colori
      const starsHTML = Array(5).fill(0).map((_, i) => 
        i < voto 
          ? '<span class="text-yellow-400 text-lg">★</span>' 
          : '<span class="text-gray-200 text-lg">★</span>'
      ).join('');

      // --- NUOVO DESIGN DELLA CARD ---
      reviewsHtml += `
        <div class="group relative bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full">
          
          <div class="absolute top-4 right-6 text-8xl text-blue-50 font-serif opacity-50 select-none pointer-events-none group-hover:text-blue-100 transition-colors">
            ”
          </div>

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
            <p class="text-gray-600 leading-relaxed italic text-[0.95rem]">
              "${testo}"
            </p>
          </div>

          ${dataDisplay ? `
            <div class="mt-5 pt-4 border-t border-gray-50 text-xs text-gray-400 font-medium uppercase tracking-wider relative z-10 flex items-center gap-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              Soggiorno: ${dataDisplay}
            </div>
          ` : ''}

        </div>
      `;
    });

    // --- NUOVO DESIGN DEL BOX MEDIA ---
    const average = (totalRating / approvedReviews.length).toFixed(1);
    // Calcolo percentuale per riempimento stelle (opzionale, qui uso metodo semplice)
    const fullStarsCount = Math.round(average);
    const averageStars = '★'.repeat(fullStarsCount) + '☆'.repeat(5 - fullStarsCount);
    
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
      </div>
    `;

    reviewsContainer.innerHTML = reviewsHtml;

  } catch (error) {
    console.error('Errore fetch reviews:', error);
    reviewsContainer.innerHTML = `
      <div class="col-span-full text-center p-6 bg-red-50 rounded-xl border border-red-100 text-red-600">
        <p>Impossibile caricare le recensioni al momento.</p>
      </div>
    `;
    averageRatingContainer.innerHTML = '';
  }
}

// Avvia
fetchAndDisplayReviews();
}); // Parentesi di chiusura del DOMContentLoaded