# Audio di Treno degli Animali

- **Musica** (`theme.ogg`, `theme.mp3`): "Si parte!", composizione originale per Tappolino (Re maggiore, 4/4, 120 bpm, ritmo country a due tempi): banjo (arpeggi "a rullo" e un assolo), armonica (melodia), contrabbasso pizzicato e spazzole sul rullante che imitano le rotaie. Partitura in `scripts/audio/treno_music.py` (MIDI di riferimento: `theme.mid`). Loop esatto di 64 secondi (32 battute).
- **Effetti** (`sfx_*.mp3`): creati per Tappolino con `scripts/audio/treno_sfx.py`. Strumenti campionati per gli effetti musicali (banjo, armonica, contrabbasso, marimba, campane tubolari, glockenspiel, fischietti e ocarina per il fischio del treno, flauto, pizzicati, spazzole) e per i versi degli animali (tuba, sax baritono, oboe, clarinetto, tromba, flauto, trombone, ocarina, fagotto, ottavino e corno inglese con glissando); sintesi offline per quelli fisici (sbuffo di vapore, sfiato del freno).
- **Strumenti campionati**: *MuseScore General SoundFont* di S. Christian Collins (licenza MIT; alcune parti CC0 o di pubblico dominio), derivato da *Fluid (R3) GM* di Frank Wen (MIT). Pacchetto Debian/Ubuntu `musescore-general-soundfont-lossless`.

Per rigenerare: `sudo apt-get install fluidsynth musescore-general-soundfont-lossless ffmpeg`, `pip install mido numpy`, poi dalla cartella `app/`:
`python3 scripts/audio/treno_music.py` e `python3 scripts/audio/treno_sfx.py`.
