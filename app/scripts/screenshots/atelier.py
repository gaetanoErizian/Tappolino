"""Catture per gli store dell'Atelier delle Principesse (gioco 10): python scripts/store-screenshots.py --groups atelier"""
import json, time

ALBUM = [
    {'char': 'nina', 'dress': 'party', 'head': 'star_tiara', 'feet': 'sparkle', 'hand': 'wand', 'bg': 'party'},
    {'char': 'leo', 'dress': 'armor', 'head': 'helmet', 'feet': 'knight_boots', 'hand': 'shield', 'back': 'cape', 'bg': 'castle'},
    {'char': 'mei', 'dress': 'fairy', 'head': 'wreath', 'feet': 'slippers', 'back': 'wings', 'bg': 'forest'},
    {'char': 'sami', 'dress': 'coat', 'head': 'hat', 'feet': 'boots', 'hand': 'bouquet', 'bg': 'party'},
    {'char': 'teo', 'dress': 'tunic', 'head': 'crown', 'feet': 'boots', 'back': 'cape', 'neck': 'bowtie', 'bg': 'castle'},
    {'char': 'lia', 'dress': 'gown_lilac', 'head': 'hennin', 'feet': 'sparkle', 'hand': 'parasol', 'bg': 'forest'},
]
SAVE = {'shows': 16, 'album': ALBUM, 'last': ALBUM[0], 'tutorialDone': True}


def _keep_time(pg, h, secs):
    """Aspetta `secs` secondi tenendo orologi e animazioni delle scene al passo con il tempo reale anche quando
    il browser di cattura (senza scheda video) disegna pochi fotogrammi al secondo."""
    end = time.time() + secs
    while time.time() < end:
        h.run(pg, "(()=>{const f=Math.max(4,window.__game.loop.actualFps||60);window.__game.scene.getScenes(true).forEach(s=>{s.time.timeScale=60/f;s.tweens.timeScale=60/f})})()")
        time.sleep(0.2)


def _wait(pg, h, js, timeout=60):
    end = time.time() + timeout
    while time.time() < end:
        try:
            if h.run(pg, js): return True
        except Exception:
            pass
        _keep_time(pg, h, 0.3)
    return False


def _open(pg, url, lang, h, data):
    # gioco non gratis: sul web di prova si sblocca con ?unlock=1
    h.load(pg, url, lang, {'tappolino.atelier': data})
    pg.goto(f'{url}?debug=1&unlock=1&lang={lang}&game=atelier')
    _wait(pg, h, "window.__game && window.__game.scene.isActive('atelier:Menu')")
    _keep_time(pg, h, 2.5)


def _start(pg, h, scene, data=None):
    h.run(pg, f"window.__game.scene.getScenes(true)[0].scene.start('{scene}', {json.dumps(data or {})}); null")


def _dress(pg, h, look, cat):
    _start(pg, h, 'atelier:Dress', {'look': look})
    _wait(pg, h, f"window.__at && window.__at.scene.isActive() && window.__at.look.char === '{look['char']}'")
    _keep_time(pg, h, 1.5)
    h.run(pg, f"window.__at.selectCat('{cat}'); window.__at.lastAction = window.__at.time.now + 60000; null")
    _keep_time(pg, h, 1.6)


def _show(pg, h, look):
    # la scena può ripartire da se stessa: si aspetta la nuova sfilata, non quella di prima
    h.run(pg, "window.__ats = null; null")
    _start(pg, h, 'atelier:Show', {'look': look})
    _wait(pg, h, "window.__ats && window.__ats.scene.isActive()")


def shots(pg, url, lang, d, h):
    _open(pg, url, lang, h, SAVE)
    h.shot(pg, f'{d}/1-menu.png')
    # tutti gli amici dell'atelier
    _start(pg, h, 'atelier:Pick'); _keep_time(pg, h, 2.6)
    h.shot(pg, f'{d}/2-amici.png')
    # Lia con l'abito lilla e il cappello a cono
    _dress(pg, h, {'char': 'lia', 'dress': 'gown_lilac', 'head': 'hennin', 'feet': 'sparkle', 'neck': 'necklace'}, 'dress')
    h.shot(pg, f'{d}/3-atelier.png')
    # Leo cavaliere: armatura, elmo, scudo e mantello
    _dress(pg, h, {'char': 'leo', 'dress': 'armor', 'head': 'helmet', 'feet': 'knight_boots', 'hand': 'shield', 'back': 'cape'}, 'extra')
    h.shot(pg, f'{d}/4-cavaliere.png')
    # la scelta dello sfondo
    h.run(pg, "window.__at.openChooser(); null"); _keep_time(pg, h, 1.8)
    h.shot(pg, f'{d}/5-sfondi.png')
    # sfilata al castello: giravolta e coriandoli
    _show(pg, h, {'char': 'teo', 'dress': 'tunic', 'head': 'crown', 'feet': 'boots', 'back': 'cape', 'neck': 'bowtie', 'bg': 'castle'})
    _keep_time(pg, h, 3.0); h.shot(pg, f'{d}/6-castello.png')
    # nel bosco incantato, con le ali da fata
    _show(pg, h, {'char': 'mei', 'dress': 'fairy', 'head': 'wreath', 'feet': 'slippers', 'back': 'wings', 'hand': 'wand', 'bg': 'forest'})
    _keep_time(pg, h, 3.2); h.shot(pg, f'{d}/7-bosco.png')
    # alla festa, con la sorpresa scartata
    _show(pg, h, {'char': 'nina', 'dress': 'party', 'head': 'star_tiara', 'feet': 'sparkle', 'hand': 'bouquet', 'bg': 'party'})
    _wait(pg, h, "!!window.__ats.gift"); _keep_time(pg, h, 1.0)
    h.run(pg, "window.__ats.openGift(); null")
    _wait(pg, h, "window.__ats.done"); _keep_time(pg, h, 0.8)
    h.shot(pg, f'{d}/8-sorpresa.png')
    # la galleria piena
    _open(pg, url, lang, h, SAVE)
    _start(pg, h, 'atelier:Gallery'); _keep_time(pg, h, 2.6)
    h.shot(pg, f'{d}/9-galleria.png')
