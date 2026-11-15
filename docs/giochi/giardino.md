# Gioco 8 — Giardino delle Fate (`giardino`)

Branch `game/giardino-delle-fate` · `order` 8 · non gratis (si apre con l'acquisto unico) · colore `#5fbf6a`

## Stato
**Approvato da Gaetano e unito a `main`** (15/11/2026). Test e build web verdi, partita provata nel browser in formato telefono e tablet.
Pagina di prova ufficiale di `main` (decisione 21): https://claude.ai/artifact/AFdW7dCQxKDUYkfdacnoz5 — il gioco è nella seconda pagina del menu ed è bloccato come nell'app vera: si apre aggiungendo `#prova` all'indirizzo (modalità prova, decisione 25). In locale: `?game=giardino&unlock=1` oppure `#prova`.

## Cosa c'è nel gioco
- **Gesto**: solo il tocco. Gioco calmo, senza tempo e senza errori, adatto anche ai più piccoli.
- **Menu**: radura al mattino (sole in alto a sinistra, colline nella foschia, lucciole), titolo, pulsante gioca, pulsante album (fiore). A destra un grande fiore che canta se lo tocchi (l'ultimo scoperto), con la sua farfalla e la prima fatina (se è già arrivata). In basso "Fiori nel giardino: n su 21".
- **Aiuola** (la partita): 7 vasi di terra su due file sfalsate (massimo 2 righe di bersagli) e una nuvoletta sorridente nel cielo.
  - Tocco sulla **terra** → un seme luccicante cade con la scia di luce e si infila nel terreno (la terra diventa scura, bagnata); compare il fumetto con la goccia: "ho sete".
  - Tocco sulla **nuvola** → va sopra la piantina assetata più vicina e fa piovere (gocce, spruzzi, faccina felice): seme → germoglio → bocciolo → **fiore**. Tre piogge per fiore.
  - Il fiore sboccia con un'esplosione di scintille e petali, sorride, canta la sua nota (scala pentatonica: i fiori insieme non stonano mai) e arriva una farfalla del suo colore. La prima volta compare il nome del fiore.
  - Tocco su una piantina assetata → si dondola e chiede l'acqua, la manina indica la nuvola. Tocco sulla nuvola quando nessuno ha sete → risatina e due gocce, la manina indica la terra vuota. Tocco su un fiore → canta. Tocco su fatine, farfalle, lucciole → giravolta, volo, scintilla. Ogni tocco ha suono e animazione.
  - In alto i 7 pallini dell'aiuola diventano fiorellini quando il vaso fiorisce.
  - **Manina**: alla prima partita subito sulla terra, poi sulla nuvola; dopo 5 secondi senza fare niente mostra la mossa utile (nuvola, terra vuota o freccia avanti).
- **Aiuola piena**: i fiori cantano in fila da sinistra a destra, le fatine fanno la giravolta, "Che meraviglia!" e coriandoli; compare la freccia per l'aiuola accanto.
- **Collezione — il giardino resta salvato** (`Store('tappolino.giardino')`): 3 aiuole da 7 vasi (21 fiori), ognuna con il suo paesaggio: il vecchio albero con la porticina delle fate, lo stagno con le ninfee, il cerchio dei funghi sotto l'arcobaleno. Le aiuole già piene si rivisitano con le frecce. A giardino completo: "Il giardino è pieno di magia!".
- **8 fiori magici** con il viso, scoperti un po' alla volta (uno nuovo al 1°, 2°, 4°, 6°, 9°, 12°, 15° e 18° seme; negli altri un fiore già conosciuto, mai uguale al precedente): margherita, tulipano, campanula, girasole, rosa, fiore stella, fiore di luna, fiore arcobaleno.
- **6 fatine** tonde e gentili, tutte diverse (una è un folletto), che arrivano volando con la scia di scintille al 1°, 4°, 8°, 12°, 16° e 21° fiore e restano a volare nel giardino: Rugiada, Petalo, Lucciola, Muschio, Brezza, Stellina.
- **Album "Fiori e fatine"**: 8 cartoncini dei fiori e 6 delle fatine; quelli non ancora trovati sono ombre. Un tocco: il fiore canta o la fatina ride, con il nome.
- **Partita**: un fiore in circa 15 secondi, un'aiuola in 1–2 minuti.
- **Audio**: musica "Radura incantata" (flauto, arpa, archi pizzicati, celesta e glockenspiel; Fa maggiore, 60 bpm, loop esatto di 64 s, −18 LUFS come gli altri giochi) e 14 effetti con strumenti veri, tutti in Fa (la nota dei fiori è un solo campione intonato dal gioco). Generati da `app/scripts/audio/giardino_music.py` e `giardino_sfx.py`. Crediti in `app/src/games/giardino/CREDITS.md` e `audio/CREDITS.md`.
- **Testi**: IT, EN, ES, FR, DE, PT (titolo, album, contatore, festa, nomi di fiori e fatine). Per giocare non serve leggere.
- **Scheda store** nelle 6 lingue: `app/store/games/giardino/` (limiti dei caratteri verificati). Catture: `python scripts/store-screenshots.py --groups giardino` (menu, pioggia, aiuola fiorita, nuova fatina, giardino magico, stagno, album).

## Cosa provare sul telefono
1. Prima partita: la manina deve far capire subito "tocca la terra", poi "tocca la nuvola". Provare con un bimbo piccolo che tocca a caso: non si deve mai bloccare niente.
2. Piantare tre semi di fila e poi toccare la nuvola più volte di seguito: la nuvola va sempre sulla piantina più vicina e non si incanta se la tocchi mentre piove.
3. Volume della pioggia e della nota dei fiori rispetto alla musica; la musica deve restare calma.
4. Aiuola piena con 7 fiori, 7 farfalle e fino a 6 fatine: fluidità su un telefono economico.
5. Uscire con la casetta a metà fiore e rientrare: il seme o il bocciolo è ancora lì, assetato.
6. Fatine ai lati (posti a x 110 e 1810): sui telefoni molto stretti potrebbero stare ai bordi; dire se si vedono bene.

## Per la regia
- Usati dal codice comune senza modifiche: `core/ui` (`button`, `pin`, `burst`, `pulse`, `HintHand`), `core/hud`, `core/sound`, `core/art`, `core/storage`, `core/textures`. **Nessun file comune toccato.**
- Candidati per `core/` se servissero ad altri giochi: `floatingLabel` (nome che compare e sparisce, simile a quello di Cuccioli) e la farfalla che vola intorno a un punto (`Butterfly` in `world.ts`).
- `?game=giardino` sul web di prova richiede `&unlock=1` (gioco non gratis): lo script delle catture lo aggiunge da sé. Con `?debug=1` la scena dell'aiuola è in `window.__gi` e `autoStep()` fa la prossima mossa utile.
- Menu dei giochi: la tessera del Giardino è la terza della seconda pagina; il lucchetto copre il sole della tessera (va bene così).

## Diario
- 15/11/2026 — Modulo completo: menu, aiuola (semina, pioggia, crescita in 3 passi, fiori che cantano, farfalle, fatine), 3 aiuole con paesaggi diversi, album; audio con strumenti veri; test (`giardino.test.ts`, 16 casi).
- 15/11/2026 — Prova nel browser in formato telefono (844×390) e tablet (1024×768): tocchi veri su terra, nuvola, piantine, fiori, fatine; aiuola completata, passaggio alla seconda e alla terza aiuola, giardino completo con l'ultima fatina, album; catture guardate una per una. Corretto: sole nascosto dietro l'albero; ali delle fatine poco visibili; fatine che coprivano i fiori (ora volano ai lati e in alto); puntini delle aiuole sotto la nuvola (tolti). Scheda store nelle 6 lingue e script delle catture (provato).
- 15/11/2026 — Pagina di prova del branch pubblicata (`npx vite build --mode artifact`): https://claude.ai/artifact/3ipL9YNCJS5G27ZCQpBmaz. In attesa dell'ok di Gaetano per l'unione a `main`.
- 15/11/2026 — Ok di Gaetano: `main` invariato dall'apertura del branch (nessun merge necessario), `npm ci`, test e build verdi, menu con i giochi 1–6 e 8; unito a `main` in un solo commit e pagina ufficiale di `main` ripubblicata.
