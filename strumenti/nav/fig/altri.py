# Disegni per Emergenze (collisione, porto) e Passage plan / ECDIS — stile del Quaderno.
import math, os
OUT = os.path.dirname(os.path.abspath(__file__))

def svg(w, h, body, label):
    return f'<svg viewBox="0 0 {w} {h}" role="img" aria-label="{label}" xmlns="http://www.w3.org/2000/svg">\n{body}\n</svg>'
def lab(x, y, txt, anchor='start', cls='xs', extra=''):
    return f'<text class="{cls}{(" " + extra) if extra else ""}" x="{x}" y="{y}" text-anchor="{anchor}">{txt}</text>'
def lead(x1, y1, x2, y2):
    return f'<path style="fill:none;stroke:var(--muted);stroke-width:1.1" d="M{x1},{y1}L{x2},{y2}"/><circle cx="{x1}" cy="{y1}" r="2.4" style="fill:var(--muted)"/>'
def ship(x0, x1, y, half, cls='s', fill='fillgr'):
    """nave vista dall'alto, prora a destra"""
    d = f'M{x0},{y - half}H{x1 - 2.2 * half}Q{x1},{y - half} {x1},{y}Q{x1},{y + half} {x1 - 2.2 * half},{y + half}H{x0}Q{x0 - 6},{y} {x0},{y - half}Z'
    return f'<path class="{fill}" d="{d}"/><path class="{cls}" d="{d}"/>'
def arrow(x1, y1, x2, y2, col='currentColor', w=2.2, head=8):
    a = math.atan2(y2 - y1, x2 - x1); hx, hy = x2 - head * math.cos(a), y2 - head * math.sin(a)
    px, py = -math.sin(a) * head * 0.45, math.cos(a) * head * 0.45
    return (f'<path d="M{x1:.1f},{y1:.1f}L{hx:.1f},{hy:.1f}" style="fill:none;stroke:{col};stroke-width:{w};stroke-linecap:round"/>'
            f'<path d="M{x2:.1f},{y2:.1f}L{hx + px:.1f},{hy + py:.1f}L{hx - px:.1f},{hy - py:.1f}Z" style="fill:{col};stroke:none"/>')

# ================================================================== collisione
b = []
for k, ox in enumerate((0, 400)):
    b.append(f'<g transform="translate({ox},0)">')
    b.append(ship(30, 360, 120, 30))                                   # nave B colpita
    b.append(lab(70, 125, 'NAVE B', 'start', 'sm'))
    shift = 0 if k == 0 else 46
    # nave A: arriva dal basso a 60°; la prora entra nel fianco di B
    ang = -60
    bx, by = 205 - shift * math.cos(math.radians(60)), 168 + shift * math.sin(math.radians(60))
    b.append(f'<g transform="translate({bx:.1f},{by:.1f}) rotate({ang})">{ship(-230, 0, 0, 24)}<text class="sm" x="-80" y="5" text-anchor="middle">NAVE A</text></g>')
    if k == 0:
        b.append('<path d="M184,150L205,168" style="stroke:var(--red);stroke-width:3"/>')
        b.append(lab(200, 34, 'Prora incastrata', 'middle', 'sm'))
        b.append(lab(200, 52, 'la prora di A fa da tappo alla falla di B', 'middle', 'xs', 'tg'))
    else:
        b.append('<path d="M170,150 Q186,160 200,150" class="bg"/><path d="M168,150 L184,166 L202,150" style="fill:var(--sheet);stroke:var(--red);stroke-width:2.6;stroke-linejoin:round"/>')
        for dx in (-14, 0, 14):
            b.append(arrow(186 + dx, 196, 186 + dx * 0.6, 162, 'var(--blue)', 2, 7))
        b.append(lab(200, 34, 'Se si separano subito', 'middle', 'sm'))
        b.append(lab(200, 52, 'la falla si apre e l’acqua entra in B (e in A)', 'middle', 'xs', 'tr'))
        b.append(arrow(150, 250, 112, 316 - 0, 'var(--red)', 2.2, 9))
        b.append(lab(150, 316, 'macchina indietro', 'start', 'xs', 'tr'))
    b.append('</g>')
b.append('<path class="t" style="stroke:var(--line)" d="M400,20V320"/>')
open(os.path.join(OUT, 'collisione.svg'), 'w').write(svg(800, 330, '\n'.join(b), 'Collisione: perché non separare subito le navi'))

# ================================================================== nave in banchina
b = []
b.append('<rect class="fillgr" x="20" y="268" width="760" height="62"/><path class="s" d="M20,268H780"/>')
b.append(lab(250, 322, 'BANCHINA', 'middle', 'sm'))
b.append(lab(30, 30, 'MARE', 'start', 'sm', 'tb'))
b.append(ship(90, 700, 210, 38))
b.append(lab(360, 215, 'NAVE ORMEGGIATA', 'middle', 'xs'))
for x in (40, 172, 330, 470, 640, 760):
    b.append(f'<circle class="pt" cx="{x}" cy="280" r="4.5"/>')
lines = [((96, 236), (40, 280)), ((172, 248), (172, 280)), ((250, 248), (470, 280)),
         ((540, 248), (330, 280)), ((640, 248), (640, 280)), ((690, 232), (760, 280))]
for (x1, y1), (x2, y2) in lines:
    b.append(f'<path d="M{x1},{y1}L{x2},{y2}" style="stroke:var(--orange);stroke-width:2"/>')
for x, t, anc in ((40, 'cima di poppa', 'start'), (186, 'traversino', 'middle'), (330, 'spring', 'middle'), (470, 'spring', 'middle'), (640, 'traversino', 'middle'), (760, 'cima di prora', 'end')):
    b.append(lab(x if anc == 'middle' else (x - 14 if anc == 'start' else x + 14), 300, t, anc, 'xs', 'to'))
# passerella, piano antincendio, raccordo internazionale
b.append('<path class="s" d="M582,248L594,276M598,248L610,276"/><path class="t" d="M584,254H600M588,262H604M592,270H608"/>')
b.append(lab(596, 318, 'passerella', 'middle', 'xs'))
b.append('<rect x="616" y="250" width="16" height="12" rx="2" style="fill:var(--red)"/>')
b.append(lead(624, 256, 664, 352)); b.append(lab(668, 356, 'piano antincendio', 'start', 'xs')); b.append(lab(668, 371, 'in contenitore', 'start', 'xs'))
b.append('<circle cx="566" cy="254" r="6" style="fill:none;stroke:var(--red);stroke-width:2.4"/><path d="M560,254H572M566,248V260" style="stroke:var(--red);stroke-width:1.4"/>')
b.append(lead(566, 254, 520, 352)); b.append(lab(516, 356, 'raccordo internazionale', 'end', 'xs')); b.append(lab(516, 371, '(acqua antincendio da terra)', 'end', 'xs'))
# cavi d'emergenza lato mare
for x in (130, 660):
    b.append(f'<path d="M{x},172L{x - 6},150L{x + 6},136L{x - 4},118" style="fill:none;stroke:var(--red);stroke-width:2.4;stroke-linejoin:round"/><circle cx="{x - 4}" cy="116" r="4" style="fill:var(--red)"/>')
b.append(lab(100, 62, 'cavi d’emergenza (fire wires)', 'start', 'xs', 'tr'))
b.append(lab(100, 78, 'a prora e a poppa, lato mare', 'start', 'xs', 'tr'))
b.append(lead(126, 112, 140, 84))
b.append(lead(656, 112, 680, 70)); b.append(lab(684, 62, 'fire wire', 'start', 'xs', 'tr'))
# bettolina e panne
b.append(ship(400, 540, 132, 15, 't'))
b.append(lab(470, 136, 'bettolina', 'middle', 'xs'))
b.append('<path d="M380,172Q368,98 470,94Q572,98 560,172" style="fill:none;stroke:var(--orange);stroke-width:3;stroke-dasharray:6 4"/>')
b.append(lead(556, 124, 590, 96)); b.append(lab(594, 92, 'panne galleggianti', 'start', 'xs', 'to')); b.append(lab(594, 107, '(bunkeraggio)', 'start', 'xs', 'to'))
for x in range(170, 660, 60):
    b.append(f'<circle cx="{x}" cy="178" r="2.6" class="pt"/>')
b.append(lead(290, 178, 280, 120)); b.append(lab(280, 114, 'ombrinali tappati', 'middle', 'xs'))
open(os.path.join(OUT, 'porto.svg'), 'w').write(svg(800, 380, '\n'.join(b), 'Nave in banchina: dotazioni per le emergenze in porto'))

# ================================================================== APEM
b = []
boxes = [
    (40, 40, 'tb', '1 · VALUTAZIONE', 'Appraisal', ['carte e pubblicazioni aggiornate', 'maree, correnti, meteo', 'pescaggio e condizioni nave']),
    (380, 40, 'tb', '2 · PIANIFICAZIONE', 'Planning', ['rotta, waypoint, WOP', 'no-go area, margini, UKC', 'abort point, ancoraggi']),
    (380, 230, 'tg', '3 · ESECUZIONE', 'Execution', ['approvazione del comandante', 'ETA, briefing della guardia', 'quando chiamare il comandante']),
    (40, 230, 'tg', '4 · MONITORAGGIO', 'Monitoring', ['punto nave con 2 metodi', 'controllo XTE e allarmi', 'registrazione sul giornale']),
]
for x, y, c, t, en, ls in boxes:
    col = 'var(--blue)' if c == 'tb' else 'var(--green)'
    b.append(f'<rect x="{x}" y="{y}" width="280" height="130" rx="12" style="fill:color-mix(in srgb,{col} 8%,var(--sheet));stroke:{col};stroke-width:2"/>')
    b.append(lab(x + 18, y + 30, t, 'start', 'sm', c)); b.append(lab(x + 262, y + 30, en, 'end', 'xs', ''))
    for i, l in enumerate(ls):
        b.append(lab(x + 18, y + 62 + i * 22, '• ' + l, 'start', 'xs'))
b.append(arrow(326, 105, 372, 105, 'currentColor', 2.4, 10))
b.append(arrow(520, 176, 520, 224, 'currentColor', 2.4, 10))
b.append(arrow(374, 295, 328, 295, 'currentColor', 2.4, 10))
b.append(arrow(180, 224, 180, 178, 'currentColor', 2.4, 10))
b.append(lab(350, 382, 'da banchina a banchina (berth to berth) · SOLAS V/34 · IMO A.893(21)', 'middle', 'xs', ''))
b.append(lab(350, 186, 'PREPARAZIONE', 'middle', 'xs', 'tb'))
b.append(lab(350, 222, 'IN NAVIGAZIONE', 'middle', 'xs', 'tg'))
open(os.path.join(OUT, 'apem.svg'), 'w').write(svg(700, 396, '\n'.join(b), 'Le quattro fasi del passage plan'))

# ================================================================== passage plan su carta
b = []
LAND = 'fill:color-mix(in srgb,var(--orange) 13%,var(--sheet));stroke:currentColor;stroke-width:1.6'
b.append('<defs><pattern id="pp-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0,0V7" style="stroke:var(--red);stroke-width:1.6"/></pattern></defs>')
b.append(f'<path d="M820,0H700Q672,40 690,80Q700,104 650,112Q610,120 620,150Q630,175 580,190Q600,215 660,230Q720,260 690,320L700,400H820Z" style="{LAND}"/>')
b.append(f'<path d="M0,0H300Q280,40 230,52Q170,62 150,100Q130,140 60,150Q20,156 0,180Z" style="{LAND}"/>')
# secche (no-go) e safety contour
for cx, cy, r in ((530, 165, 18), (430, 118, 20), (340, 292, 24)):
    b.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" style="fill:url(#pp-hatch);stroke:var(--red);stroke-width:1.4"/>')
    b.append(f'<circle cx="{cx}" cy="{cy}" r="{r + 9}" style="fill:none;stroke:var(--blue);stroke-width:2.4"/>')
b.append('<path d="M640,96Q600,104 604,140Q608,170 562,188Q570,216 632,236Q690,256 672,320" style="fill:none;stroke:var(--blue);stroke-width:2.4"/>')
# rotta, corridoio XTD
WP = [(70, 360), (260, 250), (430, 210), (560, 40)]
XTD = 18
def offset(p, q, d):
    ang = math.atan2(q[1] - p[1], q[0] - p[0]); nx, ny = -math.sin(ang) * d, math.cos(ang) * d
    return (p[0] + nx, p[1] + ny), (q[0] + nx, q[1] + ny)
for i in range(3):
    for s_ in (1, -1):
        a_, c_ = offset(WP[i], WP[i + 1], s_ * XTD)
        b.append(f'<path d="M{a_[0]:.1f},{a_[1]:.1f}L{c_[0]:.1f},{c_[1]:.1f}" style="stroke:var(--violet);stroke-width:1.2;stroke-dasharray:5 4"/>')
b.append('<path d="M' + 'L'.join(f'{x},{y}' for x, y in WP) + '" style="fill:none;stroke:var(--red);stroke-width:2.8;stroke-linejoin:round"/>')
for i, (x, y) in enumerate(WP):
    b.append(f'<circle cx="{x}" cy="{y}" r="7" style="fill:var(--sheet);stroke:var(--red);stroke-width:2.4"/>')
pos = [(84, 380, 'start'), (250, 280, 'end'), (440, 236, 'start'), (548, 36, 'end')]
for i, (x, y, anc) in enumerate(pos):
    b.append(lab(x, y, f'WP{i + 1}', anc, 'xs', 'tr'))
b.append(lab(176, 316, '060° · 11,0 M', 'middle', 'xs', 'tr'))
b.append(lab(318, 224, '077° · 8,7 M', 'middle', 'xs', 'tr'))
b.append(lab(476, 72, '037° · 10,7 M', 'end', 'xs', 'tr'))
# WOP prima delle accostate
for (x, y) in ((240, 262), (414, 214)):
    b.append(f'<path d="M{x - 6},{y - 13}L{x + 6},{y + 13}" style="stroke:var(--orange);stroke-width:3.4"/>')
b.append(lead(240, 262, 160, 214)); b.append(lab(156, 210, 'WOP (wheel over point)', 'end', 'xs', 'to'))
# abort point
ab = (449.5, 184.5)
b.append(f'<path d="M{ab[0] - 16},{ab[1] - 12}L{ab[0] + 16},{ab[1] + 12}" style="stroke:var(--red);stroke-width:4"/>')
b.append(lead(ab[0] + 14, ab[1] + 10, 520, 252)); b.append(lab(524, 256, 'punto di abort', 'start', 'xs', 'tr')); b.append(lab(524, 271, '(ultimo punto per rinunciare)', 'start', 'xs', 'tr'))
# Capo Nero: parallel index
b.append('<circle class="pt" cx="575" cy="190" r="4"/>'); b.append(lab(610, 204, 'Capo Nero', 'start', 'xs'))
b.append('<path d="M510,275L600,157" style="stroke:var(--green);stroke-width:2.2;stroke-dasharray:10 4"/>')
b.append('<path d="M493,127L575,190" style="stroke:var(--green);stroke-width:1.3"/>'); b.append(lab(548, 146, '5,2 M', 'start', 'xs', 'tg'))
b.append(lead(520, 262, 470, 330)); b.append(lab(470, 346, 'parallel index (radar): Capo Nero', 'middle', 'xs', 'tg')); b.append(lab(470, 361, 'deve scorrere su questa linea', 'middle', 'xs', 'tg'))
# faro e rilevamento limite
b.append('<path d="M638,116l8,-20l8,20z" style="fill:var(--violet)"/><circle cx="646" cy="92" r="4.5" style="fill:var(--orange)"/>')
b.append(lab(660, 112, 'Faro', 'start', 'xs'))
b.append('<path d="M646,108L380,136" style="stroke:var(--violet);stroke-width:2;stroke-dasharray:12 4 2 4"/>')
b.append(lab(372, 152, 'rilevamento limite: faro NMT 084°', 'end', 'xs', 'tv'))
# ancoraggio d'emergenza
anc = 'M300,108V128M292,114H308M288,122Q300,136 312,122'
b.append(f'<circle cx="300" cy="120" r="16" style="fill:var(--sheet);stroke:var(--blue);stroke-width:1.6"/><circle cx="300" cy="106" r="2.6" style="fill:none;stroke:var(--blue);stroke-width:1.6"/><path d="{anc}" style="fill:none;stroke:var(--blue);stroke-width:1.8"/>')
b.append(lab(276, 112, 'ancoraggio', 'end', 'xs', 'tb')); b.append(lab(276, 127, 'd’emergenza', 'end', 'xs', 'tb'))
# VTS e pilota
b.append('<path d="M300,330L360,170" style="stroke:var(--blue);stroke-width:1.8;stroke-dasharray:2 4"/>')
b.append(lab(296, 344, 'linea di chiamata VTS', 'end', 'xs', 'tb'))
b.append('<circle cx="536" cy="70" r="10" style="fill:var(--sheet);stroke:var(--blue);stroke-width:2"/>')
b.append(lab(536, 75, 'P', 'middle', 'xs', 'tb')); b.append(lab(552, 75, 'imbarco pilota', 'start', 'xs', 'tb'))
# legenda e nord
b.append('<path d="M20,384h40" style="stroke:var(--blue);stroke-width:2.6"/>'); b.append(lab(66, 389, 'safety contour', 'start', 'xs', 'tb'))
b.append('<rect x="176" y="378" width="28" height="12" style="fill:url(#pp-hatch);stroke:var(--red)"/>'); b.append(lab(210, 389, 'no-go area', 'start', 'xs', 'tr'))
b.append('<path d="M296,384h40" style="stroke:var(--violet);stroke-width:1.2;stroke-dasharray:5 4"/>'); b.append(lab(342, 389, 'limiti XTD', 'start', 'xs', 'tv'))
b.append('<path d="M772,370V330" style="stroke:currentColor;stroke-width:2"/><path d="M772,324l-6,12h12z" class="pt"/>'); b.append(lab(772, 318, 'N', 'middle', 'xs'))
open(os.path.join(OUT, 'passage_plan.svg'), 'w').write(svg(820, 400, '\n'.join(b), 'Passage plan su carta: waypoint, WOP, no-go area, safety contour, parallel index, rilevamento limite, abort point'))

# ================================================================== schermo ECDIS
b = []
FIX = {'deep': '#ffffff', 'md': '#d8e6f2', 'ms': '#a9cbe9', 'vs': '#73a7d9', 'land': '#efe1b9', 'txt': '#18212b', 'mag': '#c6168d', 'grey': '#7b8a99'}
b.append('<rect x="20" y="20" width="780" height="440" rx="14" style="fill:#1b232c;stroke:none"/>')
b.append('<g><clipPath id="ec-clip"><rect x="34" y="34" width="560" height="412"/></clipPath>')
b.append('<g clip-path="url(#ec-clip)">')
b.append(f'<rect x="34" y="34" width="560" height="412" style="fill:{FIX["deep"]}"/>')
b.append(f'<path d="M34,34H594V446H34Z" style="fill:{FIX["deep"]}"/>')
b.append(f'<path d="M330,34Q300,120 360,170Q420,220 380,300Q350,380 420,446H594V34Z" style="fill:{FIX["md"]}"/>')
b.append(f'<path d="M400,34Q370,120 420,165Q470,215 440,300Q420,380 470,446H594V34Z" style="fill:{FIX["ms"]}"/>')
b.append(f'<path d="M450,34Q430,110 470,160Q512,210 492,300Q478,380 512,446H594V34Z" style="fill:{FIX["vs"]}"/>')
b.append(f'<path d="M500,34Q482,104 516,152Q556,206 540,300Q530,380 560,446H594V34Z" style="fill:{FIX["land"]};stroke:{FIX["txt"]};stroke-width:1.2"/>')
b.append(f'<path d="M400,34Q370,120 420,165Q470,215 440,300Q420,380 470,446" style="fill:none;stroke:{FIX["txt"]};stroke-width:3"/>')
b.append(f'<ellipse cx="300" cy="300" rx="34" ry="22" style="fill:{FIX["ms"]};stroke:{FIX["txt"]};stroke-width:2.4"/>')
# pericolo isolato e relitto
b.append(f'<circle cx="230" cy="150" r="10" style="fill:none;stroke:{FIX["mag"]};stroke-width:2.4;stroke-dasharray:4 2.6"/><path d="M224,144l12,12M236,144l-12,12" style="stroke:{FIX["mag"]};stroke-width:2"/>')
# scandagli
for x, y, t, bold in ((120, 90, '62', 0), (200, 230, '41', 0), (300, 300, '12', 1), (340, 120, '24', 0), (420, 250, '11', 1), (470, 140, '7', 1), (150, 380, '55', 0)):
    b.append(f'<text x="{x}" y="{y}" style="font-size:12px;fill:{FIX["txt"] if bold else FIX["grey"]};stroke:none;font-weight:{700 if bold else 400}">{t}</text>')
# rotta pianificata e corridoio
b.append(f'<path d="M80,420L250,250L320,74" style="fill:none;stroke:#e0430f;stroke-width:2.6;stroke-dasharray:12 5"/>')
b.append(f'<path d="M64,404L234,234L302,64M96,436L266,266L338,82" style="fill:none;stroke:#e0430f;stroke-width:1;stroke-dasharray:3 4"/>')
for x, y in ((80, 420), (250, 250), (320, 74)):
    b.append(f'<circle cx="{x}" cy="{y}" r="7" style="fill:none;stroke:#e0430f;stroke-width:2"/>')
# nave propria e vettore
b.append(f'<g transform="translate(166,336) rotate(45)"><circle r="9" style="fill:none;stroke:#111;stroke-width:2"/><circle r="15" style="fill:none;stroke:#111;stroke-width:1.4"/><path d="M0,-15V-110" style="stroke:#111;stroke-width:1.6"/></g>')
b.append(f'<path d="M166,336L222,270" style="stroke:#111;stroke-width:3"/><path d="M222,270l-12,4 4,-12z" style="fill:#111"/>')
b.append('</g></g>')
# pannello laterale
b.append('<rect x="606" y="34" width="180" height="412" rx="6" style="fill:#0f151b"/>')
rows = [('HDG', '044,6°', 'girobussola'), ('COG', '047,0°', 'GPS'), ('SOG', '12,4 kn', 'GPS'), ('STW', '12,1 kn', 'solcometro'),
        ('XTE', '0,03 M S', 'rotta'), ('Safety contour', '15 m', 'impostato'), ('Safety depth', '14 m', 'impostato')]
for i, (k, v, s_) in enumerate(rows):
    y = 64 + i * 42
    b.append(f'<text x="618" y="{y}" style="font-size:11px;fill:#8fa4ba;stroke:none">{k}</text><text x="774" y="{y}" text-anchor="end" style="font-size:15px;font-weight:700;fill:#e8f0f7;stroke:none">{v}</text><text x="618" y="{y + 15}" style="font-size:10px;fill:#5d7186;stroke:none">{s_}</text>')
b.append('<rect x="614" y="368" width="164" height="68" rx="6" style="fill:#b3261e"/>')
b.append('<text x="696" y="392" text-anchor="middle" style="font-size:12.5px;font-weight:800;fill:#fff;stroke:none">ALLARME</text>')
b.append('<text x="696" y="410" text-anchor="middle" style="font-size:11px;fill:#fff;stroke:none">attraversamento</text>')
b.append('<text x="696" y="425" text-anchor="middle" style="font-size:11px;fill:#fff;stroke:none">safety contour 6 min</text>')
# richiami numerati sullo schermo e legenda sotto
E = [
    (232, 128, 'pericolo isolato (simbolo magenta)'),
    (420, 140, 'safety contour: linea più spessa'),
    (470, 230, 'acque più basse: blu più scuri'),
    (290, 274, 'secca con scandaglio in grassetto (&lt; safety depth)'),
    (560, 90, 'terra'),
    (152, 300, 'nave propria con linea di prora'),
    (226, 250, 'vettore: rotta e velocità sul fondo'),
    (262, 222, 'rotta pianificata con waypoint'),
    (110, 446, 'limiti del corridoio (XTD)'),
    (696, 352, 'pannello: dati dei sensori e allarmi'),
]
for i, (x, y, t) in enumerate(E):
    b.append(f'<circle cx="{x}" cy="{y}" r="10" style="fill:var(--orange);stroke:#fff;stroke-width:2"/><text x="{x}" y="{y + 4.5}" text-anchor="middle" style="font-size:12px;font-weight:800;fill:#fff;stroke:none">{i + 1}</text>')
    col, row = i // 5, i % 5
    lx, ly = 40 + col * 400, 494 + row * 22
    b.append(f'<circle cx="{lx}" cy="{ly - 4}" r="9" style="fill:var(--orange)"/><text x="{lx}" y="{ly}" text-anchor="middle" style="font-size:11px;font-weight:800;fill:var(--sheet);stroke:none">{i + 1}</text>')
    b.append(lab(lx + 16, ly, t, 'start'))
open(os.path.join(OUT, 'ecdis.svg'), 'w').write(svg(820, 600, '\n'.join(b), 'Schermo ECDIS: zone di profondità, safety contour, rotta, vettore della nave, allarmi'))
print('ok')
