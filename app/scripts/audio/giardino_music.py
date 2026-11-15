"""
Giardino delle Fate — musica di sottofondo ("Radura incantata").

Calma e incantata in Fa maggiore, 4/4 a 60 bpm: arpa (arpeggi che scorrono), flauto (melodia cantabile),
archi pizzicati (il basso, leggero come passi di fata) e campanelli (celesta e glockenspiel: scintille e seconda melodia).
Composizione originale scritta qui come partitura, esportata in MIDI e suonata con strumenti campionati
(MuseScore General, licenza MIT) tramite FluidSynth. Loop esatto di 64 secondi (16 battute) senza stacchi.

Uso (dalla cartella app/):
    sudo apt-get install fluidsynth musescore-general-soundfont-lossless ffmpeg
    pip install mido numpy
    python3 scripts/audio/giardino_music.py

Scrive src/games/giardino/audio/theme.ogg e theme.mp3 (+ theme.mid per riferimento).
"""
import os, random, subprocess
import mido
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, '..', '..', 'src', 'games', 'giardino', 'audio'))
TMP = '/tmp/giardino-audio'
SF2 = os.environ.get('SF2', '/usr/share/sounds/sf2/MuseScore_General_Full.sf2')
BPM = 60
TPB = 480                      # tick per battito
BAR = 4 * TPB                  # 4/4
random.seed(8)

NOTE = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}


def n(s):
    """'C5' -> numero MIDI."""
    name, octv = s[:-1], int(s[-1])
    return NOTE[name] + (octv + 1) * 12


CH = {
    'F': ('F', [0, 4, 7]), 'Fmaj7': ('F', [0, 4, 7, 11]), 'Dm': ('D', [0, 3, 7]), 'Bb': ('Bb', [0, 4, 7]), 'Bbmaj7': ('Bb', [0, 4, 7, 11]),
    'C': ('C', [0, 4, 7]), 'Csus': ('C', [0, 5, 7]), 'C7': ('C', [0, 4, 7, 10]), 'Am': ('A', [0, 3, 7]), 'Gm': ('G', [0, 3, 7]), 'Gm7': ('G', [0, 3, 7, 10]),
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
A_CHORDS = ['Fmaj7', 'Dm', 'Bbmaj7', 'C', 'Fmaj7', 'Am', 'Bb', 'Gm7|C']
A_MEL = [  # flauto: lento e cantabile
    [('A5', 1.5), ('G5', .5), ('F5', 1), ('C5', 1)],
    [('D5', 1.5), ('E5', .5), ('F5', 1), ('A5', 1)],
    [('G5', 1.5), ('F5', .5), ('D5', 1), ('F5', 1)],
    [('E5', 2.5), ('C5', .5), ('D5', .5), ('E5', .5)],
    [('A5', 1.5), ('Bb5', .5), ('C6', 1), ('A5', 1)],
    [('E5', 1.5), ('F5', .5), ('G5', 1), ('A5', 1)],
    [('D6', 1), ('C6', 1), ('Bb5', .5), ('A5', .5), ('G5', 1)],
    [('G5', 3), (None, 1)],
]
B_CHORDS = ['Dm', 'Bb', 'F', 'C', 'Bbmaj7', 'Gm', 'C7', 'F']
B_MEL = [  # celesta: la melodia dei campanelli
    [('F6', 1), ('E6', .5), ('D6', .5), ('A5', 2)],
    [('Bb5', 1), ('C6', .5), ('D6', .5), ('F6', 2)],
    [('A6', 1), ('G6', .5), ('F6', .5), ('C6', 2)],
    [('E6', 1), ('F6', .5), ('G6', .5), ('E6', 2)],
    [('D6', 1), ('F6', 1), ('A6', 2)],
    [('Bb6', 1), ('A6', .5), ('G6', .5), ('D6', 2)],
    [('C6', 1), ('E6', 1), ('G6', 1), ('Bb6', 1)],
    [('A6', 3), (None, 1)],
]
B_COUNTER = [  # flauto nella B: note lunghe, morbide
    [('A4', 2), ('F5', 2)], [('F5', 4)], [('C5', 2), ('F5', 2)], [('G5', 4)],
    [('F5', 2), ('D5', 2)], [('D5', 4)], [('E5', 2), ('G5', 2)], [('F5', 4)],
]
SECTIONS = [('A', A_CHORDS, A_MEL), ('B', B_CHORDS, B_MEL)]

CHN = dict(harp=0, flute=1, pizz=2, celesta=3, glock=4)
PROG = dict(harp=46, flute=73, pizz=45, celesta=8, glock=9)
VOLS = dict(harp=96, flute=90, pizz=92, celesta=84, glock=58)
PANS = dict(harp=46, flute=74, pizz=60, celesta=84, glock=40)


class Score:
    def __init__(self):
        self.ev = []   # (tick, ch, note, vel, dur)

    def note(self, ch, t, note, vel, dur, human=True):
        if human:
            t += random.randint(-6, 6)
            vel = max(1, min(127, vel + random.randint(-4, 4)))
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
            # --- arpa: arpeggio a crome che sale e scende su due ottave (lascia vibrare)
            for ch, st, beats in parts:
                hi = tones(ch, n('F3'), n('C6'))
                pat = [0, 1, 2, 3, 4, 3, 2, 1] if len(hi) > 4 else [0, 1, 2, 3, 2, 1, 2, 1]
                for k in range(beats * 2):
                    tk = bt + st * TPB + k * TPB // 2
                    idx = min(len(hi) - 1, pat[(k + (2 if name == 'B' else 0)) % len(pat)])
                    s.note('harp', tk, hi[idx], 58 if k % 4 == 0 else 46, TPB * 2)
            # --- archi pizzicati: fondamentale sul primo battito, quinta sul terzo (leggeri)
            for ch, st, beats in parts:
                r = root_of(ch, 2)
                if r > n('C3'):
                    r -= 12
                s.note('pizz', bt + st * TPB, r, 84, TPB)
                if beats == 4:
                    s.note('pizz', bt + 2 * TPB, r + 7, 70, TPB)
                    s.note('pizz', bt + 3 * TPB + TPB // 2, r + 12, 54, TPB // 2)
            # --- melodia
            t = bt
            for note_, beats in mel[i]:
                dur = int(beats * TPB)
                if note_:
                    m = n(note_)
                    acc = 6 if t == bt else 0
                    if name == 'A':
                        s.note('flute', t, m, 84 + acc, int(dur * 0.94))
                        if i >= 4:
                            s.note('celesta', t, m + 12, 40 + acc, dur)
                    else:
                        s.note('celesta', t, m, 86 + acc, dur)
                        s.note('glock', t, m, 34, dur)
                t += dur
            if name == 'B':
                t = bt
                for note_, beats in B_COUNTER[i]:
                    s.note('flute', t, n(note_), 62, int(beats * TPB) - 40)
                    t += int(beats * TPB)
            # --- scintille di campanelli a inizio frase
            if i % 4 == 0:
                for k, v in enumerate(tones(parts[0][0], n('C7'), n('C8'))[:4]):
                    s.note('glock', bt + 3 * TPB + k * TPB // 4, v, 44 + k * 5, TPB // 2)
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
        msgs.append((0, 1, mido.Message('control_change', channel=c, control=91, value=64)))  # riverbero
        msgs.append((0, 1, mido.Message('control_change', channel=c, control=93, value=10)))  # chorus
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
