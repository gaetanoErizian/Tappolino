# 02 — Setup tecnico e pipeline (web → Android → iOS → store)

> Dal 14/11/2026 i giochi sono moduli di un'unica app **Tappolino**. Struttura e contratto dei moduli sono in `05-STRATEGIA-E-ROADMAP.md`; questo file descrive stack, versioni, comandi e checklist.

## Stack scelto
| Livello | Scelta | Perché |
|---|---|---|
| Motore di gioco | **Phaser 4** | 2D, leggero, perfetto per giochi touch semplici; gira nel browser, quindi la versione web di test è immediata |
| Linguaggio | **TypeScript** | Errori trovati prima, codice riusabile tra i giochi |
| Build | **Vite** | Avvio e build rapidi |
| Contenitore mobile | **Capacitor 8** | Trasforma la build web in progetto nativo Android (Gradle) e iOS (Xcode, Swift Package Manager) |
| Pubblicità Android | `@capacitor-community/admob` | Banner in basso, child-directed. **Escluso da iOS** con `ios.includePlugins` in `capacitor.config.ts` |
| Acquisto in-app | `@capgo/native-purchases` (Play Billing + StoreKit 2 diretti, nessun server, supporta SPM) | Scelto al gioco 1 al posto di `cordova-plugin-purchase` (plugin Cordova poco adatti a Capacitor 8 con SPM) |
| Salvataggi | `@capacitor/preferences` (locale) | Niente account, niente cloud |
| Grafica | SVG scritti nel codice, rasterizzati all'avvio, stile 2.5D | Originale, nitida, nessun file di terzi |
| Audio | Sintetizzato con Web Audio | Nessun file audio, nessuna licenza |
| Test | Vitest (logica) + prova nel browser in modalità mobile (Playwright headless per screenshot) | |

### Versioni bloccate (dal gioco 1, 14/11/2026)
| Pacchetto | Versione |
|---|---|
| phaser | 4.2.1 |
| @capacitor/core, cli, android, ios | 8.6.2 |
| @capacitor/preferences | 8.0.1 |
| @capacitor-community/admob | 8.3.0 |
| @capgo/native-purchases | 8.9.16 |
| vite | 8.3.8 |
| typescript | 7.0.2 |
| vitest | 5.1.0 |
| @capacitor/assets | 4.0.0 |
| sharp / tsx (script icone) | 0.35.5 / 4.23.15 |
| Android | minSdk 24, target/compile 36 |
| iOS | deployment target 15.0 |
| GitHub Actions | checkout@v7, setup-node@v7, setup-java@v6 (Temurin 21), upload-artifact@v7, r0adkll/upload-google-play@v1 |

Installare sempre con `npm i -E` (versioni esatte).

## Struttura
Quella definitiva (`app/` con `core/`, `hub/`, `games/<id>/`) è in `05-STRATEGIA-E-ROADMAP.md`.

Stato attuale del repository: il gioco 1 è sul branch `game/pompieri-in-azione` nella forma precedente, "un'app per gioco" (`games/pompieri-in-azione/`, `template/core/`, `.github/workflows/pompieri-*.yml`). La Fase 1 lo converte nella struttura definitiva.

Dentro ogni modulo gioco restano validi i file del gioco 1: `art.ts`, `levels.ts`, `save.ts`, `sfx.ts`, `world.ts`, `scenes/`, `locales/` (6 lingue), `tests/`.

## Fasi di sviluppo di ogni gioco
1. **Design** (breve): meccanica in una frase, gesto unico, ciclo di gioco, ricompense, elenco asset.
2. **Prototipo web**: gioco giocabile nel browser.
3. **Rifinitura**: grafica definitiva, suoni, animazioni di feedback, tutorial con manina, 6 lingue.
4. **Versione web di test**: `npx vite build --mode artifact` (Phaser da CDN) e pubblicazione di `dist-web/` come pagina condivisibile.
5. **Ok di Gaetano**, poi unione del branch a `main`.
6. **Build dell'app**: workflow `app-android.yml` → AAB firmato → test interno su Play Console; `app-ios.yml` → TestFlight.
7. **Pubblicazione** dell'aggiornamento: novità nella scheda store, invio in revisione.

## Comandi principali
```bash
npm install
npm run dev                         # sviluppo nel browser (?lang=en ?reset=1 ?banner=1 ?debug=1 ?game=<id> ?unlock=1)
npm test
npm run build                       # build per le app (dist/)
npx vite build --mode artifact      # build per la pagina web di test (dist-web/)
npm run icons && npx capacitor-assets generate --iconBackgroundColor '#8fd3ff' --splashBackgroundColor '#8fd3ff'
npx cap sync                        # copia la build web nei progetti nativi
```

## Cosa serve a Gaetano (una tantum)
- **Account Google Play Console** (esistente da anni: nessun obbligo dei 12 tester).
- **Account Apple Developer** (99 USD l'anno) + **chiave API App Store Connect** con ruolo Admin (firma gestita nel cloud dalla CI).
- **Account AdMob** (solo Android): un'app "Tappolino" e un'unità banner.
- **Keystore Android** di firma: generato una volta, conservato con backup (comando nel README del gioco 1).
- **Segreti della CI** nel repository GitHub (elenco nel README del gioco 1).
- **Pagina web pubblica** con la privacy policy (testo pronto in `store/privacy-policy.html`).
- Non serve un Mac né Android Studio: le build firmate le fa GitHub Actions.

## Chi fa cosa
- **Claude (chat dei giochi)**: design, codice, grafica vettoriale, traduzioni, versione web di test, configurazione Capacitor, workflow CI, testi per le schede store, privacy policy, screenshot, checklist.
- **Claude (chat di regia)**: strategia, decisioni, roadmap, allineamento dei documenti.
- **GitHub Actions**: compilazione firmata Android e iOS, caricamento su Play (traccia interna) e TestFlight.
- **Gaetano**: account, segreti, prodotto in-app, invio in revisione, prova su telefono vero.

## Configurazione annunci (Android)
- Banner adattivo ancorato in basso; `layout.ts` riduce l'area di gioco dell'altezza del banner.
- Richieste con *tagForChildDirectedTreatment = true*, *tagForUnderAgeOfConsent = true*, annunci non personalizzati (npa), *maxAdContentRating = General*.
- Permesso `AD_ID` rimosso dal manifest.
- In sviluppo sempre gli ID di test AdMob (`testing: true`).
- Se `unlock_all` è acquistato: il banner non viene mai caricato e l'area di gioco torna piena.
- Su iOS nessun banner.

## Checklist di pubblicazione
- [ ] Icona 1024×1024, splash, screenshot per telefono e tablet
- [ ] Titolo, descrizione breve e lunga nelle 6 lingue
- [ ] Privacy policy online e collegata
- [ ] Google: classificazione contenuti (IARC), pubblico di destinazione, Data Safety, dichiarazione annunci
- [ ] Apple: fascia d'età, categoria Kids, Privacy Nutrition Label, parental gate verificato su acquisto e link
- [ ] Prodotto in-app `it.tappolino.app.unlock_all` creato e approvato su entrambi gli store
- [ ] "Ripristina acquisti" funzionante
- [ ] Giochi bloccati che non si avviano senza acquisto; giochi gratis sempre accessibili
- [ ] ID AdMob reali e `testing: false`
- [ ] Prova offline, prova su telefono piccolo e su tablet
- [ ] Nessun banner che copre pulsanti o area di gioco
- [ ] Regole degli store ricontrollate (cambiano spesso)
