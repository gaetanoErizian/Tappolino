"""
Treno degli Animali — musica di sottofondo ("Si parte!").

Viaggio in treno in Re maggiore, 4/4 a 120 bpm, con un ritmo country a due tempi: banjo (arpeggi "a rullo" e un
assolo), armonica (melodia), contrabbasso pizzicato (fondamentale e quinta) e spazzole sul rullante che imitano
le rotaie ("ciuf-ciuf" a sedicesimi con l'accento sul 2 e sul 4). Composizione originale scritta qui come partitura,
esportata in MIDI e suonata con strumenti campionati (MuseScore General, licenza MIT) tramite FluidSynth.
Loop esatto di 64 secondi (32 battute) senza stacchi.

Uso (dalla cartella app/):
    sudo apt-get install fluidsynth musescore-general-soundfont-lossless ffmpeg
    pip install mido numpy
    python3 scripts/audio/treno_music.py

Scrive src/games/treno/audio/theme.ogg e theme.mp3 (+ theme.mid per riferimento).
"""
import os, random, subprocess
import mido
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, '..', '..', 'src', 'games', 'treno', 'audio'))
TMP = '/tmp/treno-audio'
SF2 = os.environ.get('SF2', '/usr/share/sounds/sf2/MuseScore_General_Full.sf2')
BPM = 120
TPB = 480                      # tick per battito
BAR = 4 * TPB                  # 4/4
random.seed(9)

NOTE = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}


def n(s):
    """'C5' -> numero MIDI."""
    name, octv = s[:-1], int(s[-1])
    return NOTE[name] + (octv + 1) * 12


CH = {
    'D': ('D', [0, 4, 7]), 'G': ('G', [0, 4, 7]), 'A': ('A', [0, 4, 7]), 'A7': ('A', [0, 4, 7, 10]),
    'E7': ('E', [0, 4, 7, 10]), 'Bm': ('B', [0, 3, 7]),
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


# --- Partitura: ogni battuta = accordo o "X|Y" (2+2 battiti); melodie (nota|None, battiti) ------------
A_CHORDS = ['D', 'D', 'G', 'D', 'D', 'A7', 'A7', 'D']
A_MEL = [
    [('F#4', 1), ('A4', 1), ('D5', 1.5), ('A4', .5)],
    [('B4', .5), ('A4', .5), ('F#4', 1), ('A4', 2)],
    [('B4', 1), ('D5', 1), ('G5', 1.5), ('E5', .5)],
    [('F#5', 1), ('E5', .5), ('D5', .5), ('A4', 2)],
    [('F#4', .5), ('A4', .5), ('D5', 1), ('F#5', 1), ('E5', 1)],
    [('C#5', 1), ('E5', 1), ('A5', 1.5), ('G5', .5)],
    [('E5', 1), ('C#5', .5), ('A4', .5), ('B4', .5), ('C#5', .5), ('E5', 1)],
    [('D5', 2), (None, 1), ('A4', 1)],
]
B_CHORDS = ['G', 'G', 'D', 'D', 'E7', 'E7', 'A', 'A7']
B_MEL = [
    [('B4', 1.5), ('D5', .5), ('G5', 2)],
    [('E5', .5), ('D5', .5), ('B4', 1), ('G4', 2)],
    [('A4', 1.5), ('D5', .5), ('F#5', 2)],
    [('E5', .5), ('D5', .5), ('A4', 1), ('F#4', 2)],
    [('G#4', 1), ('B4', 1), ('E5', 1), ('D5', 1)],
    [('B4', 1), ('G#4', 1), ('E4', 2)],
    [('A4', 1), ('C#5', 1), ('E5', 1), ('A5', 1)],
    [('G5', 1), ('E5', 1), ('C#5', 1), ('A4', 1)],
]
C_CHORDS = ['G', 'D', 'A', 'D', 'G', 'D', 'A7', 'D|A7']
C_MEL = [
    [('D5', 1), ('B4', 1), ('G4', 1), ('B4', 1)],
    [('A4', 1), ('F#4', 1), ('D4', 2)],
    [('E4', 1), ('A4', 1), ('C#5', 1), ('E5', 1)],
    [('F#5', 2), ('D5', 2)],
    [('G5', 1), ('F#5', .5), ('E5', .5), ('D5', 1), ('B4', 1)],
    [('A4', 1), ('D5', 1), ('F#5', 2)],
    [('E5', 1), ('G5', 1), ('E5', 1), ('C#5', 1)],
    [('D5', 2), ('A4', 1), ('C#5', 1)],
]
# A: armonica + rullo di banjo · B: armonica + rullo · A2: assolo di banjo, armonica a note lunghe · C: tutti
SECTIONS = [('A', A_CHORDS, A_MEL), ('B', B_CHORDS, B_MEL), ('A2', A_CHORDS, A_MEL), ('C', C_CHORDS, C_MEL)]

CHN = dict(banjo=0, harmonica=1, bass=2, drums=9)
PROG = dict(banjo=105, harmonica=22, bass=32, drums=40)   # batteria: kit "Brush" (spazzole)
VOLS = dict(banjo=90, harmonica=124, bass=86, drums=84)
PANS = dict(banjo=42, harmonica=82, bass=64, drums=60)
ROLL = [0, 2, 4, 1, 3, 0, 2, 4]  # rullo "in avanti": pollice, indice, medio su note diverse dell'accordo
BRUSH_TAP, BRUSH_SLAP, BRUSH_SWIRL, KICK = 38, 39, 40, 36


class Score:
    def __init__(self):
        self.ev = []   # (tick, ch, note, vel, dur)

    def note(self, ch, t, note, vel, dur, human=True):
        if human:
            t += random.randint(-5, 5)
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
            parts = chords_of(spec)
            # --- banjo: rullo a crome sulle note dell'accordo (tranne nell'assolo)
            if name != 'A2':
                for ch, st, beats in parts:
                    tn = tones(ch, n('G3'), n('D5'))
                    for k in range(beats * 2):
                        tk = bt + st * TPB + k * TPB // 2
                        idx = ROLL[(st * 2 + k) % len(ROLL)] % len(tn)
                        s.note('banjo', tk, tn[idx], 66 if k % 2 == 0 else 50, TPB // 2 + 60)
            # --- contrabbasso: fondamentale sull'1, quinta sul 3, nota di passaggio a fine battuta
            for ch, st, beats in parts:
                r = root_of(ch, 1)
                if r < n('E1'):
                    r += 12
                for b in range(st, st + beats, 2):
                    s.note('bass', bt + b * TPB, r if (b - st) % 4 == 0 else r + 7 - (12 if r + 7 > n('A2') else 0), 96, int(TPB * 0.9))
            if '|' not in spec:
                nxt = chords[(i + 1) % len(chords)].split('|')[0]
                tgt = root_of(nxt, 1)
                if tgt < n('E1'):
                    tgt += 12
                s.note('bass', bt + 3 * TPB + TPB // 2, tgt - 1 if tgt - 1 >= n('E1') else tgt + 2, 72, TPB // 2)
            # --- spazzole: le rotaie ("ciuf-ciuf" a sedicesimi, accento sul 2 e sul 4), cassa sull'1 e sul 3
            for k in range(16):
                tk = bt + k * TPB // 4
                beat, sub = divmod(k, 4)
                vel = (92 if beat % 2 else 70) if sub == 0 else (44 if sub == 2 else 26)
                s.note('drums', tk, BRUSH_SLAP if (sub == 0 and beat % 2) else BRUSH_TAP, vel, TPB // 4, human=False)
                if sub == 0 and beat % 2 == 0:
                    s.note('drums', tk, KICK, 64, TPB // 2, human=False)
            if i % 4 == 3:
                s.note('drums', bt + 3 * TPB, BRUSH_SWIRL, 60, TPB, human=False)
            # --- melodia
            t = bt
            for note_, beats in mel[i]:
                dur = int(beats * TPB)
                if note_:
                    m = n(note_)
                    acc = 8 if t == bt else 0
                    if name == 'A2':
                        s.note('banjo', t, m + 12, 94 + acc, int(dur * 0.85))
                    else:
                        s.note('harmonica', t, m, 100 + acc, int(dur * (0.8 if beats <= .5 else 0.94)))
                t += dur
            # --- nell'assolo di banjo l'armonica tiene gli accordi (terza e quinta, note lunghe)
            if name == 'A2':
                for ch, st, beats in parts:
                    for v in tones(ch, n('F#4'), n('D5'))[:2]:
                        s.note('harmonica', bt + st * TPB, v, 58, beats * TPB - 60)
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
        msgs.append((0, 0, mido.Message('program_change', channel=c, program=PROG[k])))
        msgs.append((0, 1, mido.Message('control_change', channel=c, control=7, value=VOLS[k])))
        msgs.append((0, 1, mido.Message('control_change', channel=c, control=91, value=50)))  # riverbero
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
                    '-o', 'synth.reverb.room-size=0.45', '-o', 'synth.reverb.damp=0.4', '-o', 'synth.reverb.width=0.8',
                    '-o', 'synth.reverb.level=0.4', '-o', 'synth.chorus.active=0',
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
