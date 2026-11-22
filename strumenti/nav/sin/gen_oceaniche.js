// Pilot chart e Routeing chart d'esempio (Atlantico settentrionale, gennaio) per il Quaderno.
// Coste reali (Natural Earth 1:50M), proiezione di Mercatore come le carte vere.
// Zone del bordo libero dalle coordinate della Convenzione Load Lines 1966 (Annesso II).
const fs = require('fs');
const d3 = require('d3-geo');
const { contours } = require('d3-contour');
const topo = require('topojson-client');
const OUT = process.argv[2] || '.';
const W = 1000, H = 760;
const R = (x) => Math.round(x * 10) / 10;
const rad = Math.PI / 180;

const proj = d3.geoMercator();
proj.fitExtent([[0, 0], [W, H]], { type: 'MultiPoint', coordinates: [[-86, -1], [9, 67]] });
proj.clipExtent([[0, 0], [W, H]]);
const path = d3.geoPath(proj).digits(1);
const world = JSON.parse(fs.readFileSync(require.resolve('world-atlas/countries-50m.json')));
const land = topo.feature(world, world.objects.land);
const isSea = (lon, lat) => !d3.geoContains(land, [lon, lat]);
const P = (lon, lat) => proj([lon, lat]);
const lineD = (pts) => 'M' + pts.map(p => R(p[0]) + ',' + R(p[1])).join('L');
const ll2 = (pts) => pts.map(([lo, la]) => P(lo, la));
// linea lossodromica = retta in Mercatore; per i tratti lunghi la densifico comunque
function rhumb(a, b, n = 20) { const o = []; for (let i = 0; i <= n; i++) o.push([a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]); return o; }
function gc(a, b, n = 60) { const it = d3.geoInterpolate(a, b); const o = []; for (let i = 0; i <= n; i++) o.push(it(i / n)); return o; }
const nm = (a, b) => d3.geoDistance(a, b) * 180 / Math.PI * 60;     // miglia nautiche sul cerchio massimo
function lab(x, y, t, anchor = 'start', style = '') { return `<text x="${R(x)}" y="${R(y)}" text-anchor="${anchor}" style="font-size:11px;${style}">${t}</text>`; }
function arrowPath(pts, col, w = 1.8, head = 7) {
  const [a, b] = [pts[pts.length - 2], pts[pts.length - 1]]; const an = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const hx = b[0] - head * Math.cos(an), hy = b[1] - head * Math.sin(an), px = -Math.sin(an) * head * 0.45, py = Math.cos(an) * head * 0.45;
  return `<path d="${lineD(pts.slice(0, -1).concat([[hx, hy]]))}" style="fill:none;stroke:${col};stroke-width:${w};stroke-linecap:round;stroke-linejoin:round"/><path d="M${R(b[0])},${R(b[1])}L${R(hx + px)},${R(hy + py)}L${R(hx - px)},${R(hy - py)}Z" style="fill:${col}"/>`;
}
function frame(title, sub) {
  const g = [];
  g.push(`<rect x="0" y="0" width="${W}" height="${H}" style="fill:color-mix(in srgb,var(--blue) 5%,var(--sheet))"/>`);
  g.push(`<path d="${path(land)}" style="fill:color-mix(in srgb,var(--orange) 11%,var(--sheet));stroke:color-mix(in srgb,currentColor 55%,transparent);stroke-width:.75"/>`);
  return g;
}
function graticule(step, labels) {
  const g = [], ls = [];
  for (let lo = -85; lo <= 10; lo += step) { if (lo % step) continue; g.push(lineD(ll2([[lo, -2], [lo, 70]]))); }
  for (let la = 0; la <= 65; la += step) g.push(lineD(ll2([[-90, la], [12, la]])));
  const out = [`<path d="${g.join('')}" style="fill:none;stroke:color-mix(in srgb,var(--blue) 30%,transparent);stroke-width:.6"/>`];
  if (labels) {
    for (let lo = -80; lo <= 0; lo += 10) { const [x] = P(lo, 0); if (x > 15 && x < W - 15) ls.push(lab(x, H - 5, `${Math.abs(lo)}°${lo < 0 ? 'W' : ''}`, 'middle', 'fill:var(--muted);font-size:9.5px')); }
    for (let la = 10; la <= 60; la += 10) { const [, y] = P(0, la); ls.push(lab(W - 4, y - 3, `${la}°N`, 'end', 'fill:var(--muted);font-size:9.5px')); }
  }
  return out.concat(ls);
}
function titleBox(l1, l2, l3, w = 360) {
  return `<g><rect x="8" y="${H - 70}" width="${w}" height="60" rx="6" style="fill:var(--sheet);stroke:var(--line)"/>` +
    `<text x="18" y="${H - 48}" style="font-size:13.5px;font-weight:800;letter-spacing:.04em;stroke:none">${l1}</text>` +
    `<text x="18" y="${H - 32}" style="font-size:10.5px;fill:var(--muted);stroke:none">${l2}</text>` +
    `<text x="18" y="${H - 18}" style="font-size:10.5px;fill:var(--muted);stroke:none">${l3}</text></g>`;
}
const callouts = [];
function CALL(n, lon, lat, dx = 0, dy = 0) { const [x, y] = P(lon, lat); return `<g><circle cx="${R(x + dx)}" cy="${R(y + dy)}" r="9.5" style="fill:var(--orange);stroke:var(--sheet);stroke-width:2"/><text x="${R(x + dx)}" y="${R(y + dy + 4.2)}" text-anchor="middle" style="font-size:${n > 9 ? 10.5 : 12}px;font-weight:800;fill:var(--sheet);stroke:none">${n}</text></g>`; }

// ---------------- climatologia d'esempio (gennaio) ----------------
const DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
function windClim(lon, lat) {
  // percentuali per direzione di PROVENIENZA, forza Beaufort media, % calme
  let f, F, calm;
  if (lat >= 45) { f = [8, 5, 5, 8, 11, 22, 25, 16]; F = [5, 5, 5, 6, 6, 7, 7, 6]; calm = 1; }
  else if (lat >= 35) { f = [12, 8, 7, 8, 10, 16, 20, 19]; F = [4, 4, 4, 5, 5, 5, 6, 5]; calm = 3; }
  else if (lat >= 25) { f = [17, 22, 14, 8, 7, 8, 11, 13]; F = [4, 4, 4, 4, 4, 4, 4, 4]; calm = 7; }
  else { f = [12, 46, 30, 6, 1, 1, 1, 3]; F = [4, 5, 4, 4, 3, 3, 3, 3]; calm = 2; }
  if (lat >= 30 && lat < 45 && lon > -25) { f = [32, 16, 6, 5, 6, 9, 11, 15]; F = [4, 4, 3, 4, 4, 4, 4, 4]; calm = 5; }   // aliseo portoghese
  if (lat < 10) { f = [8, 38, 34, 10, 4, 2, 2, 2]; F = [3, 4, 4, 3, 3, 2, 2, 2]; calm = 6; }
  return { f, F, calm };
}
// rosa dei venti stile pilot chart: frecce che "volano col vento" verso il centro, lunghezza = %, piume = forza Beaufort
function rosePilot(x, y, c) {
  const o = [];
  DIRS.forEach((d, i) => {
    const p = c.f[i]; if (p < 2) return;
    const th = i * 45 * rad, dx = Math.sin(th), dy = -Math.cos(th);
    const Lmax = 30, L = Math.min(p * 0.95, Lmax), cut = p * 0.95 > Lmax;
    const x1 = x + dx * 5.2, y1 = y + dy * 5.2, x2 = x + dx * (5.2 + L), y2 = y + dy * (5.2 + L);
    o.push(`<path d="M${R(x2)},${R(y2)}L${R(x1)},${R(y1)}" style="stroke:var(--blue);stroke-width:1.4"/>`);
    if (p >= 5) {
      const px = -dy, py = dx;
      for (let k = 0; k < c.F[i]; k++) {
        const sd = (k % 2 ? -1 : 1), pos = 5.2 + L - Math.floor(k / 2) * 3;
        const bx = x + dx * pos, by = y + dy * pos;
        o.push(`<path d="M${R(bx)},${R(by)}l${R(px * 3.6 * sd + dx * 2.2)},${R(py * 3.6 * sd + dy * 2.2)}" style="stroke:var(--blue);stroke-width:.85"/>`);
      }
    }
    if (cut) o.push(`<text x="${R(x2 + dx * 7)}" y="${R(y2 + dy * 7 + 2.6)}" text-anchor="middle" style="font-size:7.5px;font-weight:700;fill:var(--blue);stroke-width:2px">${p}</text>`);
  });
  o.push(`<circle cx="${R(x)}" cy="${R(y)}" r="5.4" style="fill:var(--sheet);stroke:var(--blue);stroke-width:1.1"/>`, `<text x="${R(x)}" y="${R(y + 2.6)}" text-anchor="middle" style="font-size:7px;font-weight:700;fill:var(--blue);stroke:none">${c.calm}</text>`);
  return o.join('');
}
// rosa stile routeing chart: frecce senza piume, lunghezza = %, numero al centro = calme
function roseRouteing(x, y, c) {
  const o = [`<circle cx="${R(x)}" cy="${R(y)}" r="6" style="fill:var(--sheet);stroke:var(--green);stroke-width:1.2"/>`,
    `<text x="${R(x)}" y="${R(y + 2.8)}" text-anchor="middle" style="font-size:7.4px;font-weight:700;fill:var(--green);stroke:none">${c.calm}</text>`];
  DIRS.forEach((d, i) => {
    const p = c.f[i]; if (p < 2) return;
    const th = i * 45 * rad, dx = Math.sin(th), dy = -Math.cos(th), L = Math.min(p * 0.75, 30);
    const x1 = x + dx * 6, y1 = y + dy * 6, x2 = x + dx * (6 + L), y2 = y + dy * (6 + L);
    o.push(`<path d="M${R(x2)},${R(y2)}L${R(x1)},${R(y1)}" style="stroke:var(--green);stroke-width:${p >= 15 ? 2.6 : 1.4};stroke-linecap:round"/>`);
  });
  return o.join('');
}

// correnti (direzione, velocità media in nodi)
const currents = [
  { n: 'Corrente della Florida', pts: [[-81.5, 24.4], [-80.0, 25.6], [-79.8, 27.5], [-80.0, 30.2]], v: '2,5' },
  { n: 'Corrente del Golfo', pts: [[-79.2, 32.0], [-75.5, 35.0], [-71.0, 37.6], [-65.0, 39.0], [-58.0, 40.2]], v: '2,0' },
  { n: 'Deriva nord-atlantica', pts: [[-48.0, 43.0], [-40.0, 46.0], [-30.0, 49.0], [-20.0, 52.0], [-12.0, 55.5]], v: '0,6' },
  { n: 'Corrente del Labrador', pts: [[-58.0, 57.0], [-54.5, 52.5], [-51.5, 48.5], [-50.5, 45.0]], v: '0,7' },
  { n: 'Corrente delle Canarie', pts: [[-13.0, 41.0], [-15.5, 35.0], [-18.0, 29.5], [-21.0, 24.0]], v: '0,5' },
  { n: 'Corrente nord-equatoriale', pts: [[-24.0, 18.5], [-36.0, 16.8], [-48.0, 15.6], [-60.0, 14.8], [-70.0, 15.0]], v: '0,8' },
  { n: 'Controcorrente equatoriale', pts: [[-48.0, 6.5], [-38.0, 6.2], [-28.0, 6.0]], v: '0,4' },
];
function drawCurrents(col, labels) {
  const o = [];
  for (const c of currents) {
    const pts = ll2(c.pts);
    // frecce corte in sequenza, come sulle carte
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], mid = [a[0] + (b[0] - a[0]) * 0.15, a[1] + (b[1] - a[1]) * 0.15], end = [a[0] + (b[0] - a[0]) * 0.85, a[1] + (b[1] - a[1]) * 0.85];
      o.push(arrowPath([mid, end], col, 2, 7));
    }
    if (labels) { const m = pts[Math.floor(pts.length / 2)]; o.push(lab(m[0], m[1] - 6, c.v, 'middle', `fill:${col};font-weight:700;font-size:10.5px;stroke-width:3px`)); }
  }
  return o;
}
// limiti dei ghiacci (gennaio, medi)
const iceberg = [[-56.0, 53.5], [-50.0, 51.0], [-46.0, 48.5], [-44.5, 46.0], [-46.0, 43.2], [-49.0, 41.6], [-52.0, 42.0], [-54.0, 44.3], [-55.5, 46.5]];
const pack = [[-63.0, 58.5], [-58.5, 56.0], [-55.0, 53.3], [-53.0, 51.5], [-55.5, 49.6]];
function drawIce() {
  return [`<path d="${lineD(ll2(iceberg))}" style="fill:none;stroke:var(--violet);stroke-width:2;stroke-dasharray:8 3 2 3"/>`,
    `<path d="${lineD(ll2(pack))}" style="fill:none;stroke:var(--violet);stroke-width:2.6;stroke-dasharray:2 3"/>`];
}

// ================================================================== PILOT CHART
{
  const o = [`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Pilot chart d'esempio dell'Atlantico settentrionale a gennaio" xmlns="http://www.w3.org/2000/svg">`, `<defs><clipPath id="pc-clip"><rect width="${W}" height="${H}"/></clipPath></defs><g clip-path="url(#pc-clip)">`];
  o.push(...frame()); o.push(...graticule(5, true));
  // onde >= 12 piedi (%): linee rosse
  const G = 4, nx = Math.ceil(W / G) + 1, ny = Math.ceil(H / G) + 1, val = new Float64Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const [lo, la] = proj.invert([i * G, j * G]); val[j * nx + i] = 46 * Math.exp(-(((la - 55) / 9) ** 2) - (((lo + 32) / 24) ** 2)) + 8 * Math.exp(-(((la - 42) / 6) ** 2) - (((lo + 55) / 12) ** 2)); }
  const cs = contours().size([nx, ny]).thresholds([10, 20, 30, 40])(Array.from(val));
  for (const mp of cs) for (const poly of mp.coordinates) for (const ring of poly) {
    const pts = ring.map(([x, y]) => [(x - 0.5) * G, (y - 0.5) * G]);
    o.push(`<path d="${lineD(pts)}Z" style="fill:none;stroke:var(--red);stroke-width:1.6"/>`);
    const top = pts.reduce((a, b) => (b[1] < a[1] ? b : a));
    o.push(lab(top[0], top[1] + 4, `${mp.value}%`, 'middle', 'fill:var(--red);font-weight:700;font-size:10px;stroke-width:3px'));
  }
  // declinazione magnetica (valori indicativi), linee isogone viola tratteggiate
  const MV = [[-74, 40.7, -12.8], [-52.7, 47.5, -17.5], [-22, 64, -11], [-45, 60, -24], [-27, 38.7, -7], [-9, 38.7, -1], [-15, 28, -3.5], [-23.5, 15, -9], [-66, 18.4, -12.5], [-80, 25.8, -6.7], [-64.8, 32.3, -14], [-59.6, 13, -15], [-52, 5, -18], [-30, 5, -17], [-10, 5, -6], [-5, 50, -1.5], [-30, 50, -14], [-50, 35, -16], [-40, 20, -15], [-75, 10, -9], [-85, 30, -4], [-40, 55, -21], [-15, 55, -6], [-60, 55, -20]];
  const basis = (lo, la) => { const x = (lo + 40) / 45, y = (la - 32) / 32; return [1, x, y, x * x, x * y, y * y, x * x * x, x * x * y, x * y * y, y * y * y]; };
  const nb = 10, A = Array.from({ length: nb }, () => new Array(nb).fill(0)), bv = new Array(nb).fill(0);
  for (const [a, b, v] of MV) { const f = basis(a, b); for (let i = 0; i < nb; i++) { bv[i] += f[i] * v; for (let j = 0; j < nb; j++) A[i][j] += f[i] * f[j]; } }
  for (let i = 0; i < nb; i++) A[i][i] += 1e-3;
  for (let i = 0; i < nb; i++) { let piv = i; for (let r = i + 1; r < nb; r++) if (Math.abs(A[r][i]) > Math.abs(A[piv][i])) piv = r; [A[i], A[piv]] = [A[piv], A[i]]; [bv[i], bv[piv]] = [bv[piv], bv[i]];
    for (let r = 0; r < nb; r++) if (r !== i) { const k = A[r][i] / A[i][i]; for (let c = i; c < nb; c++) A[r][c] -= k * A[i][c]; bv[r] -= k * bv[i]; } }
  const coef = bv.map((v, i) => v / A[i][i]);
  const mv = (lo, la) => basis(lo, la).reduce((s_, f, i) => s_ + f * coef[i], 0);
  console.log('decl. controllo NY', mv(-74, 40.7).toFixed(1), 'Lisbona', mv(-9, 38.7).toFixed(1), 'Azzorre', mv(-27, 38.7).toFixed(1), 'Bermuda', mv(-64.8, 32.3).toFixed(1), 'Reykjavik', mv(-22, 64).toFixed(1));
  const G2 = 8, mx = Math.ceil(W / G2) + 1, my = Math.ceil(H / G2) + 1, mval = new Float64Array(mx * my);
  for (let j = 0; j < my; j++) for (let i = 0; i < mx; i++) { const [lo, la] = proj.invert([i * G2, j * G2]); mval[j * mx + i] = -mv(lo, la); }
  const ms = contours().size([mx, my]).smooth(true).thresholds([0, 5, 10, 15, 20, 25])(Array.from(mval));
  for (const mp of ms) for (const poly of mp.coordinates) for (const ring of poly) {
    const inDom = ([x, y]) => { if (x < 3 || y < 3 || x > W - 3 || y > H - 3) return false; const [lo, la] = proj.invert([x, y]); return lo > -82 && lo < 2 && la > 4 && la < 62; };
    const all = ring.map(([x, y]) => [(x - 0.5) * G2, (y - 0.5) * G2]);
    const segs = []; let cur = [];
    for (const q of all) { if (inDom(q)) cur.push(q); else { if (cur.length > 8) segs.push(cur); cur = []; } }
    if (cur.length > 8) segs.push(cur);
    for (const pts of segs) {
      o.push(`<path d="${lineD(pts)}" style="fill:none;stroke:var(--violet);stroke-width:1.1;stroke-dasharray:6 4"/>`);
      const m = pts[Math.floor(pts.length * 0.5)];
      o.push(lab(m[0] + 4, m[1], mp.value ? `${mp.value}°W` : '0°', 'start', 'fill:var(--violet);font-size:9.5px;stroke-width:2.6px'));
    }
  }
  o.push(...drawIce());
  o.push(...drawCurrents('var(--green)', true));
  // rotte per cerchio massimo con distanza
  const routes = [[[-73.83, 40.47], [-6.45, 49.87], 'New York – Bishop Rock'], [[-73.83, 40.47], [-5.75, 35.95], 'New York – Gibilterra']];
  for (const [a, b, n] of routes) {
    const pts = ll2(gc(a, b)); o.push(`<path d="${lineD(pts)}" style="fill:none;stroke:currentColor;stroke-width:1.4;stroke-dasharray:1 0"/>`);
    const m = pts[24]; o.push(lab(m[0], m[1] - 6, `${Math.round(nm(a, b))} M`, 'middle', 'font-weight:700;font-size:10.5px;stroke-width:3px'));
  }
  // rose dei venti nei quadrati di 5° (una ogni 10° per leggibilità)
  for (let la = 7.5; la <= 62.5; la += 10) for (let lo = -77.5; lo <= 2.5; lo += 10) {
    if (!isSea(lo, la)) continue; const [x, y] = P(lo, la); if (x < 30 || x > W - 30 || y < 30 || y > H - 80) continue;
    if (Math.abs(lo + 47.5) < 3 && Math.abs(la - 47.5) < 3) continue;   // lascia leggibile il limite dei ghiacci
    o.push(rosePilot(x, y, windClim(lo, la)));
  }
  o.push(CALL(1, -32.5, 22.5, 22, -22), CALL(2, -32, 55, 0, 0), CALL(3, -72, 33.5, 0, 0), CALL(4, -47, 47.6, 18, 8), CALL(5, -23, 36, 0, 0), CALL(6, -40, 39.5, 0, 0));
  o.push('</g>');
  o.push(titleBox('PILOT CHART · ATLANTICO NORD · GENNAIO', 'Medie climatiche del mese · proiezione di Mercatore', 'Esempio didattico · valori indicativi', 330));
  o.push(`<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" style="fill:none;stroke:currentColor"/></svg>`);
  fs.writeFileSync(`${OUT}/pilot_chart.svg`, o.join('\n'));
}

// ================================================================== ROUTEING CHART
{
  const o = [`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Routeing chart d'esempio dell'Atlantico settentrionale a gennaio" xmlns="http://www.w3.org/2000/svg">`, `<defs><clipPath id="rc-clip"><rect width="${W}" height="${H}"/></clipPath></defs><g clip-path="url(#rc-clip)">`];
  o.push(`<rect x="0" y="0" width="${W}" height="${H}" style="fill:color-mix(in srgb,var(--blue) 5%,var(--sheet))"/>`);
  // zone del bordo libero (ILLC 1966, Annesso II)
  const torinana = [-9.30, 43.06];
  const wsz1 = [[-50, 72], [-50, 45], [-15, 45], [-15, 60], [0, 60], [0, 72]];
  const wsz2 = [[-68.5, 46], [-68.5, 40]].concat(rhumb([-68.5, 40], [-73, 36], 4)).concat([[-25, 36]]).concat(rhumb([-25, 36], torinana, 12)).concat([[-9.3, 45], [-15, 45], [-15, 60], [0, 60], [0, 62], [10, 62], [10, 48], [-9.3, 48]]);
  const trop = [[-90, 13], [-60, 13]].concat(rhumb([-60, 13], [-58, 10], 3)).concat([[-20, 10], [-20, 30], [-9.6, 30]]);
  o.push(`<path d="${lineD(ll2([[-68.5, 44.4], [-68.5, 40], [-73, 36], [-25, 36]].concat(rhumb([-25, 36], torinana, 12)).concat([[-1.5, 43.4], [3, 49], [10, 54], [10, 75], [-68.5, 75]])))}Z" style="fill:color-mix(in srgb,var(--blue) 10%,transparent);stroke:none"/>`);
  o.push(`<path d="${lineD(ll2([[-50, 75], [-50, 45], [-15, 45], [-15, 60], [0, 60], [0, 75]]))}Z" style="fill:color-mix(in srgb,var(--blue) 22%,transparent);stroke:none"/>`);
  o.push(`<path d="${lineD(ll2([[-90, 13], [-60, 13], [-58, 10], [-20, 10], [-20, 30], [-5, 30], [-5, -5], [-90, -5]]))}Z" style="fill:color-mix(in srgb,var(--red) 10%,transparent);stroke:none"/>`);
  o.push(`<path d="${path(land)}" style="fill:color-mix(in srgb,var(--orange) 11%,var(--sheet));stroke:color-mix(in srgb,currentColor 55%,transparent);stroke-width:.75"/>`);
  o.push(...graticule(10, true));
  const zl = (pts) => `<path d="${lineD(ll2(pts))}" style="fill:none;stroke:var(--blue);stroke-width:2.4;stroke-dasharray:14 4 3 4"/>`;
  o.push(zl(wsz1.slice(0, 5)), zl([[-68.5, 46], [-68.5, 40], [-73, 36], [-25, 36]].concat(rhumb([-25, 36], torinana, 12))));
  o.push(`<path d="${lineD(ll2(trop))}" style="fill:none;stroke:var(--red);stroke-width:2.4;stroke-dasharray:14 4 3 4"/>`);
  const zt = (lo, la, t1, t2, col) => { const [x, y] = P(lo, la); return lab(x, y, t1, 'middle', `fill:${col};font-weight:800;font-size:11px;letter-spacing:.04em;stroke-width:3px`) + lab(x, y + 13, t2, 'middle', `fill:${col};font-size:9.5px;stroke-width:3px`); };
  o.push(zt(-32, 56.5, 'ZONA STAGIONALE INVERNALE I', 'inverno 16 ott – 15 apr', 'var(--blue)'));
  o.push(zt(-57.5, 59.2, 'ZONA STAGIONALE', 'INVERNALE II', 'var(--blue)')); o.push(zt(-57.5, 57.4, '', 'inverno 16 nov – 15 mar', 'var(--blue)'));
  o.push(zt(-45, 25.5, 'ZONA ESTIVA', 'tutto l’anno', 'currentColor'));
  o.push(zt(-40, 4.5, 'ZONA TROPICALE', 'tutto l’anno', 'var(--red)'));
  o.push(...drawIce());
  // rotte raccomandate con distanze tra i nodi
  const node = { NY: [-73.83, 40.47], A: [-50.0, 41.0], BR: [-6.45, 49.87], GIB: [-5.75, 35.95], MONA: [-67.8, 18.3], ANE: [-64.0, 18.6], FL: [-79.9, 27.0], HX: [-63.5, 44.5] };
  const legs = [['NY', 'A', 0.5, 0, -6], ['A', 'BR', 0.45, 0, -6], ['HX', 'A', 0.45, 6, -6], ['NY', 'GIB', 0.62, 0, 13], ['GIB', 'ANE', 0.4, 0, 13], ['BR', 'MONA', 0.2, 0, -6], ['FL', 'A', 0.5, -10, 10]];
  for (const [a, b, t, dx, dy] of legs) {
    const pa = node[a], pb = node[b], pts = ll2(gc(pa, pb, 40));
    o.push(`<path d="${lineD(pts)}" style="fill:none;stroke:var(--red);stroke-width:2.2"/>`);
    const m = pts[Math.round(40 * t)]; o.push(lab(m[0] + dx, m[1] + dy, `${Math.round(nm(pa, pb))}`, 'middle', 'fill:var(--red);font-weight:700;font-size:10.5px;stroke-width:3px'));
  }
  for (const [k, v] of Object.entries(node)) { const [x, y] = P(...v); o.push(`<circle cx="${R(x)}" cy="${R(y)}" r="3.4" style="fill:var(--sheet);stroke:var(--red);stroke-width:1.6"/>`); }
  const port = (k, t, dx, dy, anc = 'start') => { const [x, y] = P(...node[k]); return lab(x + dx, y + dy, t, anc, 'font-weight:600;font-size:10.5px'); };
  o.push(port('NY', 'New York', -6, 14, 'end'), port('BR', 'Bishop Rock', 6, -6), port('GIB', 'Gibilterra', 6, 12), port('MONA', 'Passaggio della Mona', -6, 14, 'end'), port('ANE', 'Anegada', 6, 14), port('FL', 'Florida', -6, 4, 'end'), port('HX', 'Halifax', -6, -6, 'end'));
  // correnti prevalenti
  o.push(...drawCurrents('var(--green)', true));
  // rose dei venti (meno fitte)
  for (const [lo, la] of [[-60, 50], [-35, 50], [-20, 47], [-60, 30], [-40, 30], [-25, 30], [-50, 18], [-30, 18], [-60, 8], [-30, 8], [-70, 25]]) {
    if (!isSea(lo, la)) continue; const [x, y] = P(lo, la); o.push(roseRouteing(x, y, windClim(lo, la)));
  }
  o.push(CALL(1, -36, 41.0, 0, -18), CALL(2, -32, 52.5, 0, 0), CALL(3, -14, 28, 18, 0), CALL(4, -47, 47.6, 18, 8), CALL(5, -40, 30, 26, -22), CALL(6, -66, 37, 0, 0));
  o.push('</g>');
  o.push(titleBox('ROUTEING CHART · ATLANTICO NORD · GENNAIO', 'Rotte raccomandate e distanze in miglia · Mercatore', 'Esempio didattico · zone del bordo libero da ILLC 1966', 360));
  o.push(`<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" style="fill:none;stroke:currentColor"/></svg>`);
  fs.writeFileSync(`${OUT}/routeing_chart.svg`, o.join('\n'));
}
// distanze per il testo
const dd = (a, b) => Math.round(nm(a, b));
console.log('NY-BishopRock GC', dd([-73.83, 40.47], [-6.45, 49.87]), 'NY-Gib GC', dd([-73.83, 40.47], [-5.75, 35.95]));
