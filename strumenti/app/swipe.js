/* ===================== 1.07: scorrere tra gli argomenti col dito, come tra le foto =====================
   - solo dentro un argomento aperto; parte solo se il dito va chiaramente di lato (non mentre si scorre in giù)
   - l'argomento segue il dito 1:1 e quello vicino entra piano dal lato; niente scatto finché non si stacca il dito
   - staccando oltre la soglia (o con un colpo veloce) si passa all'argomento vicino, altrimenti torna al suo posto */
(function () {
  'use strict';
  const R = document.documentElement, main = document.getElementById('main');
  if (!main || !window.PointerEvent) return;
  const LOCK = 26;          // pixel di lato prima di decidere che è uno scorrimento orizzontale
  const RATIO = 2.1;        // il movimento di lato deve essere almeno 2,1 volte quello in verticale
  const NO = 'input,textarea,select,.live,.sgal,.tbw,.pl,.mob-dial,.txp,.lens,canvas,[data-noswipe],.sheet';

  const cur = () => document.body.dataset.view === 'topic' ? document.querySelector('.sec.focus article.topic.on') : null;
  const list = a => { const g = a.closest('.grp'); return [...(g || a.closest('section.sec')).querySelectorAll('article.topic')]; };
  const ease = 'cubic-bezier(.22,.8,.28,1)';

  let g = null;   // gesto in corso
  function peekOf(a, dir){
    const L = list(a), n = L[L.indexOf(a) + dir]; if (!n) return null;
    const r = a.getBoundingClientRect();
    const box = document.createElement('div'); box.className = 'swp-peek'; box.setAttribute('aria-hidden', 'true');
    const sec = document.createElement('section'); sec.className = 'sec focus';
    const c = n.cloneNode(true); c.classList.add('on'); c.removeAttribute('id'); c.querySelectorAll('[id]').forEach(e => e.removeAttribute('id'));
    sec.append(c); box.append(sec);
    // l'argomento vicino entra all'altezza dell'inizio di quello aperto (o subito sotto la barra se si è scesi)
    box.style.cssText = 'left:' + r.left + 'px;width:' + r.width + 'px;top:' + Math.max(g.hdr, r.top) + 'px';
    document.body.append(box);
    return { el: box, n };
  }
  function place(dx){
    const W = g.w;
    let tx = dx;
    const side = dx < 0 ? 1 : -1;               // dito a sinistra → arriva il successivo
    const pk = side === 1 ? g.next : g.prev;
    if (!pk){ tx = dx * 0.28; }                 // fine della lista: si muove poco, come un elastico
    g.a.style.transform = 'translate3d(' + tx + 'px,0,0)';
    g.a.style.opacity = String(1 - Math.min(.35, Math.abs(tx) / W * .5));
    if (g.next) g.next.el.style.transform = 'translate3d(' + (W + 24 + Math.min(0, tx)) + 'px,0,0)';
    if (g.prev) g.prev.el.style.transform = 'translate3d(' + (-W - 24 + Math.max(0, tx)) + 'px,0,0)';
    if (g.next) g.next.el.style.opacity = String(Math.min(1, .35 + Math.max(0, -tx) / W));
    if (g.prev) g.prev.el.style.opacity = String(Math.min(1, .35 + Math.max(0, tx) / W));
  }
  function clean(){
    if (!g) return;
    [g.next, g.prev].forEach(p => p && p.el.remove());
    g.a.style.transition = g.a.style.transform = g.a.style.opacity = g.a.style.willChange = '';
    R.classList.remove('swp-on'); g = null;
  }
  function settle(dx, v){
    const W = g.w, dir = dx < 0 ? 1 : -1, pk = dir === 1 ? g.next : g.prev;
    const go = pk && (Math.abs(dx) > W * .32 || (Math.abs(v) > .45 && Math.abs(dx) > 50 && Math.sign(v) === Math.sign(dx)));
    const dur = R.classList.contains('lite') ? 200 : 300, t = 'transform ' + dur + 'ms ' + ease + ',opacity ' + dur + 'ms ' + ease;
    [g.a, g.next && g.next.el, g.prev && g.prev.el].forEach(e => { if (e) e.style.transition = t; });
    const gg = g;
    if (go){
      gg.a.style.transform = 'translate3d(' + (dir === 1 ? -W - 24 : W + 24) + 'px,0,0)'; gg.a.style.opacity = '.4';
      pk.el.style.transform = 'translate3d(0,0,0)'; pk.el.style.opacity = '1';
      const other = dir === 1 ? gg.prev : gg.next; if (other) other.el.style.opacity = '0';
      setTimeout(() => {
        conta('qp-swp-ok');
        // la copia sparisce nello stesso istante in cui compare l'argomento vero (prima restavano tutti e due per un attimo:
        // i riquadri gialli semitrasparenti si sommavano e lampeggiavano)
        const fine = () => { if (g === gg) clean(); };
        if (window.QP_SOFT){ QP_SOFT.skip = true; QP_SOFT.after = fine; }
        location.hash = pk.n.id;
        setTimeout(fine, 400);
      }, dur);
    } else {
      gg.a.style.transform = 'translate3d(0,0,0)'; gg.a.style.opacity = '1';
      if (gg.next) gg.next.el.style.transform = 'translate3d(' + (W + 24) + 'px,0,0)';
      if (gg.prev) gg.prev.el.style.transform = 'translate3d(' + (-W - 24) + 'px,0,0)';
      setTimeout(() => { if (g === gg) clean(); }, dur + 20);
    }
  }

  main.addEventListener('pointerdown', e => {
    if (g || e.pointerType === 'mouse' || !e.isPrimary) return;
    const a = cur(); if (!a || !a.contains(e.target) || e.target.closest(NO)) return;
    const hdr = parseInt(getComputedStyle(R).getPropertyValue('--qp-hdr')) || 62;
    g = { a, id: e.pointerId, x0: e.clientX, y0: e.clientY, mode: 0, w: a.getBoundingClientRect().width, hdr, t: performance.now(), lx: e.clientX, lt: performance.now(), v: 0 };
  }, { passive: true });

  main.addEventListener('pointermove', e => {
    if (!g || e.pointerId !== g.id) return;
    const dx = e.clientX - g.x0, dy = e.clientY - g.y0;
    if (g.mode === 0){
      if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)){ g = null; return; }      // sta scorrendo in giù: niente
      if (Math.abs(dx) < LOCK || Math.abs(dx) < Math.abs(dy) * RATIO) return;
      g.mode = 1; g.x0 = e.clientX - Math.sign(dx) * 6;                               // parte morbido, senza salto
      R.classList.add('swp-on'); g.a.style.willChange = 'transform';
      g.next = peekOf(g.a, 1); g.prev = peekOf(g.a, -1);
      try { main.setPointerCapture(e.pointerId); } catch (_) {}
    }
    const now = performance.now(); g.v = (e.clientX - g.lx) / Math.max(1, now - g.lt) * .6 + g.v * .4; g.lx = e.clientX; g.lt = now;
    place(e.clientX - g.x0);
  }, { passive: true });

  function end(e){
    if (!g || e.pointerId !== g.id) return;
    if (g.mode !== 1){ g = null; return; }
    if (e.type === 'pointercancel'){ settle(0, 0); return; }
    settle(e.clientX - g.x0, g.v);
    // dopo uno scorrimento non deve partire il tocco su un link o un pulsante
    const stop = ev => { ev.stopPropagation(); ev.preventDefault(); };
    document.addEventListener('click', stop, { capture: true, once: true });
    setTimeout(() => document.removeEventListener('click', stop, { capture: true }), 400);
  }
  main.addEventListener('pointerup', end);
  main.addEventListener('pointercancel', end);

  /* ---------- suggerimento muto per le prime volte ----------
     Aprendo un argomento, l'argomento accenna uno scorrimento verso sinistra e sul bordo destro compare per un attimo
     una piccola linguetta. Si vede 5 volte in tutto dalla prima volta che si usa l'app (contate su questo dispositivo), poi mai più. */
  const num = k => { try { return +localStorage.getItem(k) || 0; } catch (e) { return 99; } };
  function conta(k){ try { localStorage.setItem(k, num(k) + 1); } catch (e) {} }
  let hintT = 0;
  function hint(){
    clearTimeout(hintT);
    if (num('qp-swp-hint') >= 5) return;
    hintT = setTimeout(() => {
      const a = cur(); if (!a || g || scrollY > 40) return;
      const L = list(a); if (L.indexOf(a) >= L.length - 1) return;
      conta('qp-swp-hint');
      const tab = document.createElement('div'); tab.className = 'swp-tab'; tab.setAttribute('aria-hidden', 'true');
      const r = a.getBoundingClientRect(); tab.style.top = Math.max(r.top + 40, 120) + 'px';
      document.body.append(tab);
      if (!R.classList.contains('calm')) a.classList.add('swp-nudge');
      setTimeout(() => { a.classList.remove('swp-nudge'); tab.remove(); }, 1700);
    }, 900);
  }
  addEventListener('hashchange', () => setTimeout(hint, 50));
  addEventListener('load', () => setTimeout(hint, 300));
  main.addEventListener('pointerdown', () => { clearTimeout(hintT); }, { passive: true });
})();
