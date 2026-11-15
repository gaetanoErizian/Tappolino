# 03 — I primi 10 giochi: schede e stato

I giochi sono moduli dell'app Tappolino. Fasi e strategia in `05-STRATEGIA-E-ROADMAP.md`. Il gioco 1 ha creato il codice comune (`core/`).

**Stati**: Da fare · In corso · Web pronta · Approvato · Nell'app (test interno) · Pubblicato

| # | Gioco | Tema | Gesto | Accesso | Stato |
|---|---|---|---|---|---|
| 1 | Pompieri in Azione | maschietto | tocco | gratis | Su `main`, con musica e suoni nuovi (15/11/2026); build di prova Android/iOS quando ci sono segreti e account Apple |
| 2 | Pasticceria Magica | femminuccia | trascinamento | gratis | Unito a `main` il 15/11/2026 (web); build Android/iOS di prova quando ci sono segreti e account Apple |
| 3 | Scavo dei Dinosauri | maschietto | strofinare | gratis | Su `main` dal 15/11/2026 (approvato da Gaetano); diario in `giochi/dinosauri.md` |
| 4 | Salone degli Unicorni | femminuccia | strofinare / tocco | bloccato | Su `main` dal 15/11/2026 (approvato da Gaetano); diario in `giochi/unicorni.md` |
| 5 | Razzo tra le Stelle | maschietto | tenere premuto | bloccato | Su `main` dal 15/11/2026 (approvato da Gaetano); diario in `giochi/razzo.md` |
| 6 | Cuccioli dal Dottore | femminuccia | trascinamento | bloccato | Su `main` dal 15/11/2026 (approvato da Gaetano); diario in `giochi/cuccioli.md` |
| 7 | Officina dei Monster Truck | maschietto | tocco / tenere premuto | bloccato | In sviluppo in parallelo (brief in `06-CHAT-DEI-GIOCHI.md`) |
| 8 | Giardino delle Fate | femminuccia | tocco | bloccato | Su `main` dal 15/11/2026 (approvato da Gaetano); diario in `giochi/giardino.md` |
| 9 | Treno degli Animali | maschietto | trascinamento | bloccato | Su `main` dal 15/11/2026 (approvato da Gaetano); diario in `giochi/treno.md` |
| 10 | Atelier delle Principesse | femminuccia | trascinamento | bloccato | Su `main` dal 15/11/2026 (approvato da Gaetano); diario in `giochi/atelier.md` |

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
- Provare e approvare il gioco 7 (Monster Truck), l'unico ancora in sviluppo.
- Verifica disponibilità di "Tappolino" (dominio, store, EUIPO).
- Iscrizione Apple Developer e segreti per la CI nel repository (elenco in `app/README.md`).

## Diari
Il diario di ogni gioco (cosa contiene, pagine di prova, cosa provare sul telefono) è in `docs/giochi/<id>.md`. Questo file tiene solo schede e stato.
