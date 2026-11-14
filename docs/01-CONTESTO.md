# 01 — Contesto e regole del progetto "Videogiochi"

> **Per Claude, a inizio di ogni chat:** leggi `00-DECISIONI.md` e `05-STRATEGIA-E-ROADMAP.md`, poi questo file, `02-SETUP-E-PIPELINE.md` e `03-ROADMAP.md`. Prendi il primo gioco con stato "Da fare", sviluppalo come modulo dell'app Tappolino seguendo le fasi, e a fine lavoro aggiorna stato e registro in `03-ROADMAP.md`. Una chat = un gioco.

## Visione
Giochi semplici e molto coinvolgenti per bambini (3–7 anni), senza la pubblicità invasiva che rende ingiocabili i giochi gratuiti attuali. Il genitore deve potersi fidare: niente video, niente interstitial, niente trucchi.

## Regole non negoziabili
1. **Pubblicità**: solo un banner fisso nel footer, mai sopra l'area di gioco. Vietati: video, interstitial, rewarded, pop-up, annunci a tutto schermo, annunci bloccanti.
2. **Acquisto unico**: non consumabile, sblocca tutti i giochi e toglie la pubblicità per sempre (prezzi in `00-DECISIONI.md`). Con "Ripristina acquisti". Nessun altro acquisto in-app, nessuna valuta virtuale, nessun abbonamento.
3. **Parental gate**: acquisto, link esterni e area genitori stanno dietro un blocco per adulti (es. "tieni premuto 3 secondi e risolvi 7 + 5").
4. **Privacy**: nessuna raccolta di dati personali, nessun account, nessuna analytics di terze parti, nessuna chat o funzione social. Il gioco funziona offline.
5. **Lingue**: IT, EN, ES, FR, DE, PT al lancio. Testo ridotto al minimo: icone, animazioni e voce/suoni guidano il bambino. Tutte le stringhe in file di traduzione, mai nel codice.
6. **Contenuti**: nessuna violenza, nessuna paura, nessun "game over" punitivo. Si può sbagliare senza perdere.

## Principi di game design (bambini 3–7 anni)
- **Si gioca entro 3 secondi** dall'apertura: un solo grande pulsante "Gioca".
- **Un solo gesto per gioco** (tocco, trascinamento o tenere premuto). Niente gesti multipli, niente doppio tocco.
- **Bersagli grandi**: almeno 64 dp, con tolleranza generosa.
- **Feedback immediato a ogni tocco**: suono + animazione + particelle. È questo che rende il gioco coinvolgente.
- **Sessioni brevi**: un livello dura 1–2 minuti; ricompensa visibile alla fine (stelle, adesivi, collezione).
- **Progressione gentile**: la difficoltà cresce piano; dopo 2 errori il gioco aiuta (suggerimento animato).
- **Collezionabili** per far tornare il bambino: album di adesivi/personaggi sbloccati giocando, mai comprando.
- **Niente lettura obbligatoria**: tutorial fatto con una manina animata.
- **Orientamento**: scelto per gioco (di norma orizzontale) e bloccato.
- **Audio**: musica allegra a volume basso + effetti; pulsante muto sempre visibile.

## Vincoli degli store (verificati a novembre 2026 — ricontrollare prima di ogni pubblicazione)
- **Google Play — Families Policy**: un'app per bambini che mostra annunci deve usare solo SDK pubblicitari "Families Self-Certified". AdMob lo consente con il tag *child-directed treatment* e annunci non personalizzati, classificazione contenuti massima "G".
- **Google Play — account personali nuovi** (creati dopo il 13/11/2023): prima della produzione serve un test chiuso con almeno 12 tester iscritti per 14 giorni consecutivi. Un account "organizzazione" è esente.
- **Apple — Kids Category (linea guida 1.3)**: le app per bambini di norma **non possono includere pubblicità o analytics di terze parti**; acquisti e link esterni solo dietro parental gate. Esiste un'eccezione stretta per pubblicità contestuale con revisione umana delle creatività.
- **Conseguenza per noi** (dettagli in `00-DECISIONI.md`, punti 2 e 3):
  - **Android**: banner AdMob nel footer, child-directed, non personalizzato, finché non si acquista.
  - **iOS**: nessun SDK pubblicitario di terzi e nessun banner; i giochi bloccati si sbloccano con l'acquisto unico, dietro parental gate.
- **Norme**: COPPA (USA) e GDPR per minori (UE). Servono una privacy policy pubblica (URL) e la compilazione di Data Safety (Google) e Privacy Nutrition Label (Apple): dichiarare "nessun dato raccolto" dall'app; su Android dichiarare ciò che usa l'SDK AdMob.

## Identità
- Nome sviluppatore/brand: **Tappolino** (vedi `00-DECISIONI.md`).
- Stile grafico comune: "2.5D" con volumi, luci, ombre e piani in parallasse, movimento in 2D (dettagli al punto 8 di `00-DECISIONI.md`). Forme arrotondate, colori vivaci, grafica originale (nessun personaggio o marchio di terzi).
- Asset: solo originali o con licenza CC0 (es. Kenney.nl); annotare la fonte in `CREDITS.md` di ogni gioco.

## Nota sulla divisione "maschietto / femminuccia"
La roadmap segue la divisione chiesta (5 + 5) come guida ai temi. Sugli store i giochi vanno presentati per tema (pompieri, unicorni, dinosauri…) e non per genere: ogni gioco deve essere godibile da qualsiasi bambino.
