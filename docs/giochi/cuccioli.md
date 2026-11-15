# Gioco 6 — Cuccioli dal Dottore (`cuccioli`)

Branch `game/cuccioli-dal-dottore` · `order` 6 · non gratis (si apre con l'acquisto unico) · colore `#4cc3a5`

## Stato
**Completo sul branch, in attesa dell'ok di Gaetano** per l'unione a `main`. Test (`npm test`) e build (`npm run build`) verdi; partita provata nel browser in formato telefono con trascinamenti veri, tocchi e catture guardate una per una.
Pagina di prova del branch (provvisoria): PAGINA_DI_PROVA — il gioco è la quarta tessera del menu (finché non arrivano i giochi 4 e 5). In locale: `?game=cuccioli&unlock=1`.

## Cosa c'è nel gioco
- **Menu**: ambulatorio luminoso verde acqua e crema, finestra sul giardino, mensola con barattoli, quadretto con impronta e cuore, lampada. Pulsante gioca e pulsante giardino; sul lettino c'è l'ultimo cucciolo curato (la prima volta il primo paziente), che salta e fa il suo verso se lo tocchi.
- **Visita** (gesto: trascinare; ogni strumento funziona anche con **un tocco**): il cucciolo arriva saltellando sul lettino e mostra i suoi guai. In alto le pastiglie con gli strumenti da usare (si accende la stellina a ogni cura), in basso il vassoio. Si trascina lo strumento giusto sul cucciolo (basta il cucciolo: il gioco sceglie il punto giusto) oppure si tocca e vola da solo.
  - **Zampa infangata** → spugna: cinque passate con bolle di sapone, il fango sparisce, scintille.
  - **Spina** → pinzette (la spina vola via, resta una piccola "bua" rosa) → **cerotto** colorato con le stelline, che resta sulla zampa.
  - **Fame** (fumetto con il biberon, pancino che brontola) → biberon: tre sorsi e "gnam".
  - **Sonno** (occhi assonnati, Zzz, sbadigli) → copertina: un pisolino con la russatina, poi la stiracchiata.
  - **Starnuti** (naso rosso, piccoli etcì) → fazzoletto: un grande starnuto dentro il fazzoletto.
  - **Freddo** (brividi, fiocchi di neve, denti che battono) → sciarpa a righe che resta al collo, cuori e un bel calduccio.
  - Strumento che adesso non serve: il cucciolo fa "no" con la testa e lo strumento torna al suo posto, con una nota gentile. Nessun errore, nessun "hai perso". Dopo due tentativi, o 5 secondi senza fare niente, arriva la manina che mostra il trascinamento giusto.
- **Festa**: a cure finite il cucciolo fa le feste (tre salti, coda velocissima, coriandoli, cuori, impronte), poi esce saltellando.
- **Collezione — il giardino della clinica**: il cucciolo curato esce dalla porta della clinica e raggiunge il suo posto in giardino ("Un nuovo amico!" la prima volta). 8 cuccioli tondi e buffi, ognuno con colori, orecchie, coda e verso propri: cagnolino, gattino, coniglietto, orsetto, volpina, pandino, maialino, agnellino. I posti ancora vuoti sono cucce con l'impronta. In giardino i cuccioli saltellano da soli, al tocco saltano, fanno il verso e mostrano il nome; c'è una palla da far rimbalzare (e saltano tutti). Freccia per la visita successiva.
- **Progressione gentile**: prima visita un solo guaio (zampa sporca) e due strumenti sul vassoio; seconda e terza visita due guai facili; dalla quarta tutti e sette gli strumenti; dalla sesta fino a tre guai. I cuccioli si conoscono in ordine; a giardino pieno ne arriva uno a caso (mai lo stesso due volte di fila).
- **Partita**: una visita dura 30–60 secondi. Salvataggi in `Store('tappolino.cuccioli')`: cuccioli in giardino, visite fatte, ultimo cucciolo, tutorial visto.
- **Audio**: musica "Ambulatorio allegro" (chitarra classica, clarinetto, glockenspiel, contrabbasso; Sol maggiore, loop esatto di 60 s, −18 LUFS come gli altri giochi) e 32 effetti con strumenti veri, comprese le voci dei cuccioli fatte con fiati in glissando (bau, miao, squittii, belato…). Generati da `scripts/audio/cuccioli_music.py` e `cuccioli_sfx.py`. Crediti in `app/src/games/cuccioli/CREDITS.md` e `audio/CREDITS.md`.
- **Testi**: IT, EN, ES, FR, DE, PT (titolo, giardino, nomi dei cuccioli). Per giocare non serve leggere.
- **Contenuti**: niente aghi, sangue o paura; nessuna croce rossa (l'insegna della clinica è un'impronta con un cuore).
- **Scheda store** nelle 6 lingue: `app/store/games/cuccioli/` (limiti dei caratteri verificati). Catture: `python scripts/store-screenshots.py --groups cuccioli` (menu, visita, spugna, sciarpa, festa, starnuto, giardino pieno).

## Cosa provare sul telefono
1. Prima visita: la manina deve far capire subito che la spugna si porta sulla zampa. Provare anche solo con **tocchi** sugli strumenti (i più piccoli non trascinano).
2. Trascinare uno strumento sbagliato sul cucciolo e lasciarlo lontano: deve tornare al suo posto con il rimbalzo, senza bloccare niente.
3. Visita con tre guai (dalla sesta): il cucciolo resta leggibile (fango, spina, fumetto, neve) e le pastiglie in alto non coprono la testa.
4. Volume dei versi dei cuccioli e dello starnutone rispetto alla musica.
5. Giardino con 8 cuccioli: fluidità (sono 8 cuccioli animati) su un telefono economico.
6. Uscire con la casetta a metà visita e rientrare: la visita riparte, il giardino resta.

## Per la regia
- Usati dal codice comune senza modifiche: `core/drag` (`DragManager` con raggio 160, `Hint.drag`), `core/ui`, `core/hud`, `core/sound`, `core/art`, `core/storage`. Nessun file comune toccato.
- **Nota tecnica (Phaser 4)**: fermare una `TweenChain` dall'interno del suo stesso richiamo (es. un saltello che ne fa partire un altro all'atterraggio) a volte faceva perdere i richiami successivi. Per questo il saltello dei cuccioli (`PetView.hop` in `world.ts`) è calcolato a ogni fotogramma senza catene; se servisse in altri giochi, è un buon candidato per `core/`.
- `?game=cuccioli` sul web di prova richiede `&unlock=1` (gioco non gratis): lo script delle catture lo aggiunge da sé.
- Il parametro `problems` della scena `cuccioli:Clinic` serve solo a test e catture (sceglie i guai della visita).

## Diario
- 15/11/2026 — Modulo completo: menu, visita con 6 guai e 7 strumenti, festa, giardino-collezione con 8 cuccioli; audio con strumenti veri; test (`cuccioli.test.ts`, 25 casi).
- 15/11/2026 — Prova nel browser in formato telefono (trascinamenti veri, tocchi, strumento sbagliato, manina, tutte le cure, giardino; catture guardate una per una). Corretto: cucciolo che a volte non arrivava sul lettino (saltello riscritto a fotogrammi); occhi assonnati e bocca dei brividi che sembravano imbronciati; fiocchi di neve poco visibili; scatola dei fazzoletti che finiva sul muso; foschia delle colline in giardino con un bordo netto; coda della volpina. Scheda store nelle 6 lingue e script delle catture.
