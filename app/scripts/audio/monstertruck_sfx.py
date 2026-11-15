"""
Officina dei Monster Truck — effetti sonori.

- Effetti "musicali" (stelle, stellona, traguardo, pezzo nuovo, riparazione finita, scelte, tocchi, salto, pubblico che
  esulta o fa "ooh") suonati con strumenti campionati (MuseScore General, MIT) tramite FluidSynth: chitarra elettrica
  pulita, organo rock, basso, glockenspiel, marimba, arpa, archi, coro, fischio, batteria. Le stelle prese di fila
  salgono sulla scala (il gioco cambia la velocità di lettura del file).
- Effetti "fisici" (motore che romba, clacson, atterraggio, rimbalzo sulle gomme, scatoloni schiacciati, chiave inglese,
  pompa, gomma gonfiata, acqua e bolle, ruota montata, motore che tossisce, vernice, adesivo, fruscio) costruiti con
  sintesi offline (numpy), con un pizzico di strumenti veri dove aiuta.

Uso (dalla cartella app/):  python3 scripts/audio/monstertruck_sfx.py
Scrive src/games/monstertruck/audio/sfx_<nome>.mp3
"""
import os, subprocess, wave
import numpy as np
import mido

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, '..', '..', 'src', 'games', 'monstertruck', 'audio'))
TMP = '/tmp/monstertruck-audio/sfx'
SF2 = os.environ.get('SF2', '/usr/share/sounds/sf2/MuseScore_General_Full.sf2')
SR = 44100
rng = np.random.default_rng(77)


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


GM = dict(glock=9, marimba=12, xylo=13, organ=18, clean=27, muted=28, pickbass=34, pizz=45, harp=46, strings=48,
          aahs=52, oohs=53, brass=61, whistle=78)
STD = 0   # kit di batteria standard


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



def chord_notes(names, t, vel, dur, stagger=0.012):
    return [(t + k * stagger, M(x), vel, dur) for k, x in enumerate(names)]


def sfx_musical():
    out = {}
    # stella presa: chitarra pulita e glockenspiel (La); il gioco la alza a ogni stella presa di fila
    g = sf_render('star_g', [(0, M('A5'), 100, 0.35)], GM['clean'], tail=0.7, reverb=60)
    k = sf_render('star_k', [(0, M('A6'), 76, 0.3)], GM['glock'], tail=0.7, reverb=60)
    out['star'] = mix(g, 0.6 * k)
    # stellona: arpeggio di organo e glockenspiel su un accordo di chitarra
    o = sf_render('big_o', [(i * 0.06, M(x), 90, 0.5) for i, x in enumerate(['A5', 'C#6', 'E6', 'A6'])], GM['organ'], tail=0.8, reverb=60)
    k = sf_render('big_k', [(0.2 + i * 0.06, M(x), 80, 0.6) for i, x in enumerate(['E7', 'A7'])], GM['glock'], tail=1.0, reverb=70)
    g = sf_render('big_g', chord_notes(['A3', 'E4', 'A4', 'C#5', 'E5'], 0, 96, 0.9), GM['clean'], tail=1.0, reverb=60)
    out['bigstar'] = mix(0.8 * o, 0.6 * k, 0.8 * g)
    # traguardo: "ta-ta-ta-TAAA" rock di chitarre e organo, basso, piatti e rullata
    stabs = [(0, ['E4', 'B4', 'E5']), (0.14, ['E4', 'B4', 'E5']), (0.28, ['F#4', 'C#5', 'F#5'])]
    gn = []
    for t, ch in stabs:
        gn += chord_notes(ch, t, 104, 0.1)
    gn += chord_notes(['A3', 'E4', 'A4', 'C#5', 'E5', 'A5'], 0.46, 112, 1.3)
    g = sf_render('fan_g', gn, GM['clean'], tail=1.2, reverb=60)
    o = sf_render('fan_o', chord_notes(['A4', 'C#5', 'E5', 'A5'], 0.46, 96, 1.2, 0), GM['organ'], tail=1.0, reverb=60)
    bs = sf_render('fan_b', [(0, M('E2'), 100, 0.1), (0.14, M('E2'), 100, 0.1), (0.28, M('F#2'), 100, 0.1), (0.46, M('A1'), 115, 1.1)], GM['pickbass'], tail=0.6)
    dr = sf_render('fan_d', [(0.46, 49, 110, 1.0), (0.46, 36, 110, 0.2), (0, 38, 90, 0.1), (0.14, 38, 90, 0.1), (0.28, 38, 96, 0.1), (0.37, 38, 100, 0.1)], STD, drum=True, tail=1.2)
    out['fanfare'] = mix(g, 0.6 * o, 1.2 * bs, 0.5 * dr)
    # pezzo nuovo: glissando d'arpa, organo e campanelli che salgono
    pent = ['A4', 'B4', 'C#5', 'E5', 'F#5', 'A5', 'B5', 'C#6', 'E6', 'F#6', 'A6']
    h = sf_render('np_h', [(i * 0.04, M(x), 70 + i * 3, 0.8) for i, x in enumerate(pent)], GM['harp'], tail=1.2, reverb=70)
    o = sf_render('np_o', [(0.1 + i * 0.09, M(x), 84, 0.3) for i, x in enumerate(['E5', 'A5', 'C#6', 'E6'])] + [(0.5, M('A6'), 90, 0.7)], GM['organ'], tail=1.0, reverb=60)
    k = sf_render('np_k', [(0.5, M('E7'), 76, 0.8), (0.5, M('A7'), 76, 0.8)], GM['glock'], tail=1.2, reverb=70)
    out['newpart'] = mix(h, 0.7 * o, 0.6 * k)
    # riparazione finita: "ta-daa" di chitarra (Mi -> La) con il glockenspiel
    g = sf_render('fx_g', chord_notes(['E4', 'B4', 'E5', 'G#5'], 0, 96, 0.14) + chord_notes(['A4', 'E5', 'A5', 'C#6'], 0.18, 108, 0.9), GM['clean'], tail=1.0, reverb=60)
    k = sf_render('fx_k', [(0.18, M('C#7'), 80, 0.6), (0.3, M('E7'), 80, 0.6)], GM['glock'], tail=1.0, reverb=70)
    out['fixed'] = mix(g, 0.6 * k)
    # scelta: "toc-tic" di marimba che sale
    out['select'] = sf_render('se', [(0, M('E5'), 100, 0.15), (0.09, M('A5'), 110, 0.3)], GM['marimba'], tail=0.5, reverb=40)
    # tocco sullo sfondo: xilofono leggero
    out['tap'] = sf_render('tp', [(0, M('E6'), 80, 0.12), (0.06, M('B6'), 70, 0.2)], GM['xylo'], tail=0.4, reverb=50)
    # pezzo ancora chiuso: "bon-bon" di marimba grave
    out['locked'] = sf_render('lk', [(0, M('C4'), 100, 0.15), (0.13, M('G3'), 100, 0.25)], GM['marimba'], tail=0.4, reverb=30)
    # salto: chitarra che scivola verso l'alto (pitch bend) + soffio
    g = sf_render('ju_g', [(0, M('E4'), 100, 0.5)], GM['clean'], bends=bend_curve([(0, 0), (0.35, 7)], 0.01), tail=0.4, reverb=50)
    air = sweep_filter(noise(0.5), 'bp', 500, 2400, 0.9) * np.sin(np.pi * t_(0.5) / 0.5) ** 2
    out['jump'] = mix(0.8 * g, 0.4 * air)
    # pubblico che esulta: coro che sale, fischi e applausi
    voices = []
    for k_ in range(10):
        st = rng.uniform(0, 0.12)
        nt = int(rng.integers(55, 79))
        voices.append((st, nt, int(rng.integers(70, 100)), 1.1))
    ch = sf_render('ch_a', voices, GM['aahs'], bends=bend_curve([(0, -2), (0.3, 1.5), (1.0, 0.5)], 0.02), tail=0.8, reverb=70)
    wh = sf_render('ch_w', [(0.25, M('C7'), 90, 0.12), (0.4, M('G7'), 90, 0.25)], GM['whistle'], bends=bend_curve([(0.25, -3), (0.37, 0), (0.4, -2), (0.6, 1)], 0.01), tail=0.4)
    claps = np.zeros(int(1.6 * SR))
    for k_ in range(70):
        at = rng.uniform(0.0, 1.35)
        c = biquad(noise(0.03), 'bp', rng.uniform(900, 2200), 1.4) * env(int(0.03 * SR), 0.001, 0.02)
        place(claps, c * rng.uniform(0.4, 1), at)
    out['cheer'] = mix(ch, 0.45 * wh, 0.9 * reverb(claps, 0.25))
    # pubblico "ooh": coro che scende e risale
    voices = [(rng.uniform(0, 0.05), int(rng.integers(57, 72)), 84, 0.9) for _ in range(8)]
    out['ooh'] = sf_render('oo', voices, GM['oohs'], bends=bend_curve([(0, 1), (0.35, -2), (0.8, 0.5)], 0.02), tail=0.6, reverb=70)
    return out


def sfx_physical():
    out = {}
    # motore che romba: armoniche di un motore grosso che salgono di giri, con il borbottio dello scarico
    d = 0.9
    x = t_(d)
    f = 48 + 70 * (1 - np.exp(-x * 4)) + 8 * np.sin(2 * np.pi * 7 * x)
    ph = 2 * np.pi * np.cumsum(f) / SR
    tone = sum(np.sin(k * ph) / k ** 0.8 for k in range(1, 12))
    putt = 0.5 + 0.5 * np.sign(np.sin(ph / 2))
    rumble = biquad(tone * (0.7 + 0.3 * putt), 'lp', 900) + 0.25 * biquad(noise(d), 'lp', 500)
    e = np.minimum(1, x / 0.04) * np.exp(-1.6 * np.maximum(0, x - 0.4))
    out['vroom'] = reverb(rumble * e, 0.12)
    # clacson: "pa-pa" a due toni
    def honk(dur):
        xx = t_(dur)
        s_ = np.sign(np.sin(2 * np.pi * 370 * xx)) * 0.5 + np.sign(np.sin(2 * np.pi * 466 * xx)) * 0.5
        return biquad(s_, 'lp', 2400) * np.minimum(1, xx / 0.01) * np.minimum(1, (dur - xx) / 0.02)
    hn = np.zeros(int(0.6 * SR))
    place(hn, honk(0.16), 0)
    place(hn, honk(0.26), 0.22)
    out['horn'] = reverb(hn, 0.1)
    # atterraggio: tonfo morbido e molla che cigola
    th = np.sin(2 * np.pi * np.cumsum(np.linspace(110, 45, int(0.35 * SR))) / SR) * env(int(0.35 * SR), 0.003, 0.25)
    sp = np.sin(2 * np.pi * np.cumsum(260 * (1 + 0.2 * np.sin(2 * np.pi * 18 * t_(0.3)))) / SR) * env(int(0.3 * SR), 0.01, 0.2) * 0.25
    dirt = biquad(noise(0.3), 'lp', 1400) * env(int(0.3 * SR), 0.002, 0.15) * 0.5
    out['land'] = reverb(mix(th, sp, dirt), 0.12)
    # rimbalzo sulle gomme: "boing" con vibrato che si spegne
    d = 0.6
    x = t_(d)
    f = 120 * (1 + 0.5 * np.exp(-x * 7)) * (1 + 0.15 * np.sin(2 * np.pi * (9 + 6 * x) * x) * np.exp(-x * 2.5))
    ph = 2 * np.pi * np.cumsum(f) / SR
    tone = (np.sin(ph) + 0.35 * np.sin(2 * ph)) * env(len(x), 0.004, 0.5, 3.0)
    mar = sf_render('bo_m', [(0, M('E3'), 100, 0.2)], GM['marimba'], tail=0.4, reverb=30)
    out['boing'] = reverb(mix(0.8 * tone, 0.5 * mar), 0.12)
    # scatoloni schiacciati: cartone che si accartoccia (raffiche di rumore) e un tonfo
    cr = np.zeros(int(0.6 * SR))
    for k in range(14):
        at = k * 0.025 + rng.uniform(0, 0.02)
        b = biquad(noise(0.04), 'bp', rng.uniform(700, 2600), 1.2) * env(int(0.04 * SR), 0.001, 0.03)
        place(cr, b * (1 - k / 16), at)
    thump = np.sin(2 * np.pi * np.cumsum(np.linspace(140, 60, int(0.2 * SR))) / SR) * env(int(0.2 * SR), 0.002, 0.12)
    out['crunch'] = reverb(mix(cr, 0.7 * thump), 0.12)
    # chiave inglese: tintinnio metallico (parziali non armoniche)
    d = 0.35
    x = t_(d)
    out['wrench'] = reverb(sum(np.sin(2 * np.pi * fr * x) * np.exp(-x * dk) for fr, dk in ((1840, 14), (2710, 18), (4130, 24), (5260, 30))) * 0.3 + biquad(noise(d), 'hp', 3000) * env(len(x), 0.001, 0.02) * 0.3, 0.1)
    # pompa: "pff"
    d = 0.3
    out['pump'] = reverb(sweep_filter(noise(d), 'bp', 900, 2200, 1.0) * np.sin(np.pi * t_(d) / d) ** 1.5, 0.1)
    # gomma gonfiata: "pop" e una molla allegra
    pp = biquad(noise(0.04), 'bp', 1200, 0.8) * env(int(0.04 * SR), 0.001, 0.025)
    bo = np.sin(2 * np.pi * np.cumsum(np.linspace(300, 620, int(0.25 * SR))) / SR) * env(int(0.25 * SR), 0.005, 0.2) * 0.5
    k_ = sf_render('pp_k', [(0.05, M('A6'), 80, 0.3)], GM['glock'], tail=0.6, reverb=60)
    out['pop'] = mix(pp, place(np.zeros(int(0.4 * SR)), bo, 0.03), 0.5 * k_)
    # acqua e bolle
    d = 0.9
    spray = biquad(noise(d), 'hp', 1800) * (0.6 + 0.4 * np.sin(2 * np.pi * 13 * t_(d))) * np.minimum(1, t_(d) / 0.05) * np.exp(-2 * t_(d))
    bub = np.zeros(int(d * SR))
    for k in range(9):
        f0 = rng.uniform(500, 1200)
        bl = np.sin(2 * np.pi * np.cumsum(np.linspace(f0, f0 * 1.8, int(0.06 * SR))) / SR) * env(int(0.06 * SR), 0.002, 0.05)
        place(bub, bl * 0.5, 0.15 + k * 0.07 + rng.uniform(0, 0.03))
    out['wash'] = reverb(mix(0.5 * spray, bub), 0.15)
    # ruota montata: "clonk" metallico e cricchetto
    cl = sum(np.sin(2 * np.pi * fr * t_(0.4)) * np.exp(-t_(0.4) * dk) for fr, dk in ((420, 9), (1130, 14), (2210, 20))) * 0.4
    rat = np.zeros(int(0.5 * SR))
    for k in range(6):
        place(rat, biquad(noise(0.012), 'bp', 3200, 2) * env(int(0.012 * SR), 0.0005, 0.008), 0.18 + k * 0.045)
    out['clank'] = reverb(mix(cl, 0.8 * rat), 0.1)
    # motore che tossisce: tre borbottii che si spengono
    co = np.zeros(int(0.8 * SR))
    for k, at in enumerate((0, 0.18, 0.42)):
        xx = t_(0.14)
        b = biquad(noise(0.14), 'lp', 380) * env(len(xx), 0.004, 0.1) + np.sin(2 * np.pi * 70 * xx) * env(len(xx), 0.004, 0.08) * 0.6
        place(co, b * (1 - k * 0.25), at)
    out['cough'] = reverb(co, 0.12)
    # vernice: "splash" e scintilla
    sp = sweep_filter(noise(0.35), 'lp', 3000, 500, 0.8) * np.minimum(1, t_(0.35) / 0.005) * np.exp(-9 * t_(0.35))
    k_ = sf_render('pa_k', [(0.08, M('E7'), 70, 0.3), (0.16, M('B6'), 66, 0.3)], GM['glock'], tail=0.6, reverb=70)
    out['paint'] = mix(reverb(sp, 0.12), 0.6 * k_)
    # adesivo: strappo, "ciaf" e un pizzicato
    peel = sweep_filter(noise(0.18), 'bp', 1500, 5000, 1.5) * np.sin(np.pi * t_(0.18) / 0.18)
    slap = biquad(noise(0.06), 'lp', 1500) * env(int(0.06 * SR), 0.001, 0.04)
    pz = sf_render('st_p', [(0.25, M('A5'), 100, 0.2)], GM['pizz'], tail=0.4, reverb=40)
    a_ = np.zeros(int(0.6 * SR))
    place(a_, 0.4 * peel, 0)
    place(a_, slap, 0.2)
    out['sticker'] = mix(reverb(a_, 0.1), 0.6 * pz)
    # fruscio di passaggio
    out['whoosh'] = reverb(sweep_filter(noise(0.5), 'bp', 300, 1800, 0.9) * np.sin(np.pi * t_(0.5) / 0.5) ** 2, 0.15)
    return out


MAXLEN = dict(star=0.8, bigstar=1.6, fanfare=2.2, newpart=2.0, fixed=1.4, select=0.6, tap=0.5, locked=0.6, jump=0.8,
              cheer=2.0, ooh=1.3, vroom=1.0, horn=0.6, land=0.6, boing=0.7, crunch=0.7, wrench=0.4, pump=0.35, pop=0.6,
              wash=1.0, clank=0.6, cough=0.8, paint=0.7, sticker=0.7, whoosh=0.6)


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
