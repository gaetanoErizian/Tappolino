# 03 — I primi 10 giochi: schede, stato e registro

I giochi sono moduli dell'app Tappolino. Fasi e strategia in `05-STRATEGIA-E-ROADMAP.md`. Il gioco 1 ha creato il codice comune (`core/`).

**Stati**: Da fare · In corso · Web pronta · Approvato · Nell'app (test interno) · Pubblicato

| # | Gioco | Tema | Gesto | Accesso | Stato |
|---|---|---|---|---|---|
| 1 | Pompieri in Azione | maschietto | tocco | gratis | Approvato — nell'app su `main`; build di prova Android/iOS da fare (servono segreti e account Apple) |
| 2 | Pasticceria Magica | femminuccia | trascinamento | gratis | Unito a `main` il 15/11/2026 (web); build Android/iOS di prova quando ci sono segreti e account Apple |
| 3 | Scavo dei Dinosauri | maschietto | strofinare | gratis | Da fare |
| 4 | Salone degli Unicorni | femminuccia | strofinare / tocco | bloccato | Da fare |
| 5 | Razzo tra le Stelle | maschietto | tenere premuto | bloccato | Da fare |
| 6 | Cuccioli dal Dottore | femminuccia | trascinamento | bloccato | Da fare |
| 7 | Officina dei Monster Truck | maschietto | tocco / tenere premuto | bloccato | Da fare |
| 8 | Giardino delle Fate | femminuccia | tocco | bloccato | Da fare |
| 9 | Treno degli Animali | maschietto | trascinamento | bloccato | Da fare |
| 10 | Atelier delle Principesse | femminuccia | trascinamento | bloccato | Da fare |

## Schede

### 1. Pompieri in Azione
Dalle finestre di un palazzo spuntano fiammelle buffe: il bambino le tocca e il camion le spegne con un getto d'acqua. Ogni tanto un gattino da salvare con la scala. Livelli: case sempre più alte, fiamme un po' più veloci. Ricompensa: medaglie e nuovi camion (colore, sirena).

### 2. Pasticceria Magica
Si prepara un cupcake in 4 passi: trascina gli ingredienti nella ciotola, mescola, inforna, decora con glassa e zuccherini. Alla fine un cliente-animaletto lo mangia felice. Ricompensa: nuove decorazioni e ricette (torta, biscotti, gelato).

### 3. Scavo dei Dinosauri
Strofinando il dito si toglie la terra e compaiono le ossa; poi le ossa si incastrano come un puzzle e il dinosauro prende vita con un ruggito simpatico. Ricompensa: album dei dinosauri scoperti.

### 4. Salone degli Unicorni
Un unicorno arriva sporco e spettinato: lavalo, spazzolalo, colora la criniera, aggiungi fiocchi e stelle. Alla fine foto ricordo con sfondo arcobaleno. Ricompensa: nuovi unicorni e accessori.

### 5. Razzo tra le Stelle
Tieni premuto e il razzo sale, rilascia e scende. Si raccolgono stelle evitando asteroidi di gomma: se li tocchi rimbalzi, non perdi. Ricompensa: pianeti visitati e nuovi razzi.

### 6. Cuccioli dal Dottore
Cuccioli con piccoli guai (zampa sporca, spina, fame, sonno): trascina lo strumento giusto sul punto giusto. Ogni cucciolo curato fa le feste. Ricompensa: i cuccioli curati vanno a vivere nel giardino della clinica.

### 7. Officina dei Monster Truck
Ripara e personalizza il truck (ruote, colore, adesivi), poi provalo su una pista con colline: tieni premuto per accelerare e saltare. Niente incidenti: il truck rimbalza sempre. Ricompensa: nuovi pezzi e piste.

### 8. Giardino delle Fate
Tocca la terra per piantare un seme, tocca la nuvola per farlo bere, guarda crescere fiori magici; arrivano farfalle e fatine. Gioco calmo, anche per i più piccoli. Ricompensa: il giardino si riempie e resta salvato.

### 9. Treno degli Animali
Gli animali aspettano in stazione: trascina ognuno nel vagone con la forma o il colore giusto, poi il treno parte fischiando. Insegna forme, colori e numeri fino a 5. Ricompensa: nuove stazioni (fattoria, giungla, polo).

### 10. Atelier delle Principesse
Vesti il personaggio trascinando abiti, corone, scarpe e accessori; scegli lo sfondo (castello, bosco, festa). Si possono scegliere personaggi diversi, anche principi e cavalieri. Ricompensa: nuovi abiti sbloccati giocando.

## In sospeso per Gaetano
- Ok sulla musica nuova di Pompieri (branch `game/pompieri-musica`).
- Verifica disponibilità di "Tappolino" (dominio, store, EUIPO).
- Iscrizione Apple Developer e segreti per la CI nel repository (elenco nel README del gioco 1).

## Registro
Dal gioco 3 in poi ogni gioco ha il suo diario in `docs/giochi/<id>.md` (decisione 23); qui sotto restano i giochi 1 e 2.

- **14/11/2026 — Gioco 1 "Pompieri in Azione"** (grafica 2.5D): versione web di test pubblicata come pagina claude.ai "Pompieri in Azione" (https://claude.ai/artifact/D5FYh9wfxXLkoCMFFoUJt9). Codice sul branch `game/pompieri-in-azione` del repository (portato sopra `main` aggiornato il 14/11/2026), ancora nella forma "un'app per gioco": `games/pompieri-in-azione/`, `template/core/`, `.github/workflows/pompieri-*.yml`. 10 livelli (3×2 → 6×3 finestre, poi difficoltà massima), gattino da salvare dal livello 2, 6 camion sbloccabili ogni 2 livelli, garage-collezione, area genitori con gate, 6 lingue, 15 test Vitest, screenshot store IT/EN per telefono, iPhone 6,9" e iPad 13". Note per i successivi: IAP con `@capgo/native-purchases`; in Phaser 4 non ruotare oggetti grandi; pagina web con `vite build --mode artifact`. Da verificare su dispositivo: banner AdMob, acquisto/ripristino, prima build iOS in CI.
- **14/11/2026 — Pompieri approvato da Gaetano; Fase 1 sul branch `game/pompieri-in-azione`**: creata l'app contenitore in `app/` (`it.tappolino.app`): menu dei giochi 2.5D con tessere e lucchetti, acquisto unico `it.tappolino.app.unlock_all` (offerta dietro parental gate, ripristino, banner solo Android finché non si acquista, niente banner su iOS), area genitori nel menu, stato condiviso `tappolino.app`. Pompieri convertito in modulo `app/src/games/pompieri/` (scene `pompieri:*`, testi `pompieri.*`, salvataggi `tappolino.pompieri`, caricamento dinamico, casa → menu). Progetti nativi nuovi rigenerabili con `scripts/native-setup.mjs`; nuova icona "T" Tappolino; workflow `app-web/android/ios.yml` al posto di `pompieri-*.yml`; `template/` rimosso (il codice comune è `app/src/core/`); schede store dell'app in bozza nelle 6 lingue. 25 test Vitest. Pagina web di test: https://claude.ai/artifact/Dr2cJwhs6Pa8dtT9kcMEXt (`#lock` mostra i giochi bloccati, `#unlock` simula l'acquisto). Come aggiungere un gioco: `app/README.md`. Da fare: segreti, prima build in test interno e TestFlight.
- **14/11/2026 — Unione a `main`** in un solo commit (decisioni 14–15): screenshot tolti da git e rigenerabili con `app/scripts/store-screenshots.py` (menu dei giochi + Pompieri, telefono/iPhone 6,9"/iPad 13"). Corretto prima dell'unione: i progressi di Pompieri ora si caricano all'apertura del gioco (`GameModule.init`, obbligatorio per i moduli che salvano). Test (25) e build web verificati anche da un clone pulito. Pagina di test aggiornata: https://claude.ai/artifact/Dr2cJwhs6Pa8dtT9kcMEXt. Restano da fare le build di prova Android e iOS quando ci sono segreti e account Apple (elenco segreti in `app/README.md`).
- **15/11/2026 — Gioco 2 "Pasticceria Magica"** (modulo `app/src/games/pasticceria/`, gratis, branch `game/pasticceria-magica`): un turno = un dolce. Un cliente-animaletto (coniglietto, orsetto, gattino, volpe; mai lo stesso due volte di fila) ordina con una nuvoletta; 4 ingredienti trascinati nella ciotola, frusta da muovere in tondo finché l'impasto è liscio, teglia nel forno con timer (freezer per il gelato), glassa con un tocco sul sac à poche e decorazioni trascinate sul dolce; il cliente mangia in tre morsi e la festa mostra la sorpresa. Ogni gesto di trascinamento accetta anche il semplice tocco (bimbi piccoli); manina subito al primo dolce, poi dopo 5 s di inattività. Progressione: si parte con cupcake, 3 decorazioni e 3 glasse; a ogni dolce servito si sblocca una cosa (biscotti al 2°, torta al 5°, gelato al 7°; 8 decorazioni e 6 glasse in tutto, completo all'11° dolce). Scelta della ricetta (le ricette da scoprire sono sagome con "?"), vetrina con gli ultimi 6 dolci come il bambino li ha decorati. Salvataggi `tappolino.pasticceria`, testi `pasticceria.*` nelle 6 lingue, valzerino ed effetti sintetizzati, 19 test Vitest (44 in tutto). Schede store del gioco in `app/store/games/pasticceria/` (versione per la futura app singola: gratis, niente acquisti); screenshot con `scripts/store-screenshots.py --groups pasticceria`. Note per i successivi: `DragManager` e `Hint` in `games/pasticceria/world.ts` sono pronti da spostare in `core/` per i giochi a trascinamento (6, 9, 10); parti colorate con `setTint` disegnate in grigio e riflessi in texture separata; con `?debug=1` `window.__pa.autoStep()` esegue il passo corrente. Pagina web di test aggiornata con il gioco 2: https://claude.ai/artifact/Dr2cJwhs6Pa8dtT9kcMEXt (dal menu Tappolino, seconda tessera). Da verificare su telefono: precisione del trascinamento con dita piccole, durata della mescolata (`MIX_GOAL`).
- **15/11/2026 — Pasticceria Magica, giro di rifinitura grafica** (richiesto da Gaetano): uovo dentro il portauovo e cono dentro il bicchierino (bordo posteriore dietro, bordo anteriore davanti), cliente che mangia davvero dal dolce (resta dietro al dolce e si allunga finché la bocca tocca il bordo alto; busto lungo tagliato al bancone; a ogni morso il dolce si rimpicciolisce verso il piattino, il piattino resta), orecchie del coniglio non più tagliate, nuvoletta dell'ordine rivolta verso il cliente, interno del freezer più scuro così la vaschetta si vede, alone del forno contenuto nella cavità, bordo della teglia della torta dietro alla cupola, pallina alta del gelato più tonda, barattoli sfocati in primo piano spostati ai margini in partita/ricette/festa/vetrina (coprivano ingredienti e vassoi), riflesso della bottiglia del latte sotto l'etichetta.
- **15/11/2026 — Pasticceria Magica, audio rifatto** (richiesta di Gaetano: la musica sintetizzata sembrava troppo retrò): valzer originale di 80 s in loop perfetto suonato con strumenti campionati (celesta, flauto, clarinetto, pianoforte, archi pizzicato e tappeto, arpa, contrabbasso, percussioni leggere) e 20 effetti nuovi (campanello del negozio, ding del forno, glissando magico, plop nella ciotola, frusta, glassa, morso croccante...). Strumenti: MuseScore General (MIT), resi con FluidSynth; script riproducibili in `app/scripts/audio/`, crediti in `app/src/games/pasticceria/audio/CREDITS.md`. Peso: musica ~1 MB per formato (ogg per Android/Chrome, mp3 per iOS), effetti ~250 KB. Il resto dell'app (menu Tappolino, Pompieri, clic dei pulsanti comuni) usa ancora l'audio sintetizzato: da decidere in regia se estendere lo stesso metodo (il player `sound.ts` passerebbe in `core/`, decisione 17).
- **15/11/2026 — Pasticceria Magica adeguata all'identità Tappolino** (decisione 18): branch aggiornato con `main` (merge, nessun conflitto); tutti i testi con `FONT` di `core/brand` (Fredoka); audio passato al lettore comune `core/sound` (pacchetto `pasticceria`, caricato nel `preload` del modulo e quindi nella barra del loader Tappolino), eliminato il player del modulo. Musica ed effetti invariati. Test 56/56, build web verde, pagina di prova: https://claude.ai/artifact/AFdW7dCQxKDUYkfdacnoz5. In attesa dell'ok di Gaetano per l'unione a `main`; dopo: branch `core/drag-e-manina` (decisione 17).
- **15/11/2026 — Pasticceria Magica unita a `main`** (ok di Gaetano), in un solo commit. Segue il branch `core/drag-e-manina` (decisione 17): `DragManager` e `Hint` passano da `games/pasticceria/world.ts` a `core/`; la chat del gioco 3 si apre dopo la sua unione.
- **15/11/2026 — `core/drag-e-manina` unito a `main`** (decisione 17): `DragManager` e `Hint` spostati da `games/pasticceria/world.ts` a `app/src/core/drag.ts`; Pasticceria importa da lì. Unica differenza: al rilascio l'oggetto torna alla propria profondità di partenza invece che a una fissa del gioco. Test 56/56, build web verde, trascinamenti verificati nel browser con il mouse. Si può aprire la chat del gioco 3.
