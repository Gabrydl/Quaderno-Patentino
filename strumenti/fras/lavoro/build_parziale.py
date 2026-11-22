"""Se manca smcp_en.json (testo inglese dal PDF "frasi inglesi"), crea dati.json con: sezione GENERAL, tabelle degli
ordini (A2) e glossario completo. Con smcp_en.json usare build_dati.py (tutte le 2.265 frasi)."""
import json, re, sys, os, importlib.util
QUI = os.path.dirname(os.path.abspath(__file__))
def carica(nome):
    spec = importlib.util.spec_from_file_location(nome, os.path.join(QUI, nome + '.py'))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m
tav = json.load(open(os.path.join(QUI, 'tavole.json'), encoding='utf-8'))['tab']
gnodi = []
for tipo, ident, en, itx in carica('generale').G:
    if tipo == 'tab': gnodi.append({'t': 'tab', 'id': ident, 'tab': en})
    elif tipo == 'p': gnodi.append({'t': 'p', 'id': ident, 'en': en, 'it': itx, 'alt': []})
    else: gnodi.append({'t': tipo, 'id': ident, 'en': en, 'it': itx})
gnodi += [
    {'t': 'h', 'id': 'A2', 'en': 'ON-BOARD COMMUNICATION PHRASES', 'it': 'FRASI PER LE COMUNICAZIONI A BORDO'},
    {'t': 'h', 'id': 'A2/1', 'en': 'Standard wheel orders', 'it': 'Ordini standard al timone'},
    {'t': 'tab', 'id': 'A2/1t', 'tab': tav['859']},
    {'t': 'h', 'id': 'A2/1.2', 'en': 'Steering by compass', 'it': 'Governo con la bussola'},
    {'t': 'tab', 'id': 'A2/1.2t', 'tab': tav['862']},
    {'t': 'h', 'id': 'A2/2', 'en': 'Standard engine orders', 'it': 'Ordini standard alla macchina'},
    {'t': 'tab', 'id': 'A2/2t', 'tab': tav['868']},
    {'t': 'h', 'id': 'A2/3', 'en': 'Thrusters', 'it': 'Eliche di manovra'},
    {'t': 'tab', 'id': 'A2/3t', 'tab': tav['871']},
]
for o in gnodi: o['u'] = o['id']
gs = carica('glos_smcp_it')
glos = []
for en, (t, d) in gs.IT.items():
    if en in gs.TOGLI_EN: continue
    glos.append({'en': en, 'it': t, 'd': d, 'de': gs.CORREZIONI_EN.get(en, ''), 'c': 'SMCP', 's': 1})
gia = {g['en'].lower() for g in glos}
for r in open(os.path.join(QUI, 'glos_extra.txt'), encoding='utf-8'):
    if r.startswith('#') or not r.strip(): continue
    p = [c.strip() for c in r.rstrip('\n').split('|')]
    en, itx, cat, d = p[0], p[1], p[2], p[3]
    if en.lower() in gia: continue
    gia.add(en.lower()); o = {'en': en, 'it': itx, 'd': d, 'c': cat}
    if len(p) > 4 and p[4] == 'x': o['x'] = 1
    glos.append(o)
glos.sort(key=lambda g: re.sub(r'^\W+', '', g['en']).lower())
dati = {'v': 1, 'parziale': 1, 'fonte': 'IMO Res. A.918(22) – IMO Standard Marine Communication Phrases', 'nodi': gnodi, 'glos': glos}
uscita = sys.argv[1]
json.dump(dati, open(uscita, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
def pulisci_en(x):
    x = re.sub(r'\s*\((to|of [^)]*|D|or draft)\)', '', x).strip(); return x.split(' / ')[0].split('/')[0].strip()
def pulisci_it(x):
    if re.search(r'\d\)', x): return ''
    x = re.sub(r'\s*\([^)]*\)', '', x).strip(); return x.split(', ')[0].strip()
NO = {'List','Berth','Cable','Check (to)','Station','Target','Track','Transit','Datum','Blast','Hoist','Launch (to)','Briefing','Scene','Operational','Located','Reported','Disabled','Recover (to)','Resume (to)','Proceed (to)','Drifting','Leaking','Inoperative','Destination','Escort','Let go (to)','Stand by (to)','Shackle','Slings','Course','Heading','Overflow','Spill','Casualty'}
en_it, it_en = {}, {}
for g in glos:
    if g.get('x') or (g.get('s') and g['en'] in NO): continue
    e, i = pulisci_en(g['en']), pulisci_it(g['it'])
    if not e or not i or len(e) < 3 or (e.isupper() and len(e) <= 6): continue
    en_it.setdefault(e.lower(), (e, i)); it_en.setdefault(i.lower(), (i, e))
tsv = lambda d: '\n'.join(f'{a}\t{b}' for a, b in d.values() if '\t' not in a + b)
cart = os.path.dirname(os.path.abspath(uscita))
open(os.path.join(cart, 'deepl_en_it.tsv'), 'w', encoding='utf-8').write(tsv(en_it))
open(os.path.join(cart, 'deepl_it_en.tsv'), 'w', encoding='utf-8').write(tsv(it_en))
print('nodi', len(gnodi), 'frasi', sum(1 for n in gnodi if n['t'] == 'p'), 'glossario', len(glos), 'byte', os.path.getsize(uscita))
