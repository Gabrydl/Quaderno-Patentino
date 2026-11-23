(function () {
  'use strict';
  /* ---------- formattazione (come Assetto e pescaggi) ---------- */
  function f(v, d) {
    if (!isFinite(v)) return '—';
    var s = Math.abs(v).toFixed(d).replace('.', ',');
    return (v < 0 && Number(s.replace(',', '.')) !== 0 ? '−' : '') + s;
  }
  function fa(v, min) {
    if (!isFinite(v)) return '—';
    var p = String(Math.round(v * 10000) / 10000).split('.'), dec = p[1] || '';
    while (dec.length < min) dec += '0';
    return p[0] + (dec ? ',' + dec : '');
  }
  function n(v, d) { return '<span class="n">' + f(v, d) + '</span>'; }
  function na(v, min) { return '<span class="n">' + fa(v, min) + '</span>'; }
  function fr(a, b) { return '<span class="frac"><span>' + a + '</span><span>' + b + '</span></span>'; }
  function pn(s) { s = String(s == null ? '' : s).trim().replace(/\s/g, '').replace(',', '.'); return s === '' ? NaN : Number(s); }
  function eqs(lines) {
    return '<div class="eqs">' + lines.map(function (l) { return '<div class="eq">' + l.split(' = ').map(function (c) { return '<span class="ch">' + c + '</span>'; }).join('<span class="op">=</span>') + '</div>'; }).join('') + '</div>';
  }
  function kpi(k, v, s, main) { return '<div class="kpi' + (main ? ' main' : '') + '"><div class="k">' + k + '</div><div class="v">' + v + '</div>' + (s ? '<div class="s">' + s + '</div>' : '') + '</div>'; }
  function formBox(lines) {
    return '<div class="formule"><h3>Formule usate</h3><div class="eqs">' + lines.map(function (l) { return '<div class="eq">' + l.split(/ {3,}/).map(function (x) { return '<span class="fi">' + x + '</span>'; }).join('') + '</div>'; }).join('') + '</div></div>';
  }
  function renderSteps(steps, formule) {
    return '<section class="steps"><h2>Soluzione passo per passo</h2>' + (formule ? formBox(formule) : '') + '<ol>' + steps.map(function (s) {
      return '<li class="step"><div><h3>' + s.title + '</h3>' + s.body + (s.why ? '<p class="why">' + s.why + '</p>' : '') + '</div></li>';
    }).join('') + '</ol></section>';
  }
  function errBox(m) { return '<div class="err">' + m + '</div>'; }
  function deg(x) { return x * 180 / Math.PI; }

  /* ---------- tempo ---------- */
  function parseT(s) {
    s = String(s || '').trim().replace(/[.,h]/g, ':');
    var m = /^(\d{1,2}):?(\d{2})$/.exec(s);
    if (!m) return NaN;
    var h = +m[1], mi = +m[2];
    if (h > 23 || mi > 59) return NaN;
    return h * 60 + mi;
  }
  var DAY0 = NaN, MULTI = false;
  function hm(m) { m = Math.round(m); var d = Math.floor(m / 1440), r = m - d * 1440; return (r < 600 ? '0' : '') + Math.floor(r / 60) + ':' + (r % 60 < 10 ? '0' : '') + (r % 60); }
  function dayOf(m) { return Math.floor(Math.round(m) / 1440); }
  function dayLab(d) { return !MULTI ? '' : (isFinite(DAY0) ? ' del ' + (DAY0 + d) : (d > 0 ? ' (+' + d + ' g)' : '')); }
  function T(m) { return hm(m) + dayLab(dayOf(m)); }
  function dur(m) { m = Math.round(m); return Math.floor(m / 60) + 'h ' + (m % 60 < 10 ? '0' : '') + (m % 60) + 'm'; }
  function multiDay(E) { return dayOf(E[E.length - 1].t) > 0; }

  /* ---------- modello: metodo del coseno ---------- */
  // E: [{t (min), h}] in ordine. Semiperiodo i: da E[i] a E[i+1].
  function semi(E, i) {
    var a = E[i], b = E[i + 1];
    return { i: i, t1: a.t, h1: a.h, t2: b.t, h2: b.h, D: b.t - a.t, mid: (a.h + b.h) / 2, amp: (a.h - b.h) / 2,
      fase: b.h > a.h ? 'flusso' : 'riflusso', tipo1: a.h > b.h ? 'alta' : 'bassa', tipo2: b.h > a.h ? 'alta' : 'bassa' };
  }
  function hAt(E, t) {
    for (var i = 0; i < E.length - 1; i++) {
      if (t >= E[i].t - 1e-9 && t <= E[i + 1].t + 1e-9) {
        var S = semi(E, i), tau = t - S.t1, ang = Math.PI * tau / S.D, c = Math.cos(ang);
        return Object.assign(S, { t: t, tau: tau, ang: deg(ang), cos: c, h: S.mid + S.amp * c });
      }
    }
    return null;
  }
  function h12(S, tau) {
    var C = [0, 1, 3, 6, 9, 11, 12], x = 6 * tau / S.D, k = Math.min(5, Math.floor(x));
    var cum = C[k] + (C[k + 1] - C[k]) * (x - k);
    return { x: x, k: k, cum: cum, h: S.h1 + (S.h2 - S.h1) * cum / 12 };
  }
  function timesFor(E, h) {
    var out = [], kf = 0, kr = 0;
    for (var i = 0; i < E.length - 1; i++) {
      var S = semi(E, i), lo = Math.min(S.h1, S.h2), hi = Math.max(S.h1, S.h2);
      if (S.fase === 'flusso') kf++; else kr++;
      if (h < lo - 1e-9 || h > hi + 1e-9 || S.h1 === S.h2) continue;
      var c = Math.max(-1, Math.min(1, (2 * h - S.h1 - S.h2) / (S.h1 - S.h2)));
      var ang = Math.acos(c), tau = S.D * ang / Math.PI;
      out.push(Object.assign(S, { hT: h, cos: c, ang: deg(ang), tau: tau, t: S.t1 + tau, k: S.fase === 'flusso' ? kf : kr }));
    }
    return out;
  }
  // intervalli in cui ok(h) è vero, tra il primo e l'ultimo dato
  function windows(E, ok, levels) {
    var pts = E.map(function (e) { return e.t; });
    levels.forEach(function (L) { timesFor(E, L).forEach(function (x) { pts.push(x.t); }); });
    pts.sort(function (a, b) { return a - b; });
    var u = []; pts.forEach(function (p) { if (!u.length || p - u[u.length - 1] > 1e-6) u.push(p); });
    var W = [];
    for (var j = 0; j < u.length - 1; j++) {
      var m = (u[j] + u[j + 1]) / 2, H = hAt(E, m);
      if (H && ok(H.h)) {
        if (W.length && Math.abs(W[W.length - 1].b - u[j]) < 1e-6) W[W.length - 1].b = u[j + 1];
        else W.push({ a: u[j], b: u[j + 1] });
      }
    }
    var t0 = E[0].t, tn = E[E.length - 1].t;
    W.forEach(function (w) { w.open0 = Math.abs(w.a - t0) < 1e-6; w.openN = Math.abs(w.b - tn) < 1e-6; });
    return W;
  }
  function wTxt(w, dalle) {
    if (w.open0 && w.openN) return 'per tutto il periodo dei dati';
    if (w.open0) return (dalle ? 'fino alle ' : 'prima delle ') + T(w.b);
    if (w.openN) return (dalle ? 'dalle ' + T(w.a) + ' in poi' : 'dopo le ' + T(w.a));
    var da = dayOf(w.a), db = dayOf(w.b);
    if (da === db) return hm(w.a) + '–' + hm(w.b) + dayLab(da);
    return hm(w.a) + dayLab(da) + ' – ' + hm(w.b) + dayLab(db);
  }

  /* ---------- curva ---------- */
  function svgCurva(E, opt) {
    opt = opt || {};
    var W = 440, H = 250, L = 34, R = 8, Tp = 18, B = 30;
    var t0 = E[0].t, tn = E[E.length - 1].t;
    var hs = E.map(function (e) { return e.h; }).concat(opt.levels || []);
    var hmin = Math.min.apply(null, hs), hmax = Math.max.apply(null, hs);
    var pad = Math.max(0.3, (hmax - hmin) * 0.12); hmin = Math.floor((hmin - pad) * 2) / 2; hmax = Math.ceil((hmax + pad) * 2) / 2;
    if (hmin > 0 && hmin < 1) hmin = 0;
    var X = function (t) { return L + (t - t0) / (tn - t0) * (W - L - R); };
    var Y = function (h) { return Tp + (hmax - h) / (hmax - hmin) * (H - Tp - B); };
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Curva di marea">';
    (opt.wins || []).forEach(function (w) {
      s += '<rect x="' + X(w.a).toFixed(1) + '" y="' + Tp + '" width="' + (X(w.b) - X(w.a)).toFixed(1) + '" height="' + (H - Tp - B) + '" fill="var(--rise)" opacity=".14"/>';
    });
    var step = (hmax - hmin) > 4 ? 1 : 0.5;
    for (var g = hmin; g <= hmax + 1e-9; g += step) {
      s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(g).toFixed(1) + '" y2="' + Y(g).toFixed(1) + '" stroke="var(--line)" stroke-width="1"/>' +
        '<text x="' + (L - 6) + '" y="' + (Y(g) + 4).toFixed(1) + '" text-anchor="end" font-size="12.5" fill="var(--muted)" font-family="var(--font-num)">' + f(g, 1) + '</text>';
    }
    var hr = 60 * Math.ceil(t0 / 60), span = tn - t0, ev = span > 1800 ? 480 : (span > 900 ? 240 : (span > 420 ? 120 : 60));
    for (var t = Math.ceil(t0 / ev) * ev; t <= tn; t += ev) {
      s += '<line x1="' + X(t).toFixed(1) + '" x2="' + X(t).toFixed(1) + '" y1="' + (H - B) + '" y2="' + (H - B + 4) + '" stroke="var(--muted)"/>' +
        '<text x="' + X(t).toFixed(1) + '" y="' + (H - B + 16) + '" text-anchor="middle" font-size="12.5" fill="var(--muted)" font-family="var(--font-num)">' + hm(t).slice(0, 5) + '</text>';
    }
    var d = '';
    for (var k = 0; k <= 240; k++) { var tt = t0 + (tn - t0) * k / 240, P = hAt(E, tt); d += (k ? 'L' : 'M') + X(tt).toFixed(1) + ' ' + Y(P.h).toFixed(1); }
    s += '<path d="' + d + '" fill="none" stroke="var(--water-line)" stroke-width="2.4"/>';
    (opt.levels || []).forEach(function (lv, i) {
      s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(lv).toFixed(1) + '" y2="' + Y(lv).toFixed(1) + '" stroke="var(--sink)" stroke-width="1.6" stroke-dasharray="6 4"/>' +
        '<text x="' + (W - R - 2) + '" y="' + (Y(lv) - 5).toFixed(1) + '" text-anchor="end" font-size="12.5" fill="var(--sink)" font-family="var(--font-num)">' + ((opt.levLab || [])[i] || '') + f(lv, 2) + ' m</text>';
    });
    E.forEach(function (e) {
      s += '<circle cx="' + X(e.t).toFixed(1) + '" cy="' + Y(e.h).toFixed(1) + '" r="3.6" fill="var(--water-line)"/>' +
        '<text x="' + X(e.t).toFixed(1) + '" y="' + (Y(e.h) + (e.isHi ? -8 : 17)).toFixed(1) + '" text-anchor="' + (X(e.t) < L + 20 ? 'start' : (X(e.t) > W - R - 20 ? 'end' : 'middle')) + '" font-size="12" fill="var(--ink)" font-family="var(--font-num)">' + hm(e.t) + '</text>';
    });
    (opt.marks || []).forEach(function (m) {
      s += '<line x1="' + X(m.t).toFixed(1) + '" x2="' + X(m.t).toFixed(1) + '" y1="' + Tp + '" y2="' + (H - B) + '" stroke="var(--accent)" stroke-width="1.2" stroke-dasharray="3 3"/>' +
        '<circle cx="' + X(m.t).toFixed(1) + '" cy="' + Y(m.h).toFixed(1) + '" r="5" fill="var(--accent)"/>' +
        (m.lab ? '<text x="' + (X(m.t) + 6).toFixed(1) + '" y="' + (Tp + 10) + '" font-size="12.5" fill="var(--accent)" font-family="var(--font-num)">' + m.lab + '</text>' : '');
    });
    return s + '</svg>';
  }
  function marcaE(E) { E.forEach(function (e, i) { var p = E[i - 1], q = E[i + 1]; e.isHi = (p ? e.h > p.h : true) && (q ? e.h > q.h : true); }); }

  /* ---------- spiegazioni ---------- */
  function stepSemi(S, cosa) {
    return {
      title: 'Semiperiodo e durata',
      body: eqs(['D = ' + T(S.t2) + ' − ' + T(S.t1) + ' = <span class="res n">' + dur(S.D) + ' = ' + Math.round(S.D) + ' min</span>']),
      why: cosa + ' cade tra <b>' + (S.tipo1 === 'alta' ? 'l\'alta' : 'la bassa') + ' marea</b> delle ' + T(S.t1) + ' (' + fa(S.h1, 1) + ' m) e <b>' + (S.tipo2 === 'alta' ? 'l\'alta' : 'la bassa') + ' marea</b> delle ' + T(S.t2) + ' (' + fa(S.h2, 1) + ' m): l\'acqua ' + (S.fase === 'flusso' ? 'sale (<b>flusso</b>)' : 'scende (<b>riflusso</b>)') + '. Livello medio ' + f(S.mid, 2) + ' m, mezza escursione ' + f(Math.abs(S.amp), 2) + ' m.'
    };
  }
  var FH = ['<i>h</i> = ' + fr('<i>h</i><sub>1</sub> + <i>h</i><sub>2</sub>', '2') + ' + ' + fr('<i>h</i><sub>1</sub> − <i>h</i><sub>2</sub>', '2') + ' · cos(180° · ' + fr('τ', 'D') + ')'];
  var FT = ['cos(180° · ' + fr('τ', 'D') + ') = ' + fr('2<i>h</i> − <i>h</i><sub>1</sub> − <i>h</i><sub>2</sub>', '<i>h</i><sub>1</sub> − <i>h</i><sub>2</sub>') + '    τ = D · ' + fr('arccos(…)', '180°')];
  function stepsH(P) {
    var st = [stepSemi(P, 'L\'ora ' + T(P.t))];
    st.push({ title: 'Tempo passato dal primo dato', body: eqs(['τ = ' + T(P.t) + ' − ' + T(P.t1) + ' = <span class="res n">' + Math.round(P.tau) + ' min</span>']), why: 'Si conta dal primo dato del semiperiodo.' });
    st.push({ title: 'Angolo', body: eqs(['180° · ' + fr('τ', 'D') + ' = 180° · ' + fr(n(P.tau, 0), n(P.D, 0)) + ' = <span class="res n">' + f(P.ang, 2) + '°</span>', 'cos ' + f(P.ang, 2) + '° = <span class="n">' + f(P.cos, 4) + '</span>']),
      why: 'Il semiperiodo corrisponde a mezza onda: 0° al primo dato, 180° al secondo.' });
    st.push({ title: 'Altezza di marea', body: eqs(['<i>h</i> = ' + fr(na(P.h1, 1) + ' + ' + na(P.h2, 1), '2') + ' + ' + fr(na(P.h1, 1) + ' − ' + na(P.h2, 1), '2') + ' · ' + n(P.cos, 4),
      '<i>h</i> = ' + n(P.mid, 2) + ' ' + (P.amp * P.cos < 0 ? '−' : '+') + ' ' + n(Math.abs(P.amp * P.cos), 3) + ' = <span class="res n">' + f(P.h, 2) + ' m</span>']),
      why: 'Livello medio più (o meno) la mezza escursione per il coseno.' });
    var Z = h12(P, P.tau);
    st.push({ title: 'Controllo con la regola dei dodicesimi', body: eqs(['ore di marea = 6 · ' + fr(n(P.tau, 0), n(P.D, 0)) + ' = <span class="n">' + f(Z.x, 2) + '</span>', 'dodicesimi = <span class="n">' + f(Z.cum, 2) + '</span>',
      '<i>h</i> ≈ ' + na(P.h1, 1) + ' ' + (P.h2 > P.h1 ? '+' : '−') + ' ' + fr(n(Z.cum, 2), '12') + ' · ' + n(Math.abs(P.h2 - P.h1), 1) + ' = <span class="n">' + f(Z.h, 2) + ' m</span>']),
      why: 'Stima a mano: nelle sei «ore di marea» l\'acqua varia di 1, 2, 3, 3, 2, 1 dodicesimi. Differenza col coseno: ' + f(Math.abs(Z.h - P.h) * 100, 0) + ' cm. All\'esame si usa il coseno.' });
    return st;
  }
  function stepsT(x) {
    return [stepSemi(x, 'L\'altezza ' + fa(x.hT, 2) + ' m'),
      { title: 'Coseno e angolo', body: eqs(['cos = ' + fr('2 · ' + na(x.hT, 2) + ' − ' + na(x.h1, 1) + ' − ' + na(x.h2, 1), na(x.h1, 1) + ' − ' + na(x.h2, 1)) + ' = <span class="n">' + f(x.cos, 4) + '</span>',
        'angolo = arccos(' + n(x.cos, 4) + ') = <span class="res n">' + f(x.ang, 2) + '°</span>']), why: 'È la formula dell\'altezza risolta per il coseno.' },
      { title: 'Istante', body: eqs(['τ = ' + n(x.D, 0) + ' · ' + fr(n(x.ang, 2), '180°') + ' = <span class="n">' + f(x.tau, 1) + ' min</span>', '<i>t</i> = ' + T(x.t1) + ' + ' + dur(x.tau) + ' = <span class="res n">' + T(x.t) + '</span>']),
        why: 'Il tempo si arrotonda al minuto.' }];
  }

  /* ---------- calcolo completo da un insieme di dati ---------- */
  // q: {mode:'h', t} | {mode:'t', h, fase?, k?} | {mode:'lv', h, dir} | {mode:'port', fond, T, ukc, H, AD, OC, z0, z0med, sq, eta, dist, v}
  function solve(E, q) {
    var R = { E: E, q: q };
    if (q.mode === 'h') { R.P = hAt(E, q.t); if (!R.P) R.err = 'L\'ora ' + T(q.t) + ' è fuori dai dati di marea: servono un dato prima e uno dopo.'; return R; }
    if (q.mode === 't') {
      R.X = timesFor(E, q.h);
      if (q.fase) R.X = R.X.filter(function (x) { return x.fase === q.fase && (!q.k || x.k === q.k); });
      if (!R.X.length) R.err = 'L\'altezza ' + fa(q.h, 2) + ' m non viene raggiunta tra i dati inseriti.';
      return R;
    }
    if (q.mode === 'lv') {
      R.W = windows(E, q.dir === 'sopra' ? function (h) { return h > q.h; } : function (h) { return h < q.h; }, [q.h]);
      R.X = timesFor(E, q.h);
      return R;
    }
    // porto e ponti
    var sq = isFinite(q.sq) ? q.sq : 0;
    if (isFinite(q.fond)) { R.col = q.T + q.ukc + sq; R.hmin = R.col - q.fond; }
    if (isFinite(q.H)) {
      if (q.z0med) {
        var P0 = isFinite(q.eta) ? hAt(E, q.eta) : null;
        R.z0 = P0 ? P0.mid : E.reduce(function (s, e) { return s + e.h; }, 0) / E.length; R.z0da = P0 ? 'semi' : 'tutti';
      } else R.z0 = q.z0;
      R.aria = q.AD + q.OC - sq; R.Hz = q.H + R.z0; R.hmax = R.Hz - R.aria;
    }
    var lo = isFinite(R.hmin) ? R.hmin : -Infinity, hi = isFinite(R.hmax) ? R.hmax : Infinity;
    R.lo = lo; R.hi = hi;
    var lev = []; if (isFinite(lo)) lev.push(lo); if (isFinite(hi)) lev.push(hi);
    R.W = windows(E, function (h) { return h >= lo - 1e-9 && h <= hi + 1e-9; }, lev);
    if (isFinite(q.eta)) {
      R.P = hAt(E, q.eta);
      if (R.P) {
        R.okEta = R.P.h >= lo - 1e-9 && R.P.h <= hi + 1e-9;
        var cur = null, next = null;
        R.W.forEach(function (w) { if (q.eta >= w.a - 1e-6 && q.eta <= w.b + 1e-6) cur = w; else if (!next && w.a > q.eta) next = w; });
        R.cur = cur; R.next = next;
        if (!R.okEta && next && isFinite(q.dist) && isFinite(q.v) && q.v > 0) {
          R.tv = q.dist / q.v * 60; R.tv2 = R.tv + (next.a - q.eta); R.v2 = q.dist / (R.tv2 / 60);
        }
      }
    }
    return R;
  }

  /* ---------- risultato in HTML ---------- */
  function render(R) {
    var E = R.E, q = R.q, html = '', st = [], F = [];
    if (R.err) return errBox(R.err);
    marcaE(E);
    if (q.mode === 'h') {
      var P = R.P, Z = h12(P, P.tau);
      html = '<section class="summary"><h2>Risultato</h2><div class="kpis">' + kpi('Altezza alle ' + T(q.t), f(P.h, 2) + ' m', P.fase, true) + kpi('Dodicesimi (controllo)', f(Z.h, 2) + ' m', 'differenza ' + f(Math.abs(Z.h - P.h) * 100, 0) + ' cm') + '</div>' +
        '<div class="figs"><figure class="fig curve">' + svgCurva(E, { marks: [{ t: q.t, h: P.h, lab: hm(q.t) }] }) + '<figcaption>Curva di marea col metodo del coseno; il punto è l\'ora richiesta.</figcaption></figure></div></section>';
      st = stepsH(P); F = FH;
    } else if (q.mode === 't') {
      html = '<section class="summary"><h2>Risultato</h2><div class="kpis">' + R.X.map(function (x, i) { return kpi(x.fase + ' ' + hm(x.t1) + ' → ' + hm(x.t2), T(x.t), fa(q.h, 2) + ' m', i === 0); }).join('') + '</div>' +
        '<div class="figs"><figure class="fig curve">' + svgCurva(E, { levels: [q.h], marks: R.X.map(function (x) { return { t: x.t, h: q.h, lab: hm(x.t) }; }) }) + '<figcaption>La linea tratteggiata è l\'altezza cercata: la curva la incrocia negli istanti trovati.</figcaption></figure></div></section>';
      R.X.forEach(function (x, i) { var s = stepsT(x); if (R.X.length > 1) s.forEach(function (o) { o.title = (i + 1) + 'ª volta (' + x.fase + ') · ' + o.title; }); st = st.concat(s); });
      F = FT;
    } else if (q.mode === 'lv') {
      html = '<section class="summary"><h2>Risultato</h2><div class="wins"><b>Acqua ' + q.dir + ' ' + fa(q.h, 2) + ' m</b>' + (R.W.length ? R.W.map(function (w) { return '<span>' + wTxt(w) + '</span>'; }).join('') : '<span>mai</span>') + '</div>' +
        '<div class="figs"><figure class="fig curve">' + svgCurva(E, { levels: [q.h], wins: R.W }) + '<figcaption>In verde gli intervalli in cui l\'acqua è ' + q.dir + ' il livello.</figcaption></figure></div></section>';
      st.push({ title: 'Dove la curva incrocia il livello', body: '<p class="note">Si cerca l\'istante in cui la marea vale ' + fa(q.h, 2) + ' m in ogni semiperiodo, con la formula dell\'ora per un\'altezza.</p>', why: 'Tra due incroci l\'acqua sta tutta sopra o tutta sotto il livello.' });
      R.X.forEach(function (x) { var s = stepsT(x); st.push({ title: x.fase + ' ' + hm(x.t1) + ' → ' + hm(x.t2) + ': ' + T(x.t), body: s[1].body + s[2].body, why: 'cos = (2h − h₁ − h₂)/(h₁ − h₂), poi τ = D · angolo / 180°.' }); });
      st.push({ title: 'Intervalli', body: '<p class="note">' + (R.W.length ? R.W.map(function (w) { return wTxt(w); }).join(' · ') : 'Mai') + '</p>', why: 'Prima del primo dato e dopo l\'ultimo non si sa cosa fa la marea: per questo si scrive «prima delle» e «dopo le».' });
      F = FT;
    } else {
      var lev = [], lab = [];
      if (isFinite(R.hmin)) { lev.push(R.hmin); lab.push('h min '); }
      if (isFinite(R.hmax)) { lev.push(R.hmax); lab.push('h max '); }
      var k = '';
      if (isFinite(R.hmin)) k += kpi('Altezza minima (fondale)', f(R.hmin, 2) + ' m', 'colonna d\'acqua ' + f(R.col, 2) + ' m', true);
      if (isFinite(R.hmax)) k += kpi('Altezza massima (ponte)', f(R.hmax, 2) + ' m', 'colonna d\'aria ' + f(R.aria, 2) + ' m', true);
      var mg0 = R.P ? Math.min(isFinite(R.hmin) ? R.P.h - R.hmin : Infinity, isFinite(R.hmax) ? R.hmax - R.P.h : Infinity) : 0;
      if (R.P) k += kpi('Altezza all\'ETA ' + T(q.eta), f(R.P.h, 2) + ' m', R.okEta ? 'si può entrare, margine ' + f(mg0 * 100, 0) + ' cm' : 'non si può entrare' + (R.next ? ': dalle ' + T(R.next.a) : ''));
      k += '</div><div class="wins"><b>Si può passare</b>' + (R.W.length ? R.W.map(function (w) { return '<span>' + wTxt(w, 1) + '</span>'; }).join('') : '<span>mai, tra i dati inseriti</span>');
      var marks = R.P ? [{ t: q.eta, h: R.P.h, lab: 'ETA' }] : [];
      html = '<section class="summary"><h2>Risultato</h2><div class="kpis">' + k + '</div>' +
        '<div class="figs"><figure class="fig curve">' + svgCurva(E, { levels: lev, levLab: lab, wins: R.W, marks: marks }) + '<figcaption>In verde le finestre di marea: l\'acqua sta tra le linee tratteggiate.</figcaption></figure></div></section>';
      var sq = isFinite(q.sq) && q.sq > 0;
      if (isFinite(R.hmin)) st.push({ title: 'Altezza minima di marea (fondale)',
        body: eqs(['colonna d\'acqua = pescaggio + UKC' + (sq ? ' + squat' : '') + ' = ' + na(q.T, 1) + ' + ' + na(q.ukc, 1) + (sq ? ' + ' + na(q.sq, 1) : '') + ' = <span class="n">' + f(R.col, 2) + ' m</span>',
          '<i>h</i><sub>min</sub> = colonna d\'acqua − fondale = ' + n(R.col, 2) + ' − ' + na(q.fond, 1) + ' = <span class="res n">' + f(R.hmin, 2) + ' m</span>']),
        why: R.hmin <= 0 ? 'Il fondale della carta basta già da solo: si può entrare con qualsiasi marea.' : 'Il fondale della carta è riferito allo zero idrografico: la marea deve aggiungere almeno ' + f(R.hmin, 2) + ' m.' + (sq ? ' Lo squat fa affondare la nave in moto: serve più acqua.' : '') });
      if (isFinite(R.hmax)) {
        st.push({ title: 'Altezza massima di marea (ponte)',
          body: eqs([(q.z0med ? 'z<sub>0</sub> = ' + (R.z0da === 'semi' ? fr(na(R.P.h1, 1) + ' + ' + na(R.P.h2, 1), '2') + ' = ' : '') + '<span class="n">' + f(R.z0, 2) + ' m</span>' : 'z<sub>0</sub> = <span class="n">' + fa(R.z0, 1) + ' m</span>'),
            'altezza ponte sullo zero idrografico = H + z<sub>0</sub> = ' + na(q.H, 1) + ' + ' + n(R.z0, 2) + ' = <span class="n">' + f(R.Hz, 2) + ' m</span>',
            'colonna d\'aria = opera morta + OC' + (sq ? ' − squat' : '') + ' = ' + na(q.AD, 1) + ' + ' + na(q.OC, 1) + (sq ? ' − ' + na(q.sq, 1) : '') + ' = <span class="n">' + f(R.aria, 2) + ' m</span>',
            '<i>h</i><sub>max</sub> = ' + n(R.Hz, 2) + ' − ' + n(R.aria, 2) + ' = <span class="res n">' + f(R.hmax, 2) + ' m</span>']),
          why: (q.z0med ? (R.z0da === 'semi' ? 'z<sub>0</sub> è il livello medio del semiperiodo dell\'arrivo (media di alta e bassa marea). ' : 'z<sub>0</sub> è la media di tutti i dati di marea. ') : '') +
            'L\'altezza del ponte è riferita al livello medio, che sta z<sub>0</sub> sopra lo zero idrografico. Con più marea lo spazio sotto il ponte diminuisce: l\'altezza di marea non deve superare ' + f(R.hmax, 2) + ' m.' + (sq ? ' Lo squat abbassa la nave e lascia un po\' più di aria.' : '') });
      }
      var lv2 = []; if (isFinite(R.hmin)) lv2.push(R.hmin); if (isFinite(R.hmax)) lv2.push(R.hmax);
      var cross = [];
      lv2.forEach(function (L) { timesFor(E, L).forEach(function (x) { cross.push(x); }); });
      cross.sort(function (a, b) { return a.t - b.t; });
      if (cross.length) st.push({ title: 'Quando la marea passa per ' + lv2.map(function (x) { return f(x, 2) + ' m'; }).join(' e '),
        body: eqs(cross.map(function (x) { return x.fase + ' ' + hm(x.t1) + '→' + hm(x.t2) + ': cos = ' + fr('2·' + n(x.hT, 2) + ' − ' + na(x.h1, 1) + ' − ' + na(x.h2, 1), na(x.h1, 1) + ' − ' + na(x.h2, 1)) + ' = ' + n(x.cos, 4) + ' → τ = ' + n(x.tau, 1) + ' min = <span class="res n">' + T(x.t) + '</span>'; })),
        why: 'Ogni incrocio si trova come nell\'«ora per un\'altezza»: cos = (2h − h₁ − h₂)/(h₁ − h₂), angolo = arccos, τ = D · angolo / 180°.' });
      st.push({ title: 'Finestre di marea', body: '<p class="note">' + (R.W.length ? R.W.map(function (w) { return wTxt(w, 1); }).join(' · ') : 'Nessuna finestra tra i dati inseriti.') + '</p>',
        why: 'Sono gli intervalli in cui ' + (lv2.length === 2 ? 'la marea sta tra ' + f(R.hmin, 2) + ' e ' + f(R.hmax, 2) + ' m.' : (isFinite(R.hmin) ? 'la marea è almeno ' + f(R.hmin, 2) + ' m.' : 'la marea non supera ' + f(R.hmax, 2) + ' m.')) });
      if (R.P) {
        var margin = Math.min(isFinite(R.hmin) ? R.P.h - R.hmin : Infinity, isFinite(R.hmax) ? R.hmax - R.P.h : Infinity);
        var sH = stepsH(R.P); var why = '';
        if (R.okEta) {
          why = 'All\'ETA si può entrare, con un margine di ' + f(margin * 100, 0) + ' cm' + (R.cur && !R.cur.openN ? ': la condizione resta buona fino alle ' + T(R.cur.b) + '.' : '.');
          if (margin < 0.15) why += ' Il margine è molto piccolo: basta un ritardo per perderlo' + (R.next ? '; conviene puntare alla finestra successiva, dalle ' + T(R.next.a) : '') + '.';
        } else why = 'All\'ETA non si può entrare' + (R.next ? ': il primo istante utile dopo l\'arrivo è <b>' + T(R.next.a) + '</b>' : ': nessuna finestra dopo l\'arrivo tra i dati inseriti') + '.';
        st.push({ title: 'Altezza all\'ETA ' + T(q.eta), body: sH[2].body + sH[3].body, why: 'Semiperiodo ' + hm(R.P.t1) + ' → ' + hm(R.P.t2) + ' (D = ' + Math.round(R.P.D) + ' min, τ = ' + Math.round(R.P.tau) + ' min). ' + why });
        if (isFinite(R.v2)) st.push({ title: 'Velocità per l\'ultimo leg',
          body: eqs(['tempo previsto = ' + fr(na(q.dist, 0) + ' mg', na(q.v, 1) + ' kts') + ' = <span class="n">' + dur(R.tv) + '</span>',
            'nuovo tempo = ' + dur(R.tv) + ' + ' + dur(R.next.a - q.eta) + ' = <span class="n">' + dur(R.tv2) + '</span>',
            '<i>V</i> = ' + fr(na(q.dist, 0) + ' mg', n(R.tv2 / 60, 2) + ' h') + ' = <span class="res n">' + f(R.v2, 1) + ' kts</span>']),
          why: 'Per arrivare alle ' + T(R.next.a) + ' invece che alle ' + T(q.eta) + ' si rallenta su tutta la traversata di ' + fa(q.dist, 0) + ' miglia.' });
      }
      F = ['<i>h</i><sub>min</sub> = pescaggio + UKC + squat − fondale', '<i>h</i><sub>max</sub> = (H + z<sub>0</sub>) − (opera morta + OC − squat)'].concat(FT);
    }
    return html + renderSteps(st, F);
  }

  /* ---------- esercizi del libro ---------- */
  function ev(list) { return list.map(function (x) { return { o: x[0], h: x[1] }; }); }
  var EX = [
    { n: 2, ev: ev([['02:18', '5,9'], ['09:22', '1,3']]),
      text: 'Sapendo che si ha la alta marea alle 02:18 con altezza 5,9 m e la bassa marea alle 09:22 con altezza 1,3 m, risolvere i quesiti proposti:',
      sub: [['a', 'h', '05:00', '4,43 m'], ['b', 'h', '04:20', '5,02 m'], ['c', 'h', '08:02', '1,69 m'], ['d', 'h', '07:46', '1,86 m'],
        ['e', 't', '4,4', '05:02'], ['f', 't', '1,9', '07:42'], ['g', 't', '2,3', '07:11'], ['h', 't', '5,0', '04:22']] },
    { n: 3, day: 30, ev: ev([['00:58', '3,3'], ['07:14', '1,2'], ['13:30', '3,3'], ['19:49', '1,1']]),
      text: 'Noti i dati di marea riportati, risolvere i quesiti proposti:',
      sub: [['a', 'h', '02:00', '3,16 m'], ['b', 'h', '12:15', '3,10 m'], ['c', 'h', '18:22', '1,37 m'], ['d', 'h', '04:56', '1,82 m'],
        ['e', 'sopra', '2,5', 'prima delle 3:37 e 10:51–16:06'], ['f', 'sopra', '3,0', 'prima delle 2:31 e 11:57–15:01'],
        ['g', 'sotto', '1,5', '5:41–8:47 e dopo le 18:03'], ['h', 'sotto', '2,2', '4:12–10:16 e dopo le 16:39']] },
    { n: 4, day: 25, ev: ev([['01:14', '0,5'], ['07:21', '1,3'], ['13:50', '0,3'], ['20:09', '1,3']]),
      text: 'Noti i dati di marea riportati, risolvere i quesiti proposti:',
      sub: [['a', 'h', '03:14', '0,69 m'], ['b', 'h', '12:05', '0,47 m'], ['c', 'h', '19:00', '1,22 m'], ['d', 'h', '16:36', '0,70 m'],
        ['e', 't', '1,0', '04:47', 'flusso', 1, 'nel primo flusso'], ['f', 't', '1,0', '17:49', 'flusso', 2, 'nel secondo flusso'],
        ['g', 't', '1,0', '09:45', 'riflusso', 1, 'nel riflusso'], ['h', 't', '0,5', '11:55', 'riflusso', 1, 'nel riflusso']] },
    { n: 5, ev: ev([['03:31', '1,1'], ['09:24', '6,2']]), lib: 'Altezza richiesta 1,6 m, istante 4:43',
      text: 'Calcolare l\'ora da cui è possibile entrare in un porto in cui si ha bassa marea alle 03:31 con altezza 1,1 m ed alta marea alle 09:24 con altezza 6,2 m, sapendo che il fondale segnato sulla carta è di 15 m ed il proprio pescaggio è di 14,6 m; è noto inoltre l\'UKC di Compagnia, pari a 2,0 m.',
      q: { fond: '15', T: '14,6', ukc: '2,0' } },
    { n: 6, ev: ev([['15:08', '0,4'], ['21:56', '3,9']]), lib: 'Altezza richiesta 2,0 m, istante 18:21',
      text: 'Calcolare l\'ora da cui è possibile entrare in un porto in cui si ha bassa marea alle 15:08 con altezza 0,4 m ed alta marea alle 21:56 con altezza 3,9 m, sapendo che il fondale indicato sui portolani è di 9,7 m ed il proprio pescaggio è di 10,5 m; è noto inoltre l\'UKC di Compagnia, pari a 1,2 m.',
      q: { fond: '9,7', T: '10,5', ukc: '1,2' } },
    { n: 7, ev: ev([['08:21', '4,4'], ['14:20', '0,7']]), lib: 'Altezza richiesta 1,5 m, istante 12:29',
      text: 'Calcolare l\'ora da cui è possibile transitare, a bassa velocità, sotto un ponte la cui altezza, fornita dal portolano, è pari a 45 m, sapendo che le condizioni di marea prevedono un\'alta marea di 4,4 m alle ore 08:21 e una bassa marea di 0,7 alle ore 14:20; è noto l\'<i>overhead clearance</i>, pari a 2,5 m, l\'altezza della propria opera viva, pari a 43,5 m e lo z<sub>0</sub> dalla carta, pari a 2,5 m.',
      nota: 'Il testo dice «opera viva» ma è l\'altezza dell\'opera morta (air draft), come nel calcolo del libro.',
      q: { H: '45', AD: '43,5', OC: '2,5', z0: '2,5' } },
    { n: 8, day: 17, ev: ev([['02:09', '2,9'], ['07:41', '7,2'], ['14:44', '2,8'], ['20:11', '7,2']]),
      lib: 'Altezza all\'arrivo 4,47 m, altezza richiesta 4,4 m: è appena possibile entrare ma il margine è da ritenere insufficiente non consentendo di prendere in considerazione eventuali ritardi, per cui bisogna attendere il flusso alle 16:59',
      text: 'In fase di pianificazione della traversata, si stima di raggiungere la propria destinazione il giorno 17/08, per il quale si sono ricavati dalle <i>Tide Tables</i> i dati di marea riportati. Si determini l\'altezza di marea all\'ora stimata di arrivo ETA t<sub>f</sub> = 11:45, valutando se è possibile entrare in sicurezza sapendo che il fondale all\'ingresso indicato sui portolani è di 12,7 m, il proprio pescaggio è di 15,6 m e l\'UKC stabilito dal Comandante è pari a 1,5 m. Se l\'altezza all\'ora di arrivo risultasse non sufficiente si determini il primo istante successivo in cui si raggiunge la condizione desiderata.',
      q: { fond: '12,7', T: '15,6', ukc: '1,5', eta: '11:45' } },
    { n: 9, day: 2, ev: ev([['05:30', '5,7'], ['11:29', '0,8'], ['17:58', '5,5'], ['23:50', '0,9']]),
      lib: 'Altezza all\'arrivo 4,80 m, altezza massima richiesta 4,65 m: non è possibile entrare in sicurezza, per cui bisogna attendere il riflusso alle 19:38',
      text: 'In fase di pianificazione della traversata, si stima di raggiungere la propria destinazione il giorno 02/12 alle ETA t<sub>f</sub> = 16:20, dopo un percorso di 654 miglia, per il quale si è assunta la velocità di servizio della nave 16,8 kts; si sono ricavati dalle <i>Tide Tables</i> i dati di marea riportati. Si determini l\'altezza di marea all\'ora stimata di arrivo, valutando se è possibile entrare in sicurezza sapendo che il porto è sovrastato da un ponte ferroviario avente altezza 38 m (si assuma z<sub>0</sub> uguale al valore medio calcolato). Sapendo che la propria nave ha un\'altezza dell\'opera morta di 35 m e il proprio SMS prevede un OC (<i>overhead clearance</i>) di 1,5 m, si determini se è sicuro l\'ingresso in porto nelle condizioni descritte; in caso contrario si determini a che ora effettuare l\'ingresso e di conseguenza che velocità tenere per l\'ultimo <i>leg</i> della traversata.',
      nota: 'z<sub>0</sub> «valore medio calcolato» = media di bassa e alta marea del semiperiodo dell\'arrivo (11:29 → 17:58), come nel risultato del libro. La velocità è calcolata rallentando su tutte le 654 miglia: il libro non la riporta.',
      q: { H: '38', AD: '35', OC: '1,5', z0med: true, eta: '16:20', dist: '654', v: '16,8' } },
    { n: 10, day: 18, ev: ev([['03:32', '0,7'], ['09:32', '3,5'], ['15:47', '0,9'], ['21:36', '3,6'], ['04:03', '0,7'], ['10:03', '3,4'], ['16:21', '0,9'], ['22:09', '3,5']]),
      lib: 'Colonna d\'acqua necessaria 21,9 m, altezza minima per fondale 1,9 m, colonna d\'aria necessaria 42,9 m, altezza massima per ponte 3,2 m; intervalli: 06:16–08:16 del 18/04, 10:55–13:07 del 18/04, 18:12–20:08 del 18/04, 23:10–01:11 del 18-19/04, 06:50–09:00 del 19/04, 11:12–13:36 del 19/04, 18:49–20:52 del 19/04',
      text: 'In fase di pianificazione della traversata, si cercano le <i>tidal window</i> per i giorni di possibile arrivo (18 e 19 aprile), in cui sia possibile entrare in sicurezza in un porto in cui si ha un bassofondo all\'ingresso segnato per 20 m e un\'ostruzione aerea avente quota 44 m (z<sub>0</sub> = 2,1 m); si sono ricavati dalle <i>Tide Tables</i> i dati di marea riportati. La propria nave ha un pescaggio di 19,8 m ed un\'altezza dell\'opera morta di 40,5 m, si determinino le finestre temporali richieste tenendo presente il rispetto dell\'UKC previsto dal proprio SMS, pari a 1,5 m, l\'OC (<i>overhead clearance</i>), pari a 3 m e valutando un effetto <i>squat</i> di 0,6 m.',
      q: { fond: '20', T: '19,8', ukc: '1,5', H: '44', AD: '40,5', OC: '3', z0: '2,1', sq: '0,6' } }
  ];
  var EXN = {}; EX.forEach(function (e) { EXN[e.n] = e; });

  function toE(evl) {
    var E = [], off = 0, prev = -Infinity, bad = [];
    evl.forEach(function (x, i) {
      var t = parseT(x.o), h = pn(x.h);
      if (!isFinite(t) || !isFinite(h)) { bad.push(i); return; }
      if (t + off <= prev) off += 1440;
      prev = t + off; E.push({ t: t + off, h: h });
    });
    MULTI = E.length > 1 && dayOf(E[E.length - 1].t) > 0;
    return { E: E, bad: bad };
  }
  function qOf(ex, s) {
    var q = { mode: s[1] === 'sopra' || s[1] === 'sotto' ? 'lv' : s[1] };
    if (q.mode === 'h') q.t = parseT(s[2]);
    else if (q.mode === 't') { q.h = pn(s[2]); if (s[4]) { q.fase = s[4]; q.k = s[5]; } }
    else { q.h = pn(s[2]); q.dir = s[1]; }
    return q;
  }
  function qPort(ex) {
    var o = ex.q, q = { mode: 'port' };
    ['fond', 'T', 'ukc', 'H', 'AD', 'OC', 'z0', 'sq', 'dist', 'v'].forEach(function (k) { q[k] = pn(o[k]); });
    q.z0med = !!o.z0med; q.eta = o.eta ? parseT(o.eta) : NaN;
    return q;
  }
  function short(R) {
    var q = R.q;
    if (R.err) return '—';
    if (q.mode === 'h') return f(R.P.h, 2) + ' m';
    if (q.mode === 't') return R.X.map(function (x) { return hm(x.t); }).join(' e ');
    if (q.mode === 'lv') return R.W.map(function (w) { return wTxt(w); }).join(' e ');
    var p = [];
    if (isFinite(R.hmin)) p.push('h min ' + f(R.hmin, 2) + ' m');
    if (isFinite(R.hmax)) p.push('h max ' + f(R.hmax, 2) + ' m');
    var mg = R.P ? Math.min(isFinite(R.hmin) ? R.P.h - R.hmin : Infinity, isFinite(R.hmax) ? R.hmax - R.P.h : Infinity) : 0;
    if (R.P) p.push('all\'ETA ' + f(R.P.h, 2) + ' m: ' + (R.okEta ? 'si entra' + (R.cur && !R.cur.openN ? ' fino alle ' + T(R.cur.b) : '') + (mg < 0.15 ? ', margine ' + f(mg * 100, 0) + ' cm' + (R.next ? ': meglio dalle ' + T(R.next.a) : '') : '') : 'non si entra' + (R.next ? ', prima utile ' + T(R.next.a) : '')));
    else p.push('finestre: ' + R.W.map(function (w) { return wTxt(w, 1); }).join(', '));
    if (isFinite(R.v2)) p.push('V ' + f(R.v2, 1) + ' kts');
    return p.join(' · ');
  }
  function same(a, lib) { var x = String(a).replace(/\s/g, '').replace(/–/g, '-').replace(/\b0(\d:)/g, '$1'), y = String(lib).replace(/\s/g, '').replace(/–/g, '-').replace(/\b0(\d:)/g, '$1'); return x === y; }
  function qText(s) {
    if (s[1] === 'h') return 'Altezza di marea alle ' + s[2];
    if (s[1] === 't') return 'Istante in cui si ha ' + s[2] + ' m' + (s[6] ? ' ' + s[6] : '');
    return 'Intervalli con acqua ' + (s[1] === 'sopra' ? 'superiore' : 'inferiore') + ' a ' + s[2] + ' m';
  }
  function renderEx() {
    document.getElementById('es-list').innerHTML = '<div class="escards">' + EX.map(function (ex) {
      var E = toE(ex.ev).E; DAY0 = ex.day || NaN;
      var tab = '<table class="evtab">' + (ex.day ? '<tr><td colspan="2"><b>Giorno ' + ex.day + '</b></td></tr>' : '') + ex.ev.map(function (e, i) { return '<tr><td>' + e.o + '</td><td>' + e.h + ' m</td></tr>' + (ex.n === 10 && i === 3 ? '<tr><td colspan="2"><b>Giorno 19</b></td></tr>' : ''); }).join('') + '</table>';
      var body;
      if (ex.sub) body = '<ul class="subq">' + ex.sub.map(function (s, i) {
        var r = short(solve(E, qOf(ex, s)));
        return '<li><span class="q">' + s[0] + '. ' + qText(s) + '</span><button type="button" class="btn go" data-ex="' + ex.n + '" data-sub="' + i + '">Risolvi</button>' +
          '<span><span class="r">' + r + '</span> <span class="lib ' + (same(r, s[3]) ? 'ok' : '') + '">· libro ' + s[3] + '</span></span></li>';
      }).join('') + '</ul>';
      else body = '<div class="exres"><span>Risultato:</span> ' + short(solve(E, qPort(ex))) + '</div><p class="lib">Libro: ' + ex.lib + '</p>' + (ex.nota ? '<p class="hint">' + ex.nota + '</p>' : '') +
        '<button type="button" class="btn go" data-ex="' + ex.n + '">Risolvi passo per passo →</button>';
      DAY0 = NaN;
      return '<article class="excard" id="ex-' + ex.n + '"><h3><span class="num">' + ex.n + ')</span> Esercizio ' + ex.n + '</h3><p>' + ex.text + '</p>' + tab + body + '</article>';
    }).join('') + '</div>';
  }

  /* ---------- modulo di calcolo ---------- */
  var fM = document.getElementById('f-m'), out = document.getElementById('r-m'), evList = document.getElementById('ev-list'), cur = null;
  function addEv(o, h) {
    var d = document.createElement('div'); d.className = 'evrow';
    d.innerHTML = '<div class="field"><label>Ora</label><div class="inbox"><input class="ev-o" inputmode="numeric" value="' + (o || '') + '" placeholder="hh:mm"></div></div>' +
      '<div class="field"><label>Altezza</label><div class="inbox"><input class="ev-h" inputmode="decimal" value="' + (h || '') + '"><span>m</span></div></div>' +
      '<button type="button" class="evdel" aria-label="Togli questo dato">×</button>';
    evList.appendChild(d);
  }
  function val(id) { return document.getElementById(id).value; }
  function setV(id, v) { document.getElementById(id).value = v == null ? '' : v; }
  function radio(name) { var c = fM.querySelector('input[name="' + name + '"]:checked'); return c ? c.value : null; }
  function setR(name, v) { var c = fM.querySelector('input[name="' + name + '"][value="' + v + '"]'); if (c) c.checked = true; }
  function segs() { document.querySelectorAll('.seg label').forEach(function (l) { l.classList.toggle('on', l.querySelector('input').checked); }); }
  function mk(el, bad) { var fl = el.closest('.field'); if (fl) fl.classList.toggle('bad', bad); }
  function banner() {
    if (!cur) return '';
    return '<div class="exbanner"><div class="exb-top"><b>Esercizio ' + cur.n + (cur.l ? cur.l : '') + '</b>' + (cur.mod ? '<span class="exb-mod">dati modificati</span>' : '') +
      '<button type="button" class="exb-back" data-back="' + cur.n + '">Tutti gli esercizi</button></div><p>' + cur.text + '</p>' + (cur.lib ? '<p class="lib">Libro: ' + cur.lib + '</p>' : '') + '</div>';
  }
  function run() {
    var m = radio('mmode');
    ['h', 't', 'lv', 'port'].forEach(function (k) { document.getElementById('w-' + k).hidden = k !== m; });
    document.getElementById('m-z0').closest('.field').style.opacity = document.getElementById('m-z0med').checked ? '.45' : '';
    var rows = Array.prototype.slice.call(evList.querySelectorAll('.evrow')), evl = [];
    rows.forEach(function (r) {
      var o = r.querySelector('.ev-o'), h = r.querySelector('.ev-h');
      var bo = !isFinite(parseT(o.value)), bh = !isFinite(pn(h.value));
      mk(o, bo); mk(h, bh); evl.push({ o: o.value, h: h.value });
    });
    DAY0 = pn(val('m-day'));
    var C = toE(evl), E = C.E;
    if (C.bad.length || E.length < 2) { out.innerHTML = banner() + errBox('Servono almeno due dati di marea, ciascuno con ora (hh:mm) e altezza.'); return; }
    for (var i = 0; i < E.length - 1; i++) if (E[i + 1].t - E[i].t > 900) { out.innerHTML = banner() + errBox('Tra le ' + hm(E[i].t) + ' e le ' + hm(E[i + 1].t) + ' passano più di 15 ore: manca un dato di marea in mezzo?'); return; }
    var q = { mode: m }, bad = false;
    function need(id, pos) { var el = document.getElementById(id), v = pn(el.value); var b = !isFinite(v) || (pos && v <= 0); mk(el, b); if (b) bad = true; return v; }
    function opt(id) { var el = document.getElementById(id), s = el.value.trim(); if (s === '') { mk(el, false); return NaN; } var v = pn(s); var b = !isFinite(v) || v < 0; mk(el, b); if (b) bad = true; return v; }
    if (m === 'h') { var el = document.getElementById('m-t'); q.t = parseT(el.value); mk(el, !isFinite(q.t)); if (!isFinite(q.t)) bad = true; else { while (q.t < E[0].t && q.t + 1440 <= E[E.length - 1].t) q.t += 1440; } }
    else if (m === 't') q.h = need('m-ht');
    else if (m === 'lv') { q.h = need('m-hl'); q.dir = radio('lvdir'); }
    else {
      q.fond = opt('m-fond'); q.H = opt('m-H');
      if (isFinite(q.fond)) { q.T = need('m-T', true); q.ukc = need('m-ukc'); }
      if (isFinite(q.H)) { q.AD = need('m-AD', true); q.OC = need('m-OC'); q.z0med = document.getElementById('m-z0med').checked; q.z0 = q.z0med ? NaN : need('m-z0'); }
      if (!isFinite(q.fond) && !isFinite(q.H)) { out.innerHTML = banner() + errBox('Scrivi il fondale, l\'altezza del ponte o tutti e due.'); return; }
      q.sq = opt('m-sq'); q.dist = opt('m-dist'); q.v = opt('m-v');
      var e2 = document.getElementById('m-eta'); q.eta = e2.value.trim() === '' ? NaN : parseT(e2.value);
      if (e2.value.trim() !== '' && !isFinite(q.eta)) { mk(e2, true); bad = true; } else mk(e2, false);
      if (isFinite(q.eta)) while (q.eta < E[0].t && q.eta + 1440 <= E[E.length - 1].t) q.eta += 1440;
    }
    if (bad) { out.innerHTML = banner() + errBox('Completa i campi evidenziati con un numero (ore come hh:mm).'); return; }
    out.innerHTML = banner() + render(solve(E, q));
  }
  function load(n, si, stay) {
    var ex = EXN[n]; if (!ex) return;
    evList.innerHTML = ''; ex.ev.forEach(function (e) { addEv(e.o, e.h); });
    setV('m-day', ex.day || '');
    ['m-fond', 'm-T', 'm-ukc', 'm-H', 'm-AD', 'm-OC', 'm-z0', 'm-sq', 'm-eta', 'm-dist', 'm-v'].forEach(function (id) { setV(id, ''); });
    document.getElementById('m-z0med').checked = false;
    if (ex.sub) {
      var s = ex.sub[si || 0], q = qOf(ex, s);
      setR('mmode', q.mode);
      if (q.mode === 'h') setV('m-t', s[2]); else if (q.mode === 't') setV('m-ht', s[2]); else { setV('m-hl', s[2]); setR('lvdir', s[1]); }
      cur = { n: ex.n, l: s[0], text: ex.text + ' ' + s[0] + '. ' + qText(s) + '.', lib: s[3], mod: false, filt: q.fase ? q : null };
    } else {
      setR('mmode', 'port'); var o = ex.q;
      setV('m-fond', o.fond); setV('m-T', o.T); setV('m-ukc', o.ukc); setV('m-H', o.H); setV('m-AD', o.AD); setV('m-OC', o.OC); setV('m-z0', o.z0);
      setV('m-sq', o.sq); setV('m-eta', o.eta); setV('m-dist', o.dist); setV('m-v', o.v); document.getElementById('m-z0med').checked = !!o.z0med;
      cur = { n: ex.n, l: '', text: ex.text, lib: ex.lib, mod: false };
    }
    segs(); run();
    if (!stay) { show('calc'); var nav = document.querySelector('.tabs'); if (nav && nav.scrollIntoView) nav.scrollIntoView({ block: 'start' }); }
  }

  /* ---------- schede ---------- */
  var tabs = document.querySelectorAll('.tab');
  function show(sec) {
    tabs.forEach(function (b) { var on = b.getAttribute('data-sec') === sec; b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; document.getElementById('sec-' + b.getAttribute('data-sec')).hidden = !on; });
    try { localStorage.setItem('mr-tab', sec); } catch (e) {}
  }
  tabs.forEach(function (b) { b.addEventListener('click', function () { show(b.getAttribute('data-sec')); }); });
  fM.addEventListener('input', function () { if (cur) cur.mod = true; run(); });
  fM.addEventListener('change', function () { if (cur) cur.mod = true; segs(); run(); });
  fM.addEventListener('submit', function (e) { e.preventDefault(); });
  document.getElementById('ev-add').addEventListener('click', function () { addEv('', ''); var r = evList.lastElementChild.querySelector('.ev-o'); if (r) r.focus(); run(); });
  evList.addEventListener('click', function (e) { var b = e.target.closest('.evdel'); if (b) { b.closest('.evrow').remove(); if (cur) cur.mod = true; run(); } });
  document.getElementById('m-reset').addEventListener('click', function () { load(2, 0, true); });
  document.addEventListener('click', function (e) {
    var g = e.target.closest('[data-ex]');
    if (g) { load(+g.getAttribute('data-ex'), +(g.getAttribute('data-sub') || 0)); return; }
    var b = e.target.closest('.exb-back');
    if (b) { show('es'); var c = document.getElementById('ex-' + b.getAttribute('data-back')); if (c && c.scrollIntoView) c.scrollIntoView({ block: 'start' }); }
  });
  document.getElementById('teo-1').outerHTML = eqs(FH);
  document.getElementById('teo-2').outerHTML = eqs(['cos(180° · ' + fr('τ', 'D') + ') = ' + fr('2<i>h</i> − <i>h</i><sub>1</sub> − <i>h</i><sub>2</sub>', '<i>h</i><sub>1</sub> − <i>h</i><sub>2</sub>'), 'τ = D · ' + fr('arccos(…)', '180°') + '    <i>t</i> = <i>t</i><sub>1</sub> + τ']);
  document.getElementById('teo-3').outerHTML = eqs(['colonna d\'acqua = pescaggio + UKC + squat', '<i>h</i><sub>min</sub> = colonna d\'acqua − fondale della carta']);
  document.getElementById('teo-4').outerHTML = eqs(['colonna d\'aria = opera morta + OC − squat', '<i>h</i><sub>max</sub> = H + z<sub>0</sub> − colonna d\'aria']);

  renderEx();
  load(2, 0, true); cur = null; run();
  var start = 'es', h = (location.hash || '').replace('#', '');
  if (['es', 'calc', 'teo'].indexOf(h) >= 0) start = h; else { try { var sv = localStorage.getItem('mr-tab'); if (['es', 'calc', 'teo'].indexOf(sv) >= 0) start = sv; } catch (e) {} }
  show(start);
})();
