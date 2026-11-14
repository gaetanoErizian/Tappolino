# Risposte per le dichiarazioni degli store — Pompieri in Azione

Verificare sempre le regole aggiornate prima dell'invio: cambiano spesso.

## Prodotto in-app (entrambi gli store)
- **ID prodotto**: `it.tappolino.pompieri.remove_ads` (uguale su Play e App Store)
- **Tipo**: Google Play → *prodotto a pagamento singolo (one-time)*; Apple → *Non consumabile*
- **Prezzo**: fascia 0,99 €
- **Nome**: "Togli la pubblicità" / "Remove ads" (tradurre nelle 6 lingue con `parents.removeAdsShort` dai file `src/locales`)
- Apple: allegare lo screenshot dell'area genitori per la revisione dell'acquisto.

## Google Play Console
- **Pubblico di destinazione**: solo fasce *5 anni e meno* e *6-8 anni*. Aderire al programma/norme per le famiglie.
- **Annunci**: "Sì, l'app contiene annunci". SDK: Google Mobile Ads (AdMob) — è nell'elenco SDK autocertificati per le famiglie.
- **Classificazione contenuti (IARC)**: categoria Gioco; nessuna violenza, paura, linguaggio, sesso, droghe, gioco d'azzardo; nessuna interazione tra utenti; nessuna condivisione di posizione; acquisti digitali: sì. Esito atteso: PEGI 3 / ESRB Everyone.
- **Sicurezza dei dati (Data Safety)** — il codice del gioco non raccoglie nulla; va però dichiarato ciò che fa l'SDK AdMob sul banner. Seguire la guida ufficiale *Google Mobile Ads SDK – Play data disclosure* (developers.google.com/admob/android/privacy/play-data-disclosure). Di norma si dichiarano, condivisi con Google per *pubblicità* e *prevenzione frodi*: posizione approssimativa (da IP), interazioni con l'app, diagnostica/prestazioni, ID dispositivo (App set ID; l'ID pubblicità è rimosso dal manifest). Dati crittografati in transito: Sì. Cancellazione dati: nessun account, non applicabile.
- **Permessi**: solo INTERNET (per il banner). Il permesso `AD_ID` è rimosso esplicitamente.
- **Norme per le famiglie**: annunci non personalizzati, `tagForChildDirectedTreatment = true`, `maxAdContentRating = G`, nessun interstitial/video/rewarded.
- **AdMob (console)**: creare l'app Android, un'unità *banner*; nelle impostazioni dell'app indicare che è rivolta ai bambini; in "Privacy e messaggi" configurare il messaggio GDPR (con TFUA attivo il modulo di consenso non viene mostrato e si ricevono annunci limitati/non personalizzati).

## App Store Connect
- **Categoria**: Giochi → sottocategoria *Bambini*; *Kids Category* con fascia **5 anni e meno** (o 6-8).
- **Nessun SDK pubblicitario o di analytics di terzi** nella build iOS (AdMob escluso da `capacitor.config.ts → ios.includePlugins`).
- **Parental gate**: presente prima di acquisto, link esterni, area genitori (tieni premuto 3 s + somma scritta in lettere).
- **Privacy Nutrition Label**: *Nessun dato raccolto* ("Data Not Collected").
- **Privacy manifest**: `ios/App/App/PrivacyInfo.xcprivacy` (UserDefaults, motivo CA92.1; nessun tracciamento).
- **Crittografia**: `ITSAppUsesNonExemptEncryption = false` già nell'Info.plist.
- **Classificazione età**: nessun contenuto sensibile → 4+.
- **URL privacy**: obbligatorio (pagina `privacy-policy.html` pubblicata online).
- **Note per la revisione**: "Kids app. No third-party ads or analytics on iOS. The bottom strip only promotes our own games behind a parental gate. One non-consumable IAP removes it."
