/**
 * scroll.js — Scroll reveal + scroll-top button
 */

export function initScroll() {
  // ─── Scroll Reveal (IntersectionObserver) ───
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

  // ─── Sticky Header shadow ───
  const header = document.getElementById("siteHeader");
  if (header) {
    window.addEventListener("scroll", () => {
      header.classList.toggle("shadow-lg", window.scrollY > 10);
    });
  }

  // ─── Mobile Menu ───
  const navToggle = document.getElementById("mobileToggle");
  const navMenu = document.getElementById("mobileMenu");
  if (navToggle && navMenu) {
    navToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      navMenu.classList.toggle("open");
    });
    navMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navMenu.classList.remove("open");
      });
    });
    document.addEventListener("click", (e) => {
      if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
        navMenu.classList.remove("open");
      }
    });
  }

  // ─── Scroll Top Button ───
  const scrollTopBtn = document.getElementById("scrollTopBtn");
  if (scrollTopBtn) {
    window.addEventListener("scroll", () => {
      const visible = window.scrollY > 300;
      scrollTopBtn.style.opacity = visible ? "1" : "0";
      scrollTopBtn.style.pointerEvents = visible ? "auto" : "none";
    });
    scrollTopBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
}
