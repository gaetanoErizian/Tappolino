# Audio dell'Officina dei Monster Truck

- **Musica** (`theme.ogg`, `theme.mp3`): "Su di giri!", composizione originale per Tappolino (rock allegro in La maggiore, 4/4, 128 bpm): chitarra elettrica pulita (riff e melodia), chitarra pulita stoppata, organo rock, basso elettrico col plettro, batteria. Partitura in `scripts/audio/monstertruck_music.py` (MIDI di riferimento: `theme.mid`). Loop esatto di 60 secondi.
- **Effetti** (`sfx_*.mp3`): creati per Tappolino con `scripts/audio/monstertruck_sfx.py`. Strumenti campionati per gli effetti musicali (chitarra elettrica pulita, organo rock, basso, glockenspiel, marimba, xilofono, arpa, pizzicati, coro, fischio, batteria) e sintesi offline per quelli fisici (motore, clacson, atterraggio, rimbalzo, scatoloni, chiave inglese, pompa, gomma, acqua e bolle, ruota montata, motore che tossisce, vernice, adesivo, fruscio).
- **Strumenti campionati**: *MuseScore General SoundFont* di S. Christian Collins (licenza MIT; alcune parti CC0 o di pubblico dominio), derivato da *Fluid (R3) GM* di Frank Wen (MIT). Pacchetto Debian/Ubuntu `musescore-general-soundfont-lossless`.

Per rigenerare: `sudo apt-get install fluidsynth musescore-general-soundfont-lossless ffmpeg`, `pip install mido numpy`, poi dalla cartella `app/`:
`python3 scripts/audio/monstertruck_music.py` e `python3 scripts/audio/monstertruck_sfx.py`.
