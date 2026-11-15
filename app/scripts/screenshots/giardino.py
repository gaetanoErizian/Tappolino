"""Catture per gli store del Giardino delle Fate (gioco 8): python scripts/store-screenshots.py --groups giardino"""
import time


def _bed(flowers, stages):
    return [{'f': f if s else '', 's': s} for f, s in zip(flowers, stages)]


EMPTY = _bed([''] * 7, [0] * 7)
BED0 = _bed(['tulip', 'bell', 'sun', 'rose', 'star', 'daisy', 'moon'], [4] * 7)
BED1 = _bed(['rainbow', 'daisy', 'tulip', 'moon', 'sun', 'star', 'bell'], [4] * 7)
BED2 = ['rose', 'rainbow', 'moon', 'bell', 'daisy', 'tulip', 'star']


def _open(pg, url, lang, h, garden):
    # gioco non gratis: sul web di prova si sblocca con ?unlock=1
    h.load(pg, url, lang, {'tappolino.giardino': {'garden': garden, 'last': 'star', 'tutorialDone': True}})
    pg.goto(f'{url}?debug=1&unlock=1&lang={lang}&game=giardino'); time.sleep(5)


def _garden(pg, h, bed=None):
    arg = '{}' if bed is None else '{bed: %d}' % bed
    h.run(pg, f"window.__game.scene.getScenes(true)[0].scene.start('giardino:Garden', {arg}); null")
    time.sleep(3.5)


def _ready(pg, h, timeout=30):
    end = time.time() + timeout
    while time.time() < end:
        if h.run(pg, "!!(window.__gi && window.__gi.scene.isActive() && !window.__gi.busy)"): return
        time.sleep(0.25)


def _quiet(pg, h):
    """Niente manina nelle catture."""
    h.run(pg, "window.__gi.lastAction = window.__gi.time.now + 60000; window.__gi.hint.hide(); null")


def shots(pg, url, lang, d, h):
    # menu con il fiore che canta e la prima fatina
    _open(pg, url, lang, h, [_bed(['daisy', 'tulip', 'bell', 'sun', '', '', ''], [4, 4, 4, 4, 0, 0, 0]), EMPTY, EMPTY])
    time.sleep(1.2); h.shot(pg, f'{d}/1-menu.png')
    # aiuola a metà: semi assetati, germoglio, bocciolo e la nuvoletta che fa piovere
    _garden(pg, h)
    h.run(pg, "window.__gi.autoStep()"); time.sleep(1.2)
    _ready(pg, h); h.run(pg, "window.__gi.autoStep()"); time.sleep(0.9); _quiet(pg, h)
    h.shot(pg, f'{d}/2-pioggia.png')
    # aiuola piena di fiori, farfalle e fatine
    _open(pg, url, lang, h, [BED0, EMPTY, EMPTY])
    _garden(pg, h, 0); _quiet(pg, h); time.sleep(1.5)
    h.shot(pg, f'{d}/3-aiuola-fiorita.png')
    # l'ultimo fiore della terza aiuola: arriva l'ultima fatina, festa nel giardino
    _open(pg, url, lang, h, [BED0, BED1, _bed(BED2, [4, 4, 4, 4, 4, 4, 3])])
    _garden(pg, h, 2); _quiet(pg, h)
    h.run(pg, "window.__gi.autoStep()"); time.sleep(3.8)
    h.shot(pg, f'{d}/4-nuova-fatina.png')
    time.sleep(4.0); h.shot(pg, f'{d}/5-giardino-magico.png')
    # stagno della seconda aiuola
    _garden(pg, h, 1); _quiet(pg, h); time.sleep(1.5)
    h.shot(pg, f'{d}/6-stagno.png')
    # album: tutti i fiori e tutte le fatine
    h.run(pg, "window.__gi.scene.start('giardino:Album'); null"); time.sleep(3)
    h.shot(pg, f'{d}/7-album.png')
