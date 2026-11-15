import { describe, expect, it } from 'vitest';
import { canPlay } from './core/module';
import { mergeDefaults } from './core/storage';
import { noteFreq } from './core/audio';
import { initI18n, addLocales, setLang, t } from './core/i18n';
import { APP_STATE_DEFAULTS } from './core/appState';
import { APP_LOCALES } from './locales';
import { GAMES, gameTitles } from './games/registry';
import { CONFIG } from './config';

describe('acquisto unico e giochi bloccati', () => {
  it('un gioco gratis si apre sempre, uno bloccato solo dopo l’acquisto', () => {
    expect(canPlay({ free: true }, false)).toBe(true);
    expect(canPlay({ free: false }, false)).toBe(false);
    expect(canPlay({ free: false }, true)).toBe(true);
  });
  it('prodotto unico unlock_all sull’appId dell’app', () => {
    expect(CONFIG.appId).toBe('it.tappolino.app');
    expect(CONFIG.productId).toBe('it.tappolino.app.unlock_all');
    expect(CONFIG.houseBannerOnIOS).toBe(false);
  });
  it('stato condiviso: per default nulla è sbloccato', () => {
    expect(APP_STATE_DEFAULTS.unlocked).toBe(false);
    expect(mergeDefaults(APP_STATE_DEFAULTS, '{"unlocked":true}').unlocked).toBe(true);
  });
});

describe('registro dei giochi', () => {
  it('id unici, titoli tradotti, solo i 3 giochi previsti sono gratis', () => {
    const ids = GAMES.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('pompieri');
    expect(ids).toContain('pasticceria');
    const FREE = ['pompieri', 'pasticceria', 'dinosauri'];
    const titles = gameTitles();
    for (const g of GAMES) {
      expect(g.free).toBe(FREE.includes(g.id));
      expect(g.titleKey).toBe(`games.${g.id}`);
      for (const l of Object.keys(APP_LOCALES) as (keyof typeof APP_LOCALES)[]) {
        expect(String(g.titles[l] ?? '').trim().length).toBeGreaterThan(0);
        expect(titles[l][g.titleKey]).toBe(g.titles[l]);
      }
      expect(g.tile().key).toBe(`tile_${g.id}`);
      expect(g.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
  it('ordine del menu: per numero del gioco, senza doppioni', () => {
    const orders = GAMES.map((g) => g.order);
    expect(new Set(orders).size).toBe(orders.length);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
    expect(GAMES[0].id).toBe('pompieri');
  });
});

describe('traduzioni dell’app', () => {
  const keys = Object.keys(APP_LOCALES.it).sort();
  for (const [l, d] of Object.entries(APP_LOCALES)) {
    it(`${l}: stesse chiavi dell'italiano, nessun testo vuoto, 10 numeri`, () => {
      expect(Object.keys(d).sort()).toEqual(keys);
      for (const v of Object.values(d)) expect(String(v).trim().length).toBeGreaterThan(0);
      expect((d.numbers as string[]).length).toBe(10);
      expect(String(d['gate.question'])).toContain('{a}');
      expect(String(d['parents.unlock'])).toContain('{price}');
      expect(String(d['unlock.title'])).toContain('{game}');
    });
  }
  it('i testi dei moduli si aggiungono senza cancellare quelli dell’app', () => {
    initI18n(APP_LOCALES, 'it');
    addLocales({ it: { 'x.y': 'ciao' }, en: {}, es: {}, fr: {}, de: {}, pt: {} });
    expect(t('x.y')).toBe('ciao');
    expect(t('app.title')).toBe('Tappolino');
    setLang('en');
    expect(t('x.y')).toBe('x.y'); // testo mancante in inglese: si vede la chiave, mai un errore
  });
});

describe('audio', () => {
  it('frequenze note', () => {
    expect(noteFreq('A4')).toBeCloseTo(440);
  });
});
