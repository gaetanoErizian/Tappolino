# Audio del Giardino delle Fate

- **Musica** (`theme.ogg`, `theme.mp3`): "Radura incantata", composizione originale per Tappolino (Fa maggiore, 4/4, 60 bpm): arpa in arpeggi, flauto, archi pizzicati e campanelli (celesta e glockenspiel). Partitura in `scripts/audio/giardino_music.py` (MIDI di riferimento: `theme.mid`). Loop esatto di 64 secondi (16 battute).
- **Effetti** (`sfx_*.mp3`): creati per Tappolino con `scripts/audio/giardino_sfx.py`. Strumenti campionati (arpa, celesta, glockenspiel, carillon, kalimba, flauto, ottavino, archi pizzicati) per gli effetti musicali, tutti in Fa maggiore; la nota dei fiori è una sola, intonata dal gioco sulla scala pentatonica. Sintesi offline per pioggerella e brezza.
- **Strumenti campionati**: *MuseScore General SoundFont* di S. Christian Collins (licenza MIT; alcune parti CC0 o di pubblico dominio), derivato da *Fluid (R3) GM* di Frank Wen (MIT). Pacchetto Debian/Ubuntu `musescore-general-soundfont-lossless`.

Per rigenerare: `sudo apt-get install fluidsynth musescore-general-soundfont-lossless ffmpeg`, `pip install mido numpy`, poi dalla cartella `app/`:
`python3 scripts/audio/giardino_music.py` e `python3 scripts/audio/giardino_sfx.py`.
