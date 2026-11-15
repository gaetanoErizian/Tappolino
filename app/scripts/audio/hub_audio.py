"""
Tappolino — musica ed effetti del menu dei giochi.

Composizione originale scritta qui come partitura ("Il saltello di Tappo": pop solare con marimba,
chitarrina, basso, battimani e shaker), esportata in MIDI e suonata con strumenti campionati
(MuseScore General, licenza MIT) tramite FluidSynth. La musica è un loop senza stacchi: la partitura
viene suonata due volte e si tiene la seconda, così le code del riverbero rientrano nell'inizio.

Uso (dalla cartella app/):
    sudo apt-get install fluidsynth musescore-general-soundfont-lossless ffmpeg
    pip install mido numpy scipy
    python3 scripts/audio/hub_audio.py

Scrive in src/hub/audio/: theme.ogg, theme.mp3, theme.mid e sfx_*.mp3.
Se cambi BPM o numero di battute aggiorna HUB_LOOP in src/hub/sound.ts (lo script stampa il valore).
"""
import os, random, subprocess
import mido
import numpy as np
from scipy.io import wavfile

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, '..', '..', 'src', 'hub', 'audio'))
TMP = '/tmp/tappolino-hub-audio'
SF2 = os.environ.get('SF2', '/usr/share/sounds/sf2/MuseScore_General_Full.sf2')
SR = 44100
BPM = 108
TPB = 480
BEATS = 4
BARS = 16
LOOP_SEC = BARS * BEATS * 60 / BPM
random.seed(11)

NOTE = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}


def n(s):
    """'F#5' -> numero MIDI."""
    return NOTE[s[:-1]] + (int(s[-1]) + 1) * 12


# Programmi General MIDI (canale 9 = batteria)
MARIMBA, GLOCK, GUITAR, BASS, PAD, PIZZ, HARP = 12, 9, 24, 32, 89, 45, 46
KICK, STICK, CLAP, TAMB, SHAKER, WOOD = 36, 37, 39, 54, 82, 76
CH = {'lead': 0, 'glock': 1, 'guitar': 2, 'bass': 3, 'pad': 4, 'pizz': 5, 'harp': 6, 'drums': 9}
PROG = {'lead': MARIMBA, 'glock': GLOCK, 'guitar': GUITAR, 'bass': BASS, 'pad': PAD, 'pizz': PIZZ, 'harp': HARP}
PAN = {'lead': 58, 'glock': 76, 'guitar': 44, 'bass': 64, 'pad': 64, 'pizz': 86, 'harp': 40}
VOL = {'lead': 124, 'glock': 100, 'guitar': 112, 'bass': 96, 'pad': 58, 'pizz': 94, 'harp': 84}

# Accordi: (note della chitarrina, fondamentale del basso, quinta del basso, triade del tappeto)
CHORDS = {
    'D':    (['A4', 'D5', 'F#5', 'A5'], 'D2', 'A2', ['D4', 'F#4', 'A4']),
    'Bm7':  (['A4', 'D5', 'F#5', 'B5'], 'B1', 'F#2', ['D4', 'F#4', 'B4']),
    'G':    (['G4', 'B4', 'D5', 'G5'], 'G2', 'D3', ['D4', 'G4', 'B4']),
    'A':    (['A4', 'C#5', 'E5', 'A5'], 'A2', 'E2', ['C#4', 'E4', 'A4']),
    'A7':   (['G4', 'C#5', 'E5', 'A5'], 'A2', 'E2', ['C#4', 'E4', 'G4']),
    'F#m7': (['A4', 'C#5', 'E5', 'F#5'], 'F#2', 'C#3', ['C#4', 'E4', 'A4']),
    'Em7':  (['G4', 'B4', 'D5', 'E5'], 'E2', 'B2', ['D4', 'G4', 'B4']),
}
HARMONY = ['D', 'Bm7', 'G', 'A', 'D', 'F#m7', 'G', 'A',
           'G', 'A', 'F#m7', 'Bm7', 'Em7', 'A7', 'D', 'D']

# Melodia: per ogni battuta (nota, battito d'inizio, durata in battiti)
MELODY = [
    [('F#5', 0, .5), ('A5', .5, .5), ('D6', 1, 1), ('A5', 2.5, .5), ('F#5', 3, .5), ('A5', 3.5, .5)],
    [('B5', 0, 1.5), ('A5', 1.5, .5), ('F#5', 2, 1), ('D5', 3, 1)],
    [('G5', 0, .5), ('B5', .5, .5), ('D6', 1, 1), ('B5', 2.5, .5), ('G5', 3, .5), ('B5', 3.5, .5)],
    [('A5', 0, 1.5), ('C#6', 1.5, .5), ('E6', 2, 1.5)],
    [('F#5', 0, .5), ('A5', .5, .5), ('D6', 1, 1), ('E6', 2, .5), ('F#6', 2.5, 1), ('D6', 3.5, .5)],
    [('C#6', 0, 1), ('A5', 1, .5), ('F#5', 1.5, 1), ('A5', 2.5, .5), ('C#6', 3, 1)],
    [('B5', 0, .5), ('D6', .5, .5), ('B5', 1, .5), ('G5', 1.5, 1), ('B5', 2.5, .5), ('A5', 3, .5), ('G5', 3.5, .5)],
    [('A5', 0, 2), ('E5', 2, .5), ('A5', 2.5, .5), ('C#6', 3, .5), ('E6', 3.5, .5)],
    [('D6', 0, 1), ('B5', 1, .5), ('G5', 1.5, .5), ('B5', 2, 1), ('D6', 3, 1)],
    [('E6', 0, 1), ('C#6', 1, .5), ('A5', 1.5, .5), ('C#6', 2, 1), ('E6', 3, 1)],
    [('F#6', 0, 1.5), ('E6', 1.5, .5), ('C#6', 2, 1), ('A5', 3, 1)],
    [('D6', 0, 1), ('B5', 1, 1), ('F#5', 2, 1), ('B5', 3, 1)],
    [('G5', 0, .5), ('B5', .5, .5), ('E6', 1, 1), ('D6', 2, .5), ('B5', 2.5, .5), ('G5', 3, 1)],
    [('A5', 0, .5), ('C#6', .5, .5), ('E6', 1, 1), ('G6', 2, 1), ('E6', 3, .5), ('C#6', 3.5, .5)],
    [('D6', 0, 1.5), ('F#6', 1.5, .5), ('A6', 2, 1), ('F#6', 3, 1)],
    [('D6', 0, 2), ('A5', 2.5, .5), ('C#6', 3, .5), ('E6', 3.5, .5)],
]


def loop_events():
    """Eventi di un giro: (tick, canale, nota, velocità, durata in tick)."""
    ev = []

    def add(part, note, beat, dur, vel, bar):
        t = int((bar * BEATS + beat) * TPB) + random.randint(-5, 5)
        ev.append((max(0, t), CH[part], note if isinstance(note, int) else n(note), max(1, min(127, vel + random.randint(-6, 6))), int(dur * TPB)))

    for bar in range(BARS):
        chord = HARMONY[bar]
        gtr, root, fifth, pad = CHORDS[chord]
        second_half = bar >= 8

        # melodia: marimba, raddoppiata dal glockenspiel nella seconda parte
        for note, beat, dur in MELODY[bar]:
            add('lead', note, beat, min(dur, .9) * .95, 96 if beat % 1 == 0 else 86, bar)
            if second_half:
                add('glock', note, beat, .5, 58, bar)

        # chitarrina: pennate in levare, corde sfalsate di pochi millisecondi
        for beat, down, vel in [(0, True, 58), (1, True, 78), (1.5, False, 62), (2.5, False, 66), (3, True, 78), (3.5, False, 60)]:
            g = CHORDS['A7'][0] if (bar == 15 and beat >= 2) else gtr
            notes = g if down else g[1:]
            order = notes if down else list(reversed(notes))
            for i, note in enumerate(order):
                add('guitar', note, beat + i * 0.022, .32, vel - i * 3, bar)

        # basso: fondamentale, rimbalzo, quinta, ottava
        turn = bar == 15                       # l'ultima battuta gira su La7 per tornare all'inizio
        add('bass', root, 0, .9, 96, bar)
        add('bass', root, 1.5, .45, 78, bar)
        add('bass', 'A2' if turn else fifth, 2, .9, 90, bar)
        add('bass', 'A2' if turn else n(root) + 12, 3, .45, 80, bar)
        if bar % 2 == 1:
            add('bass', 'C#3' if turn else fifth, 3.5, .45, 74, bar)

        # tappeto morbido
        for note in pad:
            add('pad', note, 0, 3.9, 44, bar)

        # pizzicato: arpeggio a crome nella seconda parte, accenni nella prima
        tones = [n(x) for x in pad] + [n(pad[0]) + 12]
        if second_half:
            for i in range(8):
                add('pizz', tones[[0, 1, 2, 3, 2, 1, 2, 3][i]] + 12, i * .5, .3, 62 if i % 2 == 0 else 52, bar)
        elif bar % 2 == 1:
            for i, beat in enumerate([2, 2.5, 3, 3.5]):
                add('pizz', tones[i] + 12, beat, .3, 50, bar)

        # ritmo: cassa, battimani sul 2 e sul 4, shaker a crome
        add('drums', KICK, 0, .2, 84, bar)
        add('drums', KICK, 2, .2, 76, bar)
        add('drums', KICK, 2.5, .2, 58, bar)
        add('drums', CLAP, 1, .2, 96, bar)
        add('drums', CLAP, 3, .2, 100, bar)
        for i in range(8):
            add('drums', SHAKER, i * .5, .1, 78 if i % 2 else 56, bar)
        if bar % 2 == 1:
            add('drums', TAMB, 3.5, .2, 60, bar)
        if bar in (7, 15):                       # piccolo stacco a fine frase
            add('drums', STICK, 2.5, .1, 76, bar)
            add('drums', CLAP, 3.5, .2, 80, bar)
            add('drums', WOOD, 3.25, .1, 70, bar)
            add('drums', WOOD, 3.75, .1, 78, bar)
    return ev


def write_midi(path, events, extra_ticks=0, bpm=BPM, parts=PROG):
    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(bpm), time=0))
    for part, prog in parts.items():
        tr.append(mido.Message('program_change', channel=CH[part], program=prog, time=0))
        tr.append(mido.Message('control_change', channel=CH[part], control=7, value=VOL[part], time=0))
        tr.append(mido.Message('control_change', channel=CH[part], control=10, value=PAN[part], time=0))
        tr.append(mido.Message('control_change', channel=CH[part], control=91, value=46, time=0))
    tr.append(mido.Message('control_change', channel=9, control=7, value=100, time=0))
    tr.append(mido.Message('control_change', channel=9, control=91, value=24, time=0))
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


def render(mid_path, wav_path, gain=0.7):
    subprocess.run(['fluidsynth', '-ni', '-g', str(gain), '-r', str(SR), '-F', wav_path,
                    '-o', 'synth.reverb.active=1', '-o', 'synth.reverb.room-size=0.5', '-o', 'synth.reverb.level=0.55',
                    '-o', 'synth.reverb.damp=0.35', '-o', 'synth.chorus.active=0', SF2, mid_path],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    sr, data = wavfile.read(wav_path)
    assert sr == SR
    return data.astype(np.float64) / 32768.0


def eq(x):
    """Equalizzazione per gli altoparlanti piccoli: meno bassi profondi, più presenza e brillantezza.
    Fatta in frequenza sull'intero brano, quindi "circolare": il loop resta senza stacchi."""
    f = np.fft.rfftfreq(len(x), 1 / SR)
    g = np.ones_like(f)
    g *= 1 / np.sqrt(1 + (38 / np.maximum(f, 1)) ** 4)                    # passa-alto a 38 Hz
    g *= 10 ** (-3.0 / 20 * (1 / (1 + (f / 140) ** 2)))                   # scaffale basso: -3 dB sotto ~140 Hz
    g *= 10 ** (5.0 / 20 * (1 - 1 / (1 + (f / 2600) ** 2)))               # scaffale alto: +5 dB sopra ~2,6 kHz
    return np.stack([np.fft.irfft(np.fft.rfft(x[:, c]) * g, len(x)) for c in range(x.shape[1])], axis=1)


def master(x, peak_db=-1.5):
    """Equalizza e porta il picco al livello voluto con un limitatore morbido."""
    x = eq(x - x.mean(axis=0))
    x = x / (np.abs(x).max() + 1e-9)
    x = np.tanh(x * 1.6) / np.tanh(1.6)
    return x * (10 ** (peak_db / 20))


def save_wav(path, x):
    wavfile.write(path, SR, np.clip(x * 32767.0, -32768, 32767).astype(np.int16))


def encode(wav, dst, kind):
    args = ['-c:a', 'libvorbis', '-q:a', '3.5'] if kind == 'ogg' else ['-c:a', 'libmp3lame', '-b:a', '112k' if 'theme' in dst else '80k']
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, *args, dst], check=True)


def music():
    one = loop_events()
    ticks = BARS * BEATS * TPB
    twice = one + [(t + ticks, ch, note, vel, dur) for t, ch, note, vel, dur in one]
    write_midi(f'{TMP}/theme2.mid', twice, extra_ticks=4 * TPB)
    write_midi(f'{OUT}/theme.mid', one)
    x = render(f'{TMP}/theme2.mid', f'{TMP}/theme2.wav')
    n_loop = int(round(LOOP_SEC * SR))
    loop = master(x[n_loop:2 * n_loop])
    seam = float(np.abs(loop[0] - loop[-1]).max())
    typical = float(np.abs(np.diff(loop, axis=0)).mean())
    save_wav(f'{TMP}/theme.wav', loop)
    encode(f'{TMP}/theme.wav', f'{OUT}/theme.ogg', 'ogg')
    encode(f'{TMP}/theme.wav', f'{OUT}/theme.mp3', 'mp3')
    rms = 20 * np.log10(np.sqrt((loop ** 2).mean()) + 1e-9)
    print(f'theme: {len(loop) / SR:.4f} s (HUB_LOOP = {LOOP_SEC:.6f}), picco {20 * np.log10(np.abs(loop).max()):.1f} dB, RMS {rms:.1f} dB, '
          f'salto alla giunzione {seam:.4f} (medio tra campioni {typical:.4f})')


def sfx(name, events, length, gain=0.9, peak_db=-3.0):
    """Effetto breve: note suonate dagli stessi strumenti della musica, con sfumata finale."""
    write_midi(f'{TMP}/{name}.mid', events, extra_ticks=TPB * 4, bpm=120)
    x = render(f'{TMP}/{name}.mid', f'{TMP}/{name}_raw.wav', gain)
    x = master(x[:int(length * SR)], peak_db)
    fade = int(0.08 * SR)
    x[-fade:] *= np.linspace(1, 0, fade)[:, None]
    save_wav(f'{TMP}/{name}.wav', x)
    encode(f'{TMP}/{name}.wav', f'{OUT}/sfx_{name}.mp3', 'mp3')
    print(f'sfx_{name}: {length:.2f} s')


def ms(x):
    """millisecondi -> tick a 120 bpm"""
    return int(x / 1000 * 2 * TPB)


def effects():
    # tocco su un pulsante: un "toc" di marimba con il legnetto
    sfx('pop', [(0, CH['lead'], n('A5'), 104, ms(120)), (ms(4), CH['drums'], WOOD, 70, ms(60))], 0.32)
    # apertura di un gioco: arpeggio luminoso che sale
    up = ['D5', 'F#5', 'A5', 'D6', 'F#6', 'A6', 'D7']
    sfx('open', [(ms(i * 46), CH['harp'], n(x), 72 + i * 3, ms(400)) for i, x in enumerate(up)]
        + [(ms(i * 92), CH['glock'], n(x), 80, ms(500)) for i, x in enumerate(['D6', 'A6', 'D7'])]
        + [(0, CH['lead'], n('D5'), 90, ms(200))], 1.25)
    # gioco bloccato: due note basse e morbide, un "no-no" gentile
    sfx('locked', [(0, CH['lead'], n('F#3'), 92, ms(140)), (ms(150), CH['lead'], n('D3'), 96, ms(200)),
                   (0, CH['drums'], STICK, 50, ms(50))], 0.6)
    # caricamento riuscito: due note di campanelli
    sfx('ready', [(0, CH['glock'], n('A6'), 84, ms(200)), (ms(110), CH['glock'], n('D7'), 92, ms(500)),
                  (ms(110), CH['lead'], n('D6'), 80, ms(200))], 0.9)
    # cambio pagina del menu: strisciata breve di shaker e marimba
    sfx('page', [(0, CH['drums'], SHAKER, 80, ms(60)), (ms(60), CH['lead'], n('E5'), 80, ms(90)), (ms(130), CH['lead'], n('A5'), 88, ms(120))], 0.45)


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(TMP, exist_ok=True)
    music()
    effects()
