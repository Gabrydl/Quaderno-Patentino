# Carte sinottiche a colori (galleria di 15 carte di analisi) dentro Meteorologia.
# Uso: python3 -I strumenti/sinottiche/gen_sinottiche.py REPO_DIR
# Dalla 1.06.01 (23/11/2026) non è più una pagina degli esercizi: è un argomento di Meteorologia.
#  - dati/sinottiche.html : le carte (disegni) e le spiegazioni di ogni carta, caricate solo quando si apre l'argomento
#  - strumenti/sinottiche/articolo.html : l'argomento che build.py mette in Meteorologia (testo cercabile + guscio della galleria)
#  - comandi della galleria: strumenti/sinottiche/sgal.css e sgal.js (li aggiunge build.py)
# Le carte sono anonime: nessun riferimento a chi le usa a lezione.
import os, re, sys
R = sys.argv[1]
rd = lambda p: open(p, encoding='utf8').read()
g = rd(os.path.join(R, 'strumenti', 'sinottiche', 'galleria.html'))

# --- testi anonimi ---
ANON = [('<h2>La carta del professore</h2>', '<h2>Carta di analisi del 2 febbraio 2015</h2>'),
        ('<p>È la carta che usa il professore. Mostra la situazione', '<p>Mostra la situazione'),
        ('<h2>6 ore prima della carta del professore</h2>', '<h2>Sei ore prima: 2 febbraio 2015, 00 UTC</h2>'),
        (' Anteprima: non è ancora nel Quaderno.', '')]
for a, b in ANON:
    assert g.count(a) == 1, a
    g = g.replace(a, b)

# --- pezzi della galleria ---
b0 = g.index('<body>') + 6
defs = g[b0:g.index('</svg>', b0) + 6]
assert 'id="land1076"' in defs
t0 = g.index('<div class="track"'); t1 = g.index('<button type="button" class="arr" id="prev"')
track = g[t0:t1]
slides = re.findall(r'<div class="slide"[^>]*>(<svg[\s\S]*?</svg>)</div>\s*(?=<div class="slide"|</div>)', track)
assert len(slides) == 15, len(slides)
p0 = g.index('<article class="panel" data-i="0"'); p1 = g.rindex('</article>') + len('</article>')
panels = g[p0:p1]
s0 = g.index('<section>', p1); s1 = g.index('</section>', s0) + len('</section>')
esame = g[s0:s1]
n0 = g.index('<p class="note">', s1); n1 = g.index('</p>', n0) + 4
nota = g[n0:n1]


def sg(html):
    """prefisso sg- alle classi fuori dai disegni (le classi dell'app non toccano la galleria)"""
    parts = re.split(r'(<svg[\s\S]*?</svg>)', html)
    for i in range(0, len(parts), 2):
        parts[i] = re.sub(r'class=(["\'])([^"\']+)\1', lambda m: 'class="' + ' '.join('sg-' + c for c in m.group(2).split()) + '"', parts[i])
    return ''.join(parts)


panels = sg(panels).replace('<article class="sg-panel"', '<div class="sg-panel"').replace('</article>', '</div>')
assert 'professor' not in (panels + esame + nota).lower()
dati = ('<!-- Carte sinottiche a colori: generato da strumenti/sinottiche/gen_sinottiche.py -->\n' + defs +
        '\n<div class="sg-slides">' + ''.join('<div class="sg-slide">' + s + '</div>' for s in slides) + '</div>\n'
        '<div class="sg-panels">' + panels + '</div>\n')
os.makedirs(os.path.join(R, 'dati'), exist_ok=True)
open(os.path.join(R, 'dati', 'sinottiche.html'), 'w', encoding='utf8').write(dati)

IC_PREV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5.5L8.5 12l6.5 6.5"/></svg>'
IC_NEXT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5.5l6.5 6.5L9 18.5"/></svg>'
art = ('<article class="topic" id="meteo-sinottiche-reali" data-ref="Esempio">\n'
       '<h3>Carte sinottiche a colori<span class="pg">Esempio</span></h3>\n'
       '<p>Quindici carte di <b>analisi</b> del Met Office ridisegnate a colori. Prima quelle con fenomeni diversi tra loro, alla fine quelle che li ripetono. '
       'Scorri con le frecce o col dito: sotto la carta cambiano data, fenomeni, legenda e la spiegazione di ogni numero.</p>\n'
       '<div class="sgal" data-src="dati/sinottiche.html">'
       '<figure class="sg-fig"><div class="sg-gal"><div class="sg-track" tabindex="0" aria-label="Carte sinottiche: scorri per cambiare carta">'
       '<div class="sg-slide sg-wait"><span>Carico le carte…</span></div></div>'
       '<button type="button" class="sg-arr sg-prev" aria-label="Carta precedente" hidden>' + IC_PREV + '</button>'
       '<button type="button" class="sg-arr sg-next" aria-label="Carta successiva" hidden>' + IC_NEXT + '</button></div>'
       '<p class="sg-count" aria-live="polite"></p>'
       '<div class="sg-figbar"><span class="sg-cap">Ridisegnate a colori dalle carte di analisi Met Office (© Crown Copyright)</span>'
       '<button type="button" class="sg-zbtn" disabled>Schermo intero</button></div></figure>'
       '<div class="sg-panels"></div></div>\n'
       + sg(esame).replace('<section>', '<div class="sg-box">').replace('</section>', '</div>') + '\n' + sg(nota) + '\n</article>')
open(os.path.join(R, 'strumenti', 'sinottiche', 'articolo.html'), 'w', encoding='utf8').write(art)
print('sinottiche', len(dati), len(art))
