// Quaderno Patentino: le pagine dell'app funzionano anche senza rete.
// Rete per prima (4 s), poi la copia salvata. Supabase e audio non passano di qui.
const VERSIONE = '1.04.00';
const CACHE = 'qp-' + VERSIONE;
const FILE = ['./', 'index.html', 'manifest.webmanifest', 'icone/icona-192.png', 'icone/icona-512.png',
  'esercizi/assetto.html', 'esercizi/carteggio.html', 'frasario/', 'frasario/dati.json'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('qp-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  const fonts = u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com';
  if (u.origin !== location.origin && !fonts) return;
  if (fonts) { e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { const c = res.clone(); caches.open(CACHE).then(x => x.put(r, c)); return res; }))); return; }
  e.respondWith(new Promise(resolve => {
    let done = false;
    const fromCache = () => caches.match(r, { ignoreSearch: true }).then(m => m || (r.mode === 'navigate' ? caches.match('index.html') : undefined));
    const t = setTimeout(() => fromCache().then(m => { if (m && !done) { done = true; resolve(m); } }), 4000);
    fetch(r).then(res => {
      clearTimeout(t);
      if (res.ok) { const c = res.clone(); caches.open(CACHE).then(x => x.put(r, c)); }
      if (!done) { done = true; resolve(res); }
    }).catch(() => fromCache().then(m => { clearTimeout(t); if (!done) { done = true; resolve(m || Response.error()); } }));
  }));
});
