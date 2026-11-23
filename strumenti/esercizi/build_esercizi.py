# Ricostruisce tutte le pagine in esercizi/ e aggiunge la parte comune (dalla 1.06.00).
# Uso: python3 -I strumenti/esercizi/build_esercizi.py REPO_DIR
#  1) esercizi/assetto.html e esercizi/carteggio.html dalle sorgenti in strumenti/ (+ controllo dell'accesso e tasto "Quaderno")
#  2) Maree e Controllo bussole con i loro generatori; le Carte sinottiche (dalla 1.06.01 in Meteorologia) creano dati/sinottiche.html
#  3) a tutte: tema e telefono subito (app/presto.js), niente lampo bianco, niente versioni interne, "Come si fa", formule nello schermo
import os, re, subprocess, sys
R = os.path.abspath(sys.argv[1]); S = os.path.join(R, 'strumenti'); E = os.path.join(R, 'esercizi')
rd = lambda p: open(p, encoding='utf8').read()
def wr(p, s): open(p, 'w', encoding='utf8').write(s)

GUARD = ('<script>try{if(!localStorage.getItem("qp-sess"))location.replace("../")}catch(e){}</script>'
         '<a href="../" style="position:fixed;left:max(12px,env(safe-area-inset-left,0px));bottom:calc(14px + env(safe-area-inset-bottom,0px));'
         'z-index:9999;display:inline-flex;align-items:center;gap:6px;padding:10px 14px;border-radius:999px;background:#0b55c4;color:#fff;'
         'font:600 14px/1 system-ui,sans-serif;text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,.25)"><svg viewBox="0 0 24 24" width="16" height="16" '
         'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
         '<path d="M15 5.5L8.5 12l6.5 6.5"/></svg>Quaderno</a>')
HEAD0 = '<!doctype html><html><head><meta charset=utf8>'

# 1) pagine copiate dalle sorgenti
for n in ['assetto', 'carteggio']:
    src = rd(os.path.join(S, n + '.html'))
    assert src.startswith(HEAD0), n
    out = '<!doctype html><html><head><meta name="robots" content="noindex"><link rel="icon" href="../icone/icona-192.png"><meta charset=utf8>' + src[len(HEAD0):]
    out = out.replace('<body>', '<body>' + GUARD, 1)
    wr(os.path.join(E, n + '.html'), out)

# 2) generatori
for g in ['maree/gen_maree.py', 'bussole/gen_bussole.py', 'sinottiche/gen_sinottiche.py']:
    r = subprocess.run([sys.executable, '-I', os.path.join(S, g), R], capture_output=True, text=True)
    print(r.stdout.strip()); assert r.returncode == 0, r.stderr

# 3) parte comune
PRESTO = rd(os.path.join(S, 'app', 'presto.js'))
CSS = rd(os.path.join(S, 'esercizi', 'comune.css'))
JS = rd(os.path.join(S, 'esercizi', 'comune.js'))
BG = {  # colore di fondo della pagina, chiaro / scuro (prima che arrivi il resto dello stile)
    'assetto': ('#F2F5F8', '#0E1420'), 'maree': ('#F2F5F8', '#0E1420'), 'bussole': ('#F2F5F8', '#0E1420'),
    'carteggio': ('#E4EAEC', '#090F14')}
WRAP_OLD = ':root{color-scheme:light;box-sizing:border-box;'
for n, (lt, dk) in BG.items():
    p = os.path.join(E, n + '.html'); s = rd(p)
    assert '<!--qp-comune-->' not in s, n
    head = ('<!--qp-comune--><script>' + PRESTO + 'if("CSSViewTransitionRule" in window)document.documentElement.classList.add("qp-vtx");</script>'
            '<style>html{background:' + lt + ';color-scheme:light}@media (prefers-color-scheme:dark){html:not([data-theme=light]){background:' + dk + ';color-scheme:dark}}'
            'html[data-theme=dark]{background:' + dk + ';color-scheme:dark}html[data-theme=light]{background:' + lt + ';color-scheme:light}\n' + CSS + '</style>')
    if WRAP_OLD in s[:1500]:
        # cornice delle pagine copiate dagli artefatti: niente sfondo bianco fisso
        s = s.replace(WRAP_OLD, ':root{box-sizing:border-box;', 1)
        s = s.replace('font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#000}', 'font:14px -apple-system,BlinkMacSystemFont,sans-serif}', 1)
    k = s.index('</head>')
    s = s[:k] + head + s[k:]
    # i font di Google non bloccano più la prima immagine della pagina
    s = re.sub(r'<link rel="stylesheet" href="(https://fonts\.googleapis\.com/[^"]+)">', r'<link rel="stylesheet" href="\1" media="print" onload="this.media=\'all\'">', s)
    k = s.rindex('</body>')
    s = s[:k] + '<script>' + JS + '</script>\n' + s[k:]
    wr(p, s)
    print('comune', n, len(s))
