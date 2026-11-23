/* ===================== 1.06.01: riquadro "Aggiornamento disponibile" dell'APK =====================
   L'APK (MainActivity.java) chiama QP_UPD({nome, versione, novita}) quando su GitHub c'è una versione nuova,
   poi QP_UPD_PROG(percento) durante lo scaricamento e QP_UPD_PROG(100, 'installa') alla fine.
   Il riquadro risponde con QPApp.aggiorna() o QPApp.piuTardi(). */
(function () {
  'use strict';
  let box = null;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function close(){ if (!box) return; const b = box; box = null; b.classList.remove('on'); setTimeout(() => b.remove(), 260); }
  window.QP_UPD = function (d){
    d = d || {};
    if (box) return true;
    const righe = String(d.novita || '').split('\n').map(x => x.trim()).filter(x => /^[-•*]\s+/.test(x)).map(x => x.replace(/^[-•*]\s+/, '')).slice(0, 6);
    box = document.createElement('div'); box.className = 'upd'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'updT');
    box.innerHTML = '<div class="upd-card">' +
      '<div class="upd-top"><img src="icone/icona-192.png" alt="" width="56" height="56"><div><p class="upd-k">Aggiornamento disponibile</p><h2 id="updT">' + esc(d.versione ? 'Versione ' + d.versione : (d.nome || 'Nuova versione')) + '</h2></div></div>' +
      (righe.length ? '<p class="upd-s">Novità</p><ul class="upd-l">' + righe.map(r => '<li>' + esc(r) + '</li>').join('') + '</ul>' : '<p class="upd-p">È pronta una versione nuova del Quaderno.</p>') +
      '<div class="upd-prog" hidden><div class="upd-bar"><i></i></div><p class="upd-st">Scarico l\'aggiornamento… <b>0%</b></p></div>' +
      '<p class="upd-n">Se Android avvisa che l\'app non è sicura è perché non viene dal Play Store: tocca <b>Altri dettagli</b> → <b>Installa comunque</b>. I tuoi dati restano.</p>' +
      '<div class="upd-b"><button type="button" class="upd-later">Più tardi</button><button type="button" class="upd-go">Aggiorna ora</button></div></div>';
    document.body.append(box);
    requestAnimationFrame(() => requestAnimationFrame(() => box && box.classList.add('on')));
    box.querySelector('.upd-later').addEventListener('click', () => { try { QPApp.piuTardi(); } catch (e) {} close(); });
    box.querySelector('.upd-go').addEventListener('click', () => {
      box.querySelector('.upd-b').hidden = true; box.querySelector('.upd-prog').hidden = false;
      try { QPApp.aggiorna(); } catch (e) { close(); }
    });
    box.querySelector('.upd-go').focus();
    return true;
  };
  window.QP_UPD_PROG = function (pc, fase){
    if (!box) return;
    box.querySelector('.upd-bar i').style.width = Math.max(2, pc) + '%';
    const st = box.querySelector('.upd-st');
    if (fase === 'errore'){ st.textContent = 'Download non riuscito: riprova più tardi.'; setTimeout(close, 2600); }
    else if (fase === 'installa'){ st.innerHTML = 'Fatto. Ora Android chiede di confermare: tocca <b>Aggiorna</b>.'; setTimeout(close, 4000); }
    else st.innerHTML = 'Scarico l\'aggiornamento… <b>' + pc + '%</b>';
  };
})();
