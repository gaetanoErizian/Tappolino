# Crediti — app Tappolino

- **Grafica**: tutta originale, disegnata in codice vettoriale (SVG) in `src/core/art.ts`, `src/hub/art.ts` e `src/games/<id>/art.ts`. Nessun personaggio o marchio di terzi.
- **Marchio**: logo e mascotte "Tappo" originali, generati da `scripts/make-brand.mjs` in `src/core/brand/`. Le lettere della scritta partono dal carattere Fredoka.
- **Musica e suoni del menu**: composizione originale per Tappolino ("Il saltello di Tappo"), partitura in `scripts/audio/hub_audio.py` (MIDI di riferimento: `src/hub/audio/theme.mid`), suonata con strumenti campionati.
- **Musica e suoni di Pasticceria Magica**: composizione originale per Tappolino (valzer da pasticceria), partitura in `scripts/audio/pasticceria_music.py` (MIDI di riferimento: `src/games/pasticceria/audio/theme.mid`); effetti da `scripts/audio/pasticceria_sfx.py` (strumenti campionati e sintesi offline). Dettagli in `src/games/pasticceria/audio/CREDITS.md`.
- **Musica e suoni di Pompieri in Azione**: composizione originale per Tappolino ("La marcetta dei pompieri"), partitura in `scripts/audio/pompieri_music.py` (MIDI di riferimento: `src/games/pompieri/audio/theme.mid`); effetti e sirene da `scripts/audio/pompieri_sfx.py` (strumenti campionati e sintesi offline). Dettagli in `src/games/pompieri/audio/CREDITS.md`.
- **Strumenti campionati**: *MuseScore General SoundFont* di S. Christian Collins (licenza MIT; alcune parti CC0 o di pubblico dominio), derivato da *Fluid (R3) GM* di Frank Wen (MIT). Pacchetto Debian/Ubuntu `musescore-general-soundfont-lossless`.
- **Suoni dei giochi non ancora passati ai file audio**: sintetizzati in tempo reale con Web Audio (`src/core/audio.ts`, `src/games/<id>/sfx.ts`).
- **Carattere**: Fredoka (The Fredoka Project Authors), licenza SIL Open Font License 1.1, incluso nell'app tramite `@fontsource/fredoka`.
- **Librerie** (licenze open source):
  - Phaser 4 — MIT
  - Capacitor 8 — MIT
  - @capacitor/preferences — MIT
  - @capacitor-community/admob (solo Android) — MIT
  - @capgo/native-purchases — MPL-2.0
  - Vite, TypeScript, Vitest — MIT / Apache-2.0
