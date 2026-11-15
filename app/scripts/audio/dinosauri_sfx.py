"""
Scavo dei Dinosauri — effetti sonori.

- Effetti "musicali" (osso trovato, tesoro, osso al suo posto, magia, festa, ruggiti simpatici, saltello) suonati
  con strumenti campionati (MuseScore General, MIT) tramite FluidSynth: marimba, xilofono, celesta, arpa, kalimba,
  fagotto, tuba, oboe, flauto, wood block. I ruggiti sono ottoni e fagotti con glissando (pitch bend) più un
  "brontolio" leggero; mai spaventosi.
- Effetti "fisici" (pennello sulla terra, terra che frana, nuvola di polvere, tonfo, scatto della macchina fotografica,
  fruscio) costruiti con sintesi offline (numpy).

Uso (dalla cartella app/):  python3 scripts/audio/dinosauri_sfx.py
Scrive src/games/dinosauri/audio/sfx_<nome>.mp3
"""
import os, subprocess, wave
import numpy as np
import mido

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, '..', '..', 'src', 'games', 'dinosauri', 'audio'))
TMP = '/tmp/dinosauri-audio/sfx'
SF2 = os.environ.get('SF2', '/usr/share/sounds/sf2/MuseScore_General_Full.sf2')
SR = 44100
rng = np.random.default_rng(23)


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
    """notes: [(inizio_s, nota_midi, velocity, durata_s)]; bends: [(tempo_s, semitoni)] glissando (pitch bend)."""
    mid = mido.MidiFile(ticks_per_beat=480)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage('set_tempo', tempo=500000))  # 960 tick/s
    ch = 9 if drum else 0
    ev = []
    if not drum:
        ev.append((0, mido.Message('program_change', channel=ch, program=program)))
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


GM = dict(celesta=8, glock=9, marimba=12, xylo=13, kalimba=108, harp=46, pizz=45, bassoon=70, tuba=58, trombone=57,
          oboe=68, clarinet=71, flute=73, bari=67)


def mix(*xs):
    n = max(len(x) for x in xs)
    y = np.zeros(n)
    for x in xs:
        y[:len(x)] += x
    return y


def bend_curve(points, step=0.01):
    """[(t, semitoni)] -> pitch bend fitto (glissando morbido) con un vibrato leggero."""
    out = []
    for (t0, s0), (t1, s1) in zip(points, points[1:]):
        k = max(1, int((t1 - t0) / step))
        for i in range(k):
            u = i / k
            u = u * u * (3 - 2 * u)
            out.append((t0 + (t1 - t0) * i / k, s0 + (s1 - s0) * u))
    out.append(points[-1])
    return out


def growl(dur, f0=90, rate=26):
    """Brontolio morbido: rumore scuro modulato in ampiezza (le "fusa" del dinosauro)."""
    x = t_(dur)
    am = 0.55 + 0.45 * np.sin(2 * np.pi * rate * x)
    body = sweep_filter(noise(dur), 'lp', f0 * 6, f0 * 3, 0.9) * am
    sh = np.minimum(1, x / 0.06) * np.minimum(1, (dur - x) / 0.25)
    return body * sh


def roar(name, brass, wind, base, wind_base, shape, dur, growl_amt, growl_f):
    """Ruggito simpatico: ottone + legno con lo stesso glissando, più un po' di brontolio."""
    bends = bend_curve(shape)
    vib = [(t + 0.004, s + 0.35 * np.sin(2 * np.pi * 7 * t)) for t, s in bends if t > 0.15]
    b = sf_render(name + '_b', [(0, base, 112, dur)], GM[brass], bends=bends + vib, tail=0.5)
    w = sf_render(name + '_w', [(0, wind_base, 100, dur)], GM[wind], bends=bends + vib, tail=0.5)
    g = growl(dur + 0.1, growl_f)
    return mix(b, 0.75 * w, growl_amt * g)


def sfx_musical():
    out = {}
    # osso trovato: "ta-da" di marimba in Re, con il tok di un wood block e una scintilla di xilofono
    m = sf_render('found_m', [(i * 0.07, M(x), 100, 0.3) for i, x in enumerate(['D5', 'F#5', 'A5', 'D6'])], GM['marimba'], tail=0.8)
    wb = sf_render('found_w', [(0, 76, 100, 0.1)], 0, drum=True, tail=0.3)
    xy = sf_render('found_x', [(0.28, M('A6'), 70, 0.3), (0.34, M('D7'), 70, 0.3)], GM['xylo'], tail=0.6)
    out['found'] = mix(m, 0.6 * wb, 0.5 * xy)
    # tesoro: celesta e glockenspiel che brillano
    c = sf_render('tr_c', [(i * 0.06, M(x), 85, 0.5) for i, x in enumerate(['A5', 'D6', 'F#6', 'A6', 'D7'])], GM['celesta'], tail=1.0)
    g = sf_render('tr_g', [(0.3, M('D7'), 70, 0.8), (0.3, M('A6'), 60, 0.8)], GM['glock'], tail=1.0)
    out['treasure'] = mix(c, 0.6 * g)
    # prendere / riposare un osso
    out['pick'] = sf_render('pick', [(0, M('A5'), 85, 0.12)], GM['kalimba'], tail=0.4)
    out['back'] = sf_render('back', [(0, M('F5'), 75, 0.12), (0.09, M('C5'), 75, 0.2)], GM['kalimba'], tail=0.5)
    # osso al suo posto: clac di legno + nota di marimba (il gioco la alza a ogni pezzo)
    out['snap'] = mix(sf_render('snap_w', [(0, 77, 110, 0.1)], 0, drum=True, tail=0.3),
                      0.9 * sf_render('snap_m', [(0.01, M('D5'), 105, 0.3), (0.01, M('A5'), 70, 0.3)], GM['marimba'], tail=0.6))
    # lo scheletro prende vita: glissando d'arpa, celesta e rullata di xilofono
    pent = ['D4', 'E4', 'F#4', 'A4', 'B4', 'D5', 'E5', 'F#5', 'A5', 'B5', 'D6', 'E6']
    h = sf_render('mag_h', [(i * 0.05, M(x), 70 + i * 3, 0.9) for i, x in enumerate(pent)], GM['harp'], tail=1.2)
    x = sf_render('mag_x', [(0.2 + i * 0.045, M('A6' if i % 2 else 'D7'), 50 + i * 2, 0.08) for i in range(14)], GM['xylo'], tail=0.6)
    c = sf_render('mag_c', [(0.62, M('D7'), 90, 0.6), (0.62, M('A6'), 80, 0.6)], GM['celesta'], tail=1.2)
    out['magic'] = mix(h, 0.5 * x, 0.8 * c)
    # festa: accordo di Re con marimba, pizzicati e fagotto
    p = sf_render('fan_p', [(0, M('A3'), 100, 0.2), (0.15, M('D4'), 100, 0.2), (0.3, M('D4'), 110, 0.6), (0.3, M('F#4'), 100, 0.6), (0.3, M('A4'), 100, 0.6)], GM['pizz'], tail=0.8)
    mm = sf_render('fan_m', [(0, M('A5'), 90, 0.2), (0.15, M('D6'), 95, 0.2), (0.3, M('F#6'), 105, 0.6), (0.3, M('A6'), 90, 0.6)], GM['marimba'], tail=0.8)
    bs = sf_render('fan_b', [(0.3, M('D3'), 100, 0.55)], GM['bassoon'], tail=0.6)
    out['fanfare'] = mix(p, 0.9 * mm, 0.7 * bs)
    # saltello: fischietto (flauto) che sale e scende
    out['hop'] = sf_render('hop', [(0, M('C6'), 90, 0.32)], GM['flute'], bends=bend_curve([(0, -5), (0.16, 7), (0.3, 3)]), tail=0.3)
    # ruggiti: grande (tuba + fagotto), medio (trombone + fagotto), piccolo (oboe + clarinetto, quasi uno squittio)
    out['roar_big'] = roar('rb', 'tuba', 'bassoon', M('D2'), M('D3'), [(0, -4), (0.14, 3), (0.45, 4), (0.85, -3), (1.05, 2)], 1.1, 0.35, 70)
    out['roar_mid'] = roar('rm', 'trombone', 'bassoon', M('G2'), M('G3'), [(0, -4), (0.12, 4), (0.4, 5), (0.75, -2), (0.95, 3)], 1.0, 0.25, 110)
    out['roar_small'] = roar('rs', 'oboe', 'clarinet', M('C5'), M('C5'), [(0, -5), (0.1, 4), (0.32, 5), (0.6, -1), (0.75, 4)], 0.8, 0.12, 260)
    return out


# ------------------------------------------------------------------ effetti fisici (sintesi offline)
def sfx_physical():
    out = {}
    # pennello sulla terra: setole (rumore acuto granuloso) + fruscio di terra sotto
    d = 0.2
    grain = (rng.uniform(0, 1, int(d * SR)) < 0.25).astype(float) * rng.uniform(-1, 1, int(d * SR))
    bristle = sweep_filter(grain, 'bp', 3500, 5200, 1.2)
    soil = sweep_filter(noise(d), 'bp', 900, 600, 0.8)
    shape = np.sin(np.pi * t_(d) / d) ** 1.2
    out['brush'] = reverb((0.8 * bristle + 0.45 * soil) * shape, 0.08)
    # terra che frana: tanti granelli che cadono + rombo morbido
    d = 0.7
    y = np.zeros(int(d * SR))
    for _ in range(140):
        at = rng.uniform(0, d * 0.75) ** 1.2
        g = biquad(noise(0.008), 'bp', rng.uniform(900, 3500), 2) * env(int(0.008 * SR), 0.0005, 0.006)
        place(y, g * rng.uniform(0.2, 0.9), at)
    rumble = biquad(noise(d), 'lp', 260) * np.exp(-4 * t_(d)) * np.minimum(1, t_(d) / 0.02)
    out['crumble'] = reverb(0.8 * y + 1.0 * rumble, 0.12)
    # nuvola di polvere: sbuffo (rumore che si scurisce) + tonfo morbido
    d = 0.6
    puff = sweep_filter(noise(d), 'lp', 3000, 300, 0.8) * np.minimum(1, t_(d) / 0.01) * np.exp(-5 * t_(d))
    thump = np.sin(2 * np.pi * np.cumsum(np.linspace(110, 50, int(0.25 * SR))) / SR) * env(int(0.25 * SR), 0.003, 0.18)
    out['poof'] = reverb(0.9 * puff + mix(thump * 0.8, np.zeros(int(d * SR))), 0.18)
    # tonfo di zampe sulla terra
    d = 0.35
    th = np.sin(2 * np.pi * np.cumsum(np.linspace(90, 45, int(d * SR))) / SR) * env(int(d * SR), 0.002, 0.2)
    dirt = biquad(noise(d), 'lp', 700) * env(int(d * SR), 0.001, 0.08)
    out['thud'] = reverb(th + 0.5 * dirt, 0.1)
    # scatto della macchina fotografica: due clic e un piccolo ronzio di trascinamento
    click = lambda f: biquad(noise(0.015), 'bp', f, 3) * env(int(0.015 * SR), 0.0005, 0.01)
    whir = sweep_sine(900, 1300, 0.18) * 0.12 * np.sin(np.pi * t_(0.18) / 0.18)
    y = np.zeros(int(0.45 * SR))
    place(y, click(3800), 0); place(y, 0.8 * click(2500), 0.07); place(y, whir, 0.14)
    out['camera'] = reverb(y, 0.1)
    # fruscio di passaggio (ossa che volano)
    out['whoosh'] = reverb(sweep_filter(noise(0.4), 'bp', 300, 2200, 0.9) * np.sin(np.pi * t_(0.4) / 0.4) ** 2, 0.1)
    return out


MAXLEN = dict(magic=2.4, treasure=2.0, fanfare=2.0, found=1.6, roar_big=1.8, roar_mid=1.7, roar_small=1.4, hop=0.8,
              pick=0.45, back=0.6, snap=0.9, brush=0.3, crumble=1.0, poof=1.0, thud=0.6, camera=0.6, whoosh=0.6)


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
        print(f'{k:11s} {len(y) / SR:.2f} s')
