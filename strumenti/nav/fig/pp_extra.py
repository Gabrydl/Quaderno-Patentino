# Disegni aggiuntivi per il passage planning: UKC, WOP, parallel index al radar.
import math, os
OUT = os.path.dirname(os.path.abspath(__file__))
def svg(w, h, body, label): return f'<svg viewBox="0 0 {w} {h}" role="img" aria-label="{label}" xmlns="http://www.w3.org/2000/svg">\n{body}\n</svg>'
def lab(x, y, t, a='start', c='xs', e=''): return f'<text class="{c}{(" " + e) if e else ""}" x="{x}" y="{y}" text-anchor="{a}">{t}</text>'
def dim(x, y1, y2, col='currentColor'):
    h = 6
    return (f'<path d="M{x},{y1 + 1}V{y2 - 1}" style="stroke:{col};stroke-width:1.5"/>'
            f'<path d="M{x},{y1}l-{h/2},{h}h{h}z" style="fill:{col}"/><path d="M{x},{y2}l-{h/2},-{h}h{h}z" style="fill:{col}"/>'
            f'<path d="M{x - 9},{y1}h18M{x - 9},{y2}h18" style="stroke:{col};stroke-width:1"/>')

# ================================================================== UKC
b = []
SL, CD, BED = 110, 160, 330
b.append(f'<path class="fillb" d="M20,{SL}H740V{BED}H20Z"/>')
b.append(f'<path d="M20,{BED}Q120,{BED - 10} 220,{BED}T420,{BED}T620,{BED}T760,{BED}V380H20Z" style="fill:color-mix(in srgb,var(--orange) 22%,var(--sheet));stroke:currentColor;stroke-width:1.4"/>')
b.append(f'<path class="s cb" d="M20,{SL}H740"/>'); b.append(lab(26, SL - 8, 'livello del mare in questo momento', 'start', 'xs', 'tb'))
b.append(f'<path class="t" style="stroke-dasharray:10 5" d="M20,{CD}H740"/>'); b.append(lab(26, CD - 6, 'zero della carta (chart datum)', 'start', 'xs'))
# nave: scafo statico e scafo con squat
b.append(f'<path class="fillgr" d="M190,70H560L585,{SL}Q575,214 540,226H215Q186,214 180,{SL}Z"/>')
b.append(f'<path class="s" d="M190,70H560L585,{SL}Q575,214 540,226H215Q186,214 180,{SL}Z"/>')
b.append('<path class="t cr" style="stroke-dasharray:6 4" d="M182,140Q190,240 222,252H536Q578,240 586,140"/>')
b.append(lab(380, 245, 'scafo con squat', 'middle', 'xs', 'tr'))
b.append('<path class="s" d="M600,60l40,0" style="stroke:var(--green)"/><path d="M652,60l-14,-6v12z" style="fill:var(--green)"/>'); b.append(lab(620, 50, 'velocità', 'middle', 'xs', 'tg'))
# quote
b.append(dim(120, SL, CD, 'var(--blue)')); b.append(lab(112, 140, 'altezza di marea', 'end', 'xs', 'tb'))
b.append(dim(120, CD, BED)); b.append(lab(112, 250, 'fondale di carta', 'end', 'xs')); b.append(lab(112, 266, '(scandaglio)', 'end', 'xs'))
b.append(dim(640, SL, 226)); b.append(lab(652, 172, 'pescaggio', 'start', 'xs'))
b.append(dim(690, 226, 252, 'var(--red)')); b.append(lab(702, 244, 'squat', 'start', 'xs', 'tr'))
b.append(dim(640, 252, BED, 'var(--green)')); b.append(lab(652, 296, 'UKC', 'start', 'sm', 'tg'))
b.append(f'<rect x="160" y="350" width="440" height="34" rx="6" style="fill:var(--sheet);stroke:var(--line)"/>')
b.append(lab(380, 372, 'UKC = fondale di carta + marea − pescaggio − squat', 'middle', 'sm'))
open(os.path.join(OUT, 'ukc.svg'), 'w').write(svg(760, 396, '\n'.join(b), 'Under keel clearance: fondale, marea, pescaggio, squat'))

# ================================================================== WOP
b = []
WPx, WPy, r, D = 470.0, 300.0, 170.0, 60.0
t = r * math.tan(math.radians(D / 2))
a = (WPx - t, WPy)                                     # inizio dell'accostata
nb = math.radians(90 - D)                              # direzione nuova rotta sullo schermo (030° vero)
ux, uy = math.cos(math.radians(-D)), math.sin(math.radians(-D))
e = (WPx + t * ux, WPy + t * uy)                       # fine dell'accostata
cx, cy = a[0], a[1] - r                                # centro della curva (accosta a sinistra)
delay = 46
wop = (a[0] - delay, WPy)
b.append(f'<path class="s cr" d="M40,{WPy}H{WPx}"/>')
b.append(f'<path class="s cr" d="M{WPx},{WPy}L{WPx + 260 * ux:.1f},{WPy + 260 * uy:.1f}"/>')
b.append(f'<circle cx="{WPx}" cy="{WPy}" r="7" style="fill:var(--sheet);stroke:var(--red);stroke-width:2.4"/>')
b.append(lab(WPx + 10, WPy + 22, 'WP', 'start', 'sm', 'tr'))
# traiettoria della nave
b.append(f'<path d="M40,{WPy - 0}H{a[0]:.1f}A{r},{r} 0 0 0 {e[0]:.1f},{e[1]:.1f}L{e[0] + 160 * ux:.1f},{e[1] + 160 * uy:.1f}" style="fill:none;stroke:var(--blue);stroke-width:3;stroke-dasharray:10 5"/>')
b.append(f'<path class="t" style="stroke-dasharray:3 4" d="M{cx:.1f},{cy:.1f}L{a[0]:.1f},{a[1]:.1f}M{cx:.1f},{cy:.1f}L{e[0]:.1f},{e[1]:.1f}"/>')
b.append(f'<circle class="pt" cx="{cx:.1f}" cy="{cy:.1f}" r="3"/>'); b.append(lab(cx - 8, cy + 54, 'r', 'end', 'sm'))
b.append(lab(cx + 4, cy - 10, 'centro di evoluzione', 'start', 'xs'))
# WOP
b.append(f'<path d="M{wop[0]:.1f},{WPy - 16}V{WPy + 16}" style="stroke:var(--orange);stroke-width:4"/>')
b.append(lab(wop[0], WPy + 34, 'WOP', 'middle', 'sm', 'to'))
b.append(lab(wop[0], WPy + 50, 'si dà il timone', 'middle', 'xs', 'to'))
b.append(f'<circle class="pt" cx="{a[0]:.1f}" cy="{a[1]:.1f}" r="3.5"/>'); b.append(lab(a[0] - 6, WPy - 30, 'la nave inizia', 'end', 'xs')); b.append(lab(a[0] - 6, WPy - 15, 'ad accostare', 'end', 'xs'))
b.append(f'<circle class="pt" cx="{e[0]:.1f}" cy="{e[1]:.1f}" r="3.5"/>'); b.append(lab(e[0] + 10, e[1] + 6, 'sulla nuova rotta', 'start', 'xs'))
# quote orizzontali
yq = WPy + 76
b.append(f'<path class="t" d="M{wop[0]:.1f},{yq}H{WPx}M{wop[0]:.1f},{yq - 6}V{yq + 6}M{a[0]:.1f},{yq - 4}V{yq + 4}M{WPx},{yq - 6}V{yq + 6}"/>')
b.append(lab(a[0] - 4, yq + 18, 'tempo di risposta', 'end', 'xs'))
b.append(lab(a[0] + 4, yq + 18, 'r · tan(Δ/2)', 'start', 'xs'))
# rotte e angolo
b.append(lab(150, WPy - 12, 'rotta 090°', 'middle', 'xs', 'tr'))
b.append(lab(WPx + 190 * ux + 14, WPy + 190 * uy, 'rotta 030°', 'start', 'xs', 'tr'))
b.append(f'<path d="M{WPx + 60},{WPy}A60,60 0 0 0 {WPx + 60 * ux:.1f},{WPy + 60 * uy:.1f}" style="fill:none;stroke:currentColor;stroke-width:1.2"/>')
b.append(f'<path class="t" style="stroke-dasharray:3 4" d="M{WPx},{WPy}H{WPx + 120}"/>')
b.append(lab(WPx + 66, WPy - 18, 'Δ = 60°', 'start', 'xs'))
b.append(lab(40, 40, 'traiettoria della nave', 'start', 'xs', 'tb')); b.append('<path d="M40,50h60" style="stroke:var(--blue);stroke-width:3;stroke-dasharray:10 5"/>')
b.append(lab(40, 76, 'rotta pianificata', 'start', 'xs', 'tr')); b.append('<path d="M40,86h60" style="stroke:var(--red);stroke-width:2.4"/>')
open(os.path.join(OUT, 'wop.svg'), 'w').write(svg(760, 420, '\n'.join(b), 'Wheel over point: dove dare il timone per accostare'))

# ================================================================== PARALLEL INDEX AL RADAR
b = []
cx, cy, R0 = 220, 210, 180
b.append(f'<circle cx="{cx}" cy="{cy}" r="{R0 + 8}" style="fill:#13202b;stroke:currentColor;stroke-width:1.5"/>')
b.append(f'<circle cx="{cx}" cy="{cy}" r="{R0}" style="fill:#0b2b1c"/>')
for k in (1, 2, 3):
    b.append(f'<circle cx="{cx}" cy="{cy}" r="{R0 * k / 3:.1f}" style="fill:none;stroke:#2f7a52;stroke-width:1"/>')
b.append(f'<path d="M{cx},{cy}V{cy - R0}" style="stroke:#d6f5e3;stroke-width:1.6"/>')
for k, t in ((1, '1 M'), (2, '2 M'), (3, '3 M')):
    b.append(f'<text x="{cx + 4}" y="{cy + R0 * k / 3 - 4:.1f}" style="font-size:10px;fill:#8fd1ab;stroke:none">{t}</text>')
b.append(f'<circle cx="{cx}" cy="{cy}" r="5" style="fill:none;stroke:#fff;stroke-width:1.6"/>')
# costa con capo (eco)
coast = f'M{cx + 150},{cy - 170}Q{cx + 112},{cy - 120} {cx + 96},{cy - 64}Q{cx + 92},{cy - 44} {cx + 118},{cy - 30}Q{cx + 160},{cy - 10} {cx + 170},{cy + 60}'
b.append(f'<path d="{coast}" style="fill:none;stroke:#ffd166;stroke-width:4;stroke-linecap:round;opacity:.9"/>')
pi_x = cx + 90
b.append(f'<path d="M{pi_x},{cy - R0 + 10}V{cy + R0 - 10}" style="stroke:#6ee7a8;stroke-width:2;stroke-dasharray:9 5"/>')
# eco del capo: posizioni successive lungo la linea
for k, (yy, op) in enumerate(((cy - 110, .35), (cy - 54, 1), (cy + 10, .35))):
    b.append(f'<circle cx="{pi_x}" cy="{yy}" r="5" style="fill:#ffd166;opacity:{op}"/>')
b.append(f'<path d="M{pi_x + 14},{cy - 100}V{cy}" style="stroke:#fff;stroke-width:1.4"/><path d="M{pi_x + 14},{cy + 6}l-5,-10h10z" style="fill:#fff"/>')
# caso sbagliato
b.append(f'<circle cx="{pi_x - 30}" cy="{cy + 40}" r="5" style="fill:#ff6b6b"/>')
# testo a destra
tx = 430
rows = [('Radar stabilizzato, moto relativo', 'currentColor', 'sm'),
        ('La nave segue la rotta 000° (linea di prora).', 'var(--muted)', 'xs'),
        ('Il capo deve passare a 1,5 M di traverso.', 'var(--muted)', 'xs'),
        ('', '', 'xs'),
        ('Linea tratteggiata = parallel index', 'var(--green)', 'sm'),
        ('parallela alla rotta, a 1,5 M dal centro.', 'var(--muted)', 'xs'),
        ('', '', 'xs'),
        ('Eco gialla sulla linea: rotta giusta', 'currentColor', 'sm'),
        ('l’eco scende lungo la linea mentre si naviga.', 'var(--muted)', 'xs'),
        ('', '', 'xs'),
        ('Eco rossa dentro la linea: attenzione', 'var(--red)', 'sm'),
        ('la nave si avvicina al capo (corrente, scarroccio):', 'var(--muted)', 'xs'),
        ('si corregge la rotta subito, senza fare il punto.', 'var(--muted)', 'xs')]
y = 60
for t, c, cl in rows:
    if t: b.append(f'<text class="{cl}" x="{tx}" y="{y}" style="fill:{c}">{t}</text>')
    y += 22 if cl == 'sm' else 19
open(os.path.join(OUT, 'parallel_index.svg'), 'w').write(svg(760, 420, '\n'.join(b), 'Parallel index sul radar'))
print('ok')
