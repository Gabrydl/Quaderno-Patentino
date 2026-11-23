// Account: accesso con nome utente e password (Supabase), registrazione con codice, progressi, segnalazioni,
// messaggi in primo piano, area amministrazione. Il codice di registrazione sta solo nel database.
(function(){
  const SB = 'https://cvyuytnouuapmazjnebc.supabase.co';
  const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2eXV5dG5vdXVhcG1hempuZWJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5MTQ4NTcsImV4cCI6MjEwODQ5MDg1N30.xgg9-dmfFTrHazeKV_odAUhhDlf0IWge-8aRwUNhAkQ';
  const DOM = 'gabrydl99.github.io';
  const VER = window.QP_VERSIONE || '';
  const $ = s => document.querySelector(s);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const store = { get(k){ try { return localStorage.getItem(k); } catch (e) { return null; } },
                  set(k, v){ try { localStorage.setItem(k, v); } catch (e) {} },
                  del(k){ try { localStorage.removeItem(k); } catch (e) {} } };
  const fmt = d => d ? new Date(d).toLocaleString('it-IT', {day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit'}) : '—';
  const fmtOra = d => d ? new Date(d).toLocaleTimeString('it-IT', {hour:'2-digit', minute:'2-digit'}) : '';
  function toast(t){ const el = document.createElement('div'); el.className = 'toast'; el.textContent = t; document.body.append(el); setTimeout(() => el.remove(), 2600); }

  // ---------- sessione ----------
  let sess = null;
  try { sess = JSON.parse(store.get('qp-sess') || 'null'); } catch (e) {}
  const saveSess = s => { sess = s; if (s) store.set('qp-sess', JSON.stringify(s)); else store.del('qp-sess'); };
  function fromToken(j){ return { at: j.access_token, rt: j.refresh_token, exp: j.expires_at || (Math.floor(Date.now() / 1000) + (j.expires_in || 3600)), user: j.user }; }
  async function authFetch(path, body){
    const r = await fetch(SB + '/auth/v1/' + path, { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    let j = {}; try { j = await r.json(); } catch (e) {}
    if (!r.ok) { const e = new Error(j.msg || j.error_description || j.message || j.error || ('Errore ' + r.status)); e.status = r.status; e.code = j.error_code || j.code; throw e; }
    return j;
  }
  let refreshing = null;
  async function token(){
    if (!sess) throw new Error('Accesso richiesto');
    if (sess.exp - 60 > Date.now() / 1000) return sess.at;
    if (!refreshing) refreshing = authFetch('token?grant_type=refresh_token', { refresh_token: sess.rt })
      .then(j => { saveSess(fromToken(j)); return sess.at; })
      .catch(e => { if (e.status >= 400 && e.status < 500) { saveSess(null); lock(); } throw e; })
      .finally(() => { refreshing = null; });
    return refreshing;
  }
  async function api(path, opt = {}){
    const at = await token();
    const r = await fetch(SB + path, { ...opt, headers: { apikey: KEY, Authorization: 'Bearer ' + at, 'Content-Type': 'application/json', ...(opt.headers || {}) } });
    const tx = await r.text(); let j = null; try { j = tx ? JSON.parse(tx) : null; } catch (e) { j = tx; }
    if (!r.ok) throw new Error((j && (j.message || j.msg || j.error)) || ('Errore ' + r.status));
    return j;
  }
  const rpc = (fn, args = {}) => api('/rest/v1/rpc/' + fn, { method: 'POST', body: JSON.stringify(args) });

  // ---------- schermata di accesso ----------
  const gate = $('#gate'), form = $('#gateForm'), seg = $('#gateSeg'), err = $('#gateErr');
  let reg = false;
  function setMode(r){
    reg = r; seg.classList.toggle('reg', r);
    seg.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-pressed', (i === 1) === r ? 'true' : 'false'));
    $('#fCode').hidden = !r; $('#gateTos').hidden = !r; $('#gPw2').hidden = !r;
    $('#gSubmit').textContent = r ? 'Registrati' : 'Entra';
    $('#gPw').autocomplete = r ? 'new-password' : 'current-password';
    err.textContent = '';
  }
  seg.querySelectorAll('button').forEach((b, i) => b.addEventListener('click', () => setMode(i === 1)));
  document.querySelectorAll('.pw button').forEach(b => b.addEventListener('click', () => {
    const inp = b.parentElement.querySelector('input'), on = inp.type === 'password';
    inp.type = on ? 'text' : 'password'; b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.setAttribute('aria-label', on ? 'Nascondi la password' : 'Mostra la password');
  }));
  function traduci(e){
    const m = (e && e.message || '') + '';
    if (/invalid login credentials/i.test(m)) return 'Nome utente o password sbagliati.';
    if (/already registered|already been registered|exists/i.test(m)) return 'Questo nome utente è già preso: scegline un altro.';
    if (/database error saving new user|codice/i.test(m)) return 'Codice di registrazione non valido.';
    if (/password should be at least|password.*characters/i.test(m)) return 'La password è troppo corta.';
    if (/weak/i.test(m)) return 'La password è troppo semplice: usane una più lunga.';
    if (/rate limit|too many/i.test(m)) return 'Troppi tentativi: aspetta qualche minuto e riprova.';
    if (/failed to fetch|network/i.test(m)) return 'Non c\'è connessione: serve internet per entrare.';
    return m || 'Qualcosa non ha funzionato. Riprova.';
  }
  form.addEventListener('submit', async e => {
    e.preventDefault(); err.textContent = '';
    const nome = $('#gUser').value.trim(), pw = $('#gPw').value, codice = $('#gCode').value.trim();
    if (!/^[A-Za-z0-9._-]{3,20}$/.test(nome)) { err.textContent = 'Il nome utente deve avere da 3 a 20 caratteri: lettere, numeri, punto, trattino o trattino basso.'; return; }
    if (!pw) { err.textContent = 'Scrivi la password.'; return; }
    if (reg){
      if (pw.length < 6) { err.textContent = 'La password deve avere almeno 6 caratteri.'; return; }
      if (pw !== $('#gPw2i').value) { err.textContent = 'Le due password non sono uguali.'; return; }
      if (!codice) { err.textContent = 'Scrivi il codice di registrazione.'; return; }
    }
    const btn = $('#gSubmit'); btn.disabled = true;
    const email = nome.toLowerCase() + '@' + DOM;
    try {
      if (reg){
        const j = await authFetch('signup', { email, password: pw, data: { nome, codice } });
        if (j.access_token) saveSess(fromToken(j));
        else saveSess(fromToken(await authFetch('token?grant_type=password', { email, password: pw })));
      } else saveSess(fromToken(await authFetch('token?grant_type=password', { email, password: pw })));
      $('#gPw').value = ''; $('#gPw2i').value = ''; $('#gCode').value = '';
      unlock(true);
    } catch (x) { err.textContent = traduci(x); }
    finally { btn.disabled = false; }
  });

  function lock(){
    document.body.classList.add('locked'); gate.hidden = false;
    stopBeat();
  }
  function unlock(fresh){
    document.body.classList.remove('locked'); gate.hidden = true;
    paintAcc(); loadProg(); beat(true);
    if (fresh) window.scrollTo(0, 0);
  }

  // ---------- dati utente ----------
  const me = { nome: '', ruolo: '', foto: null, id: '' };
  function readUser(){
    const u = sess && sess.user || {};
    me.id = u.id || ''; const em = (u.email || '').split('@')[0];
    const n = (u.user_metadata || {}).nome; me.nome = n && n.toLowerCase() === em ? n : em;
    if (!me.ruolo) me.ruolo = ((u.app_metadata || {}).ruolo) || '';
  }
  const initial = n => (n || '?').charAt(0).toUpperCase();
  const avatar = (foto, nome) => foto ? '<img alt="" src="' + esc(foto) + '">' : esc(initial(nome));
  const accBtn = $('#accBtn');
  let unread = 0;
  function paintAcc(){
    readUser();
    accBtn.querySelector('.av').innerHTML = avatar(me.foto, me.nome);
    const d = accBtn.querySelector('.dot'); d.hidden = !unread; d.textContent = unread > 9 ? '9+' : unread;
  }

  // ---------- segnale (accesso, ruolo, messaggi) ----------
  let beatT = null, fotoAsked = false;
  function devInfo(){
    let id = store.get('qp-dev'); if (!id){ id = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36)); store.set('qp-dev', id); }
    const ua = navigator.userAgent, d = { dispositivo: id.slice(0, 36) };
    const and = ua.match(/Android [\d.]+; ([^;)]+)/); if (and) d.modello = and[1].replace(/ Build.*/, '').trim();
    else if (/iPhone/.test(ua)) d.modello = 'iPhone'; else if (/iPad/.test(ua)) d.modello = 'iPad'; else if (/Windows/.test(ua)) d.modello = 'PC Windows'; else if (/Macintosh/.test(ua)) d.modello = 'Mac';
    // nome dal database dei telefoni (app/presto.js): es. "Galaxy S23 Ultra (SM-S918B) · 6.8″"
    const D = window.QP_DEV;
    if (D && D.nome) d.modello = D.nome + (D.codice && D.codice !== D.nome ? ' (' + D.codice + ')' : '') + ' · ' + String(D.pollici).replace('.', ',') + '″';
    else if (D && D.codice) d.modello = D.codice;
    if (d.modello) d.modello = d.modello.slice(0, 80);
    d.sistema = (ua.match(/Android [\d.]+|iPhone OS [\d_]+|Windows NT [\d.]+|Mac OS X [\d_.]+/) || [''])[0].replace(/_/g, '.');
    d.browser = (ua.match(/(SamsungBrowser|Edg|OPR|Firefox|CriOS|Chrome|Safari)\/[\d.]+/) || [''])[0].split('.')[0];
    return d;
  }
  async function beat(first){
    clearTimeout(beatT);
    if (!sess) return;
    try {
      const d = devInfo(); if (first || !fotoAsked) d.foto = '1';
      const r = await rpc('segnale', { d });
      if (r){
        if ('foto' in r){ me.foto = r.foto; fotoAsked = true; }
        me.ruolo = r.ruolo || '';
        queue(r.messaggi || []);
        paintAcc();
        if (!$('#acc').hidden) paintAccount(false);
      }
    } catch (e) { /* senza rete l'app funziona lo stesso */ }
    beatT = setTimeout(() => beat(false), 60000);
  }
  function stopBeat(){ clearTimeout(beatT); }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && sess) beat(false); });

  // ---------- messaggi in primo piano ----------
  const shown = new Set(); let mq = [];
  function queue(list){ list.forEach(m => { if (!shown.has(m.id)) { shown.add(m.id); mq.push(m); } }); unread = mq.length; nextMsg(); }
  function nextMsg(){
    const box = $('#msgBox'); if (!box.hidden || !mq.length) return;
    const m = mq[0];
    const da = m.anonimo || !m.da ? 'Annuncio' : m.da;
    const ruolo = m.ruolo_da === 'superadmin' ? 'super-admin' : m.ruolo_da === 'admin' ? 'admin' : '';
    box.querySelector('.from').innerHTML = '<span class="av">' + (m.anonimo ? '📣' : avatar(m.foto_da, m.da)) + '</span><span><b>' + esc(da) + '</b><small>' +
      esc((m.annuncio ? 'Annuncio a tutti' : 'Messaggio per te') + (ruolo && !m.anonimo ? ' · ' + ruolo : '') + ' · ' + fmt(m.creato)) + '</small></span>';
    box.querySelector('.txt').textContent = m.testo;
    box.hidden = false; box.querySelector('.btn').focus();
  }
  $('#msgBox .btn').addEventListener('click', async () => {
    const m = mq.shift(); $('#msgBox').hidden = true; unread = mq.length; paintAcc();
    if (m) rpc('conferma_messaggio', { chi: m.id }).catch(() => {});
    setTimeout(nextMsg, 200);
  });

  // ---------- progressi (segna come letto) ----------
  const read = new Set(JSON.parse(store.get('qp-letti') || '[]'));
  const arts = () => [...document.querySelectorAll('article.topic')];
  function paintRead(){
    arts().forEach(a => { const b = a.querySelector(':scope > .read-btn'); if (b) setBtn(b, read.has(a.id)); });
    document.querySelectorAll('.toc a').forEach(l => { const id = (l.getAttribute('href') || '').slice(1); l.classList.toggle('letto', read.has(id)); });
  }
  function setBtn(b, on){
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.innerHTML = on ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>Letto' : '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/></svg>Segna come letto';
  }
  function addButtons(){
    arts().forEach(a => {
      if (a.querySelector(':scope > .read-btn')) return;
      const b = document.createElement('button'); b.type = 'button'; b.className = 'read-btn';
      a.append(b); setBtn(b, read.has(a.id));
      b.addEventListener('click', async () => {
        const on = !read.has(a.id);
        if (on) read.add(a.id); else read.delete(a.id);
        store.set('qp-letti', JSON.stringify([...read])); paintRead();
        try {
          if (on) await api('/rest/v1/progressi', { method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' }, body: JSON.stringify({ argomento: a.id }) });
          else await api('/rest/v1/progressi?argomento=eq.' + encodeURIComponent(a.id), { method: 'DELETE' });
        } catch (e) { toast('Salvato sul telefono: lo sincronizzo quando c\'è rete'); pending(a.id, on); }
      });
    });
  }
  function pending(id, on){ const p = JSON.parse(store.get('qp-pend') || '{}'); p[id] = on; store.set('qp-pend', JSON.stringify(p)); }
  async function flush(){
    const p = JSON.parse(store.get('qp-pend') || '{}');
    for (const [id, on] of Object.entries(p)){
      try {
        if (on) await api('/rest/v1/progressi', { method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' }, body: JSON.stringify({ argomento: id }) });
        else await api('/rest/v1/progressi?argomento=eq.' + encodeURIComponent(id), { method: 'DELETE' });
        delete p[id];
      } catch (e) { break; }
    }
    store.set('qp-pend', JSON.stringify(p));
  }
  async function loadProg(){
    try {
      await flush();
      const rows = await api('/rest/v1/progressi?select=argomento');
      read.clear(); rows.forEach(r => read.add(r.argomento));
      const p = JSON.parse(store.get('qp-pend') || '{}'); Object.entries(p).forEach(([id, on]) => on ? read.add(id) : read.delete(id));
      store.set('qp-letti', JSON.stringify([...read])); paintRead();
      if (!$('#acc').hidden) paintAccount(false);
    } catch (e) {}
  }

  // ---------- pannello account ----------
  const acc = $('#acc'), accBody = $('#accBody');
  let view = 'me', atab = 'utenti', adminData = {};
  function openAcc(v){ view = v || 'me'; acc.hidden = false; document.body.style.overflow = 'hidden'; paintAccount(true); }
  function closeAcc(){ acc.hidden = true; document.body.style.overflow = ''; }
  accBtn.addEventListener('click', () => openAcc('me'));
  $('#accClose').addEventListener('click', () => { if (view === 'admin') { view = 'me'; paintAccount(true); } else closeAcc(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !acc.hidden) closeAcc(); });

  function progHtml(){
    const secs = [...document.querySelectorAll('section.sec')];
    const all = arts(), tot = all.length, done = all.filter(a => read.has(a.id)).length;
    const row = (t, n, d, cls) => '<div class="row ' + (cls || '') + '"><div class="l"><span>' + esc(t) + '</span><small>' + d + ' / ' + n + ' · ' + (n ? Math.round(d * 100 / n) : 0) + '%</small></div><div class="bar2"><i style="width:' + (n ? d * 100 / n : 0) + '%"></i></div></div>';
    return '<div class="prog">' + row('Tutto il quaderno', tot, done, 'tot') + secs.map(s => {
      const a = [...s.querySelectorAll('article.topic')]; const t = (s.querySelector('.sec-head h2') || {}).textContent || s.id;
      return row(t, a.length, a.filter(x => read.has(x.id)).length);
    }).join('') + '</div>';
  }
  const isAdm = () => me.ruolo === 'admin' || me.ruolo === 'superadmin';
  function paintAccount(fresh){
    readUser();
    $('#accTitle').textContent = view === 'admin' ? 'Amministrazione' : 'Il tuo account';
    if (view === 'admin') return paintAdmin(fresh);
    const roleTxt = me.ruolo === 'superadmin' ? 'Super-admin' : me.ruolo === 'admin' ? 'Admin' : 'Utente';
    const keepOpen = id => { const d = accBody.querySelector('#' + id); return d && d.open ? ' open' : ''; };
    const was = { p: keepOpen('pProg') || (fresh ? ' open' : ''), n: keepOpen('pNome'), s: keepOpen('pSeg'), t: keepOpen('pTos') };
    accBody.innerHTML =
      '<div class="who"><button type="button" class="ph" id="phBtn" aria-label="Cambia foto profilo">' + avatar(me.foto, me.nome) +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg></button>' +
      '<div><div class="nm">' + esc(me.nome) + '</div><span class="badge ' + esc(me.ruolo) + '">' + roleTxt + '</span></div></div>' +
      '<input type="file" id="phFile" accept="image/*" hidden>' +
      (isAdm() ? '<div class="acts"><button type="button" class="btn" id="goAdmin">Amministrazione<span class="dot" id="admDot" hidden></span></button></div>' : '') +
      '<details class="panel" id="pProg"' + was.p + '><summary>I tuoi progressi</summary><div class="in"><p>Segna gli argomenti con <b>Segna come letto</b> in fondo a ogni scheda.</p>' + progHtml() + '</div></details>' +
      '<details class="panel" id="pNome"' + was.n + '><summary>Cambia nome utente</summary><div class="in"><p>Il nuovo nome vale anche per entrare. La password resta la stessa.</p>' +
      '<form id="fNome"><label class="fld"><span>Nuovo nome utente</span><input id="nNome" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="20" value="' + esc(me.nome) + '"></label><p class="err" id="nErr"></p><button class="btn" type="submit">Salva il nome</button></form></div></details>' +
      '<details class="panel" id="pSeg"' + was.s + '><summary>Segnalazioni e feedback</summary><div class="in"><p>Errori nel testo, idee o problemi con l\'app. Le legge solo il super-admin.</p>' +
      '<form id="fSeg"><label class="fld"><span>Tipo</span><select id="sTipo"><option value="errore">Errore</option><option value="suggerimento">Suggerimento</option><option value="reclamo">Reclamo</option><option value="altro">Altro</option></select></label>' +
      '<label class="fld"><span>Messaggio</span><textarea id="sMsg" maxlength="2000" placeholder="Scrivi qui. Puoi allegare fino a 3 foto o file qui sotto."></textarea></label>' +
      '<div class="files" id="sFiles"></div><input type="file" id="sFile" multiple hidden accept="image/*,application/pdf,.txt,.doc,.docx">' +
      '<div class="acts" style="margin-top:0;grid-template-columns:auto 1fr"><button type="button" class="btn ghost sm" id="sAdd">Allega</button><button class="btn" type="submit">Invia</button></div><p class="err" id="sErr"></p></form></div></details>' +
      '<details class="panel" id="pOff"><summary>Audio scaricati</summary><div class="in"><p id="offTx">…</p><button type="button" class="btn ghost sm" id="offDel" hidden>Elimina gli audio scaricati</button></div></details>' +
      '<details class="panel" id="pTos"' + was.t + '><summary>Termini di servizio</summary><div class="in">' + $('#tosText').innerHTML + '</div></details>' +
      '<div class="acts"><button type="button" class="btn ghost" id="logout">Esci</button>' + (me.ruolo === 'superadmin' ? '' : '<button type="button" class="btn danger" id="delMe">Elimina il mio account</button>') + '</div>' +
      '<p class="foot-ver">Versione ' + esc(VER) + '</p>';
    const offPaint = () => window.QPA && QPA.lista().then(l => {
      const tx = accBody.querySelector('#offTx'), b = accBody.querySelector('#offDel'); if (!tx) return;
      const mb = l.reduce((a, x) => a + x.size, 0) / 1048576;
      tx.textContent = l.length ? l.length + (l.length === 1 ? ' lezione scaricata' : ' lezioni scaricate') + ' · ' + mb.toFixed(mb < 10 ? 1 : 0).replace('.', ',') + ' MB. Si ascoltano anche senza rete.' : 'Nessuna lezione scaricata. Quando ascolti un audio ti chiedo se vuoi scaricarlo per l\'offline.';
      b.hidden = !l.length;
    });
    offPaint();
    accBody.querySelector('#offDel').addEventListener('click', async () => { if (!confirm('Eliminare tutti gli audio scaricati dal telefono?')) return; await QPA.svuota(); offPaint(); toast('Audio scaricati eliminati'); });
    accBody.querySelector('#phBtn').addEventListener('click', () => accBody.querySelector('#phFile').click());
    accBody.querySelector('#phFile').addEventListener('change', e => setPhoto(e.target.files[0]));
    const ga = accBody.querySelector('#goAdmin'); if (ga) ga.addEventListener('click', () => { view = 'admin'; paintAccount(true); });
    accBody.querySelector('#fNome').addEventListener('submit', async e => {
      e.preventDefault(); const n = accBody.querySelector('#nNome').value.trim(), er = accBody.querySelector('#nErr'); er.textContent = '';
      try { const r = await rpc('cambia_nome', { nuovo: n }); await authFetch('token?grant_type=refresh_token', { refresh_token: sess.rt }).then(j => saveSess(fromToken(j))); me.nome = r.nome; toast('Nome cambiato in ' + r.nome); paintAcc(); paintAccount(false); }
      catch (x) { er.textContent = x.message; }
    });
    let files = [];
    const fl = accBody.querySelector('#sFiles');
    accBody.querySelector('#sAdd').addEventListener('click', () => accBody.querySelector('#sFile').click());
    accBody.querySelector('#sFile').addEventListener('change', e => { files = files.concat([...e.target.files]).slice(0, 3); fl.innerHTML = files.map(f => '<span>' + esc(f.name) + '</span>').join(''); e.target.value = ''; });
    accBody.querySelector('#fSeg').addEventListener('submit', async e => {
      e.preventDefault(); const er = accBody.querySelector('#sErr'); er.textContent = '';
      const msg = accBody.querySelector('#sMsg').value.trim(); if (!msg) { er.textContent = 'Scrivi il messaggio.'; return; }
      const btn = e.submitter || accBody.querySelector('#fSeg [type=submit]'); btn.disabled = true;
      try {
        const all = [];
        for (const f of files){
          if (f.size > 10 * 1024 * 1024) throw new Error('"' + f.name + '" è troppo grande (massimo 10 MB).');
          const path = me.id + '/' + Date.now() + '-' + f.name.replace(/[^\w.-]+/g, '_').slice(-80);
          const at = await token();
          const r = await fetch(SB + '/storage/v1/object/allegati/' + path, { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + at, 'Content-Type': f.type || 'application/octet-stream' }, body: f });
          if (!r.ok) throw new Error('Non riesco a caricare "' + f.name + '".');
          all.push({ path, nome: f.name.slice(0, 120) });
        }
        const cur = document.querySelector('article.topic.on');
        await api('/rest/v1/segnalazioni', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({
          tipo: accBody.querySelector('#sTipo').value, messaggio: msg, nome: me.nome, versione: VER.slice(0, 20),
          argomento: cur ? (cur.querySelector('h3').firstChild.textContent || '').trim().slice(0, 160) : '', rif: cur ? cur.id.slice(0, 100) : '', allegati: all }) });
        files = []; fl.innerHTML = ''; accBody.querySelector('#sMsg').value = ''; toast('Segnalazione inviata, grazie!');
      } catch (x) { er.textContent = x.message; }
      finally { btn.disabled = false; }
    });
    accBody.querySelector('#logout').addEventListener('click', async () => {
      try { await fetch(SB + '/auth/v1/logout', { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + sess.at } }); } catch (e) {}
      saveSess(null); store.del('qp-letti'); store.del('qp-pend'); read.clear(); me.ruolo = ''; me.foto = null; closeAcc(); setMode(false); lock();
    });
    const dm = accBody.querySelector('#delMe');
    if (dm) dm.addEventListener('click', async () => {
      if (!confirm('Eliminare il tuo account? Perdi i progressi e non si può annullare.')) return;
      try { await rpc('elimina_account'); saveSess(null); closeAcc(); lock(); toast('Account eliminato'); } catch (x) { toast(x.message); }
    });
    if (isAdm()) refreshAdmDot();
  }
  function setPhoto(f){
    if (!f) return;
    const img = new Image(), url = URL.createObjectURL(f);
    img.onload = async () => {
      const c = document.createElement('canvas'), S = 160, k = Math.max(S / img.width, S / img.height);
      c.width = c.height = S; const g = c.getContext('2d');
      g.drawImage(img, (S - img.width * k) / 2, (S - img.height * k) / 2, img.width * k, img.height * k);
      let q = .82, data = c.toDataURL('image/jpeg', q); while (data.length > 55000 && q > .3) { q -= .1; data = c.toDataURL('image/jpeg', q); }
      URL.revokeObjectURL(url);
      try { await rpc('salva_foto', { foto: data }); me.foto = data; paintAcc(); paintAccount(false); toast('Foto aggiornata'); } catch (x) { toast(x.message); }
    };
    img.src = url;
  }

  // ---------- amministrazione ----------
  async function refreshAdmDot(){
    if (me.ruolo !== 'superadmin') return;
    try { const r = await api('/rest/v1/segnalazioni?select=id&letto=eq.false'); adminData.nuove = r.length; const d = document.getElementById('admDot'); if (d){ d.hidden = !r.length; d.textContent = r.length; } } catch (e) {}
  }
  function tabsHtml(){
    const t = [['utenti', 'Utenti']];
    if (me.ruolo === 'superadmin') t.push(['accessi', 'Accessi'], ['segn', 'Segnalazioni']);
    t.push(['msg', 'Messaggi'], ['codice', 'Codice']);
    if (me.ruolo === 'superadmin') t.push(['agg', 'Registro']);
    return '<div class="atabs">' + t.map(([k, l]) => '<button type="button" data-t="' + k + '" aria-current="' + (k === atab) + '">' + l + (k === 'segn' && adminData.nuove ? '<span class="dot">' + adminData.nuove + '</span>' : '') + '</button>').join('') + '</div>';
  }
  async function paintAdmin(fresh){
    if (!isAdm()) { view = 'me'; return paintAccount(true); }
    if (fresh) await refreshAdmDot();
    accBody.innerHTML = tabsHtml() + '<div class="panel"><div class="in" style="padding-top:14px" id="aBody"><p>Carico…</p></div></div>';
    accBody.querySelectorAll('.atabs button').forEach(b => b.addEventListener('click', () => { atab = b.dataset.t; paintAdmin(false); }));
    const box = accBody.querySelector('#aBody');
    try {
      if (atab === 'utenti') await aUtenti(box);
      else if (atab === 'accessi') await aAccessi(box);
      else if (atab === 'segn') await aSegn(box);
      else if (atab === 'msg') await aMsg(box);
      else if (atab === 'agg') await aAgg(box);
      else await aCodice(box);
    } catch (x) { box.innerHTML = '<p class="err">' + esc(x.message) + '</p>'; }
  }
  async function aUtenti(box){
    const us = await rpc('elenco_utenti'); const sup = me.ruolo === 'superadmin';
    box.innerHTML = '<p>' + us.length + ' account registrati.</p><div class="ulist">' + us.map((u, i) => {
      const ruolo = u.ruolo === 'superadmin' ? ' · super-admin' : u.ruolo === 'admin' ? ' · admin' : '';
      const sub = sup ? (u.in_linea ? 'in linea ora' : 'ultimo accesso ' + fmt(u.ultimo_accesso)) + ruolo + ' · ' + (u.letti || 0) + ' letti' : '';
      return '<div class="uitem' + (sup ? ' click' : '') + '" data-i="' + i + '"><span class="av">' + avatar(u.foto, u.nome) + (u.in_linea ? '<i class="on"></i>' : '') + '</span><span class="t"><b>' + esc(u.nome) + '</b><small>' + esc(sub) + '</small></span><span></span></div><div class="udet" hidden></div>';
    }).join('') + '</div>';
    if (!sup) return;
    box.querySelectorAll('.uitem').forEach(el => el.addEventListener('click', () => {
      const u = us[+el.dataset.i], det = el.nextElementSibling;
      if (!det.hidden) { det.hidden = true; return; }
      const l = u.ultimo || {};
      det.innerHTML = 'Registrato il ' + fmt(u.registrato) + '<br>Accessi registrati: ' + (u.n_accessi || 0) +
        (l.ip ? '<br>Ultimo: ' + esc([l.modello, l.sistema, l.browser].filter(Boolean).join(' · ')) + ' · IP ' + esc(l.ip) : '') +
        (u.nomi ? '<br>Nomi precedenti: ' + u.nomi.map(n => esc(n.vecchio) + ' → ' + esc(n.nuovo) + ' (' + fmt(n.quando) + ')').join(', ') : '') +
        (u.ruolo === 'superadmin' ? '' : '<div class="acts2"><button type="button" class="btn ghost sm" data-a="msg">Scrivi</button><button type="button" class="btn ghost sm" data-a="acc">Accessi</button><button type="button" class="btn ghost sm" data-a="role">' + (u.ruolo === 'admin' ? 'Togli admin' : 'Rendi admin') + '</button><button type="button" class="btn danger sm" data-a="del">Elimina</button></div>');
      det.hidden = false;
      det.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', async ev => {
        ev.stopPropagation(); const a = b.dataset.a;
        try {
          if (a === 'msg') { atab = 'msg'; adminData.to = u; return paintAdmin(false); }
          if (a === 'acc') { atab = 'accessi'; adminData.chi = u; return paintAdmin(false); }
          if (a === 'role') { await rpc('imposta_ruolo', { chi: u.id, ruolo: u.ruolo === 'admin' ? '' : 'admin' }); toast('Ruolo aggiornato'); return paintAdmin(false); }
          if (a === 'del') { if (!confirm('Eliminare l\'account di ' + u.nome + '? Non si può annullare.')) return; await rpc('elimina_utente', { chi: u.id }); toast('Account eliminato'); return paintAdmin(false); }
        } catch (x) { toast(x.message); }
      }));
    }));
  }
  async function aAccessi(box){
    const chi = adminData.chi; adminData.chi = null;
    const rows = await rpc('registro_accessi', { chi: chi ? chi.id : null, quanti: 1500 });
    const g = new Map();
    rows.forEach(r => { const k = r.utente + '|' + (r.dispositivo || [r.modello, r.sistema, r.browser].join('/')); if (!g.has(k)) g.set(k, []); g.get(k).push(r); });
    const list = [...g.values()];
    box.innerHTML = '<p>' + (chi ? 'Accessi di <b>' + esc(chi.nome) + '</b>' : 'Ultimi accessi') + ', uniti per dispositivo. Tocca per vedere gli orari. Si conservano 6 mesi.</p>' +
      (list.length ? list.map((rs, i) => { const r = rs[0], ips = [...new Set(rs.map(x => x.ip).filter(Boolean))];
        return '<div class="dev"><button type="button" data-i="' + i + '"><span><b>' + esc(r.nome) + '</b><small>' + esc([r.modello, r.sistema, r.browser].filter(Boolean).join(' · ') || 'dispositivo sconosciuto') + '<br>ultimo ' + fmt(r.fine) + ' · IP ' + esc(ips.join(', ') || '—') + '</small></span><span class="n">' + rs.length + '</span></button><ul hidden></ul></div>'; }).join('') : '<p>Nessun accesso.</p>');
    box.querySelectorAll('.dev > button').forEach(b => b.addEventListener('click', () => {
      const ul = b.nextElementSibling; if (!ul.hidden) { ul.hidden = true; return; }
      const days = new Map(); list[+b.dataset.i].forEach(r => { const d = new Date(r.inizio).toLocaleDateString('it-IT', {weekday:'short', day:'2-digit', month:'2-digit', year:'2-digit'}); if (!days.has(d)) days.set(d, []); days.get(d).push(r); });
      ul.innerHTML = [...days].map(([d, rs]) => '<li><b>' + esc(d) + '</b>: ' + rs.map(r => fmtOra(r.inizio) + '–' + fmtOra(r.fine) + (r.ip ? ' (' + esc(r.ip) + ')' : '')).join(', ') + '</li>').join('');
      ul.hidden = false;
    }));
  }
  async function aSegn(box){
    const rows = await api('/rest/v1/segnalazioni?select=*&order=creato.desc&limit=200');
    box.innerHTML = rows.length ? rows.map((r, i) => '<div class="rep' + (r.letto ? '' : ' new') + '"><div class="h"><b>' + esc(r.tipo) + ' · ' + esc(r.nome || '—') + '</b><span>' + fmt(r.creato) + '</span></div>' +
      (r.argomento ? '<div class="h"><span>Argomento: ' + esc(r.argomento) + '</span></div>' : '') + '<p>' + esc(r.messaggio) + '</p>' +
      (r.allegati && r.allegati.length ? '<div class="files">' + r.allegati.map((f, k) => '<a href="#" data-i="' + i + '" data-k="' + k + '">' + esc(f.nome) + '</a>').join('') + '</div>' : '') +
      '<div class="acts2" style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn ghost sm" data-r="' + i + '" data-op="letto">' + (r.letto ? 'Segna da leggere' : 'Segna letta') + '</button><button type="button" class="btn danger sm" data-r="' + i + '" data-op="del">Elimina</button></div></div>').join('') : '<p>Nessuna segnalazione.</p>';
    box.querySelectorAll('.files a').forEach(a => a.addEventListener('click', async e => {
      e.preventDefault(); const f = rows[+a.dataset.i].allegati[+a.dataset.k];
      const w = window.open('', '_blank');
      try { const j = await api('/storage/v1/object/sign/allegati/' + f.path.split('/').map(encodeURIComponent).join('/'), { method: 'POST', body: JSON.stringify({ expiresIn: 600 }) });
        const u = SB + '/storage/v1' + (j.signedURL || j.signedUrl); if (w) w.location = u; else location.href = u; } catch (x) { if (w) w.close(); toast(x.message); }
    }));
    box.querySelectorAll('[data-op]').forEach(b => b.addEventListener('click', async () => {
      const r = rows[+b.dataset.r];
      try {
        if (b.dataset.op === 'letto') await api('/rest/v1/segnalazioni?id=eq.' + r.id, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ letto: !r.letto }) });
        else { if (!confirm('Eliminare la segnalazione?')) return; await api('/rest/v1/segnalazioni?id=eq.' + r.id, { method: 'DELETE' }); }
        await refreshAdmDot(); paintAdmin(false);
      } catch (x) { toast(x.message); }
    }));
  }
  async function aMsg(box){
    const sup = me.ruolo === 'superadmin';
    const us = await rpc('elenco_utenti'); const sent = await rpc('messaggi_inviati');
    const to = adminData.to; adminData.to = null;
    box.innerHTML = '<form id="fMsg"><label class="fld"><span>A chi</span><select id="mTo">' + (sup ? '<option value="">Tutti (annuncio)</option>' : '') +
      us.filter(u => u.id !== me.id).map(u => '<option value="' + u.id + '"' + (to && to.id === u.id ? ' selected' : '') + '>' + esc(u.nome) + '</option>').join('') + '</select></label>' +
      (sup ? '<label class="chk"><input type="checkbox" id="mAnon"> Annuncio anonimo (senza mittente)</label>' : '') +
      '<label class="fld"><span>Messaggio</span><textarea id="mTxt" maxlength="1000"></textarea></label><p class="err" id="mErr"></p><button class="btn" type="submit">Invia</button></form>' +
      '<h4 style="margin:22px 0 4px">Inviati</h4>' + (sent.length ? sent.map((m, i) => '<div class="rep"><div class="h"><b>' + esc(m.destinatario ? 'a ' + (m.dest_nome || '?') : 'Annuncio a tutti' + (m.anonimo ? ' (anonimo)' : '')) + '</b><span>' + fmt(m.creato) + '</span></div><p>' + esc(m.testo) + '</p><div class="h"><span>' +
        (m.destinatario ? (m.letto ? 'Letto ' + fmt(m.letto) : 'Non ancora letto') : 'Letto da ' + m.letti + ' su ' + m.totale) + (sup && !m.mio ? ' · da ' + esc(m.mittente_nome) : '') + '</span><button type="button" class="btn danger sm" data-i="' + i + '">Ritira</button></div></div>').join('') : '<p>Nessun messaggio inviato.</p>');
    const tsel = box.querySelector('#mTo'), an = box.querySelector('#mAnon');
    const sync = () => { if (an) { an.disabled = !!tsel.value; if (tsel.value) an.checked = false; } };
    tsel.addEventListener('change', sync); sync();
    box.querySelector('#fMsg').addEventListener('submit', async e => {
      e.preventDefault(); const er = box.querySelector('#mErr'); er.textContent = '';
      try { await rpc('invia_messaggio', { a: tsel.value || null, testo: box.querySelector('#mTxt').value, anonimo: !!(an && an.checked) }); toast('Messaggio inviato'); paintAdmin(false); }
      catch (x) { er.textContent = x.message; }
    });
    box.querySelectorAll('[data-i]').forEach(b => b.addEventListener('click', async () => {
      if (!confirm('Ritirare il messaggio? Chi non l\'ha ancora letto non lo vedrà.')) return;
      try { await rpc('ritira_messaggio', { chi: sent[+b.dataset.i].id }); paintAdmin(false); } catch (x) { toast(x.message); }
    }));
  }
  // registro interno di tutti gli aggiornamenti (solo super-admin; lo aggiorna Claude a ogni versione)
  async function aAgg(box){
    const L = await rpc('registro_aggiornamenti');
    const d = x => { const p = String(x).split('-'); return p[2] + '/' + p[1] + '/' + p[0]; };
    box.innerHTML = '<p>Tutto quello che è cambiato nell\'app, dal più recente. Lo vedi solo tu.</p><ol class="agg">' + L.map(a =>
      '<li><span class="ah"><b>' + esc(a.versione ? 'Versione ' + a.versione : 'Aggiornamento') + '</b><small>' + d(a.data) + '</small></span><span class="ad">' + esc(a.descrizione) + '</span></li>').join('') + '</ol>';
  }
  async function aCodice(box){
    const c = await rpc('codice_accesso');
    box.innerHTML = '<p>Serve a chi si registra. Lo vedono solo admin e super-admin, e non è scritto nei file dell\'app.</p>' +
      '<div class="code-show">' + esc(c && c.codice || '—') + '</div><p>' + (c ? 'Cambiato il ' + fmt(c.aggiornato) + (c.da ? ' da ' + esc(c.da) : '') : '') + '</p>' +
      '<form id="fCodice"><label class="fld"><span>Nuovo codice</span><input id="cNew" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="30"></label><p class="err" id="cErr"></p><button class="btn" type="submit">Cambia il codice</button></form>';
    box.querySelector('#fCodice').addEventListener('submit', async e => {
      e.preventDefault(); const er = box.querySelector('#cErr'); er.textContent = '';
      try { await rpc('cambia_codice', { nuovo: box.querySelector('#cNew').value }); toast('Codice cambiato'); paintAdmin(false); } catch (x) { er.textContent = x.message; }
    });
  }

  // ---------- avvio ----------
  addButtons();
  paintRead();
  setMode(false);
  if (sess) { unlock(false); token().catch(() => {}); } else lock();
  window.QP = { rpc, api };
})();
