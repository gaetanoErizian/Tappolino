# Audio del Salone degli Unicorni

- **Musica** (`theme.ogg`, `theme.mp3`): "Nuvole di zucchero", composizione originale per Tappolino (pop sognante in Fa maggiore, 4/4, 96 bpm): arpa, celesta, flauto, basso fretless morbido, un velo d'archi lenti e batteria pop leggerissima (cassa morbida, side stick, shaker, maracas, triangolo). Partitura in `scripts/audio/unicorni_music.py` (MIDI di riferimento: `theme.mid`). Loop esatto di 60 secondi.
- **Effetti** (`sfx_*.mp3`): creati per Tappolino con `scripts/audio/unicorni_sfx.py`. Strumenti campionati per gli effetti musicali (nitrito magico con flauto e flauto di Pan in glissando, arpa, celesta, glockenspiel, carillon, pizzicati) e sintesi offline per quelli fisici (spugna, bollicine, doccetta, scrollata, spazzola, macchina fotografica, fruscio).
- **Strumenti campionati**: *MuseScore General SoundFont* di S. Christian Collins (licenza MIT; alcune parti CC0 o di pubblico dominio), derivato da *Fluid (R3) GM* di Frank Wen (MIT). Pacchetto Debian/Ubuntu `musescore-general-soundfont-lossless`.

Per rigenerare: `sudo apt-get install fluidsynth musescore-general-soundfont-lossless ffmpeg`, `pip install mido numpy`, poi dalla cartella `app/`:
`python3 scripts/audio/unicorni_music.py` e `python3 scripts/audio/unicorni_sfx.py`.
