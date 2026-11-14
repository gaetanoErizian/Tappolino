# 03 — I primi 10 giochi: schede, stato e registro

I giochi sono moduli dell'app Tappolino. Fasi e strategia in `05-STRATEGIA-E-ROADMAP.md`. Il gioco 1 ha creato il codice comune (`core/`).

**Stati**: Da fare · In corso · Web pronta · Approvato · Nell'app (test interno) · Pubblicato

| # | Gioco | Tema | Gesto | Accesso | Stato |
|---|---|---|---|---|---|
| 1 | Pompieri in Azione | maschietto | tocco | gratis | Web pronta — in attesa dell'ok di Gaetano |
| 2 | Pasticceria Magica | femminuccia | trascinamento | gratis | Da fare |
| 3 | Scavo dei Dinosauri | maschietto | strofinare | gratis | Da fare |
| 4 | Salone degli Unicorni | femminuccia | strofinare / tocco | bloccato | Da fare |
| 5 | Razzo tra le Stelle | maschietto | tenere premuto | bloccato | Da fare |
| 6 | Cuccioli dal Dottore | femminuccia | trascinamento | bloccato | Da fare |
| 7 | Officina dei Monster Truck | maschietto | tocco / tenere premuto | bloccato | Da fare |
| 8 | Giardino delle Fate | femminuccia | tocco | bloccato | Da fare |
| 9 | Treno degli Animali | maschietto | trascinamento | bloccato | Da fare |
| 10 | Atelier delle Principesse | femminuccia | trascinamento | bloccato | Da fare |

## Schede

### 1. Pompieri in Azione
Dalle finestre di un palazzo spuntano fiammelle buffe: il bambino le tocca e il camion le spegne con un getto d'acqua. Ogni tanto un gattino da salvare con la scala. Livelli: case sempre più alte, fiamme un po' più veloci. Ricompensa: medaglie e nuovi camion (colore, sirena).

### 2. Pasticceria Magica
Si prepara un cupcake in 4 passi: trascina gli ingredienti nella ciotola, mescola, inforna, decora con glassa e zuccherini. Alla fine un cliente-animaletto lo mangia felice. Ricompensa: nuove decorazioni e ricette (torta, biscotti, gelato).

### 3. Scavo dei Dinosauri
Strofinando il dito si toglie la terra e compaiono le ossa; poi le ossa si incastrano come un puzzle e il dinosauro prende vita con un ruggito simpatico. Ricompensa: album dei dinosauri scoperti.

### 4. Salone degli Unicorni
Un unicorno arriva sporco e spettinato: lavalo, spazzolalo, colora la criniera, aggiungi fiocchi e stelle. Alla fine foto ricordo con sfondo arcobaleno. Ricompensa: nuovi unicorni e accessori.

### 5. Razzo tra le Stelle
Tieni premuto e il razzo sale, rilascia e scende. Si raccolgono stelle evitando asteroidi di gomma: se li tocchi rimbalzi, non perdi. Ricompensa: pianeti visitati e nuovi razzi.

### 6. Cuccioli dal Dottore
Cuccioli con piccoli guai (zampa sporca, spina, fame, sonno): trascina lo strumento giusto sul punto giusto. Ogni cucciolo curato fa le feste. Ricompensa: i cuccioli curati vanno a vivere nel giardino della clinica.

### 7. Officina dei Monster Truck
Ripara e personalizza il truck (ruote, colore, adesivi), poi provalo su una pista con colline: tieni premuto per accelerare e saltare. Niente incidenti: il truck rimbalza sempre. Ricompensa: nuovi pezzi e piste.

### 8. Giardino delle Fate
Tocca la terra per piantare un seme, tocca la nuvola per farlo bere, guarda crescere fiori magici; arrivano farfalle e fatine. Gioco calmo, anche per i più piccoli. Ricompensa: il giardino si riempie e resta salvato.

### 9. Treno degli Animali
Gli animali aspettano in stazione: trascina ognuno nel vagone con la forma o il colore giusto, poi il treno parte fischiando. Insegna forme, colori e numeri fino a 5. Ricompensa: nuove stazioni (fattoria, giungla, polo).

### 10. Atelier delle Principesse
Vesti il personaggio trascinando abiti, corone, scarpe e accessori; scegli lo sfondo (castello, bosco, festa). Si possono scegliere personaggi diversi, anche principi e cavalieri. Ricompensa: nuovi abiti sbloccati giocando.

## In sospeso per Gaetano
- Ok (o ritocchi) sulla versione web di Pompieri.
- Verifica disponibilità di "Tappolino" (dominio, store, EUIPO).
- Iscrizione Apple Developer e segreti per la CI nel repository (elenco nel README del gioco 1).

## Registro
- **14/11/2026 — Gioco 1 "Pompieri in Azione"** (grafica 2.5D): versione web di test pubblicata come pagina claude.ai "Pompieri in Azione" (https://claude.ai/artifact/D5FYh9wfxXLkoCMFFoUJt9). Codice sul branch `game/pompieri-in-azione` del repository (portato sopra `main` aggiornato il 14/11/2026), ancora nella forma "un'app per gioco": `games/pompieri-in-azione/`, `template/core/`, `.github/workflows/pompieri-*.yml`. 10 livelli (3×2 → 6×3 finestre, poi difficoltà massima), gattino da salvare dal livello 2, 6 camion sbloccabili ogni 2 livelli, garage-collezione, area genitori con gate, 6 lingue, 15 test Vitest, screenshot store IT/EN per telefono, iPhone 6,9" e iPad 13". Note per i successivi: IAP con `@capgo/native-purchases`; in Phaser 4 non ruotare oggetti grandi; pagina web con `vite build --mode artifact`. Da verificare su dispositivo: banner AdMob, acquisto/ripristino, prima build iOS in CI.
