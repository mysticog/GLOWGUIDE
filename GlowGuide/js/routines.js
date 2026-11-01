/* ==========================================================
   GlowGuide – routines.js
   Interactive morning/night checklist with progress bar,
   tabs, reset and localStorage persistence.
   Storage key: glowguideRoutineProgress
   ========================================================== */
(() => {
  'use strict';
  const { $, $$, esc, storage, toast, getUserName } = window.GG || {};
  if (!$) return;

  const KEY = 'glowguideRoutineProgress';
  const ROUTINES = {
    morning: [
      { id: 'cleanser', title: 'Gentle cleanser', text: 'Wash with lukewarm water to remove overnight oil and sweat without stripping.', tip: 'Thirty to sixty seconds is plenty.' },
      { id: 'toner', title: 'Toner', optional: true, text: 'A hydrating toner can add moisture and prep skin for the steps after.', tip: 'Skip it if your skin feels fine without.' },
      { id: 'serum', title: 'Serum', text: 'Choose one target: vitamin C for brightness, niacinamide for balance or hyaluronic acid for hydration.', tip: 'Apply to slightly damp skin.' },
      { id: 'moisturizer', title: 'Moisturizer', text: 'Lock in hydration and support your skin barrier with a texture that suits your skin type.', tip: 'Do not forget your neck.' },
      { id: 'sunscreen', title: 'Sunscreen', text: 'Use broad-spectrum SPF 30 or higher as your final step, even on cloudy days.', tip: 'About two finger-lengths for face and neck.' }
    ],
    night: [
      { id: 'remover', title: 'Makeup remover', optional: true, text: 'If you wore makeup or sunscreen, melt it away first with a balm, oil or micellar water.', tip: 'Only needed on days you wore makeup or SPF.' },
      { id: 'cleanser', title: 'Cleanser', text: 'Wash away the day: dirt, oil, pollution and any leftover product.', tip: 'Massage gently and rinse thoroughly.' },
      { id: 'treatment', title: 'Treatment serum', text: 'Use your active of choice, such as retinol or an exfoliating acid, on the nights it is scheduled.', tip: 'Never more than one strong active per night.' },
      { id: 'moisturizer', title: 'Moisturizer', text: 'Repair and replenish while you sleep with a slightly richer cream if you like.', tip: 'Ceramides are a great night-time friend.' },
      { id: 'overnight', title: 'Optional overnight treatment', optional: true, text: 'A sleeping mask or a few drops of squalane can add comfort on drier nights.', tip: 'Great after exfoliating days.' }
    ]
  };
  const LABELS = { morning: 'Morning', night: 'Night' };

  const saved = storage.get(KEY, {});
  const state = { tab: 'morning', done: { morning: [], night: [] } };
  if (saved && typeof saved === 'object') {
    ['morning', 'night'].forEach((t) => {
      if (Array.isArray(saved[t])) state.done[t] = saved[t].filter((id) => ROUTINES[t].some((s) => s.id === id));
    });
    if (saved.tab === 'night') state.tab = 'night';
  }
  if (location.hash === '#night') state.tab = 'night';
  if (location.hash === '#morning') state.tab = 'morning';

  const el = {
    list: $('#routineList'), panel: $('#routinePanel'), tabs: $$('.tab'), title: $('#progressTitle'), pct: $('#progressPct'),
    bar: $('#progressBar'), text: $('#progressText'), reset: $('#resetRoutine')
  };

  const persist = () => storage.set(KEY, { morning: state.done.morning, night: state.done.night, tab: state.tab });

  function renderTabs() {
    el.tabs.forEach((t) => {
      const on = t.dataset.tab === state.tab;
      t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
    });
    el.panel.setAttribute('aria-labelledby', 'tab-' + state.tab);
  }

  function renderSteps() {
    const steps = ROUTINES[state.tab];
    el.list.innerHTML = steps.map((s, i) => `<div class="step">
      <input type="checkbox" id="step-${state.tab}-${s.id}" data-step="${s.id}" ${state.done[state.tab].includes(s.id) ? 'checked' : ''}>
      <label for="step-${state.tab}-${s.id}">
        <span class="step__box"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 8.500 3.200 3.200L13 4.800"/></svg></span>
        <span><span class="step__title">${i + 1}. ${esc(s.title)}${s.optional ? ' <span class="tag">Optional</span>' : ''}</span>
        <span class="step__text" style="display:block">${esc(s.text)}</span>
        <span class="step__tip" style="display:block">${esc(s.tip)}</span></span>
      </label></div>`).join('');
  }

  function renderProgress() {
    const total = ROUTINES[state.tab].length;
    const done = state.done[state.tab].length;
    const pct = Math.round((done / total) * 100);
    el.title.textContent = `${LABELS[state.tab]} progress`;
    el.pct.textContent = pct + '%';
    el.bar.firstElementChild.style.width = pct + '%';
    el.bar.setAttribute('aria-valuenow', String(pct));
    const name = getUserName();
    el.text.textContent = done === total
      ? `Routine complete${name ? ', ' + name : ''}! Your skin thanks you.`
      : `${done} of ${total} steps complete`;
  }

  function renderAll() { renderTabs(); renderSteps(); renderProgress(); }

  function setTab(tab, focus) {
    state.tab = tab; persist(); renderAll();
    if (focus) $('#tab-' + tab).focus();
  }

  /* Events */
  el.tabs.forEach((t) => t.addEventListener('click', () => setTab(t.dataset.tab)));
  $('.tabs').addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    setTab(state.tab === 'morning' ? 'night' : 'morning', true);
  });
  el.list.addEventListener('change', (e) => {
    const box = e.target.closest('input[data-step]');
    if (!box) return;
    const list = state.done[state.tab];
    state.done[state.tab] = box.checked ? [...new Set([...list, box.dataset.step])] : list.filter((id) => id !== box.dataset.step);
    persist(); renderProgress();
  });
  el.reset.addEventListener('click', () => {
    state.done[state.tab] = []; persist(); renderAll(); toast(`${LABELS[state.tab]} routine reset.`);
  });
  document.addEventListener('glowguide:namechange', renderProgress);
  window.addEventListener('hashchange', () => {
    if (location.hash === '#night' || location.hash === '#morning') setTab(location.hash.slice(1));
  });

  renderAll();
})();
