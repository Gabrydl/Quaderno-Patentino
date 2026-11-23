/* Quaderno Patentino: parte che gira subito, nel <head>, prima di disegnare la pagina.
   1) tema chiaro/scuro scelto dall'utente (niente lampo bianco)
   2) telefono: database dei modelli più usati con i pollici dello schermo; se il modello non è noto si misura lo schermo reale
   3) potenza: effetti pieni sui telefoni potenti, ridotti su quelli vecchi o col risparmio energetico (classe "lite")
   Usato sia dall'app (index.html) sia dalle pagine degli esercizi. */
(function () {
  var R = document.documentElement;
  try { var t = localStorage.getItem('qp-theme'); if (t === 'light' || t === 'dark') R.dataset.theme = t; } catch (e) {}

  /* ---------- database dei telefoni: codice o nome → [nome, pollici] ---------- */
  // Android: il codice del modello (es. SM-S918B) arriva dallo user agent dell'APK o da navigator.userAgentData.
  var AND = {
    // Samsung Galaxy S
    'SM-S938': ['Galaxy S25 Ultra', 6.9], 'SM-S936': ['Galaxy S25+', 6.7], 'SM-S931': ['Galaxy S25', 6.2], 'SM-S937': ['Galaxy S25 Edge', 6.7],
    'SM-S928': ['Galaxy S24 Ultra', 6.8], 'SM-S926': ['Galaxy S24+', 6.7], 'SM-S921': ['Galaxy S24', 6.2], 'SM-S721': ['Galaxy S24 FE', 6.7],
    'SM-S918': ['Galaxy S23 Ultra', 6.8], 'SM-S916': ['Galaxy S23+', 6.6], 'SM-S911': ['Galaxy S23', 6.1], 'SM-S711': ['Galaxy S23 FE', 6.4],
    'SM-S908': ['Galaxy S22 Ultra', 6.8], 'SM-S906': ['Galaxy S22+', 6.6], 'SM-S901': ['Galaxy S22', 6.1],
    'SM-G998': ['Galaxy S21 Ultra', 6.8], 'SM-G996': ['Galaxy S21+', 6.7], 'SM-G991': ['Galaxy S21', 6.2], 'SM-G990': ['Galaxy S21 FE', 6.4],
    'SM-G988': ['Galaxy S20 Ultra', 6.9], 'SM-G986': ['Galaxy S20+', 6.7], 'SM-G985': ['Galaxy S20+', 6.7], 'SM-G981': ['Galaxy S20', 6.2], 'SM-G980': ['Galaxy S20', 6.2],
    'SM-G780': ['Galaxy S20 FE', 6.5], 'SM-G781': ['Galaxy S20 FE', 6.5],
    'SM-G975': ['Galaxy S10+', 6.4], 'SM-G973': ['Galaxy S10', 6.1], 'SM-G970': ['Galaxy S10e', 5.8], 'SM-G965': ['Galaxy S9+', 6.2], 'SM-G960': ['Galaxy S9', 5.8],
    'SM-N986': ['Galaxy Note20 Ultra', 6.9], 'SM-N981': ['Galaxy Note20', 6.7], 'SM-N980': ['Galaxy Note20', 6.7], 'SM-N975': ['Galaxy Note10+', 6.8], 'SM-N970': ['Galaxy Note10', 6.3],
    // Samsung Galaxy A
    'SM-A566': ['Galaxy A56', 6.7], 'SM-A366': ['Galaxy A36', 6.7], 'SM-A266': ['Galaxy A26', 6.7], 'SM-A165': ['Galaxy A16', 6.7], 'SM-A166': ['Galaxy A16 5G', 6.7],
    'SM-A556': ['Galaxy A55', 6.6], 'SM-A356': ['Galaxy A35', 6.6], 'SM-A256': ['Galaxy A25', 6.5], 'SM-A155': ['Galaxy A15', 6.5], 'SM-A156': ['Galaxy A15 5G', 6.5],
    'SM-A057': ['Galaxy A05s', 6.7], 'SM-A055': ['Galaxy A05', 6.7],
    'SM-A546': ['Galaxy A54', 6.4], 'SM-A346': ['Galaxy A34', 6.6], 'SM-A245': ['Galaxy A24', 6.5], 'SM-A145': ['Galaxy A14', 6.6], 'SM-A146': ['Galaxy A14 5G', 6.6], 'SM-A047': ['Galaxy A04s', 6.5],
    'SM-A536': ['Galaxy A53', 6.5], 'SM-A336': ['Galaxy A33', 6.4], 'SM-A235': ['Galaxy A23', 6.6], 'SM-A236': ['Galaxy A23 5G', 6.6], 'SM-A135': ['Galaxy A13', 6.6], 'SM-A136': ['Galaxy A13 5G', 6.5], 'SM-A137': ['Galaxy A13', 6.6],
    'SM-A528': ['Galaxy A52s', 6.5], 'SM-A525': ['Galaxy A52', 6.5], 'SM-A526': ['Galaxy A52 5G', 6.5], 'SM-A325': ['Galaxy A32', 6.4], 'SM-A326': ['Galaxy A32 5G', 6.5],
    'SM-A225': ['Galaxy A22', 6.4], 'SM-A226': ['Galaxy A22 5G', 6.6], 'SM-A125': ['Galaxy A12', 6.5], 'SM-A127': ['Galaxy A12', 6.5],
    'SM-A715': ['Galaxy A71', 6.7], 'SM-A515': ['Galaxy A51', 6.5], 'SM-A516': ['Galaxy A51 5G', 6.5], 'SM-A505': ['Galaxy A50', 6.4], 'SM-A405': ['Galaxy A40', 5.9], 'SM-A202': ['Galaxy A20e', 5.8], 'SM-A217': ['Galaxy A21s', 6.5],
    'SM-M346': ['Galaxy M34', 6.5], 'SM-M336': ['Galaxy M33', 6.6], 'SM-M135': ['Galaxy M13', 6.6],
    'SM-F741': ['Galaxy Z Flip6', 6.7], 'SM-F731': ['Galaxy Z Flip5', 6.7], 'SM-F721': ['Galaxy Z Flip4', 6.7], 'SM-F711': ['Galaxy Z Flip3', 6.7],
    'SM-F956': ['Galaxy Z Fold6', 7.6], 'SM-F946': ['Galaxy Z Fold5', 7.6], 'SM-F936': ['Galaxy Z Fold4', 7.6],
    // Google Pixel (nome completo)
    'Pixel 9 Pro XL': ['Pixel 9 Pro XL', 6.8], 'Pixel 9 Pro Fold': ['Pixel 9 Pro Fold', 8], 'Pixel 9 Pro': ['Pixel 9 Pro', 6.3], 'Pixel 9a': ['Pixel 9a', 6.3], 'Pixel 9': ['Pixel 9', 6.3],
    'Pixel 8 Pro': ['Pixel 8 Pro', 6.7], 'Pixel 8a': ['Pixel 8a', 6.1], 'Pixel 8': ['Pixel 8', 6.2],
    'Pixel 7 Pro': ['Pixel 7 Pro', 6.7], 'Pixel 7a': ['Pixel 7a', 6.1], 'Pixel 7': ['Pixel 7', 6.3],
    'Pixel 6 Pro': ['Pixel 6 Pro', 6.7], 'Pixel 6a': ['Pixel 6a', 6.1], 'Pixel 6': ['Pixel 6', 6.4],
    // Xiaomi, Redmi, POCO (nome commerciale)
    'Redmi Note 14 Pro+': ['Redmi Note 14 Pro+', 6.67], 'Redmi Note 14 Pro': ['Redmi Note 14 Pro', 6.67], 'Redmi Note 14': ['Redmi Note 14', 6.67],
    'Redmi Note 13 Pro+': ['Redmi Note 13 Pro+', 6.67], 'Redmi Note 13 Pro': ['Redmi Note 13 Pro', 6.67], 'Redmi Note 13': ['Redmi Note 13', 6.67],
    'Redmi Note 12 Pro': ['Redmi Note 12 Pro', 6.67], 'Redmi Note 12': ['Redmi Note 12', 6.67], 'Redmi Note 11 Pro': ['Redmi Note 11 Pro', 6.67], 'Redmi Note 11': ['Redmi Note 11', 6.43],
    'Redmi Note 10 Pro': ['Redmi Note 10 Pro', 6.67], 'Redmi Note 10': ['Redmi Note 10', 6.43], 'Redmi Note 9': ['Redmi Note 9', 6.53], 'Redmi Note 8': ['Redmi Note 8', 6.3],
    'Redmi 14C': ['Redmi 14C', 6.88], 'Redmi 13C': ['Redmi 13C', 6.74], 'Redmi 13': ['Redmi 13', 6.79], 'Redmi 12C': ['Redmi 12C', 6.71], 'Redmi 12': ['Redmi 12', 6.79], 'Redmi 10': ['Redmi 10', 6.5], 'Redmi 9': ['Redmi 9', 6.53],
    'POCO X6 Pro': ['POCO X6 Pro', 6.67], 'POCO X6': ['POCO X6', 6.67], 'POCO X5 Pro': ['POCO X5 Pro', 6.67], 'POCO X5': ['POCO X5', 6.67], 'POCO F6': ['POCO F6', 6.67], 'POCO F5': ['POCO F5', 6.67], 'POCO M6 Pro': ['POCO M6 Pro', 6.67],
    'Xiaomi 14T Pro': ['Xiaomi 14T Pro', 6.67], 'Xiaomi 14T': ['Xiaomi 14T', 6.67], 'Xiaomi 14': ['Xiaomi 14', 6.36], 'Xiaomi 13T': ['Xiaomi 13T', 6.67], 'Xiaomi 13': ['Xiaomi 13', 6.36], 'Xiaomi 12': ['Xiaomi 12', 6.28],
    // altri
    'CPH2581': ['OnePlus 12', 6.82], 'CPH2449': ['OnePlus 11', 6.7], 'CPH2573': ['OnePlus 12R', 6.78], 'CPH2491': ['OnePlus Nord 3', 6.74], 'CPH2465': ['OnePlus Nord CE 3 Lite', 6.72],
    'moto g84 5G': ['Moto g84', 6.55], 'moto g54 5G': ['Moto g54', 6.5], 'moto g24': ['Moto g24', 6.56], 'moto g14': ['Moto g14', 6.5], 'motorola edge 40': ['Motorola edge 40', 6.55], 'motorola edge 50': ['Motorola edge 50', 6.7]
  };
  // iPhone: Safari non dice il modello, ma la misura dello schermo (punti CSS × densità) lo identifica.
  var IOS = {
    '440x956@3': ['iPhone 16 Pro Max', 6.9], '402x874@3': ['iPhone 16 Pro', 6.3],
    '430x932@3': ['iPhone 14 Pro Max / 15 Plus / 15 Pro Max / 16 Plus', 6.7], '393x852@3': ['iPhone 14 Pro / 15 / 15 Pro / 16', 6.1],
    '428x926@3': ['iPhone 12 Pro Max / 13 Pro Max / 14 Plus', 6.7], '390x844@3': ['iPhone 12 / 13 / 14 / 16e', 6.1],
    '375x812@3': ['iPhone X / XS / 11 Pro / 12 mini / 13 mini', 5.8], '414x896@3': ['iPhone XS Max / 11 Pro Max', 6.5], '414x896@2': ['iPhone XR / 11', 6.1],
    '414x736@3': ['iPhone 6/7/8 Plus', 5.5], '375x667@2': ['iPhone 6/7/8 / SE (2ª e 3ª gen.)', 4.7], '320x568@2': ['iPhone SE (1ª gen.)', 4]
  };

  var ua = navigator.userAgent || '', sw = screen.width, sh = screen.height, dpr = window.devicePixelRatio || 1;
  var W = Math.min(sw, sh), H = Math.max(sw, sh);
  function daCodice(code) {
    if (!code) return null;
    code = code.replace(/ Build.*/, '').trim();
    if (AND[code]) return { codice: code, nome: AND[code][0], pollici: AND[code][1] };
    if (/^SM-/.test(code) && AND[code.slice(0, 7)]) { var s = AND[code.slice(0, 7)]; return { codice: code, nome: s[0], pollici: s[1] }; }
    var best = null; for (var k in AND) if (code.indexOf(k) === 0 && (!best || k.length > best.length)) best = k;
    return best ? { codice: code, nome: AND[best][0], pollici: AND[best][1] } : { codice: code };
  }
  var dev = { w: W, h: H, dpr: dpr };
  var mA = ua.match(/Android [\d.]+; ([^;)]+)/);
  if (/iPhone/.test(ua)) { var k = W + 'x' + H + '@' + Math.round(dpr), x = IOS[k]; dev.sistema = 'ios'; if (x) { dev.nome = x[0]; dev.pollici = x[1]; } else dev.nome = 'iPhone'; }
  else if (mA) { dev.sistema = 'android'; var g = daCodice(mA[1] === 'K' ? '' : mA[1]); if (g) for (var q in g) dev[q] = g[q]; }
  // misura reale: in CSS su un telefono ci sono circa 160 px per pollice
  dev.misurati = Math.round(Math.hypot(W, H) / 160 * 10) / 10;
  if (!dev.pollici) dev.pollici = dev.misurati;
  function classi() {
    var vw = innerWidth || W, c = R.classList;
    c.remove('dev-xs', 'dev-s', 'dev-m', 'dev-l', 'dev-tab');
    c.add(vw >= 600 ? 'dev-tab' : vw <= 340 ? 'dev-xs' : vw <= 370 ? 'dev-s' : vw < 410 ? 'dev-m' : 'dev-l');
    // altezza reale dello schermo (la barra del browser la cambia)
    R.style.setProperty('--vh', (innerHeight / 100) + 'px');
    // pixel CSS per millimetro: serve a dare ai testi una misura fisica simile su tutti i telefoni
    var mm = Math.hypot(W, H) / (dev.pollici * 25.4);
    R.style.setProperty('--mm', mm.toFixed(3) + 'px');
  }
  classi();
  addEventListener('resize', classi, { passive: true });
  window.QP_DEV = dev;
  // Chrome per Android nasconde il modello nello user agent: lo chiede in modo asincrono
  if (dev.sistema === 'android' && !dev.nome && navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
    navigator.userAgentData.getHighEntropyValues(['model']).then(function (v) {
      var g = daCodice(v && v.model); if (!g) return; for (var q in g) dev[q] = g[q]; classi();
    }).catch(function () {});
  }

  /* ---------- potenza: automatica ---------- */
  var lite = false, mq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  if ((navigator.hardwareConcurrency || 8) <= 4) lite = true;
  if (navigator.deviceMemory && navigator.deviceMemory <= 3) lite = true;
  if (navigator.connection && navigator.connection.saveData) lite = true;
  if (mq && mq.matches) { lite = true; R.classList.add('calm'); }
  try { var f = localStorage.getItem('qp-potenza'); if (f === 'lite') lite = true; else if (f === 'piena') lite = false; } catch (e) {}
  if (lite) R.classList.add('lite');
  window.QP_LITE = function () { return R.classList.contains('lite'); };
  // batteria quasi scarica e non in carica → effetti ridotti (Android/Chrome)
  if (!lite && navigator.getBattery) navigator.getBattery().then(function (b) {
    function chk() { if (!b.charging && b.level <= 0.2) R.classList.add('lite'); }
    chk(); b.addEventListener('levelchange', chk); b.addEventListener('chargingchange', chk);
  }).catch(function () {});
  // misura della fluidità dopo il caricamento: se i fotogrammi sono lenti passa agli effetti ridotti
  if (!lite && window.requestAnimationFrame) addEventListener('load', function () {
    setTimeout(function () {
      var n = 0, t0 = 0, last = 0, slow = 0;
      function fr(t) { if (!t0) t0 = last = t; else { if (t - last > 34) slow++; last = t; } if (++n < 50) requestAnimationFrame(fr); else if (slow > 12 || (t - t0) / n > 26) R.classList.add('lite'); }
      requestAnimationFrame(fr);
    }, 700);
  });
})();
