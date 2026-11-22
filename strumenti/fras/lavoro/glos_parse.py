# Glossario SMCP dal testo del PDF (ricostruito dalla chat del 26/10/2026)
import json,re
d=json.load(open('smcp_en_prosa.json'))
g=d['glossary']
voci=[]; parte=''
for r in g:
    if not r.strip(): continue
    if re.match(r'^\s*\d\s+\S', r) and len(r.strip())<40: parte=r.strip(); continue
    if r.strip() in ('GLOSSARY',) or r.startswith('The Glossary') or r.startswith('IMO SMCP, but'): continue
    m=re.match(r'^(\S.{0,30}?)\s{2,}(\S.*)$', r)
    if m and not r.startswith(' '):
        voci.append({'parte':parte,'en':m.group(1).strip(),'def':m.group(2).strip()})
    elif not r.startswith(' ') and len(r.strip())<30:
        voci.append({'parte':parte,'en':r.strip(),'def':''})
    else:
        t=r.strip()
        if voci:
            m2=re.match(r'^(\S.{0,26}?)\s{2,}(\S.*)$', r)
            if m2 and not r.startswith('  ') : voci[-1]['en']+=' '+m2.group(1).strip(); voci[-1]['def']+=' '+m2.group(2).strip()
            else: voci[-1]['def']+=' '+t
for v in voci: v['def']=re.sub(r'\s+',' ',v['def']).strip()
json.dump(voci,open('glos_smcp_en.json','w'),ensure_ascii=False,indent=0)
print(len(voci))
