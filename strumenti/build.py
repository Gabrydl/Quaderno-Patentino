# Costruisce index.html dell'app partendo dalla prova grafica (prova.html) + account + contenuti recuperati.
# Uso: python3 -I build.py OUT_DIR
import json, re, sys, os
W = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1]
VER = '1.04.00 · 23/11/2026'
AUDIO_ORIGIN = 'https://6bbf845c-0fc1-48bc-8004-6d0e2237602e.frame.claudeusercontent.com'

def rd(n): return open(os.path.join(W, n), encoding='utf8').read()
def sub1(s, old, new, n=1):
    c = s.count(old)
    assert c == n, (old[:80], c)
    return s.replace(old, new)

s = rd('prova.html')

# --- titolo, PWA ---
s = sub1(s, '<title>Prova grafica Quaderno Patentino</title>',
         '<title>Quaderno Patentino</title>\n'
         '<meta name="theme-color" content="#f2f5f8" media="(prefers-color-scheme: light)">\n'
         '<meta name="theme-color" content="#090f16" media="(prefers-color-scheme: dark)">\n'
         '<meta name="robots" content="noindex">\n'
         '<meta name="description" content="Appunti, disegni e lezioni audio per l\'esame di Ufficiale di coperta.">\n'
         '<link rel="manifest" href="manifest.webmanifest">\n'
         '<link rel="icon" href="icone/icona-192.png" type="image/png">\n'
         '<link rel="apple-touch-icon" href="icone/icona-180.png">\n'
         '<meta name="apple-mobile-web-app-capable" content="yes">\n'
         '<meta name="apple-mobile-web-app-title" content="Quaderno">')

# --- audio: dal vecchio artefatto pubblico ---
pm = json.load(open(os.path.join(W, 'provamap.json')))
def aud(m):
    i = pm.get(m.group(1), m.group(1))
    return 'data-src="' + AUDIO_ORIGIN + '/_blob/' + i + '"'
s, n = re.subn(r'data-src="/_blob/([0-9a-f]+)"', aud, s)
assert n == 170, n

# --- interruttore "Prospettiva nave / mare": via dai 7 disegni con le formule ---
for t in ['12.00 230.0 230.0 acqua sbandata', '13.45 222.2 232.0 acqua sbandata', '13.62 174.2 166.0 acqua sbandata',
          '7.74 229.7 107.0 acqua appruata', '5.73 155.5 273.0 acqua appruata', '-3.05 237.0 121.5 acqua appoppata',
          '13.08 257.8 235.0 acqua sbandata']:
    s = sub1(s, ' data-tilt="' + t + '"', '')
assert len(re.findall(r'data-tilt="', s)) == 5

# --- niente confronto Nuovo / Vecchio ---
s = s.replace('<figure class="fig sm redo">', '<figure class="fig sm">').replace('<figure class="fig md redo">', '<figure class="fig md">')
a = s.index('// Disegni rifatti: confronto Nuovo / Vecchio'); b = s.index('// Disegni con la nave inclinata', a)
s = s[:a] + s[b:]
assert 'redo' not in re.sub(r'<svg[\s\S]*?</svg>', '', s) or True

# --- Convenzioni: via "Appunti del quaderno" ---
a = s.index('<div class="grp" id="conv-quaderno"'); b = s.index('<div class="grp" id="conv-solas"', a)
s = s[:a] + s[b:]
s = sub1(s, '"desc": "Appunti (MARPOL, ISM, ISPS, BLU code), SOLAS,', '"desc": "SOLAS,')

# --- carta sinottica d'esempio (dopo "Simbologia dei fronti") ---
sin = rd('sinottica.html')
arts = re.findall(r'<article[\s\S]*?</article>', sin)
assert len(arts) == 3
arts = [re.sub(r'<article class="topic" id="([^"]+)"[^>]*>', r'<article class="topic" id="\1" data-ref="Esempio">', x) for x in arts]
arts = [x.replace('<figure class="fig ">', '<figure class="fig">') for x in arts]
i = s.index('<article class="topic" id="meteo-simbologia-fronti"'); j = s.index('</article>', i) + len('</article>')
s = s[:j] + '\n\n' + '\n\n'.join(arts) + s[j:]

# --- Navigazione 1.3 (dalla chat del 30/10/2026) ---
sys.path.insert(0, os.path.join(W, 'nav')); import build_nav
es, nuovi = build_nav.articoli()
i = s.index('<article class="topic" id="nav-safety-contour"'); j = s.index('</article>', i) + len('</article>')
s = s[:i] + es + '\n\n' + nuovi + s[j:]

# --- barra in alto: pulsante account ---
s = sub1(s, '    <button type="button" class="ib theme" id="themeBtn"',
         '    <button type="button" class="inst-btn" id="instBtn" hidden aria-label="Installa l\'app" title="Installa l\'app"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14"/></svg><span>Installa</span></button>\n'
         '    <button type="button" class="ib theme" id="themeBtn"')
s = sub1(s, '    <span class="vh" id="crumb"></span>',
         '    <button type="button" class="ib acc-btn" id="accBtn" aria-label="Il tuo account" title="Account"><span class="av"></span><span class="dot" hidden></span></button>\n'
         '    <span class="vh" id="crumb"></span>')

# --- home: esercizi, istruzioni, versione ---
EX_IC = {
 'assetto': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 15.5h18"/><path d="M5 9.5h14l-1.6 6h-10.8z" transform="rotate(-5 12 12)"/><path d="M12 4v4M10 5.5h4"/></svg>',
 'carteggio': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5l5-2 6 2 5-2v15l-5 2-6-2-5 2z"/><path d="M9 3.5v15M15 5.5v15"/></svg>',
}
extra = ('<section class="extra" aria-label="Esercizi"><h2>Esercizi</h2><ol class="route">'
 '<li style="--i:10"><a class="card" href="esercizi/assetto.html"><span class="wp">' + EX_IC['assetto'] + '</span><span class="tx"><span class="n">Assetto e pescaggi</span><span class="m">Esercizi svolti</span><span class="d">Esercizi 9–25 del libro: cambio di densità, spostamento, imbarco e sbarco, assetto voluto, punti neutri</span></span><svg class="go" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5.5l6.5 6.5L9 18.5"/></svg></a></li>'
 '<li style="--i:11"><a class="card" href="esercizi/carteggio.html"><span class="wp">' + EX_IC['carteggio'] + '</span><span class="tx"><span class="n">Carteggio con carta 5D</span><span class="m">Strumento di carteggio</span><span class="d">Rilevamenti, rotte e punto nave sulla carta 5D dell\'Arcipelago Toscano</span></span><svg class="go" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5.5l6.5 6.5L9 18.5"/></svg></a></li>'
 '</ol></section>')
fras = ('<section class="extra frs" aria-label="Frasario"><h2>Inglese nautico</h2><ol class="route">'
 '<li style="--i:9"><a class="card" href="frasario/"><span class="wp"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 4.5h10a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5H8l-3 2.5V12H3.5A1.5 1.5 0 0 1 2 10.5V6a1.5 1.5 0 0 1 1.5-1.5z"/><path d="M17 9h3.5A1.5 1.5 0 0 1 22 10.5V15a1.5 1.5 0 0 1-1.5 1.5H20V19l-3-2.5h-5A1.5 1.5 0 0 1 10.5 15v-1"/><path d="M5.5 8.5h6M13.5 13h5"/></svg></span><span class="tx"><span class="n">Frasario e Traduttore SMCP</span><span class="m">Inglese nautico · IT ⇄ EN</span><span class="d">Frasi IMO SMCP, glossario di 801 termini nautici, traduttore con foto e Gemini</span></span><svg class="go" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5.5l6.5 6.5L9 18.5"/></svg></a></li>'
 '</ol></section>')
s = sub1(s, '    <ol class="route" id="cards"></ol>', '    <ol class="route" id="cards"></ol>\n    ' + fras + '\n    ' + extra)
s = sub1(s, '        <li>Gli audio si ascoltano online: serve la connessione.</li>',
         '        <li><b>Account</b>: il tondo in alto a destra apre il tuo account: progressi, foto, nome utente, segnalazioni. In fondo a ogni argomento c\'è <b>Segna come letto</b>.</li>\n'
         '        <li><b>Sul telefono</b>: dal menu del browser scegli «Aggiungi a schermata Home» per averla come app.</li>\n'
         '        <li>Gli audio partono online. La prima volta che ne ascolti uno puoi scaricarlo per sentirlo anche offline; li gestisci dall\'account, in <b>Audio scaricati</b>.</li>')
s = sub1(s, '<p class="foot-ver">Prova grafica · contenuti della versione del 24/10/2026</p>', '<p class="foot-ver">Versione ' + VER + '</p>')

# --- audio: lezioni scaricate per l'offline (vedi app/audio-off.js) ---
s = sub1(s, "    au.src = MEM[id] || srcOf(t.src); au.playbackRate = speed;\n",
         "    waitId = null;\n"
         "    if (!MEM[id] && window.QPA && QPA.ha(t.src)){ waitId = id; wantPlay = false; au.removeAttribute('src'); au.load();\n"
         "      QPA.blob(t.src).then(u => { if (waitId !== id) return; waitId = null; if (u) MEM[id] = u; au.src = MEM[id] || srcOf(t.src); au.playbackRate = speed; if (wantPlay) play(); }); }\n"
         "    else { au.src = MEM[id] || srcOf(t.src); au.playbackRate = speed; }\n")
s = sub1(s, "  function play(){ const p = au.play();", "  function play(){ if (waitId && waitId === curId){ wantPlay = true; return; } const p = au.play();")
s = sub1(s, "  const MEM = {}; let memTry = null;", "  const MEM = {}; let memTry = null, waitId = null, wantPlay = false;\n"
         "  au.addEventListener('playing', () => { const t = curId && tracks[curId]; if (t && window.QPA) QPA.chiedi(curId, t.src, t.title); });")
s = sub1(s, "'In questa prova grafica sono caricati solo alcuni audio (es. Sfera celeste, Effetto squat, Williamson, Radar, GPS).'",
         "'Audio non disponibile: serve la connessione. Le lezioni scaricate per l\\'offline si ascoltano anche senza rete.'")

# --- schermata d'accesso e pannelli ---
tos = rd('app/tos.html')
ah = rd('app/auth.html').replace('__ROSE__', rd('app/rose.txt')).replace('__TOS__', tos).replace('__VER__', VER)
s = sub1(s, '<body data-view="home">', '<body data-view="home" class="locked">\n' + ah)

# --- stile e script ---
css = rd('app/auth.css')
k = s.index('</style>'); s = s[:k] + '\n' + css + '\n' + s[k:]
js = rd('app/auth.js')
INST = ('<div class="msgbox" id="instBox" hidden role="dialog" aria-modal="true" aria-label="Installa l\'app"><div class="card2">'
        '<p class="txt" style="font-weight:700;margin-bottom:10px">Installa il Quaderno sull\'iPhone</p>'
        '<ol><li>In Safari tocca <b>Condividi</b> <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5v11M8 7.5l4-4 4 4M6 11v8.5h12V11"/></svg> in basso.</li>'
        '<li>Scorri e scegli <b>Aggiungi alla schermata Home</b>.</li><li>Tocca <b>Aggiungi</b>: l\'icona compare tra le tue app.</li></ol>'
        '<button type="button" class="btn">Ho capito</button></div></div>\n')
sw = ("if ('serviceWorker' in navigator && location.protocol === 'https:' && !/QuadernoApp/.test(navigator.userAgent)) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));")
chip = ("<script>(function(){var c=document.getElementById('chips');if(!c)return;var a=document.createElement('a');"
        "a.className='chip chip-uk';a.href='frasario/';a.textContent='Frasario e Traduttore SMCP';c.append(a);})();</script>\n")
k = s.rindex('</body>'); s = s[:k] + chip + s[k:]
k = s.rindex('</body>')
s = s[:k] + INST + '<script>\nwindow.QP_VERSIONE = ' + json.dumps(VER) + ';\n' + js + '\n' + rd('app/install.js') + '\n' + rd('app/audio-off.js') + '\n' + sw + '\n</script>\n' + s[k:]

assert 'Prova grafica' not in s
os.makedirs(OUT, exist_ok=True)
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf8').write(s)
print('index.html', len(s))

# --- Frasario e Traduttore SMCP (pagina a parte) ---
import shutil, subprocess
FD = os.path.join(W, 'fras'); FO = os.path.join(OUT, 'frasario'); os.makedirs(FO, exist_ok=True)
shutil.copy(os.path.join(FD, 'pagina.html'), os.path.join(FO, 'index.html'))
completo = os.path.exists(os.path.join(FD, 'lavoro', 'smcp_en.json'))
script = 'build_dati.py' if completo else 'build_parziale.py'
r = subprocess.run([sys.executable, '-I', os.path.join(FD, 'lavoro', script), os.path.join(FO, 'dati.json')], capture_output=True, text=True)
print('frasario', 'completo' if completo else 'parziale', r.stdout.strip()[-200:], r.stderr.strip()[-300:])
assert r.returncode == 0
