# Gioco 9 — Treno degli Animali (`treno`)

Branch `game/treno-degli-animali` · `order` 9 · non gratis (si apre con l'acquisto unico) · colore `#e2574c`

## Stato
**Approvato da Gaetano e unito a `main`** (15/11/2026). Test e build web verdi, partita provata nel browser in formato telefono e iPad.
Pagina di prova ufficiale di `main` (decisione 21): https://claude.ai/artifact/AFdW7dCQxKDUYkfdacnoz5 — il gioco è l'ultima tessera della seconda pagina del menu ed è bloccato come nell'app vera: si apre aggiungendo `#prova` all'indirizzo (modalità prova, decisione 25). In locale: `?game=treno&unlock=1` oppure `#prova`.

## Cosa c'è nel gioco
- **Menu**: la stazioncina di campagna (legno dipinto di rosso, tetto di legno, orologio, cassette di fiori), colline nella foschia, staccionata, lampioni e cartello con lo stemma della prossima destinazione. Sul binario la locomotiva rossa con due vagoni e due passeggeri; sul marciapiede un animale che aspetta. Pulsanti: gioca, album delle stazioni, casa. Toccando la locomotiva fischia, toccando gli animali salutano.
- **Viaggio** (gesto: trascinare; ogni animale funziona anche con **un tocco**, e allora vola da solo nel vagone giusto):
  - il treno arriva sbuffando e si ferma (campanella); gli animali aspettano già sul marciapiede, ognuno con il **biglietto** appeso al collo;
  - **colori**: vagoni rosso, giallo, blu, verde o viola, con la pallina del colore sulla targa; il biglietto è dello stesso colore;
  - **forme**: vagoni rossi con cerchio, quadrato, triangolo, stella o cuore sulla targa; il biglietto crema ha la stessa forma (tutte le forme dello stesso blu, così si riconoscono dalla forma e non dal colore);
  - **numeri fino a 5**: niente biglietti; ogni vagone ha un numero sulla targa e tanti schienali quanti posti; a ogni animale che sale compare il numero grande (1, 2, 3…) con una nota che sale;
  - animale lasciato sul vagone sbagliato (o già pieno): il vagone fa "no" spostandosi un poco, nota gentile dell'armonica, l'animale torna al suo posto. Nessun errore, nessun "hai perso". Lasciato lontano dal treno: torna al suo posto con un rimbalzo;
  - vagone pieno: la targa si illumina e piovono stelline; tutti a bordo: campanella, fischio (doppio, con lo sbuffo) e il treno parte.
- **Il viaggio**: il treno corre nella campagna (colline, alberi, pali del telegrafo, staccionata, girasoli e cespugli che scorrono a velocità diverse), le ruote girano, gli animali dondolano a tempo con le rotaie, ciuf-ciuf a ogni sbuffo. Circa 4,5 secondi.
- **Arrivo**: la stazione degli animali (Fattoria con fienile, silo, pagliaio e girasoli; Giungla con palme, cespugli e foglie che cadono; Polo con igloo, abeti innevati, iceberg, aurora e neve). Il treno entra e si ferma, gli animali scendono uno alla volta e **si contano** (1, 2, 3…), poi festa con coriandoli e versi. La prima volta: "Nuova stazione!" con lo stemma che vola verso l'album. Pulsanti: viaggio successivo, album, casa.
- **Collezione — l'album delle stazioni**: la linea del treno con Fattoria, Giungla e Polo; sotto ogni stazione i suoi 5 animali (a colori quelli già portati a casa, ombre con il "?" gli altri); stazioni mai raggiunte con il lucchetto. Toccando un animale salta, fa il verso e mostra il nome. 15 animali tondi e buffi: mucca, maialino, pecorella, gallina, cavallino · scimmietta, elefantino, giraffa, leoncino, pappagallo · pinguino, orso polare, foca, tricheco, pulcinella di mare.
- **Progressione gentile**: i primi sei viaggi insegnano un'idea alla volta (colori con 2 vagoni, forme con 2, numeri con un vagone da 3, colori con 3, forme con 3, numeri 2+3); poi colori, forme e numeri a turno, con 3–5 animali e al massimo 3 vagoni. La linea si allunga in ordine: si va alla Fattoria finché tutti e 5 i suoi animali sono a casa, poi alla Giungla, poi al Polo; viaggiano prima gli animali mai portati a casa. A collezione completa, stazioni a caso (mai la stessa due volte di fila). Completare tutto richiede 6–7 viaggi.
- **Manina**: al primo viaggio subito, poi dopo 5 secondi senza fare niente o dopo due tentativi sul vagone sbagliato (mostra il trascinamento verso il posto giusto).
- **Partita**: un viaggio dura circa un minuto (stazione, viaggio, arrivo). Salvataggi in `Store('tappolino.treno')`: viaggi fatti, animali portati a casa, ultima stazione, tutorial visto (ripuliti al caricamento).
- **Audio**: musica "Si parte!" (banjo con arpeggi "a rullo" e un assolo, armonica, contrabbasso pizzicato, spazzole sul rullante che imitano le rotaie; Re maggiore, 120 bpm, loop esatto di 64 s, −18 LUFS come gli altri giochi) e 31 effetti con strumenti veri: fischio del treno (fischietti e ocarina in glissando), campanella (campane tubolari), conteggio (marimba), partenza e festa (banjo, armonica, contrabbasso, spazzole) e i versi dei 15 animali fatti con i fiati in glissando (la mucca con la tuba, l'elefantino con il trombone, la pecorella con l'oboe…). Sbuffo di vapore e sfiato del freno con sintesi offline. Generati da `scripts/audio/treno_music.py` e `treno_sfx.py`; crediti in `app/src/games/treno/CREDITS.md` e `audio/CREDITS.md`.
- **Testi**: IT, EN, ES, FR, DE, PT (titolo, album, stazioni, nomi degli animali). Per giocare non serve leggere: numeri in cifre.
- **Scheda store** nelle 6 lingue: `app/store/games/treno/` (limiti dei caratteri verificati, pt-BR con le varianti pt-PT in nota). Catture: `python scripts/store-screenshots.py --groups treno` (menu, colori, a bordo, forme, numeri, viaggio, arrivo al polo, album).

## Cosa provare sul telefono
1. Primo viaggio: la manina deve far capire subito che l'animale si porta nel vagone del suo colore. Provare anche solo con **tocchi** sugli animali (i più piccoli non trascinano).
2. Trascinare un animale sul vagone sbagliato e poi lasciarne uno lontano dal treno: deve tornare al suo posto senza bloccare niente.
3. Viaggio con 5 animali e 3 vagoni: i bersagli restano comodi per le dita? (gli animali sono a 330 unità l'uno dall'altro; il rilascio vale su tutto il vagone e un bel tratto sopra).
4. Leggibilità dei biglietti: forme e colori si distinguono bene a quella dimensione?
5. Volume del fischio e dei versi rispetto alla musica; il ritmo delle spazzole deve sembrare il treno sulle rotaie.
6. Fluidità del viaggio (paesaggio a 5 piani che scorre) e dell'arrivo al Polo (neve) su un telefono economico.
7. Uscire con la casetta a metà viaggio: chi era già a bordo non conta; a viaggio arrivato gli animali restano nell'album.

## Per la regia
- Usati dal codice comune senza modifiche: `core/drag` (`DragManager` con raggio 175, `Hint.drag`), `core/ui`, `core/hud`, `core/sound`, `core/art`, `core/storage`. **Nessun file comune toccato.**
- **Nota tecnica (Phaser 4)**: anche immagini piccole come le ruote (100 px) ruotate dentro un Container mostravano i "triangoli tagliati" già noti. Le ruote quindi non ruotano: tre fotogrammi con i raggi spostati di 15° si alternano in base alla strada fatta (`TrainView.spin` in `world.ts`, `WHEEL_FRAMES` in `art.ts`). Se altri giochi hanno ruote o eliche, è un candidato per `core/`.
- I paesaggi lontani (`tr_far_*`, `tr_hills*`, 2400 unità di larghezza) sono texture a metà risoluzione mostrate con scala 2, per risparmiare memoria sui telefoni economici; il test controlla che nessuna texture del gioco superi 1200×600 pixel.
- `?game=treno` sul web di prova richiede `&unlock=1` (gioco non gratis): lo script delle catture lo aggiunge da sé.
- Il parametro `{ dest, kind, groups }` della scena `treno:Station` serve solo a test e catture (sceglie stazione, tipo di viaggio e animali per vagone).

## Diario
- 15/11/2026 — Modulo completo: menu, stazioncina con viaggi di colori, forme e numeri, viaggio, arrivo con conteggio e festa, album delle stazioni con 15 animali; audio con strumenti veri; test (`treno.test.ts`, 24 casi). 184 test dell'app e build verdi.
- 15/11/2026 — Prova nel browser in formato telefono (844×390) e iPad, con trascinamenti veri, vagone sbagliato, tocchi, manina, tutti e tre i tipi di viaggio, le tre stazioni e l'album; catture guardate una per una. Corretto: ruote ruotate con i triangoli tagliati (ora a fotogrammi); animali seduti troppo piccoli e affondati nel vagone; nome della stazione sopra il treno nell'arrivo; album con le colonne troppo vicine e i nomi sovrapposti; pulcinella di mare che da piccola sembrava un secondo pinguino; prato vuoto durante il viaggio. Nessun errore in console.
- 15/11/2026 — Scheda store nelle 6 lingue e script delle catture (provato). Pagina di prova del branch pubblicata (`npx vite build --mode artifact`): https://claude.ai/artifact/4kFkjw1Ne4qzmhshahk5Ze. In attesa dell'ok di Gaetano per l'unione a `main`.
- 15/11/2026 — Ok di Gaetano: merge di `main` (arrivati il Giardino delle Fate e i documenti della regia), 200 test e build verdi, menu con tutti e 8 i giochi; unito a `main` in un solo commit e pagina ufficiale di `main` ripubblicata.
