# Audio di Razzo tra le Stelle

- **Musica** (`theme.ogg`, `theme.mp3`): "Passeggiata tra le stelle", composizione originale per Tappolino (Re maggiore con colore lidio, 4/4, 90 bpm, un'ombra di swing): vibrafono, tappeto d'archi lenti, basso elettrico fretless, batteria con le spazzole (kit "Brush"), celesta e un velo di pad. Partitura in `scripts/audio/razzo_music.py` (MIDI di riferimento: `theme.mid`). Loop esatto di 64 secondi.
- **Effetti** (`sfx_*.mp3`): creati per Tappolino con `scripts/audio/razzo_sfx.py`. Strumenti campionati per gli effetti musicali (vibrafono, celesta, glockenspiel, arpa, archi, basso fretless, marimba, ottavino, ocarina, spazzole) e sintesi offline per quelli fisici (rimbalzo di gomma, spinta del motore, decollo, atterraggio, sfrecciata, fruscio).
- **Strumenti campionati**: *MuseScore General SoundFont* di S. Christian Collins (licenza MIT; alcune parti CC0 o di pubblico dominio), derivato da *Fluid (R3) GM* di Frank Wen (MIT). Pacchetto Debian/Ubuntu `musescore-general-soundfont-lossless`.

Per rigenerare: `sudo apt-get install fluidsynth musescore-general-soundfont-lossless ffmpeg`, `pip install mido numpy`, poi dalla cartella `app/`:
`python3 scripts/audio/razzo_music.py` e `python3 scripts/audio/razzo_sfx.py`.
