"""Catture per gli store di Cuccioli dal Dottore (gioco 6): python scripts/store-screenshots.py --groups cuccioli"""
import json, time

GARDEN = ['dog', 'cat', 'bunny', 'bear', 'fox', 'panda', 'pig', 'lamb']


def _open(pg, url, lang, h, data):
    # gioco non gratis: sul web di prova si sblocca con ?unlock=1
    h.load(pg, url, lang, {'tappolino.cuccioli': data})
    pg.goto(f'{url}?debug=1&unlock=1&lang={lang}&game=cuccioli'); time.sleep(5)


def _visit(pg, h, pet, problems):
    h.run(pg, f"window.__game.scene.getScenes(true)[0].scene.start('cuccioli:Clinic', {json.dumps({'pet': pet, 'problems': problems})}); null")
    time.sleep(1)
    _ready(pg, h)


def _ready(pg, h, timeout=120):
    """Aspetta che la visita sia pronta (strumenti sul vassoio, nessuna animazione in corso)."""
    end = time.time() + timeout
    while time.time() < end:
        if h.run(pg, "!!(window.__cu && window.__cu.scene.isActive() && !window.__cu.busy)"): return
        time.sleep(0.25)


def shots(pg, url, lang, d, h):
    base = {'cured': GARDEN[:6], 'visits': 8, 'last': 'cat', 'tutorialDone': True}
    _open(pg, url, lang, h, base)
    time.sleep(1.2); h.shot(pg, f'{d}/1-menu.png')
    # visita: zampa infangata, freddo e fame
    _visit(pg, h, 'dog', ['dirty', 'cold', 'hungry'])
    h.run(pg, "window.__cu.lastAction = window.__cu.time.now + 60000; null"); time.sleep(1.2)
    h.shot(pg, f'{d}/2-visita.png')
    # la spugna al lavoro, con le bolle
    h.run(pg, "window.__cu.autoStep()"); time.sleep(1.0); h.shot(pg, f'{d}/3-spugna.png')
    # la sciarpa: niente più brividi
    _ready(pg, h); h.run(pg, "window.__cu.autoStep()"); time.sleep(0.9); h.shot(pg, f'{d}/4-sciarpa.png')
    # festa finale
    _ready(pg, h); h.run(pg, "window.__cu.autoStep()")
    end = time.time() + 30
    while time.time() < end and not h.run(pg, "window.__cu.finished"): time.sleep(0.25)
    time.sleep(0.9); h.shot(pg, f'{d}/5-festa.png')
    # il coniglietto e il fazzoletto (un grande starnuto)
    _visit(pg, h, 'bunny', ['sneezy', 'thorn'])
    h.run(pg, "window.__cu.lastAction = window.__cu.time.now + 60000; null")
    h.run(pg, "window.__cu.autoStep()"); time.sleep(1.1); h.shot(pg, f'{d}/6-starnuto.png')
    # il giardino pieno di amici
    _open(pg, url, lang, h, {'cured': GARDEN, 'visits': 12, 'last': 'lamb', 'tutorialDone': True})
    h.run(pg, "window.__game.scene.getScene('cuccioli:Menu').scene.start('cuccioli:Garden'); null"); time.sleep(3)
    h.shot(pg, f'{d}/7-giardino.png')
