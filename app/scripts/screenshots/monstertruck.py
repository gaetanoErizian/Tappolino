"""Catture per gli store dell'Officina dei Monster Truck (gioco 7): python scripts/store-screenshots.py --groups monstertruck"""
import time

BASE = {'races': 7, 'stars': 312, 'color': 'blu', 'wheel': 'fiamme', 'sticker': 'fulmine', 'track': 'arena',
        'raced': ['arena', 'dune', 'cantiere'], 'visits': 7, 'tutorial': True, 'garageTutorial': True}


def _wait(pg, h, js, t=40):
    t0 = time.time()
    while time.time() - t0 < t:
        try:
            if h.run(pg, js): return True
        except Exception:
            pass
        time.sleep(0.3)
    return False


def _scene(pg, h, frm, to, data='{}'):
    h.run(pg, f"window.__game.scene.getScene('{frm}').scene.start('{to}', {data}); null")


def shots(pg, url, lang, d, h):
    h.load(pg, url, lang, {'tappolino.monstertruck': BASE})
    # il gioco 7 è compreso nell'acquisto unico: nelle catture è sbloccato
    pg.goto(f'{url}?debug=1&unlock=1&lang={lang}&game=monstertruck')
    _wait(pg, h, "window.__game && window.__game.scene.isActive('monstertruck:Menu')"); time.sleep(1.5)
    h.shot(pg, f'{d}/1-menu.png')
    # officina: il truck arriva con i guasti
    _scene(pg, h, 'monstertruck:Menu', 'monstertruck:Garage', "{repairs: ['ruota', 'fango', 'motore']}")
    _wait(pg, h, "window.__mt && window.__mt.scene.isActive()"); time.sleep(2)
    h.shot(pg, f'{d}/2-officina.png')
    for _ in range(3):
        _wait(pg, h, "window.__mt.autoFix()", 20); time.sleep(0.4)
    _wait(pg, h, "window.__mt.state.ready", 30); time.sleep(1.2)
    h.run(pg, "window.__mt.showCat('color'); null"); time.sleep(1)
    h.shot(pg, f'{d}/3-colori.png')
    # in pista: salto dal trampolino
    _scene(pg, h, 'monstertruck:Garage', 'monstertruck:Race', "{track: 'canyon'}")
    _wait(pg, h, "window.__mtr && window.__mtr.scene.isActive()"); time.sleep(1)
    h.run(pg, "window.__mtr.autoPilot = true; null")
    _wait(pg, h, "window.__mtr.state.air && window.__mtr.state.y < 640", 90)
    h.shot(pg, f'{d}/4-salto.png')
    # traguardo con il pubblico che esulta e il premio
    h.run(pg, "window.__mtr.skipTo(0.95); null")
    _wait(pg, h, "window.__mtr.state.phase === 'done'", 60); time.sleep(3.5)
    h.shot(pg, f'{d}/5-traguardo.png')
    _scene(pg, h, 'monstertruck:Race', 'monstertruck:Tracks'); time.sleep(2.5)
    h.shot(pg, f'{d}/6-piste.png')
