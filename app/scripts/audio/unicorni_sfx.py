"""
Salone degli Unicorni — effetti sonori.

- Effetti "musicali" suonati con strumenti campionati (MuseScore General, MIT) tramite FluidSynth: il nitrito magico
  dell'unicorno (flauto e ottavino con glissando a "risatina", più un velo d'arpa), saltello (pizzicato che rimbalza),
  scintille sul manto pulito (celesta e glockenspiel), tocco sul barattolo (celesta), pennello magico (carillon),
  magia del colore (glissando d'arpa e celesta), accessorio messo (carillon e glockenspiel; il gioco alza il tono
  a ogni accessorio), tappa completata, festa della sorpresa (flauto, celesta, arpa, pizzicati).
- Effetti "fisici" costruiti con sintesi offline (numpy): spugna che fa schiuma, bollicine, acqua della doccetta,
  scrollata, spazzola sulla criniera, scatto della macchina fotografica, fruscio.

Uso (dalla cartella app/):  python3 scripts/audio/unicorni_sfx.py
Scrive src/games/unicorni/audio/sfx_<nome>.mp3
"""
import os, subprocess, wave
import numpy as np
import mido

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, '..', '..', 'src', 'games', 'unicorni', 'audio'))
TMP = '/tmp/unicorni-audio/sfx'
SF2 = os.environ.get('SF2', '/usr/share/sounds/sf2/MuseScore_General_Full.sf2')
SR = 44100
rng = np.random.default_rng(44)


# ------------------------------------------------------------------ utilità DSP
def t_(dur):
    return np.arange(int(dur * SR)) / SR


def env(n, a=0.005, d=0.2, curve=4.0):
    """Attacco lineare + decadimento esponenziale."""
    x = np.arange(n) / SR
    return np.minimum(1, x / max(a, 1e-4)) * np.exp(-curve * np.maximum(0, x - a) / max(d, 1e-4))


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
    """Filtro che si sposta da f0 a f1 (a blocchi)."""
    out = np.zeros_like(x)
    nn = len(x)
    edges = np.linspace(0, nn, steps + 1).astype(int)
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


def reverb(x, wet=0.18, size=0.6):
    """Piccola sala morbida: risposta impulsiva sintetica (rumore che decade, scurito)."""
    global _IR
    if _IR is None or len(_IR) != int(size * SR):
        ir = noise(size) * np.exp(-6 * t_(size) / size)
        ir = biquad(ir, 'lp', 6000)
        _IR = ir / np.sqrt((ir ** 2).sum())
    y = np.convolve(np.concatenate([x, np.zeros(len(_IR))]), _IR)[:len(x) + len(_IR)]
    dry = np.concatenate([x, np.zeros(len(_IR))])
    return dry * (1 - wet) + y * wet


def mix(*xs):
    nn = max(len(x) for x in xs)
    y = np.zeros(nn)
    for x in xs:
        y[:len(x)] += x
    return y


# ------------------------------------------------------------------ effetti con strumenti campionati
def sf_render(name, notes, program, drum=False, gain=0.7, tail=1.0, bends=None, bend_range=12, rev=60):
    """notes: [(inizio_s, nota_midi, velocity, durata_s)]; bends: [(tempo_s, semitoni)] glissando (pitch bend)."""
    mid = mido.MidiFile(ticks_per_beat=480)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage('set_tempo', tempo=500000))  # 960 tick/s
    ch = 9 if drum else 0
    ev = []
    if not drum:
        ev.append((0, mido.Message('program_change', channel=ch, program=program)))
        for c, v in ((101, 0), (100, 0), (6, bend_range), (38, 0)):
            ev.append((0, mido.Message('control_change', channel=ch, control=c, value=v)))
    ev.append((0, mido.Message('control_change', channel=ch, control=91, value=rev)))
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
    subprocess.run(['fluidsynth', '-ni', '-q', '-r', str(SR), '-g', str(gain), '-o', 'synth.reverb.level=0.5',
                    '-o', 'synth.reverb.room-size=0.55', '-F', w, SF2, p], check=True, capture_output=True)
    with wave.open(w) as f:
        d = np.frombuffer(f.readframes(f.getnframes()), dtype=np.int16).reshape(-1, 2).astype(float) / 32768
    return d.mean(1)


def M(s):
    names = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'Bb': 10, 'B': 11}
    return names[s[:-1]] + (int(s[-1]) + 1) * 12


GM = dict(celesta=8, glock=9, musicbox=10, harp=46, pizz=45, flute=73, piccolo=72, panflute=75, kalimba=108)


def bend_curve(points, step=0.008):
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


def whinny(dur=0.9, top=3.0, bottom=-9.0, rate=11.0, depth=1.6):
    """Il "nitrito" dell'unicorno: discesa con un trillo che rallenta (una risatina), mai acuto e stridulo."""
    pts = []
    k = 0
    steps = int(dur / 0.006)
    for i in range(steps + 1):
        t = i * dur / steps
        u = t / dur
        base = top + (bottom - top) * (u ** 1.3)
        wob = depth * (1 - 0.5 * u) * np.sin(2 * np.pi * rate * (1 - 0.35 * u) * t)
        pts.append((t, base + wob))
        k += 1
    return [(0, top - 2), (0.05, top)] + [(t + 0.05, s) for t, s in pts]


def sfx_musical():
    out = {}
    # nitrito magico: flauto + ottavino un'ottava sopra con lo stesso glissando, velo d'arpa e una scintilla di celesta
    b = whinny()
    fl = sf_render('neigh_f', [(0, M('E6'), 104, 0.95)], GM['flute'], bends=b, tail=0.5)
    pc = sf_render('neigh_p', [(0, M('E6'), 70, 0.95)], GM['panflute'], bends=b, tail=0.5)
    hp = sf_render('neigh_h', [(0.02 + i * 0.04, M(x), 60, 0.6) for i, x in enumerate(['C6', 'A5', 'F5', 'C5'])], GM['harp'], tail=0.8)
    ce = sf_render('neigh_c', [(0, M('C7'), 70, 0.3), (0.08, M('A6'), 60, 0.3)], GM['celesta'], tail=0.6)
    out['neigh'] = mix(fl, 0.5 * pc, 0.45 * hp, 0.35 * ce)
    # saltello: pizzicato che rimbalza verso l'alto
    out['hop'] = sf_render('hop', [(0, M('C5'), 96, 0.3)], GM['pizz'], bends=bend_curve([(0, 0), (0.12, 7), (0.25, 12)]), tail=0.3)
    # manto pulito che brilla: celesta e glockenspiel in salita (Fa pentatonico)
    pent = ['F6', 'G6', 'A6', 'C7', 'D7', 'F7']
    c = sf_render('shine_c', [(i * 0.055, M(x), 80 + i * 4, 0.4) for i, x in enumerate(pent)], GM['celesta'], tail=1.0)
    g = sf_render('shine_g', [(0.3, M('F7'), 64, 0.7), (0.3, M('C7'), 54, 0.7)], GM['glock'], tail=1.0)
    out['shine'] = mix(c, 0.6 * g)
    # tocco sul barattolo: "tin" di celesta
    out['pick'] = sf_render('pick', [(0, M('A6'), 90, 0.15), (0.06, M('E7'), 60, 0.15)], GM['celesta'], tail=0.5)
    # pennello magico che colora (si ripete mentre si strofina): carillon lieve
    out['paint'] = sf_render('paint', [(0, M('C7'), 54, 0.12), (0.05, M('G6'), 46, 0.12)], GM['musicbox'], tail=0.35)
    # magia del colore: glissando d'arpa e accordo di celesta
    up = ['F4', 'G4', 'A4', 'C5', 'D5', 'F5', 'G5', 'A5', 'C6', 'D6', 'F6']
    h = sf_render('mag_h', [(i * 0.045, M(x), 66 + i * 3, 0.9) for i, x in enumerate(up)], GM['harp'], tail=1.2)
    ce = sf_render('mag_c', [(0.5, M('F6'), 90, 0.7), (0.5, M('A6'), 80, 0.7), (0.5, M('C7'), 80, 0.7)], GM['celesta'], tail=1.2)
    out['magic'] = mix(h, 0.8 * ce)
    # accessorio messo: carillon con un tocco di glockenspiel (il gioco alza il tono a ogni accessorio)
    out['pop'] = mix(sf_render('pop_m', [(0, M('C6'), 96, 0.3)], GM['musicbox'], tail=0.6),
                     0.5 * sf_render('pop_g', [(0.01, M('C7'), 70, 0.25)], GM['glock'], tail=0.6))
    # tappa completata: "ding-ding" di celesta e arpa (Fa maggiore)
    out['step'] = mix(sf_render('step_c', [(0, M('C6'), 92, 0.3), (0.12, M('F6'), 100, 0.6)], GM['celesta'], tail=0.9),
                      0.6 * sf_render('step_h', [(0.12, M('F4'), 80, 0.8), (0.14, M('A4'), 76, 0.8), (0.16, M('C5'), 76, 0.8)], GM['harp'], tail=0.9))
    # festa della sorpresa: flauto, celesta, arpa e pizzicati
    fl = sf_render('fan_f', [(0, M('C5'), 96, 0.18), (0.16, M('F5'), 100, 0.18), (0.32, M('A5'), 104, 0.18), (0.48, M('C6'), 110, 0.7)], GM['flute'], tail=0.8)
    ce = sf_render('fan_c', [(0.48, M('F6'), 96, 0.8), (0.48, M('A6'), 86, 0.8), (0.48, M('C7'), 86, 0.8)], GM['celesta'], tail=1.0)
    hp = sf_render('fan_h', [(0.44 + i * 0.03, M(x), 80, 1.0) for i, x in enumerate(['F3', 'C4', 'F4', 'A4', 'C5', 'F5'])], GM['harp'], tail=1.0)
    pz = sf_render('fan_p', [(0, M('F3'), 90, 0.2), (0.16, M('C4'), 90, 0.2), (0.32, M('F4'), 90, 0.2), (0.48, M('F3'), 100, 0.4)], GM['pizz'], tail=0.6)
    out['fanfare'] = mix(fl, 0.8 * ce, 0.6 * hp, 0.6 * pz)
    return out


# ------------------------------------------------------------------ effetti fisici (sintesi offline)
def bubble(f0=600, dur=0.07):
    """Una bollicina: tono che sale veloce e si spegne (il "plop" di una bolla d'acqua)."""
    x = t_(dur)
    f = f0 * (1 + 2.2 * x / dur)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(x), 0.002, dur * 0.6)


def sfx_physical():
    out = {}
    # spugna: "squish" bagnato (rumore con filtro che scende) e qualche bollicina
    d = 0.28
    sq = sweep_filter(noise(d), 'bp', 1600, 500, 1.6) * np.sin(np.pi * t_(d) / d) ** 1.5
    y = 0.9 * sq
    for k in range(4):
        place(y, 0.35 * bubble(rng.uniform(700, 1400), 0.05), rng.uniform(0.02, 0.2))
    out['squish'] = reverb(y, 0.12)
    # bollicine che scoppiano
    y = np.zeros(int(0.35 * SR))
    for k in range(5):
        place(y, bubble(rng.uniform(900, 2000), rng.uniform(0.04, 0.07)) * rng.uniform(0.4, 1), rng.uniform(0, 0.25))
    out['bubble'] = reverb(y, 0.15)
    # doccetta: spruzzo (rumore acuto morbido) con gocce che cadono
    d = 0.42
    spray = biquad(biquad(noise(d), 'hp', 2200), 'lp', 7500) * np.sin(np.pi * t_(d) / d) ** 0.8
    y = 0.55 * spray
    for k in range(10):
        place(y, 0.3 * bubble(rng.uniform(1200, 2600), 0.03), rng.uniform(0, d - 0.05))
    out['water'] = reverb(y, 0.15)
    # scrollata: frullo veloce (rumore modulato) e gocce che volano
    d = 0.6
    am = 0.5 + 0.5 * np.sin(2 * np.pi * 14 * t_(d))
    flap = sweep_filter(noise(d), 'bp', 900, 1800, 0.8) * am * np.sin(np.pi * t_(d) / d)
    y = 0.8 * flap
    for k in range(12):
        place(y, 0.35 * bubble(rng.uniform(900, 2400), 0.035), rng.uniform(0.05, d - 0.05))
    out['shake'] = reverb(y, 0.12)
    # spazzola sulla criniera: setole morbide (rumore granuloso acuto, più leggero della terra)
    d = 0.22
    grain = (rng.uniform(0, 1, int(d * SR)) < 0.3).astype(float) * rng.uniform(-1, 1, int(d * SR))
    bristle = sweep_filter(grain, 'bp', 4200, 6000, 1.1)
    silk = sweep_filter(noise(d), 'bp', 2500, 3400, 0.9)
    out['brush'] = reverb((0.8 * bristle + 0.3 * silk) * np.sin(np.pi * t_(d) / d) ** 1.2, 0.08)
    # scatto della macchina fotografica: due clic e il piccolo ronzio di avanzamento
    click = lambda f: biquad(noise(0.015), 'bp', f, 3) * env(int(0.015 * SR), 0.0005, 0.01)
    whir = sweep_sine(900, 1300, 0.18) * 0.12 * np.sin(np.pi * t_(0.18) / 0.18)
    y = np.zeros(int(0.45 * SR))
    place(y, click(3800), 0); place(y, 0.8 * click(2500), 0.07); place(y, whir, 0.14)
    out['camera'] = reverb(y, 0.1)
    # fruscio di passaggio (attrezzi che entrano ed escono)
    out['whoosh'] = reverb(sweep_filter(noise(0.4), 'bp', 400, 2600, 0.9) * np.sin(np.pi * t_(0.4) / 0.4) ** 2, 0.1)
    return out


MAXLEN = dict(neigh=1.6, hop=0.7, shine=1.8, pick=0.6, paint=0.45, magic=2.2, pop=0.8, step=1.4, fanfare=2.2,
              squish=0.5, bubble=0.6, water=0.6, shake=0.9, brush=0.35, camera=0.6, whoosh=0.6)


def finish(x, peak=0.8, name=''):
    x = np.asarray(x, dtype=float)
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
        print(f'{k:8s} {len(y) / SR:.2f} s')
