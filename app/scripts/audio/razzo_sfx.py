"""
Razzo tra le Stelle — effetti sonori.

- Effetti "musicali" (stella presa, stellona, nuovo pianeta, nuovo razzo, bandierina, scelta del razzo, risatina del
  pianeta, scintille) suonati con strumenti campionati (MuseScore General, MIT) tramite FluidSynth: vibrafono, celesta,
  glockenspiel, arpa, archi, basso fretless, ottavino, kit di spazzole. Le stelle prese di fila salgono sulla scala
  (il gioco cambia la velocità di lettura del file).
- Effetti "fisici" (rimbalzo sull'asteroide di gomma, spinta del motore, decollo, atterraggio, sfrecciata, fruscio)
  costruiti con sintesi offline (numpy), con un pizzico di strumenti veri dove aiuta (marimba nel rimbalzo).

Uso (dalla cartella app/):  python3 scripts/audio/razzo_sfx.py
Scrive src/games/razzo/audio/sfx_<nome>.mp3
"""
import os, subprocess, wave
import numpy as np
import mido

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, '..', '..', 'src', 'games', 'razzo', 'audio'))
TMP = '/tmp/razzo-audio/sfx'
SF2 = os.environ.get('SF2', '/usr/share/sounds/sf2/MuseScore_General_Full.sf2')
SR = 44100
rng = np.random.default_rng(55)


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
def sf_render(name, notes, program, drum=False, gain=0.7, tail=1.0, bends=None, bend_range=12, reverb=50):
    """Con drum=True `program` sceglie il kit di batteria (0 Standard, 40 Brush)."""
    """notes: [(inizio_s, nota_midi, velocity, durata_s)]; bends: [(tempo_s, semitoni)] glissando (pitch bend)."""
    mid = mido.MidiFile(ticks_per_beat=480)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage('set_tempo', tempo=500000))  # 960 tick/s
    ch = 9 if drum else 0
    ev = []
    ev.append((0, mido.Message('program_change', channel=ch, program=program)))
    if not drum:
        # sensibilità del pitch bend (RPN 0)
        for c, v in ((101, 0), (100, 0), (6, bend_range), (38, 0)):
            ev.append((0, mido.Message('control_change', channel=ch, control=c, value=v)))
    ev.append((0, mido.Message('control_change', channel=ch, control=91, value=reverb)))
    for st, nt, vel, du in notes:
        ev.append((st, mido.Message('note_on', channel=ch, note=nt, velocity=vel)))
        ev.append((st + du, mido.Message('note_off', channel=ch, note=nt, velocity=0)))
    for t, semi in (bends or []):
        val = int(max(-8192, min(8191, semi / bend_range * 8191)))
        ev.append((t, mido.Message('pitchwheel', channel=ch, pitch=val)))
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
    subprocess.run(['fluidsynth', '-ni', '-q', '-r', str(SR), '-g', str(gain), '-o', 'synth.reverb.level=0.45',
                    '-o', 'synth.reverb.room-size=0.4', '-F', w, SF2, p], check=True, capture_output=True)
    with wave.open(w) as f:
        d = np.frombuffer(f.readframes(f.getnframes()), dtype=np.int16).reshape(-1, 2).astype(float) / 32768
    return d.mean(1)


def M(s):
    names = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}
    return names[s[:-1]] + (int(s[-1]) + 1) * 12


GM = dict(celesta=8, glock=9, vibes=11, marimba=12, harp=46, strings=48, slow=49, fretless=35, piccolo=72, flute=73,
          ocarina=79, pizz=45, brass=61)
BRUSH = 40


def mix(*xs):
    n = max(len(x) for x in xs)
    y = np.zeros(n)
    for x in xs:
        y[:len(x)] += x
    return y


def bend_curve(points, step=0.01):
    """[(t, semitoni)] -> pitch bend fitto (glissando morbido)."""
    out = []
    for (t0, s0), (t1, s1) in zip(points, points[1:]):
        k = max(1, int((t1 - t0) / step))
        for i in range(k):
            u = i / k
            u = u * u * (3 - 2 * u)
            out.append((t0 + (t1 - t0) * i / k, s0 + (s1 - s0) * u))
    out.append(points[-1])
    return out


def sfx_musical():
    out = {}
    # stella presa: vibrafono + celesta all'ottava (La); il gioco la alza a ogni stella presa di fila
    v = sf_render('star_v', [(0, M('A4'), 104, 0.4)], GM['vibes'], tail=0.8, reverb=70)
    c = sf_render('star_c', [(0, M('A5'), 80, 0.3)], GM['celesta'], tail=0.8, reverb=70)
    out['star'] = mix(v, 0.7 * c)
    # stellona: arpeggio di celesta e glockenspiel su un accordo di vibrafono
    c = sf_render('big_c', [(i * 0.055, M(x), 90, 0.5) for i, x in enumerate(['D6', 'F#6', 'A6', 'C#7', 'E7'])], GM['celesta'], tail=1.2, reverb=80)
    g = sf_render('big_g', [(0.25, M('A6'), 80, 0.9), (0.25, M('D7'), 76, 0.9)], GM['glock'], tail=1.2, reverb=80)
    vb = sf_render('big_v', [(0, M(x), 90, 0.9) for x in ['D5', 'F#5', 'A5', 'E6']], GM['vibes'], tail=1.2, reverb=80)
    out['bigstar'] = mix(c, 0.6 * g, 0.7 * vb)
    # nuovo pianeta: "ta-da-da-DAAA" di vibrafono, archi, basso fretless e piatto alle spazzole
    seq = [(0, 'A4'), (0.16, 'D5'), (0.32, 'F#5')]
    vb = sf_render('fan_v', [(t, M(x), 100, 0.18) for t, x in seq] + [(0.5, M(x), 112, 1.2) for x in ['A5', 'D6', 'F#6']], GM['vibes'], tail=1.4, reverb=80)
    st = sf_render('fan_s', [(0.5, M(x), 96, 1.1) for x in ['D4', 'F#4', 'A4', 'C#5']], GM['strings'], tail=1.2, reverb=80)
    bs = sf_render('fan_b', [(0, M('A1'), 90, 0.3), (0.5, M('D2'), 110, 1.0)], GM['fretless'], tail=0.8)
    dr = sf_render('fan_d', [(0.5, 49, 90, 1.0), (0.5, 36, 90, 0.2), (0.32, 38, 80, 0.1), (0.4, 38, 90, 0.1)], BRUSH, drum=True, tail=1.2)
    out['fanfare'] = mix(vb, 0.45 * st, 1.4 * bs, 0.3 * dr)
    # nuovo razzo: scala di celesta che sale, glissando d'arpa e campanelli
    pent = ['D5', 'E5', 'F#5', 'A5', 'B5', 'D6', 'E6', 'F#6', 'A6', 'B6', 'D7']
    h = sf_render('nr_h', [(i * 0.04, M(x), 70 + i * 3, 0.8) for i, x in enumerate(pent)], GM['harp'], tail=1.2, reverb=80)
    c = sf_render('nr_c', [(0.1 + i * 0.07, M(x), 80, 0.4) for i, x in enumerate(['A5', 'D6', 'F#6', 'A6', 'D7'])], GM['celesta'], tail=1.2, reverb=80)
    g = sf_render('nr_g', [(0.5, M('F#7'), 70, 0.8), (0.5, M('D7'), 70, 0.8)], GM['glock'], tail=1.2, reverb=80)
    out['newrocket'] = mix(h, c, 0.6 * g)
    # bandierina: "plop" di marimba e due campanelli
    m = sf_render('fl_m', [(0, M('D4'), 100, 0.2)], GM['marimba'], tail=0.6)
    g = sf_render('fl_g', [(0.1, M('A6'), 80, 0.5), (0.22, M('D7'), 86, 0.6)], GM['glock'], tail=1.0, reverb=70)
    out['flag'] = mix(m, 0.7 * g)
    # scelta del razzo: "din-don" di vibrafono che sale, con la celesta
    v = sf_render('se_v', [(0, M('D5'), 96, 0.3), (0.13, M('A5'), 104, 0.6)], GM['vibes'], tail=0.9, reverb=70)
    c = sf_render('se_c', [(0.13, M('A6'), 70, 0.4)], GM['celesta'], tail=0.9, reverb=70)
    out['select'] = mix(v, 0.6 * c)
    # risatina del pianeta: "i-hi-hi" di ottavino con piccoli scivolamenti
    notes = [(0, M('E6'), 92, 0.09), (0.12, M('D6'), 88, 0.09), (0.24, M('B5'), 84, 0.09), (0.36, M('A5'), 80, 0.14)]
    bends = []
    for st_, *_ in notes:
        bends += bend_curve([(st_, 1.5), (st_ + 0.07, -0.5)], step=0.008)
    out['giggle'] = mix(sf_render('gg', notes, GM['piccolo'], bends=bends, tail=0.5, reverb=50),
                        0.4 * sf_render('gg2', [(t, n - 12, 70, d) for t, n, _, d in notes], GM['ocarina'], tail=0.5, reverb=40))
    # scintilla (tocco sul cielo): due note di celesta
    hi = ['E7', 'B6']
    out['twinkle'] = sf_render('tw', [(0, M(hi[0]), 70, 0.2), (0.08, M(hi[1]), 60, 0.3)], GM['celesta'], tail=0.8, reverb=90)
    return out


# ------------------------------------------------------------------ effetti fisici (sintesi offline)
def sfx_physical():
    out = {}
    # rimbalzo sull'asteroide di gomma: "boing" con vibrato che si spegne, più il "toc" morbido di una marimba grave
    d = 0.7
    x = t_(d)
    f = 150 * (1 + 0.55 * np.exp(-x * 7)) * (1 + 0.16 * np.sin(2 * np.pi * (9 + 6 * x) * x) * np.exp(-x * 2.5))
    ph = 2 * np.pi * np.cumsum(f) / SR
    tone = (np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.12 * np.sin(3 * ph)) * env(len(x), 0.004, 0.55, 3.0)
    thump = np.sin(2 * np.pi * np.cumsum(np.linspace(220, 90, int(0.12 * SR))) / SR) * env(int(0.12 * SR), 0.002, 0.08)
    mar = sf_render('bo_m', [(0, M('G3'), 100, 0.2)], GM['marimba'], tail=0.4, reverb=30)
    out['boing'] = reverb(mix(0.8 * tone, 0.6 * thump, 0.5 * mar), 0.12)
    # spinta del motore: soffio che sale (rumore filtrato)
    d = 0.45
    puff = sweep_filter(noise(d), 'bp', 500, 1800, 0.9) * np.sin(np.pi * t_(d) / d) ** 1.5
    out['lift'] = reverb(puff, 0.15)
    # decollo: rombo morbido che cresce e soffio che sale, con un glissando d'arpa
    d = 1.4
    rumble = biquad(noise(d), 'lp', 180) * np.minimum(1, t_(d) / 0.15) * np.exp(-1.8 * t_(d))
    rush = sweep_filter(noise(d), 'bp', 300, 2600, 0.8) * np.sin(np.pi * t_(d) / d) ** 2
    harp = sf_render('la_h', [(0.15 + i * 0.05, M(x), 64 + i * 3, 0.6) for i, x in enumerate(['D4', 'F#4', 'A4', 'D5', 'F#5', 'A5', 'D6'])], GM['harp'], tail=0.8, reverb=70)
    out['launch'] = mix(reverb(1.2 * rumble + 0.9 * rush, 0.2), 0.5 * harp)
    # atterraggio: tonfo morbido e sbuffo di polvere
    d = 0.6
    th = np.sin(2 * np.pi * np.cumsum(np.linspace(120, 50, int(0.35 * SR))) / SR) * env(int(0.35 * SR), 0.003, 0.25)
    puff = sweep_filter(noise(d), 'lp', 2600, 300, 0.8) * np.minimum(1, t_(d) / 0.01) * np.exp(-6 * t_(d))
    out['land'] = reverb(mix(th, 0.6 * puff), 0.16)
    # sfrecciata del razzo (menu): passaggio con effetto Doppler
    d = 0.8
    x = t_(d)
    pan = np.exp(-((x - 0.35) / 0.16) ** 2)
    zoom = sweep_filter(noise(d), 'bp', 2400, 500, 1.2) * (0.25 + pan)
    hum = np.sin(2 * np.pi * np.cumsum(260 * (1.25 - 0.5 * (x / d))) / SR) * pan * 0.25
    out['zoom'] = reverb(zoom + hum, 0.15)
    # fruscio di passaggio (razzo che si raddrizza, transizioni)
    out['whoosh'] = reverb(sweep_filter(noise(0.5), 'bp', 300, 1800, 0.9) * np.sin(np.pi * t_(0.5) / 0.5) ** 2, 0.15)
    return out


MAXLEN = dict(star=0.9, bigstar=1.8, fanfare=2.2, newrocket=2.0, flag=1.2, select=1.0, giggle=0.9, twinkle=0.9,
              boing=0.8, lift=0.5, launch=1.8, land=0.8, zoom=0.9, whoosh=0.6)


def finish(x, peak=0.8, name=''):
    x = np.asarray(x, dtype=float)
    # taglia il silenzio iniziale e finale (sotto -48 dB), lunghezza massima e dissolvenza in uscita
    thr = 10 ** (-48 / 20) * np.max(np.abs(x))
    idx = np.where(np.abs(x) > thr)[0]
    if len(idx):
        x = x[max(0, idx[0] - 30):idx[-1] + 1]
    x = x[:int(MAXLEN.get(name, 2.0) * SR)].copy()
    f = min(len(x), int(0.25 * SR) if len(x) > SR else int(0.05 * SR))
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
