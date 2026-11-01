/* ==========================================================
   GlowGuide – quiz.js
   Seven-question skin type quiz with weighted scoring.
   Result is saved to localStorage (key: glowguideQuizResult).
   ========================================================== */
(() => {
  'use strict';
  const { $, esc, storage } = window.GG || {};
  if (!$) return;

  const KEY = 'glowguideQuizResult';
  const TYPE_ORDER = ['combination', 'normal', 'oily', 'dry']; // tie-break priority

  /* Each option adds points to one or more skin types */
  const QUESTIONS = [
    { q: 'How does your skin feel after washing your face?', options: [
      { t: 'Tight and uncomfortable', s: { dry: 3 } },
      { t: 'Comfortable and soft', s: { normal: 3 } },
      { t: 'Tight on the cheeks, fine elsewhere', s: { combination: 3 } },
      { t: 'Clean, but oil returns quickly', s: { oily: 3 } } ] },
    { q: 'How does your skin look after a few hours?', options: [
      { t: 'Shiny all over', s: { oily: 3 } },
      { t: 'Shiny on the forehead and nose only', s: { combination: 3 } },
      { t: 'Dull, rough or a little flaky', s: { dry: 3 } },
      { t: 'About the same as when I started', s: { normal: 3 } } ] },
    { q: 'Do you experience excessive oiliness?', options: [
      { t: 'Yes, all over my face', s: { oily: 3 } },
      { t: 'Only in my T-zone', s: { combination: 3 } },
      { t: 'Rarely or never', s: { dry: 2, normal: 1 } },
      { t: 'Only occasionally, nothing excessive', s: { normal: 3 } } ] },
    { q: 'Do you frequently experience dry or flaky patches?', options: [
      { t: 'Yes, often rough or flaky', s: { dry: 3 } },
      { t: 'Sometimes on my cheeks', s: { combination: 2, dry: 1 } },
      { t: 'Rarely', s: { normal: 2, oily: 1 } },
      { t: 'Never, my skin is oily instead', s: { oily: 3 } } ] },
    { q: 'How does your skin feel around the T-zone (forehead, nose and chin)?', options: [
      { t: 'Shiny and oily', s: { oily: 2, combination: 1 } },
      { t: 'Oily, but my cheeks are normal or dry', s: { combination: 3 } },
      { t: 'Tight or dry, like the rest of my face', s: { dry: 3 } },
      { t: 'Comfortable and balanced', s: { normal: 3 } } ] },
    { q: 'How would you describe your pores?', options: [
      { t: 'Large and visible across my face', s: { oily: 3 } },
      { t: 'Visible on my nose and chin only', s: { combination: 3 } },
      { t: 'Small and almost invisible', s: { normal: 2, dry: 1 } },
      { t: 'Barely noticeable, with a rough or papery texture', s: { dry: 3 } } ] },
    { q: 'How does your skin usually feel throughout the day?', options: [
      { t: 'Greasy by the afternoon', s: { oily: 3 } },
      { t: 'Oily in some areas, comfortable in others', s: { combination: 3 } },
      { t: 'Tight or itchy, and it needs moisturiser often', s: { dry: 3 } },
      { t: 'Comfortable and consistent', s: { normal: 3 } } ] }
  ];

  const TYPES = {
    oily: {
      label: 'Oily',
      summary: 'Your skin makes more sebum than average, so it tends to look shiny, especially across the T-zone and cheeks. It often has larger pores and can be prone to congestion, but it also tends to show fewer fine lines.',
      traits: ['Shine appears within a few hours of cleansing', 'Visible, enlarged pores', 'Prone to blackheads and breakouts', 'Makeup may slip or fade'],
      morning: ['Gel or foaming cleanser', 'Lightweight niacinamide serum', 'Oil-free gel moisturiser', 'Broad-spectrum SPF 30+ in a light texture'],
      night: ['Gentle cleanser (double cleanse if you wore SPF or makeup)', 'Salicylic acid two or three nights a week', 'Light gel moisturiser'],
      ingredients: ['Niacinamide', 'Salicylic Acid', 'Azelaic Acid', 'Hyaluronic Acid']
    },
    dry: {
      label: 'Dry',
      summary: 'Your skin produces less oil, so it has a harder time holding on to moisture. It may feel tight after cleansing and look dull or flaky when the weather turns cold or dry.',
      traits: ['A tight feeling after washing', 'Small, barely visible pores', 'Rough or flaky patches', 'Fine lines that look more obvious when dehydrated'],
      morning: ['Creamy, non-foaming cleanser', 'Hyaluronic acid serum on damp skin', 'Ceramide-rich moisturiser', 'Broad-spectrum SPF 30+ with a hydrating base'],
      night: ['Cream or milk cleanser', 'Hydrating or peptide serum', 'Rich ceramide cream, with a few drops of squalane if needed'],
      ingredients: ['Hyaluronic Acid', 'Ceramides', 'Squalane', 'Lactic Acid']
    },
    combination: {
      label: 'Combination',
      summary: 'Your skin behaves like two skin types at once: oilier through the forehead, nose and chin, and normal to dry on the cheeks. Your needs can also shift with the seasons.',
      traits: ['Shine mostly in the T-zone', 'Larger pores around the nose', 'Comfortable or slightly dry cheeks', 'Products that suit one area but not another'],
      morning: ['Gentle, balancing cleanser', 'Niacinamide serum', 'Lightweight lotion all over', 'Broad-spectrum SPF 30+'],
      night: ['Gentle cleanser', 'Salicylic acid on the T-zone only, two nights a week', 'Lotion all over, with a richer cream on dry areas'],
      ingredients: ['Niacinamide', 'Hyaluronic Acid', 'Salicylic Acid', 'Squalane']
    },
    normal: {
      label: 'Normal',
      summary: 'Your skin is well balanced: not too oily and not too dry, with a smooth texture and few sensitivities. The goal is to protect what you have and keep things simple.',
      traits: ['Comfortable through the day', 'Small, barely visible pores', 'Even tone and smooth texture', 'Rarely reacts to products'],
      morning: ['Gentle cleanser', 'Vitamin C serum', 'Light moisturiser', 'Broad-spectrum SPF 30+'],
      night: ['Gentle cleanser', 'Retinol two nights a week once your skin is used to actives', 'Moisturiser'],
      ingredients: ['Vitamin C', 'Retinol', 'Hyaluronic Acid', 'Peptides']
    }
  };

  const state = { index: 0, answers: new Array(QUESTIONS.length).fill(null) };
  const el = {
    intro: $('#quizIntro'), shell: $('#quizShell'), result: $('#quizResult'), form: $('#quizForm'), body: $('#quizBody'),
    err: $('#quizError'), prev: $('#prevBtn'), next: $('#nextBtn'), step: $('#quizStep'), pct: $('#quizPct'), bar: $('#quizBar')
  };

  /* ----- Scoring ----- */
  function calculate(answers) {
    const scores = { oily: 0, dry: 0, combination: 0, normal: 0 };
    answers.forEach((ans, i) => {
      const opt = QUESTIONS[i].options[ans];
      Object.entries(opt.s).forEach(([type, pts]) => { scores[type] += pts; });
    });
    const max = Math.max(...Object.values(scores));
    const type = TYPE_ORDER.find((t) => scores[t] === max);
    return { type, scores };
  }

  /* ----- Question rendering ----- */
  function renderQuestion() {
    const q = QUESTIONS[state.index];
    const total = QUESTIONS.length;
    el.body.innerHTML = `<div class="quiz-slide">
      <h2 class="quiz-question" id="quizQuestion" tabindex="-1">${esc(q.q)}</h2>
      <fieldset class="quiz-options" aria-labelledby="quizQuestion">
        ${q.options.map((o, i) => `<div class="quiz-option">
          <input type="radio" name="answer" id="opt${i}" value="${i}" ${state.answers[state.index] === i ? 'checked' : ''}>
          <label for="opt${i}">${esc(o.t)}</label></div>`).join('')}
      </fieldset></div>`;
    const pct = Math.round(((state.index + 1) / total) * 100);
    el.step.textContent = `Question ${state.index + 1} of ${total}`;
    el.pct.textContent = pct + '%';
    el.bar.firstElementChild.style.width = pct + '%';
    el.bar.setAttribute('aria-valuenow', String(pct));
    el.prev.disabled = state.index === 0;
    el.next.textContent = state.index === total - 1 ? 'See my result' : 'Next';
    el.err.textContent = '';
  }

  function start() {
    state.index = 0; state.answers.fill(null);
    el.intro.hidden = true; el.result.hidden = true; el.shell.hidden = false;
    renderQuestion();
    $('#quizQuestion').focus({ preventScroll: true });
    el.shell.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function onSubmit(e) {
    e.preventDefault();
    const checked = el.form.querySelector('input[name="answer"]:checked');
    if (!checked) { el.err.textContent = 'Please choose an answer to continue.'; return; }
    state.answers[state.index] = Number(checked.value);
    if (state.index < QUESTIONS.length - 1) {
      state.index += 1; renderQuestion(); $('#quizQuestion').focus({ preventScroll: true });
    } else {
      const result = calculate(state.answers);
      storage.set(KEY, { type: result.type, scores: result.scores, date: new Date().toISOString() });
      showResult(result);
    }
  }

  function onPrev() {
    const checked = el.form.querySelector('input[name="answer"]:checked');
    if (checked) state.answers[state.index] = Number(checked.value);
    if (state.index > 0) { state.index -= 1; renderQuestion(); $('#quizQuestion').focus({ preventScroll: true }); }
  }

  /* ----- Result ----- */
  function showResult({ type, scores, date }, scroll = true) {
    const info = TYPES[type];
    const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
    const li = (arr) => arr.map((x) => `<li>${esc(x)}</li>`).join('');
    const rows = Object.keys(TYPES).map((k) => {
      const p = Math.round((scores[k] / total) * 100);
      return `<div class="score-row"><span>${TYPES[k].label}</span><div class="bar" aria-hidden="true"><span style="width:${p}%"></span></div><span>${p}%</span></div>`;
    }).join('');
    const saved = date ? `<p style="color:var(--muted);font-size:.9rem">Saved on ${esc(new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }))}.</p>` : '';

    el.result.innerHTML = `
      <p class="greeting" data-greeting="Here's your skincare profile, {name}."></p>
      <h2 class="result-type" id="resultTitle" tabindex="-1">${esc(info.label)} skin</h2>
      <p class="lead">${esc(info.summary)}</p>
      ${saved}
      <div style="margin-top:1.5rem"><h4>How your answers added up</h4>${rows}</div>
      <div class="result-grid">
        <div class="result-panel"><h4>Common characteristics</h4><ul class="check">${li(info.traits)}</ul></div>
        <div class="result-panel"><h4>Ingredients to explore</h4><ul class="check">${info.ingredients.map((n) => `<li><a class="text-link" href="ingredients.html?q=${encodeURIComponent(n.split(' ')[0])}">${esc(n)}</a></li>`).join('')}</ul></div>
        <div class="result-panel"><h4>Suggested morning routine</h4><ol>${li(info.morning)}</ol></div>
        <div class="result-panel"><h4>Suggested night routine</h4><ol>${li(info.night)}</ol></div>
      </div>
      <div class="btn-row">
        <a class="btn btn-primary" href="routines.html">Open my routine planner</a>
        <a class="btn btn-outline" href="ingredients.html">Browse ingredients</a>
        <button class="btn btn-outline" type="button" id="retakeBtn">Retake Quiz</button>
      </div>
      <p class="quiz-disclaimer">This result is an educational self-assessment, not a medical diagnosis. Skin changes with age, season and health. See a dermatologist for acne, rashes or any ongoing concern.</p>`;
    window.GG.updatePersonalizedGreeting();
    el.intro.hidden = true; el.shell.hidden = true; el.result.hidden = false;
    $('#retakeBtn').addEventListener('click', start);
    if (scroll) {
      $('#resultTitle').focus({ preventScroll: true });
      el.result.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /* ----- Init ----- */
  $('#startQuiz').addEventListener('click', start);
  el.form.addEventListener('submit', onSubmit);
  el.prev.addEventListener('click', onPrev);
  el.form.addEventListener('change', () => { el.err.textContent = ''; });

  const saved = storage.get(KEY, null);
  if (saved && TYPES[saved.type] && saved.scores) {
    el.intro.hidden = true; el.result.hidden = false;
    showResult(saved, false);
  }
})();
