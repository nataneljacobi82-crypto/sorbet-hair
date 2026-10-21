/* Sorbet Hair Studio — script.js
   Vanilla JS, no dependencies. Every effect degrades to a static layout. */
(function () {
  'use strict';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var raf = function (fn) { var t = false; return function () { if (!t) { t = true; requestAnimationFrame(function () { t = false; fn(); }); } }; };

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* Nav ------------------------------------------------------------- */
  var toggle = document.querySelector('.nav-toggle');
  var links = document.getElementById('navlinks');
  function setNav(open) {
    if (!toggle || !links) return;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.querySelector('.visually-hidden').textContent = open ? 'Close menu' : 'Open menu';
    links.classList.toggle('is-open', open);
  }
  if (toggle && links) {
    toggle.addEventListener('click', function () { setNav(toggle.getAttribute('aria-expanded') !== 'true'); });
    links.addEventListener('click', function (e) { if (e.target.closest('a')) setNav(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && links.classList.contains('is-open')) { setNav(false); toggle.focus(); } });
    document.addEventListener('click', function (e) { if (links.classList.contains('is-open') && !e.target.closest('.pillnav')) setNav(false); });
  }

  /* Reveal ----------------------------------------------------------- */
  var revealEls = document.querySelectorAll('.reveal, .reveal-tilt');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  } else {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { rio.observe(el); });
  }

  /* Hero ribbon: text that travels along the band --------------------- */
  (function ribbon() {
    var tp = document.getElementById('ribbonTP');
    var path = document.getElementById('ribbonPath');
    if (!tp || !path) return;
    var phrase = 'Lived-in color  ·  Precision cuts  ·  Curl specialists  ·  Extensions  ·  Blowouts  ·  ';
    var one = 0, pathLen = path.getTotalLength();
    function layout() {
      tp.textContent = phrase;
      one = tp.getComputedTextLength() || 1100;
      var reps = Math.ceil((pathLen + one) / one) + 1;
      tp.textContent = phrase.repeat(reps);
      tp.setAttribute('startOffset', one);
    }
    layout();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    if (reduceMotion) return;
    var offset = one, last = null, running = true;
    var hero = document.querySelector('.hero');
    if ('IntersectionObserver' in window && hero) {
      new IntersectionObserver(function (en) { running = en[0].isIntersecting; if (running) { last = null; requestAnimationFrame(tick); } }).observe(hero);
    }
    function tick(ts) {
      if (!running) return;
      if (last === null) last = ts;
      var dt = Math.min(50, ts - last); last = ts;
      offset -= dt * 0.045;                     // ~45 units/s
      if (offset <= 0) offset += one;
      tp.setAttribute('startOffset', offset);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();

  /* Deck: swipeable card stack ----------------------------------------- */
  (function deck() {
    var root = document.getElementById('deck');
    if (!root) return;
    var cards = Array.prototype.slice.call(root.querySelectorAll('.card'));
    var order = cards.map(function (_, i) { return i; });
    var now = document.getElementById('deckNow');
    var hint = root.querySelector('.deck__hint');
    var busy = false, lastUser = 0, timer = null, visible = true;

    function render() {
      order.forEach(function (idx, pos) { cards[idx].setAttribute('data-pos', String(pos)); });
      if (now) now.textContent = String(order[0] + 1);
    }
    function top() { return cards[order[0]]; }
    function flyOut(dir, cb) {
      if (busy) return; busy = true;
      var c = top();
      c.classList.add('is-out');
      c.style.transform = 'translate(' + (dir * 130) + '%, -8%) rotate(' + (dir * 22) + 'deg)';
      setTimeout(function () {
        c.classList.remove('is-out'); c.classList.remove('is-dragging');
        c.style.transform = '';
        order.push(order.shift());
        render(); busy = false; if (cb) cb();
      }, 420);
    }
    function next(user) { if (user) lastUser = Date.now(); flyOut(1); }
    function prev(user) {
      if (busy) return; if (user) lastUser = Date.now();
      order.unshift(order.pop()); render();
    }

    // Drag on the top card
    var sx = 0, sy = 0, dx = 0, dragging = false, dragCard = null;
    root.addEventListener('pointerdown', function (e) {
      var c = e.target.closest('.card'); if (!c || c !== top() || busy) return;
      dragging = true; dragCard = c; sx = e.clientX; sy = e.clientY; dx = 0;
      c.classList.add('is-dragging'); c.setPointerCapture(e.pointerId); lastUser = Date.now();
    });
    root.addEventListener('pointermove', function (e) {
      if (!dragging || !dragCard) return;
      dx = e.clientX - sx; var dy = e.clientY - sy;
      dragCard.style.transform = 'translate(' + dx + 'px, ' + (dy * 0.25) + 'px) rotate(' + (dx * 0.06) + 'deg)';
    });
    function endDrag() {
      if (!dragging || !dragCard) return;
      dragging = false; var c = dragCard; dragCard = null;
      if (Math.abs(dx) > 70) { flyOut(dx > 0 ? 1 : -1); }
      else { c.classList.remove('is-dragging'); c.style.transform = ''; }
    }
    root.addEventListener('pointerup', endDrag);
    root.addEventListener('pointercancel', endDrag);

    // Buttons + keys
    root.querySelectorAll('[data-deck]').forEach(function (b) {
      b.addEventListener('click', function () { b.getAttribute('data-deck') === 'next' ? next(true) : prev(true); });
    });
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); next(true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(true); }
    });

    // Cursor-following hint on desktop
    if (finePointer && hint) {
      root.addEventListener('pointerenter', function () { hint.classList.add('is-cursor'); hint.style.opacity = '1'; });
      root.addEventListener('pointerleave', function () { hint.style.opacity = '0'; });
      root.addEventListener('pointermove', function (e) { hint.style.left = e.clientX + 'px'; hint.style.top = e.clientY + 'px'; });
      hint.style.opacity = '0';
    }

    // Autoplay when visible and the user is idle
    if (!reduceMotion) {
      if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { threshold: 0.4 }).observe(root);
      timer = setInterval(function () {
        if (!visible || document.hidden || dragging || busy) return;
        if (Date.now() - lastUser < 6000) return;
        next(false);
      }, 3800);
    }
    render();
  })();

  /* Pinned pain section ----------------------------------------------- */
  var pain = document.querySelector('.pain');
  var pcards = pain ? pain.querySelectorAll('.pcard') : [];
  function painUpdate() {
    if (!pain || reduceMotion) return;
    var vh = window.innerHeight;
    var r = pain.getBoundingClientRect();
    var total = pain.offsetHeight - vh;
    if (r.bottom < 0 || r.top > vh) return;
    var p = clamp(-r.top / Math.max(1, total), 0, 1);
    pain.classList.toggle('is-dark', p > 0.16 && p < 0.84);
    pcards.forEach(function (c) {
      var s = parseFloat(c.style.getPropertyValue('--s')) || 0;
      var span = parseFloat(c.style.getPropertyValue('--span')) || 0.5;
      var local = clamp((p - s) / span, 0, 1);
      var ty = 60 - local * 135;                              // +60vh -> -75vh
      var op = local <= 0 || local >= 1 ? 0 : Math.min(1, Math.min(local, 1 - local) * 6);
      c.style.setProperty('--ty', ty + 'vh');
      c.style.setProperty('--op', op.toFixed(2));
    });
  }

  /* Fill-in text ------------------------------------------------------ */
  var fill = document.querySelector('[data-fill]');
  var fillWords = [];
  if (fill) {
    var words = fill.textContent.trim().split(/\s+/);
    fill.textContent = '';
    words.forEach(function (w, i) {
      var s = document.createElement('span'); s.className = 'w'; s.textContent = w; fill.appendChild(s);
      if (i < words.length - 1) fill.appendChild(document.createTextNode(' '));
      fillWords.push(s);
    });
  }
  function fillUpdate() {
    if (!fill || reduceMotion) return;
    var vh = window.innerHeight, r = fill.getBoundingClientRect();
    var p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.4), 0, 1);
    var n = Math.round(p * fillWords.length);
    fillWords.forEach(function (w, i) { w.classList.toggle('on', i < n); });
  }

  /* Drawn lines (feature thread, team line) --------------------------- */
  function drawer(pathId, sectionSel, startAt, endAt) {
    var path = document.getElementById(pathId), sec = document.querySelector(sectionSel);
    if (!path || !sec) return function () {};
    var len = path.getTotalLength();
    path.style.strokeDasharray = len; path.style.strokeDashoffset = len;
    if (reduceMotion) { path.style.strokeDashoffset = 0; return function () {}; }
    return function () {
      var vh = window.innerHeight, r = sec.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var p = clamp((vh * startAt - r.top) / (r.height - vh * (startAt - endAt)), 0, 1);
      path.style.strokeDashoffset = len * (1 - p);
    };
  }
  var threadUpdate = drawer('threadPath', '.feat', 0.85, 0.5);
  var teamUpdate = drawer('teamPath', '.team', 0.9, 0.5);

  /* Floating photos: pointer parallax ---------------------------------- */
  var stage = document.querySelector('.float__stage');
  if (stage && finePointer && !reduceMotion) {
    var fphs = stage.querySelectorAll('.fph');
    stage.addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      fphs.forEach(function (f, i) { var depth = (i % 3 + 1) * 8; f.style.translate = (px * -depth) + 'px ' + (py * -depth) + 'px'; });
    });
    stage.addEventListener('pointerleave', function () { fphs.forEach(function (f) { f.style.translate = ''; }); });
  }

  /* One scroll loop ---------------------------------------------------- */
  var onScroll = raf(function () { painUpdate(); fillUpdate(); threadUpdate(); teamUpdate(); });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* Prefill the booking form ------------------------------------------- */
  var svcSel = document.getElementById('f-service');
  var stySel = document.getElementById('f-stylist');
  function pick(sel, value) {
    if (!sel) return;
    for (var i = 0; i < sel.options.length; i++) { if (sel.options[i].text === value) { sel.selectedIndex = i; return; } }
  }
  document.querySelectorAll('[data-service]').forEach(function (a) { a.addEventListener('click', function () { pick(svcSel, a.getAttribute('data-service')); }); });
  document.querySelectorAll('[data-stylist]').forEach(function (b) {
    b.addEventListener('click', function () {
      pick(stySel, b.getAttribute('data-stylist'));
      var book = document.getElementById('book');
      if (book) book.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  /* Forms: Netlify via fetch, inline success ----------------------------- */
  function wire(formId, onDone) {
    var form = document.getElementById(formId); if (!form) return;
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var btn = form.querySelector('button[type="submit"]'); if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      var body = new URLSearchParams(new FormData(form)).toString();
      var done = function () { onDone(form); };
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body }).then(done, done);
    });
  }
  wire('booking-form', function (form) {
    var ok = document.getElementById('form-success'); var detail = document.getElementById('success-detail');
    var svc = svcSel && svcSel.value ? svcSel.value.toLowerCase() : 'your appointment';
    var sty = stySel ? stySel.value : '';
    if (detail) detail.textContent = 'We have your request for ' + svc + (sty && sty.indexOf('Whoever') === -1 ? ' with ' + sty : '') + '. Expect two or three times by text within the hour during opening times.';
    form.hidden = true; if (ok) { ok.hidden = false; ok.focus({ preventScroll: reduceMotion }); }
  });
  wire('newsletter-form', function (form) {
    var ok = document.getElementById('nl-ok'); var row = form.querySelector('.newsletter__row');
    if (row) row.hidden = true; if (ok) ok.hidden = false;
  });
})();
