"""
Pasticceria Magica — musica di sottofondo (valzer da pasticceria).

Composizione originale scritta qui come partitura, esportata in MIDI e suonata con strumenti campionati
(MuseScore General, licenza MIT) tramite FluidSynth. Il risultato è un loop senza stacchi.

Uso (dalla cartella app/):
    sudo apt-get install fluidsynth musescore-general-soundfont-lossless ffmpeg
    pip install mido numpy
    python3 scripts/audio/pasticceria_music.py

Scrive src/games/pasticceria/audio/theme.ogg e theme.mp3 (+ theme.mid per riferimento).
"""
import os, random, subprocess, sys
import mido
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, '..', '..', 'src', 'games', 'pasticceria', 'audio'))
TMP = '/tmp/pasticceria-audio'
SF2 = os.environ.get('SF2', '/usr/share/sounds/sf2/MuseScore_General_Full.sf2')
BPM = 126
TPB = 480                      # tick per battito
BAR = 3 * TPB                  # 3/4
random.seed(7)

NOTE = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}


def n(s):
    """'C5' -> numero MIDI."""
    name, octv = s[:-1], int(s[-1])
    return NOTE[name] + (octv + 1) * 12


# --- Accordi (radice, tipo) -> note dell'accordo -------------------------------------------------
CH = {
    'F': ('F', [0, 4, 7]), 'F7': ('F', [0, 4, 7, 10]), 'Fmaj7': ('F', [0, 4, 7, 11]), 'F6': ('F', [0, 4, 7, 9]),
    'Gm7': ('G', [0, 3, 7, 10]), 'C7': ('C', [0, 4, 7, 10]), 'C9': ('C', [0, 4, 10, 14]), 'Am7': ('A', [0, 3, 7, 10]),
    'Dm7': ('D', [0, 3, 7, 10]), 'Dm': ('D', [0, 3, 7]), 'Bb': ('Bb', [0, 4, 7]), 'Bbmaj7': ('Bb', [0, 4, 7, 11]),
    'Bbm6': ('Bb', [0, 3, 7, 9]), 'D7': ('D', [0, 4, 7, 10]), 'G7': ('G', [0, 4, 7, 10]), 'G9': ('G', [0, 4, 10, 14]),
    'E7': ('E', [0, 4, 7, 10]), 'A7': ('A', [0, 4, 7, 10]), 'Bdim': ('B', [0, 3, 6, 9]),
}


def voicing(chord, low=n('A3'), high=n('F4') + 2):
    """Accordo a parti strette nel registro centrale (per piano/pizzicato)."""
    root, iv = CH[chord]
    pcs = [(NOTE[root] + i) % 12 for i in iv]
    out = []
    for p in pcs:
        m = low + ((p - low) % 12)
        if m > high:
            m -= 12
        out.append(m)
    return sorted(set(out))


def bass_note(chord, octave=2):
    return NOTE[CH[chord][0]] + (octave + 1) * 12


# --- Partitura -----------------------------------------------------------------------------------
# Ogni battuta: accordo (o due accordi "A|B": 2 battiti + 1). Melodie: (nota|None, battiti).
A_CHORDS = ['F', 'F6', 'Gm7', 'C7', 'Am7', 'Dm7', 'Gm7', 'C7', 'F', 'F7', 'Bb', 'Bbm6', 'F', 'D7', 'Gm7|C7', 'F']
A_MEL = [
    [('C5', 1), ('A4', 1), ('C5', 1)], [('F5', 2), ('E5', 1)], [('D5', 1), ('Bb4', 1), ('D5', 1)], [('G5', 2), ('F5', 1)],
    [('E5', 1), ('C5', 1), ('E5', 1)], [('A5', 2), ('G5', 1)], [('F5', 1), ('E5', 1), ('D5', 1)], [('E5', 1.5), ('D5', .5), ('C5', 1)],
    [('C5', 1), ('A4', 1), ('C5', 1)], [('F5', 2), ('Eb5', 1)], [('D5', 1), ('F5', 1), ('Bb5', 1)], [('Db5', 1), ('C5', 1), ('Bb4', 1)],
    [('A4', 1), ('C5', 1), ('F5', 1)], [('F#5', 2), ('D5', 1)], [('G5', 1), ('Bb5', 1), ('E5', 1)], [('F5', 3)],
]
B_CHORDS = ['Bbmaj7', 'Bb', 'F', 'Fmaj7', 'G9', 'G7', 'C7', 'C9', 'Bb', 'Bbm6', 'Am7', 'D7', 'Gm7', 'C7', 'F', 'C7']
B_MEL = [
    [('D5', 1), ('F5', 1), ('Bb5', 1)], [('A5', 2), ('F5', 1)], [('C5', 1), ('F5', 1), ('A5', 1)], [('G5', 2), ('F5', 1)],
    [('B4', 1), ('D5', 1), ('G5', 1)], [('F5', 2), ('D5', 1)], [('E5', 1), ('G5', 1), ('Bb5', 1)], [('A5', 2), ('G5', 1)],
    [('F5', 1), ('D5', 1), ('Bb4', 1)], [('Db5', 1), ('F5', 1), ('Bb5', 1)], [('C5', 1), ('E5', 1), ('A5', 1)], [('F#5', 2), ('A5', 1)],
    [('G5', 1), ('F5', 1), ('D5', 1)], [('E5', 1.5), ('D5', .5), ('E5', 1)], [('F5', 3)], [('E5', 1), ('D5', 1), ('C5', 1)],
]
# Ponte "magico": celesta e arpa, armonia sospesa
C_CHORDS = ['Dm7', 'Bbmaj7', 'Gm7', 'C7', 'Am7', 'Dm7', 'Gm7', 'C7']
C_MEL = [
    [('A5', 1), ('F5', 1), ('D5', 1)], [('D6', 2), ('A5', 1)], [('Bb5', 1), ('G5', 1), ('D5', 1)], [('E5', 3)],
    [('C6', 1), ('A5', 1), ('E5', 1)], [('F5', 2), ('A5', 1)], [('G5', 1), ('Bb5', 1), ('D6', 1)], [('C6', 1.5), ('Bb5', .5), ('G5', 1)],
]
A2_CHORDS = A_CHORDS[:15] + ['F|C7']
A2_MEL = A_MEL[:15] + [[('F5', 2), ('C5', 1)]]

SECTIONS = [
    ('A', A_CHORDS, A_MEL),
    ('B', B_CHORDS, B_MEL),
    ('C', C_CHORDS, C_MEL),
    ('A2', A2_CHORDS, A2_MEL),
]

# Canali e strumenti General MIDI (MuseScore General)
CHN = dict(celesta=0, flute=1, clarinet=2, piano=3, pizz=4, strings=5, bass=6, harp=7, glock=8, drums=9, vibes=10)
PROG = dict(celesta=8, flute=73, clarinet=71, piano=0, pizz=45, strings=49, bass=32, harp=46, glock=9, vibes=11)


class Score:
    def __init__(self):
        self.ev = []   # (tick, ch, note, vel, dur)

    def note(self, ch, t, note, vel, dur, human=True):
        if human:
            t += random.randint(-8, 8)
            vel = max(1, min(127, vel + random.randint(-5, 5)))
        self.ev.append((max(0, t), CHN[ch], note, vel, max(30, dur)))


def chords_of(bar_spec):
    """'Gm7|C7' -> [('Gm7', 0, 2), ('C7', 2, 1)] (battito d'inizio, battiti)."""
    if '|' in bar_spec:
        a, b = bar_spec.split('|')
        return [(a, 0, 2), (b, 2, 1)]
    return [(bar_spec, 0, 3)]


def compose():
    s = Score()
    t0 = 0
    for name, chords, mel in SECTIONS:
        for i, spec in enumerate(chords):
            bt = t0 + i * BAR
            phrase_start = i % 4 == 0
            # --- basso: fondamentale sul primo battito, quinta o passaggio sul terzo nelle cadenze
            for ch, st, beats in chords_of(spec):
                root = bass_note(ch, 2 if NOTE[CH[ch][0]] >= 5 else 3)
                if root > n('D3'):
                    root -= 12
                s.note('bass', bt + st * TPB, root, 92 if st == 0 else 80, int(TPB * 1.6))
                if beats == 3 and name in ('B', 'A2') and i % 2 == 1:
                    s.note('bass', bt + 2 * TPB, root + 7, 70, int(TPB * 0.9))
            # --- accompagnamento "um-pa-pa" sui battiti 2 e 3
            comp = 'piano' if name in ('A', 'A2') else 'pizz' if name == 'B' else None
            if comp:
                for ch, st, beats in chords_of(spec):
                    for b in range(st, st + beats):
                        if b == 0:
                            continue
                        for v in voicing(ch):
                            s.note(comp, bt + b * TPB, v, 52 if comp == 'piano' else 62, int(TPB * (0.55 if comp == 'piano' else 0.4)))
            # --- tappeto d'archi (B, ponte, ripresa)
            if name in ('B', 'C', 'A2'):
                for ch, st, beats in chords_of(spec):
                    for v in voicing(ch, n('F3'), n('D4') + 4):
                        s.note('strings', bt + st * TPB, v, 38 if name != 'C' else 46, beats * TPB - 20, human=False)
            # --- arpa: arpeggi nel ponte, glissando a fine sezione
            if name == 'C':
                ch = chords_of(spec)[0][0]
                vs = voicing(ch, n('F3'), n('F4'))
                arp = vs + [v + 12 for v in vs] + [v + 24 for v in vs]
                for k in range(6):
                    s.note('harp', bt + k * TPB // 2, arp[k % len(arp)], 46, TPB * 2)
            if i == len(chords) - 1:
                ch = chords_of(spec)[-1][0]
                vs = voicing(ch, n('C4'), n('B4'))
                g = [v + 12 * o for o in range(3) for v in vs]
                for k, v in enumerate(g[:10]):
                    s.note('harp', bt + 2 * TPB + k * TPB // 10, v, 50 + k * 3, TPB * 2, human=False)
            # --- melodia
            t = bt
            for note_, beats in mel[i]:
                dur = int(beats * TPB)
                if note_:
                    m = n(note_)
                    accent = 8 if t == bt else 0
                    if name == 'A':
                        s.note('celesta', t, m, 84 + accent, int(dur * 0.95))
                    elif name == 'B':
                        s.note('flute', t, m, 78 + accent, int(dur * 0.92))
                        if beats >= 2:   # risposta della celesta sulle note lunghe
                            s.note('celesta', t + TPB, m + 12, 48, TPB)
                    elif name == 'C':
                        s.note('celesta', t, m, 80 + accent, int(dur * 0.95))
                        s.note('glock', t, m, 50, int(dur * 0.6))
                    else:  # A2: clarinetto con celesta all'ottava sopra
                        s.note('clarinet', t, m - 12, 78 + accent, int(dur * 0.92))
                        s.note('celesta', t, m, 62 + accent, int(dur * 0.9))
                t += dur
            # --- contro-canto del flauto nella ripresa (note lunghe)
            if name == 'A2':
                ch = chords_of(spec)[0][0]
                top = max(voicing(ch, n('A4'), n('G5')))
                s.note('flute', bt, top, 44, BAR - 60)
            # --- percussioni leggere: shaker sui battiti 2-3, triangolo a inizio frase
            for b in (1, 2):
                s.note('drums', bt + b * TPB, 70, 30 if name != 'C' else 22, 120)
            s.note('drums', bt, 70, 22, 120)
            if phrase_start:
                s.note('drums', bt, 81, 46 if name != 'C' else 54, TPB * 2)
            if name in ('B', 'A2'):
                s.note('drums', bt, 36, 34, 200)        # cassa morbida sul primo battito
        t0 += len(chords) * BAR
    return s, t0


def write_midi(s, total, path, tail_bars=2):
    mid = mido.MidiFile(ticks_per_beat=TPB)
    meta = mido.MidiTrack()
    meta.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(BPM)))
    meta.append(mido.MetaMessage('time_signature', numerator=3, denominator=4))
    mid.tracks.append(meta)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    msgs = []
    vols = dict(celesta=104, flute=90, clarinet=92, piano=84, pizz=92, strings=80, bass=74, harp=84, glock=96, drums=84, vibes=80)
    for k, c in CHN.items():
        if k != 'drums':
            msgs.append((0, 0, mido.Message('program_change', channel=c, program=PROG[k])))
        msgs.append((0, 1, mido.Message('control_change', channel=c, control=7, value=vols[k])))
        msgs.append((0, 1, mido.Message('control_change', channel=c, control=91, value=70)))  # riverbero
        msgs.append((0, 1, mido.Message('control_change', channel=c, control=93, value=12)))  # chorus
        pan = dict(celesta=74, flute=52, clarinet=58, piano=46, pizz=80, strings=64, bass=64, harp=40, glock=84, drums=64, vibes=64)[k]
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
