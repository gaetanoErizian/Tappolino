# Gioco 4 — Salone degli Unicorni (`unicorni`)

Branch `game/salone-degli-unicorni` · `order` 4 · a pagamento (compreso nello sblocco unico) · colore `#b58cf0`

## Stato
**Pronto per la prova di Gaetano** (15/11/2026). Test e build web verdi, partita vera provata nel browser in formato telefono (strofinio con il mouse, tocchi su barattoli e accessori, foto, album), catture guardate una per una.
Pagina di prova del branch (provvisoria, decisione 21): https://claude.ai/artifact/JpZ9uo7z17RiHYshCJM5Ar — il gioco è la quarta tessera del menu; essendo a pagamento si apre aggiungendo `#unlock` all'indirizzo (simula l'acquisto), altrimenti compare il blocco per i genitori. In locale: `?game=unicorni&unlock=1` (il gioco è bloccato senza l'acquisto).

## Cosa c'è nel gioco
- **Menu**: salone tra le nuvole (cielo lilla e rosa, arcobaleno nella foschia, tende turchesi, specchio con le lucine, lampade a stella, pavimento di nuvole). Pulsante gioca e pulsante album. Sulla pedana c'è l'ultimo unicorno fotografato, con il suo look; se lo tocchi salta e fa un nitrito magico.
- **Una visita** (≈1 minuto, gesto principale: strofinare; tocchi per scegliere). L'unicorno arriva trotterellando, sporco di fango e con la criniera arruffata. In alto 5 bollicine mostrano le tappe; a ogni tappa finita compare una stellina, l'unicorno chiude gli occhi felice e salta.
  1. **Schiuma** — si strofina l'unicorno: la spugna segue il dito, il fango sparisce e al suo posto resta la schiuma (bollicine che volano, "squish").
  2. **Risciacquo** — la doccetta segue il dito dall'alto, le gocce cadono e portano via la schiuma; alla fine l'unicorno si scrolla e il manto brilla.
  3. **Spazzola** — si strofina la criniera (collo, ciuffo, coda): da arruffata diventa morbida, ondulata e lucida.
  4. **Colore** — si tocca un barattolo e si strofina la criniera con il pennello magico: il colore nuovo compare sotto il dito. Se il bambino strofina senza scegliere, il pennello prende un colore a sorpresa. Finita la tappa, un tocco su un altro barattolo cambia colore per magia; la freccia verde porta avanti.
  5. **Accessori** — un tocco su un accessorio e vola al suo posto: fiocco, coroncina e fiore in testa (uno alla volta), collana, occhiali a cuore, ali, e fino a 6 adesivi sul manto (stelline e cuoricini). Dopo il primo accessorio compare la macchina fotografica.
- **Foto ricordo**: davanti a un grande arcobaleno, clic con il lampo, "Che splendore!", coriandoli; la polaroid si sviluppa e vola nell'album. Poi la sorpresa sbloccata, pulsante album e freccia per un nuovo unicorno.
- **Collezione**: 6 unicorni (Perla, Rosa, Cielo, Pesca, Lavanda e Notte con il manto stellato), 6 colori (rosa, turchese, lilla; poi oro, menta e arcobaleno) e 8 accessori (fiocco, stelline, cuoricini; poi coroncina, collana, fiore, occhiali, ali). Ogni foto sblocca una cosa nuova (13 sorprese, tutto sbloccato alla 13ª foto). Il nuovo unicorno arriva alla visita dopo; poi gli unicorni si alternano, mai lo stesso due volte di fila.
- **Album**: le ultime 6 foto, ognuna con l'unicorno esattamente come l'ha sistemato il bambino (si toccano per farli saltare), e in basso la fila dei 6 unicorni (quelli ancora da scoprire sono sagome con il punto di domanda).
- **Aiuto**: manina subito alla prima visita (cerchi sul manto e sulla criniera, tocco sul barattolo, sull'accessorio, sulla freccia, sulla macchina fotografica), poi dopo 5 secondi senza azioni. Nessun testo da leggere per giocare, nessun "hai perso".
- **Salvataggi** in `Store('tappolino.unicorni')`: foto fatte (decidono gli sblocchi), album, unicorni già pettinati, ultimo unicorno, manina vista. Uscendo a metà visita si riparte dallo stesso unicorno.
- **Audio**: musica "Nuvole di zucchero" (pop sognante in Fa maggiore: arpa, celesta, flauto, basso fretless morbido, velo d'archi e batteria pop leggerissima; loop esatto di 60 s) e 16 effetti (nitrito magico con flauto in glissando, spugna, bollicine, doccetta, scrollata, spazzola, scintille, pennello, magia del colore, accessorio che sale di tono a ogni pezzo, lampo della macchina fotografica, festa). Script in `app/scripts/audio/unicorni_*.py`, crediti in `app/src/games/unicorni/CREDITS.md` e `audio/CREDITS.md`. Peso: ~1,8 MB.
- **Testi**: IT, EN, ES, FR, DE, PT (titolo, "Che splendore!", nuovo unicorno/accessorio/colore, album).
- **Scheda store** nelle 6 lingue: `app/store/games/unicorni/` (limiti dei caratteri verificati). Catture: `python scripts/store-screenshots.py --groups unicorni` (8 schermate; il gioco viene aperto con `unlock=1`).
- **Test**: `unicorni.test.ts` (27 test: voce di menu, sblocchi, arrivo degli unicorni, tappe, griglia e maschera dello strofinare, regole degli accessori, album e salvataggi, texture, audio, traduzioni). Con `?debug=1` la scena è in `window.__un`: `autoStep()` esegue la tappa corrente, `rubTo(quota, x, y)` strofina da codice.

## Cosa provare sul telefono
1. Fluidità mentre si strofina, su un telefono economico: l'unicorno è fatto di strati grandi (manto, criniera, riflessi) e mentre si lava ci sono due strati da strofinare insieme (fango sotto, schiuma sopra). È il punto più pesante del gioco.
2. Durata delle tappe: oggi ogni tappa finisce quando è strofinata circa metà della superficie (`RUB_GOAL` in `salon.ts`: 50% schiuma e risciacquo, 55% spazzola, 50% colore). Se sono troppo lunghe o troppo corte per un bambino di 3 anni si regolano lì.
3. Colore senza toccare il barattolo: strofinando subito la criniera deve partire un colore a sorpresa, senza dover alzare il dito.
4. Accessori con tocchi veloci uno dopo l'altro: ognuno deve finire al suo posto (in testa ne resta uno solo, gli adesivi al massimo 6).
5. Volume del nitrito e della doccetta rispetto alla musica.
6. Telefoni molto allungati (20:9) e con il banner: vassoi e pulsanti non devono finire sotto il banner.

## Per la regia
- **Gesto dello strofinare** in `app/src/games/unicorni/scratch.ts`, da unificare con `games/dinosauri/scratch.ts` (decisione 23). Stessa interfaccia del gioco 3 (`ScratchGrid`, `ScratchLayer`, `fractionIn`, `eraseAt`, `clearAll`) più quello che è servito al salone, tutto facoltativo:
  - `mask` (celle del bersaglio) e `maskFromAlpha` / `maskFromTexture`: la quota strofinata si misura sulla sagoma (unicorno, criniera), non sul rettangolo;
  - `parent`: lo strato vive dentro un Container e segue il personaggio (respiro, saltelli), coordinate locali;
  - `mode: 'paint'` con `brush`: il dito aggiunge un timbro (la schiuma) invece di cancellare; `rt` per riusare lo strato (il risciacquo cancella la schiuma);
  - `coverTint`, `index` (posizione nel Container), `begin(pointer)` (lo strato nasce mentre il dito è già giù), `dispose()` (sfuma e libera la RenderTexture), `toScene()`/`toLayer()`.
  - Differenze da tenere come opzioni nell'unificazione: il gioco 3 ha un pennello dal bordo irregolare ("terra smossa") e lo strato d'ombra dei bordi dello scavo; il gioco 4 un pennello tondo e morbido e niente ombra.
- `app/CREDITS.md` va aggiornato con i crediti audio del gioco 4 (`app/src/games/unicorni/audio/CREDITS.md`): non l'ho toccato (file comune).
- Codice comune usato senza modifiche: `core/ui`, `core/hud`, `core/drag` (`Hint`: tocco e cerchio), `core/sound`, `core/art`, `core/storage`, `core/textures`.
- Nota per le pagine di test automatiche: con Playwright, `page.evaluate("...scene.start(...)")` si blocca perché prova a restituire l'oggetto della scena: aggiungere `; null` (come già fa `store-screenshots.py`).

## Diario
- 15/11/2026 — Modulo completo: 5 tappe (schiuma, risciacquo, spazzola, colore, accessori), foto ricordo, album, 13 sorprese; grafica a strati in SVG; audio con strumenti veri; test.
- 15/11/2026 — Pagina di prova del branch pubblicata: https://claude.ai/artifact/JpZ9uo7z17RiHYshCJM5Ar. In attesa dell'ok di Gaetano per l'unione a `main`.
- 15/11/2026 — Prova nel browser in formato telefono con partita vera. Corretti: criniera arcobaleno che usciva tutta rosa (gradiente ruotato insieme a ogni ciocca), riflessi della criniera visibili sopra quella arruffata, nodi della criniera che sembravano lettere, macchie di fango che sembravano sassi, adesivi che finivano sulla coda o sotto il ciondolo della collana, barattoli troppo piccoli, salto ripetuto che lasciava l'unicorno sospeso. Scheda store nelle 6 lingue e script delle catture.
