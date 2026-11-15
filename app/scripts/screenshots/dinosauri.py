"""Catture per gli store di Scavo dei Dinosauri (gioco 3): python scripts/store-screenshots.py --groups dinosauri"""
import time

ALBUM = ['rex', 'pachy', 'tricera', 'ptero', 'anky', 'para']


def _open(pg, url, lang, h, data):
    h.load(pg, url, lang, {'tappolino.dinosauri': data})
    pg.goto(f'{url}?debug=1&lang={lang}&game=dinosauri'); time.sleep(5)


def _dig(pg, h, dino):
    h.run(pg, f"window.__game.scene.getScene('dinosauri:Menu').scene.start('dinosauri:Dig', {{dino: '{dino}'}}); null")
    time.sleep(2.5)


def shots(pg, url, lang, d, h):
    base = {'found': ALBUM, 'digs': 9, 'last': 'tricera', 'tutorialDig': True, 'tutorialBuild': True}
    _open(pg, url, lang, h, base)
    time.sleep(1.5); h.shot(pg, f'{d}/1-menu.png')
    # scavo a metà: un osso che spunta dalla terra, il pennello al lavoro
    _dig(pg, h, 'stego')
    h.run(pg, """(() => { const g = window.__di; const b = g.bones.find(x => x.piece.id === 'ribs'); const r = b.rect; g.hint.hide(); g.lastAction = g.time.now + 60000;
      for (let y = r.y - 10; y <= r.bottom; y += 36) for (let x = r.x - 30; x <= r.x + r.width * 0.55; x += 36) g.scratch.eraseAt(x, y);
      g.brush.setVisible(true).setPosition(r.x + r.width * 0.62, r.centerY + 20).setAngle(-6); })()""")
    time.sleep(0.6); h.shot(pg, f'{d}/2-scavo.png')
    h.run(pg, "window.__di.brush.setVisible(false); window.__di.autoDigOne(); null"); time.sleep(1.4)
    h.run(pg, "window.__di.autoDigOne(); null"); time.sleep(0.4); h.shot(pg, f'{d}/3-ossa.png')
    while h.run(pg, "window.__di.autoDigOne()"): time.sleep(1.3)
    time.sleep(2.5)
    for _ in range(3): h.run(pg, "window.__di.autoPlaceOne()"); time.sleep(0.7)
    time.sleep(0.6); h.shot(pg, f'{d}/4-montaggio.png')
    while h.run(pg, "window.__di.autoPlaceOne()"): time.sleep(0.6)
    time.sleep(3.6); h.shot(pg, f'{d}/5-ruggito.png')
    time.sleep(5)
    h.run(pg, "window.__game.scene.getScene('dinosauri:Dig').scene.start('dinosauri:Album'); null"); time.sleep(3.5)
    h.shot(pg, f'{d}/6-album.png')
