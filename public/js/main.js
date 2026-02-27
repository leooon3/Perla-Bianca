/**
 * main.js — Entry point ES6 modules per Perla Bianca
 */

import { initI18n } from './modules/i18n.js';
import { initGallery } from './modules/gallery.js';
import { initCalendar } from './modules/calendar.js';
import { initReviews } from './modules/reviews.js';
import { initContact } from './modules/contact.js';
import { initReviewForm } from './modules/review-form.js';
import { initScroll } from './modules/scroll.js';
import { initWeather } from './modules/weather.js';
import { initPrices }    from './modules/prices.js';
import { initBooking }   from './modules/booking.js';
import { initAnalytics } from './modules/analytics.js';

// i18n prima (async) — deve completarsi prima del calendario che usa currentLang
await initI18n();

// Il resto è difensivo (non fa nulla se l'elemento non esiste sulla pagina)
initGallery();
initCalendar();
initReviews();
initContact();
initReviewForm();
initScroll();
initWeather();
initPrices();
initBooking();
initAnalytics();
