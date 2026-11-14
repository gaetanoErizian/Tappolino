# Pompieri in Azione — Tappolino Games

Gioco 1 del progetto Videogiochi. Dalle finestre spuntano fiammelle buffe: il bambino le tocca e il camion le spegne. Ogni tanto un gattino da salvare con la scala. Livelli brevi (case sempre più alte), medaglie e 6 camion da collezionare, ognuno con la sua sirena.

- **Età**: 3–7 anni · **Gesto unico**: tocco · **Orientamento**: orizzontale · **Grafica**: 2.5D (decisione 7)
- **appId**: `it.tappolino.pompieri` · **Acquisto**: `it.tappolino.pompieri.remove_ads` (non consumabile, 0,99 €)
- **Lingue**: IT, EN, ES, FR, DE, PT

## Avvio rapido

```bash
npm install
npm run dev        # apre il gioco nel browser (anche dal telefono sulla stessa rete)
npm test           # test della logica (livelli, salvataggi, traduzioni)
npm run build      # build web in dist/
```

Versione web di test pubblicabile come pagina: `npx vite build --mode artifact` (Phaser da CDN, cartella `dist-web/`).

Parametri utili nel browser: `?lang=en` (lingua), `?reset=1` (azzera progressi), `?banner=1` (simula il banner Android), `?banner=house` (simula il banner della casa iOS).

## Struttura

```
src/
  core/            TEMPLATE COMUNE — da copiare identico nei giochi 2–10
    ads.ts           banner nel footer: AdMob su Android, banner della casa su iOS, nulla sul web
    purchase.ts      acquisto "togli pubblicità" + ripristino (Play Billing / StoreKit 2, nessun server)
    parentalGate.ts  blocco adulti: tieni premuto 3 s + somma scritta in lettere
    parentsArea.ts   area genitori: acquisto, ripristino, lingua, audio, azzera, privacy
    i18n.ts          lingua del dispositivo, testi da src/locales/*.json
    storage.ts       salvataggio locale (Capacitor Preferences)
    audio.ts         sintetizzatore Web Audio (effetti + musica, nessun file audio)
    layout.ts        spazio del banner: il gioco non finisce mai sotto il banner
    ui.ts            camera, pulsanti, manina tutorial, particelle
    art.ts           icone comuni (play, casa, audio, lucchetto, manina, stelle…)
    textures.ts      SVG → texture Phaser
    config.ts        interfaccia della configurazione per gioco
  game.config.ts   configurazione di QUESTO gioco (ID AdMob, prodotto, URL privacy)
  art.ts           grafica del gioco (camion, fiamme, finestre, gattino, medaglie…)
  levels.ts        livelli, camion sbloccabili, medaglie
  sfx.ts           effetti sonori e musica del gioco
  world.ts         sfondo città, palazzo, camion (cannone, scala, sirena)
  scenes/          Boot, Menu, Game, Reward, Garage
  locales/         6 lingue
android/ ios/      progetti nativi Capacitor (generati, già configurati)
assets/            icona e splash sorgente (generati da `npm run icons`)
store/             testi schede store, privacy policy, risposte dichiarazioni, grafiche, screenshot
.github/workflows/ (nel monorepo Tappolino stanno nella radice: pompieri-web/android/ios.yml)
```

### Riutilizzare il template nei prossimi giochi
Copiare `src/core/` così com'è; nel nuovo gioco scrivere `game.config.ts`, `art.ts`, `levels.ts`, `sfx.ts`, scene e locales. Le scelte tecniche da conservare:
- Area di design 1920×1080 con `Scale.EXPAND`: su schermi più larghi/alti si vede più sfondo, mai bande nere.
- **Niente rotazione di oggetti grandi** (Container, testi, immagini ampie) in Phaser 4: nei test sono comparsi triangoli "tagliati". Animare con scala, alpha e spostamento; ruotare solo oggetti piccoli (cannone, scala, gocce, particelle). Da riverificare su telefono vero.
- Stile 2.5D: gradienti con luce dall'alto a sinistra (`lightGrad`, `ballGrad` in `core/art.ts`), ombre morbide (`groundShadow`, texture `shadow`), sfondo a piani (`skyline` lontano nella foschia, `midtown`, gioco, `bush_fg` sfocato in primo piano), bagliori additivi (`glow` con `BlendModes.ADD`).
- Tocchi: un unico listener sulla scena + ricerca del bersaglio più vicino con tolleranza ampia.

## Prima della pubblicazione (TODO di Gaetano)

1. **Dominio e marchio "Tappolino"**: verificare tappolino.it/.com, nome sviluppatore sugli store, EUIPO.
2. **Privacy policy online**: completare i campi tra parentesi quadre in `store/privacy-policy.html`, pubblicarla (es. `https://tappolino.it/privacy`) e aggiornare `privacyUrl` in `src/game.config.ts`.
3. **AdMob** (solo Android): creare l'app e un'unità banner; poi
   - `src/game.config.ts` → `androidBannerId` reale e `testing: false`
   - `android/app/src/main/res/values/strings.xml` → `admob_app_id` reale
4. **Prodotto in-app** `it.tappolino.pompieri.remove_ads` su Play Console e App Store Connect (vedi `store/compliance.md`).
5. **Keystore Android** (una volta sola, conservarne 2 copie di backup):
   ```bash
   keytool -genkeypair -v -keystore tappolino-upload.jks -alias tappolino -keyalg RSA -keysize 2048 -validity 10000
   base64 -w0 tappolino-upload.jks > keystore.b64   # su Mac: base64 -i tappolino-upload.jks
   ```
6. **Repository GitHub privato** con questo progetto e i **segreti** (Settings → Secrets and variables → Actions):

| Segreto | Cos'è |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | contenuto di `keystore.b64` |
| `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` | dati del keystore |
| `PLAY_SERVICE_ACCOUNT_JSON` | (facoltativo) account di servizio Google Cloud con accesso a Play Console, per caricare in automatico |
| `APPLE_TEAM_ID` | Team ID dell'account Apple Developer |
| `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8` | chiave API App Store Connect con ruolo **Admin** (serve per la firma gestita nel cloud) |

## Build e pubblicazione

Nel monorepo `Tappolino` i workflow sono nella radice (`.github/workflows/pompieri-*.yml`) e lavorano nella cartella `games/pompieri-in-azione`; un tag `pompieri-v1.0.0` avvia Android e iOS.

- **Android**: GitHub → Actions → *Pompieri — Android* → Run workflow (traccia `internal`). Il primo caricamento su Play va fatto a mano dalla console (scaricando l'AAB dagli artifact della run); dai successivi carica la CI. L'account Play esiste da anni: dal test interno si passa direttamente alla produzione.
- **iOS**: creare prima l'app in App Store Connect con bundle ID `it.tappolino.pompieri`; poi Actions → *Pompieri — iOS* → Run workflow. La build compare in TestFlight dopo l'elaborazione Apple.
- Build locale Android (con Android Studio installato): `npm run android:sync && npx cap open android`.

## Da provare su dispositivo vero (non verificabile nel browser)
- Banner AdMob: altezza corretta del footer e nessuna sovrapposizione con la barra di navigazione Android.
- Acquisto, annullamento e "Ripristina acquisti" con account tester (Play: licenze di test; Apple: Sandbox/TestFlight).
- Prima build iOS in CI: firma automatica con chiave API.
- Audio dopo il primo tocco su iPhone e dopo aver rimesso l'app in primo piano.
