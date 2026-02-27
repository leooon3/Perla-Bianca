/**
 * gallery.js — Galleria Swiper con lightbox fullscreen
 * Dipendenza: Swiper (globale CDN)
 */

export function initGallery() {
  const mainWrapper = document.querySelector(".mainGallery .swiper-wrapper");
  const thumbWrapper = document.querySelector(".thumbnailGallery .swiper-wrapper");
  const fullscreenWrapper = document.querySelector(".fullscreenGallery .swiper-wrapper");

  if (!mainWrapper || !thumbWrapper || !fullscreenWrapper) return;

  const images = [
    { src: "/img/1.webp",  alt: "camera ragazzi" },
    { src: "/img/2.webp",  alt: "camera matrimoniale" },
    { src: "/img/3.webp",  alt: "camera matrimoniale 2" },
    { src: "/img/4.webp",  alt: "cucina" },
    { src: "/img/5.webp",  alt: "bagno" },
    { src: "/img/6.webp",  alt: "salotto" },
    { src: "/img/7.webp",  alt: "salotto 2" },
    { src: "/img/8.webp",  alt: "cucina + isola" },
    { src: "/img/9.webp",  alt: "tv" },
    { src: "/img/10.webp", alt: "camera ragazzi" },
    { src: "/img/11.webp", alt: "sanitari" },
    { src: "/img/12.webp", alt: "vista terrazzo" },
    { src: "/img/13.webp", alt: "frigo + dispensa" },
    { src: "/img/14.webp", alt: "balcone" },
    { src: "/img/15.webp", alt: "disimpegno" },
  ];

  images.forEach((img) => {
    mainWrapper.innerHTML += `
      <div class="swiper-slide">
        <img src="${img.src}" alt="${img.alt}" class="w-full h-96 object-cover cursor-pointer" loading="lazy" decoding="async">
      </div>`;
    thumbWrapper.innerHTML += `
      <div class="swiper-slide">
        <img src="${img.src}" alt="${img.alt}" class="w-full h-24 object-cover rounded cursor-pointer" loading="lazy" decoding="async">
      </div>`;
    fullscreenWrapper.innerHTML += `
      <div class="swiper-slide">
        <img src="${img.src}" alt="${img.alt}" class="w-auto h-auto max-w-[90vw] max-h-[90vh] object-contain" loading="lazy" decoding="async">
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
    autoplay: { delay: 4000, disableOnInteraction: false },
    navigation: {
      nextEl: ".mainGallery .swiper-button-next",
      prevEl: ".mainGallery .swiper-button-prev",
    },
    thumbs: { swiper: thumbnailSwiper },
    controller: { control: fullscreenSwiper },
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
