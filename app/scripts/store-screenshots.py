"""
Rigenera gli screenshot per gli store (decisione 14: NON vanno in git, si consegnano come zip).

Uso:
  npm run build && npx vite preview --port 4175 &
  pip install playwright && python -m playwright install chromium   # una volta
  python scripts/store-screenshots.py --langs it,en [--url http://localhost:4175/] [--chrome /usr/bin/google-chrome]

Uscita: store/screenshots/<gruppo>/<lingua>/<dispositivo>/*.png
  gruppi: app (menu dei giochi: su Android con i nastri "In arrivo", su iPhone/iPad solo i giochi pubblicati),
  pompieri (gioco 1), pasticceria (gioco 2), e uno per ogni file in scripts/screenshots/. Dispositivi: telefono Play 1920×1080,
  iPhone 6,9" 2868×1320, iPad 13" 2752×2064.
Per aggiungere un gioco: creare scripts/screenshots/<id>.py con shots(pg, url, lang, d, h) (vedi in fondo a questo file).
"""
import argparse, json, os, time
from playwright.sync_api import sync_playwright

DEV = {'phone-1920x1080': (960, 540, 2), 'iphone69-2868x1320': (956, 440, 3), 'ipad13-2752x2064': (1376, 1032, 2)}
OUT = os.path.join(os.path.dirname(__file__), '..', 'store', 'screenshots')
# Il menu va catturato come lo vedrà chi scarica l'app (decisione 26): su Android con i nastri "In arrivo",
# su iPhone e iPad senza i giochi non ancora pubblicati. Lo imposta il ciclo principale per ogni dispositivo.
MENU = {'q': ''}


def shot(pg, path):
    """Mette in pausa il loop di Phaser prima della cattura (immagini pulite)."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    pg.evaluate("window.__game.loop.sleep()"); time.sleep(0.3)
    pg.screenshot(path=path)
    pg.evaluate("window.__game.loop.wake()")


def load(pg, url, lang, saves=None):
    """Apre l'app con salvataggi preimpostati (chiavi Capacitor Preferences su localStorage)."""
    pg.goto(f'{url}?debug=1&reset=1&lang={lang}'); time.sleep(3)
    for key, value in (saves or {}).items():
        pg.evaluate(f"localStorage.setItem('CapacitorStorage.{key}', JSON.stringify({json.dumps(value)}))")
    pg.goto(f'{url}?debug=1&lang={lang}{MENU["q"]}'); time.sleep(4)


def run(pg, js):
    return pg.evaluate(js)


def start_game(pg, scene):
    """Apre Pompieri dal menu e poi la scena richiesta."""
    run(pg, "window.__game.scene.getScene('Hub').children.list.find(o => o.texture && o.texture.key === 'hub_card').emit('pointerdown')")
    for _ in range(40):
        if 'pompieri:Menu' in run(pg, "window.__game.scene.getScenes(true).map(s => s.scene.key).join(',')"): break
        time.sleep(0.3)
    time.sleep(1)
    if scene != 'pompieri:Menu':
        run(pg, f"window.__game.scene.getScene('pompieri:Menu').scene.start('{scene}')")
        time.sleep(2.5)


def shots_app(pg, url, lang, d):
    load(pg, url, lang)
    for _ in range(60):
        if run(pg, "document.getElementById('tp-loader').hidden && !!window.__game && window.__game.scene.isActive('Hub')"): break
        time.sleep(0.5)
    time.sleep(2.5)
    shot(pg, f'{d}/0-menu-giochi.png')
    # le altre pagine del menu: si tocca la freccia finché non si torna alla prima
    for n in range(2, 8):
        if not run(pg, "(() => { const b = window.__game.scene.getScene('Hub').children.list.find(o => o.texture && o.texture.key === 'btn_next'); if (!b) return false; b.emit('pointerdown'); b.emit('pointerup'); return true; })()"): break
        time.sleep(2)  # il pulsante risponde dopo la sua piccola animazione
        if not run(pg, "window.__game.scene.getScene('Hub').page"): break
        shot(pg, f'{d}/0-menu-giochi-{n}.png')


def shots_pompieri(pg, url, lang, d):
    load(pg, url, lang, {'tappolino.pompieri': {'levelsDone': 0, 'tutorialDone': False}})
    start_game(pg, 'pompieri:Menu'); shot(pg, f'{d}/1-menu.png')
    run(pg, "window.__game.scene.getScene('pompieri:Menu').scene.start('pompieri:Game')")
    for _ in range(40):
        if run(pg, "window.__game.scene.getScene('pompieri:Game').flames.length") >= 2: break
        time.sleep(0.3)
    time.sleep(0.8); shot(pg, f'{d}/2-fiamme.png')
    load(pg, url, lang, {'tappolino.pompieri': {'levelsDone': 3, 'tutorialDone': True, 'catTutorialDone': True, 'truck': 'yellow'}})
    start_game(pg, 'pompieri:Game')
    for _ in range(80):
        cat = run(pg, "(() => { const g = window.__game.scene.getScene('pompieri:Game'); const f = g.flames.filter(x => !x.dying); if (!g.cat && f.length && g.out < 4) g.extinguish(f[0]); return !!g.cat; })()")
        if cat: break
        time.sleep(0.35)
    time.sleep(1.5)
    run(pg, "window.__game.scene.getScene('pompieri:Game').rescueCat()")
    time.sleep(1.1); shot(pg, f'{d}/3-gattino.png')
    load(pg, url, lang, {'tappolino.pompieri': {'levelsDone': 4, 'tutorialDone': True, 'truck': 'yellow'}})
    start_game(pg, 'pompieri:Menu')
    run(pg, "window.__game.scene.getScene('pompieri:Menu').scene.start('pompieri:Reward', {level: 3, unlocked: ['blue']})"); time.sleep(4.5)
    shot(pg, f'{d}/4-premio.png')
    load(pg, url, lang, {'tappolino.pompieri': {'levelsDone': 6, 'catsSaved': 5, 'truck': 'green', 'tutorialDone': True}})
    start_game(pg, 'pompieri:Garage'); shot(pg, f'{d}/5-garage.png')


def open_pasticceria(pg, url, lang, data):
    """Apre Pasticceria Magica (?game=pasticceria) con i progressi indicati."""
    load(pg, url, lang, {'tappolino.pasticceria': data})
    pg.goto(f'{url}?debug=1&lang={lang}&game=pasticceria'); time.sleep(5)


def pa_wait(pg, step, timeout=40):
    """Aspetta che la partita arrivi al passo indicato e non sia occupata in un'animazione."""
    end = time.time() + timeout
    while time.time() < end:
        st, busy = run(pg, "[window.__pa.step, window.__pa.busy]")
        if st == step and not busy: return
        time.sleep(0.25)


def shots_pasticceria(pg, url, lang, d):
    vetrina = [
        {'r': 'cake', 'c': 'mint', 't': [['cherry', 0, -100], ['star', -80, -90], ['star', 80, -88], ['sprinkles', -30, -70]]},
        {'r': 'gelato', 'c': 'pink', 't': [['heart', 0, -205], ['sprinkles', -40, -120], ['cherry', 40, -110]]},
        {'r': 'cupcake', 'c': 'berry', 't': [['strawberry', 0, -205], ['sprinkles', -50, -140], ['flower', 50, -130]]},
        {'r': 'cookie', 'c': 'choco', 't': [['candy', -70, -20], ['flower', 70, -10], ['sprinkles', 0, -40], ['heart', 0, 10]]},
        {'r': 'cupcake', 'c': 'pink', 't': [['cherry', 0, -210], ['sprinkles', -40, -140], ['sprinkles', 40, -140]]},
        {'r': 'cake', 'c': 'lemon', 't': [['strawberry', -60, -96], ['strawberry', 60, -96], ['chocochip', 0, -80]]},
    ]
    base = {'served': 11, 'creations': vetrina, 'recipe': 'cupcake', 'customer': 'fox', 'tutorialDone': True}
    open_pasticceria(pg, url, lang, base); shot(pg, f'{d}/1-menu.png')
    run(pg, "window.__game.scene.getScene('pasticceria:Menu').scene.start('pasticceria:Game', {recipe: 'cupcake'}); null")
    time.sleep(3.5); shot(pg, f'{d}/2-cliente.png')
    pa_wait(pg, 'ingredients'); time.sleep(1.5)
    run(pg, "window.__pa.autoStep()"); time.sleep(1.2); shot(pg, f'{d}/3-ingredienti.png')
    for _ in range(3): run(pg, "window.__pa.autoStep()"); time.sleep(0.8)
    pa_wait(pg, 'mix'); time.sleep(1); run(pg, "window.__pa.addMix(1400); null"); time.sleep(0.3)
    run(pg, "window.__pa.autoStep()"); pa_wait(pg, 'bake'); time.sleep(1.5)
    run(pg, "window.__pa.autoStep()"); time.sleep(2.2); shot(pg, f'{d}/4-forno.png')
    pa_wait(pg, 'decorate'); time.sleep(1.5)
    run(pg, "window.__pa.autoStep()"); time.sleep(0.5); pa_wait(pg, 'decorate')
    run(pg, "window.__pa.autoStep()"); time.sleep(1.5); shot(pg, f'{d}/5-decora.png')
    pa_wait(pg, 'decorate'); run(pg, "window.__pa.autoStep()"); time.sleep(6); shot(pg, f'{d}/6-gnam.png')
    open_pasticceria(pg, url, lang, base)
    run(pg, "window.__game.scene.getScene('pasticceria:Menu').scene.start('pasticceria:Showcase'); null"); time.sleep(4)
    shot(pg, f'{d}/7-vetrina.png')


GROUPS = {'app': shots_app, 'pompieri': shots_pompieri, 'pasticceria': shots_pasticceria}

# I giochi dal 3 in poi NON modificano questo file: ognuno mette le sue catture in
# scripts/screenshots/<id>.py con una funzione  shots(pg, url, lang, d, h)  dove h dà gli aiuti
# comuni: h.shot(pg, percorso), h.load(pg, url, lang, salvataggi), h.run(pg, js).
import glob, importlib.util, types
_HELPERS = types.SimpleNamespace(shot=shot, load=load, run=run)
for _f in sorted(glob.glob(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'screenshots', '*.py'))):
    _spec = importlib.util.spec_from_file_location('shots_' + os.path.basename(_f)[:-3], _f)
    _m = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(_m)
    GROUPS[os.path.basename(_f)[:-3]] = (lambda m: lambda pg, url, lang, d: m.shots(pg, url, lang, d, _HELPERS))(_m)

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--url', default='http://localhost:4175/')
    ap.add_argument('--langs', default='it,en')
    ap.add_argument('--groups', default=','.join(GROUPS))
    ap.add_argument('--devices', default=','.join(DEV))
    ap.add_argument('--chrome', default=None, help='percorso di Chrome (facoltativo)')
    a = ap.parse_args()
    with sync_playwright() as p:
        opts = {'args': ['--use-gl=angle', '--use-angle=swiftshader']}
        if a.chrome: opts['executable_path'] = a.chrome
        b = p.chromium.launch(**opts)
        for group in a.groups.split(','):
            for lang in a.langs.split(','):
                for dev in a.devices.split(','):
                    w, h, dpr = DEV[dev]
                    MENU['q'] = '&arrivo=1' if dev.startswith('phone') else '&ios=1'
                    pg = b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=dpr)
                    GROUPS[group](pg, a.url, lang, os.path.join(OUT, group, lang, dev))
                    pg.close()
                    print('ok', group, lang, dev, flush=True)
        b.close()
