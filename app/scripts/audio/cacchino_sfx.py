"""
Cacchino — effetti sonori.

- Puzzette: una "pernacchia" sintetizzata offline (treno di impulsi irregolare, come le labbra che vibrano) mescolata a
  tuba, trombone o fagotto con glissando verso il basso: buffe, da cartone animato, mai volgari.
- Voce di Cacchino (risatina, saluto, sbadiglio, tristezza): ocarina, ottavino, clarinetto e trombone con pitch bend.
- Effetti "musicali" (monete, acquisto, stella, vittoria, livello, crescita, campanella) con strumenti campionati
  (MuseScore General, MIT) tramite FluidSynth.
- Effetti "fisici" (morso, sorso, spugna, doccia, sciacquone, pancino che brontola, mosca, russata) con sintesi offline (numpy).

Uso (dalla cartella app/):  python3 scripts/audio/cacchino_sfx.py
Scrive src/games/cacchino/audio/sfx_<nome>.mp3
"""
import os, subprocess, wave
import numpy as np
import mido

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, '..', '..', 'src', 'games', 'cacchino', 'audio'))
TMP = '/tmp/cacchino-audio/sfx'
SF2 = os.environ.get('SF2', '/usr/share/sounds/sf2/MuseScore_General_Full.sf2')
SR = 44100
rng = np.random.default_rng(111)


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
          trumpet=56, bell=14, accordion=21, oboe=68, english_horn=69, clarinet=71, piccolo=72, flute=73, bari=67, guitar=24, bass=32, ocarina=79)


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


def vibrato(points, depth=0.3, rate=6.5, start=0.12):
    """Aggiunge un vibrato (in semitoni) a una curva di pitch bend."""
    return [(t, s + (depth * np.sin(2 * np.pi * rate * t) if t > start else 0)) for t, s in points]




def smooth_noise(dur, rate=18.0):
    """Rumore lento (per rendere irregolare l'altezza della pernacchia)."""
    k = max(2, int(dur * rate) + 2)
    pts = rng.uniform(-1, 1, k)
    return np.interp(np.linspace(0, k - 1, int(dur * SR)), np.arange(k), pts)


def raspberry(dur, f0, f1, jitter=0.16, bright=1100, flutter=0.0):
    """Pernacchia: impulsi a bassa frequenza con altezza che scende e traballa."""
    x = t_(dur)
    f = f0 * (f1 / f0) ** (x / dur) * (1 + jitter * smooth_noise(dur)) * (1 + flutter * np.sin(2 * np.pi * 7 * x))
    ph = np.cumsum(f) / SR
    frac = ph % 1
    pulse = np.where(frac < 0.22, 1.0, -0.28) + 0.25 * (2 * frac - 1)
    y = biquad(pulse, 'lp', bright, 0.8)
    y = y * 0.65 + biquad(y, 'bp', 340, 1.4) * 0.7 + biquad(noise(dur), 'bp', 900, 0.8) * 0.05 * (frac < 0.3)
    e = np.minimum(1, x / 0.012) * np.minimum(1, (dur - x) / 0.07)
    return y * e


def brass_fall(name, prog, note, dur, fall=-5, vel=108, wob=0.0):
    pts = [(0, 0.6), (0.05, 0), (dur * 0.5, fall * 0.35), (dur, fall)]
    return sf_render(name, [(0, M(note), vel, dur)], GM[prog], bends=vibrato(bend_curve(pts), wob, 9, 0.05), tail=0.25, reverb=30)


def sfx_farts():
    out = {}
    out['fart_s'] = mix(raspberry(0.2, 190, 140, 0.1, 1500) * 0.8, brass_fall('fs', 'bassoon', 'A2', 0.16, -3, 100) * 0.7)
    out['fart_m'] = mix(raspberry(0.46, 135, 84, 0.18, 1200) * 0.85, brass_fall('fm', 'trombone', 'F2', 0.4, -5, 104) * 0.6)
    out['fart_l'] = mix(raspberry(0.85, 110, 58, 0.2, 1000, 0.06) * 0.9, brass_fall('fl', 'tuba', 'D2', 0.8, -7, 110, 0.4) * 0.7)
    # gigante: lunga, con la coda che sale e un "ta-daa" di ottoni alla fine
    r = np.concatenate([raspberry(1.15, 105, 46, 0.22, 1000, 0.08), raspberry(0.3, 60, 120, 0.12, 1300)])
    tuba = brass_fall('fg', 'tuba', 'C2', 1.3, -8, 118, 0.6)
    tada = sf_render('fg2', [(0, M('C4'), 104, 0.14), (0, M('E4'), 100, 0.14), (0.17, M('G4'), 112, 0.6), (0.17, M('C5'), 112, 0.6), (0.17, M('E5'), 108, 0.6)], GM['trumpet'], tail=0.5)
    cym = sf_render('fg3', [(0, 49, 96, 0.8)], 0, drum=True, tail=0.6)
    y = np.zeros(int(2.9 * SR))
    place(y, r * 0.9, 0); place(y, tuba * 0.7, 0); place(y, tada * 0.6, 1.42); place(y, cym * 0.35, 1.59)
    out['fart_mega'] = y
    burp = raspberry(0.34, 150, 82, 0.25, 900)
    out['burp'] = sweep_filter(burp, 'bp', 700, 260, 1.6) * 1.6 + burp * 0.35
    return out


def sfx_voice():
    out = {}
    g = np.zeros(int(0.9 * SR))
    for i, (t0, nt) in enumerate([(0, 'A5'), (0.12, 'G5'), (0.24, 'A5'), (0.36, 'F5')]):
        place(g, sf_render(f'gi{i}', [(0, M(nt), 100, 0.07)], GM['ocarina'], bends=bend_curve([(0, 1.5), (0.07, -1)]), tail=0.2, reverb=30), t0)
    out['giggle'] = g
    out['hello'] = sf_render('he', [(0, M('E5'), 100, 0.14), (0.16, M('A5'), 108, 0.3)], GM['ocarina'], bends=bend_curve([(0, -1), (0.12, 0), (0.16, 0), (0.3, 1.2), (0.46, 0)]), tail=0.3)
    out['sad'] = mix(sf_render('sa1', [(0, M('D4'), 96, 0.34)], GM['trombone'], bends=bend_curve([(0, 0), (0.34, -1.5)]), tail=0.1),
                     np.concatenate([np.zeros(int(0.4 * SR)), sf_render('sa2', [(0, M('C#4'), 96, 0.7)], GM['trombone'], bends=vibrato(bend_curve([(0, 0), (0.7, -3)]), 0.3, 5, 0.2), tail=0.3)]))
    out['yawn'] = sf_render('ya', [(0, M('E4'), 92, 1.0)], GM['clarinet'], bends=bend_curve([(0, -4), (0.4, 5), (1.0, -5)]), tail=0.3)
    x = t_(0.75)
    inh = sweep_filter(noise(0.75), 'lp', 700, 300, 1.0) * (0.55 + 0.45 * np.sin(2 * np.pi * 24 * x)) * np.minimum(1, x / 0.1) * np.minimum(1, (0.75 - x) / 0.15)
    wh = sweep_sine(900, 1500, 0.5) * env(int(0.5 * SR), 0.12, 0.5, 3) * 0.16
    out['snore'] = np.concatenate([inh * 0.9, np.zeros(int(0.1 * SR)), wh])
    return out


def sfx_musical():
    out = {}
    out['coin'] = sf_render('co', [(0, M('E6'), 104, 0.08), (0.07, M('B6'), 110, 0.3)], GM['glock'], tail=0.5)
    out['buy'] = mix(sf_render('bu1', [(0, M('C6'), 100, 0.1), (0.08, M('E6'), 104, 0.1), (0.16, M('G6'), 108, 0.1), (0.24, M('C7'), 112, 0.4)], GM['glock'], tail=0.6),
                     sf_render('bu2', [(0.24, M('C5'), 90, 0.4), (0.24, M('E5'), 90, 0.4)], GM['celesta'], tail=0.5))
    out['star'] = sf_render('st', [(0, M('G5'), 100, 0.12), (0.09, M('C6'), 104, 0.12), (0.18, M('E6'), 110, 0.5)], GM['celesta'], tail=0.6)
    out['nope'] = sf_render('no', [(0, M('E4'), 84, 0.12), (0.13, M('C4'), 78, 0.25)], GM['marimba'], tail=0.3, reverb=20)
    out['tap'] = sf_render('ta', [(0, M('G5'), 92, 0.08)], GM['kalimba'], tail=0.2, reverb=20)
    out['step'] = sf_render('se', [(0, M('C5'), 100, 0.12)], GM['marimba'], tail=0.3, reverb=25)
    out['drop'] = mix(sf_render('dr', [(0, M('G3'), 100, 0.1)], GM['marimba'], tail=0.2, reverb=15), sf_render('dr2', [(0, 77, 80, 0.05)], 0, drum=True, tail=0.1) * 0.5)
    out['bell'] = sf_render('be', [(0, M('E5'), 104, 0.3), (0.28, M('C5'), 100, 0.7)], GM['bell'], tail=0.9)
    out['win'] = mix(sf_render('wi1', [(i * 0.07, M(nt), 100 + i * 3, 0.1) for i, nt in enumerate(['C5', 'E5', 'G5', 'C6', 'E6'])] + [(0.42, M('G6'), 116, 0.6)], GM['xylo'], tail=0.5),
                     sf_render('wi2', [(0.42, M('C4'), 108, 0.7), (0.42, M('E4'), 104, 0.7), (0.42, M('G4'), 104, 0.7)], GM['trombone'], tail=0.4) * 0.8)
    out['levelup'] = mix(sf_render('lu1', [(0, M('C5'), 104, 0.16), (0.16, M('E5'), 106, 0.16), (0.32, M('G5'), 110, 0.16), (0.5, M('C6'), 120, 0.9)], GM['trumpet'], tail=0.5),
                         sf_render('lu2', [(0.5, M('E4'), 108, 0.9), (0.5, M('G4'), 108, 0.9), (0.5, M('C4'), 108, 0.9)], GM['trombone'], tail=0.5) * 0.7,
                         sf_render('lu3', [(0.5 + i * 0.06, M(nt), 96, 0.3) for i, nt in enumerate(['C6', 'E6', 'G6', 'C7'])], GM['glock'], tail=0.7) * 0.7)
    harp = sf_render('gr1', [(i * 0.05, M('C3') + s, 80 + i * 2, 0.5) for i, s in enumerate([0, 4, 7, 12, 16, 19, 24, 28, 31, 36, 40, 43])], GM['harp'], tail=0.8)
    out['grow'] = mix(harp, np.concatenate([np.zeros(int(0.62 * SR)), sf_render('gr2', [(0, M('C5'), 116, 0.8), (0, M('E5'), 112, 0.8), (0, M('G5'), 112, 0.8)], GM['trumpet'], tail=0.5) * 0.8]),
                      np.concatenate([np.zeros(int(0.62 * SR)), sf_render('gr3', [(0, M('C2'), 112, 0.8)], GM['tuba'], tail=0.4) * 0.7]))
    return out


def sfx_physical():
    out = {}
    c = np.zeros(int(0.2 * SR))
    for t0 in (0, 0.035, 0.075):
        b = biquad(noise(0.05), 'bp', float(rng.uniform(1400, 2600)), 2.0) * env(int(0.05 * SR), 0.002, 0.04, 6)
        place(c, b, t0)
    out['chomp'] = mix(c * 1.4, sweep_sine(220, 120, 0.09) * env(int(0.09 * SR), 0.003, 0.08, 5) * 0.5)
    out['gulp'] = np.concatenate([sweep_sine(330, 170, 0.09), sweep_sine(170, 460, 0.1)]) * env(int(0.19 * SR), 0.01, 0.2, 2.5)
    out['pop'] = sweep_sine(380, 1300, 0.055) * env(int(0.055 * SR), 0.002, 0.05, 4)
    x = t_(0.26)
    out['scrub'] = sweep_filter(noise(0.26), 'bp', 2200, 4200, 1.2) * np.sin(np.pi * x / 0.26) ** 1.5
    x = t_(1.5)
    out['shower'] = biquad(noise(1.5), 'hp', 2600) * np.minimum(1, x / 0.15) * np.minimum(1, (1.5 - x) / 0.5) * (0.85 + 0.15 * smooth_noise(1.5, 30))
    x = t_(0.32)
    out['slide'] = sweep_filter(noise(0.32), 'bp', 500, 3200, 1.0) * np.sin(np.pi * x / 0.32) ** 2
    x = t_(1.5)
    sw = sweep_filter(noise(1.5), 'lp', 3000, 260, 1.4) * (0.6 + 0.4 * np.sin(2 * np.pi * (3 + 9 * x) * x)) * np.minimum(1, x / 0.08) * np.minimum(1, (1.5 - x) / 0.4)
    gur = np.zeros(int(1.5 * SR))
    for t0 in (0.95, 1.08, 1.2):
        place(gur, sweep_sine(260, 520, 0.08) * env(int(0.08 * SR), 0.01, 0.07, 4) * 0.5, t0)
    out['flush'] = sw + gur
    x = t_(0.65)
    out['rumble'] = (np.sin(2 * np.pi * np.cumsum(72 + 26 * np.sin(2 * np.pi * 5 * x)) / SR) * 0.7 + growl(0.65, 80, 22) * 0.8) * np.minimum(1, x / 0.08) * np.minimum(1, (0.65 - x) / 0.2)
    x = t_(0.55)
    ph = np.cumsum(185 * (1 + 0.08 * np.sin(2 * np.pi * 11 * x) + 0.05 * smooth_noise(0.55, 9))) / SR
    out['buzz'] = biquad(2 * (ph % 1) - 1, 'bp', 1300, 1.2) * (0.6 + 0.4 * np.sin(2 * np.pi * 34 * x)) * np.sin(np.pi * x / 0.55)
    return out


MAXLEN = dict(fart_mega=2.9, grow=2.2, levelup=2.0, win=1.6, flush=1.5, shower=1.5, snore=1.4, sad=1.5, yawn=1.3, bell=1.6, buy=1.1, star=1.1,
              fart_l=1.1, giggle=0.9, hello=0.8, coin=0.7, fart_m=0.7, rumble=0.65, buzz=0.55, burp=0.45, nope=0.6, step=0.4, slide=0.35,
              fart_s=0.4, scrub=0.28, tap=0.3, drop=0.3, gulp=0.25, chomp=0.25, pop=0.1)


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
    allfx = {**sfx_farts(), **sfx_voice(), **sfx_musical(), **sfx_physical()}
    for k, v in allfx.items():
        y = finish(v, name=k)
        write(k, y)
        print(f'{k:11s} {len(y) / SR:.2f} s')
