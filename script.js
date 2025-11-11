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

// --- INIZIALIZZA CAROUSEL ---
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
let currentIndex = 0;

const carouselImage = document.getElementById('carouselImage');
const prevBtn       = document.getElementById('prevBtn');
const nextBtn       = document.getElementById('nextBtn');
const indicators    = document.getElementById('carouselIndicators');

// crea i pallini
images.forEach((img, idx) => {
const dot = document.createElement('div');
dot.classList.add('w-3','h-3','rounded-full','bg-gray-400','cursor-pointer','transition');
dot.addEventListener('click', () => {
currentIndex = idx;
updateCarousel();
});
indicators.appendChild(dot);
});

function updateCarousel() {
// aggiorna immagine
carouselImage.src = images[currentIndex].src;
carouselImage.alt = images[currentIndex].alt;
// evidenzia pallino attivo
Array.from(indicators.children).forEach((dot, i) => {
dot.classList.toggle('bg-blue-500',   i === currentIndex);
dot.classList.toggle('bg-gray-400',   i !== currentIndex);
});
}

// frecce next/prev
prevBtn.addEventListener('click', () => {
currentIndex = (currentIndex - 1 + images.length) % images.length;
updateCarousel();
});
nextBtn.addEventListener('click', () => {
currentIndex = (currentIndex + 1) % images.length;
updateCarousel();
});

// mostra il primo slide all’avvio
updateCarousel();
// ... (codice del carousel, ecc.) ...
updateCarousel();


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
  });
});

}); // Parentesi di chiusura del DOMContentLoaded