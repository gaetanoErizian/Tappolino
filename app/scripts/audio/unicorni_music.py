"""
Salone degli Unicorni — musica di sottofondo ("Nuvole di zucchero").

Pop sognante in Fa maggiore, 4/4 a 96 bpm: arpa (arpeggi e accordi arpeggiati), celesta (ritornello e risposte),
flauto (strofa e ponte), basso fretless morbido, un velo d'archi lenti nel ritornello e nel ponte, batteria pop
leggerissima (cassa morbida, side stick, shaker, triangolo). Accordi con settime per il colore "sognante".
Composizione originale scritta qui come partitura, esportata in MIDI e suonata con strumenti campionati
(MuseScore General, licenza MIT) tramite FluidSynth. Loop esatto di 60 secondi senza stacchi.

Uso (dalla cartella app/):
    sudo apt-get install fluidsynth musescore-general-soundfont-lossless ffmpeg
    pip install mido numpy
    python3 scripts/audio/unicorni_music.py

Scrive src/games/unicorni/audio/theme.ogg e theme.mp3 (+ theme.mid per riferimento).
"""
import os, random, subprocess, wave
import mido
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, '..', '..', 'src', 'games', 'unicorni', 'audio'))
TMP = '/tmp/unicorni-audio'
SF2 = os.environ.get('SF2', '/usr/share/sounds/sf2/MuseScore_General_Full.sf2')
BPM = 96
TPB = 480                      # tick per battito
BAR = 4 * TPB                  # 4/4
random.seed(4)

NOTE = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}


def n(s):
    """'C5' -> numero MIDI."""
    name, octv = s[:-1], int(s[-1])
    return NOTE[name] + (octv + 1) * 12


CH = {
    'Fmaj7': ('F', [0, 4, 7, 11]), 'Am7': ('A', [0, 3, 7, 10]), 'Bbmaj7': ('Bb', [0, 4, 7, 11]), 'C': ('C', [0, 4, 7]),
    'Dm7': ('D', [0, 3, 7, 10]), 'Gm7': ('G', [0, 3, 7, 10]), 'Csus': ('C', [0, 5, 7]), 'C7': ('C', [0, 4, 7, 10]),
    'Fadd9': ('F', [0, 4, 7, 14]),
}


def tones(chord, low, high):
    root, iv = CH[chord]
    out = []
    for o in range(0, 9):
        for i in iv:
            m = NOTE[root] + i + o * 12
            if low <= m <= high:
                out.append(m)
    return sorted(set(out))


def root_of(chord, octave=2):
    return NOTE[CH[chord][0]] + (octave + 1) * 12


# --- Partitura: ogni battuta = accordo o "A|B" (2+2 battiti); melodie (nota|None, battiti) ----------
A_CHORDS = ['Fmaj7', 'Am7', 'Bbmaj7', 'C', 'Fmaj7', 'Dm7', 'Gm7', 'Csus|C']
A_MEL = [  # flauto: strofa che fluttua
    [('C5', 1), ('F5', 1), ('A5', 1.5), ('G5', .5)],
    [('E5', 2), (None, .5), ('C5', .5), ('E5', .5), ('G5', .5)],
    [('F5', 1), ('D5', 1), ('A5', 1.5), ('F5', .5)],
    [('G5', 3), (None, 1)],
    [('A5', 1), ('C6', 1), ('A5', 1), ('G5', 1)],
    [('F5', 1.5), ('E5', .5), ('D5', 1), ('A4', 1)],
    [('Bb4', 1), ('D5', 1), ('F5', 1), ('A5', 1)],
    [('G5', 2), ('E5', 1), (None, 1)],
]
B_CHORDS = ['Bbmaj7', 'C', 'Am7', 'Dm7', 'Gm7', 'C', 'Fadd9', 'C7']
B_MEL = [  # celesta: ritornello
    [('D6', .5), ('C6', .5), ('D6', 1), ('F6', 1), ('D6', 1)],
    [('C6', 1.5), ('G5', .5), ('E5', 2)],
    [('E6', .5), ('D6', .5), ('C6', 1), ('A5', 1), ('C6', 1)],
    [('A5', 2), (None, 1), ('D6', 1)],
    [('Bb5', .5), ('A5', .5), ('Bb5', 1), ('D6', 1), ('F6', 1)],
    [('E6', 1.5), ('D6', .5), ('C6', 2)],
    [('A5', 1), ('C6', 1), ('F6', 1.5), ('E6', .5)],
    [('E6', 1), ('C6', 1), ('Bb5', 1), ('G5', 1)],
]
C_CHORDS = ['Dm7', 'Bbmaj7', 'Fmaj7', 'C', 'Dm7', 'Bbmaj7', 'Gm7', 'Csus|C']
C_MEL = [  # ponte: il flauto chiama (battute dispari), la celesta risponde (pari)
    [('A5', 1), ('F5', 1), ('D5', 2)],
    [('F6', .5), ('D6', .5), ('A5', 1), (None, 2)],
    [('C6', 1), ('A5', 1), ('F5', 2)],
    [('G6', .5), ('E6', .5), ('C6', 1), (None, 2)],
    [('D6', 1), ('C6', .5), ('A5', .5), ('F5', 2)],
    [('D6', .5), ('F6', .5), ('A6', 1), (None, 2)],
    [('Bb5', 1), ('A5', 1), ('G5', 1), ('F5', 1)],
    [('E6', 1), ('G6', 1), ('C7', 1), (None, 1)],
]
SECTIONS = [('A', A_CHORDS, A_MEL), ('B', B_CHORDS, B_MEL), ('C', C_CHORDS, C_MEL)]

CHN = dict(harp=0, celesta=1, flute=2, bass=3, strings=4, drums=9)
PROG = dict(harp=46, celesta=8, flute=73, bass=35, strings=49)
VOLS = dict(harp=96, celesta=100, flute=96, bass=96, strings=56, drums=70)
PANS = dict(harp=44, celesta=80, flute=58, bass=64, strings=64, drums=64)

# percussioni General MIDI
KICK, SIDE, MARACAS, TRIANGLE, SHAKER = 35, 37, 70, 81, 82


class Score:
    def __init__(self):
        self.ev = []   # (tick, ch, note, vel, dur)

    def note(self, ch, t, note, vel, dur, human=True):
        if human:
            t += random.randint(-5, 5)
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
            last_bar = i == len(chords) - 1
            parts = chords_of(spec)
            # --- basso morbido: fondamentale lunga, ripresa in levare, quinta, nota di passaggio
            for ch, st, beats in parts:
                r = root_of(ch, 2)
                if r > n('E2'):
                    r -= 12
                if beats == 4:
                    s.note('bass', bt, r, 92, int(TPB * 1.4))
                    s.note('bass', bt + int(TPB * 1.5), r, 70, int(TPB * 0.45))
                    s.note('bass', bt + 2 * TPB, r + 7, 84, int(TPB * 0.9))
                    s.note('bass', bt + 3 * TPB, r + (12 if name != 'C' else 7), 74, int(TPB * 0.9))
                else:
                    s.note('bass', bt + st * TPB, r, 90, int(TPB * 1.4))
                    s.note('bass', bt + st * TPB + int(TPB * 1.5), r + 7, 68, int(TPB * 0.45))
            # --- arpa: arpeggi a crome (strofa e ponte), accordi arpeggiati sull'1 e sul 3 (ritornello)
            for ch, st, beats in parts:
                tn = tones(ch, n('F3'), n('C6'))
                if name in ('A', 'C'):
                    pat = [0, 2, 4, 5, 6, 5, 4, 2]
                    for k in range(beats * 2):
                        idx = min(len(tn) - 1, pat[k % len(pat)])
                        vel = (58 if k % 2 == 0 else 46) - (6 if name == 'C' else 0)
                        s.note('harp', bt + st * TPB + k * TPB // 2, tn[idx], vel, TPB)
                else:
                    for b in range(st, st + beats, 2):
                        for k, v in enumerate(tn[:6]):
                            s.note('harp', bt + b * TPB + k * 22, v, 52 + k * 3, int(TPB * 1.8))
            # --- melodia
            t = bt
            for note_, beats in mel[i]:
                dur = int(beats * TPB)
                if note_:
                    m = n(note_)
                    acc = 6 if t == bt else 0
                    if name == 'A':
                        s.note('flute', t, m, 86 + acc, int(dur * 0.92))
                    elif name == 'B':
                        s.note('celesta', t, m, 96 + acc, dur)
                        if beats >= 1:
                            s.note('flute', t, m - 12, 64, int(dur * 0.9))
                    else:
                        if i % 2 == 0:
                            s.note('flute', t, m, 84 + acc, int(dur * 0.92))
                        else:
                            s.note('celesta', t, m, 92 + acc, dur)
                t += dur
            # --- celesta: "gocce" di luce nella strofa (fine battuta)
            if name == 'A' and i % 2 == 1:
                top = tones(parts[-1][0], n('C6'), n('C7'))
                for k, v in enumerate(top[-3:]):
                    s.note('celesta', bt + int(3.5 * TPB) + k * TPB // 6, v, 46 + k * 6, TPB // 2)
            # --- velo d'archi lenti nel ritornello e nel ponte
            if name in ('B', 'C'):
                for ch, st, beats in parts:
                    for v in tones(ch, n('A3'), n('F4')):
                        s.note('strings', bt + st * TPB, v, 44 if name == 'B' else 38, beats * TPB - 20, human=False)
            # --- batteria pop leggerissima
            soft = 0.6 if name == 'C' else 1.0
            if name != 'C':
                s.note('drums', bt, KICK, 66, 120)
                s.note('drums', bt + int(TPB * 2.5), KICK, 50, 120)
                s.note('drums', bt + TPB, SIDE, 44, 100)
                s.note('drums', bt + 3 * TPB, SIDE, 48, 100)
            else:
                s.note('drums', bt, KICK, 44, 120)
            for k in range(8):
                s.note('drums', bt + k * TPB // 2, SHAKER if k % 2 else MARACAS, int((30 if k % 2 else 22) * soft), 80)
            if i == 0:
                s.note('drums', bt, TRIANGLE, 50, 400)
            if last_bar and name != 'C':
                # piccola salita di celesta verso la sezione successiva
                for k, v in enumerate(tones('C', n('C6'), n('C7'))):
                    s.note('celesta', bt + int(2.5 * TPB) + k * TPB // 4, v, 50 + k * 5, TPB // 3)
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
        if k != 'drums':
            msgs.append((0, 0, mido.Message('program_change', channel=c, program=PROG[k])))
        msgs.append((0, 1, mido.Message('control_change', channel=c, control=7, value=VOLS[k])))
        msgs.append((0, 1, mido.Message('control_change', channel=c, control=91, value=84)))  # riverbero (sognante)
        msgs.append((0, 1, mido.Message('control_change', channel=c, control=93, value=24)))  # chorus
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
                    '-o', 'synth.reverb.room-size=0.72', '-o', 'synth.reverb.damp=0.3', '-o', 'synth.reverb.width=1.0',
                    '-o', 'synth.reverb.level=0.62', '-o', 'synth.chorus.active=1',
                    '-F', wav_path, SF2, mid_path], check=True)


def make_loop(wav_in, loop_seconds, wav_out):
    """Ripiega la coda (riverbero oltre la fine del loop) sull'inizio: il loop non ha stacchi."""
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
