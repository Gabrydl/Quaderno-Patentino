# Safety contour, safety depth, shallow e deep contour: disegni (ricostruito dalla chat del 30/10/2026, versione finale 1.3).
import math, os, sys
OUT = os.path.dirname(os.path.abspath(__file__))
def svg(w, h, body, label): return f'<svg viewBox="0 0 {w} {h}" role="img" aria-label="{label}" xmlns="http://www.w3.org/2000/svg">\n{body}\n</svg>'
def lab(x, y, t, a='start', c='xs', e=''): return f'<text class="{c}{(" " + e) if e else ""}" x="{x}" y="{y}" text-anchor="{a}">{t}</text>'
C_VS = 'color-mix(in srgb,var(--blue) 55%,var(--sheet))'
C_MS = 'color-mix(in srgb,var(--blue) 32%,var(--sheet))'
C_MD = 'color-mix(in srgb,var(--blue) 13%,var(--sheet))'
C_DW = 'var(--sheet)'
LAND = 'color-mix(in srgb,var(--orange) 16%,var(--sheet))'
MAG = '#c6168d'

b = []
X0, X1, SURF, K = 60, 780, 96, 8.4
prof = [(60, 0), (110, 3), (170, 6.5), (230, 9.2), (300, 10.8), (370, 13), (440, 17), (500, 21), (540, 23.5), (560, 9.0), (580, 24.5), (640, 27), (700, 30.5), (780, 33)]
def depth_at(x):
    for (xa, da), (xb, db) in zip(prof, prof[1:]):
        if xa <= x <= xb: return da + (db - da) * (x - xa) / (xb - xa)
    return prof[-1][1]
Y = lambda d: SURF + d * K
def zone(d): return C_VS if d < 10 else C_MS if d < 20 else C_MD if d < 30 else C_DW
xs = list(range(X0, X1 + 1, 2))
for x in xs[:-1]:
    d = depth_at(x + 1) if not (548 < x < 572) else depth_at(540)
    b.append(f'<rect x="{x}" y="{SURF - 30}" width="2.4" height="22" style="fill:{zone(d)}"/>')
b.append(f'<rect x="{X0}" y="{SURF - 30}" width="{X1 - X0}" height="22" style="fill:none;stroke:var(--line)"/>')
b.append(lab(X0, SURF - 38, 'Come l’ECDIS colora il mare sopra questo fondale', 'start', 'xs'))
b.append(f'<circle cx="560" cy="{SURF - 19}" r="9" style="fill:none;stroke:{MAG};stroke-width:2;stroke-dasharray:3.5 2.4"/><path d="M554,{SURF - 25}l12,12M566,{SURF - 25}l-12,12" style="stroke:{MAG};stroke-width:1.8"/>')
pts = ' '.join(f'L{x},{Y(depth_at(x)):.1f}' for x in xs)
b.append(f'<path d="M{X0},{SURF}H{X1}V{Y(34):.1f}H{X0}Z" class="fillb"/>')
b.append(f'<path d="M{X0},{Y(0):.1f} {pts} L{X1},{Y(38):.1f}L{X0},{Y(38):.1f}Z" style="fill:{LAND};stroke:currentColor;stroke-width:1.6"/>')
b.append(f'<path class="s cb" d="M{X0},{SURF}H{X1}"/>')
b.append(f'<path d="M20,{SURF - 6}L{X0},{SURF}L{X0},{Y(0) + 40}L20,{Y(0) + 40}Z" style="fill:{LAND};stroke:none"/>')
def hline(d, txt, col, dash, w=1.6, anchor_x=X1 - 6):
    return (f'<path d="M{X0},{Y(d):.1f}H{X1}" style="stroke:{col};stroke-width:{w};stroke-dasharray:{dash}"/>'
            + lab(anchor_x, Y(d) - 5, txt, 'end', 'xs', '').replace('class="xs"', f'class="xs" style="fill:{col}"'))
b.append(hline(10, 'isobata 10 m = shallow contour', 'var(--blue)', '8 4'))
b.append(f'<path d="M{X0},{Y(11.0):.1f}H{X1}" style="stroke:var(--muted);stroke-width:1.2;stroke-dasharray:2 3"/>' + f'<text class="xs" x="{X1 - 6}" y="{Y(11.0) + 15:.1f}" text-anchor="end" style="fill:var(--muted)">valore impostato 11 m (non c’è in carta)</text>')
b.append(hline(20, 'isobata 20 m = safety contour usato dall’ECDIS', 'var(--red)', '0', 2.6))
b.append(hline(30, 'isobata 30 m = deep contour', 'var(--violet)', '8 4'))
sx = 430
hull = f'M{sx - 60},{SURF - 26}H{sx + 60}L{sx + 70},{SURF}Q{sx + 64},{Y(9.0) - 6} {sx + 50},{Y(9.0):.1f}H{sx - 50}Q{sx - 64},{Y(9.0) - 6} {sx - 70},{SURF}Z'
b.append(f'<path class="fillgr" d="{hull}"/>')
b.append(f'<path class="s" d="{hull}"/>')
b.append(lab(sx, SURF + 30, 'pescaggio 9,0 m', 'middle', 'xs'))
b.append(lab(560, Y(9) - 30, 'roccia a 9 m', 'middle', 'xs', ''))
b.append(lab(560, Y(9) - 15, '= pericolo isolato', 'middle', 'xs', ''))
for d in (0, 10, 20, 30):
    b.append(f'<path d="M{X0 - 6},{Y(d):.1f}h6" style="stroke:currentColor;stroke-width:1.2"/>'); b.append(lab(X0 - 10, Y(d) + 4, f'{d} m', 'end', 'xs'))
open(os.path.join(OUT, 'safety_profilo.svg'), 'w').write(svg(820, int(Y(38) + 10), '\n'.join(b), 'Profilo del fondale con shallow, safety e deep contour'))

b = []
Wc, Hc = 560, 440
def curve(base, amp, k, ph): return [(x, base + amp * math.sin(x / k + ph)) for x in range(0, Wc + 1, 8)]
shore = curve(64, 22, 90, 0.0); c5 = curve(118, 26, 95, 0.3); c10 = curve(168, 28, 100, 0.6); c20 = curve(250, 32, 110, 0.9); c30 = curve(336, 34, 120, 1.2)
def band(top, bot, fill):
    d = 'M' + ' L'.join(f'{x},{y:.1f}' for x, y in top) + ' L' + ' L'.join(f'{x},{y:.1f}' for x, y in reversed(bot)) + 'Z'
    return f'<path d="{d}" style="fill:{fill};stroke:none"/>'
lineP = lambda c: 'M' + ' L'.join(f'{x},{y:.1f}' for x, y in c)
b.append(f'<rect x="0" y="0" width="{Wc}" height="{Hc}" style="fill:{C_DW}"/>')
b.append(band([(x, 0) for x, _ in shore], shore, LAND))
b.append(band(shore, c10, C_VS)); b.append(band(c10, c20, C_MS)); b.append(band(c20, c30, C_MD))
b.append(f'<path d="{lineP(shore)}" style="fill:none;stroke:currentColor;stroke-width:1.6"/>')
for c, w, col in ((c5, 1, 'var(--muted)'), (c10, 1.2, 'var(--muted)'), (c30, 1.2, 'var(--muted)')):
    b.append(f'<path d="{lineP(c)}" style="fill:none;stroke:{col};stroke-width:{w}"/>')
b.append(f'<path d="{lineP(c20)}" style="fill:none;stroke:currentColor;stroke-width:3.4"/>')
for c, t, x in ((c5, '5', 40), (c10, '10', 120), (c20, '20', 472), (c30, '30', 256)):
    y = dict(c)[x]; b.append(lab(x, y + 4, t, 'middle', 'xs'))
sond = [(80, 92, 3), (300, 100, 4), (200, 140, 7), (440, 150, 8), (90, 205, 11), (330, 210, 14), (170, 232, 17), (520, 230, 16), (110, 300, 23), (420, 300, 27), (230, 372, 34), (480, 392, 41), (330, 300, 9)]
for x, y, d in sond:
    bold = d <= 11.0
    b.append(f'<text x="{x}" y="{y}" text-anchor="middle" style="font-size:{14 if bold else 13}px;font-weight:{800 if bold else 400};fill:{"currentColor" if bold else "var(--muted)"};stroke-width:3px">{d}</text>')
b.append(f'<circle cx="330" cy="295" r="16" style="fill:none;stroke:{MAG};stroke-width:2.4;stroke-dasharray:5 3"/><path d="M321,286l18,18M339,286l-18,18" style="stroke:{MAG};stroke-width:2"/>')
b.append(f'<rect x=".5" y=".5" width="{Wc - 1}" height="{Hc - 1}" style="fill:none;stroke:currentColor"/>')
lx = 586
leg = [(C_VS, 'più basso dello shallow contour', '(qui meno di 10 m)'), (C_MS, 'tra shallow e safety contour', '(10–20 m)'), (C_MD, 'tra safety e deep contour', '(20–30 m)'), (C_DW, 'più profondo del deep contour', '(oltre 30 m)')]
y = 28
b.append(lab(lx, y, 'COLORI', 'start', 'sm', 'tb')); y += 18
for col, t1, t2 in leg:
    b.append(f'<rect x="{lx}" y="{y}" width="30" height="22" style="fill:{col};stroke:var(--line)"/>')
    b.append(lab(lx + 40, y + 10, t1, 'start', 'xs')); b.append(lab(lx + 40, y + 25, t2, 'start', 'xs', '')); y += 40
y += 6
b.append(f'<path d="M{lx},{y}h30" style="stroke:currentColor;stroke-width:3.4"/>'); b.append(lab(lx + 40, y + 4, 'safety contour (20 m)', 'start', 'xs')); y += 30
b.append(f'<text x="{lx + 15}" y="{y + 5}" text-anchor="middle" style="font-size:14px;font-weight:800;stroke:none">7</text>'); b.append(lab(lx + 40, y, 'scandaglio ≤ safety depth', 'start', 'xs')); b.append(lab(lx + 40, y + 15, '(nero grassetto)', 'start', 'xs')); y += 34
b.append(f'<text x="{lx + 15}" y="{y + 5}" text-anchor="middle" style="font-size:13px;fill:var(--muted);stroke:none">27</text>'); b.append(lab(lx + 40, y, 'scandaglio più profondo', 'start', 'xs')); b.append(lab(lx + 40, y + 15, '(grigio)', 'start', 'xs')); y += 34
b.append(f'<circle cx="{lx + 15}" cy="{y}" r="10" style="fill:none;stroke:{MAG};stroke-width:2;stroke-dasharray:4 2.4"/><path d="M{lx + 9},{y - 6}l12,12M{lx + 21},{y - 6}l-12,12" style="stroke:{MAG};stroke-width:1.6"/>')
b.append(lab(lx + 40, y, 'pericolo isolato', 'start', 'xs')); b.append(lab(lx + 40, y + 15, '(roccia a 9 m in acque profonde)', 'start', 'xs')); y += 36
b.append(lab(lx, y + 10, 'Impostazioni: shallow 10 m,', 'start', 'xs', 'tb')); b.append(lab(lx, y + 26, 'safety 11 m (usa 20 m),', 'start', 'xs', 'tb')); b.append(lab(lx, y + 42, 'safety depth 11 m, deep 30 m', 'start', 'xs', 'tb'))
open(os.path.join(OUT, 'safety_ecdis.svg'), 'w').write(svg(880, Hc + 6, '\n'.join(b), 'Schermo ECDIS: colori del fondale, safety contour, scandagli e pericolo isolato'))
print('ok')
