# Gioco 11 — Cacchino (`cacchino`)

Branch `game/cacchino` · `order` 11 · non gratis (si apre con l'acquisto unico) · colore `#b9793c`

Brief scelto dalla chat del gioco (non era in `06-CHAT-DEI-GIOCHI.md`): cucciolo virtuale "prenditi cura", umorismo da bambini (puzzette), rompicapo di logica per completare le attività. Ambiente: casa a colori caldi, una stanza per colore. Musica: polka buffa da banda (tuba, trombone, fisarmonica, xilofono).

## Stato
**Approvato da Gaetano e unito a `main`** (18/11/2026). Test e build verdi; partita provata nel browser in formato telefono e tablet, e da Gaetano sulla pagina di prova.
- Nato come "Pupou", rinominato **Cacchino** prima dell'unione (vedi "Per la regia").
- **Esce al lancio con gli altri 10 giochi** (scelta di Gaetano del 18/11/2026): il controllo comune in `src/app.test.ts` passa da 10 a 11 giochi pubblicati; `comingSoon` resta vuoto.
- In locale: `?game=cacchino&unlock=1` oppure `#prova`.

## Cosa c'è nel gioco
- **Cacchino**: un cucciolo di cacchina a "giri" color caramello con il ricciolo in cima, occhioni, guance rosa, braccine e piedini. Respira, sbatte le palpebre, cambia faccia con l'umore (felice, tranquillo, triste), ha il ciuccio da cucciolo e la stellina sul ricciolo da re. Disegno originale (`swirl.ts`).
- **Cinque bisogni** in alto (anello verde/giallo/rosso): pappa, sete, pulizia, energia, allegria. Calano piano mentre si gioca; a gioco chiuso calano dieci volte più piano e mai sotto una soglia: Cacchino **non si ammala e non muore mai**, al massimo è triste, sporco e con le mosche intorno. Una nuvoletta sopra Cacchino mostra la cosa più urgente (toccandola si va nella stanza giusta) e dopo qualche secondo di attesa la manina indica dove toccare.
- **L'aria nel pancino**: ogni cibo la fa salire (fagioli, broccoli, formaggio e bibita frizzante moltissimo). **Toccando Cacchino parte la puzzetta**: piccola, media o gigante (nuvolette verdi, gialle e rosa, Cacchino decolla, lo schermo trema, gli amici saltano). Fa ridere (allegria su) ma sporca un pochino. Senza aria, il tocco è un solletico con risatina. A pancino strapieno la puzzetta gigante parte da sola.
- **Stanze** (pulsanti in basso; si tocca il mobile per fare l'attività):
  - **Cucina**: il *frigo* apre la dispensa (si trascina il cibo su Cacchino, o lo si tocca); i *fornelli* → rompicapo dei barattoli → due minestroni in dispensa.
  - **Bagno**: la *vasca* → rompicapo della spugna → poi si strofina Cacchino con la spugna (schiuma), doccia e scintille; il *vasino* → rompicapo delle puzzette → Cacchino ci salta sopra, si concentra e parte la fanfara con sciacquone.
  - **Cameretta**: il *lettino* → nanna (stanza al buio, Zzz, russata; l'energia si ricarica in mezzo minuto e si sveglia da solo, o con un tocco); l'*armadio* → 12 capi tra cappelli, occhiali e collo (fiocco, berretto, rotolo di carta igienica, cappello da cuoco, cappellino da festa, corona; occhiali tondi, da sole, a stella; bavaglino, papillon, medaglia).
  - **Parco** (dal livello 2): palla da far rimbalzare e tre amici — Rotolino (livello 2), Saponella (5), Sturino (8) — con cui giocare (rompicapo a rotazione): allegria e cuori d'amicizia (fino a 5).
  - **Scuola** (dal livello 3): la *lavagna* → lezione di sequenze logiche → tanta esperienza.
  - **Negozio**: 12 cibi e bevande da comprare con le monete, sbloccati con i livelli.
- **Quattro rompicapo di logica** ("stile Mossetta"), tutti **generati dal codice** con generatore a seme + risolutore (stesso livello su ogni telefono, sempre risolvibile, difficoltà che cresce a gradini con il numero di rompicapo risolti di quel tipo):
  - *Passa la spugna* (tratto unico): una sola linea su tutte le piastrelle sporche, da 3×2 a 6×4 con le paperelle come ostacoli.
  - *Riordina i barattoli* (ordina e incastra): da 2 a 5 ingredienti, barattoli da 3 o 4; la soluzione più corta è calcolata e scelta vicino alla difficoltà voluta.
  - *Fuori le puzzette!* (uscita a catena): ogni nuvoletta esce nella direzione della freccia se la strada è libera; da 3 a 17 nuvolette, catene sempre più lunghe.
  - *Cosa viene dopo?* (sequenze): tre domande a lezione, regole AB → ABCD, buco in fondo e poi in mezzo, 3 o 4 scelte.
  - Non si perde mai: mossa sbagliata = nota gentile; pulsante **lampadina** (la manina mostra la mossa giusta, gratis e senza limiti), pulsante **ricomincia**, freccia per tornare a casa. Dopo 7 secondi fermi l'aiutino arriva da solo; i primi due rompicapo di ogni tipo si aprono con la manina.
- **Crescita**: 30 livelli, 5 tappe (Cucciolo, Bimbo dal 4, Ragazzino dal 9, Grande dal 16, Re della Puzzetta dal 25): Cacchino diventa più grande e guadagna un giro (2 → 3 → 4). Ogni livello sblocca stanze, cibi, vestiti o amici.
- **Monete** ("tappi d'oro"): si guadagnano **solo** risolvendo rompicapo (8–20 a rompicapo) e si spendono in cibo e vestiti. Nessun acquisto, nessuna pubblicità dentro il gioco.
- **Salvataggi** in `Store('tappolino.cacchino')`: bisogni, aria, esperienza, monete, dispensa, armadio, rompicapo risolti, amicizie, istante dell'ultimo salvataggio.
- **Audio**: musica "La banda delle puzzette" (loop esatto di 48 s) e 30 effetti, generati da `scripts/audio/cacchino_music.py` e `cacchino_sfx.py`. Crediti in `app/src/games/cacchino/CREDITS.md` e `audio/CREDITS.md`.
- **Testi**: IT, EN, ES, FR, DE, PT (solo "Livello N" e i nomi delle tappe). Per giocare non serve leggere: solo icone e numeri.
- **Scheda store** nelle 6 lingue: `app/store/games/cacchino/`. Catture: `python scripts/store-screenshots.py --groups cacchino`.

## Cosa provare sul telefono
1. Primo avvio: la manina sul frigo, poi sul cibo. Un bambino capisce da solo come dare da mangiare? (trascinare o toccare)
2. Dare i fagioli e toccare Cacchino: le puzzette fanno ridere? Volume e durata giusti? Quella gigante (pancino al massimo) non deve essere fastidiosa.
3. I quattro rompicapo: difficoltà dei primi 5 di ogni tipo per l'età dei bambini che provano; la lampadina è abbastanza chiara?
4. *Passa la spugna*: il dito segue bene le caselle anche in diagonale veloce; tornare indietro di una casella.
5. Bagnetto dopo il rompicapo: strofinare con il dito finché la pulizia arriva al massimo (deve durare 4–6 secondi).
6. Nanna: chiudere il gioco mentre dorme e riaprirlo dopo qualche minuto.
7. Chiudere il gioco per un'ora e riaprirlo: i bisogni devono essere calati poco.
8. Fluidità con le nuvolette della puzzetta gigante su un telefono economico.
9. Schermo stretto (tablet 4:3): bisogni in alto e stanze in basso non si sovrappongono a casa e mute.

## Per la regia
- **File comune toccato, uno solo**: `src/app.test.ts` (giochi pubblicati al lancio: da 10 a 11), su scelta di Gaetano. Da riportare in regia: la decisione 27 parla di 10 giochi al lancio e va aggiornata a 11; scheda store dell'app, tabella di `03-ROADMAP.md` e `README.md` vanno allineati.
- **Nome**: il gioco è nato come "Pupou"; Gaetano lo ha rinominato **Cacchino** il 18/11/2026 perché sugli store esiste dal 2012 *Pou* (Zakeh Limited), cucciolo virtuale dello stesso genere con un nome troppo simile. Rinominati anche `id`, cartelle, chiave dei salvataggi (`tappolino.cacchino`) e script. Da una ricerca web non risultano giochi chiamati Cacchino; non è una verifica di marchio (da fare prima di un'eventuale app singola).
- **Scostamenti dalle regole comuni dei giochi 3–10**, voluti dal tipo di gioco: non è un gioco da 1–2 minuti con un solo gesto, e i rompicapo più avanti sono per bambini di 6–10 anni (i primi vanno bene dai 4–5). Niente scena "Menu": si entra direttamente in casa.
- **Monete di gioco**: la decisione 2 dice "nessuna valuta virtuale". Qui le monete non si comprano mai (si guadagnano solo giocando), quindi non c'è nulla da dichiarare agli store come acquisto; lo segnalo perché la regia confermi.
- **Candidato naturale per la prima app singola** (decisione 4): i cuccioli virtuali sono un genere molto cercato e questo gioco ha la durata giusta per stare da solo.
- Usati dal codice comune senza modifiche: `core/drag` (`DragManager`, `Hint`), `core/ui`, `core/hud`, `core/sound`, `core/art`, `core/storage`, `core/brand`. Nessun altro file comune toccato.
- Riusabili da altri giochi, restano nel modulo finché non servono: generatore casuale con seme (`rng.ts`) e i quattro rompicapo con risolutore (`puzzles/`): sono senza Phaser e potrebbero servire anche alla linea Mossetta come prototipi.
- Con `?debug=1`: `window.__pp` (casa) e `window.__pz` (rompicapo, con `autoStep()` che fa una mossa giusta).

## Idee per gli aggiornamenti (non fatte)
- Altre attività: lavarsi i denti, pettinare il ricciolo, annaffiare una piantina, fare la spesa come mini-gioco.
- Altri amici e una "gara di puzzette" al parco; visite degli amici in casa.
- Sfondi e mobili da comprare per le stanze; album delle tappe di crescita.
- Promemoria gentile (notifica locale) quando Cacchino ha fame: da valutare con le regole per le app dei bambini.

## Diario
- 18/11/2026 — Modulo completo: logica (bisogni, aria, crescita, monete, dispensa, armadio, amici), quattro rompicapo con generatore e risolutore, casa con cinque stanze, negozio, armadio, scena dei rompicapo, grafica SVG, musica e 30 effetti, 6 lingue, test (`cacchino.test.ts`, 18 casi, con 400 livelli generati e risolti per tipo). Prova nel browser in formato telefono e tablet. Corretto durante la prova: pannello delle sequenze fuori posto, pulsanti aiutino e ricomincia sotto il pulsante di schermo intero, Cacchino nascosto dietro il vasino, nanna in piedi sul tappeto (ora sul lettino), palla sovrapposta a Cacchino. Scheda store e script delle catture.
- 18/11/2026 — Ok di Gaetano dopo la prova. Rinominato da Pupou a Cacchino (titolo, `id`, cartelle, salvataggi, script, scheda store). Esce al lancio: controllo comune portato a 11 giochi. Unito a `main` in un solo commit.
