// Tasto "Installa" in alto: Android/PC usano la richiesta del browser, iPhone/iPad mostrano come aggiungerla alla Home.
(function(){
  const b = document.getElementById('instBtn'); if (!b) return;
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let evento = null;
  const mostra = on => { b.hidden = !on; };
  mostra(false);
  if (standalone) return;
  if (ios) mostra(true);
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); evento = e; mostra(true); });
  addEventListener('appinstalled', () => { evento = null; mostra(false); });
  const box = document.getElementById('instBox');
  b.addEventListener('click', async () => {
    if (evento) { evento.prompt(); const r = await evento.userChoice.catch(() => null); if (r && r.outcome === 'accepted') mostra(false); evento = null; return; }
    box.hidden = false; box.querySelector('.btn').focus();
  });
  box.querySelector('.btn').addEventListener('click', () => { box.hidden = true; });
  box.addEventListener('click', e => { if (e.target === box) box.hidden = true; });
})();
