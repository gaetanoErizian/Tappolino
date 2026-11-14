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
