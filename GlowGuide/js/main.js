/* ==========================================================
   GlowGuide – main.js  (loaded on every page)
   Shared logic: profile/personalization, onboarding, header &
   footer rendering, mobile nav, modals, toasts, reveal
   animations, newsletter validation, image fallbacks.
   Exposes a small global namespace: window.GG
   ========================================================== */
(() => {
  'use strict';
  document.documentElement.classList.add('js');

  const NAME_KEY = 'glowguideUserName';
  const GG = (window.GG = {});
  let memoryName = ''; // fallback if localStorage is unavailable

  /* ---------- Small utilities ---------- */
  GG.$ = (sel, root = document) => root.querySelector(sel);
  GG.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  GG.esc = (str) => String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  GG.img = (id, w = 800) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;

  /* JSON helpers around localStorage (never throw) */
  GG.storage = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
    },
    remove(key) { try { localStorage.removeItem(key); } catch (e) { /* ignore */ } }
  };

  /* ---------- Profile: name storage & personalization ---------- */
  GG.cleanName = (value) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, 30);

  GG.getUserName = () => {
    try { return GG.cleanName(localStorage.getItem(NAME_KEY)) || memoryName; } catch (e) { return memoryName; }
  };

  GG.setUserName = (name) => {
    const clean = GG.cleanName(name);
    if (!clean) return false;
    memoryName = clean;
    try { localStorage.setItem(NAME_KEY, clean); } catch (e) { /* kept in memory only */ }
    GG.updatePersonalizedGreeting();
    document.dispatchEvent(new CustomEvent('glowguide:namechange', { detail: { name: clean } }));
    return true;
  };

  GG.clearUserName = () => {
    memoryName = '';
    try { localStorage.removeItem(NAME_KEY); } catch (e) { /* ignore */ }
  };

  /* Fills every [data-greeting="… {name} …"] and [data-user-name] using textContent (XSS-safe) */
  GG.updatePersonalizedGreeting = () => {
    const name = GG.getUserName();
    GG.$$('[data-greeting]').forEach((el) => {
      el.textContent = el.dataset.greeting.replace(/\{name\}/g, name || 'friend');
    });
    GG.$$('[data-user-name]').forEach((el) => { el.textContent = name; });
  };

  /* ---------- Toast ---------- */
  let toastTimer;
  GG.toast = (message) => {
    let t = GG.$('.toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite');
      document.body.appendChild(t);
    }
    t.textContent = message;
    requestAnimationFrame(() => t.classList.add('show'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
  };

  /* ---------- Modal helper (Escape, backdrop click, focus trap) ---------- */
  GG.openModal = (innerHTML, { small = false, label = 'Dialog' } = {}) => {
    const lastFocus = document.activeElement;
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `<div class="modal ${small ? 'modal--sm' : ''}" role="dialog" aria-modal="true" aria-label="${GG.esc(label)}">
      <button class="modal__close" type="button" aria-label="Close dialog">&times;</button>${innerHTML}</div>`;
    document.body.appendChild(backdrop);
    document.body.classList.add('no-scroll');
    const modal = GG.$('.modal', backdrop);
    GG.attachImageFallbacks(modal);

    const focusables = () => GG.$$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', modal).filter((e) => !e.disabled);
    const close = () => {
      document.removeEventListener('keydown', onKey);
      backdrop.remove();
      if (!GG.$('.modal-backdrop')) document.body.classList.remove('no-scroll');
      if (lastFocus && lastFocus.focus && document.contains(lastFocus)) lastFocus.focus();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); close(); return; }
      if (e.key === 'Tab') {
        const items = focusables(); if (!items.length) return;
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
    GG.$('.modal__close', modal).addEventListener('click', close);
    const first = GG.$('input, .btn', modal) || GG.$('.modal__close', modal);
    setTimeout(() => first && first.focus(), 30);
    return { close, modal };
  };

  /* ---------- Image fallback (graceful failure of external images) ---------- */
  GG.attachImageFallbacks = (root = document) => {
    GG.$$('img', root).forEach((img) => {
      if (img.dataset.fb) return;
      img.dataset.fb = '1';
      const fail = () => img.classList.add('img-failed');
      img.addEventListener('error', fail);
      if (img.complete && img.naturalWidth === 0 && img.src) fail();
    });
  };

  /* ---------- Scroll reveal ---------- */
  GG.initReveal = (root = document) => {
    const els = GG.$$('.reveal:not(.in-view)', root);
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in-view')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in-view'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach((e) => io.observe(e));
  };

  /* ---------- Shared markup ---------- */
  const LEAF = `<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M26 5C13 5 6 12 6 20c0 2 .5 3.800 1.400 5.300C9 27 11 28 13 28c8 0 13-8 13-23Z" fill="#A8B5A0"/><path d="M7 26c4-6 9-11 16-16" stroke="#34483B" stroke-width="1.800" stroke-linecap="round"/></svg>`;
  const NAV = [
    ['index.html', 'Home'], ['skin-guide.html', 'Skin Guide'], ['skin-quiz.html', 'Skin Quiz'],
    ['ingredients.html', 'Ingredients'], ['routines.html', 'Routines'], ['journal.html', 'Journal']
  ];
  const currentFile = () => (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  function renderHeader() {
    const host = GG.$('#siteHeader');
    if (!host) return;
    host.innerHTML = `
      <div class="container nav-wrap">
        <a class="logo" href="index.html" aria-label="GlowGuide home">${LEAF}<span>GlowGuide</span></a>
        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="primaryNav" aria-label="Open menu"><span></span><span></span><span></span></button>
        <nav class="primary-nav" id="primaryNav" aria-label="Primary">
          <ul class="nav-links">${NAV.map(([href, label]) => `<li><a href="${href}">${label}</a></li>`).join('')}</ul>
          <div class="nav-actions">
            <div class="profile">
              <button class="profile-btn" id="profileBtn" type="button" aria-haspopup="true" aria-expanded="false" aria-controls="profileMenu">
                <span class="profile-label">Hello, <span data-user-name></span></span>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m3 6 5 5 5-5"/></svg>
              </button>
              <div class="profile-menu" id="profileMenu" hidden>
                <p class="profile-menu__name" data-user-name></p>
                <button type="button" id="editNameBtn">Edit My Name</button>
                <button type="button" id="resetProfileBtn" class="danger">Reset My Profile</button>
              </div>
            </div>
            <a class="btn btn-primary btn-sm" href="skin-quiz.html">Discover Your Skin</a>
          </div>
        </nav>
      </div>`;
  }

  function renderFooter() {
    const host = GG.$('#siteFooter');
    if (!host) return;
    const ico = (path) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
    host.innerHTML = `
      <div class="container">
        <div class="footer-grid">
          <div>
            <a class="logo" href="index.html">${LEAF}<span>GlowGuide</span></a>
            <p class="footer-about">Understand your skin. Discover your glow. An educational skincare guide for curious, confident routines.</p>
            <div class="social">
              <a href="https://www.instagram.com/" target="_blank" rel="noopener" aria-label="GlowGuide on Instagram">${ico('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.500" cy="6.500" r=".6" fill="currentColor"/>')}</a>
              <a href="https://www.pinterest.com/" target="_blank" rel="noopener" aria-label="GlowGuide on Pinterest">${ico('<circle cx="12" cy="12" r="9"/><path d="M11 8.500c-2.500 1-2.500 4.500 0 5s3.500-1.500 3-3.500M11.500 13l-1.500 6"/>')}</a>
              <a href="https://www.youtube.com/" target="_blank" rel="noopener" aria-label="GlowGuide on YouTube">${ico('<rect x="2.500" y="5.500" width="19" height="13" rx="4"/><path d="m10 9.500 5 2.500-5 2.500z" fill="currentColor"/>')}</a>
            </div>
          </div>
          <div><h4>Explore</h4><ul>
            <li><a href="index.html">Home</a></li><li><a href="skin-guide.html">Skin Guide</a></li><li><a href="skin-quiz.html">Skin Quiz</a></li></ul></div>
          <div><h4>Learn</h4><ul>
            <li><a href="ingredients.html">Ingredients</a></li><li><a href="routines.html">Routines</a></li><li><a href="journal.html">Journal</a></li></ul></div>
          <div><h4>Good to know</h4><p style="font-size:.92rem">GlowGuide shares educational information only. Always patch-test new products and see a dermatologist for persistent skin concerns.</p></div>
        </div>
        <div class="footer-bottom"><span>&copy; ${new Date().getFullYear()} GlowGuide. A college web project.</span><span>Built with HTML, CSS &amp; JavaScript.</span></div>
      </div>`;
  }

  /* ---------- Header behaviour ---------- */
  function initHeader() {
    const header = GG.$('#siteHeader');
    if (!header) return;
    const toggle = GG.$('.nav-toggle', header);
    const file = currentFile();
    GG.$$('.nav-links a', header).forEach((a) => {
      if (a.getAttribute('href').toLowerCase() === file) { a.classList.add('active'); a.setAttribute('aria-current', 'page'); }
    });
    const setOpen = (open) => {
      header.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    toggle.addEventListener('click', () => setOpen(!header.classList.contains('nav-open')));
    GG.$$('.nav-links a, .nav-actions .btn', header).forEach((a) => a.addEventListener('click', () => setOpen(false)));
    window.addEventListener('resize', () => { if (window.innerWidth > 900) setOpen(false); });
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

    /* Profile dropdown */
    const btn = GG.$('#profileBtn'), menu = GG.$('#profileMenu');
    const setMenu = (open) => { menu.hidden = !open; btn.setAttribute('aria-expanded', String(open)); };
    btn.addEventListener('click', (e) => { e.stopPropagation(); setMenu(menu.hidden); });
    document.addEventListener('click', (e) => { if (!menu.hidden && !menu.contains(e.target)) setMenu(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { if (!menu.hidden) { setMenu(false); btn.focus(); } else if (header.classList.contains('nav-open')) setOpen(false); }
    });
    GG.$('#editNameBtn').addEventListener('click', () => { setMenu(false); openEditName(); });
    GG.$('#resetProfileBtn').addEventListener('click', () => {
      setMenu(false);
      if (window.confirm('Reset your profile? Your name will be removed and you will return to the welcome screen. Your saved favourites, bookmarks and quiz result will be kept.')) {
        GG.clearUserName();
        showOnboarding();
      }
    });
  }

  function openEditName() {
    const { close, modal } = GG.openModal(`
      <h2 style="font-size:1.7rem">Edit my name</h2>
      <p style="color:var(--muted)">Your new name appears across every GlowGuide page straight away.</p>
      <form id="editNameForm" novalidate>
        <div class="field"><label for="editNameInput">Your name</label>
        <input id="editNameInput" type="text" maxlength="30" autocomplete="given-name" required></div>
        <p class="field-error" id="editNameError" role="alert"></p>
        <div class="modal__actions" style="margin-top:.5rem"><button class="btn btn-primary" type="submit">Save name</button><button class="btn btn-outline" type="button" id="editNameCancel">Cancel</button></div>
      </form>`, { small: true, label: 'Edit your name' });
    const input = GG.$('#editNameInput', modal);
    input.value = GG.getUserName();
    GG.$('#editNameCancel', modal).addEventListener('click', close);
    GG.$('#editNameForm', modal).addEventListener('submit', (e) => {
      e.preventDefault();
      if (!GG.cleanName(input.value)) {
        input.classList.add('invalid'); GG.$('#editNameError', modal).textContent = 'Please enter a name.'; input.focus(); return;
      }
      GG.setUserName(input.value); close(); GG.toast('Name updated. Nice to meet you, ' + GG.getUserName() + '!');
    });
  }

  /* ---------- Onboarding (first-time visitor) ---------- */
  function showOnboarding() {
    if (GG.$('#onboarding')) return;
    const el = document.createElement('div');
    el.id = 'onboarding'; el.className = 'onboarding';
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'onboardTitle');
    el.innerHTML = `
      <div class="onboarding__media">
        <div class="media"><img src="${GG.img('1556228720-195a672e8a03', 1200)}" alt="Glass skincare serum bottle with a dropper on a soft neutral background"></div>
        <p class="onboarding__quote">Good skin is not about perfection. It is about understanding what your skin needs.</p>
      </div>
      <div class="onboarding__panel">
        <a class="logo" href="index.html" tabindex="-1">${LEAF}<span>GlowGuide</span></a>
        <h1 id="onboardTitle">Your skincare journey starts here.</h1>
        <p class="lead">Let's make your skincare experience personal. First, what should we call you?</p>
        <form id="onboardForm" novalidate>
          <div class="field"><label for="onboardName">Your name</label>
          <input id="onboardName" class="text-input" type="text" placeholder="Enter your name..." maxlength="30" autocomplete="given-name" required aria-describedby="onboardError"></div>
          <p class="field-error" id="onboardError" role="alert"></p>
          <button class="btn btn-primary btn-block" type="submit">Let's Get Started</button>
        </form>
        <p class="onboarding__note">Your name stays in this browser only. No account or password needed.</p>
      </div>`;
    document.body.appendChild(el);
    document.body.classList.add('no-scroll');
    const bg = GG.$$('header, main, footer'); bg.forEach((n) => { n.inert = true; });
    GG.attachImageFallbacks(el);

    const input = GG.$('#onboardName', el), error = GG.$('#onboardError', el);
    setTimeout(() => input.focus(), 400);
    input.addEventListener('input', () => { input.classList.remove('invalid'); error.textContent = ''; });
    GG.$('#onboardForm', el).addEventListener('submit', (e) => {
      e.preventDefault();
      const name = GG.cleanName(input.value);
      if (!name) {
        input.classList.add('invalid'); error.textContent = 'Please enter your name to continue.'; input.value = ''; input.focus(); return;
      }
      GG.setUserName(name);
      el.classList.add('leaving');
      bg.forEach((n) => { n.inert = false; });
      document.body.classList.remove('no-scroll');
      setTimeout(() => {
        el.remove();
        GG.toast(`Welcome to your GlowGuide, ${name}!`);
        if (currentFile() !== 'index.html' && currentFile() !== '') window.location.href = 'index.html';
        else window.scrollTo({ top: 0 });
      }, 600);
    });
  }

  /* ---------- Misc UI ---------- */
  function initScrollTop() {
    const btn = document.createElement('button');
    btn.className = 'scroll-top'; btn.type = 'button'; btn.setAttribute('aria-label', 'Scroll to top');
    btn.innerHTML = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m4 12 6-6 6 6"/></svg>';
    document.body.appendChild(btn);
    window.addEventListener('scroll', () => btn.classList.toggle('show', window.scrollY > 600), { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* In-page anchors: smooth scroll + move keyboard focus */
  function initSmoothAnchors() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || a.getAttribute('href') === '#') return;
      const target = document.getElementById(a.getAttribute('href').slice(1));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true });
    });
  }

  /* Newsletter form (frontend demo only) */
  function initNewsletter() {
    const form = GG.$('#newsletterForm');
    if (!form) return;
    const input = GG.$('#newsletterEmail', form), msg = GG.$('#newsletterMsg');
    const valid = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    input.addEventListener('input', () => { input.classList.remove('invalid'); msg.textContent = ''; });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = input.value.trim();
      msg.className = 'field-error';
      if (!email) { input.classList.add('invalid'); msg.textContent = 'Please enter your email address.'; input.focus(); return; }
      if (!valid(email)) { input.classList.add('invalid'); msg.textContent = 'That email does not look right. Try the format name@example.com.'; input.focus(); return; }
      msg.className = 'field-success';
      msg.textContent = `Thank you, ${GG.getUserName() || 'friend'}! You're on the list. (Demo only: no email was sent or stored.)`;
      form.reset();
    });
  }

  /* ---------- Boot ---------- */
  function init() {
    renderHeader();
    renderFooter();
    initHeader();
    initSmoothAnchors();
    initScrollTop();
    initNewsletter();
    GG.updatePersonalizedGreeting();
    GG.attachImageFallbacks();
    GG.initReveal();
    if (!GG.getUserName()) showOnboarding();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
