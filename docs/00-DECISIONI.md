# 00 — Decisioni prese (prevalgono sugli altri file)

Aggiornato: 14/11/2026

1. **Strategia iOS confermata**: nessun SDK pubblicitario di terzi su iPhone/iPad. Footer con "banner della casa" (altri nostri giochi, dietro parental gate) + acquisto 0,99 € per toglierlo. Su Android: banner AdMob child-directed + stesso acquisto.
2. **Brand sviluppatore: "Tappolino"** (nome store: *Tappolino Games*).
   - appId: `it.tappolino.<nomegioco>`
   - Da una ricerca web non risultano app o studi con questo nome. **Non è una verifica di marchio**: prima di registrarlo Gaetano controlla dominio (tappolino.it / .com), nome sviluppatore sugli store e banca dati marchi EUIPO.
   - Riserve se non fosse libero: *Nuvolino Games*, *Bimbobit*.
3. **Niente Mac**: le build iOS si fanno in cloud con runner macOS (GitHub Actions o Codemagic), con firma e caricamento su TestFlight automatizzati. Ogni gioco deve includere il workflow CI già pronto. Serve comunque l'account Apple Developer.
4. **Account Google Play esistente da anni**: non si applica l'obbligo dei 12 tester per 14 giorni. Si passa da test interno a produzione.
5. **Modello consigliato per sviluppare**: Opus con impegno medio per i giochi 2–10; impegno alto per il gioco 1 (crea template, annunci, acquisto, CI) e per le sessioni di integrazione store.
6. **Repository unico**: https://github.com/gaetanoErizian/Tappolino (monorepo).
   - A inizio chat: collegare il repository alla sessione con permesso di scrittura e clonarlo.
   - Struttura prevista: `template/` (codice comune `core/`), `games/<nome-gioco>/`, `docs/` (copia di questi file), `.github/workflows/` (build Android e iOS).
   - Lavorare su un branch per gioco (`game/<nome-gioco>`); commit e push solo quando Gaetano lo chiede o ha dato il via al gioco.
7. **Stile grafico: "2.5D"** — aspetto tridimensionale con profondità, luci e ombre, ma movimento e animazioni in 2D per restare leggeri. Sostituisce l'indicazione "forme piene, contorni spessi" di `01-CONTESTO.md`. Resta Phaser: nessun motore 3D, nessun modello 3D in tempo reale.
   - **Disegni curati e dettagliati**: ogni elemento ha volume (sfumature, luce principale da una direzione fissa in alto a sinistra, riflesso, ombra propria e ombra portata a terra). Niente tinte piatte.
   - **Profondità di scena**: almeno 3–4 piani in parallasse (sfondo lontano, medio, piano di gioco, primo piano), con foschia e minor contrasto sui piani lontani e leggera sfocatura in primo piano.
   - **Ombre a terra** sotto ogni oggetto e personaggio, che si allargano/schiariscono quando l'oggetto sale.
   - **Luci dinamiche leggere** dove contano (bagliore del fuoco, scintille, stelle): alone additivo o luci 2D di Phaser, usate con parsimonia.
   - **Movimento 2D**: spostamenti, scala, rotazione, squash & stretch, particelle. Nessuna rotazione 3D reale; l'effetto volume è nel disegno.
   - **Prestazioni**: 60 fps su telefoni di fascia bassa; sprite in atlas, niente shader pesanti a tutto schermo, particelle con tetto massimo.
   - **Limite onesto**: la grafica è prodotta da Claude in vettoriale/procedurale (SVG con sfumature, poi rasterizzato). Se il livello di dettaglio non basta, valutare illustrazioni esterne per personaggi e sfondi chiave, mantenendo lo stesso schema a piani.
