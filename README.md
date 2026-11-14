# Tappolino

Giochi semplici e coinvolgenti per bambini (3–7 anni), per Android e iOS.

**Le nostre regole**
- Un solo banner nel footer. Niente video, niente interstitial, niente pubblicità bloccanti.
- Un acquisto unico sblocca tutti i giochi e toglie la pubblicità per sempre.
- Nessuna raccolta di dati, nessun account, si gioca offline.
- Tradotti in IT, EN, ES, FR, DE, PT.

Tutti i giochi vivono in un'unica app, **Tappolino**: 3 giochi gratis, un acquisto unico sblocca tutti gli altri e toglie la pubblicità.

## Struttura del repository
```
docs/                 decisioni, contesto, setup, roadmap (leggere prima di lavorare)
app/                  l'app Tappolino: core comune, menu dei giochi, un modulo per gioco
standalone/           (più avanti) app singole sui temi più cercati
.github/workflows/    build Android e iOS in cloud
```

## Da dove partire
1. `docs/00-DECISIONI.md` — decisioni prese, prevalgono sugli altri file
2. `docs/05-STRATEGIA-E-ROADMAP.md` — strategia di pubblicazione, architettura e fasi
3. `docs/01-CONTESTO.md` — visione, regole, vincoli degli store
4. `docs/02-SETUP-E-PIPELINE.md` — stack tecnico e pipeline fino agli store
5. `docs/03-ROADMAP.md` — schede dei primi 10 giochi

## Stack
Phaser + TypeScript + Vite per la versione web, Capacitor per Android e iOS.

## Flusso di lavoro
Un branch per gioco (`game/<nome-gioco>`), prima la versione web di test, poi le build per smartphone.
