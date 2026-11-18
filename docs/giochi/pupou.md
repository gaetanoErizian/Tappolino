# Gioco 11 — Pupou (`pupou`)

Branch `game/pupou` · `order` 11 · non gratis (si apre con l'acquisto unico) · colore `#b9793c`

Brief scelto dalla chat del gioco (non era in `06-CHAT-DEI-GIOCHI.md`): cucciolo virtuale "prenditi cura", umorismo da bambini (puzzette), rompicapo di logica per completare le attività. Ambiente: casa a colori caldi, una stanza per colore. Musica: polka buffa da banda (tuba, trombone, fisarmonica, xilofono).

## Stato
**Gioco completo in attesa della prova di Gaetano** (18/11/2026). Test del gioco e build verdi; partita provata nel browser in formato telefono e tablet, catture guardate una per una.
- Il lavoro è in un commit locale sul branch `game/pupou`: **il push non è stato possibile** (permesso di scrittura sul repository negato nella sessione). Vedi "Per la regia".
- `npm test`: 1 test **comune** fallisce per scelta di progetto, non per un errore: `src/app.test.ts` si aspetta che al lancio i giochi pubblicati siano esattamente 10. Vedi "Per la regia".

## Cosa c'è nel gioco
- **Pupou**: un cucciolo di cacchina a "giri" color caramello con il ricciolo in cima, occhioni, guance rosa, braccine e piedini. Respira, sbatte le palpebre, cambia faccia con l'umore (felice, tranquillo, triste), ha il ciuccio da cucciolo e la stellina sul ricciolo da re. Disegno originale (`swirl.ts`).
- **Cinque bisogni** in alto (anello verde/giallo/rosso): pappa, sete, pulizia, energia, allegria. Calano piano mentre si gioca; a gioco chiuso calano dieci volte più piano e mai sotto una soglia: Pupou **non si ammala e non muore mai**, al massimo è triste, sporco e con le mosche intorno. Una nuvoletta sopra Pupou mostra la cosa più urgente (toccandola si va nella stanza giusta) e dopo qualche secondo di attesa la manina indica dove toccare.
- **L'aria nel pancino**: ogni cibo la fa salire (fagioli, broccoli, formaggio e bibita frizzante moltissimo). **Toccando Pupou parte la puzzetta**: piccola, media o gigante (nuvolette verdi, gialle e rosa, Pupou decolla, lo schermo trema, gli amici saltano). Fa ridere (allegria su) ma sporca un pochino. Senza aria, il tocco è un solletico con risatina. A pancino strapieno la puzzetta gigante parte da sola.
- **Stanze** (pulsanti in basso; si tocca il mobile per fare l'attività):
  - **Cucina**: il *frigo* apre la dispensa (si trascina il cibo su Pupou, o lo si tocca); i *fornelli* → rompicapo dei barattoli → due minestroni in dispensa.
  - **Bagno**: la *vasca* → rompicapo della spugna → poi si strofina Pupou con la spugna (schiuma), doccia e scintille; il *vasino* → rompicapo delle puzzette → Pupou ci salta sopra, si concentra e parte la fanfara con sciacquone.
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
- **Crescita**: 30 livelli, 5 tappe (Cucciolo, Bimbo dal 4, Ragazzino dal 9, Grande dal 16, Re della Puzzetta dal 25): Pupou diventa più grande e guadagna un giro (2 → 3 → 4). Ogni livello sblocca stanze, cibi, vestiti o amici.
- **Monete** ("tappi d'oro"): si guadagnano **solo** risolvendo rompicapo (8–20 a rompicapo) e si spendono in cibo e vestiti. Nessun acquisto, nessuna pubblicità dentro il gioco.
- **Salvataggi** in `Store('tappolino.pupou')`: bisogni, aria, esperienza, monete, dispensa, armadio, rompicapo risolti, amicizie, istante dell'ultimo salvataggio.
- **Audio**: musica "La banda delle puzzette" (loop esatto di 48 s) e 30 effetti, generati da `scripts/audio/pupou_music.py` e `pupou_sfx.py`. Crediti in `app/src/games/pupou/CREDITS.md` e `audio/CREDITS.md`.
- **Testi**: IT, EN, ES, FR, DE, PT (solo "Livello N" e i nomi delle tappe). Per giocare non serve leggere: solo icone e numeri.
- **Scheda store** nelle 6 lingue: `app/store/games/pupou/`. Catture: `python scripts/store-screenshots.py --groups pupou`.

## Cosa provare sul telefono
1. Primo avvio: la manina sul frigo, poi sul cibo. Un bambino capisce da solo come dare da mangiare? (trascinare o toccare)
2. Dare i fagioli e toccare Pupou: le puzzette fanno ridere? Volume e durata giusti? Quella gigante (pancino al massimo) non deve essere fastidiosa.
3. I quattro rompicapo: difficoltà dei primi 5 di ogni tipo per l'età dei bambini che provano; la lampadina è abbastanza chiara?
4. *Passa la spugna*: il dito segue bene le caselle anche in diagonale veloce; tornare indietro di una casella.
5. Bagnetto dopo il rompicapo: strofinare con il dito finché la pulizia arriva al massimo (deve durare 4–6 secondi).
6. Nanna: chiudere il gioco mentre dorme e riaprirlo dopo qualche minuto.
7. Chiudere il gioco per un'ora e riaprirlo: i bisogni devono essere calati poco.
8. Fluidità con le nuvolette della puzzetta gigante su un telefono economico.
9. Schermo stretto (tablet 4:3): bisogni in alto e stanze in basso non si sovrappongono a casa e mute.

## Per la regia
- **Push non riuscito**: nella sessione il collegamento del repository con permesso di scrittura è stato negato. Il lavoro è completo in locale (commit sul branch `game/pupou`) e consegnato anche come file patch. Serve ridare il permesso per fare push e, dopo l'ok, l'unione a `main`.
- **Test comune da decidere** (`src/app.test.ts`, "al lancio sono pubblicati tutti e 10"): con Pupou i giochi sono 11. Due strade: (a) Pupou esce al lancio → il test passa a 11; (b) Pupou arriva con un aggiornamento → aggiungere `'pupou'` a `comingSoon` in `src/config.ts` (su iPhone resta nascosto, decisione 26). Non ho toccato né il test né la configurazione.
- **Nome**: sugli store esiste dal 2012 *Pou* (Zakeh Limited), cucciolo virtuale con oltre cento milioni di download: stesso genere, nome molto simile ("Pu-pou"), e il suo personaggio è una creatura marrone. Il disegno di Pupou è diverso (cacchina a giri con ricciolo, non un triangolo liscio), ma **il nome è a rischio** di contestazione o di rifiuto per somiglianza, soprattutto come app singola. Da decidere prima della pubblicazione; alternative pronte: *Puzzolino*, *Pupù*, *Cacchino*. Cambiarlo costa pochi minuti (titoli in `entry.ts`, scheda store).
- **Scostamenti dalle regole comuni dei giochi 3–10**, voluti dal tipo di gioco: non è un gioco da 1–2 minuti con un solo gesto, e i rompicapo più avanti sono per bambini di 6–10 anni (i primi vanno bene dai 4–5). Niente scena "Menu": si entra direttamente in casa.
- **Monete di gioco**: la decisione 2 dice "nessuna valuta virtuale". Qui le monete non si comprano mai (si guadagnano solo giocando), quindi non c'è nulla da dichiarare agli store come acquisto; lo segnalo perché la regia confermi.
- **Candidato naturale per la prima app singola** (decisione 4): i cuccioli virtuali sono un genere molto cercato e questo gioco ha la durata giusta per stare da solo.
- Usati dal codice comune senza modifiche: `core/drag` (`DragManager`, `Hint`), `core/ui`, `core/hud`, `core/sound`, `core/art`, `core/storage`, `core/brand`. Nessun file comune toccato.
- Riusabili da altri giochi, restano nel modulo finché non servono: generatore casuale con seme (`rng.ts`) e i quattro rompicapo con risolutore (`puzzles/`): sono senza Phaser e potrebbero servire anche alla linea Mossetta come prototipi.
- Con `?debug=1`: `window.__pp` (casa) e `window.__pz` (rompicapo, con `autoStep()` che fa una mossa giusta).

## Idee per gli aggiornamenti (non fatte)
- Altre attività: lavarsi i denti, pettinare il ricciolo, annaffiare una piantina, fare la spesa come mini-gioco.
- Altri amici e una "gara di puzzette" al parco; visite degli amici in casa.
- Sfondi e mobili da comprare per le stanze; album delle tappe di crescita.
- Promemoria gentile (notifica locale) quando Pupou ha fame: da valutare con le regole per le app dei bambini.

## Diario
- 18/11/2026 — Modulo completo: logica (bisogni, aria, crescita, monete, dispensa, armadio, amici), quattro rompicapo con generatore e risolutore, casa con cinque stanze, negozio, armadio, scena dei rompicapo, grafica SVG, musica e 30 effetti, 6 lingue, test (`pupou.test.ts`, 18 casi, con 400 livelli generati e risolti per tipo). Prova nel browser in formato telefono e tablet. Corretto durante la prova: pannello delle sequenze fuori posto, pulsanti aiutino e ricomincia sotto il pulsante di schermo intero, Pupou nascosto dietro il vasino, nanna in piedi sul tappeto (ora sul lettino), palla sovrapposta a Pupou. Scheda store e script delle catture.
