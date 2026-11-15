# Crediti — app Tappolino

- **Grafica**: tutta originale, disegnata in codice vettoriale (SVG) in `src/core/art.ts`, `src/hub/art.ts` e `src/games/<id>/art.ts`. Nessun personaggio o marchio di terzi.
- **Marchio**: logo e mascotte "Tappo" originali, generati da `scripts/make-brand.mjs` in `src/core/brand/`. Le lettere della scritta partono dal carattere Fredoka.
- **Musica e suoni del menu**: composizione originale per Tappolino ("Il saltello di Tappo"), partitura in `scripts/audio/hub_audio.py` (MIDI di riferimento: `src/hub/audio/theme.mid`), suonata con strumenti campionati.
- **Musica e suoni di Pasticceria Magica**: composizione originale per Tappolino (valzer da pasticceria), partitura in `scripts/audio/pasticceria_music.py` (MIDI di riferimento: `src/games/pasticceria/audio/theme.mid`); effetti da `scripts/audio/pasticceria_sfx.py` (strumenti campionati e sintesi offline). Dettagli in `src/games/pasticceria/audio/CREDITS.md`.
- **Strumenti campionati**: *MuseScore General SoundFont* di S. Christian Collins (licenza MIT; alcune parti CC0 o di pubblico dominio), derivato da *Fluid (R3) GM* di Frank Wen (MIT). Pacchetto Debian/Ubuntu `musescore-general-soundfont-lossless`.
- **Musica e suoni di Pompieri in Azione**: "La marcetta dei pompieri", composizione originale per Tappolino, partitura in `scripts/audio/pompieri_music.py`; effetti creati con `scripts/audio/pompieri_sfx.py` (strumenti campionati e sintesi offline). Dettagli in `src/games/pompieri/audio/CREDITS.md`.
- Nessun suono è sintetizzato in tempo reale: musica ed effetti sono tutti file audio preparati con gli script in `scripts/audio/`.
- **Carattere**: Fredoka (The Fredoka Project Authors), licenza SIL Open Font License 1.1, incluso nell'app tramite `@fontsource/fredoka`.
- **Librerie** (licenze open source):
  - Phaser 4 — MIT
  - Capacitor 8 — MIT
  - @capacitor/preferences — MIT
  - @capacitor-community/admob (solo Android) — MIT
  - @capgo/native-purchases — MPL-2.0
  - Vite, TypeScript, Vitest — MIT / Apache-2.0
- **Musica e suoni di Scavo dei Dinosauri**: composizione ed effetti originali per Tappolino, con strumenti campionati (MuseScore General, MIT); script in `scripts/audio/dinosauri_*.py`. Dettagli in `src/games/dinosauri/CREDITS.md`.
- **Musica e suoni di Salone degli Unicorni**: composizione ed effetti originali per Tappolino, con strumenti campionati (MuseScore General, MIT); script in `scripts/audio/unicorni_*.py`. Dettagli in `src/games/unicorni/CREDITS.md`.
- **Musica e suoni di Cuccioli dal Dottore**: composizione ed effetti originali per Tappolino, con strumenti campionati (MuseScore General, MIT); script in `scripts/audio/cuccioli_*.py`. Dettagli in `src/games/cuccioli/CREDITS.md`.
- **Musica e suoni di Razzo tra le Stelle**: composizione ed effetti originali per Tappolino, con strumenti campionati (MuseScore General, MIT); script in `scripts/audio/razzo_*.py`. Dettagli in `src/games/razzo/CREDITS.md`.

I giochi dal 3 in poi tengono i propri crediti (musica, suoni, eventuali risorse) in `src/games/<id>/CREDITS.md`: questo file viene completato in regia prima del lancio.
