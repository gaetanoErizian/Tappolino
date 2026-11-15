# Gioco 3 — Scavo dei Dinosauri (`dinosauri`)

Branch `game/scavo-dei-dinosauri` · `order` 3 · gratis · colore `#c9853a`

## Stato
**Pronto per l'approvazione di Gaetano** (15/11/2026). Test e build web verdi, partita provata nel browser in formato telefono.
Pagina di prova del branch (provvisoria): https://claude.ai/artifact/ARZYN7e4xYzfLGHNiWBTwB — il gioco è la terza tessera del menu; per aprirlo direttamente si può usare `?game=dinosauri` solo in locale (le pagine claude.ai non passano i parametri).

## Cosa c'è nel gioco
- **Menu**: scavo nel deserto al tramonto (tenda a righe, lanterna, attrezzi, cassa), pulsante gioca, pulsante album. Sul prato c'è l'ultimo dinosauro scoperto, che salta e ruggisce se lo tocchi; la prima volta c'è un uovo che dondola.
- **Scavo** (gesto: strofinare): la buca è coperta di terra; strofinando con il dito (pennello che segue il dito, polvere, suono di spazzola) la terra va via. Quando un osso è scoperto per metà la terra intorno frana, l'osso brilla e vola nel vassoio di legno; in alto si accendono le icone delle ossa trovate. A volte salta fuori un tesoro (ammonite, ambra, conchiglia). Se il bambino si ferma, piccoli scintillii indicano dove scavare; dopo 5 secondi torna la manina.
- **Montaggio**: nella roccia compare l'impronta dello scheletro; le ossa si trascinano al loro posto oppure basta **toccarle** e ci vanno da sole. Nessun errore possibile: un osso lasciato altrove torna nel vassoio.
- **Il dinosauro prende vita**: bagliore, puff, il dinosauro cade a terra rimbalzando e fa un ruggito simpatico (note musicali, non spavento). "Nuovo dinosauro!" con il nome e i coriandoli, poi la foto ricordo che vola nell'album. Toccandolo salta e ruggisce ancora. Pulsanti: album e "ancora".
- **Collezione**: album con 8 dinosauri tondi e buffi, ognuno con colori, sagoma, scheletro e ruggito propri — Tirannosauro, Pachicefalosauro, Triceratopo, Pteranodonte, Anchilosauro, Parasaurolofo, Stegosauro, Brachiosauro. Si scoprono in ordine, da 4 a 6 ossa; ad album completo si scava un dinosauro a caso (mai lo stesso due volte di fila). Nell'album i dinosauri si toccano per farli ruggire; quelli non ancora trovati sono sagome con il punto di domanda.
- **Partita**: circa 1 minuto. Salvataggi in `Store('tappolino.dinosauri')`: dinosauri trovati, scavi fatti, ultimo dinosauro, tutorial visti.
- **Audio**: musica "Avventura nello scavo" (marimba, fagotto, pizzicati, xilofono, percussioni di legno; loop esatto di 64 s) ed effetti con strumenti veri, generati da `scripts/audio/dinosauri_*.py`. Crediti in `app/src/games/dinosauri/CREDITS.md` e `audio/CREDITS.md`.
- **Testi**: IT, EN, ES, FR, DE, PT (nomi dei dinosauri, titoli). Per giocare non serve leggere.
- **Scheda store** nelle 6 lingue: `app/store/games/dinosauri/` (limiti dei caratteri verificati). Catture: `python scripts/store-screenshots.py --groups dinosauri`.

## Cosa provare sul telefono
1. Primo avvio: la manina sopra la terra deve far capire subito che si strofina. Strofinare a lungo deve restare fluido (60 fps) anche su un telefono economico: è il punto più pesante del gioco (strato di terra cancellato in tempo reale).
2. Strofinare con due dita o molto in fretta: nessun blocco, il pennello segue il dito.
3. Montaggio con **un solo tocco** sulle ossa (i più piccoli non trascinano): ogni osso deve andare al suo posto.
4. Volume del ruggito rispetto alla musica, e che non spaventi.
5. Uscire con la casetta a metà scavo e rientrare: si riparte dallo stesso dinosauro (non ancora scoperto), l'album resta.
6. Telefoni molto allungati (20:9): la buca resta tutta visibile, il vassoio non finisce sotto il banner.

## Per la regia
- **Gesto dello strofinare** in `app/src/games/dinosauri/scratch.ts`, pronto per l'unificazione con il gioco 4 (decisione 23): `ScratchGrid` (logica pura, testata: quanta superficie è scoperta in tutto o in un rettangolo) e `ScratchLayer` (RenderTexture da cancellare con pennello morbido, ombra opzionale, un tocco senza movimento cancella già un cerchio, `fractionIn`, `eraseAt`, `clearAll`).
- Usati dal codice comune senza modifiche: `core/drag` (`DragManager`, `Hint`), `core/ui`, `core/hud`, `core/sound`, `core/art`.
- Piccola nota su `.gitignore`: lo script delle catture (`scripts/screenshots/<id>.py`) crea `app/scripts/screenshots/__pycache__/`, che non è escluso. Suggerito `__pycache__/` nel `.gitignore` di `app/`.

## Diario
- 15/11/2026 — Modulo completo: scavo, montaggio, magia, foto, album; audio con strumenti veri; test (`dinosauri.test.ts`).
- 15/11/2026 — Prova nel browser in formato telefono (partita vera con strofinio, trascinamento e tocchi; catture guardate una per una). Corretto: nei dinosauri senza osso "collo" il cranio montato restava staccato dal corpo (vertebre del collo più fitte); cassa del menu spostata accanto alla tenda. Scheda store nelle 6 lingue e script delle catture.
- 15/11/2026 — Segnalato da Gaetano: quando il dinosauro ruggisce o salta, la bocca restava ferma mentre il corpo si allungava. Ora corpo, bocca e palpebra si animano insieme dall'appoggio dei piedi, e durante il verso la bocca si apre e "mastica".
