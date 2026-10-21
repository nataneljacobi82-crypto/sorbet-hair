/* Sorbet Hair Studio — script.js
   Vanilla JS, no dependencies. Every effect degrades to a static layout. */
(function () {
  'use strict';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* Header shadow on scroll ---------------------------------------- */
  var header = document.querySelector('.site-header');
  if (header) {
    var onHdr = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    onHdr(); window.addEventListener('scroll', onHdr, { passive: true });
  }

  /* Nav ------------------------------------------------------------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');
  function setNav(open) {
    if (!toggle || !nav) return;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.querySelector('.visually-hidden').textContent = open ? 'Close menu' : 'Open menu';
    nav.classList.toggle('is-open', open);
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () { setNav(toggle.getAttribute('aria-expanded') !== 'true'); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setNav(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setNav(false); toggle.focus(); } });
  }

  /* Reveal ----------------------------------------------------------- */
  var revealEls = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  } else {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { rio.observe(el); });
  }

  /* Before / after slider ---------------------------------------------- */
  (function slider() {
    var el = document.getElementById('slider'), range = document.getElementById('sliderRange');
    if (!el || !range) return;
    function set(pct) { pct = clamp(pct, 0, 100); el.style.setProperty('--x', pct + '%'); range.value = Math.round(pct); }
    range.addEventListener('input', function () { set(+range.value); });
    var dragging = false;
    function fromEvent(e) { var r = el.getBoundingClientRect(); return (e.clientX - r.left) / r.width * 100; }
    el.addEventListener('pointerdown', function (e) { dragging = true; el.setPointerCapture(e.pointerId); set(fromEvent(e)); });
    el.addEventListener('pointermove', function (e) { if (dragging) set(fromEvent(e)); });
    el.addEventListener('pointerup', function () { dragging = false; });
    el.addEventListener('pointercancel', function () { dragging = false; });
    set(50);
  })();

  /* Deck: swipeable card stack ----------------------------------------- */
  (function deck() {
    var root = document.getElementById('deck');
    if (!root) return;
    var cards = Array.prototype.slice.call(root.querySelectorAll('.card'));
    var order = cards.map(function (_, i) { return i; });
    var now = document.getElementById('deckNow');
    var busy = false, lastUser = 0, visible = true;

    function render() {
      order.forEach(function (idx, pos) { cards[idx].setAttribute('data-pos', String(pos)); });
      if (now) now.textContent = String(order[0] + 1);
    }
    function top() { return cards[order[0]]; }
    function flyOut(dir) {
      if (busy) return; busy = true;
      var c = top();
      c.classList.add('is-out');
      c.style.transform = 'translate(' + (dir * 130) + '%, -6%) rotate(' + (dir * 18) + 'deg)';
      setTimeout(function () {
        c.classList.remove('is-out'); c.classList.remove('is-dragging'); c.style.transform = '';
        order.push(order.shift()); render(); busy = false;
      }, 420);
    }
    function next(user) { if (user) lastUser = Date.now(); flyOut(1); }
    function prev(user) { if (busy) return; if (user) lastUser = Date.now(); order.unshift(order.pop()); render(); }

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
      if (Math.abs(dx) > 70) flyOut(dx > 0 ? 1 : -1);
      else { c.classList.remove('is-dragging'); c.style.transform = ''; }
    }
    root.addEventListener('pointerup', endDrag);
    root.addEventListener('pointercancel', endDrag);
    root.querySelectorAll('[data-deck]').forEach(function (b) {
      b.addEventListener('click', function () { b.getAttribute('data-deck') === 'next' ? next(true) : prev(true); });
    });
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); next(true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(true); }
    });
    if (!reduceMotion) {
      if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { threshold: 0.4 }).observe(root);
      setInterval(function () {
        if (!visible || document.hidden || dragging || busy) return;
        if (Date.now() - lastUser < 6000) return;
        next(false);
      }, 4000);
    }
    render();
  })();

  /* Work strip arrows ---------------------------------------------------- */
  var strip = document.getElementById('strip');
  if (strip) {
    document.querySelectorAll('[data-strip]').forEach(function (b) {
      b.addEventListener('click', function () {
        var fig = strip.querySelector('figure');
        var step = fig ? fig.getBoundingClientRect().width + 16 : 300;
        strip.scrollBy({ left: step * 2 * (+b.getAttribute('data-strip')), behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    });
    strip.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); strip.scrollBy({ left: 320, behavior: 'smooth' }); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); strip.scrollBy({ left: -320, behavior: 'smooth' }); }
    });
  }

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
