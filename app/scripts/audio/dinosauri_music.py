"""
Scavo dei Dinosauri — musica di sottofondo ("Avventura nello scavo").

Avventura giocosa in Re minore / Fa maggiore, 4/4 a 120 bpm: marimba (ostinato e melodia), fagotto (melodia furtiva
e basso saltellante), archi pizzicati, xilofono per le scintille e percussioni di legno (wood block, claves, bonghi, maracas).
Composizione originale scritta qui come partitura, esportata in MIDI e suonata con strumenti campionati
(MuseScore General, licenza MIT) tramite FluidSynth. Loop esatto di 64 secondi senza stacchi.

Uso (dalla cartella app/):
    sudo apt-get install fluidsynth musescore-general-soundfont-lossless ffmpeg
    pip install mido numpy
    python3 scripts/audio/dinosauri_music.py

Scrive src/games/dinosauri/audio/theme.ogg e theme.mp3 (+ theme.mid per riferimento).
"""
import os, random, subprocess
import mido
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, '..', '..', 'src', 'games', 'dinosauri', 'audio'))
TMP = '/tmp/dinosauri-audio'
SF2 = os.environ.get('SF2', '/usr/share/sounds/sf2/MuseScore_General_Full.sf2')
BPM = 120
TPB = 480                      # tick per battito
BAR = 4 * TPB                  # 4/4
random.seed(3)

NOTE = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}


def n(s):
    """'C5' -> numero MIDI."""
    name, octv = s[:-1], int(s[-1])
    return NOTE[name] + (octv + 1) * 12


CH = {
    'Dm': ('D', [0, 3, 7]), 'Gm': ('G', [0, 3, 7]), 'A7': ('A', [0, 4, 7, 10]), 'Bb': ('Bb', [0, 4, 7]),
    'F': ('F', [0, 4, 7]), 'C': ('C', [0, 4, 7]), 'E7': ('E', [0, 4, 7, 10]), 'C7': ('C', [0, 4, 7, 10]),
}


def tones(chord, low, high):
    root, iv = CH[chord]
    out = []
    for o in range(0, 9):
        for i in iv:
            m = NOTE[root] + i + o * 12
            if low <= m <= high:
                out.append(m)
    return sorted(out)


def root_of(chord, octave=2):
    return NOTE[CH[chord][0]] + (octave + 1) * 12


# --- Partitura: ogni battuta = accordo o "A|B" (2+2 battiti); melodie (nota|None, battiti) ----------
A_CHORDS = ['Dm', 'Dm', 'Gm', 'A7', 'Dm', 'Bb', 'Gm|A7', 'Dm']
A_MEL = [  # fagotto, furtivo e saltellante
    [('D3', .5), ('F3', .5), ('A3', .5), (None, .5), ('A3', .5), ('G3', .5), ('F3', .5), ('E3', .5)],
    [('D3', 1), (None, .5), ('A2', .5), ('D3', .5), ('E3', .5), ('F3', 1)],
    [('G3', .5), ('Bb3', .5), ('D4', .5), (None, .5), ('D4', .5), ('C4', .5), ('Bb3', .5), ('A3', .5)],
    [('A3', 1.5), ('G3', .5), ('E3', 1), ('C#3', 1)],
    [('D3', .5), ('F3', .5), ('A3', .5), ('D4', .5), ('C4', .5), ('A3', .5), ('F3', .5), ('A3', .5)],
    [('Bb3', 1), ('A3', .5), ('G3', .5), ('F3', 1), ('D3', 1)],
    [('G3', .5), ('A3', .5), ('Bb3', .5), ('G3', .5), ('A3', 1), ('C#4', 1)],
    [('D4', 1.5), ('A3', .5), ('D3', 1), (None, 1)],
]
B_CHORDS = ['F', 'C', 'Bb', 'F', 'Gm', 'Dm', 'E7', 'A7']
B_MEL = [  # marimba, aperta e luminosa
    [('A5', .5), ('C6', .5), ('A5', .5), ('F5', .5), ('G5', 1), ('A5', 1)],
    [('G5', .5), ('E5', .5), ('C5', 1), ('E5', .5), ('G5', .5), ('C6', 1)],
    [('D6', 1), ('C6', .5), ('Bb5', .5), ('A5', 1), ('F5', 1)],
    [('A5', .5), ('G5', .5), ('F5', .5), ('G5', .5), ('A5', 2)],
    [('Bb5', .5), ('A5', .5), ('G5', .5), ('A5', .5), ('Bb5', 1), ('D6', 1)],
    [('A5', 1), ('F5', .5), ('A5', .5), ('D6', 2)],
    [('B5', .5), ('G#5', .5), ('E5', .5), ('G#5', .5), ('B5', 1), ('D6', 1)],
    [('C#6', 1), ('A5', .5), ('E5', .5), ('G5', 1), ('A5', 1)],
]
C_CHORDS = ['Bb', 'F', 'Gm', 'Dm', 'Bb', 'C', 'A7', 'A7']
C_MEL = [  # archi pizzicati
    [('F5', 1), ('D5', 1), ('Bb4', 1), ('D5', 1)],
    [('C5', 1), ('F5', 1), ('A5', 2)],
    [('G5', 1), ('Bb5', 1), ('D6', 1), ('Bb5', 1)],
    [('A5', 2), ('F5', 1), ('D5', 1)],
    [('D5', .5), ('F5', .5), ('Bb5', 1), ('A5', 1), ('G5', 1)],
    [('E5', .5), ('G5', .5), ('C6', 1), ('Bb5', 1), ('G5', 1)],
    [('A5', 1), ('G5', 1), ('E5', 1), ('C#5', 1)],
    [('A4', .5), ('C#5', .5), ('E5', .5), ('G5', .5), ('A5', 1), (None, 1)],
]
SECTIONS = [('A', A_CHORDS, A_MEL), ('B', B_CHORDS, B_MEL), ('A2', A_CHORDS, A_MEL), ('C', C_CHORDS, C_MEL)]

CHN = dict(marimba=0, bassoon=1, pizz=2, xylo=3, strings=4, bass=5, drums=9)
PROG = dict(marimba=12, bassoon=70, pizz=45, xylo=13, strings=48, bass=45)
VOLS = dict(marimba=104, bassoon=100, pizz=96, xylo=74, strings=58, bass=100, drums=84)
PANS = dict(marimba=46, bassoon=72, pizz=84, xylo=34, strings=64, bass=60, drums=64)

# percussioni General MIDI
HI_BLOCK, LO_BLOCK, CLAVES, MARACAS, HI_BONGO, LO_BONGO, GUIRO = 76, 77, 75, 70, 60, 61, 73


class Score:
    def __init__(self):
        self.ev = []   # (tick, ch, note, vel, dur)

    def note(self, ch, t, note, vel, dur, human=True):
        if human:
            t += random.randint(-6, 6)
            vel = max(1, min(127, vel + random.randint(-5, 5)))
        self.ev.append((max(0, t), CHN[ch], note, vel, max(30, dur)))


def chords_of(spec):
    if '|' in spec:
        a, b = spec.split('|')
        return [(a, 0, 2), (b, 2, 2)]
    return [(spec, 0, 4)]


def compose():
    s = Score()
    t0 = 0
    for name, chords, mel in SECTIONS:
        for i, spec in enumerate(chords):
            bt = t0 + i * BAR
            last_bar = i == len(chords) - 1
            # --- basso pizzicato (A, A2, C) o fagotto "oom-pah" (B): fondamentale e quinta
            for ch, st, beats in chords_of(spec):
                r = root_of(ch, 2)
                if r > n('E2'):
                    r -= 12
                for b in range(st, st + beats, 2):
                    note = r if (b - st) % 4 == 0 else r + 7
                    if name == 'B':
                        s.note('bassoon', bt + b * TPB, note + 12, 74, int(TPB * 0.7))
                    else:
                        s.note('bass', bt + b * TPB, note, 96, int(TPB * 0.9))
            # --- ostinato della marimba a crome (non nella B, dove canta la melodia)
            if name != 'B':
                for ch, st, beats in chords_of(spec):
                    tn = tones(ch, n('D4'), n('A5'))
                    pat = [0, 2, 3, 2, 1, 2, 3, 2]
                    for k in range(beats * 2):
                        idx = min(len(tn) - 1, pat[k % len(pat)])
                        vel = (62 if k % 2 == 0 else 48) - (10 if name == 'C' else 0)
                        s.note('marimba', bt + st * TPB + k * TPB // 2, tn[idx], vel, TPB // 2)
            else:
                # nella B: pizzicati in levare
                for ch, st, beats in chords_of(spec):
                    for b in range(st, st + beats):
                        for v in tones(ch, n('A3'), n('F4')):
                            s.note('pizz', bt + b * TPB + TPB // 2, v, 54, TPB // 3)
            # --- melodia
            t = bt
            for note_, beats in mel[i]:
                dur = int(beats * TPB)
                if note_:
                    m = n(note_)
                    acc = 8 if t == bt else 0
                    if name == 'A':
                        s.note('bassoon', t, m, 92 + acc, int(dur * (0.55 if beats <= .5 else 0.85)))
                    elif name == 'A2':
                        s.note('bassoon', t, m, 90 + acc, int(dur * (0.55 if beats <= .5 else 0.85)))
                        s.note('marimba', t, m + 24, 70 + acc, dur)
                    elif name == 'B':
                        s.note('marimba', t, m, 92 + acc, dur)
                        if beats >= 1:
                            s.note('xylo', t, m + 12, 40, dur // 2)
                    else:
                        s.note('pizz', t, m, 96 + acc, int(dur * 0.6))
                t += dur
            # --- tappeto d'archi leggero nel ponte
            if name == 'C':
                for ch, st, beats in chords_of(spec):
                    for v in tones(ch, n('F3'), n('D4')):
                        s.note('strings', bt + st * TPB, v, 40, beats * TPB - 30, human=False)
                if i % 2 == 0:
                    s.note('bassoon', bt, root_of(chords_of(spec)[0][0], 3), 60, BAR - 60)
            # --- scintille di xilofono a inizio frase nella ripresa
            if name == 'A2' and i % 2 == 0:
                for k, v in enumerate(tones(chords_of(spec)[0][0], n('D6'), n('D7'))[:4]):
                    s.note('xylo', bt + k * TPB // 6, v, 52 + k * 6, TPB // 2)
            # --- percussioni di legno
            soft = 0.7 if name == 'C' else 1.0
            s.note('drums', bt, LO_BLOCK, int(70 * soft), 120)
            s.note('drums', bt + 2 * TPB, LO_BLOCK, int(62 * soft), 120)
            for b in (1, 3):
                s.note('drums', bt + b * TPB + TPB // 2, HI_BLOCK, int(64 * soft), 100)
            s.note('drums', bt + TPB, CLAVES, int(50 * soft), 100)
            s.note('drums', bt + 3 * TPB, CLAVES, int(50 * soft), 100)
            for k in range(8):
                s.note('drums', bt + k * TPB // 2, MARACAS, int((34 if k % 2 else 24) * soft), 80)
            if name == 'B' and i % 4 == 3:
                s.note('drums', bt + 3 * TPB, GUIRO, 60, 200)
            if last_bar:   # rullata di bonghi verso la sezione successiva
                for k, nt in enumerate([HI_BONGO, HI_BONGO, LO_BONGO, HI_BONGO, LO_BONGO, LO_BONGO]):
                    s.note('drums', bt + 2 * TPB + k * TPB // 3, nt, 60 + k * 6, 100)
        t0 += len(chords) * BAR
    return s, t0


def write_midi(s, total, path, tail_bars=2):
    mid = mido.MidiFile(ticks_per_beat=TPB)
    meta = mido.MidiTrack()
    meta.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(BPM)))
    meta.append(mido.MetaMessage('time_signature', numerator=4, denominator=4))
    mid.tracks.append(meta)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    msgs = []
    vols = VOLS
    for k, c in CHN.items():
        if k != 'drums':
            msgs.append((0, 0, mido.Message('program_change', channel=c, program=PROG[k])))
        msgs.append((0, 1, mido.Message('control_change', channel=c, control=7, value=vols[k])))
        msgs.append((0, 1, mido.Message('control_change', channel=c, control=91, value=70)))  # riverbero
        msgs.append((0, 1, mido.Message('control_change', channel=c, control=93, value=12)))  # chorus
        pan = PANS[k]
        msgs.append((0, 1, mido.Message('control_change', channel=c, control=10, value=pan)))
    for t, c, note, vel, dur in s.ev:
        msgs.append((t, 3, mido.Message('note_on', channel=c, note=note, velocity=vel)))
        msgs.append((t + dur, 2, mido.Message('note_off', channel=c, note=note, velocity=0)))
    end = total + tail_bars * BAR
    msgs.append((end, 9, mido.MetaMessage('end_of_track')))
    msgs.sort(key=lambda x: (x[0], x[1]))
    last = 0
    for t, _, m in msgs:
        m.time = t - last
        last = t
        tr.append(m)
    mid.save(path)


def render(mid_path, wav_path):
    subprocess.run(['fluidsynth', '-ni', '-q', '-r', '44100', '-g', '0.6',
                    '-o', 'synth.reverb.room-size=0.62', '-o', 'synth.reverb.damp=0.35', '-o', 'synth.reverb.width=0.9',
                    '-o', 'synth.reverb.level=0.55', '-o', 'synth.chorus.active=1',
                    '-F', wav_path, SF2, mid_path], check=True)


def make_loop(wav_in, loop_seconds, wav_out):
    """Ripiega la coda (riverbero oltre la fine del loop) sull'inizio: il loop non ha stacchi."""
    import wave
    with wave.open(wav_in) as w:
        sr, ch = w.getframerate(), w.getnchannels()
        data = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).reshape(-1, ch).astype(np.float32)
    L = int(round(loop_seconds * sr))
    loop = data[:L].copy()
    tail = data[L:]
    k = min(len(tail), L)
    loop[:k] += tail[:k]
    peak = np.max(np.abs(loop)) or 1
    loop *= (0.89 * 32767) / peak
    with wave.open(wav_out, 'wb') as w:
        w.setnchannels(ch); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes(loop.astype(np.int16).tobytes())
    return L, sr


def lufs(wav):
    """Loudness integrata (EBU R128) misurata con ffmpeg."""
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', wav, '-af', 'ebur128', '-f', 'null', '-'],
                       capture_output=True, text=True)
    line = [l for l in r.stderr.splitlines() if l.strip().startswith('I:')][-1]
    return float(line.split()[1])


def encode(wav, base, target=-18.0):
    """Guadagno fisso (niente compressione dinamica: il loop resta identico all'inizio e alla fine)."""
    gain = target - lufs(wav)
    af = f'volume={gain:.2f}dB,alimiter=limit=0.89:level=false'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-af', af, '-c:a', 'libvorbis', '-q:a', '3', base + '.ogg'], check=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-af', af, '-c:a', 'libmp3lame', '-b:a', '112k', base + '.mp3'], check=True)


if __name__ == '__main__':
    os.makedirs(TMP, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)
    score, total = compose()
    mid = os.path.join(OUT, 'theme.mid')
    write_midi(score, total, mid)
    raw = os.path.join(TMP, 'theme_raw.wav')
    render(mid, raw)
    seconds = total / TPB * 60 / BPM
    L, sr = make_loop(raw, seconds, os.path.join(TMP, 'theme_loop.wav'))
    encode(os.path.join(TMP, 'theme_loop.wav'), os.path.join(OUT, 'theme'))
    print(f'loop: {seconds:.2f} s, {L} campioni a {sr} Hz -> {OUT}/theme.ogg|mp3')
