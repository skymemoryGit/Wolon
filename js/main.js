/* =========================================================
   WOLON — comportamenti di pagina
   1. header sticky
   2. menu mobile
   3. il tavolo rotante (drag, frecce, tastiera)
   4. reveal allo scroll
   ========================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- 1. header: bordo solo quando la pagina è scrollata ---------- */
  (function stickyHeader() {
    var header = document.getElementById('header');
    if (!header) return;

    var sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;height:1px;width:1px;';
    document.body.prepend(sentinel);

    new IntersectionObserver(function (entries) {
      header.classList.toggle('is-stuck', !entries[0].isIntersecting);
    }).observe(sentinel);
  })();

  /* ---------- 2. menu mobile ---------- */
  (function mobileNav() {
    var toggle = document.querySelector('.nav-toggle');
    var panel = document.getElementById('mobile-nav');
    if (!toggle || !panel) return;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      panel.hidden = !open;
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    // un link scelto chiude il pannello
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    // Escape chiude e riporta il focus al pulsante
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    // tornando a desktop il pannello non deve restare aperto
    window.matchMedia('(min-width: 64em)').addEventListener('change', function (m) {
      if (m.matches) setOpen(false);
    });
  })();

  /* ---------- 3. il tavolo rotante ---------- */
  (function turntable() {
    var root = document.getElementById('turntable');
    var disc = document.getElementById('disc');
    if (!root || !disc) return;

    var stage = root.querySelector('.turntable__stage');
    var nameEl = document.getElementById('dish-name');
    var noteEl = document.getElementById('dish-note');
    var dishes = Array.prototype.slice.call(disc.querySelectorAll('.dish'));
    var count = dishes.length;
    if (!count) return;

    var STEP = 360 / count;

    // stesso ordine dei --i nel markup
    var carta = [
      ['Insalata di cetrioli', 'Cetriolo, aglio, arachide, salsa agropiccante'],
      ['Wonton in salsa piccante', 'Olio di chili, sesamo, cipollotto'],
      ['Riso alla cantonese', 'Gamberi, uovo, cipollotto, saltato nel wok'],
      ['Pad thai con gamberi', 'Noodle di riso, arachidi, lime']
    ];

    // il passo angolare lo detta il numero di piatti presenti nel markup,
    // così CSS e JS non possono divergere se se ne aggiunge o toglie uno
    disc.style.setProperty('--step', STEP + 'deg');

    var index = 0;
    var angle = 0;          // rotazione corrente del piano, in gradi

    function render() {
      disc.style.setProperty('--rot', angle + 'deg');
      dishes.forEach(function (d, i) {
        d.classList.toggle('is-active', i === index);
      });
      var dish = carta[index];
      if (dish && nameEl && noteEl) {
        nameEl.textContent = dish[0];
        noteEl.textContent = dish[1];
      }
    }

    // porta in cima il piatto `i`, scegliendo il verso più corto
    function goTo(i) {
      var target = ((i % count) + count) % count;
      var delta = target - index;
      if (delta > count / 2) delta -= count;
      if (delta < -count / 2) delta += count;
      index = target;
      angle -= delta * STEP;
      render();
    }

    function step(dir) { goTo(index + dir); }

    // frecce di controllo: l'alternativa al trascinamento
    root.querySelectorAll('[data-rotate]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        step(parseInt(btn.dataset.rotate, 10));
      });
    });

    // tastiera sul piano
    stage.tabIndex = 0;
    stage.setAttribute('role', 'group');
    stage.setAttribute('aria-label', 'Tavolo rotante con i piatti. Usa le frecce per girarlo.');
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { step(1); e.preventDefault(); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { step(-1); e.preventDefault(); }
    });

    /* --- trascinamento: l'angolo segue il dito/puntatore in tempo reale --- */
    var dragging = false, startAngleAtPointer = 0, angleAtStart = 0, moved = 0;

    function pointerAngle(e) {
      var r = stage.getBoundingClientRect();
      var dx = e.clientX - (r.left + r.width / 2);
      var dy = e.clientY - (r.top + r.height / 2);
      return Math.atan2(dy, dx) * 180 / Math.PI;
    }

    stage.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      dragging = true;
      moved = 0;
      startAngleAtPointer = pointerAngle(e);
      angleAtStart = angle;
      stage.classList.add('is-dragging');
      stage.setPointerCapture(e.pointerId);
    });

    stage.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var d = pointerAngle(e) - startAngleAtPointer;
      if (d > 180) d -= 360;
      if (d < -180) d += 360;
      moved = Math.abs(d);
      angle = angleAtStart + d;
      disc.style.setProperty('--rot', angle + 'deg');
    });

    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      stage.classList.remove('is-dragging');
      if (e && e.pointerId != null && stage.hasPointerCapture(e.pointerId)) {
        stage.releasePointerCapture(e.pointerId);
      }
      // scatta sul piatto più vicino alla posizione in cui è stato lasciato
      var snapped = Math.round(-angle / STEP);
      index = ((snapped % count) + count) % count;
      angle = -snapped * STEP;
      render();
    }

    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);

    render();
  })();

  /* ---------- 4. reveal allo scroll ---------- */
  (function reveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var fired = false;

    // Failsafe: se l'observer non scatta mai (pagina non composta, browser
    // atipico, estensioni), il contenuto non deve restare invisibile.
    setTimeout(function () {
      if (fired) return;
      items.forEach(function (el) {
        el.style.transitionDelay = '0ms';
        el.classList.add('is-in');
      });
    }, 1800);

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        fired = true;
        // sfalsamento leggero tra elementi vicini
        var siblings = Array.prototype.slice.call(
          entry.target.parentElement.querySelectorAll(':scope > .reveal')
        );
        var i = Math.max(0, siblings.indexOf(entry.target));
        entry.target.style.transitionDelay = Math.min(i * 60, 240) + 'ms';
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });

    items.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- 5. anno nel footer ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
