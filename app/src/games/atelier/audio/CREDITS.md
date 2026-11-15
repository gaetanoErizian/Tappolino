# Audio dell'Atelier delle Principesse

- **Musica** (`theme.ogg`, `theme.mp3`): "Ballo a corte", composizione originale per Tappolino (pop elegante in Re maggiore, 4/4, 96 bpm): pianoforte, archi (con pizzicati), celesta e batteria leggera. Partitura in `scripts/audio/atelier_music.py` (MIDI di riferimento: `theme.mid`). Loop esatto di 60 secondi (24 battute), −18 LUFS come gli altri giochi.
- **Effetti** (`sfx_*.mp3`): creati per Tappolino con `scripts/audio/atelier_sfx.py`. Strumenti campionati per gli effetti musicali (arpa, celesta, glockenspiel, marimba, pizzicati, tromba, archi, wood block); sintesi offline per quelli fisici (fruscio di stoffa, scatto della macchina fotografica, applausi).
- **Strumenti campionati**: *MuseScore General SoundFont* di S. Christian Collins (licenza MIT; alcune parti CC0 o di pubblico dominio), derivato da *Fluid (R3) GM* di Frank Wen (MIT). Pacchetto Debian/Ubuntu `musescore-general-soundfont-lossless`.

Per rigenerare: `sudo apt-get install fluidsynth musescore-general-soundfont-lossless ffmpeg`, `pip install mido numpy`, poi dalla cartella `app/`:
`python3 scripts/audio/atelier_music.py` e `python3 scripts/audio/atelier_sfx.py`.
