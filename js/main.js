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
    var dragging = false, rotating = false, decided = false;
    var startX = 0, startY = 0, startAngleAtPointer = 0, angleAtStart = 0;
    var INTENT_PX = 8;   // quanto serve muoversi prima di capire cosa vuole l'utente

    function pointerAngle(e) {
      var r = stage.getBoundingClientRect();
      var dx = e.clientX - (r.left + r.width / 2);
      var dy = e.clientY - (r.top + r.height / 2);
      return Math.atan2(dy, dx) * 180 / Math.PI;
    }

    // Lo stage è un quadrato con gli angoli arrotondati solo dal border-radius:
    // gli angoli ricevono comunque gli eventi. Il tavolo gira solo se il dito è
    // dentro il cerchio; fuori il tocco resta alla pagina, che scorre.
    function insideTable(e) {
      var r = stage.getBoundingClientRect();
      var dx = e.clientX - (r.left + r.width / 2);
      var dy = e.clientY - (r.top + r.height / 2);
      return Math.hypot(dx, dy) <= r.width / 2;
    }

    stage.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      if (!insideTable(e)) return;
      dragging = true;
      rotating = false;
      // col mouse non c'è scroll da proteggere: si gira e basta
      decided = e.pointerType === 'mouse';
      if (decided) {
        rotating = true;
        stage.classList.add('is-dragging');
        stage.setPointerCapture(e.pointerId);
      }
      startX = e.clientX;
      startY = e.clientY;
      startAngleAtPointer = pointerAngle(e);
      angleAtStart = angle;
    });

    stage.addEventListener('pointermove', function (e) {
      if (!dragging) {
        // la manina appare solo dove il tavolo risponde davvero
        if (e.pointerType === 'mouse') {
          stage.style.cursor = insideTable(e) ? 'grab' : 'default';
        }
        return;
      }

      // Al primo movimento significativo si decide: se il dito va più in
      // verticale che in orizzontale la pagina deve scorrere, e il tavolo
      // non si muove affatto.
      if (!decided) {
        var dx = e.clientX - startX;
        var dy = e.clientY - startY;
        if (Math.abs(dx) < INTENT_PX && Math.abs(dy) < INTENT_PX) return;
        decided = true;
        if (Math.abs(dy) >= Math.abs(dx)) {
          dragging = false;          // scorrimento: lascia fare al browser
          return;
        }
        rotating = true;
        stage.classList.add('is-dragging');
        stage.setPointerCapture(e.pointerId);
        // riparte da qui, così il tavolo non salta degli 8px di soglia
        startAngleAtPointer = pointerAngle(e);
        angleAtStart = angle;
      }
      if (!rotating) return;

      var d = pointerAngle(e) - startAngleAtPointer;
      if (d > 180) d -= 360;
      if (d < -180) d += 360;
      angle = angleAtStart + d;
      disc.style.setProperty('--rot', angle + 'deg');
    });

    function endDrag(e) {
      var wasRotating = rotating;
      dragging = false;
      rotating = false;
      decided = false;
      stage.classList.remove('is-dragging');
      if (e && e.pointerId != null && stage.hasPointerCapture(e.pointerId)) {
        stage.releasePointerCapture(e.pointerId);
      }
      if (!wasRotating) return;   // era uno scorrimento: niente da assestare
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

  /* ---------- 5. barra azioni: entra quando il tavolo è passato ---------- */
  (function actionbar() {
    var bar = document.querySelector('.actionbar');
    var table = document.getElementById('turntable');
    var booking = document.getElementById('prenota');
    if (!bar) return;

    // Senza il tavolo in pagina non c'è niente da proteggere: mostrala subito.
    if (!table) { bar.classList.add('is-in'); return; }

    var queued = false;

    function update() {
      queued = false;
      var vh = window.innerHeight;
      // il tavolo con la sua didascalia è interamente sopra il bordo inferiore
      var passed = table.getBoundingClientRect().bottom < vh;
      // nella sezione Prenota i pulsanti grandi ci sono già: niente doppione
      var onBooking = false;
      if (booking) {
        var b = booking.getBoundingClientRect();
        onBooking = b.top < vh * 0.75 && b.bottom > vh * 0.25;
      }
      bar.classList.toggle('is-in', passed && !onBooking);
    }

    function onScroll() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  })();

  /* ---------- 6. anno nel footer ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
