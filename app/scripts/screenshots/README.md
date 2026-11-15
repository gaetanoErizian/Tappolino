# Catture per gli store, un file per gioco

`<id>.py` con una funzione `shots(pg, url, lang, d, h)`:
- `pg` pagina Playwright già aperta alla dimensione del dispositivo, `url` indirizzo dell'app, `lang` lingua, `d` cartella di uscita;
- `h.load(pg, url, lang, salvataggi)` apre l'app con progressi preimpostati, `h.run(pg, js)` esegue codice nella pagina, `h.shot(pg, f'{d}/1-nome.png')` cattura a gioco fermo.

`store-screenshots.py` li trova da solo: `python scripts/store-screenshots.py --groups <id>`.
Le immagini non vanno in git (decisione 14).
