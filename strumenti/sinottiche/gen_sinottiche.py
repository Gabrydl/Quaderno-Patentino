# Crea esercizi/sinottiche.html (pagina dell'app) dalla galleria "Carte sinottiche a colori" (artefatto del 23/11/2026).
# Uso: python3 -I strumenti/sinottiche/gen_sinottiche.py REPO_DIR
# Dal 23/11/2026 (1.06.00): i tasti si nascondono dopo 5 s senza cambiare carta; ingrandimento nuovo (si parte con la carta
# intera, pizzica o doppio tocco per ingrandire, +/− e "Intera" per tornare indietro).
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


def sub1(s, a, b):
    assert s.count(a) == 1, a[:60]
    return s.replace(a, b)


# ---------- stile: tasti che si nascondono, nuovo ingrandimento ----------
CSS = '''
.arr{transition:opacity .45s ease,transform .15s}
.gal.idle .arr{opacity:0;pointer-events:none}
.zoom{position:fixed;inset:0;background:#0a1119;z-index:10000;display:none;flex-direction:column;overscroll-behavior:contain}
.zoom.on{display:flex;animation:zin .22s ease}
@keyframes zin{from{opacity:0}}
.zoom .bar{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:calc(8px + env(safe-area-inset-top,0px)) 12px 8px;color:#fff;font-size:13.5px}
.zoom .bar span{opacity:.85}
.zoom .sc{position:relative;flex:1;overflow:hidden;touch-action:none;cursor:grab}
.zoom .sc.drag{cursor:grabbing}
.zoom .zc{position:absolute;left:0;top:0;transform-origin:0 0}
.zoom .zc.anim{transition:transform .28s cubic-bezier(.2,.7,.2,1)}
.zoom .zc svg{display:block;max-width:none;background:#fff;border-radius:4px}
.zoom .ztools{position:absolute;right:max(12px,env(safe-area-inset-right,0px));bottom:calc(16px + env(safe-area-inset-bottom,0px));display:flex;gap:8px;transition:opacity .45s ease;z-index:2}
.zoom .ztools button{min-width:48px;min-height:48px;padding:0 14px;border-radius:24px;background:rgba(255,255,255,.94);color:#0c1826;font-size:20px;font-weight:700;box-shadow:0 2px 10px rgba(0,0,0,.35)}
.zoom .ztools button.t{font-size:15px}
.zoom .zarr{position:absolute;top:50%;transform:translateY(-50%);z-index:2;width:46px;height:46px;min-height:0;padding:0;border-radius:50%;background:rgba(255,255,255,.92);color:#0c1826;display:grid;place-items:center;box-shadow:0 2px 10px rgba(0,0,0,.35);transition:opacity .45s ease}
.zoom .zarr svg{width:20px;height:20px}
.zoom .zarr.p{left:10px}.zoom .zarr.n{right:10px}
.zoom .zarr[hidden]{display:none}
.zoom.idle .ztools,.zoom.idle .zarr{opacity:0;pointer-events:none}
@media(prefers-reduced-motion:reduce){.zoom .zc.anim{transition:none}.zoom.on{animation:none}}
'''
for old in ['.zoom{position:fixed;inset:0;background:rgba(6,12,20,.92);z-index:9;display:none;flex-direction:column}\n', '.zoom.on{display:flex}\n',
            '.zoom .bar{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;color:#fff;font-size:14px}\n',
            '.zoom .sc{flex:1;overflow:auto;-webkit-overflow-scrolling:touch}\n',
            '.zoom .sc svg{display:block;width:1700px;height:auto;max-width:none;background:#fff}\n']:
    g = sub1(g, old, '')
k = g.index('</style>')
g = g[:k] + CSS + g[k:]

# ---------- finestra di ingrandimento ----------
g = sub1(g, '<div class="zoom" id="zoom" role="dialog" aria-modal="true" aria-label="Carta ingrandita"><div class="bar"><span>Trascina per spostarti · pizzica per ingrandire</span><button type="button" id="zclose">Chiudi</button></div><div class="sc" id="zsc"></div></div>',
         '<div class="zoom" id="zoom" role="dialog" aria-modal="true" aria-label="Carta ingrandita"><div class="bar"><span id="zinfo">Pizzica o tocca due volte per ingrandire · trascina per spostarti</span><button type="button" id="zclose">Chiudi</button></div>'
         '<div class="sc" id="zsc"><div class="zc" id="zc"></div>'
         '<button type="button" class="zarr p" id="zprev" aria-label="Carta precedente"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5.5L8.5 12l6.5 6.5"/></svg></button>'
         '<button type="button" class="zarr n" id="znext" aria-label="Carta successiva"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5.5l6.5 6.5L9 18.5"/></svg></button>'
         '<div class="ztools"><button type="button" id="zout" aria-label="Rimpicciolisci">−</button><button type="button" class="t" id="zfit">Intera</button><button type="button" id="zin" aria-label="Ingrandisci">+</button></div></div></div>')

OLD_JS_A = "const z=document.getElementById('zoom'),sc=document.getElementById('zsc');"
a = g.index(OLD_JS_A); b = g.index("document.addEventListener('keydown',e=>{if(e.key==='Escape')z.classList.remove('on')});", a)
b = g.index('\n', b) + 1
JS = r'''
/* tasti che si nascondono dopo 5 secondi senza cambiare carta; ricompaiono toccando la carta */
const gal=document.querySelector('.gal');let idleT=0;
function wake(){gal.classList.remove('idle');clearTimeout(idleT);idleT=setTimeout(()=>gal.classList.add('idle'),5000)}
['pointerdown','mousemove','keydown','focusin'].forEach(ev=>gal.addEventListener(ev,wake,{passive:true}));
tr.addEventListener('scroll',wake,{passive:true});
wake();
/* ingrandimento: si parte dalla carta intera; pizzica, doppio tocco, rotellina, +/− e "Intera" */
const z=document.getElementById('zoom'),sc=document.getElementById('zsc'),zc=document.getElementById('zc'),zi=document.getElementById('zinfo');
const zp=document.getElementById('zprev'),zn=document.getElementById('znext');
let S=1,X=0,Y=0,S0=1,VW=1076,VH=717,zcur=0,zT=0;
function zwake(){z.classList.remove('idle');clearTimeout(zT);zT=setTimeout(()=>z.classList.add('idle'),5000)}
function apply(anim){zc.classList.toggle('anim',!!anim);zc.style.transform='translate('+X+'px,'+Y+'px) scale('+S+')'}
function clamp(){const W=sc.clientWidth,H=sc.clientHeight,w=VW*S,h=VH*S;X=w<=W?(W-w)/2:Math.min(0,Math.max(W-w,X));Y=h<=H?(H-h)/2:Math.min(0,Math.max(H-h,Y))}
function fitAll(anim){const W=sc.clientWidth,H=sc.clientHeight;S0=Math.min(W/VW,H/VH);S=S0;X=(W-VW*S)/2;Y=(H-VH*S)/2;apply(anim)}
function zoomAt(f,cx,cy,anim){const ns=Math.max(S0,Math.min(S0*8,S*f));X=cx-(cx-X)*ns/S;Y=cy-(cy-Y)*ns/S;S=ns;clamp();apply(anim)}
function load(i){zcur=i;const s=sl[i].querySelector('svg').cloneNode(true);const vb=(s.getAttribute('viewBox')||'0 0 1076 717').split(/[ ,]+/).map(Number);
  VW=vb[2];VH=vb[3];s.setAttribute('width',VW);s.setAttribute('height',VH);zc.replaceChildren(s);fitAll(false);zp.hidden=i===0;zn.hidden=i===N-1;zi.textContent='Carta '+(i+1)+' di '+N+' · pizzica o tocca due volte per ingrandire'}
document.getElementById('zbtn').addEventListener('click',()=>{z.classList.add('on');load(cur);zwake();document.getElementById('zclose').focus()});
function zclose(){z.classList.remove('on');if(zcur!==cur)go(zcur);document.getElementById('zbtn').focus()}
document.getElementById('zclose').addEventListener('click',zclose);
document.getElementById('zin').addEventListener('click',()=>{zoomAt(1.6,sc.clientWidth/2,sc.clientHeight/2,true);zwake()});
document.getElementById('zout').addEventListener('click',()=>{zoomAt(1/1.6,sc.clientWidth/2,sc.clientHeight/2,true);zwake()});
document.getElementById('zfit').addEventListener('click',()=>{fitAll(true);zwake()});
zp.addEventListener('click',()=>{if(zcur>0)load(zcur-1);zwake()});zn.addEventListener('click',()=>{if(zcur<N-1)load(zcur+1);zwake()});
const pts=new Map();let g0=null,lastTap=0,moved=false;
const rel=e=>{const r=sc.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}};
sc.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;zwake();pts.set(e.pointerId,rel(e));try{sc.setPointerCapture(e.pointerId)}catch(_){}
  moved=false;const a=[...pts.values()];
  if(a.length===2)g0={d:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),s:S,x:X,y:Y,cx:(a[0].x+a[1].x)/2,cy:(a[0].y+a[1].y)/2};
  else g0={px:a[0].x,py:a[0].y,x:X,y:Y};sc.classList.add('drag');zc.classList.remove('anim')});
sc.addEventListener('pointermove',e=>{if(!pts.has(e.pointerId))return;pts.set(e.pointerId,rel(e));const a=[...pts.values()];
  if(a.length>=2&&g0&&g0.d){const d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),cx=(a[0].x+a[1].x)/2,cy=(a[0].y+a[1].y)/2;
    const ns=Math.max(S0*.9,Math.min(S0*8,g0.s*d/g0.d));X=cx-(g0.cx-g0.x)*ns/g0.s;Y=cy-(g0.cy-g0.y)*ns/g0.s;S=ns;clamp();apply(false);moved=true}
  else if(g0&&g0.px!==undefined){const dx=a[0].x-g0.px,dy=a[0].y-g0.py;if(Math.abs(dx)+Math.abs(dy)>4)moved=true;X=g0.x+dx;Y=g0.y+dy;clamp();apply(false)}});
function up(e){const p=pts.get(e.pointerId);pts.delete(e.pointerId);sc.classList.remove('drag');
  if(pts.size===1){const b=[...pts.values()][0];g0={px:b.x,py:b.y,x:X,y:Y};return}
  g0=null;if(S<S0){fitAll(true);return}
  if(!moved&&p&&e.type==='pointerup'){const t=Date.now();if(t-lastTap<320){if(S>S0*1.05)fitAll(true);else zoomAt(2.5,p.x,p.y,true);lastTap=0}else lastTap=t}}
sc.addEventListener('pointerup',up);sc.addEventListener('pointercancel',up);
sc.addEventListener('wheel',e=>{e.preventDefault();zwake();const p=rel(e);zoomAt(Math.exp(-e.deltaY*.0018),p.x,p.y,false)},{passive:false});
addEventListener('resize',()=>{if(z.classList.contains('on'))fitAll(false)});
document.addEventListener('keydown',e=>{if(!z.classList.contains('on'))return;if(e.key==='Escape')zclose();if(e.key==='+'||e.key==='=')document.getElementById('zin').click();if(e.key==='-')document.getElementById('zout').click();
  if(e.key==='ArrowRight')zn.click();if(e.key==='ArrowLeft')zp.click()});
'''
g = g[:a] + JS + g[b:]
g = sub1(g, '<button type="button" id="zbtn">Ingrandisci la carta</button>', '<button type="button" id="zbtn">Apri a schermo intero</button>')

k = g.index('<body>') + 6
g = g[:k] + guard + g[k:]
open(os.path.join(R, 'esercizi', 'sinottiche.html'), 'w', encoding='utf8').write(g)
print('sinottiche', len(g))
