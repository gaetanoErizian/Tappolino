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

### Fase 2 — Giochi 2–5 (una chat per gioco, Opus medio)
Ordine: Pasticceria Magica, Scavo dei Dinosauri, Salone degli Unicorni, Razzo tra le Stelle.
Per ogni gioco: modulo in `app/src/games/<id>/` → versione web di test → ok di Gaetano → unione a `main` → eventuale passaggio di codice riusabile in `core/` su branch dedicato (decisione 17) → nuova build in test interno. La chat del gioco successivo si apre a questo punto.

### Fase 3 — Lancio pubblico v1.0
- 5 giochi: 3 gratis, 2 bloccati. Prezzo 1,99 €.
- Schede store nelle 6 lingue con screenshot per tema, privacy policy online, dichiarazioni privacy.
- Regole degli store ricontrollate prima dell'invio.

### Fase 4 — Giochi 6–10 come aggiornamenti
- Un gioco nuovo ogni 2–3 settimane, annunciato nelle novità della scheda.
- All'ottavo gioco il prezzo sale a 2,99 €.

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

## Come avviare ogni nuova chat di gioco
> Sviluppa il prossimo gioco della roadmap come modulo dell'app Tappolino. Collega il repository https://github.com/gaetanoErizian/Tappolino con permesso di scrittura, leggi `docs/00-DECISIONI.md` e `docs/05-STRATEGIA-E-ROADMAP.md`, lavora sul branch `game/<nome-gioco>` e fai push a ogni tappa.

## Stato
| Fase | Stato |
|---|---|
| 0 — Pompieri, versione web | Chiusa (14/11/2026) |
| 1 — App contenitore + catena di build | Unita a `main` (15/11/2026) con Pompieri come modulo. Manca la prima build di prova su Android e iOS (servono segreti e account Apple) |
| Identità Tappolino (decisione 18) | Sul branch `core/identita-tappolino`, test e build verdi; pagina di prova https://claude.ai/artifact/P1UK9b4WaXkbJbSb1Tr1ZL. Manca l'ok di Gaetano, poi unione a `main` in un solo commit. Dopo: musica di Pompieri nella sua chat; Pasticceria adotta carattere, loader e `core/sound` |
| 2 — Giochi 2–5 | In corso. Pasticceria Magica: completa sul branch `game/pasticceria-magica`, in attesa dell'ok di Gaetano; poi unione a `main` e branch `core/drag-e-manina` (decisione 17). Prossimo: Scavo dei Dinosauri |
| 3 — Lancio pubblico v1.0 | Da fare |
| 4 — Giochi 6–10 | Da fare |
| 5 — App singole | Da fare |
