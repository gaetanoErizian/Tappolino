"""
Officina dei Monster Truck — musica di sottofondo ("Su di giri!").

Rock allegro in La maggiore, 4/4 a 128 bpm, dritto: chitarra elettrica pulita (riff e melodia), chitarra
pulita stoppata (le "pennate" ritmiche), organo rock (accordi in levare, tappeto e melodia nella ripresa),
basso elettrico suonato col plettro (crome), batteria (cassa, rullante, charleston, piatti e un giro di tom
che riporta all'inizio). Composizione originale scritta qui come partitura, esportata in MIDI e suonata con
strumenti campionati (MuseScore General, licenza MIT) tramite FluidSynth. Loop esatto di 60 secondi (32 battute).

Forma: A (riff di chitarra) · B (melodia di chitarra, organo disteso) · A' (riff all'organo) · C (ritornello
pieno con l'organo che raddoppia la melodia, giro di tom alla fine).

Uso (dalla cartella app/):
    sudo apt-get install fluidsynth musescore-general-soundfont-lossless ffmpeg
    pip install mido numpy
    python3 scripts/audio/monstertruck_music.py

Scrive src/games/monstertruck/audio/theme.ogg e theme.mp3 (+ theme.mid per riferimento).
Se cambi BPM o numero di battute aggiorna THEME_LOOP in src/games/monstertruck/sfx.ts (lo script stampa il valore).
"""
import os, random, subprocess
import mido
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, '..', '..', 'src', 'games', 'monstertruck', 'audio'))
TMP = '/tmp/monstertruck-audio'
SF2 = os.environ.get('SF2', '/usr/share/sounds/sf2/MuseScore_General_Full.sf2')
BPM = 128
TPB = 480                      # tick per battito
BAR = 4 * TPB                  # 4/4
random.seed(7)

NOTE = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}


def n(s):
    """'C5' -> numero MIDI."""
    name, octv = s[:-1], int(s[-1])
    return NOTE[name] + (octv + 1) * 12


CH = {
    'A': ('A', ['A', 'C#', 'E']),
    'D': ('D', ['D', 'F#', 'A']),
    'E': ('E', ['E', 'G#', 'B']),
    'F#m': ('F#', ['F#', 'A', 'C#']),
    'C#m': ('C#', ['C#', 'E', 'G#']),
    'B': ('B', ['B', 'D#', 'F#']),
}


def tones(chord, low, high):
    pcs = {NOTE[x] for x in CH[chord][1]}
    return [m for m in range(low, high + 1) if m % 12 in pcs]


def root(chord, low):
    pc = NOTE[CH[chord][0]]
    return low + ((pc - low) % 12)


# --- Partitura (melodie: (nota|None, battiti)) -----------------------------------------------------
R1 = [('A4', .5), (None, .5), ('A4', .5), ('C#5', .5), ('E5', .5), ('F#5', .5), ('E5', .5), ('C#5', .5)]
R2 = [('D5', .5), (None, .5), ('D5', .5), ('F#5', .5), ('A5', 1), ('F#5', 1)]
R4 = [('E5', .5), (None, .5), ('E5', .5), ('G#5', .5), ('B5', 1), ('G#5', .5), ('E5', .5)]
R8 = [('E5', 1), ('D5', .5), ('C#5', .5), ('B4', 1), ('G#4', 1)]
A_CH = ['A', 'D', 'A', 'E', 'A', 'D', 'E', 'E']
A_MEL = [R1, R2, R1, R4, R1, R2, R4, R8]
B_CH = ['F#m', 'D', 'A', 'E', 'F#m', 'D', 'B', 'E']
B_MEL = [
    [('C#5', .5), ('E5', .5), ('F#5', 1), ('E5', .5), ('C#5', .5), ('A4', 1)],
    [('F#5', 1.5), ('E5', .5), ('D5', 1), ('A4', 1)],
    [('C#5', .5), ('E5', .5), ('A5', 1), ('E5', .5), ('C#5', .5), ('E5', 1)],
    [('B4', 2), (None, 1), ('E5', .5), ('F#5', .5)],
    [('A5', .5), ('G#5', .5), ('F#5', 1), ('E5', .5), ('F#5', .5), ('A5', 1)],
    [('F#5', 1), ('D5', .5), ('F#5', .5), ('A5', 1), ('F#5', 1)],
    [('F#5', 1), ('D#5', 1), ('B4', 1), ('D#5', 1)],
    [('E5', 2), (None, 1), ('B4', .5), ('C#5', .5)],
]
C_CH = ['D', 'E', 'C#m', 'F#m', 'D', 'E', 'A', 'E']
C_MEL = [
    [('A5', 1), ('F#5', .5), ('A5', .5), ('B5', 1), ('A5', 1)],
    [('G#5', 1.5), ('E5', .5), ('B5', 2)],
    [('G#5', .5), ('E5', .5), ('C#5', 1), ('E5', .5), ('G#5', .5), ('C#6', 1)],
    [('A5', 2), ('F#5', 1), ('E5', 1)],
    [('F#5', .5), ('A5', .5), ('D6', 1), ('C#6', .5), ('B5', .5), ('A5', 1)],
    [('B5', 1), ('G#5', 1), ('E5', 1), ('B5', 1)],
    [('C#6', 1.5), ('B5', .5), ('A5', 1), ('E5', 1)],
    [('E5', .5), ('F#5', .5), ('G#5', .5), ('B5', .5), (None, 2)],
]
SECTIONS = [('A', A_CH, A_MEL), ('B', B_CH, B_MEL), ('A2', A_CH, A_MEL), ('C', C_CH, C_MEL)]

CHN = dict(lead=0, chug=1, strum=2, organ=3, bass=4, drums=9)
PROG = dict(lead=27, chug=28, strum=27, organ=18, bass=34, drums=0)
VOLS = dict(lead=104, chug=86, strum=78, organ=78, bass=108, drums=110)
PANS = dict(lead=58, chug=36, strum=92, organ=74, bass=64, drums=64)
REVB = dict(lead=60, chug=30, strum=50, organ=60, bass=20, drums=40)

KICK, SNARE, HAT, OPEN, CRASH, RIDE, TOM_H, TOM_M, TOM_L, CLAP = 36, 38, 42, 46, 49, 51, 50, 47, 45, 39


class Score:
    def __init__(self):
        self.ev = []   # (tick, ch, note, vel, dur)

    def note(self, ch, t, note, vel, dur, human=True):
        if human:
            t += random.randint(-6, 6)
            vel = max(1, min(127, vel + random.randint(-6, 6)))
        self.ev.append((max(0, t), CHN[ch], note, vel, max(30, dur)))


def melody(s, ch, bt, notes, vel, octave=0, dur_k=0.92):
    t = bt
    for note_, beats in notes:
        d = int(beats * TPB)
        if note_:
            s.note(ch, t, n(note_) + 12 * octave, vel + (8 if t == bt else 0), int(d * dur_k))
        t += d


def compose():
    s = Score()
    t0 = 0
    for name, chords, mel in SECTIONS:
        for i, ch in enumerate(chords):
            bt = t0 + i * BAR
            last = i == len(chords) - 1
            nxt = chords[(i + 1) % len(chords)] if not last else ('F#m' if name == 'A' else 'A' if name == 'B' else 'D' if name == 'A2' else 'A')
            r = root(ch, n('C#3'))
            power = [r, r + 7, r + 12]
            # --- chitarre ritmiche
            if name in ('A', 'A2'):
                for k in range(8):   # pennate stoppate in crome, accento sull'1 e sul levare del 2
                    acc = k in (0, 3, 4)
                    for v in power[:2]:
                        s.note('chug', bt + k * TPB // 2, v, 96 if acc else 72, TPB // 2 - 60)
            else:
                for st, d in ((0, 1.5), (1.5, 1), (2.5, 1.5)):
                    for k, v in enumerate(tones(ch, n('E3'), n('E5'))[:5]):
                        s.note('strum', bt + int(st * TPB) + k * 14, v, 78 if st == 0 else 66, int(d * TPB) - 40)
            # --- organo: accordi in levare nel riff, tappeto nella B, melodia nella ripresa e nel ritornello
            org = tones(ch, n('A3'), n('A4'))[:3]
            if name == 'A':
                for b in (1, 3):
                    for v in org:
                        s.note('organ', bt + b * TPB + TPB // 2, v, 70, TPB // 2 - 40)
            elif name == 'B':
                for v in org:
                    s.note('organ', bt, v, 58, BAR - 60, human=False)
            elif name == 'A2':
                melody(s, 'organ', bt, mel[i], 82)
                for v in org:
                    s.note('organ', bt, v - 12, 50, BAR - 60, human=False)
            else:
                melody(s, 'organ', bt, mel[i], 74)
            # --- chitarra solista
            if name in ('A', 'B', 'C'):
                melody(s, 'lead', bt, mel[i], 92 if name != 'C' else 96)
            # --- basso col plettro: crome sulla fondamentale, passaggio verso l'accordo dopo
            br = root(ch, n('E1'))
            for k in range(8):
                v = br + (12 if k in (3, 6) and name != 'B' else 0)
                if k == 7:
                    tgt = root(nxt, n('E1'))
                    v = tgt - 1 if (tgt - br) % 12 > 6 else tgt + 2 if tgt != br else br + 7
                s.note('bass', bt + k * TPB // 2, v, 100 if k % 2 == 0 else 84, TPB // 2 - 30)
            # --- batteria
            if i == 0:
                s.note('drums', bt, CRASH, 100, 400, human=False)
            for b in range(4):
                if b in (0, 2):
                    s.note('drums', bt + b * TPB, KICK, 108, 120)
                if b in (1, 3):
                    s.note('drums', bt + b * TPB, SNARE, 104, 120)
                    if name == 'C':
                        s.note('drums', bt + b * TPB, CLAP, 70, 120)
            if name != 'B' or i % 2:
                s.note('drums', bt + 2 * TPB + TPB // 2, KICK, 92, 120)
            for k in range(8):
                hat = OPEN if k == 7 and name != 'B' else HAT
                if name == 'B':
                    s.note('drums', bt + k * TPB // 2, RIDE, 70 if k % 2 == 0 else 56, 200)
                else:
                    s.note('drums', bt + k * TPB // 2, hat, 80 if k % 2 == 0 else 60, 100)
            if last and name == 'C':   # giro di tom che riporta all'inizio
                for k, tom in enumerate([SNARE, SNARE, TOM_H, TOM_H, TOM_M, TOM_M, TOM_L, TOM_L]):
                    s.note('drums', bt + 2 * TPB + k * TPB // 4, tom, 88 + k * 3, 100, human=False)
            elif last:
                for k in range(4):
                    s.note('drums', bt + 3 * TPB + k * TPB // 4, SNARE, 70 + k * 8, 90, human=False)
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
                    '-o', 'synth.reverb.room-size=0.5', '-o', 'synth.reverb.damp=0.4', '-o', 'synth.reverb.width=0.9',
                    '-o', 'synth.reverb.level=0.4', '-o', 'synth.chorus.active=1',
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
