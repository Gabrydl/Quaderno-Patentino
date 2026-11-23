// Quaderno Patentino: le pagine dell'app funzionano anche senza rete.
// Dalla 1.06: prima la copia salvata (apertura subito), intanto si scarica quella nuova. Supabase e audio non passano di qui.
const VERSIONE = '1.06.00';
const CACHE = 'qp-' + VERSIONE;
const FILE = ['./', 'index.html', 'manifest.webmanifest', 'icone/icona-192.png', 'icone/icona-512.png',
  'esercizi/assetto.html', 'esercizi/maree.html', 'esercizi/bussole.html', 'esercizi/carteggio.html', 'esercizi/sinottiche.html', 'frasario/', 'frasario/dati.json'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('qp-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  const fonts = u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com';
  if (u.origin !== location.origin && !fonts) return;
  if (fonts) { e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { const c = res.clone(); caches.open(CACHE).then(x => x.put(r, c)); return res; }))); return; }
  // 1.06: copia salvata subito (apertura istantanea) e aggiornamento in sottofondo; senza copia si va in rete.
  // Una versione nuova arriva quindi all'apertura successiva (sw.js cambia VERSIONE e ricarica tutti i file).
  const net = fetch(r).then(res => { if (res.ok) { const c = res.clone(); caches.open(CACHE).then(x => x.put(r, c)); } return res; });
  e.respondWith(caches.match(r, { ignoreSearch: true }).then(m => {
    if (m) { e.waitUntil(net.catch(() => {})); return m; }
    return net.catch(() => r.mode === 'navigate' ? caches.match('index.html') : Response.error());
  }));
});
