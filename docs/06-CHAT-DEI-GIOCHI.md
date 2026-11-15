# 06 — Chat dei giochi: regole e brief (giochi 3–10)

Ogni gioco si sviluppa in una chat a sé. Le chat lavorano **in parallelo**; i giochi entrano in `main` uno alla volta, quando Gaetano li approva. Questo file è tutto ciò che serve a una chat per partire: regole comuni e, in fondo, il brief del proprio gioco.

## Per partire
1. Collega il repository https://github.com/gaetanoErizian/Tappolino con permesso di scrittura e clonalo.
2. Leggi, in quest'ordine: `docs/00-DECISIONI.md`, questo file, `app/README.md` (sezioni "Aggiungere un gioco" e "Identità Tappolino").
3. Guarda come sono fatti i due giochi esistenti: `app/src/games/pompieri/` e `app/src/games/pasticceria/`.
4. Crea il branch indicato nel tuo brief partendo da `main` e fai push a ogni tappa.

## Regole comuni
**Il gioco è una cartella.** Tutto il tuo lavoro sta in:
`app/src/games/<id>/`, `app/scripts/audio/<id>_*.py`, `app/scripts/screenshots/<id>.py`, `app/store/games/<id>/`, `docs/giochi/<id>.md`.

**Non toccare nient'altro.** In particolare: `app/src/core/`, `app/src/hub/`, `app/src/games/registry.ts`, `app/src/locales/`, `app/src/app.ts`, `app/src/launcher.ts`, `app/package.json`, `app/README.md`, `app/CREDITS.md`, `app/scripts/store-screenshots.py`, gli altri file di `docs/`, le cartelle degli altri giochi, i documenti del progetto su claude.ai. Altre chat stanno lavorando sugli stessi file comuni: una modifica lì blocca tutti.
- Ti serve qualcosa di nuovo nel codice comune? Scrivilo nel tuo modulo e segnalalo a Gaetano "per la regia".
- Trovi un errore nel codice comune? Non correggerlo: segnalalo con il dettaglio.
- Niente nuove dipendenze npm.

**Usa ciò che c'è già** (decisione 18):
- carattere: `FONT`, `title()`, `title3d()`; mai caratteri scritti a mano;
- grafica 2.5D con gli aiuti di `core/art.ts` (luce dall'alto a sinistra, ombre a terra, piani in parallasse); tutta disegnata in codice SVG, originale, nessun personaggio o marchio esistente;
- pulsanti, manina, particelle: `core/ui.ts`, `core/hud.ts`; trascinamento: `core/drag.ts`;
- caricamenti: solo il loader Tappolino, tramite il passo `preload` del modulo;
- audio: lettore comune `core/sound.ts` con un pacchetto dal tuo `id`; musica e suoni con **strumenti veri** generati da script (modello: `scripts/audio/hub_audio.py`), mai sintesi in tempo reale. Ogni gioco ha una musica sua, nello stile indicato nel brief, in loop senza stacchi (30–80 s);
- salvataggi: `Store('tappolino.<id>', …)`; pulsante casa che chiama `backToHub(this)`.

**Regole di gioco** (bambini 3–7 anni, `docs/01-CONTESTO.md`): si gioca entro 3 secondi, un solo gesto, bersagli grandi, risposta immediata a ogni tocco (suono + animazione + particelle), nessun testo da leggere per giocare, tutorial con la manina, nessun "hai perso", sessioni da 1–2 minuti, qualcosa da collezionare che si sblocca giocando. Nessun acquisto e nessuna pubblicità dentro il gioco: ci pensa l'app.

**Tecnica**: in Phaser 4 non ruotare oggetti grandi; area di design 1920×1080; sul telefono al massimo 3 righe di bersagli; 60 fps su telefoni economici.

## Definizione di "finito"
- [ ] `entry.ts` (con `order`, `free` e `color` del brief, titoli nelle 6 lingue), `tile.ts`, `index.ts` con `init` e `preload`
- [ ] gioco completo e rifinito, con progressione e collezione
- [ ] testi in IT, EN, ES, FR, DE, PT
- [ ] musica ed effetti con strumenti veri, `CREDITS.md` nella cartella del gioco
- [ ] test `<id>.test.ts`; `npm test` e `npm run build` verdi
- [ ] prova nel browser in formato telefono, con le catture guardate una per una
- [ ] scheda store del gioco nelle 6 lingue in `app/store/games/<id>/` e `scripts/screenshots/<id>.py`
- [ ] `docs/giochi/<id>.md`: stato, cosa c'è nel gioco, cosa provare sul telefono, eventuali richieste per la regia
- [ ] pagina web di prova **tua** (nuova, con `npx vite build --mode artifact`), con il link dato a Gaetano

## Unione a `main` (solo dopo l'ok di Gaetano sul gioco)
1. `git fetch`, poi **merge** di `origin/main` nel tuo branch (mai rebase, mai push forzato: decisione 19).
2. `npm ci`, `npm test`, `npm run build`: tutto verde. Controlla che nel menu compaiano anche i giochi uniti nel frattempo.
3. Porta il lavoro su `main` in **un solo commit** (`git merge --squash`) e fai push.
4. Se il push viene rifiutato perché un'altra chat ha unito nel frattempo: `git fetch`, riparti dal punto 1. Non forzare mai.
5. Ripubblica la pagina di prova ufficiale di `main` (decisione 21) e scrivi a Gaetano il riepilogo "per la regia".

Lo stato nella tabella di `docs/03-ROADMAP.md` lo aggiorna la regia, non tu.

## Come deve suonare e apparire ogni gioco
Le chat non si vedono tra loro: per evitare dieci giochi uguali, ogni brief fissa ambientazione, colori dominanti e stile musicale. Rispettali.

---

## Brief

### Gioco 3 — Scavo dei Dinosauri
- `id`: `dinosauri` · `order`: 3 · `free`: **true** · `color`: `#c9853a` · branch `game/scavo-dei-dinosauri`
- Gesto: strofinare con il dito.
- Gioco: strofinando si toglie la terra e compaiono le ossa; poi le ossa si incastrano come un puzzle (vanno a posto anche con un tocco) e il dinosauro prende vita con un ruggito simpatico. Collezione: album dei dinosauri scoperti, ognuno diverso.
- Ambiente: scavo nel deserto al tramonto, terre calde, tende e attrezzi. Dinosauri buffi e tondi, mai spaventosi.
- Musica: avventura giocosa — marimba, fagotto, pizzicati, percussioni di legno.
- Nota: scrivi il gesto dello strofinare in un file a sé (`scratch.ts`) nel tuo modulo; sarà unificato in regia con quello del gioco 4.

### Gioco 4 — Salone degli Unicorni
- `id`: `unicorni` · `order`: 4 · `free`: false · `color`: `#b58cf0` · branch `game/salone-degli-unicorni`
- Gesto: strofinare, con tocchi per scegliere.
- Gioco: un unicorno arriva sporco e spettinato; lavalo (schiuma e risciacquo), spazzolalo, colora la criniera, aggiungi fiocchi e stelle. Alla fine foto ricordo con sfondo arcobaleno. Collezione: nuovi unicorni e accessori.
- Ambiente: salone tra le nuvole, lilla, rosa e turchese, luce morbida.
- Musica: pop sognante — arpa, celesta, flauto, basso morbido.
- Nota: scrivi il gesto dello strofinare in un file a sé (`scratch.ts`) nel tuo modulo; sarà unificato in regia con quello del gioco 3.

### Gioco 5 — Razzo tra le Stelle
- `id`: `razzo` · `order`: 5 · `free`: false · `color`: `#3c4fc4` · branch `game/razzo-tra-le-stelle`
- Gesto: tenere premuto.
- Gioco: tieni premuto e il razzo sale, rilascia e scende. Si raccolgono stelle evitando asteroidi di gomma: se li tocchi rimbalzi, non perdi. Collezione: pianeti visitati e nuovi razzi.
- Ambiente: spazio blu profondo con nebulose colorate e pianeti buffi, stelle in parallasse.
- Musica: spaziale e leggera — vibrafono, tappeto d'archi, basso elettrico morbido, batteria spazzolata.

### Gioco 6 — Cuccioli dal Dottore
- `id`: `cuccioli` · `order`: 6 · `free`: false · `color`: `#4cc3a5` · branch `game/cuccioli-dal-dottore`
- Gesto: trascinare (usa `core/drag.ts`; ogni trascinamento deve funzionare anche con un semplice tocco).
- Gioco: cuccioli con piccoli guai (zampa sporca, spina, fame, sonno): trascina lo strumento giusto sul punto giusto. Ogni cucciolo curato fa le feste. Collezione: i cuccioli curati vanno a vivere nel giardino della clinica. Niente aghi, sangue o paura.
- Ambiente: ambulatorio luminoso, verde acqua e crema, finestra sul giardino.
- Musica: dolce e allegra — chitarra classica, clarinetto, glockenspiel, contrabbasso.

### Gioco 7 — Officina dei Monster Truck
- `id`: `monstertruck` · `order`: 7 · `free`: false · `color`: `#f2a01e` · branch `game/officina-dei-monster-truck`
- Gesto: tocco in officina, tenere premuto in pista.
- Gioco: ripara e personalizza il truck (ruote, colore, adesivi), poi provalo su una pista con colline: tieni premuto per accelerare e saltare. Niente incidenti: il truck rimbalza sempre. Collezione: nuovi pezzi e piste.
- Ambiente: officina e arena all'aperto, arancio, giallo e grigio asfalto, pubblico che esulta.
- Musica: rock allegro — chitarra elettrica pulita, organo, basso elettrico, batteria.

### Gioco 8 — Giardino delle Fate
- `id`: `giardino` · `order`: 8 · `free`: false · `color`: `#5fbf6a` · branch `game/giardino-delle-fate`
- Gesto: tocco.
- Gioco: tocca la terra per piantare un seme, tocca la nuvola per farlo bere, guarda crescere fiori magici; arrivano farfalle e fatine. Gioco calmo, adatto anche ai più piccoli. Collezione: il giardino si riempie e resta salvato.
- Ambiente: radura al mattino, verdi teneri, fiori luminosi, lucciole.
- Musica: calma e incantata — flauto, arpa, archi pizzicati, campanelli; tempo lento.

### Gioco 9 — Treno degli Animali
- `id`: `treno` · `order`: 9 · `free`: false · `color`: `#e2574c` · branch `game/treno-degli-animali`
- Gesto: trascinare (usa `core/drag.ts`; deve funzionare anche con un semplice tocco).
- Gioco: gli animali aspettano in stazione; trascina ognuno nel vagone con la forma o il colore giusto, poi il treno parte fischiando. Insegna forme, colori e numeri fino a 5. Collezione: nuove stazioni (fattoria, giungla, polo).
- Ambiente: stazioncina di campagna, rosso, legno e cielo azzurro.
- Musica: viaggio in treno — banjo, armonica, contrabbasso, ritmo di spazzole che imita le rotaie.

### Gioco 10 — Atelier delle Principesse
- `id`: `atelier` · `order`: 10 · `free`: false · `color`: `#ee6fa8` · branch `game/atelier-delle-principesse`
- Gesto: trascinare (usa `core/drag.ts`; deve funzionare anche con un semplice tocco).
- Gioco: vesti il personaggio trascinando abiti, corone, scarpe e accessori; scegli lo sfondo (castello, bosco, festa). Personaggi diversi tra cui scegliere, anche principi e cavalieri. Collezione: nuovi abiti sbloccati giocando. Personaggi originali, non ispirati a film o marchi.
- Ambiente: atelier con specchio e manichini, rosa antico, oro e panna.
- Musica: pop elegante — pianoforte, archi, celesta, batteria leggera (in 4/4: il valzer è già della Pasticceria).
