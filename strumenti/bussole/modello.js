/* Controllo delle bussole – MODELLO DI CALCOLO (bozza, ancora senza pagina).
   Da completare quando arrivano: foto degli estratti delle effemeridi del Capitolo 4 (esercizi 1–6)
   e un esercizio svolto dal professore (metodo per il lembo superiore, errore di velocità della gyro).
   Effemeridi calcolate con Astronomy Engine (lib/astronomy.browser.min.js, MIT, precisione ±1′).
   Funziona sia nel browser (window.Bussole) sia in Node (module.exports). */
(function (root) {
  'use strict';
  var A = root.Astronomy || (typeof require === 'function' ? require('./lib/astronomy.browser.min.js') : null);
  var RAD = Math.PI / 180;
  function norm360(x) { x %= 360; return x < 0 ? x + 360 : x; }
  function norm180(x) { x = norm360(x); return x > 180 ? x - 360 : x; }

  /* ---------- tempo: Tc + K = tempo medio di Greenwich (TU) ---------- */
  // data: {y, m, d}; tc: secondi del giorno letti al cronometro; k: correzione in secondi (con segno)
  function tuDa(data, tc, k) {
    var s = tc + (k || 0);
    return new Date(Date.UTC(data.y, data.m - 1, data.d, 0, 0, 0) + s * 1000);
  }

  /* ---------- effemeridi calcolate (qualsiasi anno) ---------- */
  var CORPI = { Sole: 'Sun', Luna: 'Moon', Venere: 'Venus', Marte: 'Mars', Giove: 'Jupiter', Saturno: 'Saturn' };
  // δ (declinazione, gradi, + Nord) e t Gr (angolo orario di Greenwich, gradi verso W) del corpo all'istante TU
  function effemeridi(corpo, date) {
    var body = A.Body[CORPI[corpo] || corpo];
    var time = A.MakeTime(date);
    var obs = new A.Observer(0, 0, 0);
    var eq = A.Equator(body, time, obs, true, true);            // equatoriali "of date", con aberrazione
    var gast = A.SiderealTime(time);                             // ore
    var tGr = norm360(gast * 15 - eq.ra * 15);                   // angolo orario di Greenwich
    return { dec: eq.dec, tGr: tGr, ra: eq.ra, gast: gast };
  }

  /* ---------- azimut ---------- */
  // Azimut vero al sorgere/tramonto astronomico (centro all'orizzonte vero): cos Zv = sen δ / cos φ
  function azimutAmpiezza(phi, dec, evento) {
    var c = Math.sin(dec * RAD) / Math.cos(phi * RAD);
    if (Math.abs(c) > 1) return { err: 'il corpo non sorge o non tramonta a questa latitudine' };
    var z = Math.acos(c) / RAD;                                  // da N verso E
    var Zv = evento === 'tramonto' ? 360 - z : z;
    var amp = 90 - z;                                            // ampiezza dal punto cardinale E/W (+ verso N)
    return { cosZ: c, z: z, Zv: Zv, ampiezza: amp };
  }
  // Azimut vero a un istante qualsiasi (pianeti al crepuscolo): t = angolo orario locale (gradi verso W)
  function azimutIstante(phi, dec, tLoc) {
    var P = phi * RAD, D = dec * RAD, T = tLoc * RAD;
    var y = -Math.sin(T) * Math.cos(D);
    var x = Math.sin(D) * Math.cos(P) - Math.cos(D) * Math.sin(P) * Math.cos(T);
    var Zv = norm360(Math.atan2(y, x) / RAD);
    var h = Math.asin(Math.sin(P) * Math.sin(D) + Math.cos(P) * Math.cos(D) * Math.cos(T)) / RAD;
    return { Zv: Zv, h: h };
  }

  /* ---------- errori delle bussole ---------- */
  // Convenzione: errore positivo = Est (Zv = Zb + errore)
  function errori(o) {
    var r = {};
    if (isFinite(o.ag)) r.eg = norm180(o.Zv - o.ag);                       // errore della girobussola
    if (isFinite(o.ab)) {
      r.Delta = norm180(o.Zv - o.ab);                                        // variazione totale Δ = d + δ
      if (isFinite(o.d)) r.dev = r.Delta - o.d;                              // deviazione calcolata
      if (isFinite(o.d) && isFinite(o.devNota)) r.residuo = r.dev - o.devNota;  // confronto con la tabella delle deviazioni
    }
    return r;
  }
  // Errore di velocità della gyro senza autocorrettore (formula classica, DA CONFERMARE con gli appunti):
  // δv ≈ V · cos Rv / (5π · cos φ) in gradi; positivo = la gyro indica troppo (errore W) con rotta verso N
  function erroreVelocita(V, Rv, phi) {
    return V * Math.cos(Rv * RAD) / (5 * Math.PI * Math.cos(phi * RAD));
  }

  /* ---------- formato ---------- */
  function gm(x) { var s = x < 0 ? -1 : 1, a = Math.abs(x), g = Math.floor(a), m = (a - g) * 60; if (m >= 59.95) { g++; m = 0; } return { s: s, g: g, m: m, txt: g + '°' + m.toFixed(1).replace('.', ',') + '′' }; }
  function ew(x) { return (Math.abs(x) < 0.05 ? '0,0°' : Math.abs(x).toFixed(1).replace('.', ',') + '°' + (x > 0 ? 'E' : 'W')); }

  var api = { tuDa: tuDa, effemeridi: effemeridi, azimutAmpiezza: azimutAmpiezza, azimutIstante: azimutIstante,
    errori: errori, erroreVelocita: erroreVelocita, gm: gm, ew: ew, norm360: norm360, norm180: norm180 };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.Bussole = api;
})(typeof window !== 'undefined' ? window : globalThis);
