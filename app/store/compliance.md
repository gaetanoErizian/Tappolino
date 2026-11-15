# Risposte per le dichiarazioni degli store — app Tappolino

Verificare sempre le regole aggiornate prima dell'invio: cambiano spesso.

## Prodotto in-app (entrambi gli store)
- **ID prodotto**: `it.tappolino.app.unlock_all` (uguale su Play e App Store)
- **Tipo**: Google Play → *prodotto a pagamento singolo (one-time)*; Apple → *Non consumabile*
- **Prezzo**: 1,99 € come prezzo di lancio per le prime 4 settimane circa, poi 2,99 € (decisione 27). Chi ha già comprato tiene tutto. Il cambio di prezzo si fa a mano nei due store.
- **Nome**: "Sblocca tutto" / "Unlock everything" (testi `parents.unlockShort` in `src/locales`)
- **Descrizione**: "Sblocca tutti i giochi, anche quelli futuri, e toglie la pubblicità" (su iOS senza la parte sulla pubblicità).
- Apple: allegare lo screenshot dell'offerta (dopo il parental gate) per la revisione dell'acquisto.

## Google Play Console (app `it.tappolino.app`)
- **Pubblico di destinazione**: solo fasce *5 anni e meno* e *6-8 anni*. Aderire alle norme per le famiglie.
- **Annunci**: "Sì, l'app contiene annunci". SDK: Google Mobile Ads (AdMob), nell'elenco SDK autocertificati per le famiglie. Solo banner, mai interstitial/video/rewarded.
- **Classificazione contenuti (IARC)**: categoria Gioco; nessuna violenza, paura, linguaggio, sesso, droghe, gioco d'azzardo; nessuna interazione tra utenti; nessuna condivisione di posizione; acquisti digitali: sì. Esito atteso: PEGI 3 / ESRB Everyone.
- **Sicurezza dei dati (Data Safety)** — il codice dell'app non raccoglie nulla; va dichiarato ciò che fa l'SDK AdMob sul banner, seguendo la guida *Google Mobile Ads SDK – Play data disclosure* (developers.google.com/admob/android/privacy/play-data-disclosure). Di norma: posizione approssimativa (da IP), interazioni con l'app, diagnostica, ID dispositivo (App set ID; l'ID pubblicità è rimosso dal manifest), condivisi con Google per pubblicità e prevenzione frodi. Dati crittografati in transito: Sì. Nessun account.
- **Permessi**: solo INTERNET (per il banner). `AD_ID` rimosso esplicitamente.
- **AdMob (console)**: app Android "Tappolino" e un'unità *banner*; app rivolta ai bambini; in "Privacy e messaggi" messaggio GDPR (con TFUA attivo il modulo non viene mostrato e gli annunci sono limitati/non personalizzati).

## App Store Connect (bundle ID `it.tappolino.app`)
- **Categoria**: Giochi → *Bambini*; *Kids Category* fascia **5 anni e meno** (o 6-8).
- **Nessuna pubblicità e nessun SDK di pubblicità o analytics di terzi** (AdMob escluso da `capacitor.config.ts → ios.includePlugins`; il banner della casa è spento: `houseBannerOnIOS: false`).
- **Parental gate**: prima di acquisto, ripristino, link esterni e area genitori (tieni premuto 3 s + somma scritta in lettere).
- **Giochi bloccati**: visibili nel menu con il lucchetto; il tocco apre il parental gate e poi l'offerta. Nessun gioco bloccato si avvia senza acquisto.
- **Privacy Nutrition Label**: *Nessun dato raccolto* ("Data Not Collected").
- **Privacy manifest**: `ios/App/App/PrivacyInfo.xcprivacy` (UserDefaults, motivo CA92.1; nessun tracciamento).
- **Crittografia**: `ITSAppUsesNonExemptEncryption = false` nell'Info.plist.
- **Classificazione età**: 4+.
- **URL privacy**: obbligatorio (pagina `privacy-policy.html` pubblicata online).
- **Note per la revisione**: "Kids app. No ads and no third-party SDKs on iOS. Some games are free; one non-consumable IAP unlocks all games. Locked games, the IAP, restore and external links are behind a parental gate (hold 3 s + spelled-out sum)."

## Controllo delle regole del 15/11/2026 (Fase 3)
Fatto con ricerche sul web, non leggendo per intero i testi ufficiali: **prima dell'invio rileggere le pagine originali** (App Store Review Guidelines 1.3, 2.1, 5.1.4; Norme per le famiglie di Google Play).

- **Apple, Kids Category (1.3 e 5.1.4)**: niente link verso l'esterno né occasioni di acquisto se non dietro un parental gate; niente pubblicità o analytics di terzi. L'app è a posto: su iOS non c'è alcun SDK pubblicitario, e acquisto, ripristino, privacy e crediti stanno dietro il parental gate. Nel pannello dei crediti gli indirizzi sono testo, non link.
- **Apple, completezza dell'app (2.1)**: le app con contenuti "coming soon" o segnaposto vengono respinte, e anche le descrizioni che promettono funzioni future. Per questo su iPhone e iPad i giochi non ancora pubblicati **non si vedono** (decisione 26) e la scheda App Store non li nomina. Le catture per l'App Store si fanno con il menu in versione iPhone.
- **Google Play, Norme per le famiglie**: per gli annunci ai bambini si possono usare solo le versioni degli SDK pubblicitari autocertificate per le famiglie. AdMob lo è, ma **la versione esatta dell'SDK Google Mobile Ads inclusa dal plugin va controllata nell'elenco di Google al momento della build Android**. Restano obbligatori: richieste marcate come rivolte ai bambini, contenuti "G", nessun permesso `AD_ID`, un solo banner per schermata, mai annunci che interrompono il gioco.
- **Google Play, offerte di acquisto**: devono distinguersi dal contenuto dell'app e non provocare tocchi involontari. I giochi bloccati hanno il lucchetto e il tocco passa dal parental gate; i giochi "in arrivo" non portano mai all'offerta.
- **Dichiarazioni sui dati**: la scheda Google Play e i testi dell'app non dicono più "nessun dato raccolto", perché su Android il banner AdMob tratta dati del dispositivo. La scheda App Store può dirlo: lì non c'è alcun SDK di terzi.

## Cosa manca prima dell'invio (compiti di Gaetano)
- Sostituire i segnaposto in `privacy-policy.html` (titolare, indirizzo, email) e pubblicarla; mettere l'indirizzo vero in `src/config.ts → privacyUrl`.
- ID reale dell'unità banner AdMob in `src/config.ts` e `testing: false`.
- Catture: flusso GitHub "App — catture per gli store" (un file zip per lingua).
- Per ogni aggiornamento che pubblica un gioco "in arrivo": toglierlo da `comingSoon` in `src/config.ts`, rilanciare `python scripts/make-listing.py` e rifare le catture del menu.

