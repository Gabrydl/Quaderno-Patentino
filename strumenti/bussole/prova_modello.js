// node prova_modello.js — prova del modello sugli esercizi 7–10 (δ data dal testo) e controllo delle effemeridi
const B = require('./modello.js');
const S = (g, m, ns) => (ns === 'S' || ns === 'W' ? -1 : 1) * (g + m / 60);
const es = [
  { n: 7, phi: S(8, 45.1, 'N'), dec: S(15, 17.2, 'S'), ev: 'tramonto', ag: 254.6 },
  { n: 8, phi: S(11, 5.1, 'S'), dec: S(23, 1.4, 'S'), ev: 'sorgere', ag: 112.6 },
  { n: 9, phi: S(23, 48.3, 'N'), dec: S(18, 37.3, 'S'), ev: 'tramonto', ag: 249.2, ab: 230.4, d: 16.2, devNota: 3.3, V: 14, Rv: 224 },
  { n: 10, phi: S(7, 25.5, 'N'), dec: S(19, 32.8, 'N'), ev: 'sorgere', ab: 70.5, d: -2.4, devNota: 2.0 },
];
for (const e of es) {
  const a = B.azimutAmpiezza(e.phi, e.dec, e.ev);
  const r = B.errori({ Zv: a.Zv, ag: e.ag, ab: e.ab, d: e.d, devNota: e.devNota });
  let t = `es ${e.n}: cos Z = ${a.cosZ.toFixed(5)}  Zv = ${a.Zv.toFixed(1)}°`;
  if (r.eg !== undefined) t += `  errore gyro ${B.ew(r.eg)}`;
  if (r.Delta !== undefined) t += `  Δ ${B.ew(r.Delta)}  δ calcolata ${B.ew(r.dev)} (nota ${B.ew(e.devNota)}, diff ${B.ew(r.residuo)})`;
  if (e.V) t += `  [err. velocità ${B.erroreVelocita(e.V, e.Rv, e.phi).toFixed(2)}° — da confermare]`;
  console.log(t);
}
// controllo effemeridi: equinozio 20/03/2024 03:06 TU → δ Sole ≈ 0°
const q = B.effemeridi('Sole', new Date(Date.UTC(2024, 2, 20, 3, 6)));
console.log('equinozio 2024: δ Sole', B.gm(q.dec).txt, ' t Gr', q.tGr.toFixed(2) + '°');
// esercizio 1 con l'anno sconosciuto: solo per mostrare il calcolo (servono gli estratti del Cap. 4)
const t1 = B.tuDa({ y: 2026, m: 4, d: 18 }, 11 * 3600 + 5 * 60 + 10, -65);
const e1 = B.effemeridi('Sole', t1);
console.log('es 1 (anno 2026, NON quello del libro): TU', t1.toISOString().slice(11, 19), ' δ', B.gm(e1.dec).txt, ' t Gr', B.gm(e1.tGr).txt);
