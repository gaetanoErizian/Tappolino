# Tappolino

Giochi semplici e coinvolgenti per bambini (3–7 anni), per Android e iOS.

**Le nostre regole**
- Un solo banner nel footer. Niente video, niente interstitial, niente pubblicità bloccanti.
- Un acquisto unico da 0,99 € toglie la pubblicità per sempre.
- Nessuna raccolta di dati, nessun account, si gioca offline.
- Tradotti in IT, EN, ES, FR, DE, PT.

## Struttura del repository
```
docs/                 contesto, setup, roadmap e decisioni (leggere prima di lavorare)
template/             codice comune a tutti i giochi (nasce con il gioco 1)
games/<nome-gioco>/   un gioco per cartella
.github/workflows/    build Android e iOS in cloud
```

## Da dove partire
1. `docs/00-DECISIONI.md` — decisioni prese, prevalgono sugli altri file
2. `docs/01-CONTESTO.md` — visione, regole, vincoli degli store
3. `docs/02-SETUP-E-PIPELINE.md` — stack tecnico e pipeline fino agli store
4. `docs/03-ROADMAP.md` — i primi 10 giochi e il loro stato

## Stack
Phaser + TypeScript + Vite per la versione web, Capacitor per Android e iOS.

## Flusso di lavoro
Un branch per gioco (`game/<nome-gioco>`), prima la versione web di test, poi le build per smartphone.
