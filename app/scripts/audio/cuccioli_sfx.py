"""
Cuccioli dal Dottore — effetti sonori.

- Effetti "musicali" (cura riuscita, stellina, festa, sbadiglio, starnuto, stiracchiata, sciarpa, giardino) suonati con
  strumenti campionati (MuseScore General, MIT) tramite FluidSynth: glockenspiel, celesta, arpa, kalimba, chitarra
  classica, clarinetto, contrabbasso, flauto, ottavino, oboe, corno inglese, fagotto, sax baritono, wood block.
- Le voci dei cuccioli sono strumenti a fiato con glissando (pitch bend): il cagnolino abbaia col clarinetto,
  il gattino miagola con l'oboe, l'agnellino bela con il vibrato... sempre buffi e teneri.
- Effetti "fisici" (spugna, bollicine, sorso, pancino che brontola, russatina, fruscio, palla) con sintesi offline (numpy).

Uso (dalla cartella app/):  python3 scripts/audio/cuccioli_sfx.py
Scrive src/games/cuccioli/audio/sfx_<nome>.mp3
"""
import os, subprocess, wave
import numpy as np
import mido

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, '..', '..', 'src', 'games', 'cuccioli', 'audio'))
TMP = '/tmp/cuccioli-audio/sfx'
SF2 = os.environ.get('SF2', '/usr/share/sounds/sf2/MuseScore_General_Full.sf2')
SR = 44100
rng = np.random.default_rng(66)


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


def voice(name, prog, base, shape, dur, vel=104, extra=None, depth=0.25, rate=6.5):
    """Verso di cucciolo: uno strumento a fiato che "parla" con un glissando."""
    bends = vibrato(bend_curve(shape), depth, rate)
    notes = [(0, base, vel, dur)] + (extra or [])
    return sf_render(name, notes, GM[prog], bends=bends, tail=0.4)


def syllables(name, prog, base, times, shape, dur, vel=104):
    """Più sillabe brevi (es. "bau bau", "oink oink"): stesso glissando ripetuto."""
    out = np.zeros(int((times[-1] + dur + 0.6) * SR))
    for i, t0 in enumerate(times):
        x = sf_render(f'{name}{i}', [(0, base, vel, dur)], GM[prog], bends=bend_curve(shape), tail=0.3)
        place(out, x, t0)
    return out


def sfx_voices():
    out = {}
    # cagnolino: "bau bau!" (clarinetto che cade di colpo) con un piccolo soffio
    dog = syllables('dog', 'clarinet', M('A4'), [0, 0.26], [(0, 3), (0.05, 2), (0.14, -5)], 0.16, 112)
    puff = biquad(noise(0.06), 'bp', 1800, 1.2) * env(int(0.06 * SR), 0.002, 0.05)
    place(dog, 0.25 * puff, 0); place(dog, 0.25 * puff, 0.26)
    out['voice_dog'] = dog
    # gattino: "miao" (oboe che sale e scende)
    out['voice_cat'] = voice('cat', 'oboe', M('A5'), [(0, -4), (0.18, 2), (0.42, 1), (0.62, -5)], 0.66, depth=0.35, rate=7)
    # coniglietto: tre squittii piccolissimi (ottavino)
    out['voice_bunny'] = syllables('bun', 'piccolo', M('E7'), [0, 0.11, 0.22], [(0, -3), (0.06, 2)], 0.07, 90)
    # orsetto: "mmh-mmh" caldo e basso (fagotto)
    out['voice_bear'] = syllables('bear', 'bassoon', M('D3'), [0, 0.32], [(0, -2), (0.12, 2), (0.24, 0)], 0.26, 104)
    # volpina: due guaiti allegri (flauto che scatta in su)
    out['voice_fox'] = syllables('fox', 'flute', M('C6'), [0, 0.2], [(0, -4), (0.07, 5), (0.14, 3)], 0.15, 104)
    # pandino: "uuh?" curioso (corno inglese che sale)
    out['voice_panda'] = voice('panda', 'english_horn', M('E4'), [(0, -3), (0.25, 0), (0.5, 4)], 0.56, depth=0.2)
    # maialino: "oink oink" (sax baritono nasale che sale)
    pig = syllables('pig', 'bari', M('A3'), [0, 0.24], [(0, -2), (0.06, 4), (0.14, 2)], 0.16, 116)
    out['voice_pig'] = mix(pig, 0.3 * syllables('pigo', 'oboe', M('A4'), [0, 0.24], [(0, -2), (0.06, 4), (0.14, 2)], 0.16, 80))
    # agnellino: "beee" con il vibrato largo del belato (oboe)
    out['voice_lamb'] = voice('lamb', 'oboe', M('E5'), [(0, -1), (0.1, 1), (0.7, 0)], 0.72, depth=0.9, rate=9)
    return out


def sfx_musical():
    out = {}
    # prendere / riposare uno strumento
    out['pick'] = sf_render('pick', [(0, M('E6'), 85, 0.12)], GM['kalimba'], tail=0.4)
    out['back'] = sf_render('back', [(0, M('C6'), 75, 0.12), (0.09, M('G5'), 75, 0.2)], GM['kalimba'], tail=0.5)
    # strumento che adesso non serve: "uh-uh" gentile del clarinetto
    out['nope'] = sf_render('nope', [(0, M('E5'), 80, 0.14), (0.18, M('C5'), 76, 0.22)], GM['clarinet'], tail=0.4)
    # saltello: flauto che fa "boing"
    out['hop'] = sf_render('hop', [(0, M('G5'), 84, 0.2)], GM['flute'], bends=bend_curve([(0, -4), (0.09, 5), (0.18, 2)]), tail=0.25)
    # tutto pulito: arpeggio di glockenspiel e celesta in Sol
    g = sf_render('spk_g', [(i * 0.06, M(x), 92, 0.4) for i, x in enumerate(['G6', 'B6', 'D7', 'G7'])], GM['glock'], tail=0.9)
    c = sf_render('spk_c', [(0.24, M('D7'), 80, 0.6), (0.24, M('B6'), 70, 0.6)], GM['celesta'], tail=0.9)
    out['sparkle'] = mix(g, 0.7 * c)
    # spina tolta: "pop" + pizzicato che sale + tic di glockenspiel
    pop = np.sin(2 * np.pi * np.cumsum(np.linspace(1400, 380, int(0.07 * SR))) / SR) * env(int(0.07 * SR), 0.001, 0.05)
    pz = sf_render('plk_p', [(0.03, M('D5'), 100, 0.15), (0.11, M('G5'), 105, 0.25)], GM['pizz'], tail=0.5)
    gl = sf_render('plk_g', [(0.16, M('D7'), 80, 0.3)], GM['glock'], tail=0.5)
    out['pluck'] = mix(0.7 * pop, pz, 0.5 * gl)
    # cerotto: "pat" morbido + celesta a due note
    pat = biquad(noise(0.05), 'lp', 1200) * env(int(0.05 * SR), 0.002, 0.04)
    cel = sf_render('pls_c', [(0.04, M('G6'), 90, 0.3), (0.14, M('D7'), 95, 0.5)], GM['celesta'], tail=0.8)
    out['plaster'] = mix(0.8 * pat, cel)
    # "gnam!": clarinetto che fa "mmm" e sale contento
    out['yum'] = mix(sf_render('yum', [(0, M('G4'), 96, 0.55)], GM['clarinet'], bends=bend_curve([(0, 0), (0.18, 0), (0.3, 5), (0.55, 7)]), tail=0.4),
                     0.5 * sf_render('yum_g', [(0.4, M('G6'), 70, 0.4)], GM['glock'], tail=0.6))
    # sbadiglio: clarinetto che scende lento con un po' di vibrato
    out['yawn'] = sf_render('yawn', [(0, M('D5'), 80, 1.1)], GM['clarinet'], bends=vibrato(bend_curve([(0, 2), (0.3, 4), (1.0, -7)]), 0.2, 5, 0.3), tail=0.5)
    # stiracchiata: arpa che sale e clarinetto contento
    h = sf_render('str_h', [(i * 0.045, M(x), 70 + i * 3, 0.8) for i, x in enumerate(['G4', 'A4', 'B4', 'D5', 'E5', 'G5', 'A5', 'B5', 'D6'])], GM['harp'], tail=1.0)
    cl = sf_render('str_c', [(0.1, M('G5'), 84, 0.5)], GM['clarinet'], bends=bend_curve([(0, -5), (0.35, 2), (0.5, 0)]), tail=0.4)
    out['stretch'] = mix(h, 0.6 * cl)
    # starnuto piccolo: "e-tci!" (clarinetto che sale) + soffio
    ah = sf_render('snz_a', [(0, M('C5'), 70, 0.22)], GM['clarinet'], bends=bend_curve([(0, 0), (0.2, 5)]), tail=0.1)
    choo = biquad(noise(0.16), 'hp', 2500) * env(int(0.16 * SR), 0.002, 0.1)
    y = np.zeros(int(0.6 * SR)); place(y, 0.6 * ah, 0); place(y, 0.6 * choo, 0.22)
    out['sneeze'] = reverb(y, 0.12)
    # starnutone nel fazzoletto: "ah... ah... ETCIÙ!" (tre note che salgono) + soffio grande attutito
    ahs = sf_render('snzb_a', [(0, M('C5'), 74, 0.26), (0.32, M('E5'), 80, 0.26), (0.64, M('G5'), 88, 0.3)], GM['clarinet'], tail=0.1)
    choo = sweep_filter(noise(0.4), 'bp', 2600, 900, 0.8) * env(int(0.4 * SR), 0.003, 0.25)
    thump = np.sin(2 * np.pi * np.cumsum(np.linspace(180, 80, int(0.15 * SR))) / SR) * env(int(0.15 * SR), 0.002, 0.1)
    gl = sf_render('snzb_g', [(0, M('E7'), 60, 0.2), (0.07, M('C7'), 55, 0.3)], GM['glock'], tail=0.4)
    y = np.zeros(int(1.8 * SR)); place(y, ahs, 0); place(y, 0.9 * choo, 0.96); place(y, 0.5 * thump, 0.96); place(y, 0.4 * gl, 1.25)
    out['sneeze_big'] = reverb(y, 0.12)
    # brividi: denti che battono (wood block velocissimo e piano)
    out['shiver'] = sf_render('shv', [(i * 0.045, 76 if i % 2 else 77, 46 + (i % 3) * 6, 0.03) for i in range(12)], 0, drum=True, tail=0.2)
    # sciarpa: arpa calda che scende e risale + celesta
    h = sf_render('scf_h', [(i * 0.05, M(x), 72, 0.9) for i, x in enumerate(['D6', 'B5', 'G5', 'D5', 'G5', 'B5', 'D6', 'G6'])], GM['harp'], tail=1.0)
    c = sf_render('scf_c', [(0.42, M('B6'), 75, 0.6), (0.42, M('G6'), 70, 0.6)], GM['celesta'], tail=1.0)
    out['scarf'] = mix(h, 0.7 * c)
    # cura riuscita: glockenspiel + chitarra (il gioco la alza a ogni cura)
    out['cured'] = mix(sf_render('cur_g', [(0, M('G6'), 100, 0.4), (0, M('D6'), 80, 0.4)], GM['glock'], tail=0.8),
                       0.7 * sf_render('cur_t', [(0, M('G4'), 90, 0.5), (0.02, M('B4'), 84, 0.5), (0.04, M('D5'), 84, 0.5)], GM['guitar'], tail=0.6))
    # stellina sulla pastiglia
    out['star'] = sf_render('star', [(0, M('D7'), 85, 0.2), (0.08, M('G7'), 90, 0.4)], GM['celesta'], tail=0.6)
    # festa: chitarra che strimpella, clarinetto che sale, glockenspiel, contrabbasso
    strum = [(0.30 + k * 0.012, M(x), 96, 0.7) for k, x in enumerate(['G3', 'D4', 'G4', 'B4', 'D5', 'G5'])]
    gt = sf_render('pty_t', [(0, M('D4'), 90, 0.14), (0.15, M('G4'), 90, 0.14)] + strum, GM['guitar'], tail=0.8)
    cl = sf_render('pty_c', [(0, M('D5'), 96, 0.14), (0.15, M('G5'), 98, 0.14), (0.3, M('B5'), 104, 0.6)], GM['clarinet'], tail=0.5)
    gl = sf_render('pty_g', [(0.3, M('G6'), 90, 0.5), (0.3, M('D7'), 80, 0.5), (0.45, M('G7'), 70, 0.4)], GM['glock'], tail=0.8)
    bs = sf_render('pty_b', [(0.3, M('G2'), 104, 0.5)], GM['bass'], tail=0.5)
    out['party'] = mix(gt, cl, 0.8 * gl, 0.9 * bs)
    # arrivo in giardino: arpa e glockenspiel
    h = sf_render('gdn_h', [(i * 0.05, M(x), 70, 0.8) for i, x in enumerate(['G4', 'B4', 'D5', 'G5', 'B5', 'D6'])], GM['harp'], tail=1.0)
    gl = sf_render('gdn_g', [(0.32, M('B6'), 86, 0.25), (0.46, M('D7'), 88, 0.25), (0.6, M('G7'), 92, 0.5)], GM['glock'], tail=0.8)
    out['garden'] = mix(h, gl)
    return out


def sfx_physical():
    out = {}
    # fruscio di passaggio (strumento che vola)
    out['whoosh'] = reverb(sweep_filter(noise(0.35), 'bp', 400, 2400, 0.9) * np.sin(np.pi * t_(0.35) / 0.35) ** 2, 0.1)
    # spugna: "squish" bagnato + due bollicine
    d = 0.32
    squish = sweep_filter(noise(d), 'bp', 700, 1600, 1.6) * (0.6 + 0.4 * np.sin(2 * np.pi * 22 * t_(d))) * np.sin(np.pi * t_(d) / d) ** 1.5
    y = np.zeros(int(0.5 * SR)); place(y, squish, 0)
    for at, f0 in ((0.12, 900), (0.24, 1300)):
        b = np.sin(2 * np.pi * np.cumsum(np.linspace(f0, f0 * 2.2, int(0.05 * SR))) / SR) * env(int(0.05 * SR), 0.002, 0.04)
        place(y, 0.35 * b, at)
    out['scrub'] = reverb(y, 0.1)
    # sorso: "glu" (sinusoide che scende con formante d'acqua)
    d = 0.16
    glu = np.sin(2 * np.pi * np.cumsum(np.linspace(420, 170, int(d * SR))) / SR) * env(int(d * SR), 0.004, 0.11)
    wet = biquad(noise(d), 'bp', 900, 3) * env(int(d * SR), 0.002, 0.05)
    out['gulp'] = reverb(glu + 0.25 * wet, 0.08)
    # pancino che brontola (morbido, buffo)
    out['rumble'] = reverb(0.9 * growl(0.7, 70, 18), 0.1)
    # russatina: inspiro (rumore che sale) ed espiro con un fischietto
    d = 0.9
    breath = sweep_filter(noise(d), 'bp', 300, 700, 1.2) * np.sin(np.pi * t_(d) / d) ** 2 * (0.6 + 0.4 * np.sin(2 * np.pi * 30 * t_(d)))
    whistle = sweep_sine(1500, 1100, 0.5) * np.sin(np.pi * t_(0.5) / 0.5) ** 2 * 0.12
    y = np.zeros(int(1.6 * SR)); place(y, breath, 0); place(y, whistle, 0.95)
    out['snore'] = reverb(y, 0.15)
    # palla che rimbalza: "boing" di gomma
    d = 0.3
    boing = np.sin(2 * np.pi * np.cumsum(220 + 120 * np.exp(-t_(d) * 14) * np.sin(2 * np.pi * 9 * t_(d))) / SR) * env(int(d * SR), 0.002, 0.22)
    thump = biquad(noise(0.04), 'lp', 400) * env(int(0.04 * SR), 0.001, 0.03)
    out['ball'] = reverb(mix(0.8 * boing, 0.6 * thump), 0.1)
    return out


MAXLEN = dict(sneeze_big=2.0, snore=1.8, stretch=1.8, party=2.0, garden=2.0, scarf=2.0, sparkle=1.6, yawn=1.6,
              pick=0.45, back=0.6, nope=0.7, hop=0.6, whoosh=0.5, scrub=0.55, gulp=0.35, star=0.9, ball=0.6, shiver=0.8)


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
    allfx = {**sfx_musical(), **sfx_voices(), **sfx_physical()}
    for k, v in allfx.items():
        y = finish(v, name=k)
        write(k, y)
        print(f'{k:11s} {len(y) / SR:.2f} s')
