# Risposte per le dichiarazioni degli store — app Tappolino

Verificare sempre le regole aggiornate prima dell'invio: cambiano spesso.

## Prodotto in-app (entrambi gli store)
- **ID prodotto**: `it.tappolino.app.unlock_all` (uguale su Play e App Store)
- **Tipo**: Google Play → *prodotto a pagamento singolo (one-time)*; Apple → *Non consumabile*
- **Prezzo**: 1,99 € al lancio, 2,99 € da 8 giochi (decisione 2). Chi ha già comprato tiene tutto.
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
