/* ==========================================================
Zyada kuch itna karna bhi nhi but just to give you idea   
GlowGuide – ingredients.js
   Ingredient library: live search, category & skin-type filters,
   A-Z sorting, detail modal and favourites (localStorage).
   ========================================================== */
(() => {
  'use strict';
  const { $, esc, img, storage, openModal, attachImageFallbacks, initReveal } = window.GG || {};
  if (!$) return;

  const FAV_KEY = 'glowguideFavouriteIngredients';
  const ALL = ['oily', 'dry', 'combination', 'normal'];
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  const INGREDIENTS = [
    { id: 'hyaluronic-acid', name: 'Hyaluronic Acid', category: 'Hydrating', skins: ALL, photo: '1608248543803-ba4f8c70ae0b',
      desc: 'A humectant that attracts and holds water in the skin, leaving it plumper and more comfortable.',
      benefits: ['Instant hydration', 'Plumps fine lines', 'Gentle and lightweight'],
      use: 'Apply to damp skin after cleansing, then seal in with a moisturiser. Works morning and night.',
      pairs: 'Pairs well with niacinamide, ceramides and vitamin C.', care: 'On very dry air, always follow with a moisturiser so water is not drawn out of the skin.' },
    { id: 'niacinamide', name: 'Niacinamide', category: 'Barrier Support', skins: ALL, photo: '1556228578-0d85b1a4d571',
      desc: 'Vitamin B3, a versatile ingredient that supports the skin barrier and helps balance oil and tone.',
      benefits: ['Refines the look of pores', 'Evens tone', 'Balances oil', 'Calms redness'],
      use: 'Look for 2 to 5% in a serum or moisturiser. Suitable morning and night.',
      pairs: 'Pairs well with hyaluronic acid, ceramides and azelaic acid.', care: 'Higher strengths can cause flushing in some people. Start low.' },
    { id: 'salicylic-acid', name: 'Salicylic Acid', category: 'Exfoliating', skins: ['oily', 'combination'], photo: '1571781926291-c477ebfd024b',
      desc: 'A beta hydroxy acid (BHA) that is oil-soluble, so it can reach inside pores and clear congestion.',
      benefits: ['Unclogs pores', 'Reduces blackheads', 'Helps with blemishes'],
      use: 'Start with a 0.5 to 2% leave-on product two or three evenings a week.',
      pairs: 'Pairs well with niacinamide and hyaluronic acid.', care: 'Can dry skin. Avoid layering with other strong exfoliants, and ask a doctor first if you are pregnant.' },
    { id: 'vitamin-c', name: 'Vitamin C', category: 'Antioxidant', skins: ALL, photo: '1620916566398-39f1143ab7be',
      desc: 'A potent antioxidant that helps neutralise free radicals, brighten dullness and support collagen.',
      benefits: ['Brightens skin', 'Fades dark marks over time', 'Boosts sun protection (with SPF)'],
      use: 'Use in the morning under sunscreen. Store away from light and heat.',
      pairs: 'Pairs well with sunscreen, vitamin E and hyaluronic acid.', care: 'Pure forms can tingle or sting. Begin with a lower strength.' },
    { id: 'retinol', name: 'Retinol', category: 'Anti-ageing', skins: ['normal', 'oily', 'combination'], photo: '1612817288484-6f916006741a',
      desc: 'A vitamin A derivative that speeds up cell turnover and is among the best-studied anti-ageing ingredients.',
      benefits: ['Smooths fine lines', 'Refines texture', 'Helps with congestion'],
      use: 'Use at night only. Start with two nights a week, a pea-sized amount, and build slowly.',
      pairs: 'Pairs well with ceramides, hyaluronic acid and a good moisturiser.', care: 'Increases sun sensitivity, so wear SPF daily. Not recommended during pregnancy.' },
    { id: 'glycolic-acid', name: 'Glycolic Acid', category: 'Exfoliating', skins: ['normal', 'oily', 'combination'], photo: '1601049541289-9b1b7bbbfe19',
      desc: 'The smallest alpha hydroxy acid (AHA). It loosens dead surface cells to reveal smoother, brighter skin.',
      benefits: ['Smooths texture', 'Brightens dullness', 'Fades uneven tone'],
      use: 'Use a low strength once or twice a week in the evening, and increase slowly.',
      pairs: 'Pairs well with hydrating ingredients such as hyaluronic acid.', care: 'Increases sun sensitivity. Do not combine with retinol on the same night when you are starting out.' },
    { id: 'lactic-acid', name: 'Lactic Acid', category: 'Exfoliating', skins: ['dry', 'normal', 'combination'], photo: '1596462502278-27bfdc403348',
      desc: 'A gentler AHA with larger molecules that exfoliates while also helping skin hold on to moisture.',
      benefits: ['Gentle exfoliation', 'Adds hydration', 'Improves softness'],
      use: 'Use once or twice a week in the evening. A good first step into acids.',
      pairs: 'Pairs well with ceramides and squalane.', care: 'Still raises sun sensitivity. Always use sunscreen the next day.' },
    { id: 'ceramides', name: 'Ceramides', category: 'Barrier Support', skins: ['dry', 'normal', 'combination'], photo: '1570172619644-dfd03ed5d881',
      desc: 'Lipids that occur naturally in the skin and act like mortar between skin cells, locking in moisture.',
      benefits: ['Repairs the barrier', 'Locks in moisture', 'Calms sensitive skin'],
      use: 'Look for ceramides in moisturisers and use them morning and night.',
      pairs: 'Pairs well with almost everything, especially retinol and acids.', care: 'Very well tolerated. Rich textures may feel heavy on very oily skin.' },
    { id: 'azelaic-acid', name: 'Azelaic Acid', category: 'Soothing', skins: ['oily', 'combination', 'normal'], photo: '1522335789203-aabd1fc54bc9',
      desc: 'A gentle multi-tasker that helps calm redness, clear blemishes and fade marks left behind by breakouts.',
      benefits: ['Calms redness', 'Helps with blemishes', 'Evens tone'],
      use: 'Typically used at 10 to 20% once or twice a day. Introduce slowly.',
      pairs: 'Pairs well with niacinamide and hyaluronic acid.', care: 'May tingle at first. Check with a doctor if you are pregnant or nursing.' },
    { id: 'squalane', name: 'Squalane', category: 'Hydrating', skins: ALL, photo: '1556228720-195a672e8a03',
      desc: 'A lightweight, skin-like oil that softens and seals in moisture without a greasy finish.',
      benefits: ['Softens skin', 'Seals in moisture', 'Non-greasy feel'],
      use: 'Use a few drops on its own or as the last step of your night routine.',
      pairs: 'Pairs well with hyaluronic acid, retinol and peptides.', care: 'Generally well tolerated. Patch-test if you are prone to breakouts.' },
    { id: 'peptides', name: 'Peptides', category: 'Anti-ageing', skins: ['dry', 'normal', 'combination'], photo: '1515377905703-c4788e51af15',
      desc: 'Short chains of amino acids that signal skin to look and feel firmer, with very little irritation.',
      benefits: ['Supports firmness', 'Softens fine lines', 'Very gentle'],
      use: 'Use in a serum or cream morning and night. Results build slowly over weeks.',
      pairs: 'Pairs well with hyaluronic acid and niacinamide.', care: 'Some formulas do not mix well with strong acids. Use them at different times of day.' },
    { id: 'aloe-vera', name: 'Aloe Vera', category: 'Soothing', skins: ALL, photo: '1598440947619-2c35fc9aa908',
      desc: 'A cooling, water-rich plant gel that soothes and lightly hydrates tired or sun-exposed skin.',
      benefits: ['Soothes skin', 'Light hydration', 'Cooling feel'],
      use: 'Apply a thin layer of gel as a soothing mask or under moisturiser.',
      pairs: 'Pairs well with hyaluronic acid and ceramides.', care: 'Patch-test first. Look for fragrance-free gels with few additives.' }
  ];

  const state = { q: '', category: 'all', skin: 'all', sort: 'az', favOnly: false };
  let favourites = storage.get(FAV_KEY, []);
  const el = {
    grid: $('#ingredientGrid'), count: $('#resultCount'), empty: $('#emptyState'), search: $('#ingredientSearch'),
    cat: $('#categoryFilter'), skin: $('#skinFilter'), sort: $('#sortSelect'), fav: $('#favToggle'), clear: $('#clearFilters')
  };

  const isFav = (id) => favourites.includes(id);
  const heart = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.500s-7.500-4.600-9-9.500C2 7.500 4.300 5 7.200 5c1.900 0 3.500 1 4.800 2.800C13.300 6 14.900 5 16.800 5 19.700 5 22 7.500 21 11c-1.500 4.900-9 9.500-9 9.500Z"/></svg>';

  function toggleFavourite(id) {
    favourites = isFav(id) ? favourites.filter((f) => f !== id) : [...favourites, id];
    storage.set(FAV_KEY, favourites);
    updateFavButton();
  }
  function updateFavButton() {
    el.fav.textContent = `${state.favOnly ? 'Showing' : 'Show'} favourites (${favourites.length})`;
    el.fav.setAttribute('aria-pressed', String(state.favOnly));
  }

  /* ----- Filtering + sorting ----- */
  function getVisible() {
    const q = state.q.trim().toLowerCase();
    return INGREDIENTS.filter((i) => {
      const hay = [i.name, i.category, i.desc, i.benefits.join(' ')].join(' ').toLowerCase();
      return (!q || hay.includes(q))
        && (state.category === 'all' || i.category === state.category)
        && (state.skin === 'all' || i.skins.includes(state.skin))
        && (!state.favOnly || isFav(i.id));
    }).sort((a, b) => (state.sort === 'az' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));
  }

  function cardHTML(i) {
    const fav = isFav(i.id);
    return `<article class="card ingredient-card reveal in-view" data-id="${i.id}">
      <button class="fav-btn" type="button" data-fav="${i.id}" aria-pressed="${fav}" aria-label="${fav ? 'Remove' : 'Add'} ${esc(i.name)} ${fav ? 'from' : 'to'} favourites">${heart}</button>
      <div class="card__media media"><img src="${img(i.photo, 700)}" alt="${esc(i.name)}: skincare product photography" loading="lazy"></div>
      <div class="card__body">
        <div class="tag-row"><span class="tag tag--sage">${esc(i.category)}</span></div>
        <h3>${esc(i.name)}</h3>
        <p>${esc(i.desc)}</p>
        <div class="benefit-list">${i.benefits.slice(0, 3).map((b) => `<span class="tag">${esc(b)}</span>`).join('')}</div>
        <p class="meta-line"><strong>Suits:</strong> ${i.skins.length === 4 ? 'All skin types' : i.skins.map(cap).join(', ')}</p>
        <button class="link-btn" type="button" data-open="${i.id}">Read details</button>
      </div></article>`;
  }

  function render(refocusFav) {
    const list = getVisible();
    el.grid.innerHTML = list.map(cardHTML).join('');
    el.empty.hidden = list.length > 0;
    el.count.textContent = `Showing ${list.length} of ${INGREDIENTS.length} ingredients`;
    attachImageFallbacks(el.grid);
    if (refocusFav) { const b = el.grid.querySelector(`[data-fav="${refocusFav}"]`); if (b) b.focus(); }
  }

  /* ----- Detail modal ----- */
  function openDetail(id) {
    const i = INGREDIENTS.find((x) => x.id === id);
    if (!i) return;
    const { modal } = openModal(`
      <div class="modal__media media"><img src="${img(i.photo, 1100)}" alt="${esc(i.name)}: skincare product photography"></div>
      <div class="modal__body">
        <div class="tag-row"><span class="tag tag--sage">${esc(i.category)}</span>${i.skins.length === 4 ? '<span class="tag">All skin types</span>' : i.skins.map((s) => `<span class="tag">${cap(s)}</span>`).join('')}</div>
        <h2>${esc(i.name)}</h2>
        <p>${esc(i.desc)}</p>
        <h4>Main benefits</h4><ul class="check">${i.benefits.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
        <h4>How to use it</h4><p>${esc(i.use)}</p>
        <h4>Works well with</h4><p>${esc(i.pairs)}</p>
        <h4>Good to know</h4><p>${esc(i.care)}</p>
        <div class="modal__actions"><button class="btn btn-primary" type="button" id="modalFav"></button><a class="btn btn-outline" href="skin-quiz.html">Find my skin type</a></div>
      </div>`, { label: i.name + ' details' });
    const btn = $('#modalFav', modal);
    const sync = () => { btn.textContent = isFav(i.id) ? 'Remove from favourites' : 'Save to favourites'; };
    sync();
    btn.addEventListener('click', () => { toggleFavourite(i.id); sync(); render(); });
  }

  /* ----- Events ----- */
  $('#ingredientFilters').addEventListener('submit', (e) => e.preventDefault());
  el.search.addEventListener('input', () => { state.q = el.search.value; render(); });
  el.cat.addEventListener('change', () => { state.category = el.cat.value; render(); });
  el.skin.addEventListener('change', () => { state.skin = el.skin.value; render(); });
  el.sort.addEventListener('change', () => { state.sort = el.sort.value; render(); });
  el.fav.addEventListener('click', () => { state.favOnly = !state.favOnly; updateFavButton(); render(); });
  el.clear.addEventListener('click', () => {
    Object.assign(state, { q: '', category: 'all', skin: 'all', sort: 'az', favOnly: false });
    el.search.value = ''; el.cat.value = 'all'; el.skin.value = 'all'; el.sort.value = 'az';
    updateFavButton(); render();
  });
  el.grid.addEventListener('click', (e) => {
    const favBtn = e.target.closest('[data-fav]');
    const openBtn = e.target.closest('[data-open]');
    if (favBtn) { toggleFavourite(favBtn.dataset.fav); render(favBtn.dataset.fav); }
    else if (openBtn) openDetail(openBtn.dataset.open);
  });

  /* ----- Init ----- */
  [...new Set(INGREDIENTS.map((i) => i.category))].sort().forEach((c) => {
    const o = document.createElement('option'); o.value = c; o.textContent = c; el.cat.appendChild(o);
  });
  const preset = new URLSearchParams(location.search).get('q');
  if (preset) { state.q = preset; el.search.value = preset; }
  updateFavButton();
  render();
  initReveal();
})();
