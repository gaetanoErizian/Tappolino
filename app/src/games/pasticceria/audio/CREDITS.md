# Audio di Pasticceria Magica

- **Musica** (`theme.ogg`, `theme.mp3`): composizione originale per Tappolino, partitura in `scripts/audio/pasticceria_music.py` (MIDI di riferimento: `theme.mid`). Loop esatto di 80 secondi.
- **Effetti** (`sfx_*.mp3`): creati per Tappolino con `scripts/audio/pasticceria_sfx.py` (strumenti campionati + sintesi offline).
- **Strumenti campionati**: *MuseScore General SoundFont* di S. Christian Collins (licenza MIT; alcune parti CC0 o di pubblico dominio: pianoforte Splendid Grand, archi VSCO 2 CE, campioni VCSL), derivato da *Fluid (R3) GM* di Frank Wen (MIT). Pacchetto Debian/Ubuntu `musescore-general-soundfont-lossless`.

Per rigenerare: `sudo apt-get install fluidsynth musescore-general-soundfont-lossless ffmpeg`, `pip install mido numpy`, poi dalla cartella `app/`:
`python3 scripts/audio/pasticceria_music.py` e `python3 scripts/audio/pasticceria_sfx.py`.
