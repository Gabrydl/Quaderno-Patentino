/* ===================== 1.06: fluidità, formule che entrano nello schermo, disegni interattivi ===================== */
(function () {
  'use strict';
  const R = document.documentElement, main = document.getElementById('main');
  const lite = () => R.classList.contains('lite') || R.classList.contains('calm');
  const vtOk = () => !!document.startViewTransition && !lite();

  /* ---------- altezza della barra in alto (per i disegni che restano visibili) ---------- */
  const top = document.querySelector('header.top');
  function hdr(){ if (top) R.style.setProperty('--qp-hdr', Math.round(top.getBoundingClientRect().height) + 'px'); }
  hdr(); addEventListener('resize', hdr, { passive: true });

  /* ---------- formule, calcoli e tabelle: mai più larghi dello schermo ---------- */
  const SEL = '.f, .calc, .tbw, .step > .f';
  function fit(el){
    if (!el.isConnected || !el.offsetParent) return;
    el.classList.remove('qp-wrap', 'qp-fit'); el.style.fontSize = '';
    const tb = el.classList.contains('tbw') ? el.querySelector('table') : null;
    if (tb){ tb.classList.remove('qp-wrap'); tb.style.fontSize = ''; }
    const box = el.clientWidth;
    if (!box || el.scrollWidth <= box + 1) return;
    const target = tb || el, cs = getComputedStyle(el), base = parseFloat(getComputedStyle(target).fontSize);
    const pad = tb ? 0 : parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    let fs = base;
    // rimpicciolisce a passi finché entra (il padding non scala, per questo si ripete)
    const shrink = min => {
      for (let i = 0; i < 6 && el.scrollWidth > box + 1 && fs > base * min + 0.05; i++){
        fs = Math.max(base * min, fs * (box - pad) / (el.scrollWidth - pad) * 0.99);
        target.style.fontSize = fs.toFixed(2) + 'px';
      }
    };
    const wrap = () => target.classList.add('qp-wrap');
    const k = (box - pad) / (el.scrollWidth - pad);
    if (tb){ wrap(); shrink(0.62); }
    else if (el.classList.contains('calc')){ shrink(0.6); if (el.scrollWidth > box + 1){ wrap(); shrink(0.55); } }
    else { if (k >= 0.74) shrink(0.74); if (el.scrollWidth > box + 1){ wrap(); shrink(0.6); } }
    if (el.scrollWidth > box + 1) shrink(0.45);
    el.classList.add('qp-fit');
  }
  function fitIn(root){ if (!root) return; root.querySelectorAll(SEL).forEach(fit); }
  window.QP_FIT = fitIn;
  // si sistemano solo quando stanno per comparire sullo schermo (anche dentro schede e riquadri che si aprono)
  const all = () => document.querySelectorAll(SEL);
  let io = null;
  if ('IntersectionObserver' in window){
    io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) fit(e.target); }), { rootMargin: '300px 0px' });
    all().forEach(el => io.observe(el));
  }
  function fitVisible(){
    if (io){ all().forEach(el => { io.unobserve(el); io.observe(el); }); return; }
    const a = document.querySelector('article.topic.on') || document.querySelector('section.sec:not([hidden])');
    if (a) fitIn(a);
  }
  let rt = 0, lastW = innerWidth;
  addEventListener('resize', () => { if (innerWidth === lastW) return; lastW = innerWidth; clearTimeout(rt); rt = setTimeout(fitVisible, 150); }, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitVisible);

  /* ---------- disegni interattivi: niente tocco sul disegno, cursori subito sotto ---------- */
  function liveFix(box){
    if (box.dataset.qpLive) return;
    const svg = box.querySelector('svg.live-svg'); if (!svg) return;
    box.dataset.qpLive = '1';
    svg.classList.remove('drag');
    const ctl = box.querySelector(':scope > .live-ctl') || box.querySelector(':scope > .mob-play');
    if (ctl && svg.nextElementSibling !== ctl) svg.after(ctl);
    const sub = box.querySelector('.live-sub');
    if (sub) sub.innerHTML = sub.innerHTML
      .replace(/Trascina il peso <b>p<\/b> in alto o in basso \(o usa i cursori\)/, 'Sposta il peso <b>p</b> in alto o in basso con i cursori sotto il disegno')
      .replace(/Trascina il peso <b>p<\/b> nella stiva \(o usa i cursori\)/, 'Sposta il peso <b>p</b> nella stiva con i cursori sotto il disegno');
    if ('IntersectionObserver' in window){
      const io = new IntersectionObserver(([e]) => svg.classList.toggle('stuck', e.intersectionRatio < 1 && e.boundingClientRect.top < 200), { threshold: [1], rootMargin: '-' + ((parseInt(getComputedStyle(R).getPropertyValue('--qp-hdr')) || 62)) + 'px 0px 0px 0px' });
      io.observe(svg);
    }
  }
  function liveAll(){ document.querySelectorAll('.live[data-live]').forEach(liveFix); }
  liveAll();
  new MutationObserver(liveAll).observe(main, { childList: true, subtree: true });

  /* ---------- cambio di argomento: dissolvenza morbida ---------- */
  // route() dell'app viene chiamata da hashchange: qui la si avvolge in una transizione
  let busy = false;
  window.QP_SOFT = function (fn){
    if (busy){ fn(); return; }
    if (vtOk()){
      busy = true; R.classList.add('vt-run');
      const t = document.startViewTransition(() => { fn(); });
      t.finished.finally(() => { R.classList.remove('vt-run'); busy = false; });
      return;
    }
    if (lite()){ fn(); return; }
    busy = true; main.classList.add('qp-out');
    setTimeout(() => { fn(); main.classList.remove('qp-out'); busy = false; }, 150);
  };

  /* ---------- tema chiaro / scuro: transizione morbida ---------- */
  const tb = document.getElementById('themeBtn');
  if (tb){
    const nb = tb;
    nb.addEventListener('click', () => {
      const cur = R.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      const next = cur === 'dark' ? 'light' : 'dark';
      const set = () => { R.dataset.theme = next; try { localStorage.setItem('qp-theme', next); } catch (e) {} };
      const meta = () => document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.setAttribute('content', next === 'dark' ? '#090f16' : '#f2f5f8'));
      if (vtOk()){
        const r = nb.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
        const rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
        R.classList.add('vt-theme');
        const t = document.startViewTransition(() => { set(); meta(); });
        t.ready.then(() => {
          R.animate({ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + rad + 'px at ' + x + 'px ' + y + 'px)'] },
            { duration: 620, easing: 'cubic-bezier(.3,.6,.2,1)', pseudoElement: '::view-transition-new(root)' });
        }).catch(() => {});
        t.finished.finally(() => R.classList.remove('vt-theme'));
        return;
      }
      // senza View Transitions: un velo col colore di prima che sfuma
      const v = document.createElement('div'); v.className = 'qp-veil';
      v.style.setProperty('--qp-veil', getComputedStyle(document.body).backgroundColor);
      document.body.append(v); set(); meta();
      requestAnimationFrame(() => requestAnimationFrame(() => v.classList.add('go')));
      setTimeout(() => v.remove(), 600);
    });
  }

  /* ---------- link agli esercizi: uscita morbida anche dove non c'è la transizione tra pagine ---------- */
  const crossVT = 'CSSViewTransitionRule' in window;
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || crossVT || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || a.target) return;
    const h = a.getAttribute('href');
    if (!/^(esercizi\/|frasario\/)/.test(h) || lite()) return;
    e.preventDefault();
    main.classList.add('qp-out');
    setTimeout(() => { location.href = h; }, 140);
  });
  addEventListener('pageshow', () => main.classList.remove('qp-out'));
})();
