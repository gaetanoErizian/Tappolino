"""Catture per gli store di Razzo tra le Stelle (gioco 5): python scripts/store-screenshots.py --groups razzo"""
import time

VISITED = ['luna', 'anelli', 'bolle', 'giungla', 'caramella']


def _open(pg, url, lang, h, data):
    h.load(pg, url, lang, {'tappolino.razzo': data})
    # il gioco 5 è compreso nell'acquisto unico: nelle catture è sbloccato
    pg.goto(f'{url}?debug=1&unlock=1&lang={lang}&game=razzo'); time.sleep(5)


def _wait(pg, h, js, t=40):
    t0 = time.time()
    while time.time() - t0 < t:
        try:
            if h.run(pg, js): return True
        except Exception:
            pass
        time.sleep(0.3)
    return False


def _fly(pg, h, planet):
    h.run(pg, f"window.__game.scene.getScene('razzo:Menu').scene.start('razzo:Flight', {{planet: '{planet}'}}); null")
    _wait(pg, h, "window.__rz && window.__rz.scene.isActive() && window.__rz.state.phase === 'fly'")
    h.run(pg, "window.__rz.autoPilot = true; null")


def shots(pg, url, lang, d, h):
    base = {'visited': VISITED, 'trips': 6, 'stars': 214, 'rocket': 'giallo', 'last': 'caramella', 'tutorial': True}
    _open(pg, url, lang, h, base)
    time.sleep(1.5); h.shot(pg, f'{d}/1-menu.png')
    # in volo: stelle davanti e un asteroide di gomma sull'altra riga
    _fly(pg, h, 'ghiaccio')
    _wait(pg, h, "window.__rz.live.some(l => l.item.kind === 'rock' && l.img.x > 1100 && l.img.x < 1600) && window.__rz.live.filter(l => !l.taken && l.item.kind !== 'rock' && l.img.x > 600).length >= 5", 90)
    h.shot(pg, f'{d}/2-volo.png')
    # rimbalzo sull'asteroide
    h.run(pg, """(() => { const g = window.__rz; g.autoPilot = false;
      window.__shotTimer = setInterval(() => { const r = g.live.find(l => l.item.kind === 'rock' && l.img.x > g.rocket.x - 40); if (r) { g.st.y = r.img.y + 30; g.st.vy = 0; } }, 30); })()""")
    _wait(pg, h, "window.__rz.invuln > window.__rz.time.now", 60)
    h.run(pg, "clearInterval(window.__shotTimer); null")
    time.sleep(0.15); h.shot(pg, f'{d}/3-boing.png')
    # arrivo: atterraggio sul pianeta e festa
    h.run(pg, "window.__rz.autoPilot = true; window.__rz.skipTo(0.97); null")
    _wait(pg, h, "window.__rz.state.phase === 'landed'", 60)
    time.sleep(1); h.shot(pg, f'{d}/4-atterraggio.png')
    h.run(pg, "window.__game.scene.getScene('razzo:Flight').scene.start('razzo:Planets'); null"); time.sleep(3)
    h.shot(pg, f'{d}/5-pianeti.png')
    h.run(pg, "window.__game.scene.getScene('razzo:Planets').scene.start('razzo:Hangar'); null"); time.sleep(3)
    h.shot(pg, f'{d}/6-razzi.png')
