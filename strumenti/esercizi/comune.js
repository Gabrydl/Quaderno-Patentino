/* Pagine degli esercizi (Assetto, Maree, Controllo bussole, Carteggio, Carte sinottiche): parte comune dalla 1.06.
   - uscita e ingresso morbidi (niente lampo bianco)
   - "Come si fa": istruzioni per chi comincia sotto ogni passo della soluzione (dove si trovano i dati, come si usa la calcolatrice)
   - formule mai più larghe dello schermo */
(function () {
  'use strict';
  var R = document.documentElement;
  var page = (location.pathname.match(/([a-z]+)\.html$/) || [])[1] || '';
  function lite() { return R.classList.contains('lite') || R.classList.contains('calm'); }

  /* ---------- ingresso e uscita morbidi ---------- */
  requestAnimationFrame(function () { R.classList.add('qp-ready'); });
  var crossVT = 'CSSViewTransitionRule' in window;
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || crossVT || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || a.target || lite()) return;
    var h = a.getAttribute('href');
    if (h !== '../' && h !== '../index.html') return;
    e.preventDefault(); R.classList.add('qp-leave');
    setTimeout(function () { location.href = h; }, 160);
  });
  addEventListener('pageshow', function () { R.classList.remove('qp-leave'); });

  /* ---------- formule e righe di calcolo: dentro lo schermo ---------- */
  function fit(el) {
    if (!el.offsetParent) return;
    el.style.fontSize = ''; el.classList.remove('qp-wrap');
    var box = el.clientWidth; if (!box || el.scrollWidth <= box + 1) return;
    var base = parseFloat(getComputedStyle(el).fontSize), fs = base;
    for (var i = 0; i < 6 && el.scrollWidth > box + 1 && fs > base * 0.72; i++) { fs = Math.max(base * 0.72, fs * box / el.scrollWidth * 0.99); el.style.fontSize = fs.toFixed(2) + 'px'; }
    if (el.scrollWidth > box + 1) { el.classList.add('qp-wrap'); for (i = 0; i < 6 && el.scrollWidth > box + 1 && fs > base * 0.5; i++) { fs = Math.max(base * 0.5, fs * box / el.scrollWidth * 0.99); el.style.fontSize = fs.toFixed(2) + 'px'; } }
  }
  var FSEL = '.eqs, .formule .eqs, .scroll';
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) fit(e.target); }); }, { rootMargin: '300px 0px' }) : null;
  function watch(root) { (root || document).querySelectorAll(FSEL).forEach(function (el) { if (el.dataset.qpf) return; el.dataset.qpf = '1'; if (io) io.observe(el); else fit(el); }); }
  var lastW = innerWidth;
  addEventListener('resize', function () { if (innerWidth === lastW) return; lastW = innerWidth; document.querySelectorAll(FSEL).forEach(function (el) { if (io) { io.unobserve(el); io.observe(el); } else fit(el); }); }, { passive: true });

  /* ---------- "Come si fa": istruzioni per chi comincia ---------- */
  var CALC = '<li>Calcolatrice in <b>gradi</b>: sul display deve esserci <b>D</b> (Casio: <b>SHIFT → MODE/SETUP → Deg</b>). Con R o G i seni e coseni vengono sbagliati.</li>' +
    '<li>Gradi e primi: <b>15°17,2′</b> si scrive <b>15 <kbd>°′″</kbd> 17.2 <kbd>°′″</kbd></b>, oppure in decimali 15 + 17,2 ÷ 60 = <b>15,2867°</b>. Per tornare a gradi e primi premi di nuovo <b><kbd>°′″</kbd></b>.</li>' +
    '<li>Le funzioni inverse (arcsen, arccos, arctan) sono <b>SHIFT sin</b>, <b>SHIFT cos</b>, <b>SHIFT tan</b> (sul tasto c\'è scritto sin⁻¹, cos⁻¹, tan⁻¹).</li>' +
    '<li>Frazioni: metti sempre le parentesi, sopra e sotto: <b>(a + b) ÷ (c × d)</b>. Il tasto <b>Ans</b> riprende il risultato di prima.</li>' +
    '<li>Numeri negativi (Sud, Ovest, pesi sbarcati): usa il tasto <b>(−)</b>, non il meno della sottrazione.</li>';
  var ORE = '<li>Orari: trasformali in minuti (<b>ore × 60 + minuti</b>). Esempio 09:24 → 9 × 60 + 24 = 564 min. Alla fine dividi per 60: la parte intera sono le ore, il resto i minuti.</li>' +
    '<li>Con la calcolatrice puoi usare <b><kbd>°′″</kbd></b> anche per le ore: <b>9 <kbd>°′″</kbd> 24 <kbd>°′″</kbd> − 3 <kbd>°′″</kbd> 31 <kbd>°′″</kbd> =</b> dà 5°53′0″, cioè 5 h 53 min.</li>';
  var TAB = '<li>I dati della nave (Δ, TPC, MCTC, X<sub>CF</sub>, KM) sono nella <b>tabella idrostatica</b> (tabulato delle carene dritte) data con l\'esercizio: si entra nella riga del pescaggio medio T<sub>m</sub>.</li>' +
    '<li>Se T<sub>m</sub> cade tra due righe si <b>interpola</b>: valore = v<sub>1</sub> + (v<sub>2</sub> − v<sub>1</sub>) × (T<sub>m</sub> − T<sub>1</sub>) ÷ (T<sub>2</sub> − T<sub>1</sub>).</li>';
  var EFF = '<li>Apri le <b>Effemeridi Nautiche</b> dell\'anno giusto (Istituto Idrografico della Marina) nelle <b>pagine giornaliere</b>: la data è scritta in alto, cerca il giorno di T<sub>m</sub>Gr (che può essere diverso dalla data locale).</li>' +
    '<li>Nella colonna dell\'astro (Sole o pianeta) prendi la riga dell\'<b>ora intera</b> di T<sub>m</sub>Gr: leggi la declinazione <b>δ</b> (con N o S) e, se serve, l\'angolo orario <b>t<sub>Gr</sub></b>.</li>' +
    '<li>Per i <b>minuti e secondi</b> usa le tavole di interpolazione (incrementi e correzioni) in fondo al volume: si entra con i minuti e si scende alla riga dei secondi. Per δ basta: δ dell\'ora dopo − δ dell\'ora prima, per la frazione d\'ora (minuti ÷ 60).</li>' +
    '<li>Il numero della pagina cambia ogni anno: se non la trovi guarda l\'<b>indice</b> all\'inizio del volume.</li>';

  var G = {
    assetto: [
      [/Pescaggio medio|Entro in tabella|Dati del testo/, '<li>I pescaggi di poppa <b>T<sub>A</sub></b> e di prora <b>T<sub>F</sub></b> sono nel testo (a bordo si leggono sulle marche di immersione).</li><li>Pescaggio medio: <b>(T<sub>A</sub> + T<sub>F</sub>) ÷ 2</b>. In calcolatrice: <b>( T<sub>A</sub> + T<sub>F</sub> ) ÷ 2 =</b>.</li>' + TAB],
      [/FWA|DWA|formula semplificata/, '<li>La <b>FWA</b> (in cm) è nel testo o nel certificato di bordo libero; la densità dell\'acqua si legge col densimetro (acqua di mare 1,025, dolce 1,000 t/m³).</li><li>Proporzione: <b>DWA = FWA × (1,025 − δ) ÷ 0,025</b>. In calcolatrice: <b>FWA × (1.025 − δ) ÷ 0.025 =</b>.</li>' + TAB],
      [/Spostamento del baricentro|Quota del baricentro|KG|GM|Aumento di GM/, '<li>KG o GM sono nel testo; KM si legge nella tabella idrostatica alla riga di T<sub>m</sub>. Ricorda: <b>GM = KM − KG</b>.</li><li>Spostando un peso p di una distanza d, G si sposta di <b>p × d ÷ Δ</b>: in calcolatrice <b>p × d ÷ Δ =</b> (metri).</li><li>Teorema di Varignon: fai una tabellina peso | quota | momento (peso × quota), somma i momenti (+ imbarcati, − sbarcati) e dividi per il nuovo Δ.</li>'],
      [/Angolo di sbandamento|Sbandamento|Momento sbandante/, '<li>tan α = p × y ÷ (Δ × GM): prima calcola il numero, poi <b>SHIFT tan Ans =</b> per avere l\'angolo.</li><li>In calcolatrice tutto insieme: <b>SHIFT tan ( p × y ÷ ( Δ × GM ) ) =</b>. Se il risultato è in gradi decimali premi <b><kbd>°′″</kbd></b> per vederlo in gradi e primi.</li><li>Verso dritta i bracci y sono positivi, verso sinistra negativi.</li>'],
      [/Variazion|δT|Assetto da annullare|Effetto del solo assetto|Momento che serve|Bracci e momenti|Somma dei momenti|Somma dei pesi|Nuovo dislocamento|Immersione parallela/, '<li>MCTC (t·m per 1 cm), TPC (t per 1 cm) e X<sub>CF</sub> (posizione del centro di galleggiamento F) sono nella tabella idrostatica alla riga di T<sub>m</sub>.</li><li>Bracci: distanza di ogni peso da F (o dalla perpendicolare indicata nel testo). Moltiplica peso × braccio e somma con i segni.</li><li>Variazione di assetto in cm: <b>Σ p·x ÷ MCTC</b>. Immersione parallela in cm: <b>Σ p ÷ TPC</b>. Dividi per 100 per avere i metri.</li>'],
      [/Peso da spostare|Peso da imbarcare|Dove imbarcarlo|Prima stima di p|Correggo p|Imposto/, '<li>Scrivi l\'equazione con p incognito, poi isola p: in calcolatrice fai prima il denominatore, poi <b>numeratore ÷ Ans =</b>.</li><li>Quando cambia Δ si rientra in tabella con il nuovo Δ′ e si rifà il conto finché p non cambia più (di solito bastano due giri).</li>'],
      [/Pescaggi finali/, '<li>A ogni pescaggio iniziale somma l\'immersione parallela e la variazione di assetto della sua estremità, ognuna col suo segno (+ affonda, − emerge).</li><li>Controllo: (T′<sub>A</sub> + T′<sub>F</sub>) ÷ 2 deve essere vicino al nuovo T<sub>m</sub>′ della tabella.</li>'],
      [/Punto neutro|Cosa significano/, '<li>TPC, MCTC e X<sub>CF</sub> sono nella tabella (o nel testo). La distanza del punto neutro da F si calcola con la formula sopra: tieni le parentesi.</li>']
    ],
    maree: [
      [/Semiperiodo|Tempo passato|Quando la marea|Dove la curva/, '<li>Orari e altezze di <b>alta e bassa marea</b> sono nel testo; nella realtà si leggono nelle <b>tavole di marea</b> del porto (Annuario delle maree, Admiralty Tide Tables): cerca il porto nell\'indice, poi il mese e la riga del giorno.</li><li>Prendi le due maree una <b>prima</b> e una <b>dopo</b> l\'ora che ti interessa.</li>' + ORE],
      [/^Angolo$|Altezza di marea|Altezza all|Coseno e angolo|Istante/, '<li>Angolo = <b>180 × τ ÷ D</b> (τ e D in minuti). In calcolatrice: <b>180 × τ ÷ D =</b>.</li><li>Coseno: <b>cos Ans =</b> con la calcolatrice in <b>gradi</b> (D sul display). L\'angolo dal coseno: <b>SHIFT cos</b> (cos⁻¹).</li><li>Altezza: (h<sub>1</sub> + h<sub>2</sub>) ÷ 2 + (h<sub>1</sub> − h<sub>2</sub>) ÷ 2 × cos. Metti le parentesi: <b>(h1 + h2) ÷ 2 + (h1 − h2) ÷ 2 × cos(angolo) =</b>.</li>' + ORE],
      [/dodicesimi/, '<li>Dividi la marea in 6 «ore di marea» (D ÷ 6). In ognuna l\'acqua cambia di <b>1, 2, 3, 3, 2, 1</b> dodicesimi dell\'escursione (h<sub>alta</sub> − h<sub>bassa</sub>).</li><li>Somma i dodicesimi delle ore passate e moltiplica: dodicesimi ÷ 12 × escursione.</li>'],
      [/Altezza minima|fondale/, '<li>Il <b>fondale</b> è il numero scritto sulla carta nautica vicino al punto (in metri, sotto lo zero della carta); il testo può darlo dal portolano.</li><li>Il <b>pescaggio</b> è quello della nave; l\'<b>UKC</b> (acqua sotto la chiglia) lo decide la compagnia o il comandante. Altezza di marea minima = pescaggio + UKC (+ squat) − fondale.</li>'],
      [/Altezza massima|ponte/, '<li>L\'altezza del ponte e il livello a cui è riferita sono sulla carta nautica o nel portolano; air draft (AD) e margine (OC) sono nel testo.</li><li>Altezza di marea massima = altezza del ponte riferita allo zero − (AD + OC − squat): sopra questo valore la nave non passa.</li>'],
      [/Finestre|Intervalli/, '<li>La finestra è il tempo in cui l\'altezza di marea sta tra la minima (fondale) e la massima (ponte): leggila sulla curva e controlla gli orari trovati nei passi sopra.</li>' + ORE],
      [/Velocità/, '<li>Velocità = <b>distanza ÷ tempo in ore</b>. I minuti si trasformano in ore dividendo per 60: 1 h 45 min = 1 + 45 ÷ 60 = 1,75 h.</li>']
    ],
    bussole: [
      [/Tempo medio di Greenwich/, '<li>L\'ora del cronometro <b>T<sub>c</sub></b> e la sua correzione <b>K</b> sono nel testo: T<sub>m</sub>Gr = T<sub>c</sub> + K (K col suo segno).</li><li>Il cronometro segna solo 12 ore: per capire se a Greenwich è mattina o sera trasforma la longitudine in ore, <b>λ ÷ 15</b> (Est: Greenwich è indietro; Ovest: è avanti).</li><li>Ore, minuti e secondi in calcolatrice: <b>h <kbd>°′″</kbd> m <kbd>°′″</kbd> s <kbd>°′″</kbd></b>, poi + o −.</li>'],
      [/Effemeridi|Declinazione/, EFF],
      [/Angolo orario locale/, '<li><b>t = t<sub>Gr</sub> + λ</b>: la longitudine Est si somma, Ovest si sottrae. Se viene più di 360° togli 360°, se viene negativo aggiungi 360°.</li><li>In calcolatrice con gradi e primi: <b>t <kbd>°′″</kbd> primi <kbd>°′″</kbd> + λ <kbd>°′″</kbd> primi <kbd>°′″</kbd> =</b>.</li>'],
      [/Azimut vero/, '<li>φ (latitudine) è nel testo; δ dalle effemeridi o dal testo. Sud e Ovest vanno messi col <b>(−)</b>.</li><li>Formula dell\'ampiezza: <b>SHIFT cos ( sin δ ÷ cos φ ) =</b>. Al sorgere Z<sub>v</sub> = Z, al tramonto Z<sub>v</sub> = 360° − Z.</li><li>Formula dell\'azimut: <b>SHIFT tan ( sin t ÷ ( tan δ × cos φ − sin φ × cos t ) ) =</b>, poi scegli il quadrante come scritto nella spiegazione.</li>'],
      [/Girobussola/, '<li>La lettura della girobussola <b>a<sub>g</sub></b> è nel testo (a bordo si legge sul ripetitore con l\'alidada).</li><li>Errore: <b>Z<sub>v</sub> − a<sub>g</sub></b>. Positivo = Est, negativo = Ovest.</li><li>Errore di velocità: rotta vera R<sub>v</sub> e velocità V sono nel testo, φ è la latitudine; in calcolatrice <b>V × cos R<sub>v</sub> ÷ (5 × π × cos φ) =</b>.</li>'],
      [/Bussola magnetica/, '<li>La lettura della bussola magnetica <b>a<sub>b</sub></b> è nel testo.</li><li>La <b>declinazione magnetica d</b> si legge sulla rosa della carta nautica, con l\'anno e la variazione annua: aggiornala all\'anno dell\'esercizio.</li><li>La <b>deviazione</b> si legge nella tabella delle deviazioni della bussola di bordo, entrando con la prora bussola.</li>']
    ]
  };
  var GEN = '<li>Copia nella calcolatrice i numeri della riga sopra nello stesso ordine della formula, con le parentesi.</li><li>Se un dato non è nel testo, di solito è nella tabella o nel libro indicato all\'inizio dell\'esercizio.</li>';

  function how(title) {
    var L = G[page] || [];
    for (var i = 0; i < L.length; i++) if (L[i][0].test(title)) return L[i][1];
    return GEN;
  }
  function details(body, label, open) {
    var d = document.createElement('details'); d.className = 'qp-how';
    if (open) d.open = true;
    d.innerHTML = '<summary><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .8-1 1.5v.6"/><circle cx="12" cy="16.9" r=".4"/></svg>' + label + '</summary><ul>' + body + '</ul>';
    return d;
  }
  function addHow(root) {
    if (!G[page]) return;
    (root || document).querySelectorAll('section.steps').forEach(function (sec) {
      if (sec.dataset.qph) return; sec.dataset.qph = '1';
      var h2 = sec.querySelector('h2');
      if (h2) h2.after(details(CALC, 'Prima di iniziare: la calcolatrice'));
      sec.querySelectorAll('li.step').forEach(function (li) {
        var h3 = li.querySelector('h3'), box = h3 && h3.parentNode; if (!box) return;
        box.appendChild(details(how(h3.textContent.trim()), 'Come si fa'));
      });
    });
  }
  var pend = false;
  function scan() { pend = false; addHow(); watch(); }
  scan();
  new MutationObserver(function () { if (!pend) { pend = true; requestAnimationFrame(scan); } }).observe(document.body, { childList: true, subtree: true });
})();
