"""
Giardino delle Fate — effetti sonori.

- Effetti "musicali" (seme piantato, crescita, fiore che sboccia, nota del fiore, sete, nuvola, fatina, risatina, farfalla,
  lucciola, aiuola piena, album) suonati con strumenti campionati (MuseScore General, MIT) tramite FluidSynth:
  arpa, celesta, glockenspiel, carillon, kalimba, flauto, ottavino, archi pizzicati. Tutti in Fa maggiore come la musica.
- La nota del fiore è una sola (Do): il gioco la intona con la scala pentatonica, così i fiori insieme non stonano mai.
- Effetti "fisici" (pioggerella, brezza) con sintesi offline (numpy), mescolati a qualche nota di celesta e arpa.

Uso (dalla cartella app/):  python3 scripts/audio/giardino_sfx.py
Scrive src/games/giardino/audio/sfx_<nome>.mp3
"""
import os, subprocess, wave
import numpy as np
import mido

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, '..', '..', 'src', 'games', 'giardino', 'audio'))
TMP = '/tmp/giardino-audio/sfx'
SF2 = os.environ.get('SF2', '/usr/share/sounds/sf2/MuseScore_General_Full.sf2')
SR = 44100
rng = np.random.default_rng(88)


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


GM = dict(celesta=8, glock=9, musicbox=10, vibes=11, marimba=12, tubular=14, kalimba=108, harp=46, pizz=45, flute=73, piccolo=72,
          recorder=74, panflute=75, ocarina=79, clarinet=71, strings=48, choir=52)


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




def chime_run(name, notes, prog, step, vel=84, dur=0.6, tail=1.0, start=0.0):
    return sf_render(name, [(start + i * step, M(x), vel + (i % 3) * 3, dur) for i, x in enumerate(notes)], GM[prog], tail=tail)


def sfx_musical():
    out = {}
    # seme nella terra: "pof" morbido + arpa e kalimba che scendono a posarsi
    d = 0.09
    pof = biquad(noise(d), 'lp', 700) * env(int(d * SR), 0.002, 0.06)
    thud = np.sin(2 * np.pi * np.cumsum(np.linspace(190, 90, int(0.12 * SR))) / SR) * env(int(0.12 * SR), 0.002, 0.09)
    h = sf_render('pl_h', [(0.02, M('C6'), 84, 0.4), (0.09, M('F5'), 80, 0.6)], GM['harp'], tail=0.8)
    k = sf_render('pl_k', [(0.02, M('A6'), 60, 0.2)], GM['kalimba'], tail=0.5)
    out['plant'] = mix(0.7 * pof, 0.6 * thud, h, 0.5 * k)
    # crescita: pizzicato che sale e arpa (il gioco la intona più acuta a ogni passo)
    pz = sf_render('gr_p', [(0, M('C5'), 92, 0.2), (0.07, M('F5'), 96, 0.2), (0.14, M('A5'), 100, 0.3)], GM['pizz'], tail=0.6)
    hp = chime_run('gr_h', ['F5', 'A5', 'C6', 'F6'], 'harp', 0.045, 76, 0.7, 0.8)
    out['grow'] = mix(pz, 0.8 * hp)
    # fiore che sboccia: glissando d'arpa, celesta e glockenspiel, tutto in Fa
    hp = chime_run('bl_h', ['F4', 'A4', 'C5', 'E5', 'F5', 'A5', 'C6', 'E6', 'F6', 'A6'], 'harp', 0.04, 74, 1.2, 1.4)
    ce = sf_render('bl_c', [(0.38, M('C7'), 90, 0.8), (0.38, M('A6'), 80, 0.8), (0.52, M('F7'), 86, 0.9)], GM['celesta'], tail=1.4)
    gl = sf_render('bl_g', [(0.52, M('A7'), 64, 0.6), (0.62, M('C8'), 58, 0.6)], GM['glock'], tail=1.0)
    out['bloom'] = mix(hp, 0.8 * ce, 0.5 * gl)
    # nota del fiore che canta: celesta + arpa insieme (Do5; il gioco la intona sulla scala pentatonica)
    out['sing'] = mix(sf_render('sg_c', [(0, M('C6'), 96, 0.7)], GM['celesta'], tail=1.0),
                      0.6 * sf_render('sg_h', [(0, M('C5'), 90, 0.8)], GM['harp'], tail=1.0))
    # "ho sete": flauto che chiede (sale come una domanda) + gocciolina di glockenspiel
    fl = sf_render('th_f', [(0, M('A5'), 74, 0.34)], GM['flute'], bends=bend_curve([(0, -2), (0.2, 0), (0.32, 3)]), tail=0.4)
    gl = sf_render('th_g', [(0.32, M('E7'), 60, 0.2)], GM['glock'], tail=0.5)
    out['thirsty'] = mix(fl, 0.6 * gl)
    # tocco sulla nuvola senza niente da innaffiare: risatina del flauto (trillo che scende)
    out['cloud'] = sf_render('cl_f', [(i * 0.06, M(x), 70, 0.07) for i, x in enumerate(['C6', 'A5', 'C6', 'A5', 'F5'])], GM['flute'], tail=0.4)
    # arriva una fatina: arpa che sale, flauto con una frase, campanelli
    hp = chime_run('fa_h', ['C5', 'F5', 'A5', 'C6', 'F6', 'A6', 'C7'], 'harp', 0.05, 72, 1.0, 1.2)
    fl = sf_render('fa_f', [(0.4, M('A5'), 82, 0.22), (0.62, M('C6'), 84, 0.22), (0.84, M('F6'), 88, 0.6)], GM['flute'], tail=0.6)
    ce = sf_render('fa_c', [(0.84, M('A6'), 70, 0.6), (0.84, M('F6'), 64, 0.6), (1.1, M('C7'), 70, 0.8)], GM['celesta'], tail=1.2)
    out['fairy'] = mix(hp, 0.8 * fl, 0.7 * ce)
    # risatina della fatina: celesta che trilla e scende
    out['giggle'] = sf_render('gg_c', [(i * 0.055, M(x), 76 - i * 2, 0.12) for i, x in enumerate(['F7', 'D7', 'F7', 'C7', 'A6', 'C7', 'F6'])], GM['celesta'], tail=0.6)
    # farfalla: frullo leggero di ottavino (trillo veloce)
    out['flutter'] = sf_render('ft_p', [(i * 0.035, M('C7') if i % 2 else M('D7'), 52 + i * 2, 0.05) for i in range(10)], GM['piccolo'], tail=0.3)
    # lucciola: un tintinnio di glockenspiel con un'eco di celesta
    out['twinkle'] = mix(sf_render('tw_g', [(0, M('A7'), 72, 0.2)], GM['glock'], tail=0.6),
                         0.6 * sf_render('tw_c', [(0.09, M('E7'), 66, 0.3)], GM['celesta'], tail=0.6))
    # aiuola piena: piccola festa incantata (arpa, flauto, pizzicati, campanelli)
    hp = chime_run('bd_h', ['F4', 'C5', 'F5', 'A5', 'C6', 'F6', 'A6', 'C7'], 'harp', 0.05, 78, 1.4, 1.6)
    fl = sf_render('bd_f', [(0.45, M('C6'), 86, 0.25), (0.7, M('D6'), 86, 0.25), (0.95, M('F6'), 92, 0.25), (1.2, M('A6'), 96, 0.8)], GM['flute'], tail=0.8)
    pz = sf_render('bd_p', [(0.45, M('F3'), 96, 0.3), (0.95, M('C4'), 90, 0.3), (1.2, M('F4'), 96, 0.4)], GM['pizz'], tail=0.6)
    gl = sf_render('bd_g', [(1.2, M('F7'), 80, 0.6), (1.2, M('A7'), 70, 0.6), (1.35, M('C8'), 66, 0.6)], GM['glock'], tail=1.0)
    ce = sf_render('bd_c', [(1.2, M('C7'), 82, 0.9), (1.2, M('F6'), 76, 0.9)], GM['celesta'], tail=1.2)
    out['bed_done'] = mix(hp, 0.8 * fl, 0.8 * pz, 0.5 * gl, 0.7 * ce)
    # cartoncino dell'album
    out['pop'] = mix(sf_render('pp_m', [(0, M('C6'), 80, 0.15)], GM['musicbox'], tail=0.4),
                     0.5 * np.sin(2 * np.pi * np.cumsum(np.linspace(600, 1300, int(0.05 * SR))) / SR) * env(int(0.05 * SR), 0.001, 0.04))
    return out


def sfx_physical():
    out = {}
    # pioggerella: fruscio morbido di gocce + piccoli "plic" intonati di celesta
    d = 1.3
    hiss = biquad(biquad(noise(d), 'hp', 1500), 'lp', 7000) * 0.35
    shape = np.minimum(1, t_(d) / 0.15) * np.minimum(1, (d - t_(d)) / 0.4)
    y = hiss * shape
    for k in range(26):
        at = rng.uniform(0, d - 0.1)
        f0 = rng.uniform(1800, 3600)
        plip = np.sin(2 * np.pi * np.cumsum(np.linspace(f0, f0 * 1.5, int(0.03 * SR))) / SR) * env(int(0.03 * SR), 0.001, 0.02)
        place(y, rng.uniform(0.15, 0.35) * plip, at)
    ce = sf_render('rn_c', [(0.2 + i * 0.22, M(x), 50, 0.2) for i, x in enumerate(['C7', 'A6', 'F6', 'A6', 'C7'])], GM['celesta'], tail=0.6)
    out['rain'] = reverb(mix(y, 0.45 * ce), 0.15)
    # passaggio a un'altra aiuola: soffio di brezza + arpa che scorre
    br = sweep_filter(noise(0.7), 'bp', 500, 2200, 0.8) * np.sin(np.pi * t_(0.7) / 0.7) ** 2 * 0.6
    hp = chime_run('pg_h', ['C6', 'A5', 'F5', 'C5', 'F5', 'A5'], 'harp', 0.06, 66, 0.7, 0.8)
    out['page'] = reverb(mix(br, 0.8 * hp), 0.1)
    return out


MAXLEN = dict(bloom=2.0, fairy=2.2, bed_done=2.6, rain=1.6, page=1.2, sing=1.3, grow=1.2, plant=0.9, thirsty=0.8,
              cloud=0.7, giggle=0.9, flutter=0.6, twinkle=0.8, pop=0.4)


def finish(x, peak=0.8, name=''):
    x = np.asarray(x, dtype=float)
    # taglia il silenzio iniziale e finale (sotto -48 dB), lunghezza massima e dissolvenza in uscita
    thr = 10 ** (-48 / 20) * np.max(np.abs(x))
    idx = np.where(np.abs(x) > thr)[0]
    if len(idx):
        x = x[max(0, idx[0] - 30):idx[-1] + 1]
    x = x[:int(MAXLEN.get(name, 1.6) * SR)].copy()
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
