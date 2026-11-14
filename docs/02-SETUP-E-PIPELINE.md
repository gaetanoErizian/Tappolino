# 02 — Setup tecnico e pipeline (web → Android → iOS → store)

## Stack scelto
| Livello | Scelta | Perché |
|---|---|---|
| Motore di gioco | **Phaser** (ultima versione stabile) | 2D, leggero, perfetto per giochi touch semplici; gira nel browser, quindi la versione web di test è immediata |
| Linguaggio | **TypeScript** | Errori trovati prima, codice riusabile tra i giochi |
| Build | **Vite** | Avvio e build rapidi |
| Contenitore mobile | **Capacitor** (ultima stabile) | Trasforma la build web in progetto nativo Android (Gradle) e iOS (Xcode) |
| Pubblicità Android | `@capacitor-community/admob` | Banner in basso, child-directed. **Non installato su iOS** |
| Acquisto in-app | Plugin che usa direttamente Play Billing e StoreKit, senza server terzi (candidato: `cordova-plugin-purchase`) | Nessun dato a terzi, compatibile con le regole per bambini |
| Salvataggi | `@capacitor/preferences` (locale) | Niente account, niente cloud |
| Test | Vitest (logica) + prova manuale su browser in modalità mobile | |

Le versioni esatte vanno fissate al primo gioco, controllando la documentazione aggiornata, e poi riportate qui sotto in "Versioni bloccate".

### Versioni bloccate
*(da compilare al termine del gioco 1)*

## Struttura di ogni gioco
```
games/<nome-gioco>/
  package.json
  vite.config.ts
  capacitor.config.ts        # appId: it.tappolino.<nomegioco>
  index.html
  src/
    main.ts                  # avvio Phaser, scala FIT, orientamento
    scenes/                  # Boot, Menu, Game, Reward, Parents
    core/                    # CODICE COMUNE (copiato da template/)
      ads.ts                 # banner footer: AdMob su Android, banner della casa su iOS, nulla sul web
      purchase.ts            # acquisto "remove_ads" + ripristino
      parentalGate.ts        # blocco adulti
      i18n.ts                # carica locales/<lingua>.json dalla lingua del dispositivo
      storage.ts             # progressi e stato acquisto
      audio.ts               # musica, effetti, muto
      layout.ts              # area sicura + spazio riservato al banner (il gioco non finisce mai sotto il banner)
    locales/ it.json en.json es.json fr.json de.json pt.json
  public/assets/             # immagini, audio
  store/                     # testi scheda store nelle 6 lingue, screenshot, icona 1024, privacy policy
  CREDITS.md
  README.md                  # come avviare, buildare, pubblicare
```
La cartella `core/` è il **template condiviso**: nasce con il gioco 1, vive in `template/` e viene riusata identica nei giochi successivi.

## Fasi di sviluppo di ogni gioco
1. **Design** (breve): meccanica in una frase, gesto unico, ciclo di gioco, ricompense, elenco asset.
2. **Prototipo web**: gioco giocabile nel browser, grafica provvisoria.
3. **Rifinitura**: grafica definitiva, suoni, animazioni di feedback, tutorial con manina, 6 lingue.
4. **Versione web di test**: build pubblicata come pagina condivisibile, da provare sul telefono (meglio se con un bambino vero).
5. **Integrazioni mobile**: banner, acquisto, parental gate, icona, splash.
6. **Build Android**: AAB firmato → test interno su Play Console.
7. **Build iOS**: archivio Xcode in CI cloud → TestFlight.
8. **Pubblicazione**: schede store, dichiarazioni privacy, invio in revisione.

## Comandi principali
```bash
npm install
npm run dev                 # sviluppo nel browser
npm run build               # build web in dist/
npx cap add android         # una sola volta
npx cap add ios             # una sola volta, su macOS (in CI)
npx cap sync                # copia la build web nei progetti nativi
npx cap open android        # apre Android Studio
cd android && ./gradlew bundleRelease   # AAB per Play Store
```

## Cosa serve a Gaetano (una tantum)
- **Account Google Play Console**: già esistente da anni, nessun obbligo dei 12 tester.
- **Account Apple Developer** (99 USD l'anno, da verificare al momento dell'iscrizione).
- **Account AdMob** (solo Android): un'app e un'unità banner per ogni gioco.
- **Computer con Android Studio** (Windows o Linux) per l'AAB, oppure la stessa CI cloud.
- **Niente Mac**: build iOS in CI cloud con runner macOS (GitHub Actions o Codemagic).
- **Keystore Android** di firma: generato una volta, conservato con backup. Se si perde non si aggiorna più l'app. Mai nel repository.
- **Pagina web pubblica** con privacy policy (basta una pagina statica per tutti i giochi).

## Chi fa cosa
- **Claude (in chat)**: design, codice, grafica vettoriale, traduzioni, versione web di test, configurazione Capacitor, workflow di build, testi per le schede store, privacy policy, checklist.
- **In CI o sul computer di Gaetano**: compilazione firmata Android e iOS, caricamento sugli store. L'ambiente cloud delle chat non ha Xcode e ha rete limitata, quindi gli eseguibili finali firmati si generano lì con gli script preparati.

## Configurazione annunci (Android)
- Banner adattivo ancorato in basso; `layout.ts` riduce l'area di gioco dell'altezza del banner.
- Richieste con *tagForChildDirectedTreatment = true*, annunci non personalizzati, *maxAdContentRating = G*.
- In sviluppo usare sempre gli ID di test AdMob.
- Se `remove_ads` è acquistato: il banner non viene mai caricato e l'area di gioco torna piena.
- In Play Console: pubblico di destinazione solo fasce bambini, adesione alle norme per le famiglie.

## Checklist di pubblicazione
- [ ] Icona 1024×1024, splash, screenshot per telefono e tablet
- [ ] Titolo, descrizione breve e lunga nelle 6 lingue
- [ ] Privacy policy online e collegata
- [ ] Google: classificazione contenuti (IARC), pubblico di destinazione, Data Safety, dichiarazione annunci
- [ ] Apple: fascia d'età, categoria Kids, Privacy Nutrition Label, parental gate verificato su acquisto e link
- [ ] Prodotto in-app `remove_ads` creato e approvato su entrambi gli store
- [ ] "Ripristina acquisti" funzionante
- [ ] Prova offline, prova su telefono piccolo e su tablet
- [ ] Nessun banner che copre pulsanti o area di gioco
- [ ] Regole degli store ricontrollate (cambiano spesso)
