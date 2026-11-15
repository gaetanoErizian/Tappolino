"""
Rigenera le schede store dell'app Tappolino (store/listing.json e store/listing.md) nelle 6 lingue.

Uso:  python scripts/make-listing.py
Legge: i titoli dei giochi da src/games/<id>/entry.ts, i sottotitoli da store/games/<id>/listing.json,
       l'elenco dei giochi "in arrivo" da src/config.ts, i testi fissi da store/listing.base.json.
Regole (decisioni 24 e 26):
- Google Play elenca anche i giochi "in arrivo".
- Su Google Play non si scrive "nessun dato raccolto": il banner AdMob tratta dati del dispositivo (vedi compliance.md).
- App Store NON li nomina e non promette contenuti futuri (linea guida 2.1: niente "coming soon").
Controlla i limiti di lunghezza degli store e si ferma se un testo li supera.
"""
import json, os, re, sys

ROOT = os.path.join(os.path.dirname(__file__), '..')
LANGS = ['it', 'en', 'es', 'fr', 'de', 'pt']
LIMITS = {'name': 30, 'subtitle': 30, 'short': 80, 'keywords': 100, 'promo': 170, 'whatsnew': 500, 'full_googleplay': 4000, 'full_appstore': 4000}


def read(p):
    with open(os.path.join(ROOT, p), encoding='utf-8') as f:
        return f.read()


def games():
    out = []
    base = os.path.join(ROOT, 'src', 'games')
    for gid in sorted(os.listdir(base)):
        p = os.path.join(base, gid, 'entry.ts')
        if not os.path.exists(p):
            continue
        src = read(f'src/games/{gid}/entry.ts')
        titles = dict(re.findall(r"\b(it|en|es|fr|de|pt):\s*['\"]([^'\"]+)['\"]", re.search(r'titles:\s*\{([^}]*)\}', src, re.S).group(1)))
        out.append({
            'id': gid,
            'order': int(re.search(r'order:\s*(\d+)', src).group(1)),
            'free': re.search(r'free:\s*(true|false)', src).group(1) == 'true',
            'titles': titles,
            'subtitles': {l: json.loads(read(f'store/games/{gid}/listing.json'))[l]['subtitle'] for l in LANGS},
        })
    return sorted(out, key=lambda g: g['order'])


def main():
    base = json.loads(read('store/listing.base.json'))
    soon_ids = re.findall(r"'([a-z]+)'", re.search(r'comingSoon:\s*\[([^\]]*)\]', read('src/config.ts')).group(1))
    gs = games()
    live = [g for g in gs if g['id'] not in soon_ids]
    soon = [g for g in gs if g['id'] in soon_ids]
    out, problems = {}, []
    for l in LANGS:
        b = base[l]
        lines = [f"• {g['titles'][l]} — {g['subtitles'][l]}" + (f" ({b['free']})" if g['free'] else '') for g in live]

        def full(store):
            games_block = [b['games_heading']] + lines
            if store == 'googleplay' and soon:
                games_block += ['', f"{b['coming']}: " + ', '.join(g['titles'][l] for g in soon) + '.']
            parents = [b['parents_heading'], '• ' + b[f'p_unlock_{store}'], '• ' + b['p_nosubs'], '• ' + b[f'p_ads_{store}'],
                       '• ' + b['p_parents'], '• ' + b[f'p_nodata_{store}'], '• ' + b['p_langs']]
            return '\n'.join([b['intro'], ''] + games_block + [''] + parents)

        e = {k: b[k] for k in ['name', 'subtitle', 'short', 'keywords', 'promo', 'whatsnew']}
        e['full_googleplay'] = full('googleplay')
        e['full_appstore'] = full('appstore')
        for k, lim in LIMITS.items():
            if len(e[k]) > lim:
                problems.append(f'{l}.{k}: {len(e[k])} > {lim}')
        if ' ,' in e['keywords'] or ', ' in e['keywords']:
            problems.append(f'{l}.keywords: spazi dopo le virgole (sprecano caratteri)')
        out[l] = e
    if problems:
        sys.exit('Testi fuori limite:\n  ' + '\n  '.join(problems))
    with open(os.path.join(ROOT, 'store', 'listing.json'), 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=2); f.write('\n')
    label = {'name': 'Nome', 'subtitle': 'Sottotitolo (Apple)', 'short': 'Descrizione breve (Google)', 'keywords': 'Parole chiave (Apple)',
             'promo': 'Testo promozionale (Apple)', 'whatsnew': 'Novità', 'full_googleplay': 'Descrizione completa — Google Play', 'full_appstore': 'Descrizione completa — App Store'}
    md = ["# Schede store dell'app Tappolino (6 lingue) — v1.0", '',
          'File generato da `scripts/make-listing.py`: non modificarlo a mano. I testi fissi sono in `listing.base.json`.', '',
          f"Giochi pubblicati: {', '.join(g['titles']['it'] for g in live)}.",
          f"Giochi in arrivo (solo scheda Google Play): {', '.join(g['titles']['it'] for g in soon) or 'nessuno'}.", '',
          'Limiti controllati dallo script: nome 30 · sottotitolo Apple 30 · descrizione breve Google 80 · parole chiave Apple 100 · testo promozionale Apple 170.',
          'Portoghese in variante brasiliana (pt-BR).', '']
    for l in LANGS:
        md += ['', f'## {l.upper()}', '']
        for k in LIMITS:
            head = f"**{label[k]}**" + ('' if k.startswith('full') else f" ({len(out[l][k])} car.)")
            md += [head, '', out[l][k], '']
    with open(os.path.join(ROOT, 'store', 'listing.md'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(md))
    print(f"Schede rigenerate: {len(live)} giochi pubblicati, {len(soon)} in arrivo, {len(LANGS)} lingue.")


if __name__ == '__main__':
    main()
