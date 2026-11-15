# 05 — Strategia di pubblicazione e roadmap operativa

Aggiornato: 15/11/2026. Sostituisce le parti di `02-SETUP-E-PIPELINE.md` e `03-ROADMAP.md` che parlano di "un'app per gioco". Le schede dei 10 giochi restano in `03-ROADMAP.md`.

## Strategia in una frase
Un'app collettore **Tappolino** come prodotto principale (3 giochi gratis, tutto il resto con un acquisto unico), poi poche app singole sui temi più cercati che portano traffico al collettore.

## Perché
- Una sola app da pubblicare, revisionare e mantenere.
- Recensioni e download concentrati su un'unica scheda.
- Ogni gioco nuovo è un aggiornamento che riporta i bambini nell'app.
- Le app singole recuperano la visibilità nelle ricerche per tema ("gioco pompieri", "gioco unicorni").

## Architettura
```
app/                          UNICO progetto Capacitor (android/, ios/)
  src/
    core/                     codice comune: annunci, acquisto, parental gate, lingue, salvataggi, audio, grafica 2.5D
    hub/                      menu dei giochi (tessere 2.5D, lucchetti, area genitori)
    games/<id>/               un modulo per gioco
  store/                      schede store nelle 6 lingue, screenshot, icone, privacy policy
standalone/<id>/              (fase 5) gusci sottili per le app singole, riusano core/ e games/<id>/
docs/
.github/workflows/            build Android e iOS
```

### Contratto di un modulo gioco
Ogni `games/<id>/index.ts` esporta un oggetto con:
- `id` (es. `pompieri`), chiave del titolo tradotto, texture della tessera per il menu;
- `free: boolean` — `true` solo per pompieri, pasticceria, dinosauri;
- le scene Phaser, con chiavi prefissate `<id>:` (es. `pompieri:Game`);
- le texture, i testi nelle 6 lingue (chiavi prefissate `<id>.`), musica ed effetti;
- salvataggi propri sotto la chiave `tappolino.<id>`.

Regole:
- Stato condiviso (acquisto, lingua, muto) nella chiave `tappolino.app`, gestito dal core.
- Ogni gioco si carica solo quando viene aperto (import dinamico), così l'avvio resta rapido anche con 10 giochi.
- Ogni gioco ha un pulsante "casa" che riporta al menu.
- Un gioco bloccato non si avvia mai: il tocco apre il parental gate e poi la schermata di acquisto.
- Sul web di test `?game=<id>` apre direttamente un gioco, `?unlock=1` simula l'acquisto e `?lock=1` blocca tutto; sulle pagine claude.ai valgono `#lock`, `#unlock`, `#reset` (tabella completa in `02-SETUP-E-PIPELINE.md`).
- Schede store del singolo gioco in `app/store/games/<id>/`; screenshot fuori da git (decisioni 14 e 16).

### Acquisto e annunci nel core
- Prodotto unico `it.tappolino.app.unlock_all`: sblocca tutti i giochi e toglie il banner.
- Android: banner AdMob finché non si acquista. iOS: nessun banner.
- Il "banner della casa" esce dal collettore; il codice resta nel core per le app singole.

## Roadmap operativa

### Fase 0 — Chiudere Pompieri così com'è (in corso)
- La chat Pompieri finisce la versione web di test del gioco.
- Collega il repository e fa push del lavoro sul branch `game/pompieri-in-azione`.
- Gaetano prova il gioco sul telefono e dà l'ok o chiede ritocchi.

### Fase 1 — Costruire l'app contenitore (stessa chat Pompieri, impegno alto)
- Creare `app/` con core, menu dei giochi e Pompieri trasformato in modulo.
- Acquisto unico `unlock_all`, lucchetti, area genitori nel menu.
- Workflow CI: AAB Android e build iOS con caricamento su TestFlight.
- Unire a `main` appena test e build web passano (decisione 15), in un solo commit e senza screenshot (decisione 14).
- Prima installazione sui telefoni tramite test interno (Play Console) e TestFlight, appena ci sono segreti e account Apple: serve a collaudare tutta la catena con un solo gioco. **Non è il lancio pubblico** e non blocca la Fase 2.

### Fase 2 — Giochi 3–10 in parallelo (una chat per gioco, Opus medio)
Pasticceria (gioco 2) è già su `main`. Gli altri otto si sviluppano insieme, ognuno nella sua chat, con regole e brief in `06-CHAT-DEI-GIOCHI.md` (decisione 23).
Per ogni gioco: modulo in `app/src/games/<id>/` → pagina web di prova → ok di Gaetano → unione a `main` in un solo commit. Le unioni avvengono una alla volta, nell'ordine in cui i giochi vengono approvati.
Per il lancio (Fase 3) servono i giochi 3, 4 e 5: hanno la precedenza nelle prove di Gaetano.

### Fase 3 — Lancio pubblico v1.0
- **10 giochi: 3 gratis, 7 bloccati** (decisione 27). Prezzo di lancio 1,99 € per le prime 4 settimane circa, poi 2,99 €.
- **Fatto in regia (15/11/2026)**:
  - meccanismo dei giochi "in arrivo" pronto per i giochi futuri (Android: nastro; iPhone e iPad: nascosti; decisioni 24 e 26), non usato al lancio;
  - voce "Crediti e licenze" nell'area genitori (decisione 22);
  - schede store nelle 6 lingue, distinte per Google Play e App Store (`app/store/listing.md`, generate da `scripts/make-listing.py`);
  - catture: menu nelle 6 lingue per i 3 formati; per i giochi c'è il flusso GitHub "App — catture per gli store";
  - regole degli store ricontrollate (`app/store/compliance.md`).
- **Resta a Gaetano** (serve per inviare): account Apple Developer, AdMob, segreti per le build, pagina privacy online con i dati del titolare, creazione di app e prodotto negli store, prove sui telefoni. Elenco in `app/store/compliance.md` e qui sotto.

### Fase 4 — Giochi nuovi come aggiornamenti
- I giochi 6–10 escono già con la v1.0 (decisione 27).
- Dopo circa 4 settimane dal lancio il prezzo passa da 1,99 € a 2,99 €.
- Giochi nuovi (11, 12…) scelti guardando i più giocati e i temi più cercati: una chat per gioco, come nella Fase 2, annunciati nelle novità della scheda.
- Un gioco finito ma non ancora da pubblicare si mette in `comingSoon` (`app/src/config.ts`); per pubblicarlo lo si toglie e si rigenerano schede e catture del menu.

### Fase 5 — App singole
- Ricerca sulle parole chiave più cercate negli store nelle 6 lingue + giochi più giocati nel collettore.
- Verifica delle regole su app simili (Apple 4.3, Google contenuti ripetitivi).
- 2–3 app singole con contenuti in più sul tema, gratuite, che rimandano al collettore.

## Compiti di Gaetano (in parallelo, non bloccano lo sviluppo)
1. **Iscrizione Apple Developer** — richiede giorni: partire subito.
2. Verifica del nome Tappolino: dominio, store, EUIPO.
3. Account AdMob: app Android "Tappolino" e un'unità banner.
4. Dominio e pagina pubblica della privacy policy (il testo lo prepara Claude).
5. Keystore Android e certificati Apple caricati come segreti nel repository GitHub (le istruzioni le prepara la chat della Fase 1).
6. Creazione dell'app e del prodotto `unlock_all` su Play Console e App Store Connect.
7. Avviare su GitHub il flusso "App — catture per gli store" (Actions → Run workflow) e scaricare i file zip delle catture.
8. Circa 4 settimane dopo il lancio: portare il prezzo a 2,99 € nei due store (decisione 27).

## Da provare sul telefono alla prima build
- Banner AdMob, acquisto e ripristino, prima build iOS in CI.
- Menu: frecce e pallini delle pagine sotto le tessere non coperti dal banner; tre pagine con tutti e 10 i giochi.
- Giro di musica senza stacchi su iOS (formato mp3, verificato finora solo su Chrome) e volume della musica rispetto agli effetti.
- Pasticceria: precisione del trascinamento con dita piccole, durata della mescolata.
- Pompieri: getto d'acqua, tempi di risposta al tocco, volume della musica e delle sirene.
- Dinosauri e Unicorni: fluidità dello strofinare su un telefono economico; Unicorni: durata delle tappe.
- Razzo: fluidità del viaggio su un telefono economico, volume del "boing", eventuale breve attesa alla prima apertura di mappa dei pianeti e hangar.
- Giardino: volume della pioggia e delle note dei fiori rispetto alla musica; fluidità con un'aiuola piena e tutte le fatine su un telefono economico.
- Monster Truck: se l'inclinazione a scatti di 3° sembra fluida, fluidità su un telefono economico, riga delle scelte in officina non coperta dal banner Android.
- Rotazioni: su un telefono vero, controllare se le immagini ruotate si vedono intere (nel browser di prova Phaser 4 le taglia a triangoli; i giochi le evitano).
- Tempi tra un'animazione e l'altra su un telefono lento (segnalato dall'Atelier): nel browser di prova senza scheda grafica (8–12 fotogrammi al secondo) le attese programmate si allungano. Con le impostazioni attuali Phaser scarta solo i fotogrammi più lunghi di 200 ms, quindi a 30 fotogrammi stabili non dovrebbe succedere: da confermare su un telefono economico; se succede, si corregge in un punto solo, nella configurazione comune.

## Come avviare la chat di un gioco
> Sei la chat del gioco N di Tappolino. Collega il repository https://github.com/gaetanoErizian/Tappolino con permesso di scrittura, clonalo e segui `docs/06-CHAT-DEI-GIOCHI.md`: regole comuni e brief "Gioco N". Sviluppa il gioco completo fino alla pagina web di prova, poi attendi il mio ok prima di unire a `main`.

## Stato
| Fase | Stato |
|---|---|
| 0 — Pompieri, versione web | Chiusa (14/11/2026) |
| 1 — App contenitore + catena di build | Unita a `main` (15/11/2026) con Pompieri come modulo. Manca la prima build di prova su Android e iOS (servono segreti e account Apple) |
| Identità Tappolino (decisione 18) | Completa su `main` (15/11/2026): Pasticceria e Pompieri adeguate, vecchia sintesi audio rimossa |
| 2 — Giochi 3–10 in parallelo | **Chiusa il 15/11/2026: tutti i 10 giochi sono su `main`.** Passati in `core/`: strofinare (`scratch.ts`), manina del tieni premuto (`holdHint.ts`), ruote a fotogrammi (`wheels.ts`) |
| 3 — Lancio pubblico v1.0 | Parte di sviluppo chiusa il 15/11/2026: lancio con tutti e 10 i giochi (decisione 27), crediti, schede store, regole. Mancano i compiti di Gaetano e le prove sui telefoni: senza quelli non si può inviare agli store |
| 4 — Giochi nuovi | Da fare dopo il lancio |
| 5 — App singole | Da fare |
