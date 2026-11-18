"""Catture per gli store di Cacchino (gioco 11): python scripts/store-screenshots.py --groups cacchino"""
import json, time

BIG = {'xp': 2600, 'coins': 140, 'gas': 55, 'needs': {'food': 72, 'water': 80, 'clean': 88, 'energy': 76, 'fun': 90},
       'owned': ['cap', 'round', 'bowtie', 'party'], 'worn': {'hat': 'party', 'eyes': 'round', 'neck': 'bowtie'},
       'inv': {'apple': 2, 'beans': 3, 'water': 2, 'soup': 2, 'pizza': 1, 'icecream': 1}, 'friends': {'roll': 4, 'soap': 2, 'plunger': 1},
       'solved': {'path': 12, 'sort': 12, 'exit': 12, 'seq': 12}, 'tutorial': 1}


def _open(pg, url, lang, h, data):
    # gioco non gratis: sul web di prova si sblocca con ?unlock=1
    h.load(pg, url, lang, {'tappolino.cacchino': data})
    pg.goto(f'{url}?debug=1&unlock=1&lang={lang}&game=cacchino')
    end = time.time() + 60
    while time.time() < end and not h.run(pg, "!!(window.__pp && window.__pp.scene.isActive())"): time.sleep(0.4)
    time.sleep(1.5)
    _quiet(pg, h)


def _quiet(pg, h):
    """Niente manina d'aiuto nelle catture."""
    h.run(pg, "window.__pp.lastAction = window.__pp.time.now + 600000; window.__pp.hint.hide(); null")


def _puzzle(pg, h, act, kind, n, room, steps):
    h.run(pg, f"window.__game.scene.getScenes(true)[0].scene.start('cacchino:Puzzle', {json.dumps({'act': act, 'kind': kind, 'n': n, 'room': room})}); null")
    time.sleep(1.8)
    h.run(pg, "window.__pz.lastAction = window.__pz.time.now + 600000; window.__pz.hint.hide(); null")
    for _ in range(steps):
        h.run(pg, "window.__pz.autoStep()"); time.sleep(0.5)
    time.sleep(0.5)


def shots(pg, url, lang, d, h):
    _open(pg, url, lang, h, BIG)
    h.shot(pg, f'{d}/1-cucina.png')
    # la pappa: dispensa aperta
    h.run(pg, "window.__pp.openTray(); null"); time.sleep(0.6); _quiet(pg, h); h.shot(pg, f'{d}/2-pappa.png')
    # la puzzetta
    h.run(pg, "window.__pp.closeTray(); window.__pp.g.gas = 70; window.__pp.poke(); null"); time.sleep(0.55); h.shot(pg, f'{d}/3-puzzetta.png')
    time.sleep(1.5)
    # il parco con gli amici
    h.run(pg, "window.__pp.onTab('park'); null"); time.sleep(1.2); _quiet(pg, h); h.shot(pg, f'{d}/4-parco.png')
    # l'armadio
    h.run(pg, "window.__pp.onTab('bedroom'); null"); time.sleep(1.2); h.run(pg, "window.__pp.openWardrobe(); null"); time.sleep(0.8); h.shot(pg, f'{d}/5-armadio.png')
    # i rompicapo
    _puzzle(pg, h, 'bath', 'path', 12, 'bath', 5); h.shot(pg, f'{d}/6-spugna.png')
    _puzzle(pg, h, 'cook', 'sort', 14, 'kitchen', 3); h.shot(pg, f'{d}/7-barattoli.png')
    _puzzle(pg, h, 'potty', 'exit', 20, 'bath', 2); h.shot(pg, f'{d}/8-puzzette.png')
    _puzzle(pg, h, 'school', 'seq', 9, 'school', 0); h.shot(pg, f'{d}/9-sequenze.png')
