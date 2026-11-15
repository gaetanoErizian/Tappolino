"""
Pompieri in Azione — musica di sottofondo ("La marcetta dei pompieri").

Composizione originale scritta qui come partitura: marcetta pop allegra in Fa maggiore con tromba,
sezione di ottoni, corni sui contrattempi, tuba, xilofono, glockenspiel, archi e batteria da banda
(rullante con rulli, cassa, piatti). Esportata in MIDI e suonata con strumenti campionati
(MuseScore General, licenza MIT) tramite FluidSynth. Il loop è senza stacchi: la partitura viene
suonata due volte e si tiene la seconda, così le code del riverbero rientrano nell'inizio.

Forma (32 battute a 124 bpm, ~62 s): A (tromba) · A' (tromba + glockenspiel) · B (xilofono e flauto,
più leggero, con il richiamo "ni-no" dei corni) · A'' (tutta la banda, pizzicati degli archi).

Uso (dalla cartella app/):
    sudo apt-get install fluidsynth musescore-general-soundfont-lossless ffmpeg
    pip install mido numpy scipy
    python3 scripts/audio/pompieri_music.py

Scrive in src/games/pompieri/audio/: theme.ogg, theme.mp3, theme.mid.
Se cambi BPM o numero di battute aggiorna THEME_LOOP in src/games/pompieri/sfx.ts (lo script stampa il valore).
"""
import os, random, subprocess
import mido
import numpy as np
from scipy.io import wavfile

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, '..', '..', 'src', 'games', 'pompieri', 'audio'))
TMP = '/tmp/pompieri-audio'
SF2 = os.environ.get('SF2', '/usr/share/sounds/sf2/MuseScore_General_Full.sf2')
SR = 44100
BPM = 124
TPB = 480
BEATS = 4
BARS = 32
LOOP_SEC = BARS * BEATS * 60 / BPM
random.seed(23)

NOTE = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
        'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}


def n(s):
    """'Bb5' -> numero MIDI."""
    return NOTE[s[:-1]] + (int(s[-1]) + 1) * 12


# Strumenti General MIDI (canale 9 = batteria)
PROG = dict(trumpet=56, brass=61, horns=60, tuba=58, xylo=13, glock=9, flute=73, strings=48, pizz=45, timp=47)
CH = dict(trumpet=0, brass=1, horns=2, tuba=3, xylo=4, glock=5, flute=6, strings=7, pizz=8, drums=9, timp=10)
PAN = dict(trumpet=60, brass=50, horns=78, tuba=64, xylo=88, glock=74, flute=40, strings=46, pizz=86, timp=64)
VOL = dict(trumpet=118, brass=92, horns=88, tuba=104, xylo=112, glock=84, flute=96, strings=70, pizz=90, timp=88)
KICK, SIDE, SNARE, CLAP, HAT, OHAT, CRASH, TAMB, LTOM, MTOM, HTOM = 36, 37, 38, 39, 42, 46, 49, 54, 45, 47, 50

# Accordi: nome -> (fondamentale, intervalli)
CHORD = {
    'F': ('F', [0, 4, 7]), 'Dm': ('D', [0, 3, 7]), 'Bb': ('Bb', [0, 4, 7]), 'C': ('C', [0, 4, 7]),
    'C7': ('C', [0, 4, 7, 10]), 'Gm7': ('G', [0, 3, 7, 10]), 'Am': ('A', [0, 3, 7]), 'Gm': ('G', [0, 3, 7]),
}

# Armonia per battuta ("X|Y" = due accordi, 2 battiti ciascuno)
A = ['F', 'F', 'Bb', 'C', 'F', 'Dm', 'Gm7|C7', 'F']
A_END = ['F', 'F', 'Bb', 'C', 'F', 'Dm', 'Gm7|C7', 'F|C7']
B = ['Bb', 'C', 'Am', 'Dm', 'Gm', 'C', 'F', 'C7']
HARMONY = A + A_END + B + A_END

# Melodie: per battuta (nota, battito d'inizio, durata in battiti)
MEL_A = [
    [('C5', 0, .5), ('F5', .5, .5), ('A5', 1, 1), ('C6', 2, 1), ('A5', 3, 1)],
    [('G5', 0, .5), ('A5', .5, .5), ('F5', 1, 1.5), ('C5', 2.5, .5), ('F5', 3, 1)],
    [('Bb5', 0, .5), ('D6', .5, .5), ('F6', 1, 1), ('D6', 2, .5), ('Bb5', 2.5, .5), ('G5', 3, 1)],
    [('A5', 0, 1), ('G5', 1, .5), ('A5', 1.5, .5), ('C6', 2, 2)],
    [('C5', 0, .5), ('F5', .5, .5), ('A5', 1, 1), ('C6', 2, 1), ('F6', 3, 1)],
    [('E6', 0, .5), ('D6', .5, .5), ('A5', 1, 1), ('F5', 2, 1), ('D5', 3, 1)],
    [('Bb5', 0, 1), ('A5', 1, .5), ('G5', 1.5, .5), ('E5', 2, .5), ('G5', 2.5, .5), ('C6', 3, .5), ('Bb5', 3.5, .5)],
    [('A5', 0, 1.5), ('F5', 1.5, .5), ('F5', 2, 1)],
]
MEL_A_END = MEL_A[:7] + [[('A5', 0, 1), ('F5', 1, 1), ('G5', 2, .5), ('Bb5', 2.5, .5), ('C6', 3, .5), ('E6', 3.5, .5)]]
MEL_B = [
    [('D6', 0, 1), ('F6', 1, 1), ('D6', 2, .5), ('C6', 2.5, .5), ('Bb5', 3, 1)],
    [('C6', 0, 1), ('E6', 1, 1), ('G6', 2, 1.5), ('E6', 3.5, .5)],
    [('E6', 0, 1), ('C6', 1, .5), ('A5', 1.5, .5), ('C6', 2, 1), ('E6', 3, 1)],
    [('F6', 0, 1.5), ('E6', 1.5, .5), ('D6', 2, 2)],
    [('D6', 0, .5), ('Bb5', .5, .5), ('G5', 1, 1), ('Bb5', 2, .5), ('D6', 2.5, .5), ('G6', 3, 1)],
    [('E6', 0, 1), ('C6', 1, 1), ('G5', 2, 1), ('C6', 3, 1)],
    [('A5', 0, .5), ('C6', .5, .5), ('F6', 1, 1.5), ('E6', 2.5, .5), ('D6', 3, .5), ('C6', 3.5, .5)],
    [('Bb5', 0, 1), ('G5', 1, 1), ('E5', 2, .5), ('G5', 2.5, .5), ('Bb5', 3, .5), ('C6', 3.5, .5)],
]
MELODY = MEL_A + MEL_A_END + MEL_B + MEL_A_END


def chord_parts(spec):
    """'Gm7|C7' -> [('Gm7', 0, 2), ('C7', 2, 2)]"""
    if '|' in spec:
        a, b = spec.split('|')
        return [(a, 0, 2), (b, 2, 2)]
    return [(spec, 0, 4)]


def tones(chord, low):
    """Note dell'accordo a parti strette a partire da `low` (MIDI)."""
    root, iv = CHORD[chord]
    pcs = [(NOTE[root] + i) % 12 for i in iv]
    return sorted(low + ((p - low) % 12) for p in pcs)


def root_of(chord, octave):
    return NOTE[CHORD[chord][0]] + (octave + 1) * 12


def loop_events():
    """Eventi di un giro: (tick, canale, nota, velocità, durata in tick)."""
    ev = []

    def add(part, note, beat, dur, vel, bar, human=True):
        t = int((bar * BEATS + beat) * TPB) + (random.randint(-6, 6) if human else 0)
        v = vel + (random.randint(-6, 6) if human else 0)
        ev.append((max(0, t), CH[part], note if isinstance(note, int) else n(note), max(1, min(127, v)), max(20, int(dur * TPB))))

    for bar in range(BARS):
        sec = 'A' if bar < 8 else 'A1' if bar < 16 else 'B' if bar < 24 else 'A2'
        phrase_end = bar % 8 == 7
        mel = MELODY[bar]

        # --- melodia
        for note, beat, dur in mel:
            accent = 100 if beat % 1 == 0 else 88
            if sec in ('A', 'A1', 'A2'):
                add('trumpet', note, beat, min(dur, 1.6) * .92, accent, bar)
                if sec in ('A1', 'A2'):
                    add('glock', n(note) + 12 if n(note) < n('C6') else note, beat, .5, 58, bar)
                if sec == 'A2':
                    add('brass', n(note) - 12, beat, min(dur, 1.6) * .9, accent - 18, bar)
            else:
                add('xylo', note, beat, .4, accent + 4, bar)
                add('flute', note, beat, min(dur, 1.5) * .95, 74, bar)

        # --- tuba: fondamentale sul 1, quinta sul 3 (oom-pah)
        for ch, st, beats in chord_parts(HARMONY[bar]):
            r = root_of(ch, 1 if NOTE[CHORD[ch][0]] >= 5 else 2)
            add('tuba', r, st, .8, 98, bar)
            if beats == 4:
                add('tuba', r + 7, 2, .8, 88, bar)
            # passaggio verso la battuta seguente a fine frase
        if phrase_end and sec != 'B':
            add('tuba', 'G1', 3, .45, 80, bar)
            add('tuba', 'A1', 3.5, .45, 84, bar)

        # --- corni: accordo corto sui contrattempi 2 e 4 (il "pa" della banda)
        if sec != 'B':
            for ch, st, beats in chord_parts(HARMONY[bar]):
                for b in (1, 3):
                    if st <= b < st + beats:
                        for tn in tones(ch, n('A3')):
                            add('horns', tn, b, .35, 72, bar)
        else:
            # richiamo "ni-no" dei corni (come la sirena) a battute alterne
            if bar % 2 == 0:
                add('horns', 'A4', 2.5, .6, 70, bar)
                add('horns', 'D5', 3.25, .6, 74, bar)

        # --- archi: tappeto morbido nel B, pizzicati ad arpeggio nell'A''
        for ch, st, beats in chord_parts(HARMONY[bar]):
            tt = tones(ch, n('F4'))
            if sec == 'B':
                for tn in tt[:3]:
                    add('strings', tn, st, beats - .1, 52, bar)
            if sec == 'A2':
                arp = [tt[0], tt[1], tt[2], tt[1] + 12 if len(tt) > 1 else tt[0] + 12]
                for i in range(int(beats * 2)):
                    add('pizz', arp[i % 4] + 12, st + i * .5, .3, 66 if i % 2 == 0 else 54, bar)

        # --- timpani sugli inizi di frase
        if bar % 8 == 0:
            add('timp', root_of(HARMONY[bar].split('|')[0], 1) + 12, 0, 1, 84, bar)

        # --- batteria da banda
        if sec == 'B':
            add('drums', KICK, 0, .2, 70, bar)
            add('drums', KICK, 2, .2, 62, bar)
            add('drums', SIDE, 1, .1, 64, bar)
            add('drums', SIDE, 3, .1, 66, bar)
            for i in range(8):
                add('drums', TAMB, i * .5, .1, 46 if i % 2 else 60, bar)
        else:
            add('drums', KICK, 0, .2, 92, bar)
            add('drums', KICK, 2, .2, 84, bar)
            add('drums', SNARE, 1, .15, 92, bar)
            add('drums', SNARE, 3, .15, 96, bar)
            add('drums', CLAP, 3, .15, 60, bar)
            for i in range(8):
                add('drums', HAT, i * .5, .1, 66 if i % 2 else 52, bar)
            if bar % 2 == 1 and not phrase_end:      # piccolo "rat-ta" della banda
                add('drums', SNARE, 3.5, .1, 60, bar)
                add('drums', SNARE, 3.75, .1, 68, bar)
        if bar % 8 == 0:
            add('drums', CRASH, 0, 1, 86 if sec != 'B' else 62, bar)
        if phrase_end:                                # rullo di rullante che sale verso la frase seguente
            for i in range(8):
                add('drums', SNARE, 2 + i * .25, .1, 52 + i * 7, bar, human=False)
            if sec != 'B':
                add('drums', HTOM, 3.5, .1, 80, bar)
                add('drums', MTOM, 3.75, .1, 84, bar)
    return ev


def write_midi(path, events, extra_ticks=0, bpm=BPM):
    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(bpm), time=0))
    for part, prog in PROG.items():
        tr.append(mido.Message('program_change', channel=CH[part], program=prog, time=0))
        tr.append(mido.Message('control_change', channel=CH[part], control=7, value=VOL[part], time=0))
        tr.append(mido.Message('control_change', channel=CH[part], control=10, value=PAN[part], time=0))
        tr.append(mido.Message('control_change', channel=CH[part], control=91, value=50, time=0))
    tr.append(mido.Message('control_change', channel=9, control=7, value=104, time=0))
    tr.append(mido.Message('control_change', channel=9, control=91, value=30, time=0))
    msgs = []
    for t, ch, note, vel, dur in events:
        msgs.append((t, 1, mido.Message('note_on', channel=ch, note=note, velocity=vel)))
        msgs.append((t + max(10, dur), 0, mido.Message('note_off', channel=ch, note=note, velocity=0)))
    msgs.sort(key=lambda m: (m[0], m[1]))
    now = 0
    for t, _, msg in msgs:
        tr.append(msg.copy(time=t - now))
        now = t
    tr.append(mido.MetaMessage('end_of_track', time=max(0, extra_ticks)))
    mid.save(path)


def render(mid_path, wav_path, gain=0.6):
    subprocess.run(['fluidsynth', '-ni', '-g', str(gain), '-r', str(SR), '-F', wav_path,
                    '-o', 'synth.reverb.active=1', '-o', 'synth.reverb.room-size=0.55', '-o', 'synth.reverb.level=0.5',
                    '-o', 'synth.reverb.damp=0.3', '-o', 'synth.chorus.active=0', SF2, mid_path],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    sr, data = wavfile.read(wav_path)
    assert sr == SR
    return data.astype(np.float64) / 32768.0


def eq(x):
    """Equalizzazione per gli altoparlanti piccoli (circolare in frequenza: il loop resta senza stacchi)."""
    f = np.fft.rfftfreq(len(x), 1 / SR)
    g = np.ones_like(f)
    g *= 1 / np.sqrt(1 + (40 / np.maximum(f, 1)) ** 4)                    # passa-alto a 40 Hz
    g *= 10 ** (-2.5 / 20 * (1 / (1 + (f / 150) ** 2)))                   # meno bassi profondi
    g *= 10 ** (4.0 / 20 * (1 - 1 / (1 + (f / 2800) ** 2)))               # più presenza e brillantezza
    return np.stack([np.fft.irfft(np.fft.rfft(x[:, c]) * g, len(x)) for c in range(x.shape[1])], axis=1)


def master(x, peak_db=-1.5):
    x = eq(x - x.mean(axis=0))
    x = x / (np.abs(x).max() + 1e-9)
    x = np.tanh(x * 1.6) / np.tanh(1.6)
    return x * (10 ** (peak_db / 20))


def save_wav(path, x):
    wavfile.write(path, SR, np.clip(x * 32767.0, -32768, 32767).astype(np.int16))


def encode(wav, dst, kind):
    args = ['-c:a', 'libvorbis', '-q:a', '3.5'] if kind == 'ogg' else ['-c:a', 'libmp3lame', '-b:a', '112k']
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, *args, dst], check=True)


def music():
    one = loop_events()
    ticks = BARS * BEATS * TPB
    # Tre giri: si tiene quello centrale. Le note lunghe (ottoni, archi) a fine giro non hanno la stessa
    # fase all'inizio del giro dopo, quindi le prime decine di millisecondi vengono sfumate con la vera
    # continuazione (l'inizio del terzo giro): la giunzione del loop diventa invisibile.
    thrice = [(t + k * ticks, ch, note, vel, dur) for k in range(3) for t, ch, note, vel, dur in one]
    write_midi(f'{TMP}/theme3.mid', thrice, extra_ticks=4 * TPB)
    write_midi(f'{OUT}/theme.mid', one)
    x = render(f'{TMP}/theme3.mid', f'{TMP}/theme3.wav')
    n_loop = int(round(LOOP_SEC * SR))
    raw = x[n_loop:2 * n_loop].copy()
    fade = int(0.04 * SR)
    w = np.linspace(0, 1, fade)[:, None]
    raw[:fade] = raw[:fade] * w + x[2 * n_loop:2 * n_loop + fade] * (1 - w)
    loop = master(raw)
    # stesso volume percepito della musica del menu (~-16,5 dB RMS): la marcetta è densa, si abbassa un po'
    loop *= 10 ** ((-16.5 - 20 * np.log10(np.sqrt((loop ** 2).mean()) + 1e-9)) / 20)
    seam = float(np.abs(loop[0] - loop[-1]).max())
    typical = float(np.abs(np.diff(loop, axis=0)).mean())
    save_wav(f'{TMP}/theme.wav', loop)
    encode(f'{TMP}/theme.wav', f'{OUT}/theme.ogg', 'ogg')
    encode(f'{TMP}/theme.wav', f'{OUT}/theme.mp3', 'mp3')
    rms = 20 * np.log10(np.sqrt((loop ** 2).mean()) + 1e-9)
    print(f'theme: {len(loop) / SR:.4f} s (THEME_LOOP = {LOOP_SEC:.6f}), picco {20 * np.log10(np.abs(loop).max()):.1f} dB, '
          f'RMS {rms:.1f} dB, salto alla giunzione {seam:.4f} (medio tra campioni {typical:.4f})')


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(TMP, exist_ok=True)
    music()
