"""
Rigenera gli screenshot per gli store (decisione 14: NON vanno in git, si consegnano come zip).

Uso:
  npm run build && npx vite preview --port 4175 &
  pip install playwright && python -m playwright install chromium   # una volta
  python scripts/store-screenshots.py --langs it,en [--url http://localhost:4175/] [--chrome /usr/bin/google-chrome]

Uscita: store/screenshots/<gruppo>/<lingua>/<dispositivo>/*.png
  gruppi: app (menu dei giochi), pompieri (gioco 1). Dispositivi: telefono Play 1920×1080,
  iPhone 6,9" 2868×1320, iPad 13" 2752×2064.
Per aggiungere un gioco: scrivere una funzione shots_<id>() sul modello di shots_pompieri().
"""
import argparse, json, os, time
from playwright.sync_api import sync_playwright

DEV = {'phone-1920x1080': (960, 540, 2), 'iphone69-2868x1320': (956, 440, 3), 'ipad13-2752x2064': (1376, 1032, 2)}
OUT = os.path.join(os.path.dirname(__file__), '..', 'store', 'screenshots')


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
    pg.goto(f'{url}?debug=1&lang={lang}'); time.sleep(4)


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
    shot(pg, f'{d}/0-menu-giochi.png')


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


GROUPS = {'app': shots_app, 'pompieri': shots_pompieri}

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
                    pg = b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=dpr)
                    GROUPS[group](pg, a.url, lang, os.path.join(OUT, group, lang, dev))
                    pg.close()
                    print('ok', group, lang, dev, flush=True)
        b.close()
