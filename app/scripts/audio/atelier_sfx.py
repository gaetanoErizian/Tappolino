"""
Atelier delle Principesse — effetti sonori.

- Effetti "musicali" suonati con strumenti campionati (MuseScore General, MIT) tramite FluidSynth: arpa (presa di un
  capo, giravolta, capo tolto), celesta e glockenspiel (capo indossato, categorie, scintille), pizzicati e marimba
  (saltelli, passi sulla passerella), tromba e archi (fanfara della sfilata), wood block (pacco regalo che si muove).
- Effetti "fisici" con sintesi offline (numpy): fruscio di stoffa, scatto della macchina fotografica, applausi.

Uso (dalla cartella app/):  python3 scripts/audio/atelier_sfx.py
Scrive src/games/atelier/audio/sfx_<nome>.mp3
"""
import os, subprocess, wave
import numpy as np
import mido

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, '..', '..', 'src', 'games', 'atelier', 'audio'))
TMP = '/tmp/atelier-audio/sfx'
SF2 = os.environ.get('SF2', '/usr/share/sounds/sf2/MuseScore_General_Full.sf2')
SR = 44100
rng = np.random.default_rng(1010)


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
          oboe=68, english_horn=69, clarinet=71, piccolo=72, flute=73, bari=67, guitar=24, bass=32, ocarina=79)


def mix(*xs):
    n = max(len(x) for x in xs)
    y = np.zeros(n)
    for x in xs:
        y[:len(x)] += x
    return y



GM.update(trumpet=56, strings=48, vibes=11, music_box=10)


def scale_run(start, steps, dt, vel=86, dur=0.5, up=True):
    """Glissando su scala di Re maggiore (note per sf_render)."""
    deg = [0, 2, 4, 5, 7, 9, 11]
    base = M(start)
    out = []
    root = base - ((base - 2) % 12)  # Re sotto la nota di partenza
    k0 = 0
    while root + 12 * (k0 // 7) + deg[k0 % 7] < base:
        k0 += 1
    for i in range(steps):
        k = k0 + (i if up else -i)
        m = root + 12 * (k // 7) + deg[k % 7]
        out.append((i * dt, m, vel, dur))
    return out


def sfx_musical():
    out = {}
    out['pick'] = sf_render('pick', [(0, M('A5'), 92, 0.35)], GM['harp'], tail=0.4)
    out['wear'] = mix(sf_render('wear_c', [(0, M('D6'), 100, 0.5), (0.07, M('A6'), 92, 0.6)], GM['celesta'], tail=0.6),
                      0.35 * sf_render('wear_g', [(0.07, M('D7'), 70, 0.4)], GM['glock'], tail=0.5))
    out['back'] = sf_render('back', [(0, M('D4'), 80, 0.2)], GM['pizz'], tail=0.3)
    out['off'] = sf_render('off', [(0, M('A5'), 90, 0.3), (0.09, M('D5'), 84, 0.4)], GM['harp'], tail=0.4)
    out['tab'] = sf_render('tab', [(0, M('A6'), 84, 0.3)], GM['glock'], tail=0.5)
    out['twirl'] = mix(sf_render('twirl_h', scale_run('D5', 12, 0.035, 84, 0.5), GM['harp'], tail=0.6),
                       0.6 * sf_render('twirl_c', [(0.42, M('D7'), 90, 0.6)], GM['celesta'], tail=0.6))
    out['hop'] = sf_render('hop', [(0, M('A4'), 84, 0.12), (0.06, M('D5'), 90, 0.18)], GM['pizz'], tail=0.3)
    out['step'] = sf_render('step', [(0, M('D5'), 58, 0.08)], GM['marimba'], tail=0.25)
    fan_t = sf_render('fan_t', [(0, M('A4'), 96, 0.12), (0.13, M('A4'), 90, 0.12), (0.26, M('A4'), 96, 0.12), (0.39, M('D5'), 108, 0.9)], GM['trumpet'], tail=0.8)
    fan_t2 = sf_render('fan_t2', [(0.39, M('F#5'), 96, 0.9)], GM['trumpet'], tail=0.8)
    fan_s = sf_render('fan_s', [(0.39, M('D4'), 90, 1.0), (0.39, M('A4'), 84, 1.0), (0.39, M('F#5'), 84, 1.0), (0.39, M('D3'), 90, 1.0)], GM['strings'], tail=0.8)
    fan_c = sf_render('fan_c', [(0.39 + k * 0.05, m, 80, 0.5) for k, m in enumerate([M('D6'), M('F#6'), M('A6'), M('D7')])], GM['celesta'], tail=0.6)
    out['fanfare'] = mix(0.8 * fan_t, 0.5 * fan_t2, 0.7 * fan_s, 0.45 * fan_c)
    out['gift'] = mix(sf_render('gift_w', [(0, 76, 90, 0.08), (0.09, 77, 84, 0.08), (0.18, 76, 88, 0.08)], 0, drum=True, tail=0.3),
                      0.4 * sf_render('gift_g', [(0.2, M('F#6'), 70, 0.3)], GM['glock'], tail=0.4))
    op_h = sf_render('op_h', scale_run('A4', 15, 0.03, 80, 0.6), GM['harp'], tail=0.8)
    op_c = sf_render('op_c', [(0.45 + k * 0.08, m, 92, 0.7) for k, m in enumerate([M('D6'), M('F#6'), M('A6'), M('D7'), M('F#7')])], GM['celesta'], tail=0.8)
    op_s = sf_render('op_s', [(0.4, M('D4'), 70, 1.2), (0.4, M('F#4'), 66, 1.2), (0.4, M('A4'), 66, 1.2), (0.4, M('D5'), 70, 1.2)], GM['strings'], tail=0.8)
    out['open'] = mix(0.7 * op_h, 0.8 * op_c, 0.55 * op_s)
    out['sparkle'] = sf_render('sparkle', [(0, M('A6'), 80, 0.3), (0.06, M('D7'), 84, 0.3), (0.12, M('F#7'), 88, 0.5)], GM['celesta'], tail=0.6)
    out['choose'] = mix(sf_render('choose_g', [(0, M('D6'), 88, 0.3), (0.1, M('A6'), 92, 0.5)], GM['glock'], tail=0.5),
                        0.5 * sf_render('choose_h', [(0, M('D5'), 84, 0.5), (0.1, M('A5'), 84, 0.5)], GM['harp'], tail=0.5))
    return out


def sfx_physical():
    out = {}
    # fruscio di stoffa: rumore filtrato che sale e scende
    d = 0.34
    sw = sweep_filter(noise(d), 'bp', 900, 3400, 0.8) * np.sin(np.pi * t_(d) / d) ** 1.5
    out['swish'] = reverb(sw * 0.9, 0.12)
    # scatto della macchina fotografica: due clic secchi e un fruscio di otturatore
    click = lambda: biquad(noise(0.012), 'hp', 2500) * env(int(0.012 * SR), 0.0005, 0.008)
    sh = np.zeros(int(0.35 * SR))
    place(sh, click(), 0.0)
    place(sh, 0.5 * biquad(noise(0.05), 'bp', 3000, 1.2) * env(int(0.05 * SR), 0.002, 0.04), 0.012)
    place(sh, 0.8 * click(), 0.07)
    shine = sf_render('flash_c', [(0.1, M('D7'), 70, 0.3), (0.16, M('A7'), 64, 0.4)], GM['celesta'], tail=0.5)
    out['flash'] = mix(reverb(sh, 0.1), 0.45 * shine)
    # applausi: tanti battiti di mani (rumore a banda media) che crescono e si spengono
    d = 2.0
    ap = np.zeros(int(d * SR))
    for _ in range(260):
        tt = rng.uniform(0, d - 0.05)
        shape = np.sin(np.pi * min(1, tt / d * 1.6)) if tt < d / 1.6 else np.exp(-(tt - d / 1.6) * 2.4)
        f = rng.uniform(900, 2400)
        c = biquad(noise(0.03), 'bp', f, 1.4) * env(int(0.03 * SR), 0.001, 0.02)
        place(ap, c * rng.uniform(0.5, 1.0) * shape, tt)
    out['applause'] = reverb(ap, 0.25, 0.8)
    return out


MAXLEN = dict(fanfare=2.2, open=2.4, applause=2.2, twirl=1.6, flash=1.0, wear=1.0, sparkle=1.2, choose=1.0,
              pick=0.5, back=0.5, off=0.7, tab=0.7, hop=0.5, step=0.3, gift=0.8, swish=0.5)


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
        print(f'{k:9s} {len(y) / SR:.2f} s')
