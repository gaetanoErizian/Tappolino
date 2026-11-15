"""Catture per gli store del Salone degli Unicorni (gioco 4): python scripts/store-screenshots.py --groups unicorni"""
import time

LOOKS = [
    {'u': 'notte', 'c': 'rainbow', 'a': ['crown', 'necklace', 'wings', 'star', 'heart', 'star']},
    {'u': 'rosa', 'c': 'gold', 'a': ['flower', 'glasses', 'heart', 'heart']},
    {'u': 'cielo', 'c': 'pink', 'a': ['bow', 'necklace', 'star', 'star', 'star']},
    {'u': 'pesca', 'c': 'lilac', 'a': ['crown', 'wings', 'heart']},
    {'u': 'lavanda', 'c': 'mint', 'a': ['bow', 'glasses', 'star', 'heart', 'star', 'heart']},
    {'u': 'perla', 'c': 'turquoise', 'a': ['bow', 'star']},
]
FULL = {'visits': 13, 'photos': LOOKS, 'groomed': ['perla', 'rosa', 'cielo', 'pesca', 'lavanda', 'notte'], 'last': 'notte', 'tutorialDone': True}


def _open(pg, url, lang, h, data):
    # il gioco è compreso nello sblocco unico: nelle catture è sbloccato
    h.load(pg, url, lang, {'tappolino.unicorni': data})
    pg.goto(f'{url}?debug=1&unlock=1&lang={lang}&game=unicorni')
    _wait(pg, h, "window.__game.scene.getScenes(true).some(s => s.scene.key === 'unicorni:Menu')")
    time.sleep(1.5)


def _wait(pg, h, cond, timeout=300):
    end = time.time() + timeout
    while time.time() < end and not h.run(pg, cond):
        time.sleep(0.25)


def _phase(pg, h, ph):
    _wait(pg, h, f"window.__un && window.__un.phase === '{ph}' && !window.__un.busy && !window.__un.flying")


def _salon(pg, h, u):
    h.run(pg, f"window.__game.scene.getScene('unicorni:Menu').scene.start('unicorni:Salon', {{u: '{u}'}}); null")
    _phase(pg, h, 'wash')


def _tool(pg, h, cx, cy):
    """Attrezzo sopra un punto della tela dell'unicorno, manina nascosta (cattura "a metà lavoro")."""
    h.run(pg, f"""(() => {{ const g = window.__un; g.hint.hide(); g.lastAction = g.time.now + 60000;
      const p = g.uni.toScene({cx}, {cy}); g.toolTo(p.x, p.y); }})()""")


def shots(pg, url, lang, d, h):
    _open(pg, url, lang, h, FULL)
    h.shot(pg, f'{d}/1-menu.png')
    # arriva sporco e spettinato (con la manina della prima volta)
    _open(pg, url, lang, h, {**FULL, 'tutorialDone': False})
    _salon(pg, h, 'perla')
    _wait(pg, h, "window.__un.hint.visible", 60); time.sleep(0.6)
    h.shot(pg, f'{d}/2-arrivo.png')
    # schiuma a metà
    h.run(pg, "window.__un.rubTo(0.34, 330, 420); null"); _tool(pg, h, 250, 400); time.sleep(0.5)
    h.shot(pg, f'{d}/3-schiuma.png')
    h.run(pg, "window.__un.autoStep(); null"); _phase(pg, h, 'rinse')
    h.run(pg, "window.__un.autoStep(); null"); _phase(pg, h, 'brush')
    # spazzola a metà: criniera mezza arruffata e mezza morbida
    h.run(pg, "window.__un.rubTo(0.32, 470, 150); null"); _tool(pg, h, 450, 250); time.sleep(0.5)
    h.shot(pg, f'{d}/4-spazzola.png')
    h.run(pg, "window.__un.autoStep(); null"); _phase(pg, h, 'color'); time.sleep(1.2)
    # colore arcobaleno a metà
    h.run(pg, "window.__un.choose('rainbow'); null"); time.sleep(0.6)
    h.run(pg, "window.__un.rubTo(0.36, 480, 130); null"); _tool(pg, h, 445, 260); time.sleep(0.5)
    h.shot(pg, f'{d}/5-colori.png')
    h.run(pg, "window.__un.autoStep(); null"); _phase(pg, h, 'color')
    h.run(pg, "window.__un.startDecorate(); null"); _phase(pg, h, 'decorate'); time.sleep(1.2)
    for i in [3, 4, 7, 1, 2, 1]:
        h.run(pg, f"(() => {{ const it = window.__un.items[{i}]; if (it) window.__un.wearAcc(it.id, it.img); }})()")
        _phase(pg, h, 'decorate'); time.sleep(0.5)
    h.run(pg, "window.__un.hint.hide(); window.__un.lastAction = window.__un.time.now + 60000; null"); time.sleep(0.8)
    h.shot(pg, f'{d}/6-accessori.png')
    # foto ricordo con la sorpresa (nuovo unicorno)
    h.run(pg, f"window.__game.scene.getScene('unicorni:Salon').scene.start('unicorni:Photo', {{look: window.__un.uni ? {{u: 'perla', c: 'rainbow', a: window.__un.uni.accessories}} : null, reward: {{kind: 'unicorn', id: 'notte'}}}}); null")
    _wait(pg, h, "window.__game.scene.getScene('unicorni:Photo').children.list.some(o => o.type === 'Container' && o.list.length > 8 && o.x > 1200)")
    time.sleep(2.5)
    h.shot(pg, f'{d}/7-foto.png')
    h.run(pg, "window.__game.scene.getScene('unicorni:Photo').scene.start('unicorni:Album'); null"); time.sleep(3.5)
    h.shot(pg, f'{d}/8-album.png')
