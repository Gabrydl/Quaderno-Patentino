// Audio offline: ogni lezione parte in streaming; alla prima riproduzione un piccolo avviso chiede se scaricarla.
// Le lezioni scaricate stanno nella Cache del browser/app ('qp-audio-off') e si ascoltano anche senza rete.
// Dalla 1.07.07 gli audio si ascoltano da GitHub Pages (repository Quaderno-Audio), che permette di saltare a qualsiasi minuto
// (richieste Range). Il vecchio indirizzo dell'artefatto (data-src) resta il "nome" della lezione: le lezioni già scaricate restano valide.
window.QP_AUD_BASE = 'https://gabrydl.github.io/Quaderno-Audio/a/';
window.QP_AUD = u => { const m = /^https:\/\/[^/]+\.claudeusercontent\.com\/_blob\/([0-9a-f]+)$/.exec(u || ''); return m ? QP_AUD_BASE + m[1] + '.m4a' : u; };
(function(){
  const CN = 'qp-audio-off', HAS = new Set(), ASKED = new Set();
  // nell'APK gli audio li scarica l'app (Java): il sito degli audio non permette di scaricarli dal browser (CORS)
  const NAT = !!(window.QPApp && typeof QPApp.scaricaAudio === 'function');
  const FILE = {};
  const ok = NAT || 'caches' in window;
  const natLista = () => { try { return JSON.parse(QPApp.audioScaricati() || '[]'); } catch (e) { return []; } };
  const ATTESE = {};
  let corsP = null;
  const corsOk = src => corsP || (corsP = fetch(QP_AUD(src), { method: 'HEAD', mode: 'cors', credentials: 'omit' }).then(r => r.ok).catch(() => false));
  window.QPA_FATTO = (url, fatto) => { const f = ATTESE[url]; delete ATTESE[url]; if (f) f(fatto); };
  const abs = u => { try { return new URL(u, location.href).href; } catch (e) { return u; } };
  const ls = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
  const pronto = NAT ? Promise.resolve().then(() => natLista().forEach(x => { HAS.add(x.url); FILE[x.url] = x.file; })) : ok ? caches.open(CN).then(c => c.keys()).then(ks => { ks.forEach(r => HAS.add(r.url)); }).catch(() => {}) : Promise.resolve();
  const toast = t => { const el = document.createElement('div'); el.className = 'toast'; el.textContent = t; document.body.append(el); setTimeout(() => el.remove(), 2600); };
  let box = null;
  function chiudi(){ if (box) { box.remove(); box = null; } }
  async function scarica(src, title){
    if (NAT){
      const u = abs(src);
      const fatto = await new Promise(res => { ATTESE[u] = res; try { if (typeof QPApp.scaricaAudioDa === 'function') QPApp.scaricaAudioDa(u, QP_AUD(u)); else QPApp.scaricaAudio(u); } catch (e) { res(false); } });
      if (fatto){ natLista().forEach(x => { HAS.add(x.url); FILE[x.url] = x.file; }); toast('Scaricata: ' + title); document.dispatchEvent(new CustomEvent('qp-audio-off')); }
      else toast('Download non riuscito: controlla la connessione');
      return;
    }
    try {
      const r = await fetch(QP_AUD(src), { credentials: 'omit' }); if (!r.ok) throw new Error(r.status);
      const c = await caches.open(CN); await c.put(abs(src), r); HAS.add(abs(src));
      if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
      toast('Scaricata: ' + title);
      document.dispatchEvent(new CustomEvent('qp-audio-off'));
    } catch (e) { toast('Download non riuscito: controlla la connessione'); }
  }
  window.QPA = {
    ha: src => ok && !!src && HAS.has(abs(src)),
    // URL locale (blob) della lezione scaricata, oppure null
    blob: src => NAT ? Promise.resolve(FILE[abs(src)] ? location.origin + '/offline/' + FILE[abs(src)] : null) : !ok ? Promise.resolve(null) : caches.open(CN).then(c => c.match(abs(src))).then(r => r ? r.blob() : null)
      .then(b => b ? URL.createObjectURL(new Blob([b], { type: 'audio/mp4' })) : null).catch(() => null),
    // dopo che lo streaming è partito: chiede una volta se scaricarla
    chiedi(id, src, title){
      if (!ok || !src || src.indexOf('local:') === 0 || location.protocol === 'file:') return;
      // dal browser si chiede solo se il sito degli audio permette di scaricarli (CORS); nell'APK li scarica l'app
      Promise.all([pronto, NAT ? true : corsOk(src)]).then(([, si]) => {
        if (!si) return;
        if (HAS.has(abs(src)) || ASKED.has(id) || ls.get('qp-dl-no-' + id)) return;
        ASKED.add(id); chiudi();
        box = document.createElement('div'); box.className = 'dlask'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Scarica per l\'offline');
        box.innerHTML = '<p>Scaricare questa lezione per ascoltarla anche offline?</p><div><button type="button" class="btn ghost sm" data-r="no">No</button><button type="button" class="btn sm" data-r="si">Sì</button></div>';
        document.body.append(box);
        box.addEventListener('click', e => {
          const b = e.target.closest('button'); if (!b) return;
          if (b.dataset.r === 'si') scarica(src, title); else ls.set('qp-dl-no-' + id, '1');
          chiudi();
        });
        setTimeout(() => { if (box && box.isConnected && !box.matches(':hover')) chiudi(); }, 15000);
      });
    },
    async lista(){
      if (!ok) return [];
      if (NAT){
        const T = {}; document.querySelectorAll('.aud[data-src]').forEach(el => { T[abs(el.dataset.src)] = el.dataset.title || ''; });
        return natLista().map(x => ({ url: x.url, size: x.size, title: T[x.url] || 'Lezione' })).sort((p, q) => p.title.localeCompare(q.title, 'it'));
      }
      await pronto; const c = await caches.open(CN), ks = await c.keys(), out = [];
      // titolo della lezione: dal riquadro audio dell'argomento con lo stesso indirizzo
      const T = {}; document.querySelectorAll('.aud[data-src]').forEach(el => { T[abs(el.dataset.src)] = el.dataset.title || ((el.closest('article') || {}).querySelector ? el.closest('article').querySelector('h3').firstChild.textContent.trim() : ''); });
      for (const r of ks){ const x = await c.match(r); const b = x ? await x.clone().blob() : null; out.push({ url: r.url, size: b ? b.size : 0, title: T[r.url] || 'Lezione' }); }
      out.sort((p, q) => p.title.localeCompare(q.title, 'it'));
      return out;
    },
    // elimina una sola lezione scaricata (torna in streaming)
    async togli(url){ if (NAT){ try { QPApp.togliAudio(url); } catch (e) {} HAS.delete(url); delete FILE[url]; document.dispatchEvent(new CustomEvent('qp-audio-off')); return; } if (!ok) return; const c = await caches.open(CN); await c.delete(url); HAS.delete(url); document.dispatchEvent(new CustomEvent('qp-audio-off')); },
    async svuota(){ if (NAT){ try { QPApp.svuotaAudio(); } catch (e) {} HAS.clear(); Object.keys(FILE).forEach(k => delete FILE[k]); Object.keys(localStorage).filter(k => k.indexOf('qp-dl-no-') === 0).forEach(k => localStorage.removeItem(k)); return; } if (!ok) return; await caches.delete(CN); HAS.clear(); Object.keys(localStorage).filter(k => k.indexOf('qp-dl-no-') === 0).forEach(k => localStorage.removeItem(k)); }
  };
})();
