/* =========================================================
   Mendiola — site scripts
   Each feature is set up by its own init function below.
   ========================================================= */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Header: solid on scroll, hide on scroll down ---- */
  function initHeader() {
    const header = document.querySelector('[data-header]');
    const hero = document.querySelector('.hero');
    if (!header) return;

    let lastY = window.scrollY;
    let ticking = false;

    function update() {
      const y = window.scrollY;
      const pastHero = hero ? y > hero.offsetHeight - header.offsetHeight : y > 80;

      header.classList.toggle('is-scrolled', pastHero);
      // Hide when scrolling down past the hero, show when scrolling up
      if (pastHero && y > lastY + 4) header.classList.add('is-hidden');
      else if (!pastHero || y < lastY - 4) header.classList.remove('is-hidden');

      lastY = y;
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    update();
  }

  /* ---- Scroll progress bar ---- */
  function initProgress() {
    const bar = document.querySelector('[data-progress]');
    if (!bar) return;

    let ticking = false;

    function update() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? window.scrollY / max : 0;
      bar.style.transform = `scaleX(${ratio})`;
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    update();
  }

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

  /* ---- Scroll reveal ----
     Elements with [data-reveal] fade/slide in when they enter the screen.
     Children of a [data-stagger] parent come in one after another. */
  function initReveal() {
    const items = document.querySelectorAll('[data-reveal]');
    if (!items.length) return;

    document.querySelectorAll('[data-stagger]').forEach((group) => {
      group.querySelectorAll(':scope > [data-reveal]').forEach((el, i) => {
        el.style.setProperty('--delay', `${i * 0.12}s`);
      });
    });

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    items.forEach((el) => observer.observe(el));
  }

  /* ---- Number counters (stats strip) ---- */
  function initCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    if (!counters.length || prefersReducedMotion || !('IntersectionObserver' in window)) return;

    const format = (n) => n.toLocaleString('en-US');
    const easeOut = (t) => 1 - Math.pow(1 - t, 4);

    function run(el) {
      const target = Number(el.dataset.counter);
      const duration = 1800;
      const start = performance.now();

      function step(now) {
        const t = Math.min((now - start) / duration, 1);
        el.textContent = format(Math.round(target * easeOut(t)));
        if (t < 1) requestAnimationFrame(step);
      }

      requestAnimationFrame(step);
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        run(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.6 });

    counters.forEach((el) => {
      el.textContent = '0';
      observer.observe(el);
    });
  }

  /* ---- Gallery slider: buttons, swipe, autoplay with timer bar ---- */
  function initSlider() {
    const slider = document.querySelector('[data-slider]');
    if (!slider) return;

    const track = slider.querySelector('[data-track]');
    const count = slider.querySelector('[data-count]');
    const caption = slider.querySelector('[data-caption]');
    const bar = slider.querySelector('[data-slider-bar]');
    const nextBtn = slider.querySelector('[data-next]');
    const prevBtn = slider.querySelector('[data-prev]');
    const slides = Array.from(track.children);
    const total = slides.length;
    const delay = 6000;

    let index = 0;
    let timer = null;

    function startTimer() {
      clearTimeout(timer);
      if (prefersReducedMotion) return;

      // Restart the timer bar from empty
      bar.style.transition = 'none';
      bar.style.transform = 'scaleX(0)';
      void bar.offsetWidth; // force reflow so the transition restarts
      bar.style.transition = `transform ${delay}ms linear`;
      bar.style.transform = 'scaleX(1)';

      timer = setTimeout(() => go(1), delay);
    }

    function pauseTimer() {
      clearTimeout(timer);
      bar.style.transform = getComputedStyle(bar).transform;
      bar.style.transition = 'none';
    }

    function go(step) {
      index = (index + step + total) % total;
      track.style.transform = `translateX(${-100 * index}%)`;
      slides.forEach((s, i) => s.classList.toggle('is-active', i === index));
      count.textContent = `${index + 1} / ${total}`;
      if (caption) caption.textContent = slides[index].dataset.title || '';
      startTimer();
    }

    nextBtn.addEventListener('click', () => go(1));
    prevBtn.addEventListener('click', () => go(-1));

    // Pause while the pointer is over the gallery
    slider.addEventListener('mouseenter', pauseTimer);
    slider.addEventListener('mouseleave', startTimer);

    // Swipe on touch screens
    let startX = null;
    slider.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    slider.addEventListener('touchend', (e) => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      startX = null;
    });

    go(0);
  }

  /* ---- Site plan image fallback ---- */
  function initPlanImage() {
    const figure = document.querySelector('[data-plan-img]');
    const img = figure && figure.querySelector('img');
    if (!img) return;

    const markMissing = () => figure.classList.add('is-missing');
    if (img.complete && img.naturalWidth === 0) markMissing();
    img.addEventListener('error', markMissing);
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
    initHeader();
    initProgress();
    initMenu();
    initReveal();
    initCounters();
    initSlider();
    initPlanImage();
    initEnquiryForm();
    initYear();
  });
})();
