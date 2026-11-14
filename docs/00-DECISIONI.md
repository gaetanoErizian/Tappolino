# 00 — Decisioni prese (prevalgono sugli altri file)

Aggiornato: 14/11/2026 (sera) — in caso di conflitto vale questo file, poi `05-STRATEGIA-E-ROADMAP.md`, poi gli altri.

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
