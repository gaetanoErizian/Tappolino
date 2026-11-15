# 00 — Decisioni prese (prevalgono sugli altri file)

Aggiornato: 15/11/2026 — in caso di conflitto vale questo file, poi `05-STRATEGIA-E-ROADMAP.md`, poi gli altri.

1. **Un'unica app "Tappolino" che raccoglie tutti i giochi** (app collettore). I giochi non sono più app separate: sono moduli dentro l'app. Dettagli e fasi in `05-STRATEGIA-E-ROADMAP.md`.
   - appId unico: `it.tappolino.app` — nome store: *Tappolino* (sviluppatore: *Tappolino Games*).
   - Ogni gioco nuovo arriva come aggiornamento dell'app.
2. **Modello di vendita**
   - **3 giochi gratis** fin dal lancio: Pompieri in Azione, Pasticceria Magica, Scavo dei Dinosauri. Tutti gli altri sono bloccati (lucchetto nel menu).
   - **Un solo acquisto non consumabile** `it.tappolino.app.unlock_all`: sblocca tutti i giochi presenti e futuri e toglie la pubblicità per sempre. Con "Ripristina acquisti".
   - **Prezzo**: 1,99 € al lancio; sale a 2,99 € quando i giochi sono 8 o più. Chi ha già comprato tiene tutto.
   - Nessun altro acquisto, nessuna valuta virtuale, nessun abbonamento.
3. **Pubblicità**
   - **Android**: banner AdMob nel footer (child-directed, non personalizzato, contenuti "G") per chi non ha acquistato. Mai video, interstitial o annunci bloccanti.
   - **iOS**: nessun SDK pubblicitario di terzi e nessun banner. Il "banner della casa" non serve più nel collettore: i giochi bloccati si vedono nel menu con il lucchetto, e il tocco passa dal parental gate.
4. **App singole: dopo, e poche.** Solo 2–3 temi molto cercati, scelti con ricerca sulle parole chiave e sui giochi più giocati. Sono gratuite, con contenuti in più sul loro tema rispetto alla versione nel collettore, e rimandano al collettore dall'area genitori.
   - Nelle app singole: banner su Android, **nessun acquisto** (gli acquisti non passano da un'app all'altra).
   - **Da verificare prima di pubblicarle**: regole Apple (4.3, app duplicate) e Google (contenuti ripetitivi) sulle app simili dello stesso sviluppatore.
5. **Brand: "Tappolino"**. Da una ricerca web non risultano app o studi con questo nome; **non è una verifica di marchio**: Gaetano controlla dominio (tappolino.it / .com), nome sugli store e banca dati EUIPO. Riserve: *Nuvolino Games*, *Bimbobit*.
6. **Niente Mac**: build iOS in cloud con runner macOS (GitHub Actions o Codemagic), firma e caricamento su TestFlight automatizzati. Serve l'account Apple Developer.
7. **Account Google Play esistente da anni**: nessun obbligo dei 12 tester per 14 giorni.
8. **Stile grafico "2.5D"** — aspetto tridimensionale con profondità, luci e ombre, movimento e animazioni in 2D. Resta Phaser: nessun motore 3D.
   - **Disegni curati e dettagliati**: volume con sfumature, luce fissa dall'alto a sinistra, riflessi, ombra propria e ombra portata. Niente tinte piatte.
   - **Profondità di scena**: 3–4 piani in parallasse, foschia sui piani lontani, leggera sfocatura in primo piano.
   - **Ombre a terra** sotto oggetti e personaggi; **luci leggere** dove contano (alone additivo), con parsimonia.
   - **Movimento 2D**: spostamenti, scala, squash & stretch, particelle. Nessuna rotazione 3D reale.
   - **Prestazioni**: 60 fps su telefoni di fascia bassa.
   - **Limite**: la grafica è prodotta da Claude in vettoriale/procedurale. Se il dettaglio non basta, valutare illustrazioni esterne per personaggi e sfondi chiave.
   - Anche il menu dei giochi segue questo stile.
9. **Repository unico**: https://github.com/gaetanoErizian/Tappolino
   - A inizio chat: collegare il repository con permesso di scrittura e clonarlo.
   - Un branch per gioco (`game/<nome-gioco>`); a gioco approvato si unisce a `main`.
   - Chiavi di firma e certificati mai nel repository: solo nei segreti di GitHub.
10. **Modello consigliato**: Opus con impegno medio per i giochi dal 2 in poi; impegno alto per il gioco 1, per la costruzione dell'app contenitore e per le sessioni di pubblicazione.
11. **Scelte tecniche dal gioco 1** (aggiunte dalla chat Pompieri, adattate al collettore)
    - Acquisto in-app con il plugin `@capgo/native-purchases`. Il prodotto è ora uno solo, `it.tappolino.app.unlock_all`; il vecchio `<appId>.remove_ads` per gioco non si usa più.
    - Workflow CI nella radice del monorepo: `.github/workflows/app-android.yml`, `app-ios.yml`, `app-web.yml`, con `working-directory: app` e tag `app-v*`. I workflow `pompieri-*.yml` della prima versione vanno convertiti in questi nella Fase 1.
    - Riferimento per il codice comune: `app/README.md` e `app/src/core/` nel repository.
12. **Chat di regia**: una chat del progetto resta dedicata a strategia, decisioni e roadmap. Le chat dei giochi sviluppano; decisioni nuove e cambi di rotta si prendono in regia e finiscono in questo file.
13. **Quale copia dei documenti vale**: fa fede la cartella `docs/` sul branch `main` del repository. I documenti del progetto su claude.ai sono una copia, allineata dalla chat di regia.
    - Le chat dei giochi **non modificano i documenti del progetto** su claude.ai.
    - Nel proprio branch possono aggiornare solo `docs/03-ROADMAP.md` (stato e registro del loro gioco); le modifiche arrivano su `main` con l'unione del branch.
    - Tutto il resto (decisioni, strategia, setup) si segnala a Gaetano, che lo porta in regia.
    - `04-TEMPLATE.md` nei documenti del progetto è solo un rimando: il codice comune è in `app/src/core/` e si legge da `app/README.md`.
14. **Screenshot degli store fuori da git.** Sono file generati e pesanti (51 MB per un solo gioco in due lingue): nel repository restano solo lo script che li produce e le grafiche leggere (icona, feature graphic).
    - `app/store/screenshots/` va in `.gitignore`; gli screenshot si rigenerano quando servono e si consegnano come zip in chat o come artifact di un workflow.
    - Niente Git LFS: aggiunge quote e complessità per file che si possono rifare.
    - Il branch che li contiene si unisce a `main` **in un solo commit (squash)** dopo averli rimossi, così non entrano nella storia di `main`.
15. **Unione a `main` senza aspettare le build sui telefoni.** Un branch si unisce quando test e build web passano e Gaetano ha dato l'ok sul gioco. Le build Android e iOS di prova seguono appena ci sono i segreti e l'account Apple: non devono bloccare i giochi successivi.
16. **Schede store per singolo gioco** in `app/store/games/<id>/`: servono per le future app singole (Fase 5). La scheda dell'app Tappolino sta in `app/store/`.
17. **Come si modifica il codice comune (`app/src/core/`, `app/src/hub/`)**
    - Un branch di gioco (`game/<nome>`) non tocca `core/` né `hub/`: il codice riusabile nasce dentro il modulo del gioco. Fanno eccezione le correzioni di errori, da segnalare in regia.
    - Il passaggio nel codice comune si fa **subito dopo l'unione del gioco a `main`**, su un branch dedicato `core/<tema>`, dalla stessa chat che ha scritto il codice. Contiene solo lo spostamento: il gioco di origine passa a importare da `core/`, test e build web devono passare, unione a `main` in un solo commit.
    - **Una modifica al codice comune alla volta**, e solo quando non ci sono altri branch di gioco aperti. Se ce ne sono, decide la regia l'ordine e i branch aperti si riportano sopra `main` dopo l'unione.
    - La chat del gioco successivo si apre dopo che il branch `core/<tema>` è stato unito.
    - Prima applicazione: trascinamento e manina d'aiuto per il trascinamento, da Pasticceria Magica (`core/drag-e-manina`), per i giochi 6, 9 e 10.
18. **Identità Tappolino** (approvata da Gaetano e unita a `main` il 15/11/2026).
    - **Marchio**: la mascotte "Tappo" (un ditino con il cappello a tappo, sulle onde del tocco) e la scritta a lettere-adesivo colorate con la stella sulla "i". Generati da `app/scripts/make-brand.mjs`; colori e carattere in `app/src/core/brand.ts`.
    - **Carattere unico**: Fredoka (licenza OFL), incluso nell'app. Nessun testo con caratteri di sistema.
    - **Un solo loader** (`core/loader.ts`): scritta, barra con i colori del logo, Tappo che la percorre. Ogni caricamento, in ogni punto dell'app e dei giochi, usa questo: avanzamento reale, chiusura solo a caricamento riuscito, "riprova" in caso di errore.
    - **Pannelli** (impostazioni, area genitori, blocco adulti, offerta): solo i componenti di `core/overlay.ts`, con colori e carattere del marchio.
    - **Audio moderno con strumenti veri**: niente più musichette sintetizzate. Lettore comune `core/sound.ts`; musica e suoni come file audio generati da script in `app/scripts/audio/`.
    - **Chi fa cosa sulla musica**: menu principale in regia (fatto); la musica di ogni gioco nella chat di quel gioco, usando `core/sound` e il passo `preload` del modulo. Pasticceria e Pompieri hanno la loro (15/11/2026).
    - Come usarli: sezione "Identità Tappolino" di `app/README.md`.
19. **Come si porta un branch sopra `main`**: con un *merge* di `main` nel branch, mai con rebase e push forzato (nell'ambiente delle chat il push forzato non è permesso). L'unione finale a `main` resta in un solo commit (squash), quindi il risultato è identico.
20. **Lavori in parallelo**: due chat possono lavorare insieme solo se nessuna tocca `core/` o `hub/` e ognuna resta nel proprio modulo (`games/<id>/`, i propri script audio, la propria scheda store). Chi unisce per secondo fa prima il merge di `main` nel proprio branch e risolve i piccoli conflitti sui file condivisi (`games/registry.ts`, testi dell'app, `README.md`, `CREDITS.md`, `docs/03-ROADMAP.md`).
21. **Pagina di prova ufficiale di `main`**: https://claude.ai/artifact/AFdW7dCQxKDUYkfdacnoz5. Chi unisce a `main` la ripubblica; le pagine di prova dei singoli branch sono provvisorie.
22. **Crediti e licenze nell'app**: prima del lancio pubblico l'area genitori deve avere una voce "Crediti e licenze" (carattere Fredoka, strumenti campionati, librerie), allineata ad `app/CREDITS.md`. Da fare in Fase 3.
23. **Giochi 3–10 sviluppati in parallelo**, uno per chat, uniti a `main` uno alla volta quando Gaetano li approva. Regole e brief di ogni gioco in `06-CHAT-DEI-GIOCHI.md`.
    - Un gioco è una cartella: il menu lo trova da solo (`games/<id>/entry.ts`), senza modificare file condivisi. Le chat dei giochi non toccano `core/`, `hub/`, registro, testi dell'app, README, crediti, né gli altri documenti.
    - Stato e diario di ogni gioco in `docs/giochi/<id>.md`; la tabella di `03-ROADMAP.md` la aggiorna la regia. Questo sostituisce, dal gioco 3, la regola della decisione 13 sul registro in `03-ROADMAP.md`.
    - Durante lo sviluppo in parallelo **il codice comune lo modifica solo la regia**. Le chat scrivono nel proprio modulo ciò che manca e lo segnalano; l'unificazione (per esempio il gesto dello strofinare dei giochi 3 e 4) si fa in regia dopo le unioni. Questo sospende, per i giochi 3–10, il passaggio in `core/` previsto dalla decisione 17.
    - Ogni brief fissa ambientazione, colori e stile musicale, perché le chat non si vedono tra loro e i giochi non devono somigliarsi.
    - Restano nei moduli finché non servono a un altro gioco (niente spostamenti "per sicurezza"): il nome che compare e sparisce (Cuccioli, Giardino) e la farfalla che vola intorno a un punto (Giardino).
    - **Personaggio vestibile a strati** (Atelier: ogni capo si posiziona da solo sul corpo): resta nel gioco; candidato a `core/` per una futura app singola (Fase 5) o per un secondo gioco di vestiti.
    - **Ruote ed eliche**: in Phaser 4 un disegno ruotato dentro un Container può mostrare "triangoli tagliati". Non si ruota l'oggetto: si anima cambiando il disegno dei raggi, come fa il Treno (`games/treno`, `TrainView.spin`). Passa in `core/` quando lo usa un secondo gioco (candidato: Monster Truck).
    - Fatto in regia il 15/11/2026, dopo l'unione del gioco 5: manina del "tieni premuto" spostata in `app/src/core/holdHint.ts` (serve anche al gioco 7).
    - Fatto in regia il 15/11/2026, dopo l'unione dei giochi 3 e 4: gesto dello strofinare unificato in `app/src/core/scratch.ts`.
    - Fatto in regia il 15/11/2026, dopo l'unione della musica nuova di Pompieri: tolta la sintesi in tempo reale da `core/audio.ts` e il campo `song` dei moduli.
24. **Giochi non ancora pubblicati: "in arrivo".** Al lancio (v1.0, giochi 1–5) i giochi 6–10 compaiono nel menu come tessere "in arrivo": si vedono ma non si aprono e non si possono comprare singolarmente. Ogni aggiornamento ne apre uno.
    - Lo realizza la regia in Fase 3, nel codice comune (elenco dei giochi "in arrivo" nella configurazione dell'app, tessera con nastro dedicato, testo nelle 6 lingue).
    - Sulle pagine web di prova tutti i giochi restano apribili.
    - Nella scheda store e nell'offerta di sblocco va detto chiaramente che l'acquisto comprende anche i giochi in arrivo.
25. **Modalità prova per collaudare i giochi bloccati.**
    - Cosa fa: apre tutti i giochi senza acquisto e senza toccare lo stato dell'acquisto vero. Quando è attiva, nell'angolo in basso a sinistra resta una piccola etichetta "PROVA".
    - Come si attiva: area genitori → 5 tocchi rapidi sulla riga della versione in fondo (stesso gesto per spegnerla, oppure il pulsante "Disattiva"). Sulle pagine web di prova basta aggiungere `#prova` all'indirizzo. Resta attiva tra un avvio e l'altro.
    - **Dove esiste**: solo sulle pagine web di prova e nelle build per telefono compilate apposta con `VITE_TESTER=1`. **Nelle build per gli store non esiste**: un codice segreto dentro un'app pubblicata si può sempre estrarre, e diventerebbe uno sblocco gratuito per chiunque.
    - Per provare l'app pubblicata senza pagare si usano gli strumenti degli store: tester con licenza su Google Play, acquisti di prova gratuiti in TestFlight e in sandbox su Apple, codici promozionali da regalare.
    - Codice: `app/src/core/appState.ts` (`testerAvailable`, `setTester`), area genitori in `core/parentsArea.ts`.

