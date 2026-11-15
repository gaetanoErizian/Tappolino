"""
Atelier delle Principesse — musica di sottofondo ("Ballo a corte").

Pop elegante in Re maggiore, 4/4 a 96 bpm (il valzer è già della Pasticceria): pianoforte (accordi pop sincopati,
poi arpeggi e infine la melodia), archi (tappeto, melodia cantabile nella parte B, controcanto), celesta (melodia
luminosa e scintille) e batteria leggera (cassa morbida, side stick, charleston, tamburello e shaker).
Composizione originale scritta qui come partitura, esportata in MIDI e suonata con strumenti campionati
(MuseScore General, licenza MIT) tramite FluidSynth. Loop esatto di 60 secondi (24 battute) senza stacchi.

Uso (dalla cartella app/):
    sudo apt-get install fluidsynth musescore-general-soundfont-lossless ffmpeg
    pip install mido numpy
    python3 scripts/audio/atelier_music.py

Scrive src/games/atelier/audio/theme.ogg e theme.mp3 (+ theme.mid per riferimento).
"""
import os, random, subprocess
import mido
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, '..', '..', 'src', 'games', 'atelier', 'audio'))
TMP = '/tmp/atelier-audio'
SF2 = os.environ.get('SF2', '/usr/share/sounds/sf2/MuseScore_General_Full.sf2')
BPM = 96
TPB = 480                      # tick per battito
BAR = 4 * TPB                  # 4/4
random.seed(10)

NOTE = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}


def n(s):
    """'C5' -> numero MIDI."""
    name, octv = s[:-1], int(s[-1])
    return NOTE[name] + (octv + 1) * 12


CH = {
    'D': ('D', [0, 4, 7]), 'Bm': ('B', [0, 3, 7]), 'G': ('G', [0, 4, 7]), 'A': ('A', [0, 4, 7]), 'Em': ('E', [0, 3, 7]),
    'F#m': ('F#', [0, 3, 7]), 'A7': ('A', [0, 4, 7, 10]), 'Em7': ('E', [0, 3, 7, 10]), 'Gmaj7': ('G', [0, 4, 7, 11]),
    'Asus': ('A', [0, 5, 7]),
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
A_CHORDS = ['D', 'Bm', 'G', 'A', 'D', 'Bm', 'Em|A', 'D']
A_MEL = [  # celesta: elegante, a piccoli salti
    [('F#5', .5), ('A5', .5), ('D6', 1), ('C#6', .5), ('B5', .5), ('A5', 1)],
    [('B5', .5), ('A5', .5), ('F#5', 1), ('D5', .5), ('F#5', .5), ('B5', 1)],
    [('G5', .5), ('B5', .5), ('D6', 1), ('E6', .5), ('D6', .5), ('B5', 1)],
    [('C#6', 1.5), ('B5', .5), ('A5', 1), ('E5', 1)],
    [('F#5', .5), ('A5', .5), ('D6', 1), ('F#6', .5), ('E6', .5), ('D6', 1)],
    [('D6', 1), ('B5', .5), ('A5', .5), ('F#5', 1), ('B5', 1)],
    [('G5', .5), ('B5', .5), ('E6', .5), ('D6', .5), ('C#6', .5), ('A5', .5), ('E5', .5), ('G5', .5)],
    [('F#5', 1.5), ('E5', .5), ('D5', 1), (None, 1)],
]
B_CHORDS = ['G', 'A', 'F#m', 'Bm', 'Em', 'A', 'D', 'A7']
B_MEL = [  # archi: cantabile, note lunghe
    [('B4', 2), ('D5', 1), ('G5', 1)],
    [('A5', 2), ('G5', 1), ('E5', 1)],
    [('F#5', 2), ('E5', 1), ('C#5', 1)],
    [('D5', 3), ('F#5', 1)],
    [('E5', 2), ('G5', 1), ('B5', 1)],
    [('A5', 2), ('C#6', 1), ('A5', 1)],
    [('F#5', 2), ('A5', 1), ('D6', 1)],
    [('C#6', 2), ('B5', 1), ('A5', 1)],
]
A2_CHORDS = ['D', 'Bm', 'G', 'A', 'D', 'Bm', 'Em|A', 'D|A7']
A2_COUNTER = [  # archi nella ripresa: controcanto lungo
    [('A4', 4)], [('F#4', 4)], [('G4', 2), ('B4', 2)], [('A4', 2), ('C#5', 2)],
    [('D5', 4)], [('B4', 2), ('D5', 2)], [('E5', 2), ('C#5', 2)], [('D5', 2), ('C#5', 2)],
]
SECTIONS = [('A', A_CHORDS), ('B', B_CHORDS), ('A2', A2_CHORDS)]

CHN = dict(piano=0, strings=1, celesta=2, pizz=3, drums=9)
PROG = dict(piano=0, strings=48, celesta=8, pizz=45, drums=0)
VOLS = dict(piano=100, strings=86, celesta=98, pizz=80, drums=78)
PANS = dict(piano=54, strings=74, celesta=40, pizz=88, drums=64)
KICK, STICK, SNARE, HAT, TAMB, SHAKER, CRASH, RIDEB = 36, 37, 38, 42, 54, 82, 49, 53


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


def drums(s, bt, name, i):
    """Batteria leggera: cassa morbida, side stick o rullante soffice, charleston a crome, tamburello/shaker."""
    last = i == 7
    for k in range(8):
        tk = bt + k * TPB // 2
        if not (last and k >= 6):
            s.note('drums', tk, HAT, 44 if k % 2 == 0 else 28, TPB // 4)
        if name == 'B':
            s.note('drums', tk + TPB // 4, SHAKER, 26, TPB // 4)
    for b in (0, 2):
        s.note('drums', bt + b * TPB, KICK, 72 if b == 0 else 62, TPB // 2)
    if i % 2 == 1:
        s.note('drums', bt + 2 * TPB + TPB // 2, KICK, 48, TPB // 2)
    back = STICK if name == 'A' else SNARE
    for b in (1, 3):
        if last and b == 3 and name != 'A':
            continue
        s.note('drums', bt + b * TPB, back, 58 if back == STICK else 50, TPB // 2)
        if name == 'B':
            s.note('drums', bt + b * TPB, TAMB, 40, TPB // 2)
    if last:  # piccolo passaggio di rullante verso la sezione successiva
        for k, v in enumerate([30, 36, 42, 50]):
            s.note('drums', bt + 3 * TPB + k * TPB // 4, SNARE, v, TPB // 4)
    if name == 'A2' and i == 0:
        s.note('drums', bt, CRASH, 50, TPB * 2)


def compose():
    s = Score()
    t0 = 0
    for name, chords in SECTIONS:
        for i, spec in enumerate(chords):
            bt = t0 + i * BAR
            parts = chords_of(spec)
            for ch, st, beats in parts:
                low = root_of(ch, 2)
                if low < n('C2'):
                    low += 12
                hi = tones(ch, n('F#3'), n('D5'))[:4]
                # --- pianoforte: mano sinistra (ottava sul basso), mano destra secondo la sezione
                for b in range(st, st + beats, 2):
                    s.note('piano', bt + b * TPB, low - 12 if low - 12 >= n('D1') else low, 74, TPB * 2 - 30)
                    s.note('piano', bt + b * TPB + TPB, low + 7 - (12 if low + 7 > n('A3') else 0), 54, TPB - 30)
                if name == 'A':
                    # accordi pop sincopati: 1, 2, 2+, 3+, 4
                    for off, dur, v in [(0, 1, 62), (1, .5, 50), (1.5, 1, 56), (2.5, .5, 48), (3, 1, 54)]:
                        if st <= off < st + beats:
                            for m in hi[:3]:
                                s.note('piano', bt + int(off * TPB), m + 12, v, int(dur * TPB) - 40)
                elif name == 'B':
                    # arpeggio a crome
                    arp = tones(ch, n('D4'), n('D6'))
                    pat = [0, 1, 2, 3, 2, 1, 2, 3]
                    for k in range(beats * 2):
                        m = arp[min(len(arp) - 1, pat[k % 8])]
                        s.note('piano', bt + st * TPB + k * TPB // 2, m, 50 if k % 2 else 58, TPB - 40)
                else:
                    for off in (0, 2):
                        if st <= off < st + beats:
                            for m in hi[:3]:
                                s.note('piano', bt + off * TPB, m, 48, TPB * 2 - 60)
                # --- archi: tappeto
                pad = tones(ch, n('A3'), n('A4'))[:3]
                if name != 'B':
                    for m in pad:
                        s.note('strings', bt + st * TPB, m, 46 if name == 'A' else 40, beats * TPB - 20, human=False)
                else:
                    for m in tones(ch, n('D3'), n('A3'))[:2]:
                        s.note('strings', bt + st * TPB, m, 42, beats * TPB - 20, human=False)
                # --- pizzicati sul basso nella parte B
                if name == 'B':
                    for b in range(st, st + beats):
                        s.note('pizz', bt + b * TPB, root_of(ch, 2) + (7 if b % 2 else 0), 70, TPB)
            # --- melodie
            if name in ('A', 'A2'):
                t = bt
                for note_, beats in A_MEL[i]:
                    dur = int(beats * TPB)
                    if note_:
                        m = n(note_)
                        acc = 8 if t == bt else 0
                        if name == 'A':
                            s.note('celesta', t, m, 92 + acc, int(dur * 0.95))
                        else:
                            s.note('piano', t, m, 84 + acc, int(dur * (0.8 if beats <= .5 else 0.95)))
                            s.note('celesta', t, m + 12, 56 + acc, dur)
                    t += dur
            if name == 'B':
                t = bt
                for note_, beats in B_MEL[i]:
                    s.note('strings', t, n(note_), 84, int(beats * TPB) - 30)
                    t += int(beats * TPB)
                # scintille di celesta a fine battuta
                for k, v in enumerate(tones(parts[-1][0], n('A5'), n('A6'))[:4]):
                    s.note('celesta', bt + 3 * TPB + k * TPB // 4, v, 46 + k * 6, TPB // 2)
            if name == 'A2':
                t = bt
                for note_, beats in A2_COUNTER[i]:
                    s.note('strings', t, n(note_), 62, int(beats * TPB) - 30)
                    t += int(beats * TPB)
            # --- scintille di celesta a inizio frase nella A
            if name == 'A' and i % 4 == 3:
                for k, v in enumerate(tones('A', n('A6'), n('A7'))[:3]):
                    s.note('celesta', bt + 3 * TPB + k * TPB // 3, v, 48 + k * 6, TPB // 2)
            drums(s, bt, name, i)
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
