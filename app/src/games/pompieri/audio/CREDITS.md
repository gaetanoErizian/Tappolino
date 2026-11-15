# Audio di Pompieri in Azione

- **Musica** (`theme.ogg`, `theme.mp3`): "La marcetta dei pompieri", composizione originale per Tappolino, partitura in `scripts/audio/pompieri_music.py` (MIDI di riferimento: `theme.mid`). Marcetta pop in Fa maggiore: tromba, ottoni, corni, tuba, xilofono, flauto, glockenspiel, archi, timpani e batteria da banda. Loop esatto di 61,935484 secondi (32 battute a 124 bpm), senza stacchi.
- **Effetti** (`sfx_*.mp3`): creati per Tappolino con `scripts/audio/pompieri_sfx.py`.
  - con strumenti campionati: tocco, stellina, cuori, fanfara, medaglia, campanella del camion rosa (`siren_tune`), le note della fiamma spenta e della scala;
  - con sintesi offline (numpy): getto d'acqua, vapore e sfrigolio, fiammella che si accende, scatti della scala, passaggio, miagolio del gattino (sintesi sorgente-filtro con formanti), sirene dei camion (bitonale, wail, yelp, trombe ad aria, sirena "spaziale").
- **Strumenti campionati**: *MuseScore General SoundFont* di S. Christian Collins (licenza MIT; alcune parti CC0 o di pubblico dominio: pianoforte Splendid Grand, archi VSCO 2 CE, campioni VCSL), derivato da *Fluid (R3) GM* di Frank Wen (MIT). Pacchetto Debian/Ubuntu `musescore-general-soundfont-lossless`.

Per rigenerare: `sudo apt-get install fluidsynth musescore-general-soundfont-lossless ffmpeg`, `pip install mido numpy scipy`, poi dalla cartella `app/`:
`python3 scripts/audio/pompieri_music.py` e `python3 scripts/audio/pompieri_sfx.py`.
