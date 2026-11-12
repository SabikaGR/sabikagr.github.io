/* =========================================================
   SABIKA GR — interactions
   ========================================================= */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------- year ---------- */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- scroll progress + nav state ---------- */
  const nav = $('#siteNav');
  const header = $('.site-header');
  const progress = $('#scrollBar');
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY || document.documentElement.scrollTop;
    if (nav) nav.classList.toggle('is-scrolled', y > 24);
    if (header) header.classList.toggle('is-scrolled', y > 24);
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = `${max > 0 ? Math.min(100, (y / max) * 100) : 0}%`;
    }
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  const toggle = $('#navToggle');
  const links = $('#navLinks');

  const closeMenu = () => {
    if (!toggle || !links) return;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú');
    links.classList.remove('is-open');
  };

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      toggle.setAttribute('aria-label', open ? 'Abrir menú' : 'Cerrar menú');
      links.classList.toggle('is-open', !open);
    });

    $$('a', links).forEach((a) => a.addEventListener('click', closeMenu));

    document.addEventListener('click', (e) => {
      if (!links.classList.contains('is-open')) return;
      if (!links.contains(e.target) && !toggle.contains(e.target)) closeMenu();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeMenu();
        toggle.focus();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 980) closeMenu();
    });

    // allow desktop resizing back without stuck aria state
    window.matchMedia('(min-width: 981px)').addEventListener('change', (ev) => {
      if (ev.matches) closeMenu();
    });
  }

  /* ---------- reveal on scroll ---------- */
  const reveals = $$('.reveal');

  reveals.forEach((el) => {
    const parent = el.parentElement;
    if (!parent) return;
    const group = Array.from(parent.children).filter((c) => c.classList.contains('reveal'));
    const index = group.indexOf(el);
    if (index > 0) el.style.setProperty('--d', `${Math.min(index, 6) * 0.075}s`);
  });

  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- active section in nav ---------- */
  const navLinks = $$('.nav-link');
  const spySections = $$('main section[id]');
  let spyTick = false;

  const updateActive = () => {
    const line = window.innerHeight * 0.45;
    let current = null;

    spySections.forEach((section) => {
      const r = section.getBoundingClientRect();
      if (r.top <= line && r.bottom > line) current = section;
    });

    navLinks.forEach((a) => {
      const active = Boolean(current) && a.getAttribute('href') === `#${current.id}`;
      a.classList.toggle('is-active', active);
      if (active) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });

    spyTick = false;
  };

  const requestSpy = () => {
    if (spyTick) return;
    spyTick = true;
    window.requestAnimationFrame(updateActive);
  };

  window.addEventListener('scroll', requestSpy, { passive: true });
  window.addEventListener('resize', requestSpy);
  updateActive();

  /* ---------- liquid glass pointer light ---------- */
  if (!reduceMotion && canHover) {
    $$('.glass').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
      }, { passive: true });
    });

    /* ---------- 3D tilt ---------- */
    $$('[data-tilt]').forEach((el) => {
      const isProduct = el.classList.contains('product');
      const strength = isProduct ? 6 : 4.5;

      const reset = () => {
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      };

      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--ry', `${(px * strength * 2).toFixed(2)}deg`);
        el.style.setProperty('--rx', `${(-py * strength * 2).toFixed(2)}deg`);
      }, { passive: true });

      el.addEventListener('pointerleave', reset);
      el.addEventListener('blur', reset);
    });
  }

  /* ---------- copy email ---------- */
  const copyBtn = $('#copyEmail');
  const toast = $('#toast');
  let toastTimer;

  const showToast = (message) => {
    if (!toast) return;
    const label = $('span', toast);
    if (label && message) label.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2600);
  };

  const legacyCopy = (text) => {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-999px';
    document.body.appendChild(area);
    area.select();
    try { document.execCommand('copy'); } catch (err) { /* noop */ }
    document.body.removeChild(area);
  };

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const email = copyBtn.dataset.email || '';
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(email);
        } else {
          legacyCopy(email);
        }
        showToast('Correo copiado al portapapeles');
        copyBtn.classList.add('is-done');
        const span = $('span', copyBtn);
        const original = span ? span.textContent : '';
        if (span) span.textContent = '¡Copiado!';
        window.setTimeout(() => {
          copyBtn.classList.remove('is-done');
          if (span) span.textContent = original;
        }, 2200);
      } catch (err) {
        showToast('Abre tu cliente de correo para escribirnos');
      }
    });
  }

  /* ---------- subtle ambient drift on hero (pointer) ---------- */
  const hero = $('.hero');
  if (hero && !reduceMotion && canHover) {
    const watermark = $('.hero-watermark', hero);
    const glow = $('.hero-glow', hero);

    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      if (watermark) watermark.style.transform = `rotate(7deg) translate3d(${x * 20}px, ${y * 18}px, 0)`;
      if (glow) glow.style.transform = `translate3d(${x * -26}px, ${y * -22}px, 0)`;
    }, { passive: true });
  }
})();
