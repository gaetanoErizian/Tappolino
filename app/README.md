# Tappolino — app collettore

Un'unica app (`it.tappolino.app`) con i giochi come moduli: menu dei giochi 2.5D, 3 giochi gratis, un solo acquisto `it.tappolino.app.unlock_all` che sblocca tutto e toglie la pubblicità (decisioni 1–3). Per ora contiene il gioco 1, **Pompieri in Azione** (gratis).

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
android/ ios/        progetti nativi (rigenerabili: npx cap add + node scripts/native-setup.mjs)
scripts/             make-icons.ts (icona, splash, grafiche store), native-setup.mjs (personalizzazioni native)
assets/              sorgenti per @capacitor/assets
store/               schede store (bozza 6 lingue; games/<id>/ per le app singole), privacy policy, dichiarazioni, grafiche (screenshot fuori da git: scripts/store-screenshots.py)
```
Build automatiche nella radice del repository: `.github/workflows/app-web.yml`, `app-android.yml`, `app-ios.yml`.

## Aggiungere un gioco (Fase 2 in poi)

1. Creare `src/games/<id>/` con:
   - `index.ts` che esporta di default un `GameModule` (vedi `core/module.ts`): `id`, `textures()`, `locales`, `scenes`, `startScene`, `song` e `init` (deve chiamare `save.load()`, altrimenti i progressi non vengono letti);
   - scene Phaser con chiavi prefissate `"<id>:"` (es. `super('pasticceria:Game')`), pulsante casa nel menu del gioco che chiama `backToHub(this)` da `src/launcher.ts`;
   - testi nelle 6 lingue con chiavi prefissate `"<id>."`;
   - salvataggi in `new Store('tappolino.<id>', DEFAULT)` (solo progressi: lingua, muto e acquisto sono nello stato condiviso);
   - `tile.ts` con l'illustrazione della tessera (360×280, chiave `tile_<id>`), **senza importare il resto del gioco**;
   - test `<id>.test.ts`.
2. In `src/games/registry.ts` aggiungere la voce: `{ id, free, titleKey: 'games.<id>', color, tile, load: () => import('./<id>') }`. `free: true` solo per pompieri, pasticceria, dinosauri.
3. In `src/locales/*.json` aggiungere il titolo `games.<id>` nelle 6 lingue.
4. `npm test` controlla da solo: id unici, gratis solo i 3 previsti, titoli presenti in tutte le lingue, tessera con la chiave giusta.

## Regole tecniche emerse dal gioco 1
- Stile 2.5D con gli helper di `core/art.ts`: `lightGrad` (luce dall'alto a sinistra), `ballGrad`, `groundShadow` e texture `shadow`, `shade()`; bordi in una tonalità scura dello stesso colore, mai neri spessi. Pulsanti 3D con `roundButton`. Scenario comune: `cloud`, `sun`.
- Sfondo a piani con foschia e primo piano sfocato; parallasse all'ingresso della scena. Luci leggere con la texture `glow` in `BlendModes.ADD`.
- Phaser 4: **non ruotare oggetti grandi** (Container, testi, immagini ampie): nei test sono comparsi triangoli "tagliati". Animare con scala, alpha e posizione; ruotare solo oggetti piccoli.
- Area di design 1920×1080 con `Scale.EXPAND` (`setupView`), pulsanti ancorati agli angoli con `pin()`. Sul telefono il gioco occupa ~310 dp di altezza: massimo 3 righe di bersagli.
- Tocchi: un listener di scena e ricerca del bersaglio più vicino con raggio ampio (~175 unità).

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
