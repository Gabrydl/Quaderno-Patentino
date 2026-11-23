(function () {
  'use strict';
  var B = window.Bussole, RAD = Math.PI / 180;
  /* ---------- formattazione ---------- */
  function f(v, d) {
    if (!isFinite(v)) return '—';
    var s = Math.abs(v).toFixed(d).replace('.', ',');
    return (v < 0 && Number(s.replace(',', '.')) !== 0 ? '−' : '') + s;
  }
  function n(v, d) { return '<span class="n">' + f(v, d) + '</span>'; }
  function fr(a, b) { return '<span class="frac"><span>' + a + '</span><span>' + b + '</span></span>'; }
  function pn(s) { s = String(s == null ? '' : s).trim().replace(/\s/g, '').replace(',', '.').replace('−', '-'); return s === '' ? NaN : Number(s); }
  function eqs(lines) {
    return '<div class="eqs">' + lines.map(function (l) { return '<div class="eq">' + l.split(' = ').map(function (c) { return '<span class="ch">' + c + '</span>'; }).join('<span class="op">=</span>') + '</div>'; }).join('') + '</div>';
  }
  function kpi(k, v, s, main) { return '<div class="kpi' + (main ? ' main' : '') + '"><div class="k">' + k + '</div><div class="v">' + v + '</div>' + (s ? '<div class="s">' + s + '</div>' : '') + '</div>'; }
  function formBox(lines) {
    return '<div class="formule"><h3>Formule usate</h3><div class="eqs">' + lines.map(function (l) { return '<div class="eq">' + l.split(/ {3,}/).map(function (x) { return '<span class="fi">' + x + '</span>'; }).join('') + '</div>'; }).join('') + '</div></div>';
  }
  function renderSteps(steps, formule, todo) {
    return '<section class="steps"><h2>Soluzione passo per passo</h2>' +
      (todo ? '<div class="todo-box"><h3>Cosa fare</h3><ol class="todo">' + todo.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ol></div>' : '') +
      (formule ? formBox(formule) : '') + '<ol>' + steps.map(function (s) {
      return '<li class="step"><div><h3>' + s.title + '</h3>' + s.body + (s.why ? '<p class="why">' + s.why + '</p>' : '') + '</div></li>';
    }).join('') + '</ol></section>';
  }
  function errBox(m) { return '<div class="err">' + m + '</div>'; }
  function gp(x, ns) { var a = Math.abs(x), g = Math.floor(a), m = Math.round((a - g) * 600) / 10; if (m >= 60) { g++; m = 0; } return g + '°' + (m < 10 ? '0' : '') + m.toFixed(1).replace('.', ',') + '′' + (ns ? (x < 0 ? ns[1] : ns[0]) : ''); }
  function az(x) { x = B.norm360(x); var s = x.toFixed(1).replace('.', ','); return (x < 10 ? '00' : (x < 100 ? '0' : '')) + s + '°'; }
  function ew(x) { return Math.abs(x) < 0.05 ? '0,0°' : f(Math.abs(x), 1) + '°' + (x > 0 ? 'E' : 'W'); }
  function sgnTxt(x) { return (x < 0 ? '−' : '+') + ' ' + f(Math.abs(x), 1) + '°'; }
  function hms(sec) { sec = Math.round(sec); var d = Math.floor(sec / 86400); sec -= d * 86400; var h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60, s = sec % 60; return (h < 10 ? '0' : '') + h + '<sup>h</sup>' + (m < 10 ? '0' : '') + m + '<sup>m</sup>' + (s < 10 ? '0' : '') + s + '<sup>s</sup>'; }
  function kTxt(k) { var a = Math.abs(k); return (k < 0 ? '−' : '+') + Math.floor(a / 60) + '<sup>m</sup>' + (a % 60) + '<sup>s</sup>'; }
  function dataTxt(dt) { return dt.getUTCDate() + '/' + (dt.getUTCMonth() + 1 < 10 ? '0' : '') + (dt.getUTCMonth() + 1) + '/' + dt.getUTCFullYear(); }
  var TOL = 1;   // tolleranza per il giudizio (gradi)
  var MESI = ['', 'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

  /* ---------- calcolo ---------- */
  // inp: corpo, ev ('sorgere'|'tramonto'|'istante'), src ('calc'|'testo'), y,m,g, tc (s), k (s), dec (se testo), phi, lam, ag, ab, d, dev, rv, v, auto
  var ORA_LOC = { sorgere: 6, tramonto: 18 };
  function solve(q) {
    var R = { q: q };
    if (q.src === 'calc') {
      var tcK = q.tc + q.k;
      var est = (q.ev === 'istante' ? (q.sera ? 19.5 : 4.5) : ORA_LOC[q.ev]) * 3600 - q.lam / 15 * 3600;   // TMG stimato, s dalla mezzanotte locale
      var best = null; for (var i = -2; i <= 3; i++) { var s = tcK + i * 43200; if (best === null || Math.abs(s - est) < Math.abs(best - est)) best = s; }
      R.tcK = tcK; R.est = est; R.tu = best;
      R.date = new Date(Date.UTC(q.y, q.m - 1, q.g) + best * 1000);
      R.locH = (best / 3600 + q.lam / 15);
      var E = B.effemeridi(q.corpo, R.date);
      R.dec = E.dec; R.tGr = E.tGr;
      var hr = new Date(R.date.getTime()); hr.setUTCMinutes(0, 0, 0);
      var E0 = B.effemeridi(q.corpo, hr), E1 = B.effemeridi(q.corpo, new Date(hr.getTime() + 3600000));
      R.ora = hr; R.dec0 = E0.dec; R.dec1 = E1.dec; R.t0 = E0.tGr; R.t1 = E1.tGr; R.frac = (R.date - hr) / 3600000;
    } else R.dec = q.dec;
    if (q.ev === 'istante') {
      if (q.src !== 'calc') { R.err = 'A un istante qualsiasi serve l\'angolo orario: scegli «δ dalle effemeridi» e scrivi data e ora.'; return R; }
      R.tLoc = B.norm360(R.tGr + q.lam);
      var A = B.azimutIstante(q.phi, R.dec, R.tLoc); R.Zv = A.Zv; R.h = A.h;
    } else {
      var Am = B.azimutAmpiezza(q.phi, R.dec, q.ev);
      if (Am.err) { R.err = 'Con questa latitudine e questa declinazione l\'astro non sorge e non tramonta.'; return R; }
      R.cosZ = Am.cosZ; R.z = Am.z; R.Zv = Am.Zv;
      if (q.src === 'calc') { R.tLoc = B.norm360(R.tGr + q.lam); var A2 = B.azimutIstante(q.phi, R.dec, R.tLoc); R.Zist = A2.Zv; R.h = A2.h; }
    }
    if (isFinite(q.ag)) {
      R.eg = B.norm180(R.Zv - q.ag);
      if (!q.auto && isFinite(q.v) && isFinite(q.rv)) { R.dv = B.erroreVelocita(q.v, q.rv, q.phi); R.egAtt = -R.dv; R.resG = R.eg - R.egAtt; }
      else R.resG = R.eg;
      R.okG = Math.abs(R.resG) <= TOL;
    }
    if (isFinite(q.ab)) {
      R.Delta = B.norm180(R.Zv - q.ab);
      if (isFinite(q.d)) { R.devT = R.Delta - q.d; if (isFinite(q.dev)) { R.resM = R.devT - q.dev; R.okM = Math.abs(R.resM) <= TOL; } }
    }
    return R;
  }

  /* ---------- spiegazione ---------- */
  function render(R) {
    var q = R.q; if (R.err) return errBox(R.err);
    var st = [], todo = [], F = [], k = '';
    k += kpi('Azimut vero Z<sub>v</sub>', az(R.Zv), q.corpo + (q.ev === 'istante' ? ' all\'istante' : ' al ' + q.ev), true);
    if (isFinite(R.eg)) k += kpi('Girobussola', '<span class="verdict ' + (R.okG ? 'ok' : 'ko') + '">' + (R.okG ? 'funziona' : 'da controllare') + '</span>', 'errore ' + ew(R.eg) + (isFinite(R.dv) ? ', atteso per la velocità ' + ew(R.egAtt) : ''));
    if (isFinite(R.Delta)) k += kpi('Bussola magnetica', isFinite(R.resM) ? '<span class="verdict ' + (R.okM ? 'ok' : 'ko') + '">' + (R.okM ? 'funziona' : 'da controllare') + '</span>' : ew(R.Delta),
      isFinite(R.devT) ? 'deviazione trovata ' + ew(R.devT) + (isFinite(q.dev) ? ', tabella ' + ew(q.dev) : '') : 'variazione Δ');
    var html = '<section class="summary"><h2>Risultato</h2><div class="kpis">' + k + '</div></section>';

    /* cosa fare */
    if (q.src === 'calc') todo.push('Trovo il tempo medio di Greenwich: T<sub>m</sub>Gr = T<sub>c</sub> + K, e decido se il cronometro (12 ore) indica mattina o sera a Greenwich.');
    todo.push(q.src === 'calc' ? 'Dalle effemeridi del ' + q.y + ' leggo la declinazione δ' + (q.ev === 'istante' ? ' e l\'angolo orario t<sub>Gr</sub>' : '') + ' all\'ora intera e interpolo per minuti e secondi.' : 'Prendo la declinazione δ data dal testo: è già quella dell\'istante del rilevamento.');
    todo.push(q.ev === 'istante' ? 'Calcolo l\'angolo orario locale t = t<sub>Gr</sub> + λ e con φ, δ e t ricavo l\'azimut vero Z<sub>v</sub>.' : 'Con la formula dell\'ampiezza cos Z = sen δ / cos φ trovo l\'azimut vero Z<sub>v</sub> al ' + q.ev + '.');
    if (isFinite(q.ag)) todo.push('Errore della gyro: e<sub>g</sub> = Z<sub>v</sub> − a<sub>g</sub>' + (isFinite(R.dv) ? '; lo confronto con l\'errore di velocità dovuto a R<sub>v</sub> e V' : '') + '.');
    if (isFinite(q.ab)) todo.push('Variazione della magnetica: Δ = Z<sub>v</sub> − a<sub>b</sub>; deviazione trovata δ<sub>b</sub> = Δ − d; la confronto con quella della tabella.');
    todo.push('Giudizio: differenza entro ' + TOL + '° → la bussola funziona; più grande → va controllata.');

    /* 1. tempo */
    if (q.src === 'calc') {
      var giorni = Math.floor(R.tu / 86400), dd = giorni === 0 ? 'lo stesso giorno' : (giorni < 0 ? 'il giorno prima' : 'il giorno dopo');
      st.push({ title: 'Tempo medio di Greenwich',
        body: eqs(['T<sub>c</sub> + K = ' + hms(q.tc) + ' ' + kTxt(q.k) + ' = <span class="n">' + hms(((R.tcK % 43200) + 43200) % 43200) + '</span>',
          'T<sub>m</sub>Gr = <span class="res n">' + hms(((R.tu % 86400) + 86400) % 86400) + ' del ' + dataTxt(R.date) + '</span>']),
        why: 'Il cronometro segna 12 ore. ' + (q.ev === 'istante' ? 'Al crepuscolo ' + (q.sera ? 'serale' : 'mattutino') : 'Al ' + q.ev) + ' l\'ora locale è circa le ' + (q.ev === 'istante' ? (q.sera ? '19–20' : '4–5') : (q.ev === 'sorgere' ? '6' : '18')) +
          '; con λ = ' + gp(q.lam, 'EW') + ' (' + f(Math.abs(q.lam / 15), 1) + ' ore ' + (q.lam > 0 ? 'avanti' : 'indietro') + ' rispetto a Greenwich) a Greenwich sono circa le ' + f(((R.est / 3600) % 24 + 24) % 24, 1).replace(/,\d$/, '') + ': quindi T<sub>m</sub>Gr = ' + hms(((R.tu % 86400) + 86400) % 86400) + ', ' + dd + ' rispetto alla data locale ' + q.g + '/' + (q.m < 10 ? '0' : '') + q.m + '.' });
      var lines = ['ore ' + (R.ora.getUTCHours() < 10 ? '0' : '') + R.ora.getUTCHours() + ': δ = <span class="n">' + gp(R.dec0, 'NS') + '</span>    ore ' + ((R.ora.getUTCHours() + 1) % 24 < 10 ? '0' : '') + (R.ora.getUTCHours() + 1) % 24 + ': δ = <span class="n">' + gp(R.dec1, 'NS') + '</span>',
        'δ = ' + gp(R.dec0, 'NS') + ' + ' + n(R.frac, 3) + ' · (' + f((R.dec1 - R.dec0) * 60, 1) + '′) = <span class="res n">' + gp(R.dec, 'NS') + '</span>'];
      if (q.ev === 'istante') lines.push('t<sub>Gr</sub> = <span class="res n">' + gp(R.tGr) + '</span>');
      st.push({ title: 'Effemeridi del ' + q.y + ' (' + q.corpo + ')', body: formBox(lines.slice(0, 1)) + eqs(lines.slice(1)),
        why: 'Si entra nelle effemeridi del ' + R.date.getUTCDate() + ' ' + MESI[R.date.getUTCMonth() + 1] + ' all\'ora intera ' + R.ora.getUTCHours() + ' e si aggiunge la variazione per i ' + Math.round(R.frac * 60) + ' minuti in più (frazione d\'ora ' + f(R.frac, 3) + ')' + (q.ev === 'istante' ? '; per t<sub>Gr</sub> si usa la tabella degli incrementi per minuti e secondi' : '') + '. Valori calcolati dall\'app: con le Effemeridi Nautiche stampate possono cambiare di qualche decimo di primo.' });
    } else st.push({ title: 'Declinazione dell\'astro', body: eqs(['δ = <span class="res n">' + gp(R.dec, 'NS') + '</span>']), why: 'È data dal testo («nell\'istante in cui risulta dalle effemeridi…»): non serve calcolare il tempo.' });

    /* 2. azimut */
    if (q.ev === 'istante') {
      st.push({ title: 'Angolo orario locale', body: eqs(['t = t<sub>Gr</sub> + λ = ' + gp(R.tGr) + ' ' + (q.lam < 0 ? '−' : '+') + ' ' + gp(Math.abs(q.lam)) + ' = <span class="res n">' + gp(R.tLoc) + '</span>']), why: 'λ Est si somma, λ Ovest si sottrae (se il risultato supera 360° si toglie 360°).' });
      st.push({ title: 'Azimut vero', body: eqs(['tan Z = ' + fr('sen t', 'tan δ · cos φ − sen φ · cos t'), 'Z<sub>v</sub> = <span class="res n">' + az(R.Zv) + '</span>    altezza ' + f(R.h, 1) + '°']),
        why: 'Formula dell\'azimut dal triangolo di posizione con φ = ' + gp(q.phi, 'NS') + ', δ = ' + gp(R.dec, 'NS') + ', t = ' + gp(R.tLoc) + '. Il quadrante si sceglie col segno: con t < 180° l\'astro è a Ovest (Z<sub>v</sub> tra 180° e 360°), con t > 180° è a Est.' });
      F.push('tan Z = ' + fr('sen t', 'tan δ · cos φ − sen φ · cos t'));
    } else {
      st.push({ title: 'Azimut vero al ' + q.ev, body: eqs(['cos Z = ' + fr('sen δ', 'cos φ') + ' = ' + fr('sen ' + gp(R.dec, 'NS'), 'cos ' + gp(q.phi, 'NS')) + ' = ' + fr(n(Math.sin(R.dec * RAD), 5), n(Math.cos(q.phi * RAD), 5)) + ' = <span class="n">' + f(R.cosZ, 5) + '</span>',
        'Z = arccos(' + n(R.cosZ, 5) + ') = <span class="n">' + f(R.z, 1) + '°</span>',
        'Z<sub>v</sub> = ' + (q.ev === 'tramonto' ? '360° − ' + n(R.z, 1) + '°' : n(R.z, 1) + '°') + ' = <span class="res n">' + az(R.Zv) + '</span>']),
        why: 'Formula dell\'ampiezza: al ' + q.ev + ' l\'astro è sull\'orizzonte e l\'azimut dipende solo da φ e δ (δ Sud negativa: il seno viene negativo e Z supera 90°). Z si conta da Nord: al sorgere verso Est (Z<sub>v</sub> = Z), al tramonto verso Ovest (Z<sub>v</sub> = 360° − Z).' +
          (isFinite(R.Zist) ? ' <span class="ass-note">Controllo: con la formula completa all\'istante esatto (altezza ' + f(R.h, 1) + '°, lembo superiore sull\'orizzonte) viene ' + az(R.Zist) + '.</span>' : '') });
      F.push('cos Z = ' + fr('sen δ', 'cos φ') + '    sorgere Z<sub>v</sub> = Z    tramonto Z<sub>v</sub> = 360° − Z');
    }

    /* 3. gyro */
    if (isFinite(q.ag)) {
      var gl = ['e<sub>g</sub> = Z<sub>v</sub> − a<sub>g</sub> = ' + az(R.Zv) + ' − ' + az(q.ag) + ' = <span class="res n">' + sgnTxt(R.eg) + ' = ' + ew(R.eg) + '</span>'];
      if (isFinite(R.dv)) {
        gl.push('δ<sub>v</sub> = ' + fr('V · cos R<sub>v</sub>', '5π · cos φ') + ' = ' + fr(f(q.v, 0) + ' · cos ' + f(q.rv, 0) + '°', '5π · cos ' + gp(Math.abs(q.phi))) + ' = <span class="n">' + f(R.dv, 2) + '°</span> → errore atteso ' + ew(R.egAtt));
        gl.push('differenza = ' + ew(R.eg) + ' − (' + ew(R.egAtt) + ') = <span class="res n">' + f(Math.abs(R.resG), 1) + '°</span>');
      }
      st.push({ title: 'Girobussola', body: eqs(gl) + '<p><span class="verdict ' + (R.okG ? 'ok' : 'ko') + '">' + (R.okG ? 'Funziona' : 'Da controllare') + '</span></p>',
        why: 'Errore positivo = Est (la gyro segna meno del vero), negativo = Ovest. ' + (isFinite(R.dv) ? 'Senza autocorrettore la gyro ha l\'errore di velocità: con rotta verso Nord segna troppo (errore W), verso Sud troppo poco (errore E). Se l\'errore trovato è vicino a quello atteso la gyro funziona. ' : (q.auto ? 'La gyro ha l\'autocorrettore: l\'errore di velocità è già corretto, l\'errore dovrebbe essere quasi zero. ' : '')) +
          'Tolleranza usata: ' + TOL + '° (da confermare col professore).' });
      if (isFinite(R.dv)) F.push('e<sub>g</sub> = Z<sub>v</sub> − a<sub>g</sub>    δ<sub>v</sub> = ' + fr('V · cos R<sub>v</sub>', '5π · cos φ')); else F.push('e<sub>g</sub> = Z<sub>v</sub> − a<sub>g</sub>');
    }
    /* 4. magnetica */
    if (isFinite(q.ab)) {
      var ml = ['Δ = Z<sub>v</sub> − a<sub>b</sub> = ' + az(R.Zv) + ' − ' + az(q.ab) + ' = <span class="res n">' + sgnTxt(R.Delta) + ' = ' + ew(R.Delta) + '</span>'];
      if (isFinite(R.devT)) ml.push('δ<sub>b</sub> = Δ − d = ' + ew(R.Delta) + ' − (' + ew(q.d) + ') = <span class="res n">' + ew(R.devT) + '</span>');
      if (isFinite(R.resM)) ml.push('differenza con la tabella = ' + ew(R.devT) + ' − (' + ew(q.dev) + ') = <span class="res n">' + f(Math.abs(R.resM), 1) + '°</span>');
      st.push({ title: 'Bussola magnetica', body: eqs(ml) + (isFinite(R.resM) ? '<p><span class="verdict ' + (R.okM ? 'ok' : 'ko') + '">' + (R.okM ? 'Funziona' : 'Da controllare') + '</span></p>' : ''),
        why: 'La variazione Δ è la somma di declinazione magnetica d (data dalla carta) e deviazione δ<sub>b</sub> (della bussola di bordo). Tolta d resta la deviazione: se è uguale a quella della tabella delle deviazioni la bussola funziona. Tolleranza usata: ' + TOL + '°.' });
      F.push('Δ = Z<sub>v</sub> − a<sub>b</sub>    δ<sub>b</sub> = Δ − d');
    }
    return html + renderSteps(st, F, todo);
  }

  /* ---------- esercizi ---------- */
  function A(g, p, ns) { return (ns === 'S' || ns === 'W' ? -1 : 1) * (g + p / 60); }
  var EX = [
    { n: 1, q: { corpo: 'Sole', ev: 'sorgere', src: 'calc', g: 18, m: 4, tc: '11:05:10', k: '-1:05', phi: [15, '02,8', 'S'], lam: [105, '43,7', 'E'], ag: '78,7', rv: '126', v: '14' },
      text: 'Il giorno 18/04 al T<sub>c</sub> = 11<sup>h</sup>05<sup>m</sup>10<sup>s</sup> (K = −1<sup>m</sup>5<sup>s</sup>), dalla posizione φ = 15°02,8′S e λ = 105°43,7′E, si rileva con la girobussola l\'azimut del Sole al sorgere del suo lembo superiore ottenendo a<sub>g</sub> = 078,7°. Verificare il buon funzionamento della gyro sapendo che si sta navigando con R<sub>v</sub> = 126° e V = 14 kts.' },
    { n: 2, q: { corpo: 'Sole', ev: 'tramonto', src: 'calc', g: 15, m: 4, tc: '04:53:47', k: '+1:10', phi: [27, '24,9', 'S'], lam: [168, '29,3', 'W'], ag: '280,2', rv: '220', v: '12' },
      text: 'Il giorno 15/04 al T<sub>c</sub> = 04<sup>h</sup>53<sup>m</sup>47<sup>s</sup> (K = +1<sup>m</sup>10<sup>s</sup>), dalla posizione φ = 27°24,9′S e λ = 168°29,3′W, si rileva con la girobussola l\'azimut del Sole al tramonto del suo lembo superiore ottenendo a<sub>g</sub> = 280,2°. Verificare il buon funzionamento della gyro sapendo che si sta navigando con R<sub>v</sub> = 220° e V = 12 kts.' },
    { n: 4, q: { corpo: 'Venere', ev: 'istante', sera: true, src: 'calc', g: 18, m: 4, tc: '11:02:37', k: '+0:14', phi: [53, '57,8', 'N'], lam: [45, '42,8', 'W'], ab: '299,5', d: [22.7, 'W'], dev: [0.1, 'E'] },
      text: 'Al crepuscolo serale del giorno 18/04, al T<sub>c</sub> = 11<sup>h</sup>02<sup>m</sup>37<sup>s</sup> (K = +0<sup>m</sup>14<sup>s</sup>), dalla posizione φ = 53°57,8′N e λ = 045°42,8′W, si rileva l\'azimut di Venere con la bussola magnetica, ottenendo a<sub>b</sub> = 299,5°. Verificare il buon funzionamento della bussola magnetica date declinazione magnetica d = 22,7°W e deviazione bussola δ = 0,1°E.' },
    { n: 5, q: { corpo: 'Sole', ev: 'sorgere', src: 'calc', g: 17, m: 4, tc: '00:34:50', k: '+1:08', phi: [19, '18,2', 'S'], lam: [96, '14,5', 'W'], ag: '79,5', ab: '82,6', rv: '285', v: '16', d: [5.8, 'W'], dev: [6.4, 'E'] },
      text: 'Il giorno 17/04 al T<sub>c</sub> = 00<sup>h</sup>34<sup>m</sup>50<sup>s</sup> (K = +1<sup>m</sup>8<sup>s</sup>), dalla posizione φ = 19°18,2′S e λ = 096°14,5′W, si rileva l\'azimut del Sole al sorgere del suo lembo superiore con le bussole, ottenendo a<sub>g</sub> = 079,5° e a<sub>b</sub> = 082,6°. Verificare il buon funzionamento della gyro e della magnetica sapendo che si sta navigando con R<sub>v</sub> = 285° e V = 16 kts e date declinazione magnetica d = 5,8°W e deviazione bussola δ = 6,4°E.' },
    { n: 6, q: { corpo: 'Sole', ev: 'tramonto', src: 'calc', g: 15, m: 4, tc: '02:42:29', k: '-2:10', phi: [5, '08,4', 'N'], lam: [128, '19,8', 'W'], ag: '281,3', ab: '286,4', rv: '290', v: '13', d: [5.8, 'W'], dev: [0.5, 'W'] },
      text: 'Il giorno 15/04 al T<sub>c</sub> = 02<sup>h</sup>42<sup>m</sup>29<sup>s</sup> (K = −2<sup>m</sup>10<sup>s</sup>), dalla posizione φ = 05°08,4′N e λ = 128°19,8′W, si rileva l\'azimut del Sole al tramonto del suo lembo superiore con le bussole, ottenendo a<sub>g</sub> = 281,3° e a<sub>b</sub> = 286,4°. Verificare il buon funzionamento della gyro e della magnetica sapendo che si sta navigando con R<sub>v</sub> = 290° e V = 13 kts e date declinazione magnetica d = 5,8°W e deviazione bussola δ = 0,5°W.' },
    { n: 7, q: { corpo: 'Sole', ev: 'tramonto', src: 'testo', dec: [15, '17,2', 'S'], phi: [8, '45,1', 'N'], lam: [58, '21,9', 'E'], ag: '254,6', auto: true },
      text: 'Il giorno 07/02, dalla posizione φ = 08°45,1′N e λ = 058°21,9′E, si rileva l\'azimut del Sole al tramonto del suo lembo superiore con la gyro (munita di autocorrettore), nell\'istante in cui risulta dalle effemeridi nautiche δ = 15°17,2′S, ottenendo a<sub>g</sub> = 254,6°. Verificare il buon funzionamento della gyro.' },
    { n: 8, q: { corpo: 'Sole', ev: 'sorgere', src: 'testo', dec: [23, '01,4', 'S'], phi: [11, '05,1', 'S'], lam: [111, '21,4', 'E'], ag: '112,6', auto: true },
      text: 'Il giorno 12/12, dalla posizione φ = 11°05,1′S e λ = 111°21,4′E, si rileva l\'azimut del Sole al sorgere del suo lembo superiore con la gyro (munita di autocorrettore), nell\'istante in cui risulta dalle effemeridi nautiche δ = 23°01,4′S, ottenendo a<sub>g</sub> = 112,6°. Verificare il buon funzionamento della gyro.' },
    { n: 9, q: { corpo: 'Sole', ev: 'tramonto', src: 'testo', dec: [18, '37,3', 'S'], phi: [23, '48,3', 'N'], lam: [128, '34,8', 'W'], ag: '249,2', ab: '230,4', rv: '224', v: '14', d: [16.2, 'E'], dev: [3.3, 'E'] },
      text: 'Il giorno 15/11, dalla posizione φ = 23°48,3′N e λ = 128°34,8′W, si rileva l\'azimut del Sole al tramonto del suo lembo superiore con le bussole, nell\'istante in cui risulta dalle effemeridi nautiche δ = 18°37,3′S, ottenendo a<sub>g</sub> = 249,2° e a<sub>b</sub> = 230,4°. Verificare il buon funzionamento della gyro e della magnetica sapendo che si sta navigando con R<sub>v</sub> = 224° e V = 14 kts e date declinazione magnetica d = 16,2°E e deviazione bussola δ = 3,3°E.' },
    { n: 10, q: { corpo: 'Sole', ev: 'sorgere', src: 'testo', dec: [19, '32,8', 'N'], phi: [7, '25,5', 'N'], lam: [87, '28,3', 'E'], ab: '70,5', d: [2.4, 'W'], dev: [2, 'E'] },
      text: 'Il giorno 26/07, dalla posizione φ = 07°25,5′N e λ = 087°28,3′E, si rileva l\'azimut del Sole al sorgere del suo lembo superiore con la bussola magnetica, nell\'istante in cui risulta dalle effemeridi nautiche δ = 19°32,8′N, ottenendo a<sub>b</sub> = 070,5°. Verificare il buon funzionamento della magnetica, date declinazione magnetica d = 2,4°W e deviazione bussola δ = 2°E.' }
  ];
  var EXN = {}; EX.forEach(function (e) { EXN[e.n] = e; });
  function parseHMS(s) { var m = /^(\d{1,2})[:.h ]?(\d{2})[:.m ]?(\d{2})$/.exec(String(s).trim()); return m && +m[1] < 24 && +m[2] < 60 && +m[3] < 60 ? +m[1] * 3600 + +m[2] * 60 + +m[3] : NaN; }
  function parseK(s) { s = String(s).trim().replace('−', '-'); var m = /^([+-]?)(\d{1,2})[:.m ]?(\d{1,2})s?$/.exec(s); if (!m) { var v = pn(s); return isFinite(v) ? v : NaN; } var t = +m[2] * 60 + +m[3]; return m[1] === '-' ? -t : t; }
  function qFromEx(e) {
    var o = e.q, q = { corpo: o.corpo, ev: o.ev, sera: !!o.sera, src: o.src, y: 2015, m: o.m, g: o.g, auto: !!o.auto };
    q.tc = parseHMS(o.tc || ''); q.k = parseK(o.k || '0');
    q.phi = A(o.phi[0], pn(o.phi[1]), o.phi[2]); q.lam = A(o.lam[0], pn(o.lam[1]), o.lam[2]);
    if (o.dec) q.dec = A(o.dec[0], pn(o.dec[1]), o.dec[2]);
    q.ag = pn(o.ag); q.ab = pn(o.ab); q.rv = pn(o.rv); q.v = pn(o.v);
    q.d = o.d ? (o.d[1] === 'W' ? -o.d[0] : o.d[0]) : NaN; q.dev = o.dev ? (o.dev[1] === 'W' ? -o.dev[0] : o.dev[0]) : NaN;
    return q;
  }
  function short(R) {
    if (R.err) return '—';
    var p = ['Z<sub>v</sub> ' + az(R.Zv)];
    if (isFinite(R.eg)) p.push('gyro ' + ew(R.eg) + ' <span class="verdict ' + (R.okG ? 'ok' : 'ko') + '">' + (R.okG ? 'funziona' : 'da controllare') + '</span>');
    if (isFinite(R.Delta)) p.push('Δ ' + ew(R.Delta) + (isFinite(R.devT) ? ', δ<sub>b</sub> trovata ' + ew(R.devT) : '') + (isFinite(R.resM) ? ' <span class="verdict ' + (R.okM ? 'ok' : 'ko') + '">' + (R.okM ? 'funziona' : 'da controllare') + '</span>' : ''));
    return p.join(' · ');
  }
  function renderEx() {
    document.getElementById('es-list').innerHTML = '<div class="escards">' + EX.map(function (e) {
      return '<article class="excard" id="ex-' + e.n + '"><h3><span class="num">' + e.n + ')</span> Esercizio ' + e.n + '</h3><p>' + e.text + '</p>' +
        '<div class="exres"><span>Risultato:</span> ' + short(solve(qFromEx(e))) + '</div>' +
        '<button type="button" class="btn go" data-ex="' + e.n + '">Risolvi passo per passo →</button></article>';
    }).join('') + '</div>';
  }

  /* ---------- modulo ---------- */
  var fB = document.getElementById('f-b'), out = document.getElementById('r-b'), cur = null;
  function el(id) { return document.getElementById(id); }
  function radio(name) { var c = fB.querySelector('input[name="' + name + '"]:checked'); return c ? c.value : null; }
  function setR(name, v) { var c = fB.querySelector('input[name="' + name + '"][value="' + v + '"]'); if (c) c.checked = true; }
  function segs() { document.querySelectorAll('.seg label').forEach(function (l) { l.classList.toggle('on', l.querySelector('input').checked); }); }
  function mk(e, bad) { var fl = e.closest('.field'); if (fl) fl.classList.toggle('bad', bad); }
  function banner() {
    if (!cur) return '';
    return '<div class="exbanner"><div class="exb-top"><b>Esercizio ' + cur.n + '</b>' + (cur.mod ? '<span class="exb-mod">dati modificati</span>' : '') +
      '<button type="button" class="exb-back" data-back="' + cur.n + '">Tutti gli esercizi</button></div><p>' + cur.text + '</p></div>';
  }
  function run() {
    var ev = radio('bev'); if (ev === 'istante') setR('bsrc', 'calc');
    var src = radio('bsrc');
    el('w-cre').hidden = ev !== 'istante';
    el('w-calc').hidden = src !== 'calc'; el('w-testo').hidden = src !== 'testo';
    fB.querySelector('input[name="bsrc"][value="testo"]').disabled = ev === 'istante';
    segs();
    var bad = false;
    function need(id, chk) { var e = el(id), v = pn(e.value), b = !isFinite(v) || (chk && !chk(v)); mk(e, b); if (b) bad = true; return v; }
    function opt(id) { var e = el(id); if (e.value.trim() === '') { mk(e, false); return NaN; } return need(id); }
    var q = { corpo: el('b-corpo').value, ev: ev, src: src, sera: false, auto: el('b-auto').checked };
    if (src === 'calc') {
      q.g = need('b-g', function (v) { return v >= 1 && v <= 31; }); q.m = need('b-m', function (v) { return v >= 1 && v <= 12; }); q.y = need('b-y', function (v) { return v >= 1900 && v <= 2100; });
      q.tc = parseHMS(el('b-tc').value); mk(el('b-tc'), !isFinite(q.tc)); if (!isFinite(q.tc)) bad = true;
      q.k = parseK(el('b-k').value || '0'); mk(el('b-k'), !isFinite(q.k)); if (!isFinite(q.k)) bad = true;
      if (ev === 'istante') q.sera = radio('bcre') === 'sera';
    } else {
      var dg = need('b-dg', function (v) { return v >= 0 && v < 90; }), dp = need('b-dp', function (v) { return v >= 0 && v < 60; });
      q.dec = (radio('bdns') === 'S' ? -1 : 1) * (dg + dp / 60);
    }
    var fg = need('b-fg', function (v) { return v >= 0 && v < 90; }), fp = need('b-fp', function (v) { return v >= 0 && v < 60; });
    q.phi = (radio('bfns') === 'S' ? -1 : 1) * (fg + fp / 60);
    var lg = need('b-lg', function (v) { return v >= 0 && v <= 180; }), lp = need('b-lp', function (v) { return v >= 0 && v < 60; });
    q.lam = (radio('blew') === 'W' ? -1 : 1) * (lg + lp / 60);
    q.ag = opt('b-ag'); q.ab = opt('b-ab'); q.rv = opt('b-rv'); q.v = opt('b-v');
    var d = opt('b-d'), dv = opt('b-dev');
    q.d = (radio('bdew') === 'W' ? -1 : 1) * d; q.dev = (radio('bvew') === 'W' ? -1 : 1) * dv;
    if (bad) { out.innerHTML = banner() + errBox('Completa i campi evidenziati (ore come 11:05:10, K come −1:05).'); return; }
    if (!isFinite(q.ag) && !isFinite(q.ab)) { out.innerHTML = banner() + errBox('Scrivi almeno un rilevamento: a<sub>g</sub> o a<sub>b</sub>.'); return; }
    out.innerHTML = banner() + render(solve(q));
  }
  function setV(id, v) { el(id).value = v == null ? '' : v; }
  function load(nn, stay) {
    var e = EXN[nn]; if (!e) return; var o = e.q;
    el('b-corpo').value = o.corpo; setR('bev', o.ev); setR('bcre', o.sera === false ? 'mattino' : 'sera'); setR('bsrc', o.src);
    setV('b-g', o.g); setV('b-m', o.m); setV('b-y', 2015); setV('b-tc', o.tc); setV('b-k', o.k);
    if (o.dec) { setV('b-dg', o.dec[0]); setV('b-dp', o.dec[1]); setR('bdns', o.dec[2]); }
    setV('b-fg', o.phi[0]); setV('b-fp', o.phi[1]); setR('bfns', o.phi[2]);
    setV('b-lg', o.lam[0]); setV('b-lp', o.lam[1]); setR('blew', o.lam[2]);
    setV('b-ag', o.ag); setV('b-ab', o.ab); setV('b-rv', o.rv); setV('b-v', o.v); el('b-auto').checked = !!o.auto;
    setV('b-d', o.d ? String(o.d[0]).replace('.', ',') : ''); setR('bdew', o.d ? o.d[1] : 'E');
    setV('b-dev', o.dev ? String(o.dev[0]).replace('.', ',') : ''); setR('bvew', o.dev ? o.dev[1] : 'E');
    cur = { n: e.n, text: e.text, mod: false, sera: !!o.sera };
    run();
    if (!stay) { show('calc'); var nav = document.querySelector('.tabs'); if (nav && nav.scrollIntoView) nav.scrollIntoView({ block: 'start' }); }
  }
  var tabs = document.querySelectorAll('.tab');
  function show(sec) {
    tabs.forEach(function (b) { var on = b.getAttribute('data-sec') === sec; b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; el('sec-' + b.getAttribute('data-sec')).hidden = !on; });
    try { localStorage.setItem('bu-tab', sec); } catch (e) {}
  }
  tabs.forEach(function (b) { b.addEventListener('click', function () { show(b.getAttribute('data-sec')); }); });
  fB.addEventListener('input', function () { if (cur) cur.mod = true; run(); });
  fB.addEventListener('change', function () { if (cur) cur.mod = true; run(); });
  fB.addEventListener('submit', function (e) { e.preventDefault(); });
  el('b-reset').addEventListener('click', function () { load(1, true); });
  document.addEventListener('click', function (e) {
    var g = e.target.closest('[data-ex]'); if (g) { load(+g.getAttribute('data-ex')); return; }
    var b = e.target.closest('.exb-back');
    if (b) { show('es'); var c = el('ex-' + b.getAttribute('data-back')); if (c && c.scrollIntoView) c.scrollIntoView({ block: 'start' }); }
  });
  el('teo-f').outerHTML = eqs(['T<sub>m</sub>Gr = T<sub>c</sub> + K', 'cos Z = ' + fr('sen δ', 'cos φ') + ' (sorgere: Z<sub>v</sub> = Z, tramonto: Z<sub>v</sub> = 360° − Z)',
    't = t<sub>Gr</sub> + λ    tan Z = ' + fr('sen t', 'tan δ · cos φ − sen φ · cos t'), 'e<sub>g</sub> = Z<sub>v</sub> − a<sub>g</sub>    δ<sub>v</sub> = ' + fr('V · cos R<sub>v</sub>', '5π · cos φ'),
    'Δ = Z<sub>v</sub> − a<sub>b</sub>    δ<sub>b</sub> = Δ − d']);
  renderEx(); load(1, true); cur = null; run();
  var start = 'es', h = (location.hash || '').replace('#', '');
  if (['es', 'calc', 'teo'].indexOf(h) >= 0) start = h; else { try { var sv = localStorage.getItem('bu-tab'); if (['es', 'calc', 'teo'].indexOf(sv) >= 0) start = sv; } catch (e) {} }
  show(start);
})();
