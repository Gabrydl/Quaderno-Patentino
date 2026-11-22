import asyncio, json, time, sys
from playwright.async_api import async_playwright
BASE='http://127.0.0.1:8765/'
SB='https://cvyuytnouuapmazjnebc.supabase.co'
now=time.time()
USER={'id':'u1','email':'gabrydl@gabrydl99.github.io','user_metadata':{'nome':'Gabrydl'},'app_metadata':{'ruolo':'superadmin'}}
SESS={'at':'tok','rt':'ref','exp':int(now)+3600,'user':USER}
USERS=[{'id':'u1','nome':'Gabrydl','ruolo':'superadmin','in_linea':True,'ultimo_accesso':'2026-11-22T02:00:00Z','letti':12,'n_accessi':40,'registrato':'2026-10-25T08:00:00Z','foto':None,'ultimo':{'ip':'93.1.2.3','modello':'SM-S918B','sistema':'Android 15','browser':'Chrome/131'}},
       {'id':'u2','nome':'francescopescina','ruolo':'','in_linea':False,'ultimo_accesso':'2026-11-05T19:00:00Z','letti':3,'n_accessi':5,'registrato':'2026-10-26T08:00:00Z','foto':None,'ultimo':{'ip':'5.6.7.8','modello':'iPhone','sistema':'iPhone OS 18.1','browser':'Safari/604'},'nomi':[{'vecchio':'francesco','nuovo':'francescopescina','quando':'2026-11-01T10:00:00Z'}]},
       {'id':'u3','nome':'ProfSalvatore','ruolo':'admin','in_linea':False,'ultimo_accesso':'2026-11-02T10:00:00Z','letti':0,'n_accessi':2,'registrato':'2026-10-27T08:00:00Z','foto':None,'ultimo':{}}]
calls=[]
async def handle(route):
    r=route.request; u=r.url; calls.append(r.method+' '+u.replace(SB,''))
    def ok(b,st=200): return route.fulfill(status=st,content_type='application/json',body=json.dumps(b),headers={'access-control-allow-origin':'*'})
    if r.method=='OPTIONS': return await route.fulfill(status=204,headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'})
    if '/auth/v1/token?grant_type=password' in u:
        b=json.loads(r.post_data)
        if b['password']=='giusta': return await ok({'access_token':'tok','refresh_token':'ref','expires_in':3600,'user':USER})
        return await ok({'error':'invalid_grant','error_description':'Invalid login credentials'},400)
    if '/auth/v1/signup' in u: return await ok({'code':500,'msg':'Database error saving new user'},500)
    if '/rpc/segnale' in u: return await ok({'ruolo':'superadmin','foto':None,'messaggi':[{'id':7,'testo':'Benvenuti nella nuova versione del Quaderno!','creato':'2026-11-22T02:00:00Z','annuncio':True,'anonimo':False,'da':'Gabrydl','ruolo_da':'superadmin'}]})
    if '/rpc/conferma_messaggio' in u: return await ok(None)
    if '/rest/v1/progressi' in u:
        if r.method=='GET': return await ok([{'argomento':'astro-sfera-celeste'},{'argomento':'stab-falla'}])
        return await route.fulfill(status=201,body='',headers={'access-control-allow-origin':'*'})
    if '/rpc/elenco_utenti' in u: return await ok(USERS)
    if '/rpc/registro_accessi' in u: return await ok([{'utente':'u2','nome':'francescopescina','inizio':'2026-11-05T18:00:00Z','fine':'2026-11-05T19:00:00Z','ip':'5.6.7.8','modello':'iPhone','sistema':'iPhone OS 18.1','browser':'Safari/604','dispositivo':'d1'},{'utente':'u2','nome':'francescopescina','inizio':'2026-11-04T18:00:00Z','fine':'2026-11-04T18:30:00Z','ip':'5.6.7.8','modello':'iPhone','sistema':'iPhone OS 18.1','browser':'Safari/604','dispositivo':'d1'}])
    if '/rest/v1/segnalazioni' in u:
        if r.method=='GET' and 'letto=eq.false' in u: return await ok([{'id':1}])
        if r.method=='GET': return await ok([{'id':1,'tipo':'errore','nome':'francescopescina','creato':'2026-11-05T19:00:00Z','argomento':'Falla','messaggio':'Nella formula manca un segno meno.','letto':False,'allegati':[{'path':'u2/1-foto.jpg','nome':'foto.jpg'}]}])
        return await route.fulfill(status=201,body='',headers={'access-control-allow-origin':'*'})
    if '/rpc/messaggi_inviati' in u: return await ok([{'id':7,'testo':'Benvenuti nella nuova versione del Quaderno!','creato':'2026-11-22T02:00:00Z','mittente_nome':'Gabrydl','mio':True,'destinatario':None,'anonimo':False,'letti':3,'totale':8}])
    if '/rpc/codice_accesso' in u: return await ok({'codice':'••••••','aggiornato':'2026-11-07T10:31:57Z','da':'Gabrydl'})
    return await ok({})
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        for theme in ['light','dark']:
            ctx=await b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,color_scheme=theme)
            await ctx.route(SB+'/**',handle)
            await ctx.route('https://*.claudeusercontent.com/**',lambda r: r.abort())
            pg=await ctx.new_page(); errs=[]
            pg.on('pageerror',lambda e: errs.append(str(e)))
            await pg.goto(BASE); await pg.wait_for_timeout(700)
            await pg.screenshot(path=f'shots/{theme}_01_login.png')
            if theme=='light':
                await pg.fill('#gUser','Gabrydl'); await pg.fill('#gPw','sbagliata'); await pg.click('#gSubmit'); await pg.wait_for_timeout(400)
                print('err wrong pw:', await pg.text_content('#gateErr'))
                await pg.click('#gateSeg button:nth-of-type(2)'); await pg.fill('#gUser','nuovo1'); await pg.fill('#gPw','abcdef'); await pg.fill('#gPw2i','abcdef'); await pg.fill('#gCode','x'); await pg.click('#gSubmit'); await pg.wait_for_timeout(400)
                print('err signup:', await pg.text_content('#gateErr'))
                await pg.screenshot(path='shots/light_02_register.png')
                await pg.click('#gateSeg button:nth-of-type(1)')
            await pg.fill('#gUser','Gabrydl'); await pg.fill('#gPw','giusta'); await pg.click('#gSubmit'); await pg.wait_for_timeout(900)
            await pg.screenshot(path=f'shots/{theme}_03_message.png')
            await pg.click('#msgBox .btn'); await pg.wait_for_timeout(300)
            await pg.screenshot(path=f'shots/{theme}_04_home.png')
            await pg.evaluate("location.hash='stab-falla'"); await pg.wait_for_timeout(500)
            await pg.evaluate("document.querySelector('article.topic.on .read-btn').scrollIntoView({block:'center'})"); await pg.wait_for_timeout(200)
            await pg.screenshot(path=f'shots/{theme}_05_read.png')
            await pg.evaluate("location.hash='stabilita'"); await pg.wait_for_timeout(500)
            await pg.screenshot(path=f'shots/{theme}_06_toc.png')
            await pg.click('#accBtn'); await pg.wait_for_timeout(500)
            await pg.screenshot(path=f'shots/{theme}_07_account.png', full_page=False)
            await pg.click('#goAdmin'); await pg.wait_for_timeout(500)
            await pg.click('.uitem[data-i="1"]'); await pg.wait_for_timeout(200)
            await pg.screenshot(path=f'shots/{theme}_08_admin.png')
            for t in ['accessi','segn','msg','codice']:
                await pg.click(f'.atabs [data-t="{t}"]'); await pg.wait_for_timeout(400)
                if t=='accessi': await pg.click('.dev > button'); await pg.wait_for_timeout(200)
                await pg.screenshot(path=f'shots/{theme}_09_{t}.png')
            await pg.click('#accClose'); await pg.wait_for_timeout(200); await pg.click('#accClose'); await pg.wait_for_timeout(200)
            await pg.evaluate("location.hash='meteo-sinottica-esempio'"); await pg.wait_for_timeout(600)
            await pg.screenshot(path=f'shots/{theme}_10_sinottica.png')
            await pg.evaluate("location.hash='stab-metodo-metacentrico'"); await pg.wait_for_timeout(600)
            n=await pg.evaluate("[...document.querySelectorAll('.tilt-sw')].length")
            print(theme,'tilt switches total',n,'errors',errs)
            await ctx.close()
        await b.close()
    print('\n'.join(c for c in calls if 'segnale' not in c)[:3000])
asyncio.run(main())
