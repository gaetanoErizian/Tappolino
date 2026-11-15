# Audio di Cuccioli dal Dottore

- **Musica** (`theme.ogg`, `theme.mp3`): "Ambulatorio allegro", composizione originale per Tappolino (Sol maggiore, 4/4, 96 bpm): chitarra classica in fingerpicking, clarinetto, glockenspiel e contrabbasso pizzicato. Partitura in `scripts/audio/cuccioli_music.py` (MIDI di riferimento: `theme.mid`). Loop esatto di 60 secondi (24 battute).
- **Effetti** (`sfx_*.mp3`): creati per Tappolino con `scripts/audio/cuccioli_sfx.py`. Strumenti campionati per gli effetti musicali (glockenspiel, celesta, arpa, kalimba, chitarra classica, clarinetto, contrabbasso, flauto, pizzicati, wood block) e per le voci dei cuccioli (clarinetto, oboe, ottavino, fagotto, flauto, corno inglese e sax baritono con glissando); sintesi offline per quelli fisici (spugna, sorso, pancino che brontola, russatina, fruscio, palla).
- **Strumenti campionati**: *MuseScore General SoundFont* di S. Christian Collins (licenza MIT; alcune parti CC0 o di pubblico dominio), derivato da *Fluid (R3) GM* di Frank Wen (MIT). Pacchetto Debian/Ubuntu `musescore-general-soundfont-lossless`.

Per rigenerare: `sudo apt-get install fluidsynth musescore-general-soundfont-lossless ffmpeg`, `pip install mido numpy`, poi dalla cartella `app/`:
`python3 scripts/audio/cuccioli_music.py` e `python3 scripts/audio/cuccioli_sfx.py`.
