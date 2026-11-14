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
11. **Chat di regia**: una chat del progetto resta dedicata a strategia, decisioni e roadmap. Le chat dei giochi sviluppano; decisioni nuove e cambi di rotta si prendono in regia e finiscono in questo file.
