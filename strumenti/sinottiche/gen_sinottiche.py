# Crea esercizi/sinottiche.html (pagina dell'app) dalla galleria "Carte sinottiche a colori" (artefatto del 23/11/2026).
# Uso: python3 -I strumenti/sinottiche/gen_sinottiche.py REPO_DIR
import os, sys
R = sys.argv[1]
rd = lambda p: open(p, encoding='utf8').read()
g = rd(os.path.join(R, 'strumenti', 'sinottiche', 'galleria.html'))
g = g.replace(' Anteprima: non è ancora nel Quaderno.', '')
assert 'Anteprima' not in g[-3000:]
e = rd(os.path.join(R, 'esercizi', 'assetto.html'))
guard = e[e.index('<body>') + 6:e.index('\n<title>')]
# tema chiaro/scuro come nell'app; spazio in fondo per il tasto "Quaderno"
tema = ('<script>try{var t=localStorage.getItem("qp-theme");'
        'if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}</script>')
g = g.replace('<meta charset="utf-8">', '<meta charset="utf-8"><meta name="robots" content="noindex"><link rel="icon" href="../icone/icona-192.png">' + tema, 1)
g = g.replace('padding:clamp(18px,3vw,36px) max(4vw,14px) 48px', 'padding:clamp(18px,3vw,36px) max(4vw,14px) 96px', 1)
k = g.index('<body>') + 6
g = g[:k] + guard + g[k:]
open(os.path.join(R, 'esercizi', 'sinottiche.html'), 'w', encoding='utf8').write(g)
print('sinottiche', len(g))
