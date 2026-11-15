# Tappolino — app collettore

Un'unica app (`it.tappolino.app`) con i giochi come moduli: menu dei giochi 2.5D, 3 giochi gratis, un solo acquisto `it.tappolino.app.unlock_all` che sblocca tutto e toglie la pubblicità (decisioni 1–3). Contiene il gioco 1, **Pompieri in Azione**, e il gioco 2, **Pasticceria Magica** (entrambi gratis).

## Avvio rapido

```bash
npm install
npm run dev                         # nel browser (anche dal telefono sulla stessa rete)
npm test                            # Vitest: app, sblocchi, registro giochi, traduzioni, logica dei giochi
npm run build                       # build per le app (dist/)
npx vite build --mode artifact      # pagina web di test (dist-web/, Phaser da CDN)
npx cap sync                        # copia la build nei progetti android/ e ios/
```

Parametri del web di test: `?game=pompieri` apre direttamente un gioco · `?unlock=1` simula l'acquisto · `?lock=1` mostra tutti i giochi come bloccati (per provare il percorso di acquisto) · `?lang=en` · `?reset=1` azzera tutto · `?banner=1` simula il banner Android · `?debug=1` espone `window.__game`.

## Struttura

```
src/
  main.ts            avvio Phaser (scene Boot e Hub; i giochi aggiungono le loro scene all'apertura)
  Boot.ts            texture comuni, menu e tessere; avvio app; ?game=<id>
  app.ts             stato condiviso, lingua, audio, banner, verifica acquisto, area genitori
  launcher.ts        apertura giochi: controllo sblocco → import dinamico → scena iniziale; ritorno al menu
  config.ts          appId, prodotto unlock_all, ID AdMob, URL privacy
  locales/           testi dell'app (menu, area genitori, parental gate, acquisto, TITOLI dei giochi)
  core/              codice comune a tutti i giochi
    appState.ts        stato condiviso "tappolino.app": sbloccato, muto, lingua
    module.ts          contratto dei moduli (GameModule, GameEntry, canPlay)
    unlockOffer.ts     offerta "sblocca tutto" (dietro parental gate) e blocco acquisto/ripristino
    parentsArea.ts     area genitori: sblocca, ripristina, lingua, audio, azzera progressi, privacy
    parentalGate.ts    tieni premuto 3 s + somma scritta in lettere
    purchase.ts        Play Billing / StoreKit 2 con @capgo/native-purchases (nessun server)
    ads.ts             banner AdMob solo Android; iOS nessun banner (banner della casa solo per app singole)
    hud.ts             pulsanti muto/casa, titoli in rilievo, passaggi di scena
    ui.ts, layout.ts, i18n.ts, storage.ts, audio.ts, art.ts, textures.ts, overlay.ts, platform.ts, config.ts
  hub/               menu dei giochi: Hub.ts (tessere 2.5D, lucchetti, pagine da 4), art.ts, sfx.ts (musica del menu)
  games/
    registry.ts      elenco dei giochi (voci leggere) — l'unico file da toccare per aggiungere un gioco al menu
    pompieri/        modulo gioco 1: index.ts, tile.ts, art.ts, levels.ts, save.ts, sfx.ts, world.ts, scenes/, locales/, pompieri.test.ts
    pasticceria/     modulo gioco 2: recipes.ts (logica pura), art.ts, world.ts (cucina, dolce composto, trascinamento, manina), save.ts, sfx.ts, scenes/, locales/, pasticceria.test.ts
android/ ios/        progetti nativi (rigenerabili: npx cap add + node scripts/native-setup.mjs)
scripts/             make-icons.ts (icona, splash, grafiche store), native-setup.mjs (personalizzazioni native)
assets/              sorgenti per @capacitor/assets
store/               schede store (bozza 6 lingue; games/<id>/ per le app singole), privacy policy, dichiarazioni, grafiche (screenshot fuori da git: scripts/store-screenshots.py)
```
Build automatiche nella radice del repository: `.github/workflows/app-web.yml`, `app-android.yml`, `app-ios.yml`.

## Modalità prova (collaudo dei giochi bloccati)
Apre tutti i giochi senza acquisto. Area genitori → 5 tocchi sulla riga della versione; sul web anche `#prova`. Etichetta "PROVA" sempre visibile quando è attiva. Esiste solo sul web e nelle build fatte con `VITE_TESTER=1 npm run build`: **mai usare quella variabile per una build destinata agli store** (decisione 25).

## Aggiungere un gioco
Un gioco è una cartella. **Non si modifica nessun file condiviso**: così più giochi si sviluppano in parallelo senza conflitti (decisione 23). Brief e regole per le chat dei giochi: `docs/06-CHAT-DEI-GIOCHI.md`.

Tutto ciò che appartiene al gioco:

| Cosa | Dove |
|---|---|
| Voce di menu: `id`, `order`, `free`, `color`, `titles` nelle 6 lingue, `tile`, `load` | `src/games/<id>/entry.ts` (esporta di default un `GameEntryDef`) |
| Illustrazione della tessera (360×280, chiave `tile_<id>`), **senza importare il resto del gioco** | `src/games/<id>/tile.ts` |
| Modulo: `id`, `textures()`, `locales`, `scenes`, `startScene`, `init` (deve chiamare `save.load()`), `preload` (audio) | `src/games/<id>/index.ts` (esporta di default un `GameModule`) |
| Scene Phaser con chiavi `"<id>:…"`; pulsante casa che chiama `backToHub(this)` di `src/launcher.ts` | `src/games/<id>/scenes/` |
| Testi nelle 6 lingue, chiavi `"<id>.…"` | `src/games/<id>/locales/` |
| Salvataggi: `new Store('tappolino.<id>', DEFAULT)` (solo progressi) | `src/games/<id>/save.ts` |
| Musica ed effetti (file audio) + crediti | `src/games/<id>/audio/`, `src/games/<id>/CREDITS.md` |
| Script che genera l'audio | `scripts/audio/<id>_*.py` |
| Test | `src/games/<id>/<id>.test.ts` |
| Catture per gli store | `scripts/screenshots/<id>.py` |
| Scheda store del gioco (per la futura app singola) | `store/games/<id>/` |
| Stato e diario di sviluppo | `docs/giochi/<id>.md` |

Il menu trova il gioco da solo (`src/games/registry.ts` legge tutti gli `entry.ts`) e lo ordina per `order`. `npm test` controlla: id unici, gratis solo pompieri/pasticceria/dinosauri, titoli in tutte le lingue, tessera con la chiave giusta, ordine senza doppioni.

File che un gioco **non tocca**: `src/core/`, `src/hub/`, `src/games/registry.ts`, `src/locales/`, `src/app.ts`, `src/launcher.ts`, `package.json`, `README.md`, `CREDITS.md`, `scripts/store-screenshots.py`, `docs/` (tranne `docs/giochi/<id>.md`). Se serve qualcosa di nuovo nel codice comune: lo si scrive nel proprio modulo e lo si segnala in regia.

Per l'audio servono FluidSynth e gli strumenti campionati: `apt-get update && apt-get install -y fluidsynth musescore-general-soundfont-lossless` e `pip install mido numpy scipy`.

## Identità Tappolino (codice comune)
Tutto ciò che si vede e si sente fuori dai giochi segue il marchio. I giochi lo riusano, non lo ridisegnano.

- **Marchio** — `src/core/brand.ts`: colori (`BRAND`, `RAINBOW`), carattere (`FONT`, Fredoka incluso nell'app), logo e mascotte Tappo (`brandTextures()` → texture `brand_logo`, `brand_mark`). I file in `src/core/brand/*.svg` sono generati: per cambiarli si modifica `scripts/make-brand.mjs` e si lancia `npm run brand`, poi `npm run icons` per icona, splash e grafiche store.
- **Testi nei giochi** — usare sempre `FONT` (o `title()` / `title3d()` di `core/hud.ts`), mai un carattere scritto a mano.
- **Loader** — `src/core/loader.ts`: l'unica schermata di caricamento dell'app (scritta, barra con i colori del logo, Tappo che la percorre). Avvio dell'app e apertura di un gioco la usano già. Per un caricamento lungo dentro un gioco: `await runWithLoader([{ weight, run: (report) => … }])`. Un gioco con file pesanti (audio) espone `preload(report)` nel suo modulo: il launcher lo mostra nella barra. Niente loader fatti in casa.
- **Pannelli** — `src/core/overlay.ts`: cartoncino, pulsanti (`tp-btn`, `go`, `sec`, `warn`), pastiglie (`tp-chips`), interruttore (`tp-switch`), intestazione con Tappo (`cardHeader()`), riga di stato con stellina (`statusLine()`). Area genitori, blocco adulti e offerta li usano già.
- **Audio** — `src/core/sound.ts`: lettore a campioni comune. Ogni gioco registra un pacchetto con il proprio id (`sound.register(id, { music: { ogg, mp3, loop }, sfx })`), lo carica nel `preload` del modulo (`sound.preload(id, report)`), poi `sound.playMusic(id)` e `sound.play(id, 'nome')`. Il menu usa il pacchetto `hub` (`src/hub/sfx.ts`, file in `src/hub/audio/`, generati da `scripts/audio/hub_audio.py`). All'apertura di un gioco il launcher ferma la musica del menu; al ritorno la riavvia. La sintesi in tempo reale non esiste più: `core/audio.ts` tiene solo lo stato del muto.

## Regole tecniche emerse dal gioco 1
- Stile 2.5D con gli helper di `core/art.ts`: `lightGrad` (luce dall'alto a sinistra), `ballGrad`, `groundShadow` e texture `shadow`, `shade()`; bordi in una tonalità scura dello stesso colore, mai neri spessi. Pulsanti 3D con `roundButton`. Scenario comune: `cloud`, `sun`.
- Sfondo a piani con foschia e primo piano sfocato; parallasse all'ingresso della scena. Luci leggere con la texture `glow` in `BlendModes.ADD`.
- Phaser 4: **non ruotare oggetti grandi** (Container, testi, immagini ampie): nei test sono comparsi triangoli "tagliati". Animare con scala, alpha e posizione; ruotare solo oggetti piccoli.
- Area di design 1920×1080 con `Scale.EXPAND` (`setupView`), pulsanti ancorati agli angoli con `pin()`. Sul telefono il gioco occupa ~310 dp di altezza: massimo 3 righe di bersagli.
- Tocchi: un listener di scena e ricerca del bersaglio più vicino con raggio ampio (~175 unità).
- Trascinamento — `src/core/drag.ts` (nato in Pasticceria Magica, decisione 17): `DragManager` prende l'oggetto più vicino al dito (raggio ampio), un tocco senza movimento vale come azione semplice (per i più piccoli), se il rilascio è fuori bersaglio l'oggetto torna a posto con un rimbalzo. `Hint` mostra la manina per tocco, trascinamento da A a B e movimento circolare (per il solo tocco c'è anche `HintHand` in `core/ui.ts`). Esempio d'uso: `games/pasticceria/scenes/Game.ts`. Per i giochi 6, 9 e 10.
- Parti da colorare (impasto, glassa): disegnate in scala di grigi e colorate con `setTint`; i riflessi bianchi in una texture separata sopra, altrimenti il tint li spegne.
- Audio di Pasticceria Magica: pacchetto `pasticceria` di `core/sound` (registrato e caricato nel `preload` del modulo, `src/games/pasticceria/sfx.ts`); musica ed effetti generati da `scripts/audio/pasticceria_music.py` e `pasticceria_sfx.py` (FluidSynth + MuseScore General, MIT; crediti in `src/games/pasticceria/audio/CREDITS.md`).
- Test automatici nel browser: con `?debug=1` la scena di gioco di Pasticceria è in `window.__pa` e `autoStep()` esegue il passo corrente (usato da `scripts/store-screenshots.py`).

## Prima della pubblicazione (compiti di Gaetano, docs/05)
1. Privacy policy online: completare i campi tra parentesi quadre in `store/privacy-policy.html`, pubblicarla e aggiornare `privacyUrl` in `src/config.ts`.
2. AdMob (solo Android): app "Tappolino" e unità banner → `src/config.ts` (`androidBannerId`, `testing: false`) e `android/app/src/main/res/values/strings.xml` (`admob_app_id`).
3. Prodotto `it.tappolino.app.unlock_all` su Play Console e App Store Connect (vedi `store/compliance.md`).
4. Keystore Android (una volta sola, due copie di backup):
   ```bash
   keytool -genkeypair -v -keystore tappolino-upload.jks -alias tappolino -keyalg RSA -keysize 2048 -validity 10000
   base64 -w0 tappolino-upload.jks > keystore.b64   # su Mac: base64 -i tappolino-upload.jks
   ```
5. Segreti del repository (Settings → Secrets and variables → Actions):

| Segreto | Cos'è |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | contenuto di `keystore.b64` |
| `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` | dati del keystore |
| `PLAY_SERVICE_ACCOUNT_JSON` | (facoltativo) account di servizio con accesso a Play Console, per caricare in automatico |
| `APPLE_TEAM_ID` | Team ID Apple Developer |
| `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8` | chiave API App Store Connect con ruolo **Admin** (firma gestita nel cloud) |

## Build e test interno
- **Android**: Actions → *App — Android* → Run workflow (traccia `internal`). Il primo caricamento su Play va fatto a mano dalla console con l'AAB scaricato dagli artifact della run; dai successivi carica la CI.
- **iOS**: creare l'app in App Store Connect con bundle ID `it.tappolino.app`, poi Actions → *App — iOS* → Run workflow. La build compare in TestFlight dopo l'elaborazione Apple.
- Un tag `app-v1.0.0` avvia Android e iOS.

## Da provare su dispositivo vero
- Banner AdMob: altezza del footer, nessuna sovrapposizione con la barra di navigazione; sparisce dopo l'acquisto.
- Acquisto, annullamento, "Ripristina acquisti" (Play: licenze di test; Apple: Sandbox/TestFlight); lucchetti che spariscono subito dopo l'acquisto.
- Prima build iOS in CI con firma automatica.
- Audio dopo il primo tocco su iPhone e dopo aver rimesso l'app in primo piano.
- Passaggio menu → gioco → menu su telefoni lenti (caricamento del modulo).
