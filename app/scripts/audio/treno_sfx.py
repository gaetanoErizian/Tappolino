"""
Treno degli Animali — effetti sonori.

- Effetti "musicali" (prendere un animale, posto preso, vagone pieno, conteggio, campanella della stazione, fischio del
  treno, partenza, festa, nuova stazione) suonati con strumenti campionati (MuseScore General, MIT) tramite FluidSynth:
  banjo, armonica, contrabbasso, marimba, campane tubolari, glockenspiel, fischietto, ocarina, flauto.
- Le voci degli animali sono strumenti a fiato con glissando (pitch bend): la mucca muggisce con la tuba, il maialino
  grugnisce con il sax baritono, la pecorella bela con l'oboe, l'elefantino barrisce con il trombone... buffi e teneri.
- Effetti "fisici" (sbuffo di vapore, freno con lo sfiato) con sintesi offline (numpy).

Uso (dalla cartella app/):  python3 scripts/audio/treno_sfx.py
Scrive src/games/treno/audio/sfx_<nome>.mp3
"""
import os, subprocess, wave
import numpy as np
import mido

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, '..', '..', 'src', 'games', 'treno', 'audio'))
TMP = '/tmp/treno-audio/sfx'
SF2 = os.environ.get('SF2', '/usr/share/sounds/sf2/MuseScore_General_Full.sf2')
SR = 44100
rng = np.random.default_rng(99)


# ------------------------------------------------------------------ utilità DSP
def t_(dur):
    return np.arange(int(dur * SR)) / SR


def env(n, a=0.005, d=0.2, curve=4.0):
    """Attacco lineare + decadimento esponenziale."""
    x = np.arange(n) / SR
    return np.minimum(1, x / max(a, 1e-4)) * np.exp(-curve * np.maximum(0, x - a) / max(d, 1e-4))


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
    else:  # bp
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
    global _IR
    if _IR is None or len(_IR) != int(size * SR):
        ir = noise(size) * np.exp(-6 * t_(size) / size)
        ir = biquad(ir, 'lp', 5000)
        _IR = ir / np.sqrt((ir ** 2).sum())
    y = np.convolve(np.concatenate([x, np.zeros(len(_IR))]), _IR)[:len(x) + len(_IR)]
    dry = np.concatenate([x, np.zeros(len(_IR))])
    return dry * (1 - wet) + y * wet


# ------------------------------------------------------------------ strumenti campionati
def sf_render(name, notes, program, drum=False, gain=0.7, tail=1.0, bends=None, bend_range=12, rev=50, bank_drum=0):
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
    elif bank_drum:
        ev.append((0, mido.Message('program_change', channel=ch, program=bank_drum)))
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
    subprocess.run(['fluidsynth', '-ni', '-q', '-r', str(SR), '-g', str(gain), '-o', 'synth.reverb.level=0.45',
                    '-o', 'synth.reverb.room-size=0.4', '-F', w, SF2, p], check=True, capture_output=True)
    with wave.open(w) as f:
        d = np.frombuffer(f.readframes(f.getnframes()), dtype=np.int16).reshape(-1, 2).astype(float) / 32768
    return d.mean(1)


def M(s):
    names = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}
    return names[s[:-1]] + (int(s[-1]) + 1) * 12


GM = dict(glock=9, marimba=12, xylo=13, tubular=14, harmonica=22, guitar=24, bass=32, pizz=45, trumpet=56, trombone=57,
          tuba=58, bari=67, oboe=68, english_horn=69, bassoon=70, clarinet=71, piccolo=72, flute=73, whistle=78, ocarina=79,
          banjo=105, agogo=113, woodblock=115)


def mix(*xs):
    n = max(len(x) for x in xs)
    y = np.zeros(n)
    for x in xs:
        y[:len(x)] += x
    return y


def bend_curve(points, step=0.01):
    out = []
    for (t0, s0), (t1, s1) in zip(points, points[1:]):
        k = max(1, int((t1 - t0) / step))
        for i in range(k):
            u = i / k
            u = u * u * (3 - 2 * u)
            out.append((t0 + (t1 - t0) * i / k, s0 + (s1 - s0) * u))
    out.append(points[-1])
    return out


def vibrato(points, depth=0.3, rate=6.5, start=0.12):
    return [(t, s + (depth * np.sin(2 * np.pi * rate * t) if t > start else 0)) for t, s in points]


def voice(name, prog, base, shape, dur, vel=104, depth=0.25, rate=6.5, extra=None):
    """Verso di un animale: uno strumento a fiato che "parla" con un glissando."""
    bends = vibrato(bend_curve(shape), depth, rate)
    return sf_render(name, [(0, base, vel, dur)] + (extra or []), GM[prog], bends=bends, tail=0.4)


def syllables(name, prog, base, times, shape, dur, vel=104, depth=0.0, rate=6.5):
    """Più sillabe brevi (es. "oink oink"): stesso glissando ripetuto."""
    out = np.zeros(int((times[-1] + dur + 0.6) * SR))
    for i, t0 in enumerate(times):
        b = bend_curve(shape)
        if depth:
            b = vibrato(b, depth, rate, 0.02)
        x = sf_render(f'{name}{i}', [(0, base if not isinstance(base, list) else base[i], vel, dur)], GM[prog], bends=b, tail=0.3)
        place(out, x, t0)
    return out


def growl(dur, f0=90, rate=26):
    """Brontolio morbido: rumore scuro modulato in ampiezza."""
    x = t_(dur)
    am = 0.55 + 0.45 * np.sin(2 * np.pi * rate * x)
    body = sweep_filter(noise(dur), 'lp', f0 * 6, f0 * 3, 0.9) * am
    sh = np.minimum(1, x / 0.06) * np.minimum(1, (dur - x) / 0.25)
    return body * sh


# ------------------------------------------------------------------ voci degli animali
def sfx_voices():
    out = {}
    # mucca: "muuu" lungo e morbido (tuba che sale e ricade)
    out['voice_cow'] = voice('cow', 'tuba', M('A2'), [(0, -3), (0.25, 0), (0.75, 1), (1.0, -4)], 1.05, 112, depth=0.18, rate=5)
    # maialino: "oink oink" (sax baritono nasale + oboe)
    pig = syllables('pig', 'bari', M('A3'), [0, 0.24], [(0, -2), (0.06, 4), (0.14, 2)], 0.16, 116)
    out['voice_pig'] = mix(pig, 0.3 * syllables('pigo', 'oboe', M('A4'), [0, 0.24], [(0, -2), (0.06, 4), (0.14, 2)], 0.16, 80))
    # pecorella: "beee" con il vibrato largo (oboe)
    out['voice_sheep'] = voice('sheep', 'oboe', M('E5'), [(0, -1), (0.1, 1), (0.7, 0)], 0.72, depth=0.9, rate=9)
    # gallina: "co-co-dè!" (clarinetto: due sillabe corte e una lunga più acuta)
    out['voice_hen'] = syllables('hen', 'clarinet', [M('E5'), M('E5'), M('A5')], [0, 0.13, 0.27], [(0, -1), (0.05, 1), (0.1, 0)], 0.11, 100)
    # cavallino: nitrito allegro (tromba che scende con un tremolo veloce)
    out['voice_horse'] = voice('horse', 'trumpet', M('E5'), [(0, 5), (0.1, 7), (0.7, -3)], 0.75, 96, depth=0.9, rate=13)
    # scimmietta: "uh-uh-ah-ah!" (flauto che sale)
    out['voice_monkey'] = syllables('mnk', 'flute', [M('C5'), M('D5'), M('G5'), M('A5')], [0, 0.12, 0.26, 0.38], [(0, -3), (0.06, 2)], 0.1, 104)
    # elefantino: barrito simpatico (trombone che sale di colpo, con vibrato)
    out['voice_elephant'] = voice('ele', 'trombone', M('C4'), [(0, -5), (0.15, 7), (0.55, 9), (0.8, 6)], 0.85, 110, depth=0.4, rate=8)
    # giraffa: (è silenziosa!) un "mmm?" timido dell'ocarina
    out['voice_giraffe'] = voice('gir', 'ocarina', M('A5'), [(0, -2), (0.2, 0), (0.45, 3)], 0.5, 90, depth=0.15)
    # leoncino: ruggito buffo e morbido (fagotto + brontolio)
    roar = voice('lion', 'bassoon', M('D3'), [(0, -2), (0.2, 3), (0.6, 2), (0.85, -3)], 0.9, 112, depth=0.6, rate=11)
    out['voice_lion'] = mix(roar, 0.35 * growl(0.9, 80, 24))
    # pappagallo: "fiu-fiuu!" (ottavino)
    out['voice_parrot'] = syllables('par', 'piccolo', [M('C7'), M('E7')], [0, 0.2], [(0, -4), (0.08, 3), (0.14, 1)], 0.16, 96)
    # pinguino: due "honk" allegri (corno inglese)
    out['voice_penguin'] = syllables('pen', 'english_horn', M('A4'), [0, 0.22], [(0, -3), (0.05, 2), (0.14, -1)], 0.17, 110)
    # orso polare: "mmh-mmh" caldo e basso (fagotto)
    out['voice_polarbear'] = syllables('bear', 'bassoon', M('D3'), [0, 0.32], [(0, -2), (0.12, 2), (0.24, 0)], 0.26, 104)
    # foca: "arf arf arf" (oboe che cade)
    out['voice_seal'] = syllables('seal', 'oboe', M('C5'), [0, 0.18, 0.36], [(0, 3), (0.04, 2), (0.12, -4)], 0.13, 104)
    # tricheco: "ohoo" profondo (sax baritono)
    out['voice_walrus'] = syllables('wal', 'bari', [M('E3'), M('C3')], [0, 0.3], [(0, -2), (0.1, 1), (0.22, -1)], 0.28, 108, depth=0.3, rate=7)
    # pulcinella di mare: "grrr-uh" (ocarina con il tremolo)
    out['voice_puffin'] = voice('puf', 'ocarina', M('E5'), [(0, 0), (0.3, -2), (0.45, 4)], 0.55, 96, depth=0.7, rate=16)
    return out


# ------------------------------------------------------------------ effetti musicali
def sfx_musical():
    out = {}
    # prendere un animale: pizzico di banjo
    out['pick'] = sf_render('pick', [(0, M('A5'), 90, 0.15)], GM['banjo'], tail=0.4)
    # torna al suo posto: banjo che scende
    out['back'] = sf_render('back', [(0, M('D5'), 80, 0.12), (0.09, M('A4'), 80, 0.2)], GM['banjo'], tail=0.5)
    # vagone sbagliato: "uh-uh" gentile dell'armonica
    out['nope'] = sf_render('nope', [(0, M('E5'), 92, 0.14), (0.18, M('C5'), 88, 0.24)], GM['harmonica'], tail=0.3)
    # posto preso: accordo di banjo pizzicato + marimba (il gioco lo alza a ogni passeggero)
    out['board'] = mix(sf_render('brd_b', [(0, M('D5'), 100, 0.3), (0.012, M('F#5'), 92, 0.3), (0.024, M('A5'), 92, 0.3)], GM['banjo'], tail=0.6),
                       0.7 * sf_render('brd_m', [(0, M('D6'), 96, 0.3)], GM['marimba'], tail=0.6))
    # vagone pieno: armonica che sale + glockenspiel
    h = sf_render('full_h', [(0, M('D5'), 96, 0.12), (0.1, M('F#5'), 98, 0.12), (0.2, M('A5'), 104, 0.4)], GM['harmonica'], tail=0.4)
    g = sf_render('full_g', [(0.2, M('A6'), 80, 0.4), (0.2, M('D7'), 72, 0.4)], GM['glock'], tail=0.8)
    out['full'] = mix(h, 0.7 * g)
    # contare: una nota chiara di marimba con un tocco di glockenspiel (il gioco la alza: 1, 2, 3…)
    out['count'] = mix(sf_render('cnt_m', [(0, M('D5'), 110, 0.4), (0, M('D6'), 70, 0.4)], GM['marimba'], tail=0.6),
                       0.45 * sf_render('cnt_g', [(0, M('D7'), 80, 0.3)], GM['glock'], tail=0.6))
    # campanella della stazione: "din-don"
    out['bell'] = sf_render('bell', [(0, M('A5'), 96, 0.6), (0.36, M('F#5'), 92, 0.9)], GM['tubular'], tail=1.4)
    # fischio del treno: accordo di fischietti che "scivola" su all'attacco e giù alla fine; due colpi, corto e lungo
    def blast(nm, dur):
        bends = bend_curve([(0, -2), (0.08, 0), (dur - 0.1, 0), (dur, -2.5)])
        w = sf_render(nm + 'w', [(0, M('A5'), 112, dur), (0, M('C#6'), 104, dur), (0, M('E6'), 100, dur)], GM['whistle'], bends=bends, tail=0.3)
        o = sf_render(nm + 'o', [(0, M('A4'), 96, dur)], GM['ocarina'], bends=bends, tail=0.3)
        steam = sweep_filter(noise(dur + 0.1), 'bp', 3000, 2200, 0.8) * np.minimum(1, t_(dur + 0.1) / 0.03) * np.exp(-2 * t_(dur + 0.1))
        return mix(w, 0.55 * o, 0.12 * steam)
    y = np.zeros(int(1.9 * SR)); place(y, blast('whs1', 0.28), 0); place(y, blast('whs2', 0.85), 0.42)
    out['whistle'] = y
    # partenza: banjo che strimpella un rullo che accelera + armonica che sale
    roll = [(i * max(0.05, 0.11 - i * 0.006), M(x), 86, 0.25) for i, x in enumerate(['D4', 'F#4', 'A4', 'D5', 'F#4', 'A4', 'D5', 'F#5', 'A4', 'D5', 'F#5', 'A5'])]
    b = sf_render('dep_b', roll, GM['banjo'], tail=0.6)
    hm = sf_render('dep_h', [(0.3, M('A4'), 100, 0.6)], GM['harmonica'], bends=bend_curve([(0.3, -5), (0.6, 0), (0.9, 2)]), tail=0.4)
    out['depart'] = mix(b, 0.8 * hm)
    # festa all'arrivo: banjo che strimpella, armonica, contrabbasso, spazzola
    strum = [(0.30 + k * 0.012, M(x), 100, 0.7) for k, x in enumerate(['D3', 'A3', 'D4', 'F#4', 'A4', 'D5'])]
    bj = sf_render('pty_b', [(0, M('A4'), 92, 0.14), (0.15, M('D5'), 92, 0.14)] + strum, GM['banjo'], tail=0.8)
    hm = sf_render('pty_h', [(0, M('A4'), 100, 0.14), (0.15, M('D5'), 102, 0.14), (0.3, M('F#5'), 108, 0.6)], GM['harmonica'], tail=0.5)
    bs = sf_render('pty_c', [(0.3, M('D2'), 108, 0.5)], GM['bass'], tail=0.5)
    br = sf_render('pty_d', [(0.3, 39, 100, 0.2), (0.45, 38, 80, 0.2), (0.6, 39, 100, 0.2)], 0, drum=True, bank_drum=40, tail=0.6)
    out['party'] = mix(bj, hm, 0.9 * bs, 0.7 * br)
    # nuova stazione: piccola fanfara di armonica e banjo + campane
    hm = sf_render('st_h', [(0, M('D5'), 100, 0.18), (0.18, M('F#5'), 102, 0.18), (0.36, M('A5'), 106, 0.18), (0.54, M('D6'), 112, 0.7)], GM['harmonica'], tail=0.5)
    bj = sf_render('st_b', [(0.54 + k * 0.012, M(x), 96, 0.8) for k, x in enumerate(['D4', 'A4', 'D5', 'F#5', 'A5'])], GM['banjo'], tail=0.8)
    tb = sf_render('st_t', [(0.54, M('D6'), 80, 1.0), (0.54, M('A5'), 70, 1.0)], GM['tubular'], tail=1.2)
    out['station'] = mix(hm, bj, 0.6 * tb)
    # stellina: glockenspiel a due note
    out['star'] = sf_render('star', [(0, M('A6'), 85, 0.2), (0.08, M('D7'), 90, 0.4)], GM['glock'], tail=0.6)
    # saltello: flauto che fa "boing"
    out['hop'] = sf_render('hop', [(0, M('A5'), 84, 0.2)], GM['flute'], bends=bend_curve([(0, -4), (0.09, 5), (0.18, 2)]), tail=0.25)
    # tocco su un'ombra dell'album: pizzicato piccolo
    out['pop'] = sf_render('pop', [(0, M('D6'), 80, 0.12)], GM['pizz'], tail=0.3)
    return out


def sfx_physical():
    out = {}
    # sbuffo di vapore: "ciuf" (rumore filtrato che si apre e si chiude)
    d = 0.22
    ch = sweep_filter(noise(d), 'bp', 1800, 700, 0.9) * env(int(d * SR), 0.006, 0.12)
    low = biquad(noise(d), 'lp', 260) * env(int(d * SR), 0.004, 0.06)
    out['chuff'] = reverb(mix(ch, 0.8 * low), 0.08)
    # freno: sfiato lungo del vapore e un fischietto lieve che scende
    d = 0.9
    hiss = biquad(noise(d), 'hp', 3000) * np.minimum(1, t_(d) / 0.05) * np.exp(-2.6 * t_(d))
    sq = sf_render('brk', [(0, M('E6'), 60, 0.4)], GM['harmonica'], bends=bend_curve([(0, 0), (0.4, -3)]), tail=0.2)
    out['brake'] = mix(0.7 * hiss, 0.35 * sq)
    return out


MAXLEN = dict(whistle=1.9, voice_cow=1.4, bell=1.8, station=2.0, party=2.0, depart=1.6, full=1.2, brake=1.1,
              pick=0.45, back=0.6, nope=0.6, hop=0.6, chuff=0.4, star=0.9, pop=0.4, count=0.9, board=0.9)


def finish(x, peak=0.8, name=''):
    x = np.asarray(x, dtype=float)
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
    allfx = {**sfx_musical(), **sfx_voices(), **sfx_physical()}
    for k, v in allfx.items():
        y = finish(v, name=k)
        write(k, y)
        print(f'{k:16s} {len(y) / SR:.2f} s')
