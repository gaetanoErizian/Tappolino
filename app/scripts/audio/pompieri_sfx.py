"""
Pompieri in Azione — effetti sonori.

- Effetti "musicali" (stellina, cuori, fanfara, medaglia, tocco, campanella del camion rosa) suonati con
  strumenti campionati (MuseScore General, MIT) tramite FluidSynth.
- Effetti "fisici" (getto d'acqua, vapore, fiammella che si accende, scala che si allunga, miagolio,
  sirene dei camion) costruiti con sintesi offline (numpy): più strati, inviluppi, filtri e un piccolo
  riverbero comune, per un suono pieno e coerente con la musica.

Uso (dalla cartella app/):
    sudo apt-get install fluidsynth musescore-general-soundfont-lossless ffmpeg
    pip install mido numpy
    python3 scripts/audio/pompieri_sfx.py
Scrive src/games/pompieri/audio/sfx_<nome>.mp3
"""
import os, subprocess, wave
import numpy as np
import mido

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, '..', '..', 'src', 'games', 'pompieri', 'audio'))
TMP = '/tmp/pompieri-audio/sfx'
SF2 = os.environ.get('SF2', '/usr/share/sounds/sf2/MuseScore_General_Full.sf2')
SR = 44100
rng = np.random.default_rng(5)


# ------------------------------------------------------------------ utilità DSP
def t_(dur):
    return np.arange(int(dur * SR)) / SR


def env(n, a=0.005, d=0.2, curve=4.0):
    """Attacco lineare + decadimento esponenziale."""
    x = np.arange(n) / SR
    return np.minimum(1, x / max(a, 1e-4)) * np.exp(-curve * np.maximum(0, x - a) / max(d, 1e-4))


def adsr(dur, a, r, shape=1.0):
    """Inviluppo con attacco e rilascio lineari, sostegno pieno nel mezzo."""
    x = t_(dur)
    e = np.minimum(1, x / max(a, 1e-4)) * np.minimum(1, (dur - x) / max(r, 1e-4))
    return np.clip(e, 0, 1) ** shape


def noise(dur):
    return rng.uniform(-1, 1, int(dur * SR))


def biquad(x, kind, f, q=0.707):
    """Filtro biquad (RBJ) con frequenza costante."""
    f = min(f, SR * 0.45)
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


def track_filter(x, kind, freqs, q=1.0, block=512):
    """Filtro che segue una curva di frequenze (un valore per campione), a blocchi sovrapposti."""
    out = np.zeros_like(x)
    for a in range(0, len(x), block):
        b = min(len(x), a + block)
        pre = max(0, a - 384)
        y = biquad(x[pre:b], kind, float(freqs[min(len(freqs) - 1, (a + b) // 2)]), q)
        out[a:b] = y[a - pre:]
    return out


def place(dst, src, at):
    i = int(at * SR)
    j = min(len(dst), i + len(src))
    if j > i:
        dst[i:j] += src[:j - i]
    return dst


def mix(*xs):
    n = max(len(x) for x in xs)
    y = np.zeros(n)
    for x in xs:
        y[:len(x)] += x
    return y


_IR = {}


def reverb(x, wet=0.16, size=0.6):
    """Piccola stanza: risposta impulsiva sintetica (rumore che decade, scurito)."""
    key = round(size, 3)
    if key not in _IR:
        ir = noise(size) * np.exp(-6 * t_(size) / size)
        ir = biquad(ir, 'lp', 4800)
        _IR[key] = ir / np.sqrt((ir ** 2).sum())
    ir = _IR[key]
    y = np.convolve(np.concatenate([x, np.zeros(len(ir))]), ir)[:len(x) + len(ir)]
    dry = np.concatenate([x, np.zeros(len(ir))])
    return dry * (1 - wet) + y * wet


def tone(freqs, amps, phase_noise=0.0):
    """Suono armonico con frequenza fondamentale variabile (un valore per campione).
    amps[k] = ampiezza dell'armonica k+1; le armoniche oltre 9 kHz vengono omesse (niente aliasing)."""
    ph = 2 * np.pi * np.cumsum(freqs) / SR
    if phase_noise:
        ph += phase_noise * np.cumsum(rng.normal(0, 1, len(freqs))) / SR
    y = np.zeros(len(freqs))
    for k, a in enumerate(amps, start=1):
        y += a * np.sin(k * ph) * (freqs * k < 9000)
    return y


def glide(points, dur, smooth=0.012):
    """Curva di frequenza da punti (tempo, Hz) con raccordi morbidi."""
    x = t_(dur)
    ts, fs = zip(*points)
    f = np.interp(x, ts, fs)
    k = max(1, int(smooth * SR))
    return np.convolve(np.pad(f, (k, k), mode='edge'), np.ones(k) / k, mode='same')[k:-k]


def echo(x, delay=0.16, fb=0.35, taps=4):
    y = np.concatenate([x, np.zeros(int(delay * SR * taps))])
    for i in range(1, taps + 1):
        place(y, x * (fb ** i), delay * i)
    return y


# ------------------------------------------------------------------ effetti con strumenti campionati
def sf_render(name, notes, program, drum=False, gain=0.7, tail=1.2):
    """notes: [(inizio_s, nota_midi, velocity, durata_s)]"""
    mid = mido.MidiFile(ticks_per_beat=480)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage('set_tempo', tempo=500000))  # 960 tick al secondo
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
                    '-o', 'synth.reverb.room-size=0.45', '-F', w, SF2, p], check=True, capture_output=True)
    with wave.open(w) as f:
        d = np.frombuffer(f.readframes(f.getnframes()), dtype=np.int16).reshape(-1, 2).astype(float) / 32768
    return d.mean(1)


def M(s):
    names = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}
    return names[s[:-1]] + (int(s[-1]) + 1) * 12


GM = dict(celesta=8, glock=9, vibes=11, marimba=12, xylo=13, bells=14, harp=46, trumpet=56, brass=61, horns=60, timp=47, kalimba=108)
CRASH, SNARE, WOOD = 49, 38, 76


def sfx_musical():
    out = {}
    # tocco su un pulsante: marimba + legnetto (come il menu, ma più "giocattolo")
    out['pop'] = mix(sf_render('pop_m', [(0, M('G5'), 100, 0.12)], GM['marimba'], tail=0.4),
                     0.5 * sf_render('pop_w', [(0, WOOD, 70, 0.05)], 0, drum=True, tail=0.3))
    # stellina che entra nella barra: glockenspiel + celesta
    out['star'] = mix(sf_render('star_g', [(0, M('C7'), 96, 0.3)], GM['glock'], tail=0.8),
                      0.6 * sf_render('star_c', [(0.04, M('G7'), 80, 0.3)], GM['celesta'], tail=0.8))
    # gattino salvo: glissando d'arpa e celesta
    pent = ['F5', 'G5', 'A5', 'C6', 'D6', 'F6', 'G6', 'A6']
    out['hearts'] = mix(sf_render('h_h', [(i * 0.04, M(x), 72 + i * 3, 0.7) for i, x in enumerate(pent)], GM['harp'], tail=1.0),
                        0.7 * sf_render('h_c', [(0.3, M('C7'), 84, 0.5), (0.4, M('F7'), 80, 0.5)], GM['celesta'], tail=1.0))
    # livello completato: fanfara di trombe ("ta-ta-ta taaa"), ottoni, timpani e piatto
    tri = [(0, 'C5'), (0.12, 'C5'), (0.24, 'C5'), (0.38, 'F5')]
    tp = sf_render('fan_t', [(st, M(x), 110, 0.11 if i < 3 else 0.9) for i, (st, x) in enumerate(tri)]
                   + [(0.38, M('A5'), 100, 0.9), (0.38, M('C6'), 96, 0.9)], GM['trumpet'], tail=1.0)
    br = sf_render('fan_b', [(0.38, M('F3'), 96, 0.9), (0.38, M('C4'), 92, 0.9), (0.38, M('A4'), 90, 0.9)], GM['brass'], tail=1.0)
    ti = sf_render('fan_ti', [(0, M('C3'), 70, 0.1), (0.24, M('C3'), 84, 0.1), (0.38, M('F2'), 110, 0.6)], GM['timp'], tail=1.0)
    cr = sf_render('fan_cr', [(0.38, CRASH, 90, 0.5)], 0, drum=True, tail=1.2)
    sn = sf_render('fan_sn', [(i * 0.03, SNARE, 40 + i * 5, 0.03) for i in range(12)], 0, drum=True, tail=0.3)
    out['fanfare'] = mix(tp, 0.7 * br, 0.8 * ti, 0.45 * cr, 0.35 * sn)
    # medaglia: campana tubolare + arpeggio di glockenspiel + vibrafono
    out['medal'] = mix(sf_render('m_b', [(0, M('F5'), 96, 1.2)], GM['bells'], tail=1.4),
                       0.8 * sf_render('m_g', [(0.08 + i * 0.08, M(x), 90, 0.4) for i, x in enumerate(['F6', 'A6', 'C7', 'F7'])], GM['glock'], tail=1.2),
                       0.5 * sf_render('m_v', [(0, M('A5'), 80, 1.0), (0, M('C6'), 80, 1.0)], GM['vibes'], tail=1.2))
    # camion rosa: campanella da camion dei pompieri d'epoca, a melodia
    bell = ['C6', 'E6', 'G6', 'E6', 'C6']
    out['siren_tune'] = mix(sf_render('tune_v', [(i * 0.17, M(x), 100, 0.25) for i, x in enumerate(bell)], GM['vibes'], tail=0.8),
                            0.6 * sf_render('tune_g', [(i * 0.17, M(x) + 12, 80, 0.2) for i, x in enumerate(bell)], GM['glock'], tail=0.8))
    return out


# ------------------------------------------------------------------ effetti fisici (sintesi offline)
def sfx_physical():
    out = {}

    # getto d'acqua: soffio sotto pressione che parte, resta teso e si stacca (~0,65 s come jet.ts),
    # più lo spruzzo quando l'acqua arriva sul bersaglio (dopo 0,2 s)
    d = 0.7
    hiss = biquad(biquad(noise(d), 'bp', 1900, 0.6), 'hp', 500) * adsr(d, 0.06, 0.25, 1.4)
    body = biquad(noise(d), 'lp', 380) * adsr(d, 0.05, 0.3) * 0.8
    gurgle = np.sin(2 * np.pi * np.cumsum(220 + 60 * np.sin(2 * np.pi * 23 * t_(d))) / SR) * adsr(d, 0.08, 0.3) * 0.12
    splash = biquad(noise(0.35), 'bp', 3200, 0.9) * env(int(0.35 * SR), 0.004, 0.22)
    drops = np.zeros(int(0.4 * SR))
    for at in [0.02, 0.07, 0.11, 0.18, 0.24, 0.29]:
        f = rng.uniform(900, 1700)
        place(drops, rng.uniform(0.3, 0.6) * np.sin(2 * np.pi * np.cumsum(np.linspace(f, f * 1.8, int(0.03 * SR))) / SR) * env(int(0.03 * SR), 0.002, 0.02), at)
    y = np.zeros(int(0.95 * SR))
    place(y, mix(0.75 * hiss, body, gurgle), 0)
    place(y, mix(0.6 * splash, 0.5 * drops), 0.2)
    out['spray'] = reverb(y, 0.12)

    # fiamma spenta: "pssshh" di vapore che si spegne, sfrigolio che si dirada, poi due note che salgono
    d = 0.9
    steam = track_filter(noise(d), 'lp', np.geomspace(7000, 1400, int(d * SR)), 0.8) * adsr(d, 0.02, 0.6, 1.5)
    steam = biquad(steam, 'hp', 900)
    crackle = np.zeros(int(d * SR))
    for _ in range(70):
        at = rng.uniform(0, 0.45) ** 1.6
        c = biquad(noise(0.005), 'bp', rng.uniform(2000, 6000), 2) * env(int(0.005 * SR), 0.0005, 0.003)
        place(crackle, c * rng.uniform(0.3, 1) * (1 - at / 0.5), at)
    chime = mix(sf_render('ext_a', [(0, M('E6'), 86, 0.15)], GM['glock'], tail=0.6),
                np.concatenate([np.zeros(int(0.09 * SR)), sf_render('ext_b', [(0, M('A6'), 92, 0.3)], GM['glock'], tail=0.7)]))
    y = np.zeros(int(1.3 * SR))
    place(y, mix(0.8 * steam, 0.5 * crackle), 0)
    place(y, 0.75 * chime, 0.14)
    out['extinguish'] = reverb(y, 0.12)

    # fiammella che si accende: "fuump" morbido e qualche scoppiettio, più un blip di marimba (simpatico, mai paura)
    d = 0.45
    fw = track_filter(noise(d), 'lp', np.geomspace(300, 2200, int(d * SR)), 0.9) * np.sin(np.pi * np.minimum(1, t_(d) / d)) ** 2
    thump = np.sin(2 * np.pi * np.cumsum(np.linspace(110, 60, int(0.2 * SR))) / SR) * env(int(0.2 * SR), 0.01, 0.12)
    pops = np.zeros(int(d * SR))
    for at in [0.12, 0.2, 0.27, 0.33]:
        place(pops, biquad(noise(0.006), 'bp', rng.uniform(1500, 3500), 3) * env(int(0.006 * SR), 0.0005, 0.004) * 0.8, at)
    blip = sf_render('fl_m', [(0, M('C5'), 70, 0.08), (0.07, M('G5'), 80, 0.12)], GM['marimba'], tail=0.4)
    y = np.zeros(int(0.8 * SR))
    place(y, mix(0.7 * fw, 0.5 * thump, 0.5 * pops), 0)
    place(y, 0.5 * blip, 0.05)
    out['flameAppear'] = reverb(y, 0.14)

    # scala che si allunga: scatti metallici a cricchetto che salgono (~0,95 s) e una scaletta di xilofono
    y = np.zeros(int(1.2 * SR))
    for i in range(10):
        at = 0.05 + i * 0.088
        ring = sum(a * np.sin(2 * np.pi * f * (1 + i * 0.02) * t_(0.05)) for f, a in [(2100, 1), (3350, 0.6), (5200, 0.35)])
        click = biquad(noise(0.008), 'bp', 4200, 2) * env(int(0.008 * SR), 0.0005, 0.005)
        place(y, mix(0.5 * ring * env(int(0.05 * SR), 0.001, 0.025), 0.7 * click), at)
    scale = ['C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6']
    xy = sf_render('lad_x', [(0.05 + i * 0.11, M(x), 62 + i * 4, 0.1) for i, x in enumerate(scale)], GM['xylo'], tail=0.4)
    out['ladder'] = reverb(mix(y, 0.55 * xy), 0.1)

    # passaggio veloce (camion nuovo che entra)
    d = 0.5
    out['whoosh'] = reverb(track_filter(noise(d), 'bp', np.geomspace(300, 2400, int(d * SR)), 0.9) * np.sin(np.pi * t_(d) / d) ** 2, 0.1)

    # miagolio di gattino: sorgente armonica con altezza che sale e scende, filtrata da formanti che
    # passano da "m" a "i", "a", "u" (sintesi sorgente-filtro, come una piccola voce)
    d = 0.62
    f0 = glide([(0, 640), (0.16, 980), (0.3, 1020), (0.62, 600)], d, 0.03) * (1 + 0.012 * np.sin(2 * np.pi * 7 * t_(d)))
    src = tone(f0, [1 / k ** 1.15 for k in range(1, 14)], phase_noise=2.0) + 0.04 * noise(d)
    x = t_(d)

    def curve(points):
        return np.interp(x, *zip(*points))
    F1 = curve([(0, 380), (0.1, 650), (0.28, 1050), (0.62, 520)])
    F2 = curve([(0, 1300), (0.1, 2400), (0.28, 1800), (0.62, 1000)])
    F3 = curve([(0, 2900), (0.62, 3100)])
    voice = (track_filter(src, 'bp', F1, 4) + 0.8 * track_filter(src, 'bp', F2, 6) + 0.35 * track_filter(src, 'bp', F3, 8))
    amp = np.interp(x, [0, 0.04, 0.1, 0.45, 0.62], [0, 0.45, 1, 0.8, 0]) ** 1.2
    out['meow'] = reverb(voice * amp, 0.1)

    # --- sirene dei camion (ognuno la sua). Timbro da tromba elettrica: armoniche + formante di "corno".
    def horn(freq, dur, bright=1.0):
        s = tone(freq, [1, 0.75 * bright, 0.55 * bright, 0.4 * bright, 0.3 * bright, 0.2 * bright, 0.14 * bright, 0.1 * bright])
        s = 0.6 * s + 0.7 * biquad(s, 'bp', 1400, 1.2)
        return s * adsr(dur, 0.02, 0.08)

    # rosso: bitonale europea (la–re), "ni-no ni-no"
    pts, t = [], 0.0
    for i in range(4):
        f = 440 if i % 2 == 0 else 587
        pts += [(t, f), (t + 0.29, f)]
        t += 0.3
    out['siren_hilo'] = reverb(horn(glide(pts, 1.2, 0.015), 1.2), 0.18)
    # giallo: sirena che sale e scende (wail)
    f = glide([(0, 480), (0.55, 1180), (0.65, 1180), (1.25, 500)], 1.25, 0.04)
    out['siren_wail'] = reverb(tone(f, [1, 0.3, 0.12, 0.05]) * adsr(1.25, 0.05, 0.15), 0.2)
    # blu: yelp, sirena veloce
    pts = []
    for i in range(5):
        pts += [(i * 0.2, 620), (i * 0.2 + 0.17, 1350)]
    f = glide(pts, 1.0, 0.006)
    out['siren_yelp'] = reverb(tone(f, [1, 0.35, 0.15, 0.06]) * adsr(1.0, 0.02, 0.06), 0.18)
    # verde: trombe ad aria del camion, due colpi ("pa-paaa")
    def airhorn(dur):
        freqs = [233.1, 293.7, 349.2]
        s = sum(tone(glide([(0, f * 0.96), (0.05, f), (dur, f)], dur), [1 / k for k in range(1, 20)]) for f in freqs)
        s = biquad(biquad(s, 'lp', 2600), 'hp', 160)
        return s * adsr(dur, 0.015, 0.06)
    y = np.zeros(int(0.95 * SR))
    place(y, airhorn(0.24), 0)
    place(y, airhorn(0.5), 0.32)
    out['siren_honk'] = reverb(y, 0.16)
    # viola: sirena "spaziale" tipo theremin con eco
    f = glide([(0, 320), (0.5, 1100), (0.7, 900), (1.0, 1250), (1.2, 700)], 1.2, 0.05) * (1 + 0.02 * np.sin(2 * np.pi * 6.5 * t_(1.2)))
    th = tone(f, [1, 0.08, 0.03]) * adsr(1.2, 0.08, 0.25)
    out['siren_space'] = reverb(echo(th, 0.17, 0.33, 3), 0.2)
    return out


MAXLEN = dict(pop=0.4, star=1.0, hearts=1.6, fanfare=2.0, medal=2.0, siren_tune=1.6, spray=1.0, extinguish=1.4,
              flameAppear=0.8, ladder=1.3, whoosh=0.7, meow=0.9, siren_hilo=1.5, siren_wail=1.5, siren_yelp=1.3,
              siren_honk=1.2, siren_space=2.0)
PEAK = dict(spray=0.7, flameAppear=0.6, whoosh=0.6, meow=0.75, siren_hilo=0.7, siren_wail=0.65, siren_yelp=0.65,
            siren_honk=0.75, siren_space=0.65)


def finish(x, name):
    x = np.asarray(x, dtype=float)
    # taglia il silenzio iniziale e finale (sotto -50 dB), lunghezza massima e dissolvenza in uscita
    thr = 10 ** (-50 / 20) * np.max(np.abs(x))
    idx = np.where(np.abs(x) > thr)[0]
    if len(idx):
        x = x[max(0, idx[0] - 30):idx[-1] + 1]
    x = x[:int(MAXLEN.get(name, 1.5) * SR)].copy()
    f = min(len(x), int(0.2 * SR) if len(x) > 0.8 * SR else int(0.04 * SR))
    x[-f:] *= np.linspace(1, 0, f) ** 2
    return x * (PEAK.get(name, 0.8) / (np.max(np.abs(x)) or 1))


def write(name, x):
    w = os.path.join(TMP, name + '.wav')
    with wave.open(w, 'wb') as f:
        f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR)
        f.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', w, '-c:a', 'libmp3lame', '-b:a', '96k',
                    os.path.join(OUT, f'sfx_{name}.mp3')], check=True)


if __name__ == '__main__':
    os.makedirs(TMP, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)
    allfx = {**sfx_musical(), **sfx_physical()}
    for k, v in allfx.items():
        y = finish(v, k)
        write(k, y)
        print(f'{k:12s} {len(y) / SR:.2f} s')
