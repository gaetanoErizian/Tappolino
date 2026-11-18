"""
Cacchino — musica di sottofondo ("La banda delle puzzette").

Polka buffa in Do maggiore, 4/4 a 120 bpm: tuba (basso um-pa), trombone (melodia), fisarmonica (accordi in levare),
xilofono (seconda melodia) e batteria leggera con wood block. Composizione originale scritta qui come partitura,
esportata in MIDI e suonata con strumenti campionati (MuseScore General, licenza MIT) tramite FluidSynth.
Loop esatto di 48 secondi (24 battute) senza stacchi.

Uso (dalla cartella app/):
    sudo apt-get install fluidsynth musescore-general-soundfont-lossless ffmpeg
    pip install mido numpy
    python3 scripts/audio/cacchino_music.py

Scrive src/games/cacchino/audio/theme.ogg e theme.mp3 (+ theme.mid per riferimento).
"""
import os, random, subprocess
import mido
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, '..', '..', 'src', 'games', 'cacchino', 'audio'))
TMP = '/tmp/cacchino-audio'
SF2 = os.environ.get('SF2', '/usr/share/sounds/sf2/MuseScore_General_Full.sf2')
BPM = 120
TPB = 480                      # tick per battito
BAR = 4 * TPB                  # 4/4
random.seed(11)

NOTE = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}


def n(s):
    """'C5' -> numero MIDI."""
    name, octv = s[:-1], int(s[-1])
    return NOTE[name] + (octv + 1) * 12


CH = {'C': ('C', [0, 4, 7]), 'F': ('F', [0, 4, 7]), 'G7': ('G', [0, 4, 7, 10]), 'Am': ('A', [0, 3, 7]), 'Dm': ('D', [0, 3, 7])}


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


# --- Partitura: ogni battuta = un accordo; melodie (nota|None, battiti) ----------
A_CHORDS = ['C', 'C', 'G7', 'C', 'F', 'C', 'G7', 'C']
A_MEL = [  # trombone: saltellante, un po' spaccone
    [('E4', .5), ('G4', .5), ('C5', 1), ('G4', 1), ('E4', 1)],
    [('G4', .5), ('A4', .5), ('G4', 1), ('E4', 1), ('C4', 1)],
    [('D4', .5), ('F4', .5), ('B4', 1), ('A4', .5), ('G4', .5), ('F4', 1)],
    [('E4', 1.5), ('G4', .5), ('C5', 1), (None, 1)],
    [('A4', .5), ('C5', .5), ('F5', 1), ('C5', 1), ('A4', 1)],
    [('G4', .5), ('E4', .5), ('C4', 1), ('E4', 1), ('G4', 1)],
    [('B4', .5), ('A4', .5), ('G4', .5), ('F4', .5), ('D4', 1), ('G4', 1)],
    [('C4', 1), ('E4', 1), ('C4', 1), (None, 1)],
]
B_CHORDS = ['F', 'F', 'C', 'C', 'G7', 'G7', 'C', 'G7']
B_MEL = [  # xilofono: allegro e svelto
    [('F5', .5), ('A5', .5), ('C6', .5), ('A5', .5), ('F5', 1), ('A5', 1)],
    [('C6', 1), ('A5', .5), ('F5', .5), ('A5', 1), ('C6', 1)],
    [('E5', .5), ('G5', .5), ('C6', .5), ('G5', .5), ('E5', 1), ('G5', 1)],
    [('C6', 1), ('G5', .5), ('E5', .5), ('G5', 2)],
    [('D5', .5), ('G5', .5), ('B5', .5), ('G5', .5), ('F5', 1), ('D5', 1)],
    [('B5', 1), ('A5', .5), ('G5', .5), ('F5', 1), ('D5', 1)],
    [('E5', .5), ('G5', .5), ('C6', 1), ('E6', 1), ('C6', 1)],
    [('B5', 1), ('G5', 1), ('D5', 1), ('G5', 1)],
]
B_COUNTER = [  # trombone nella B: note lunghe e pacioccone
    [('A3', 2), ('C4', 2)], [('F3', 4)], [('G3', 2), ('E3', 2)], [('C4', 4)],
    [('B3', 2), ('D4', 2)], [('G3', 4)], [('E3', 2), ('G3', 2)], [('D4', 2), ('B3', 2)],
]
SECTIONS = [('A', A_CHORDS, A_MEL), ('B', B_CHORDS, B_MEL), ('A2', A_CHORDS, A_MEL)]

CHN = dict(tuba=0, trombone=1, accordion=2, xylo=3, drums=9)
PROG = dict(tuba=58, trombone=57, accordion=21, xylo=13)
VOLS = dict(tuba=108, trombone=96, accordion=62, xylo=84, drums=74)
PANS = dict(tuba=64, trombone=48, accordion=84, xylo=72, drums=64)
KICK, SNARE, HAT, WOOD_HI, WOOD_LO = 36, 38, 42, 76, 77


class Score:
    def __init__(self):
        self.ev = []   # (tick, ch, note, vel, dur)

    def note(self, ch, t, note, vel, dur, human=True):
        if human:
            t += random.randint(-5, 5)
            vel = max(1, min(127, vel + random.randint(-5, 5)))
        self.ev.append((max(0, t), CHN[ch], note, vel, max(30, dur)))


def compose():
    s = Score()
    t0 = 0
    for name, chords, mel in SECTIONS:
        for i, ch in enumerate(chords):
            bt = t0 + i * BAR
            # --- tuba: um (fondamentale) ... um (quinta)
            r = root_of(ch, 1)
            if r < n('F1'):
                r += 12
            s.note('tuba', bt, r, 100, int(TPB * 0.8))
            s.note('tuba', bt + 2 * TPB, r + 7 if r + 7 <= n('D3') else r - 5, 94, int(TPB * 0.8))
            if i % 4 == 3:  # passaggio verso la battuta dopo
                s.note('tuba', bt + 3 * TPB + TPB // 2, r + 2, 80, TPB // 2 - 20)
            # --- fisarmonica: pa (accordo corto in levare)
            tri = tones(ch, n('G3'), n('E5'))[:4]
            for b in (1, 3):
                for m in tri[-3:]:
                    s.note('accordion', bt + b * TPB, m, 60, int(TPB * 0.38))
            # --- batteria leggera
            for b in range(4):
                s.note('drums', bt + b * TPB, KICK if b % 2 == 0 else SNARE, 78 if b % 2 == 0 else 58, 100, human=False)
                s.note('drums', bt + b * TPB + TPB // 2, HAT, 38, 60)
            if i % 4 == 3:
                for k, w in enumerate((WOOD_HI, WOOD_LO, WOOD_HI)):
                    s.note('drums', bt + 3 * TPB + k * TPB // 3, w, 70, 60)
            # --- melodia
            t = bt
            for note_, beats in mel[i]:
                dur = int(beats * TPB)
                if note_:
                    m = n(note_)
                    acc = 8 if t == bt else 0
                    if name == 'A':
                        s.note('trombone', t, m, 92 + acc, int(dur * (0.7 if beats <= .5 else 0.9)))
                    elif name == 'A2':
                        s.note('trombone', t, m, 90 + acc, int(dur * (0.7 if beats <= .5 else 0.9)))
                        s.note('xylo', t, m + 12, 60 + acc, dur)
                    else:
                        s.note('xylo', t, m, 92 + acc, dur)
                t += dur
            if name == 'B':
                t = bt
                for note_, beats in B_COUNTER[i]:
                    s.note('trombone', t, n(note_), 66, int(beats * TPB) - 40)
                    t += int(beats * TPB)
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
    for k, c in CHN.items():
        if k in PROG:
            msgs.append((0, 0, mido.Message('program_change', channel=c, program=PROG[k])))
        msgs.append((0, 1, mido.Message('control_change', channel=c, control=7, value=VOLS[k])))
        msgs.append((0, 1, mido.Message('control_change', channel=c, control=91, value=52)))  # riverbero
        msgs.append((0, 1, mido.Message('control_change', channel=c, control=10, value=PANS[k])))
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
                    '-o', 'synth.reverb.room-size=0.6', '-o', 'synth.reverb.damp=0.4', '-o', 'synth.reverb.width=0.9',
                    '-o', 'synth.reverb.level=0.5', '-o', 'synth.chorus.active=1',
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
