/* ===== Carte sinottiche a colori: galleria dentro Meteorologia =====
   Le carte (pesanti) si scaricano da dati/sinottiche.html solo quando l'argomento sta per comparire. */
(function () {
  'use strict';
  const box = document.querySelector('.sgal'); if (!box) return;
  const tr = box.querySelector('.sg-track'), gal = box.querySelector('.sg-gal'), pv = box.querySelector('.sg-prev'), nx = box.querySelector('.sg-next');
  const ct = box.querySelector('.sg-count'), zb = box.querySelector('.sg-zbtn'), pw = box.querySelector('.sg-panels');
  let sl = [], pn = [], N = 0, cur = 0, loaded = false, loading = false;
  const smooth = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

  function load(){
    if (loaded || loading) return; loading = true;
    fetch(box.dataset.src).then(r => { if (!r.ok) throw 0; return r.text(); }).then(html => {
      const t = document.createElement('template'); t.innerHTML = html;
      const defs = t.content.querySelector('svg'); if (defs) document.body.append(defs);   // forme comuni (coste, reticolo)
      sl = [...t.content.querySelectorAll('.sg-slides > .sg-slide')]; tr.replaceChildren(...sl);
      pn = [...t.content.querySelectorAll('.sg-panels > .sg-panel')]; pw.replaceChildren(...pn);
      N = sl.length; loaded = true; zb.disabled = false; show(0, true); wake();
    }).catch(() => { loading = false; tr.querySelector('.sg-wait span').textContent = 'Carte non disponibili senza rete: riprova più tardi.'; });
  }
  if ('IntersectionObserver' in window){
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)){ io.disconnect(); load(); } }, { rootMargin: '600px 0px' });
    io.observe(box);
  } else load();

  function show(i, first){
    if (!N || (i === cur && !first)) return;
    pn.forEach((p, k) => { p.hidden = k !== i; });
    const p = pn[i]; p.classList.remove('sg-in'); void p.offsetWidth; p.classList.add('sg-in');
    cur = i; pv.hidden = i === 0; nx.hidden = i === N - 1; ct.textContent = (i + 1) + ' di ' + N;
  }
  function go(i){ i = Math.max(0, Math.min(N - 1, i)); tr.scrollTo({ left: i * tr.clientWidth, behavior: smooth() }); show(i); }
  pv.addEventListener('click', () => go(cur - 1)); nx.addEventListener('click', () => go(cur + 1));
  let st; tr.addEventListener('scroll', () => { clearTimeout(st); st = setTimeout(() => { const i = Math.round(tr.scrollLeft / tr.clientWidth); if (i !== cur) show(i); }, 90); wake(); }, { passive: true });
  tr.addEventListener('keydown', e => { if (e.key === 'ArrowRight'){ e.preventDefault(); go(cur + 1); } if (e.key === 'ArrowLeft'){ e.preventDefault(); go(cur - 1); } });
  addEventListener('resize', () => { if (!N) return; tr.style.scrollBehavior = 'auto'; tr.scrollLeft = cur * tr.clientWidth; tr.style.scrollBehavior = ''; });

  // tasti che spariscono dopo 5 secondi senza cambiare carta; ricompaiono toccando la carta
  let idleT = 0;
  function wake(){ gal.classList.remove('idle'); clearTimeout(idleT); idleT = setTimeout(() => gal.classList.add('idle'), 5000); }
  ['pointerdown', 'mousemove', 'keydown', 'focusin'].forEach(ev => gal.addEventListener(ev, wake, { passive: true }));

  // ---------- schermo intero: si parte dalla carta intera; pizzica, doppio tocco, rotellina, +/− e "Intera" ----------
  const P = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5.5L8.5 12l6.5 6.5"/></svg>';
  const Q = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5.5l6.5 6.5L9 18.5"/></svg>';
  let z = null, sc, zc, zi, zp, zn, S = 1, X = 0, Y = 0, S0 = 1, VW = 1076, VH = 717, zcur = 0, zT = 0;
  function build(){
    z = document.createElement('div'); z.className = 'sg-zoom'; z.setAttribute('role', 'dialog'); z.setAttribute('aria-modal', 'true'); z.setAttribute('aria-label', 'Carta a schermo intero');
    z.innerHTML = '<div class="sg-bar"><span class="sg-zi"></span><button type="button" class="sg-zx">Chiudi</button></div><div class="sg-sc"><div class="sg-zc"></div>' +
      '<button type="button" class="sg-arr sg-prev" aria-label="Carta precedente">' + P + '</button><button type="button" class="sg-arr sg-next" aria-label="Carta successiva">' + Q + '</button>' +
      '<div class="sg-tools"><button type="button" class="o" aria-label="Rimpicciolisci">−</button><button type="button" class="t">Intera</button><button type="button" class="i" aria-label="Ingrandisci">+</button></div></div>';
    document.body.append(z);
    sc = z.querySelector('.sg-sc'); zc = z.querySelector('.sg-zc'); zi = z.querySelector('.sg-zi'); zp = z.querySelector('.sg-prev'); zn = z.querySelector('.sg-next');
    z.querySelector('.sg-zx').addEventListener('click', close);
    z.querySelector('.sg-tools .i').addEventListener('click', () => { zoomAt(1.6, sc.clientWidth / 2, sc.clientHeight / 2, true); zwake(); });
    z.querySelector('.sg-tools .o').addEventListener('click', () => { zoomAt(1 / 1.6, sc.clientWidth / 2, sc.clientHeight / 2, true); zwake(); });
    z.querySelector('.sg-tools .t').addEventListener('click', () => { fitAll(true); zwake(); });
    zp.addEventListener('click', () => { if (zcur > 0) zload(zcur - 1); zwake(); });
    zn.addEventListener('click', () => { if (zcur < N - 1) zload(zcur + 1); zwake(); });
    const pts = new Map(); let g0 = null, lastTap = 0, moved = false;
    const rel = e => { const r = sc.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    sc.addEventListener('pointerdown', e => {
      if (e.target.closest('button')) return; zwake(); pts.set(e.pointerId, rel(e)); try { sc.setPointerCapture(e.pointerId); } catch (_) {}
      moved = false; const a = [...pts.values()];
      g0 = a.length === 2 ? { d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y), s: S, x: X, y: Y, cx: (a[0].x + a[1].x) / 2, cy: (a[0].y + a[1].y) / 2 } : { px: a[0].x, py: a[0].y, x: X, y: Y };
      zc.classList.remove('anim');
    });
    sc.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, rel(e)); const a = [...pts.values()];
      if (a.length >= 2 && g0 && g0.d){ const d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y), cx = (a[0].x + a[1].x) / 2, cy = (a[0].y + a[1].y) / 2;
        const ns = Math.max(S0 * .9, Math.min(S0 * 8, g0.s * d / g0.d)); X = cx - (g0.cx - g0.x) * ns / g0.s; Y = cy - (g0.cy - g0.y) * ns / g0.s; S = ns; clamp(); apply(false); moved = true; }
      else if (g0 && g0.px !== undefined){ const dx = a[0].x - g0.px, dy = a[0].y - g0.py; if (Math.abs(dx) + Math.abs(dy) > 4) moved = true; X = g0.x + dx; Y = g0.y + dy; clamp(); apply(false); }
    });
    const up = e => {
      const p = pts.get(e.pointerId); pts.delete(e.pointerId);
      if (pts.size === 1){ const b = [...pts.values()][0]; g0 = { px: b.x, py: b.y, x: X, y: Y }; return; }
      g0 = null; if (S < S0){ fitAll(true); return; }
      if (!moved && p && e.type === 'pointerup'){ const t = Date.now(); if (t - lastTap < 320){ if (S > S0 * 1.05) fitAll(true); else zoomAt(2.5, p.x, p.y, true); lastTap = 0; } else lastTap = t; }
    };
    sc.addEventListener('pointerup', up); sc.addEventListener('pointercancel', up);
    sc.addEventListener('wheel', e => { e.preventDefault(); zwake(); const p = rel(e); zoomAt(Math.exp(-e.deltaY * .0018), p.x, p.y, false); }, { passive: false });
    addEventListener('resize', () => { if (z.classList.contains('on')) fitAll(false); });
    document.addEventListener('keydown', e => { if (!z.classList.contains('on')) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') zn.click(); if (e.key === 'ArrowLeft') zp.click(); });
  }
  function zwake(){ z.classList.remove('idle'); clearTimeout(zT); zT = setTimeout(() => z.classList.add('idle'), 5000); }
  function apply(anim){ zc.classList.toggle('anim', !!anim); zc.style.transform = 'translate(' + X + 'px,' + Y + 'px) scale(' + S + ')'; }
  function clamp(){ const W = sc.clientWidth, H = sc.clientHeight, w = VW * S, h = VH * S; X = w <= W ? (W - w) / 2 : Math.min(0, Math.max(W - w, X)); Y = h <= H ? (H - h) / 2 : Math.min(0, Math.max(H - h, Y)); }
  function fitAll(anim){ const W = sc.clientWidth, H = sc.clientHeight; S0 = Math.min(W / VW, H / VH); S = S0; X = (W - VW * S) / 2; Y = (H - VH * S) / 2; apply(anim); }
  function zoomAt(f, cx, cy, anim){ const ns = Math.max(S0, Math.min(S0 * 8, S * f)); X = cx - (cx - X) * ns / S; Y = cy - (cy - Y) * ns / S; S = ns; clamp(); apply(anim); }
  function zload(i){
    zcur = i; const s = sl[i].querySelector('svg').cloneNode(true); const vb = (s.getAttribute('viewBox') || '0 0 1076 717').split(/[ ,]+/).map(Number);
    VW = vb[2]; VH = vb[3]; s.setAttribute('width', VW); s.setAttribute('height', VH); zc.replaceChildren(s); fitAll(false);
    zp.hidden = i === 0; zn.hidden = i === N - 1; zi.textContent = 'Carta ' + (i + 1) + ' di ' + N + ' · pizzica o tocca due volte per ingrandire';
  }
  function close(){ z.classList.remove('on'); document.documentElement.style.overflow = ''; if (zcur !== cur) go(zcur); zb.focus(); }
  zb.addEventListener('click', () => { if (!N) return; if (!z) build(); z.classList.add('on'); document.documentElement.style.overflow = 'hidden'; zload(cur); zwake(); z.querySelector('.sg-zx').focus(); });
})();
