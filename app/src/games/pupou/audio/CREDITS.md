# Audio di Pupou

- **Musica** (`theme.ogg`, `theme.mp3`): "La banda delle puzzette", composizione originale per Tappolino (Do maggiore, 4/4, 120 bpm): polka buffa con tuba (basso um-pa), trombone, fisarmonica in levare, xilofono, batteria leggera e wood block. Partitura in `scripts/audio/pupou_music.py` (MIDI di riferimento: `theme.mid`). Loop esatto di 48 secondi (24 battute).
- **Effetti** (`sfx_*.mp3`, 30 file): creati per Tappolino con `scripts/audio/pupou_sfx.py`.
  - Puzzette e ruttino: una "pernacchia" sintetizzata offline (treno di impulsi irregolare) mescolata a fagotto, trombone o tuba con glissando verso il basso; quella gigante finisce con un "ta-daa" di trombe e piatto.
  - Voce di Pupou (risatina, saluto, sbadiglio, tristezza): ocarina, clarinetto e trombone con pitch bend.
  - Effetti musicali (monete, acquisto, stella, vittoria, livello, crescita, campanella, passi, tocchi): glockenspiel, celesta, marimba, kalimba, xilofono, arpa, trombe, tromboni, tuba, campane tubolari.
  - Effetti fisici (morso, sorso, bolla, spugna, doccia, sciacquone, pancino che brontola, mosca, russata): sintesi offline con numpy.
- **Strumenti campionati**: *MuseScore General SoundFont* di S. Christian Collins (licenza MIT; alcune parti CC0 o di pubblico dominio), derivato da *Fluid (R3) GM* di Frank Wen (MIT). Pacchetto Debian/Ubuntu `musescore-general-soundfont-lossless`.

Per rigenerare: `sudo apt-get install fluidsynth musescore-general-soundfont-lossless ffmpeg`, `pip install mido numpy`, poi dalla cartella `app/`:
`python3 scripts/audio/pupou_music.py` e `python3 scripts/audio/pupou_sfx.py`.
