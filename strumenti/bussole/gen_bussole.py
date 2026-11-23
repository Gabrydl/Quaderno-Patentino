# Crea strumenti/bussole.html (anteprima) ed esercizi/bussole.html (pagina dell'app) con la grafica di Assetto e pescaggi.
# Uso: python3 -I strumenti/bussole/gen_bussole.py REPO_DIR
import os, sys
R = sys.argv[1]; W = os.path.join(R, 'strumenti', 'bussole')
rd = lambda p: open(p, encoding='utf8').read()
a = rd(os.path.join(R, 'strumenti', 'assetto.html'))
head = a[:a.index('<div class="wrap">')].replace('<title>Assetto e Pescaggi</title>', '<title>Controllo bussole</title>')
k = head.rindex('</style>')
head = head[:k] + '\n/* Controllo bussole */\n' + rd(os.path.join(W, 'extra.css')) + head[k:]
js = ('<script>\n' + rd(os.path.join(W, 'lib', 'astronomy.browser.min.js')) + '\n</script>\n<script>\n' + rd(os.path.join(W, 'modello.js')) +
      '\n</script>\n<script>\n' + rd(os.path.join(W, 'bussole.js')) + '</script>\n')
page = head + rd(os.path.join(W, 'corpo.html')) + '\n' + js + '</body></html>\n'
open(os.path.join(R, 'strumenti', 'bussole.html'), 'w', encoding='utf8').write(page)
e = rd(os.path.join(R, 'esercizi', 'assetto.html'))
guard = e[e.index('<body>') + 6:e.index('\n<title>')]
app = page.replace('<body>', '<body>' + guard, 1).replace('<meta name=viewport', '<meta name="robots" content="noindex"><link rel="icon" href="../icone/icona-192.png"><meta name=viewport', 1)
open(os.path.join(R, 'esercizi', 'bussole.html'), 'w', encoding='utf8').write(app)
print('bussole', len(page), len(app))
