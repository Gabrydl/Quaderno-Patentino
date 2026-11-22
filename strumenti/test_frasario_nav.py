import asyncio, json, time
from playwright.async_api import async_playwright
BASE='http://127.0.0.1:8765/'
SB='https://cvyuytnouuapmazjnebc.supabase.co'
SESS={'at':'tok','rt':'ref','exp':int(time.time())+3600,'user':{'id':'u1','email':'gabrydl@gabrydl99.github.io','user_metadata':{'nome':'Gabrydl'},'app_metadata':{'ruolo':'superadmin'}}}
async def handle(route):
    u=route.request.url
    if route.request.method=='OPTIONS': return await route.fulfill(status=204,headers={'access-control-allow-origin':'*','access-control-allow-headers':'*'})
    if '/functions/v1/traduci' in u: return await route.fulfill(status=200,content_type='application/json',body=json.dumps({'traduzione':'The vessel has a dangerous list to starboard.'}),headers={'access-control-allow-origin':'*'})
    if '/rpc/segnale' in u: return await route.fulfill(status=200,content_type='application/json',body=json.dumps({'ruolo':'superadmin'}),headers={'access-control-allow-origin':'*'})
    return await route.fulfill(status=200,content_type='application/json',body='[]',headers={'access-control-allow-origin':'*'})
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        for theme in ['light','dark']:
            ctx=await b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,color_scheme=theme)
            await ctx.route(SB+'/**',handle); await ctx.route('https://*.claudeusercontent.com/**',lambda r: r.abort())
            await ctx.add_init_script("localStorage.setItem('qp-sess', %s)" % json.dumps(json.dumps(SESS)))
            pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
            await pg.goto(BASE); await pg.wait_for_timeout(800)
            await pg.evaluate("document.querySelector('.frs').scrollIntoView({block:'center'})"); await pg.wait_for_timeout(300)
            await pg.screenshot(path=f'shots/{theme}_20_homefras.png')
            await pg.goto(BASE+'frasario/'); await pg.wait_for_timeout(800)
            await pg.fill('#q','sband'); await pg.wait_for_timeout(400)
            await pg.screenshot(path=f'shots/{theme}_21_sugg.png')
            await pg.fill('#q','la nave ha uno sbandamento pericoloso a dritta'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(300)
            await pg.click('#gemGo'); await pg.wait_for_timeout(500)
            await pg.screenshot(path=f'shots/{theme}_22_trad.png', full_page=True)
            await pg.click('.tabs [data-p="pF"]'); await pg.wait_for_timeout(300)
            await pg.screenshot(path=f'shots/{theme}_23_frasi.png')
            await pg.click('.tabs [data-p="pG"]'); await pg.wait_for_timeout(300)
            await pg.screenshot(path=f'shots/{theme}_24_glos.png')
            await pg.goto(BASE+'#nav-safety-ecdis'); await pg.wait_for_timeout(900)
            await pg.screenshot(path=f'shots/{theme}_25_safety.png')
            await pg.evaluate("document.querySelectorAll('article.topic.on figure')[0].scrollIntoView({block:'start'})"); await pg.wait_for_timeout(300)
            await pg.screenshot(path=f'shots/{theme}_26_safetyfig.png')
            await pg.goto(BASE+'#nav-passage-planning'); await pg.wait_for_timeout(900)
            await pg.evaluate("document.querySelectorAll('article.topic.on figure')[1].scrollIntoView({block:'start'})"); await pg.wait_for_timeout(300)
            await pg.screenshot(path=f'shots/{theme}_27_passage.png')
            await pg.goto(BASE+'#nav-pilot-routeing'); await pg.wait_for_timeout(900)
            await pg.evaluate("document.querySelectorAll('article.topic.on figure')[0].scrollIntoView({block:'start'})"); await pg.wait_for_timeout(300)
            await pg.screenshot(path=f'shots/{theme}_28_pilot.png')
            n=await pg.evaluate("[...document.querySelectorAll('section#navigazione article.topic')].map(a=>a.id).slice(-6)")
            print(theme,'errors',errs, n)
            await ctx.close()
        await b.close()
asyncio.run(main())
