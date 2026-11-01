/* ==========================================================
   GlowGuide – journal.js
   Beauty Journal: article search, category filter, read-more
   modal and bookmarks (localStorage: glowguideBookmarks).
   ========================================================== */
(() => {
  'use strict';
  const { $, $$, esc, img, storage, openModal, attachImageFallbacks } = window.GG || {};
  if (!$) return;

  const KEY = 'glowguideBookmarks';
  const CATEGORIES = ['All', 'Skincare Basics', 'Ingredients Explained', 'Beauty Trends', 'Daily Skincare', 'Myths & Facts'];

  const FEATURED = {
    id: 'featured', title: 'The Art of Understanding Your Skin', category: 'Skincare Basics', read: 6, photo: '1570172619644-dfd03ed5d881',
    body: [
      'Skin is always communicating. Tightness after cleansing, a shiny forehead by noon, a patch that stings when you apply something new: each one is information about what your skin needs.',
      'Start by observing without changing anything. For a week, note how your skin feels in the morning, after cleansing, in the afternoon and before bed. Patterns appear quickly, and they point toward your skin type far better than any product label.',
      'Next, keep your routine simple: a gentle cleanser, a moisturiser and sunscreen. Once your skin is calm and consistent, add one new product at a time, so you always know what is helping.',
      'Finally, remember that skin changes with seasons, stress, hormones and age. Understanding your skin is not a one-time quiz. It is an ongoing, kind conversation.'
    ]
  };

  const ARTICLES = [
    { id: 'a1', title: "The Beginner's Guide to Skincare", category: 'Skincare Basics', read: 5, photo: '1556228720-195a672e8a03',
      excerpt: 'Three habits are enough to start. Here is how to begin without feeling overwhelmed.',
      body: ['If you are new to skincare, the shelves of products can feel endless. The good news is that a basic routine needs only three steps: cleanse, moisturise and protect.', 'Choose a gentle cleanser that leaves skin comfortable, a moisturiser suited to your skin type, and a broad-spectrum sunscreen of SPF 30 or higher for mornings.', 'Use these for a few weeks before adding anything else. A steady foundation makes every later product work better.'] },
    { id: 'a2', title: 'Why Is Your Skin Barrier Important?', category: 'Skincare Basics', read: 4, photo: '1596462502278-27bfdc403348',
      excerpt: 'The outer layer of your skin keeps moisture in and irritants out. Here is how to look after it.',
      body: ['Your skin barrier is the outermost layer of skin, made of cells held together by lipids such as ceramides. Think of it as bricks and mortar.', 'When it is damaged by harsh cleansers, over-exfoliation, sun or very dry air, skin can feel tight, red or reactive, and products may start to sting.', 'To support it, cleanse gently, pause strong actives while you recover, and use moisturisers with ceramides. Most barriers bounce back within a few weeks of kind care.'] },
    { id: 'a3', title: 'Niacinamide: Everything You Should Know', category: 'Ingredients Explained', read: 5, photo: '1556228578-0d85b1a4d571',
      excerpt: 'What this vitamin B3 does, who it suits and how to add it to your routine.',
      body: ['Niacinamide is a form of vitamin B3 found in many serums and moisturisers. It is popular because it is versatile and usually well tolerated.', 'It can help support the skin barrier, soften the look of pores, balance oil and even out skin tone. Most products contain 2 to 5%.', 'Start with once a day, and if your skin flushes, choose a lower strength. It pairs well with hyaluronic acid, ceramides and sunscreen.'] },
    { id: 'a4', title: 'Understanding the Importance of Sunscreen', category: 'Daily Skincare', read: 4, photo: '1598440947619-2c35fc9aa908',
      excerpt: 'The one step that protects every other step in your routine.',
      body: ['Ultraviolet light is the biggest external cause of visible skin ageing and a major risk factor for skin cancer. Sunscreen is the most effective everyday defence.', 'Choose a broad-spectrum formula, which protects against both UVA and UVB, with SPF 30 or higher. Apply about two finger-lengths to face and neck as the last step of your morning routine.', 'Reapply every two hours when outdoors. Even on cloudy days and indoors near windows, UVA still reaches the skin.'] },
    { id: 'a5', title: 'Common Skincare Mistakes to Avoid', category: 'Skincare Basics', read: 5, photo: '1612817288484-6f916006741a',
      excerpt: 'Over-exfoliating, skipping SPF and more: small habits that hold skin back.',
      body: ['The most common mistake is doing too much. Layering several actives at once or exfoliating every day can damage the barrier and cause the very problems you are trying to solve.', 'Other frequent errors include skipping sunscreen, skipping moisturiser on oily skin, using very hot water and changing products every week.', 'Simplify, be patient and introduce one new product at a time. Give each new product about a month before judging it.'] },
    { id: 'a6', title: 'How to Build a Simple Morning Routine', category: 'Daily Skincare', read: 4, photo: '1620916566398-39f1143ab7be',
      excerpt: 'Five calm steps that take under five minutes.',
      body: ['A good morning routine protects skin for the day ahead: cleanse gently, add an optional toner, apply a serum, moisturise, then finish with sunscreen.', 'If time is short, the essentials are a splash of water or gentle cleanse, moisturiser and sunscreen. Everything else is a bonus.', 'Use our routine planner to tick off each step and keep the habit going.'] },
    { id: 'a7', title: 'What Does Hyaluronic Acid Actually Do?', category: 'Ingredients Explained', read: 4, photo: '1608248543803-ba4f8c70ae0b',
      excerpt: 'It is a hydrator, not an exfoliant. Here is how it works and how to use it.',
      body: ['Despite the name, hyaluronic acid is not an exfoliating acid. It is a humectant: a molecule that attracts and holds water.', 'Applied to damp skin and sealed with a moisturiser, it plumps the surface and makes skin feel more comfortable. It suits every skin type, including oily skin.', 'It does not add oil, and it is not a replacement for a moisturiser. Think of it as the drink, with the moisturiser as the lid.'] },
    { id: 'a8', title: 'Skincare Myths You Should Stop Believing', category: 'Myths & Facts', read: 5, photo: '1522335789203-aabd1fc54bc9',
      excerpt: 'Pores do not open and close, and more common beliefs put to the test.',
      body: ['Myth: pores open and close. Fact: pores do not have muscles. Warm water softens oil, but cannot shrink or open them.', 'Myth: oily skin does not need moisturiser. Fact: oily skin can still be dehydrated, and skipping moisturiser may make it produce even more oil.', 'Myth: natural always means gentler. Fact: plant ingredients can irritate too, and many lab-made ingredients are very gentle. Judge a product by its formula, not its label.'] },
    { id: 'a9', title: 'Skin Cycling: Is It Worth the Hype?', category: 'Beauty Trends', read: 4, photo: '1515377905703-c4788e51af15',
      excerpt: 'A four-night rotation that gives skin recovery days. Here is how it works.',
      body: ['Skin cycling is a four-night rhythm: one night of exfoliation, one night of retinol, then two recovery nights of hydration and barrier care.', 'Its appeal is structure. Rest nights reduce the chance of overusing actives, which is a common cause of irritation.', 'It is not for everyone, and sensitive skin may need even more recovery. Treat it as a flexible template, not a rule.'] }
  ];

  const state = { q: '', category: 'All', savedOnly: false };
  let bookmarks = storage.get(KEY, []);
  const isSaved = (id) => bookmarks.includes(id);
  const el = { grid: $('#articleGrid'), count: $('#articleCount'), empty: $('#emptyState'), search: $('#articleSearch'), chips: $('#categoryChips'), saved: $('#bookmarkToggle') };
  const icon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4.500L6 21V3Z"/></svg>';

  function toggleBookmark(id) {
    bookmarks = isSaved(id) ? bookmarks.filter((b) => b !== id) : [...bookmarks, id];
    storage.set(KEY, bookmarks); updateSavedButton();
  }
  function updateSavedButton() {
    el.saved.textContent = `${state.savedOnly ? 'Showing saved' : 'Saved articles'} (${bookmarks.length})`;
    el.saved.setAttribute('aria-pressed', String(state.savedOnly));
  }

  function visible() {
    const q = state.q.trim().toLowerCase();
    return ARTICLES.filter((a) =>
      (state.category === 'All' || a.category === state.category) &&
      (!q || [a.title, a.excerpt, a.category, a.body.join(' ')].join(' ').toLowerCase().includes(q)) &&
      (!state.savedOnly || isSaved(a.id)));
  }

  function render(refocus) {
    const list = visible();
    el.grid.innerHTML = list.map((a) => `<article class="card article-card reveal in-view">
      <button class="bookmark-btn" type="button" data-bookmark="${a.id}" aria-pressed="${isSaved(a.id)}" aria-label="${isSaved(a.id) ? 'Remove bookmark:' : 'Bookmark:'} ${esc(a.title)}">${icon}</button>
      <div class="card__media media"><img src="${img(a.photo, 800)}" alt="${esc(a.title)}: editorial skincare photo" loading="lazy"></div>
      <div class="card__body">
        <div class="tag-row"><span class="tag">${esc(a.category)}</span></div>
        <h3>${esc(a.title)}</h3>
        <p class="article-meta">${a.read} min read</p>
        <p>${esc(a.excerpt)}</p>
        <button class="link-btn" type="button" data-read="${a.id}">Read more</button>
      </div></article>`).join('');
    el.empty.hidden = list.length > 0;
    el.count.textContent = `Showing ${list.length} of ${ARTICLES.length} articles`;
    attachImageFallbacks(el.grid);
    if (refocus) { const b = el.grid.querySelector(`[data-bookmark="${refocus}"]`); if (b) b.focus(); }
  }

  function renderChips() {
    el.chips.innerHTML = CATEGORIES.map((c) => `<button class="chip" type="button" data-cat="${esc(c)}" aria-pressed="${state.category === c}">${esc(c)}</button>`).join('');
  }

  function openArticle(article) {
    const { modal } = openModal(`
      <div class="modal__media media"><img src="${img(article.photo, 1100)}" alt="${esc(article.title)}: editorial skincare photo"></div>
      <div class="modal__body article-body">
        <div class="tag-row"><span class="tag tag--sage">${esc(article.category)}</span><span class="tag">${article.read} min read</span></div>
        <h2>${esc(article.title)}</h2>
        ${article.body.map((p) => `<p>${esc(p)}</p>`).join('')}
        <p class="quiz-disclaimer" style="margin-top:1.2rem">Educational content only, not medical advice.</p>
        <div class="modal__actions">${article.id === 'featured' ? '' : '<button class="btn btn-primary" type="button" id="modalBookmark"></button>'}<a class="btn btn-outline" href="skin-quiz.html">Take the skin quiz</a></div>
      </div>`, { label: article.title });
    const btn = $('#modalBookmark', modal);
    if (!btn) return;
    const sync = () => { btn.textContent = isSaved(article.id) ? 'Remove bookmark' : 'Bookmark this article'; };
    sync();
    btn.addEventListener('click', () => { toggleBookmark(article.id); sync(); render(); });
  }

  /* Events */
  $('#journalSearchForm').addEventListener('submit', (e) => e.preventDefault());
  el.search.addEventListener('input', () => { state.q = el.search.value; render(); });
  el.chips.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-cat]'); if (!chip) return;
    state.category = chip.dataset.cat; renderChips(); render();
    const again = el.chips.querySelector(`[data-cat="${chip.dataset.cat}"]`); if (again) again.focus();
  });
  el.saved.addEventListener('click', () => { state.savedOnly = !state.savedOnly; updateSavedButton(); render(); });
  el.grid.addEventListener('click', (e) => {
    const bm = e.target.closest('[data-bookmark]'), rd = e.target.closest('[data-read]');
    if (bm) { toggleBookmark(bm.dataset.bookmark); render(bm.dataset.bookmark); }
    else if (rd) openArticle(ARTICLES.find((a) => a.id === rd.dataset.read));
  });
  $('#readFeatured').addEventListener('click', () => openArticle(FEATURED));

  renderChips(); updateSavedButton(); render();
})();
