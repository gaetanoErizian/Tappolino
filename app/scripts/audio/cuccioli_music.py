"""
Cuccioli dal Dottore — musica di sottofondo ("Ambulatorio allegro").

Dolce e allegra in Sol maggiore, 4/4 a 96 bpm: chitarra classica (arpeggio fingerpicking), clarinetto (melodia),
glockenspiel (seconda melodia e scintille) e contrabbasso pizzicato. Composizione originale scritta qui come partitura,
esportata in MIDI e suonata con strumenti campionati (MuseScore General, licenza MIT) tramite FluidSynth.
Loop esatto di 60 secondi (24 battute) senza stacchi.

Uso (dalla cartella app/):
    sudo apt-get install fluidsynth musescore-general-soundfont-lossless ffmpeg
    pip install mido numpy
    python3 scripts/audio/cuccioli_music.py

Scrive src/games/cuccioli/audio/theme.ogg e theme.mp3 (+ theme.mid per riferimento).
"""
import os, random, subprocess
import mido
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, '..', '..', 'src', 'games', 'cuccioli', 'audio'))
TMP = '/tmp/cuccioli-audio'
SF2 = os.environ.get('SF2', '/usr/share/sounds/sf2/MuseScore_General_Full.sf2')
BPM = 96
TPB = 480                      # tick per battito
BAR = 4 * TPB                  # 4/4
random.seed(6)

NOTE = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}


def n(s):
    """'C5' -> numero MIDI."""
    name, octv = s[:-1], int(s[-1])
    return NOTE[name] + (octv + 1) * 12


CH = {
    'G': ('G', [0, 4, 7]), 'Em': ('E', [0, 3, 7]), 'C': ('C', [0, 4, 7]), 'D': ('D', [0, 4, 7]), 'Am': ('A', [0, 3, 7]),
    'Bm': ('B', [0, 3, 7]), 'D7': ('D', [0, 4, 7, 10]), 'Cmaj7': ('C', [0, 4, 7, 11]), 'G7': ('G', [0, 4, 7, 10]),
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
A_CHORDS = ['G', 'Em', 'C', 'D', 'G', 'Em', 'Am|D', 'G']
A_MEL = [  # clarinetto: cantabile, a piccoli passi
    [('B4', .5), ('D5', .5), ('G5', 1), ('F#5', .5), ('E5', .5), ('D5', 1)],
    [('E5', .5), ('G5', .5), ('B5', 1), ('A5', .5), ('G5', .5), ('E5', 1)],
    [('C5', .5), ('E5', .5), ('G5', 1), ('E5', .5), ('G5', .5), ('C6', 1)],
    [('A5', 1.5), ('G5', .5), ('F#5', 1), ('D5', 1)],
    [('B4', .5), ('D5', .5), ('G5', 1), ('A5', .5), ('B5', .5), ('G5', 1)],
    [('E5', 1), ('G5', .5), ('E5', .5), ('B4', 1), ('E5', 1)],
    [('A4', .5), ('C5', .5), ('E5', .5), ('A5', .5), ('F#5', .5), ('D5', .5), ('A4', .5), ('C5', .5)],
    [('B4', 1.5), ('A4', .5), ('G4', 1), (None, 1)],
]
B_CHORDS = ['C', 'D', 'Bm', 'Em', 'Am', 'D', 'G', 'D7']
B_MEL = [  # glockenspiel: luminoso, a campanelli
    [('E6', .5), ('G6', .5), ('E6', .5), ('C6', .5), ('D6', 1), ('E6', 1)],
    [('F#6', .5), ('A6', .5), ('F#6', .5), ('D6', .5), ('E6', 1), ('F#6', 1)],
    [('D6', 1), ('B5', .5), ('D6', .5), ('F#6', 1), ('D6', 1)],
    [('E6', 1.5), ('D6', .5), ('B5', 1), ('G5', 1)],
    [('C6', .5), ('E6', .5), ('A6', 1), ('G6', .5), ('E6', .5), ('C6', 1)],
    [('D6', .5), ('F#6', .5), ('A6', 1), ('F#6', .5), ('E6', .5), ('D6', 1)],
    [('B5', .5), ('D6', .5), ('G6', 1), ('F#6', .5), ('G6', .5), ('A6', 1)],
    [('F#6', 1), ('E6', .5), ('D6', .5), ('C6', 1), ('A5', 1)],
]
B_COUNTER = [  # clarinetto nella B: note lunghe e morbide
    [('G4', 2), ('E4', 2)], [('F#4', 2), ('A4', 2)], [('B4', 2), ('D5', 2)], [('B4', 4)],
    [('C5', 2), ('A4', 2)], [('A4', 2), ('F#4', 2)], [('G4', 2), ('B4', 2)], [('A4', 2), ('C5', 2)],
]
A2_CHORDS = ['G', 'Em', 'C', 'D', 'G', 'Em', 'Am|D', 'G|D']
SECTIONS = [('A', A_CHORDS, A_MEL), ('B', B_CHORDS, B_MEL), ('A2', A2_CHORDS, A_MEL)]

CHN = dict(guitar=0, clarinet=1, glock=2, bass=3)
PROG = dict(guitar=24, clarinet=71, glock=9, bass=32)
VOLS = dict(guitar=100, clarinet=96, glock=72, bass=104)
PANS = dict(guitar=44, clarinet=78, glock=58, bass=64)


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
            parts = chords_of(spec)
            # --- chitarra classica: pollice sul basso, arpeggio a crome sulle corde acute
            for ch, st, beats in parts:
                low = root_of(ch, 2)
                if low < n('E2'):
                    low += 12
                hi = tones(ch, n('G3'), n('E5'))
                pat = [0, 2, 1, 2, 3, 2, 1, 2]
                for k in range(beats * 2):
                    tk = bt + st * TPB + k * TPB // 2
                    if k % 4 == 0:
                        s.note('guitar', tk, low + (7 if (k // 4) % 2 else 0), 70, TPB * 2 - 40)
                    else:
                        idx = min(len(hi) - 1, pat[k % len(pat)])
                        s.note('guitar', tk, hi[idx], 52 if k % 2 else 58, TPB - 40)
            # --- contrabbasso pizzicato: fondamentale e quinta, con una nota di passaggio a fine battuta
            for ch, st, beats in parts:
                r = root_of(ch, 1)
                if r < n('E1'):
                    r += 12
                for b in range(st, st + beats, 2):
                    s.note('bass', bt + b * TPB, r if (b - st) % 4 == 0 else r + 7, 92, int(TPB * 1.2))
            if i % 2 == 1 and '|' not in spec:
                nxt = chords[(i + 1) % len(chords)].split('|')[0]
                tgt = root_of(nxt, 1)
                if tgt < n('E1'):
                    tgt += 12
                s.note('bass', bt + 3 * TPB + TPB // 2, tgt - 1 if tgt - 1 >= n('E1') else tgt + 2, 70, TPB // 2)
            # --- melodia
            t = bt
            for note_, beats in mel[i]:
                dur = int(beats * TPB)
                if note_:
                    m = n(note_)
                    acc = 8 if t == bt else 0
                    if name == 'A':
                        s.note('clarinet', t, m, 90 + acc, int(dur * (0.75 if beats <= .5 else 0.92)))
                    elif name == 'A2':
                        s.note('clarinet', t, m, 88 + acc, int(dur * (0.75 if beats <= .5 else 0.92)))
                        s.note('glock', t, m + 12, 46 + acc, dur)
                    else:
                        s.note('glock', t, m, 88 + acc, dur)
                t += dur
            if name == 'B':
                t = bt
                for note_, beats in B_COUNTER[i]:
                    s.note('clarinet', t, n(note_), 62, int(beats * TPB) - 40)
                    t += int(beats * TPB)
            # --- scintille di glockenspiel a inizio frase nella A
            if name == 'A' and i % 4 == 0:
                for k, v in enumerate(tones(parts[0][0], n('G6'), n('G7'))[:3]):
                    s.note('glock', bt + 3 * TPB + k * TPB // 3, v, 50 + k * 6, TPB // 2)
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
