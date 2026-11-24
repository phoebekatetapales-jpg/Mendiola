/* =========================================================
   Mendiola — site scripts
   Each feature is set up by its own init function below.
   ========================================================= */

(function () {
  'use strict';

  /* ---- Menu overlay ---- */
  function initMenu() {
    const menu = document.getElementById('menu');
    const openBtn = document.querySelector('[data-menu-open]');
    if (!menu || !openBtn) return;

    const closeBtn = menu.querySelector('[data-menu-close]');
    const links = menu.querySelectorAll('[data-menu-link]');

    function setMenu(open) {
      menu.dataset.open = String(open);
      menu.setAttribute('aria-hidden', String(!open));
      openBtn.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('is-locked', open);

      if (open) closeBtn.focus();
      else openBtn.focus();
    }

    openBtn.addEventListener('click', () => setMenu(true));
    closeBtn.addEventListener('click', () => setMenu(false));
    links.forEach((link) => link.addEventListener('click', () => setMenu(false)));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.dataset.open === 'true') setMenu(false);
    });
  }

  /* ---- Gallery slider ---- */
  function initSlider() {
    const track = document.querySelector('[data-track]');
    const count = document.querySelector('[data-count]');
    const nextBtn = document.querySelector('[data-next]');
    const prevBtn = document.querySelector('[data-prev]');
    if (!track || !count || !nextBtn || !prevBtn) return;

    const total = track.children.length;
    let index = 0;

    function go(step) {
      index = (index + step + total) % total;
      track.style.transform = `translateX(${-100 * index}%)`;
      count.textContent = `${index + 1} / ${total}`;
    }

    nextBtn.addEventListener('click', () => go(1));
    prevBtn.addEventListener('click', () => go(-1));
    count.textContent = `1 / ${total}`;
  }

  /* ---- Enquiry form ----
     Front-end only: connect to your email service or backend. */
  function initEnquiryForm() {
    const form = document.querySelector('[data-form]');
    const note = document.querySelector('[data-form-note]');
    if (!form || !note) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!form.checkValidity()) {
        note.textContent = 'Please add your name and a valid email.';
        return;
      }

      note.textContent = 'Thank you — we will be in touch to arrange your visit.';
      form.reset();
    });
  }

  /* ---- Footer year ---- */
  function initYear() {
    const year = document.querySelector('[data-year]');
    if (year) year.textContent = new Date().getFullYear();
  }

  /* ---- Start ---- */
  document.addEventListener('DOMContentLoaded', () => {
    initMenu();
    initSlider();
    initEnquiryForm();
    initYear();
  });
})();
