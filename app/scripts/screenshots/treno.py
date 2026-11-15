"""Catture per gli store di Treno degli Animali (gioco 9): python scripts/store-screenshots.py --groups treno"""
import json, time

FARM = ['cow', 'pig', 'sheep', 'hen', 'horse']
JUNGLE = ['monkey', 'elephant', 'giraffe', 'lion', 'parrot']
POLE = ['penguin', 'polarbear', 'seal', 'walrus', 'puffin']


def _open(pg, url, lang, h, data):
    # gioco non gratis: sul web di prova si sblocca con ?unlock=1
    h.load(pg, url, lang, {'tappolino.treno': data})
    pg.goto(f'{url}?debug=1&unlock=1&lang={lang}&game=treno'); time.sleep(5)


def _start(pg, h, scene, data=None):
    h.run(pg, f"window.__game.scene.getScenes(true)[0].scene.start('{scene}', {json.dumps(data or {})}); null")
    time.sleep(0.8)


def _station(pg, h, dest, kind, groups, timeout=60):
    """Apre la stazioncina con un viaggio scelto e aspetta che il treno sia fermo."""
    _start(pg, h, 'treno:Station', {'dest': dest, 'kind': kind, 'groups': groups})
    end = time.time() + timeout
    while time.time() < end:
        if h.run(pg, "!!(window.__tr && window.__tr.scene.isActive() && !window.__tr.busy)"): break
        time.sleep(0.25)
    # niente manina nelle catture
    h.run(pg, "window.__tr.lastAction = window.__tr.time.now + 60000; null"); time.sleep(0.6)


def _scene(pg, h, key, timeout=40):
    end = time.time() + timeout
    while time.time() < end:
        if key in h.run(pg, "window.__game.scene.getScenes(true).map(s => s.scene.key).join(',')"): return
        time.sleep(0.25)


def shots(pg, url, lang, d, h):
    base = {'trips': 9, 'delivered': FARM + JUNGLE[:3], 'last': 'giungla', 'tutorialDone': True}
    _open(pg, url, lang, h, base)
    time.sleep(1.2); h.shot(pg, f'{d}/1-menu.png')
    # colori: 5 animali della giungla e tre vagoni colorati
    _station(pg, h, 'giungla', 'color', [2, 2, 1])
    h.shot(pg, f'{d}/2-colori.png')
    # due animali già a bordo
    for _ in range(2):
        h.run(pg, "window.__tr.autoStep()"); time.sleep(1.1)
    h.run(pg, "window.__tr.lastAction = window.__tr.time.now + 60000; null")
    h.shot(pg, f'{d}/3-a-bordo.png')
    # forme
    _station(pg, h, 'fattoria', 'shape', [1, 1, 1])
    h.shot(pg, f'{d}/4-forme.png')
    # numeri: si conta salendo sul treno
    _station(pg, h, 'polo', 'number', [2, 3])
    for _ in range(4):
        h.run(pg, "window.__tr.autoStep()"); time.sleep(1.0)
    time.sleep(0.1); h.shot(pg, f'{d}/5-numeri.png')
    # il viaggio e l'arrivo al polo con la festa
    h.run(pg, "window.__tr.autoStep()")
    _scene(pg, h, 'treno:Journey'); time.sleep(2.0); h.shot(pg, f'{d}/6-viaggio.png')
    _scene(pg, h, 'treno:Arrive'); time.sleep(8.0); h.shot(pg, f'{d}/7-arrivo-polo.png')
    # l'album delle stazioni quasi completo
    _open(pg, url, lang, h, {'trips': 14, 'delivered': FARM + JUNGLE + POLE[:3], 'last': 'polo', 'tutorialDone': True})
    _start(pg, h, 'treno:Album'); time.sleep(1.5)
    h.shot(pg, f'{d}/8-album.png')
