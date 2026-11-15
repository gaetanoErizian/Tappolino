# Gioco 5 — Razzo tra le Stelle (`razzo`)

Branch `game/razzo-tra-le-stelle` · `order` 5 · con l'acquisto unico (`free: false`) · colore `#3c4fc4`

## Stato
**Pronto per la prova di Gaetano** (15/11/2026). Test e build web verdi, partita provata nel browser in formato telefono (mouse e tocco vero, catture guardate una per una). Non ancora unito a `main`: si unisce dopo l'ok.
Pagina di prova del branch (provvisoria), aggiornata con `main` (giochi 1–6): https://claude.ai/artifact/HS778gbLasghnJum7RQEeH#prova — con `#prova` si attiva la modalità prova (decisione 25) e tutti i giochi si aprono; il Razzo è la prima tessera della seconda pagina del menu. In locale: `?game=razzo#prova`.

## Cosa c'è nel gioco
- **Menu**: spazio blu profondo con nebulose, stelle e pianetini lontani; il razzo scelto aspetta con il motore acceso (toccalo e sfreccia via e torna), in basso l'ultimo pianeta visitato (o il pianeta di casa) che ride se lo tocchi. Pulsanti: parti, i miei pianeti, i miei razzi, casa.
- **Viaggio** (gesto: tenere premuto, con qualsiasi dito e in qualsiasi punto): tieni premuto e il razzo sale, lascia e scende piano (movimento morbido, mai a scatti; non esce mai dallo schermo). Si parte subito, senza conto alla rovescia. Stelle su 3 righe al massimo (righe, archi, onde): ogni stella suona e quelle prese di fila salgono sulla scala; a metà viaggio una stellona che vale 3. Gli **asteroidi di gomma** (tondi, colorati, sorridenti) fanno rimbalzare il razzo con un "boing": niente si perde. Il primo tratto è senza asteroidi; da fermo in basso o in alto si prendono comunque le stelle della riga vicina. In alto la strada da casa al pianeta con il razzino che avanza e il contatore delle stelle.
- **Tutorial**: al primo viaggio la manina "tieni premuto" (mano che preme, anelli che si allargano, frecce verso l'alto sul razzo); sparisce appena il bambino preme e torna se per 7 secondi non tocca nulla.
- **Arrivo**: il pianeta entra da destra, il razzo si raddrizza, scende piano e atterra sulla cima, pianta la bandierina; il pianeta ride, coriandoli, "Nuovo pianeta!" con il nome e le stelle del viaggio. Pulsanti: i miei pianeti e "ancora". Toccando pianeta e razzo rispondono.
- **Collezione**: 8 pianeti buffi da visitare in ordine — Luna, Pianeta Anelli, Bolle, Giungla, Caramella, Ghiaccio, Vulcano, Arcobaleno — poi si torna a trovarli a caso (mai lo stesso due volte di fila); mappa delle stelle con le sagome dei pianeti ancora da visitare e il totale delle stelle. **6 razzi** (rosso, blu, giallo, verde, viola, oro) si sbloccano con i viaggi 1, 2, 4, 6, 8: "Nuovo razzo!" a fine viaggio e il razzo nuovo diventa quello in uso; nell'hangar si sceglie con un tocco (stella e luce sulla rampa).
- **Partita**: viaggio di ~40 s il primo, fino a ~50 s dal nono, più l'arrivo. Con l'esperienza un po' più di asteroidi e, dal quarto viaggio, asteroidi che ondeggiano.
- **Salvataggi** in `Store('tappolino.razzo')`: pianeti visitati, viaggi, stelle totali, razzo scelto, ultima meta, tutorial visto (ripuliti al caricamento).
- **Audio**: musica "Passeggiata tra le stelle" (vibrafono, archi lenti, basso elettrico fretless, batteria con le spazzole, celesta; loop esatto di 64 s) ed effetti con strumenti veri, generati da `scripts/audio/razzo_*.py`. Crediti in `app/src/games/razzo/CREDITS.md` e `audio/CREDITS.md`.
- **Testi**: IT, EN, ES, FR, DE, PT (pt-BR come negli altri giochi). Per giocare non serve leggere.
- **Scheda store** nelle 6 lingue: `app/store/games/razzo/` (limiti dei caratteri verificati). Catture: `python scripts/store-screenshots.py --groups razzo`.

## Cosa provare sul telefono
1. Primo avvio: la manina deve far capire subito che si tiene premuto. Provare anche con due dita e togliendone una (il razzo continua a salire finché un dito resta giù).
2. Fluidità del viaggio su un telefono economico (60 fps): lo sfondo è stato alleggerito (un solo piano a tutto schermo), ma va verificato su un dispositivo vero. Nel browser senza scheda grafica del computer di prova il gioco va alla stessa velocità di Scavo dei Dinosauri.
3. Volume del "boing" e delle stelle prese di fila rispetto alla musica.
4. Al primo ingresso nella mappa dei pianeti e nell'hangar, possibile breve attesa (Phaser prepara i suoi shader): dire se si nota.
5. In modalità prova l'etichetta "PROVA" sta in alto al centro: durante il viaggio la strada verso il pianeta scende un po' per non finirci sotto (nelle build per gli store resta in alto).
6. Telefoni molto allungati (20:9): contatore e strada in alto non coperti, razzo e stelle sempre visibili sopra il banner.

## Per la regia
- **Gesto "tieni premuto"**: la manina è in `app/src/games/razzo/holdHint.ts` (`HoldHint`: mano che preme e resta giù, anelli, frecce verso l'alto). Candidata per `core/` insieme a `core/drag.ts`: servirà anche al gioco 7 (Monster Truck, "tenere premuto in pista").
- Usati dal codice comune senza modifiche: `core/ui`, `core/hud`, `core/sound`, `core/art`, `core/storage`, `core/brand`.

## Diario
- 15/11/2026 — Modulo completo: viaggio, rimbalzi, arrivo e atterraggio, mappa dei pianeti, hangar dei razzi; audio con strumenti veri; test (`razzo.test.ts`: percorso, volo, collezione, grafica, testi, audio).
- 15/11/2026 — Prova nel browser in formato telefono (844×390, mouse e tocco vero con più dita; catture guardate una per una). Corretto: sfondo troppo pesante (tre piani di stelle a tutto schermo → stelle lontane dentro il cielo e stelline piccole: il doppio dei fotogrammi nel browser di prova); vulcani del Pianeta Vulcano che sembravano orecchie; icona del pulsante pianeti; scelta del razzo nell'hangar poco visibile (ora stella e luce sulla rampa); tutorial che con fotogrammi lenti non si chiudeva (ora conta il tempo vero); pianetini lontani che all'arrivo passavano dietro le scritte. Scheda store nelle 6 lingue e script delle catture. Pagina di prova del branch pubblicata.
- 15/11/2026 — Merge di `main` nel branch (giochi 4 e 6, modalità prova): nessun conflitto, test (160) e build verdi. In modalità prova la strada del viaggio scende sotto l'etichetta "PROVA". Pagina di prova ripubblicata.
