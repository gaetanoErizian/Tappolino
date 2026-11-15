"""
Pasticceria Magica — effetti sonori.

- Effetti "musicali" (campanello del negozio, ding del forno, magia, festa...) suonati con strumenti
  campionati (MuseScore General, MIT) tramite FluidSynth.
- Effetti "fisici" (plop nella ciotola, frusta, glassa, morso, sportello...) costruiti con sintesi offline
  (numpy): più strati, inviluppi, filtri e un piccolo riverbero comune, per un suono pieno e coerente.

Uso (dalla cartella app/):  python3 scripts/audio/pasticceria_sfx.py
Scrive src/games/pasticceria/audio/sfx_<nome>.mp3
"""
import os, subprocess, wave
import numpy as np
import mido

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, '..', '..', 'src', 'games', 'pasticceria', 'audio'))
TMP = '/tmp/pasticceria-audio/sfx'
SF2 = os.environ.get('SF2', '/usr/share/sounds/sf2/MuseScore_General_Full.sf2')
SR = 44100
rng = np.random.default_rng(11)


# ------------------------------------------------------------------ utilità DSP
def t_(dur):
    return np.arange(int(dur * SR)) / SR


def env(n, a=0.005, d=0.2, curve=4.0):
    """Attacco lineare + decadimento esponenziale (d = tempo a -60 dB circa)."""
    x = np.arange(n) / SR
    e = np.minimum(1, x / max(a, 1e-4)) * np.exp(-curve * np.maximum(0, x - a) / max(d, 1e-4))
    return e


def sweep_sine(f0, f1, dur, curve='exp'):
    x = t_(dur)
    f = f0 * (f1 / f0) ** (x / dur) if curve == 'exp' else f0 + (f1 - f0) * x / dur
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def noise(dur):
    return rng.uniform(-1, 1, int(dur * SR))


def biquad(x, kind, f, q=0.707):
    """Filtro biquad (RBJ) con frequenza costante."""
    w0 = 2 * np.pi * f / SR
    al = np.sin(w0) / (2 * q)
    c = np.cos(w0)
    if kind == 'lp':
        b = [(1 - c) / 2, 1 - c, (1 - c) / 2]
    elif kind == 'hp':
        b = [(1 + c) / 2, -(1 + c), (1 + c) / 2]
    else:  # bp (guadagno 0 dB al picco)
        b = [al, 0, -al]
    a = [1 + al, -2 * c, 1 - al]
    b = np.array(b) / a[0]
    a = np.array(a) / a[0]
    y = np.zeros_like(x)
    x1 = x2 = y1 = y2 = 0.0
    for i, v in enumerate(x):
        o = b[0] * v + b[1] * x1 + b[2] * x2 - a[1] * y1 - a[2] * y2
        x2, x1, y2, y1 = x1, v, y1, o
        y[i] = o
    return y


def sweep_filter(x, kind, f0, f1, q=1.0, steps=48):
    """Filtro che si sposta da f0 a f1 (a blocchi, abbastanza fine per effetti brevi)."""
    out = np.zeros_like(x)
    n = len(x)
    edges = np.linspace(0, n, steps + 1).astype(int)
    for k in range(steps):
        f = f0 * (f1 / f0) ** (k / max(1, steps - 1))
        a, b = max(0, edges[k] - 256), edges[k + 1]
        y = biquad(x[a:b], kind, f, q)
        out[edges[k]:b] = y[edges[k] - a:]
    return out


def place(dst, src, at):
    i = int(at * SR)
    j = min(len(dst), i + len(src))
    dst[i:j] += src[:j - i]
    return dst


_IR = None


def reverb(x, wet=0.18, size=0.5):
    """Piccola stanza: risposta impulsiva sintetica (rumore che decade, scurito)."""
    global _IR
    if _IR is None or len(_IR) != int(size * SR):
        ir = noise(size) * np.exp(-6 * t_(size) / size)
        ir = biquad(ir, 'lp', 5000)
        _IR = ir / np.sqrt((ir ** 2).sum())
    y = np.convolve(np.concatenate([x, np.zeros(len(_IR))]), _IR)[:len(x) + len(_IR)]
    dry = np.concatenate([x, np.zeros(len(_IR))])
    return dry * (1 - wet) + y * wet


# ------------------------------------------------------------------ effetti con strumenti campionati
def sf_render(name, notes, program, bank=0, drum=False, gain=0.7, tail=1.2, bend=None):
    """notes: [(inizio_s, nota_midi, velocity, durata_s)]"""
    mid = mido.MidiFile(ticks_per_beat=480)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage('set_tempo', tempo=500000))  # 1 battito = 0.5 s -> 960 tick/s
    ch = 9 if drum else 0
    ev = []
    if not drum:
        ev.append((0, mido.Message('program_change', channel=ch, program=program)))
    ev.append((0, mido.Message('control_change', channel=ch, control=91, value=50)))
    for st, nt, vel, du in notes:
        ev.append((st, mido.Message('note_on', channel=ch, note=nt, velocity=vel)))
        ev.append((st + du, mido.Message('note_off', channel=ch, note=nt, velocity=0)))
    end = max(s + d for s, _, _, d in notes) + tail
    ev.append((end, mido.MetaMessage('end_of_track')))
    ev.sort(key=lambda e: e[0])
    last = 0
    for t, m in ev:
        tick = int(round(t * 960))
        m.time = tick - last
        last = tick
        tr.append(m)
    p = os.path.join(TMP, name + '.mid')
    mid.save(p)
    w = os.path.join(TMP, name + '_sf.wav')
    subprocess.run(['fluidsynth', '-ni', '-q', '-r', str(SR), '-g', str(gain), '-o', 'synth.reverb.level=0.5',
                    '-o', 'synth.reverb.room-size=0.4', '-F', w, SF2, p], check=True, capture_output=True)
    with wave.open(w) as f:
        d = np.frombuffer(f.readframes(f.getnframes()), dtype=np.int16).reshape(-1, 2).astype(float) / 32768
    return d.mean(1)


def M(s):
    names = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}
    return names[s[:-1]] + (int(s[-1]) + 1) * 12


GM = dict(celesta=8, glock=9, musicbox=10, vibes=11, marimba=12, kalimba=108, tinkle=112, harp=46, pizz=45, flute=73, crystal=98, piano=0)


def sfx_musical():
    out = {}
    # campanello del negozio quando entra il cliente (scampanellio)
    bell = [(i * 0.055, M(n), 92 - i * 4, 0.3) for i, n in enumerate(['E6', 'C6', 'E6', 'C6', 'E6', 'C6', 'G6'])]
    out['hello'] = sf_render('hello', bell, GM['tinkle'], tail=1.0)
    # ding del forno: campanella brillante + vibrafono sotto
    a = sf_render('ding_a', [(0, M('A6'), 110, 1.4)], GM['tinkle'], tail=1.4)
    b = sf_render('ding_b', [(0, M('A5'), 90, 1.4), (0, M('E6'), 70, 1.4)], GM['vibes'], tail=1.4)
    out['ding'] = mix(a, 0.8 * b)
    # magia: glissando d'arpa (pentatonica di Fa) + celesta che brilla
    pent = ['F4', 'G4', 'A4', 'C5', 'D5', 'F5', 'G5', 'A5', 'C6', 'D6', 'F6']
    harp = sf_render('magic_h', [(i * 0.045, M(n), 70 + i * 3, 0.8) for i, n in enumerate(pent)], GM['harp'], tail=1.2)
    cel = sf_render('magic_c', [(0.35 + i * 0.07, M(n), 80, 0.5) for i, n in enumerate(['C7', 'A6', 'F6', 'C7'])], GM['celesta'], tail=1.2)
    out['magic'] = mix(harp, 0.7 * cel)
    # impasto liscio: arpeggio di celesta
    out['smooth'] = sf_render('smooth', [(i * 0.085, M(n), 90, 0.5) for i, n in enumerate(['C6', 'E6', 'G6', 'C7'])], GM['celesta'], tail=1.0)
    # passo completato: "ta-da" con pizzicato, celesta e flauto
    p1 = sf_render('fan_p', [(0, M('C4'), 100, 0.3), (0, M('G4'), 90, 0.3), (0.16, M('C4'), 100, 0.3), (0.16, M('E4'), 90, 0.3), (0.32, M('F4'), 105, 0.6), (0.32, M('A4'), 95, 0.6), (0.32, M('C5'), 95, 0.6)], GM['pizz'], tail=0.8)
    c1 = sf_render('fan_c', [(0, M('G5'), 90, 0.2), (0.16, M('C6'), 90, 0.2), (0.32, M('F6'), 100, 0.7)], GM['celesta'], tail=0.9)
    f1 = sf_render('fan_f', [(0.32, M('A5'), 80, 0.55)], GM['flute'], tail=0.6)
    out['fanfare'] = mix(p1, 0.9 * c1, 0.6 * f1)
    # cliente contento: "da-da-daaa!" (marimba + celesta)
    m1 = sf_render('yum_m', [(0, M('C5'), 100, 0.15), (0.12, M('E5'), 100, 0.15), (0.24, M('G5'), 110, 0.4), (0.24, M('C6'), 90, 0.4)], GM['marimba'], tail=0.8)
    c2 = sf_render('yum_c', [(0.24, M('G6'), 70, 0.4), (0.36, M('C7'), 60, 0.4)], GM['celesta'], tail=0.8)
    out['yum'] = mix(m1, 0.7 * c2)
    # freddo del freezer: cristalli
    out['freeze'] = mix(sf_render('frz', [(i * 0.06, M(n), 60, 0.6) for i, n in enumerate(['E7', 'B6', 'G#6', 'E7', 'B6'])], GM['celesta'], tail=1.0),
                        0.6 * sf_render('frz2', [(0, M('E6'), 60, 0.8)], GM['crystal'], tail=1.0))
    # prendere un oggetto / rimetterlo a posto / "non ancora"
    out['pick'] = sf_render('pick', [(0, M('E6'), 80, 0.12)], GM['kalimba'], tail=0.4)
    out['back'] = sf_render('back', [(0, M('G5'), 70, 0.12), (0.09, M('D5'), 70, 0.2)], GM['kalimba'], tail=0.5)
    out['nope'] = sf_render('nope', [(0, M('A4'), 85, 0.14), (0.13, M('F4'), 85, 0.25)], GM['marimba'], tail=0.5)
    # decorazione appoggiata: marimba alta + scintilla
    out['topping'] = mix(sf_render('top', [(0, M('C7'), 80, 0.1)], GM['marimba'], tail=0.4), 0.4 * sf_render('top2', [(0.03, M('G7'), 60, 0.2)], GM['celesta'], tail=0.4))
    # timer del forno: tic (blocco di legno, piano)
    out['tick'] = sf_render('tick', [(0, 76, 45, 0.05)], 0, drum=True, tail=0.15)
    return out


def mix(*xs):
    n = max(len(x) for x in xs)
    y = np.zeros(n)
    for x in xs:
        y[:len(x)] += x
    return y


# ------------------------------------------------------------------ effetti fisici (sintesi offline)
def sfx_physical():
    out = {}
    # plop: l'ingrediente cade nell'impasto. Tonfo morbido + bolla che sale + schizzetto
    thud = np.sin(2 * np.pi * np.cumsum(np.linspace(150, 70, int(0.18 * SR))) / SR) * env(int(0.18 * SR), 0.003, 0.12)
    bub = sweep_sine(260, 900, 0.09) * env(int(0.09 * SR), 0.004, 0.06, 3)
    bub2 = sweep_sine(420, 1300, 0.06) * env(int(0.06 * SR), 0.003, 0.04, 3)
    splash = sweep_filter(noise(0.22), 'bp', 2600, 900, 1.2) * env(int(0.22 * SR), 0.002, 0.12)
    y = np.zeros(int(0.5 * SR))
    place(y, 0.9 * thud, 0.0); place(y, 0.55 * bub, 0.035); place(y, 0.35 * bub2, 0.1); place(y, 0.25 * splash, 0.01)
    out['plop'] = reverb(y, 0.14)
    # frusta nell'impasto: fruscio bagnato + tintinnio dei fili
    sw = sweep_filter(noise(0.32), 'bp', 700, 1800, 1.4) * np.sin(np.pi * t_(0.32) / 0.32) ** 1.5
    squish = sweep_filter(noise(0.32), 'lp', 500, 900, 2.5) * np.sin(np.pi * t_(0.32) / 0.32) ** 2
    ting = np.zeros(int(0.32 * SR))
    for at, f in [(0.05, 5200), (0.17, 6100), (0.26, 4700)]:
        place(ting, np.sin(2 * np.pi * f * t_(0.06)) * env(int(0.06 * SR), 0.001, 0.03), at)
    out['stir'] = reverb(0.55 * sw + 0.5 * squish + 0.12 * ting, 0.1)
    # glassa dal sac à poche: "sciuff" cremoso con risonanza che oscilla
    n_ = noise(0.5)
    wob = 900 + 450 * np.sin(2 * np.pi * 7 * t_(0.5))
    cream = np.zeros_like(n_)
    for k in range(25):
        a, b = int(k * len(n_) / 25), int((k + 1) * len(n_) / 25)
        cream[a:b] = biquad(n_[max(0, a - 200):b], 'bp', float(wob[a]), 3.0)[a - max(0, a - 200):]
    shape = np.minimum(1, t_(0.5) / 0.05) * np.exp(-1.6 * t_(0.5)) * (1 - t_(0.5) / 0.5) ** 1.5
    low = biquad(noise(0.5), 'lp', 300) * shape
    out['squeeze'] = reverb(0.9 * cream * shape + 0.6 * low, 0.12)
    # morso croccante: scricchiolio (tanti clic) + "nom" (bocca che si chiude), due masticate
    def crunch(dur, dens):
        c = np.zeros(int(dur * SR))
        for _ in range(int(dens * dur)):
            at = rng.uniform(0, dur * 0.85)
            click = biquad(noise(0.006), 'bp', rng.uniform(1800, 5500), 2) * env(int(0.006 * SR), 0.0005, 0.004)
            place(c, click * rng.uniform(0.4, 1), at)
        return c * np.exp(-3 * t_(dur) / dur)
    nom = np.sin(2 * np.pi * np.cumsum(np.linspace(190, 110, int(0.12 * SR))) / SR) * env(int(0.12 * SR), 0.004, 0.08)
    y = np.zeros(int(0.55 * SR))
    place(y, 1.0 * crunch(0.16, 900), 0.0); place(y, 0.7 * nom, 0.02)
    place(y, 0.55 * crunch(0.12, 600), 0.24); place(y, 0.45 * nom, 0.25)
    out['chomp'] = reverb(y, 0.08)
    # bollicine in cottura
    y = np.zeros(int(0.45 * SR))
    for at in [0.0, 0.09, 0.15, 0.27, 0.33]:
        f = rng.uniform(300, 600)
        place(y, rng.uniform(0.4, 0.8) * sweep_sine(f, f * 2.6, 0.05) * env(int(0.05 * SR), 0.003, 0.035, 3), at)
    out['bubble'] = reverb(y, 0.15)
    # sportello: aprire (scatto + aria) e chiudere (tonfo + scatto)
    click = biquad(noise(0.012), 'bp', 3200, 4) * env(int(0.012 * SR), 0.0005, 0.008)
    air = sweep_filter(noise(0.35), 'bp', 400, 1600, 0.8) * np.sin(np.pi * t_(0.35) / 0.35) ** 2
    y = np.zeros(int(0.45 * SR)); place(y, 0.8 * click, 0); place(y, 0.35 * air, 0.03)
    out['doorOpen'] = reverb(y, 0.12)
    thunk = np.sin(2 * np.pi * np.cumsum(np.linspace(130, 80, int(0.2 * SR))) / SR) * env(int(0.2 * SR), 0.002, 0.12)
    body = biquad(noise(0.2), 'lp', 600) * env(int(0.2 * SR), 0.002, 0.06)
    y = np.zeros(int(0.4 * SR)); place(y, 0.9 * thunk + 0.5 * body, 0); place(y, 0.6 * click, 0.05)
    out['doorClose'] = reverb(y, 0.12)
    # fruscio di passaggio (oggetti che scivolano via)
    out['whoosh'] = reverb(sweep_filter(noise(0.4), 'bp', 300, 2200, 0.9) * np.sin(np.pi * t_(0.4) / 0.4) ** 2, 0.1)
    return out


MAXLEN = dict(magic=2.6, ding=2.4, freeze=2.0, fanfare=2.0, yum=1.8, smooth=1.6, hello=1.6, pick=0.45, back=0.6, nope=0.7, topping=0.6, tick=0.2)


def finish(x, peak=0.8, name=''):
    x = np.asarray(x, dtype=float)
    # taglia il silenzio iniziale e finale (sotto -48 dB), lunghezza massima e dissolvenza in uscita
    thr = 10 ** (-48 / 20) * np.max(np.abs(x))
    idx = np.where(np.abs(x) > thr)[0]
    if len(idx):
        x = x[max(0, idx[0] - 30):idx[-1] + 1]
    x = x[:int(MAXLEN.get(name, 2.0) * SR)].copy()
    f = min(len(x), int(0.25 * SR) if len(x) > SR else int(0.04 * SR))
    x[-f:] *= np.linspace(1, 0, f) ** 2
    return x * (peak / (np.max(np.abs(x)) or 1))


def write(name, x):
    w = os.path.join(TMP, name + '.wav')
    with wave.open(w, 'wb') as f:
        f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR)
        f.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', w, '-c:a', 'libmp3lame', '-b:a', '96k', os.path.join(OUT, f'sfx_{name}.mp3')], check=True)


if __name__ == '__main__':
    os.makedirs(TMP, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)
    allfx = {**sfx_musical(), **sfx_physical()}
    for k, v in allfx.items():
        y = finish(v, name=k)
        write(k, y)
        print(f'{k:10s} {len(y) / SR:.2f} s')
