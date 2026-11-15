"""
Razzo tra le Stelle — musica di sottofondo ("Passeggiata tra le stelle").

Spaziale e leggera, in Re maggiore con il colore lidio (Mi/Re), 4/4 a 90 bpm con un'ombra di swing:
vibrafono (melodia), tappeto d'archi lenti, basso elettrico fretless morbido, batteria con le spazzole
(kit "Brush": swirl, tocchi, cassa leggera, charleston a pedale, ride nella sezione B) e qualche scintilla di celesta.
Composizione originale scritta qui come partitura, esportata in MIDI e suonata con strumenti campionati
(MuseScore General, licenza MIT) tramite FluidSynth. Loop esatto di 64 secondi (24 battute) senza stacchi.

Forma: A (vibrafono) · B (archi più presenti, ride, melodia più alta) · A' (ripresa con celesta, chiusura che riparte).

Uso (dalla cartella app/):
    sudo apt-get install fluidsynth musescore-general-soundfont-lossless ffmpeg
    pip install mido numpy
    python3 scripts/audio/razzo_music.py

Scrive src/games/razzo/audio/theme.ogg e theme.mp3 (+ theme.mid per riferimento).
Se cambi BPM o numero di battute aggiorna THEME_LOOP in src/games/razzo/sfx.ts (lo script stampa il valore).
"""
import os, random, subprocess
import mido
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, '..', '..', 'src', 'games', 'razzo', 'audio'))
TMP = '/tmp/razzo-audio'
SF2 = os.environ.get('SF2', '/usr/share/sounds/sf2/MuseScore_General_Full.sf2')
BPM = 90
TPB = 480                      # tick per battito
BAR = 4 * TPB                  # 4/4
SWING = 0.1                    # ombra di swing sulle crome in levare (frazione di battito)
random.seed(5)

NOTE = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}


def n(s):
    """'C5' -> numero MIDI."""
    name, octv = s[:-1], int(s[-1])
    return NOTE[name] + (octv + 1) * 12


# accordo -> (basso, note dell'accordo)
CH = {
    'Dmaj7': ('D', ['D', 'F#', 'A', 'C#']),
    'E/D': ('D', ['E', 'G#', 'B', 'D']),
    'Bm7': ('B', ['B', 'D', 'F#', 'A']),
    'Gmaj7': ('G', ['G', 'B', 'D', 'F#']),
    'A7sus4': ('A', ['A', 'D', 'E', 'G']),
    'A7': ('A', ['A', 'C#', 'E', 'G']),
    'F#m7': ('F#', ['F#', 'A', 'C#', 'E']),
    'Em7': ('E', ['E', 'G', 'B', 'D']),
    'B7': ('B', ['B', 'D#', 'F#', 'A']),
}


def tones(chord, low, high):
    pcs = {NOTE[x] for x in CH[chord][1]}
    return [m for m in range(low, high + 1) if m % 12 in pcs]


def bass_of(chord, low=n('E1')):
    pc = NOTE[CH[chord][0]]
    m = low + ((pc - low) % 12)
    return m


# --- Partitura: ogni battuta = accordo o "A|B" (2+2 battiti); melodie (nota|None, battiti) ----------
A_CHORDS = ['Dmaj7', 'E/D', 'Bm7', 'Gmaj7', 'Dmaj7', 'E/D', 'Gmaj7', 'A7sus4|A7']
A_MEL = [
    [('A4', .5), ('D5', .5), ('F#5', 1), ('E5', .5), ('F#5', .5), ('A5', 1)],
    [('G#5', 1.5), ('F#5', .5), ('E5', 1), ('B4', 1)],
    [('D5', .5), ('F#5', .5), ('A5', 1), ('F#5', .5), ('E5', .5), ('D5', 1)],
    [('B4', 2), (None, 1), ('D5', .5), ('E5', .5)],
    [('F#5', .5), ('A5', .5), ('C#6', 1), ('B5', .5), ('A5', .5), ('F#5', 1)],
    [('G#5', .5), ('B5', .5), ('E6', 1), ('D6', .5), ('B5', .5), ('G#5', 1)],
    [('F#5', 1), ('D5', .5), ('B4', .5), ('D5', 1), ('F#5', 1)],
    [('E5', 2), (None, 1), ('A4', 1)],
]
B_CHORDS = ['Gmaj7', 'F#m7', 'Em7', 'A7', 'Gmaj7', 'F#m7|B7', 'Em7', 'A7sus4|A7']
B_MEL = [
    [('D6', 1.5), ('B5', .5), ('F#5', 2)],
    [('E5', .5), ('F#5', .5), ('A5', 1), ('C#6', 2)],
    [('B5', 1.5), ('G5', .5), ('E5', 1), ('D5', 1)],
    [('C#5', .5), ('E5', .5), ('G5', 1), ('A5', 2)],
    [('B5', 1), ('A5', .5), ('G5', .5), ('F#5', 1), ('D5', 1)],
    [('C#5', 1), ('E5', 1), ('D#5', 1), ('F#5', 1)],
    [('G5', 1), ('B5', 1), ('E6', 1.5), ('D6', .5)],
    [('D6', 1), ('C#6', 1), ('A5', 1), ('E5', 1)],
]
C_CHORDS = ['Dmaj7', 'E/D', 'Bm7', 'Gmaj7', 'Em7', 'A7', 'Dmaj7', 'A7sus4']
C_MEL = A_MEL[:4] + [
    [('G5', .5), ('B5', .5), ('D6', 1), ('B5', .5), ('A5', .5), ('G5', 1)],
    [('E5', .5), ('G5', .5), ('C#6', 1), ('B5', .5), ('A5', .5), ('G5', 1)],
    [('F#5', 1.5), ('E5', .5), ('D5', 2)],
    [(None, 1), ('D5', .5), ('E5', .5), ('A5', 1), ('E5', 1)],
]
SECTIONS = [('A', A_CHORDS, A_MEL), ('B', B_CHORDS, B_MEL), ('C', C_CHORDS, C_MEL)]

CHN = dict(vibes=0, strings=1, bass=2, celesta=3, pad=4, drums=9)
PROG = dict(vibes=11, strings=49, bass=35, celesta=8, pad=89, drums=40)   # batteria: kit Brush (banco 128, programma 40)
VOLS = dict(vibes=108, strings=74, bass=104, celesta=70, pad=40, drums=112)
PANS = dict(vibes=50, strings=74, bass=62, celesta=36, pad=64, drums=64)
REVB = dict(vibes=96, strings=100, bass=40, celesta=105, pad=110, drums=60)

# kit Brush (GS): cassa, tocco, swirl, charleston a pedale, ride, campana del ride
KICK, TAP, SWIRL, PEDAL, RIDE, BELL = 36, 38, 40, 44, 51, 53


class Score:
    def __init__(self):
        self.ev = []   # (tick, ch, note, vel, dur)

    def note(self, ch, t, note, vel, dur, human=True, swing=True):
        if swing and t % TPB == TPB // 2:
            t += int(SWING * TPB)
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
            last_bar = i == len(chords) - 1
            nxt = chords[(i + 1) % len(chords)].split('|')[0] if not last_bar else 'Gmaj7' if name == 'A' else 'Dmaj7'
            # --- tappeto d'archi lenti (più pieno nella B) e un velo di pad
            for ch, st, beats in parts:
                for v in tones(ch, n('F#3'), n('D5')):
                    s.note('strings', bt + st * TPB, v, 58 if name == 'B' else 44, beats * TPB - 40, human=False, swing=False)
                if name != 'A':
                    for v in tones(ch, n('A3'), n('A4'))[:3]:
                        s.note('pad', bt + st * TPB, v, 50, beats * TPB - 40, human=False, swing=False)
            # --- basso fretless morbido: fondamentale, quinta in levare, nota di passaggio verso l'accordo dopo
            for k, (ch, st, beats) in enumerate(parts):
                r = bass_of(ch)
                if beats == 4:
                    s.note('bass', bt, r, 92, int(TPB * 1.4))
                    s.note('bass', bt + int(1.5 * TPB), r + 7, 70, TPB // 2)
                    s.note('bass', bt + 2 * TPB, r + 12 if r < n('A1') else r, 84, TPB - 20)
                    target = bass_of(nxt)
                    s.note('bass', bt + 3 * TPB, target - 1 if (i + len(name)) % 2 else target + 2, 72, TPB - 20)
                else:
                    s.note('bass', bt + st * TPB, r, 90, int(TPB * 1.4))
                    s.note('bass', bt + int((st + 1.5) * TPB), r + 7, 70, TPB // 2)
            # --- melodia al vibrafono (nella B un'ottava sopra raddoppiata dalla celesta, piano)
            t = bt
            for note_, beats in mel[i]:
                dur = int(beats * TPB)
                if note_:
                    m = n(note_)
                    acc = 8 if t == bt else 0
                    s.note('vibes', t, m, 88 + acc, int(dur * 0.95))
                    if name == 'B' and beats >= 1:
                        s.note('celesta', t, m + 12, 40, dur // 2)
                t += dur
            # --- scintille di celesta nella ripresa (arpeggio veloce a inizio frase)
            if name == 'C' and i % 2 == 0:
                for k, v in enumerate(tones(parts[0][0], n('D6'), n('D7'))[:5]):
                    s.note('celesta', bt + int(3 * TPB) + k * TPB // 6, v, 44 + k * 5, TPB // 2, swing=False)
            # --- batteria con le spazzole
            soft = 0.85 if name == 'A' else 1.0
            for b in (0, 2):
                s.note('drums', bt + b * TPB, SWIRL, int(58 * soft), int(TPB * 1.8), swing=False)
                s.note('drums', bt + b * TPB, KICK, int(58 * soft), 120, swing=False)
            for b in (1, 3):
                s.note('drums', bt + b * TPB, TAP, int(76 * soft), 120, swing=False)
                s.note('drums', bt + b * TPB, PEDAL, int(52 * soft), 100, swing=False)
            if name == 'B':   # ride: "din, din-da din"
                for b in range(4):
                    s.note('drums', bt + b * TPB, RIDE, 52 if b % 2 == 0 else 58, 200, swing=False)
                    if b % 2 == 1:
                        s.note('drums', bt + b * TPB + TPB // 2, RIDE, 40, 160)
                if i % 4 == 0:
                    s.note('drums', bt, BELL, 34, 300, swing=False)
            else:          # tocchi leggeri in levare
                for b in (1, 3):
                    s.note('drums', bt + b * TPB + TPB // 2, TAP, int(42 * soft), 90)
            if last_bar:   # piccolo giro di spazzole verso la sezione dopo
                for k in range(6):
                    s.note('drums', bt + 2 * TPB + k * TPB // 3, TAP, 44 + k * 5, 90, swing=False)
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
        msgs.append((0, 1, mido.Message('control_change', channel=c, control=91, value=REVB[k])))  # riverbero
        msgs.append((0, 1, mido.Message('control_change', channel=c, control=93, value=18)))       # chorus
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
                    '-o', 'synth.reverb.room-size=0.78', '-o', 'synth.reverb.damp=0.3', '-o', 'synth.reverb.width=1.0',
                    '-o', 'synth.reverb.level=0.6', '-o', 'synth.chorus.active=1',
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
