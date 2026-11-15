# Audio di Scavo dei Dinosauri

- **Musica** (`theme.ogg`, `theme.mp3`): "Avventura nello scavo", composizione originale per Tappolino (Re minore / Fa maggiore, 4/4, 120 bpm): marimba, fagotto, archi pizzicati, xilofono, wood block, claves, bonghi e maracas. Partitura in `scripts/audio/dinosauri_music.py` (MIDI di riferimento: `theme.mid`). Loop esatto di 64 secondi.
- **Effetti** (`sfx_*.mp3`): creati per Tappolino con `scripts/audio/dinosauri_sfx.py`. Strumenti campionati per gli effetti musicali (marimba, xilofono, celesta, glockenspiel, arpa, kalimba, pizzicati, flauto; ruggiti simpatici con tuba, trombone, fagotto, oboe e clarinetto in glissando) e sintesi offline per quelli fisici (pennello, terra che frana, polvere, tonfo, macchina fotografica, fruscio).
- **Strumenti campionati**: *MuseScore General SoundFont* di S. Christian Collins (licenza MIT; alcune parti CC0 o di pubblico dominio), derivato da *Fluid (R3) GM* di Frank Wen (MIT). Pacchetto Debian/Ubuntu `musescore-general-soundfont-lossless`.

Per rigenerare: `sudo apt-get install fluidsynth musescore-general-soundfont-lossless ffmpeg`, `pip install mido numpy`, poi dalla cartella `app/`:
`python3 scripts/audio/dinosauri_music.py` e `python3 scripts/audio/dinosauri_sfx.py`.
