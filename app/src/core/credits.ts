import { openOverlay, el, cardHeader } from './overlay';
import { BRAND } from './brand';
import { t } from './i18n';
import { platform } from './platform';
import OFL_TEXT from '../../node_modules/@fontsource/fredoka/LICENSE?raw';
import MIT_TEXT from '../../node_modules/@capacitor/core/LICENSE?raw';

/**
 * "Crediti e licenze" (decisione 22), aperto dall'area genitori (quindi sempre dietro il parental gate).
 * Deve restare allineato ad app/CREDITS.md. Nomi, autori e licenze non si traducono; gli indirizzi sono testo,
 * non link: da un'app per bambini non si esce verso il web.
 */
interface Credit { name: string; by: string; license: string; note?: string }

const FONT_CREDITS: Credit[] = [
  { name: 'Fredoka', by: '© 2016 The Fredoka Project Authors', license: 'SIL Open Font License 1.1' },
];

const INSTRUMENT_CREDITS: Credit[] = [
  { name: 'MuseScore General SoundFont', by: '© 2018–2021 S. Christian Collins', license: 'MIT (CC0 / public domain parts)' },
  { name: 'Fluid (R3) GM SoundFont', by: '© 2000–2002, 2008 Frank Wen · mono © 2014–2017 Michael Cowgill', license: 'MIT' },
];

/** Librerie davvero presenti nell'app su questa piattaforma (su iOS il plugin degli annunci non c'è). */
export function libraryCredits(p: 'android' | 'ios' | 'web'): Credit[] {
  const libs: Credit[] = [
    { name: 'Phaser 4', by: '© Richard Davey, Phaser Studio Inc.', license: 'MIT' },
    { name: 'Capacitor 8 · @capacitor/preferences', by: '© 2017–present Drifty Co.', license: 'MIT' },
    { name: '@capgo/native-purchases', by: '© Capgo (Martin Donadieu)', license: 'MPL-2.0', note: 'Source: github.com/Cap-go/capacitor-native-purchases' },
  ];
  if (p !== 'ios') libs.push({ name: '@capacitor-community/admob', by: '© 2021 Capacitor Community', license: 'MIT' });
  return libs;
}

function list(items: Credit[]): HTMLElement {
  const box = el('div');
  for (const c of items) {
    const row = el('p');
    row.style.margin = '4px 0 10px';
    const name = el('strong', { textContent: c.name });
    const rest = el('span', { textContent: `${c.by} · ${c.license}${c.note ? ` · ${c.note}` : ''}` });
    rest.style.cssText = 'display:block;font-size:14px;opacity:.8';
    row.append(name, rest);
    box.append(row);
  }
  return box;
}

function licenseText(title: string, text: string): HTMLElement {
  const d = el('details');
  d.style.cssText = `margin:8px 0;border:3px solid ${BRAND.ink};border-radius:16px;background:#fff;padding:8px 12px`;
  const s = el('summary', { textContent: title });
  s.style.cssText = 'font-weight:700;cursor:pointer';
  const pre = el('pre', { textContent: text.trim() });
  pre.style.cssText = 'white-space:pre-wrap;word-break:break-word;font:12px/1.4 ui-monospace,monospace;margin:8px 0 2px;max-height:240px;overflow:auto';
  d.append(s, pre);
  return d;
}

export function openCredits(onClose?: () => void): void {
  const { card } = openOverlay(onClose);
  const section = (text: string, color: string): HTMLElement => {
    const h = el('h3', { textContent: text });
    h.style.setProperty('--dot', color);
    return h;
  };
  // La licenza MIT è la stessa per tutti: si mostra una volta sola, senza la riga di copyright di un singolo progetto.
  const mit = MIT_TEXT.replace(/^Copyright.*$/m, 'Copyright (c) the respective authors listed above').trim();
  card.append(
    cardHeader(t('credits.open')),
    el('p', { textContent: t('credits.original') }),
    section(t('credits.font'), BRAND.yellow), list(FONT_CREDITS),
    section(t('credits.instruments'), BRAND.green), list(INSTRUMENT_CREDITS),
    section(t('credits.libraries'), BRAND.blue), list(libraryCredits(platform())),
    section(t('credits.texts'), BRAND.violet),
    licenseText('MIT License', mit),
    licenseText('SIL Open Font License 1.1', OFL_TEXT),
    licenseText('Mozilla Public License 2.0', 'This app uses @capgo/native-purchases under the Mozilla Public License 2.0.\nFull text: mozilla.org/MPL/2.0\nSource code: github.com/Cap-go/capacitor-native-purchases'),
  );
}
