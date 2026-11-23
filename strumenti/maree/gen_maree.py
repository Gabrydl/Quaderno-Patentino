# Crea strumenti/maree.html (anteprima) ed esercizi/maree.html (pagina dell'app) con la grafica di Assetto e pescaggi.
# Uso: python3 -I strumenti/maree/gen_maree.py REPO_DIR
import os, re, sys
R = sys.argv[1]; W = os.path.join(R, 'strumenti', 'maree')
rd = lambda p: open(p, encoding='utf8').read()
a = rd(os.path.join(R, 'strumenti', 'assetto.html'))
head = a[:a.index('<div class="wrap">')]
head = head.replace('<title>Assetto e Pescaggi</title>', '<title>Maree</title>')
k = head.rindex('</style>')
head = head[:k] + '\n/* Maree */\n' + rd(os.path.join(W, 'extra.css')) + head[k:]
page = head + rd(os.path.join(W, 'corpo.html')) + '\n<script>\n' + rd(os.path.join(W, 'maree.js')) + '</script>\n</body></html>\n'
open(os.path.join(R, 'strumenti', 'maree.html'), 'w', encoding='utf8').write(page)
e = rd(os.path.join(R, 'esercizi', 'assetto.html'))
guard = e[e.index('<body>') + 6:e.index('\n<title>')]
app = page.replace('<body>', '<body>' + guard, 1)
app = app.replace('<meta name=viewport', '<meta name="robots" content="noindex"><link rel="icon" href="../icone/icona-192.png"><meta name=viewport', 1) if 'robots' in e[:3000] else app
open(os.path.join(R, 'esercizi', 'maree.html'), 'w', encoding='utf8').write(app)
print('maree', len(page), len(app))
