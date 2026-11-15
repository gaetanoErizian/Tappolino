import { describe, expect, it } from 'vitest';
import { canPlay } from './core/module';
import { mergeDefaults } from './core/storage';
import { audio } from './core/audio';
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
  it('il muto è uno stato condiviso; la sintesi in tempo reale non esiste più', () => {
    audio.setMuted(true);
    expect(audio.muted).toBe(true);
    audio.setMuted(false);
    expect(audio.muted).toBe(false);
    expect('tone' in audio || 'playSong' in audio).toBe(false);
  });
});

describe('modalità prova', () => {
  it('apre tutti i giochi senza toccare lo stato dell’acquisto, e si spegne', async () => {
    const st = await import('./core/appState');
    const { canPlay } = await import('./core/module');
    expect(st.testerAvailable()).toBe(true); // web di prova
    const seen: boolean[] = [];
    const off = st.onUnlockChange((v) => seen.push(v));
    st.setTester(true);
    expect(st.isTester()).toBe(true);
    expect(st.isUnlocked()).toBe(true);
    expect(st.isPurchased()).toBe(false);
    for (const g of GAMES) expect(canPlay(g, st.isUnlocked())).toBe(true);
    expect(canPlay({ free: false }, st.isUnlocked())).toBe(true);
    st.setTester(false);
    expect(st.isUnlocked()).toBe(false);
    expect(canPlay({ free: false }, st.isUnlocked())).toBe(false);
    expect(seen).toEqual([true, false]);
    off();
  });
  it('nelle build per gli store non esiste: su dispositivo serve VITE_TESTER=1', async () => {
    const st = await import('./core/appState');
    const g = globalThis as { Capacitor?: unknown };
    g.Capacitor = { isNativePlatform: () => true };
    try {
      expect(st.testerAvailable()).toBe(false);
      st.setTester(true);
      expect(st.isTester()).toBe(false);
      expect(st.isUnlocked()).toBe(false);
    } finally {
      delete g.Capacitor;
    }
  });
});

describe('giochi in arrivo (decisione 24)', () => {
  it('la regola vale solo se attiva e solo per i giochi in elenco', async () => {
    const { comingSoon } = await import('./core/module');
    expect(comingSoon('treno', ['treno'], true)).toBe(true);
    expect(comingSoon('treno', ['treno'], false)).toBe(false);
    expect(comingSoon('pompieri', ['treno'], true)).toBe(false);
  });
  it('l’elenco contiene solo giochi esistenti e a pagamento; al lancio restano aperti i giochi 1–5', () => {
    for (const id of CONFIG.comingSoon) {
      const g = GAMES.find((x) => x.id === id);
      expect(g, id).toBeTruthy();
      expect(g!.free, id).toBe(false);
    }
    const open = GAMES.filter((g) => !CONFIG.comingSoon.includes(g.id)).map((g) => g.order);
    expect(open).toEqual([1, 2, 3, 4, 5]);
  });
  it('sul web di prova tutti i giochi restano apribili, salvo #arrivo', async () => {
    const { isComingSoon } = await import('./release');
    expect(isComingSoon('treno')).toBe(false);
  });
});

describe('crediti e licenze (decisione 22)', () => {
  it('su iOS non compare il plugin degli annunci, che lì non è nell’app', async () => {
    const { libraryCredits } = await import('./core/credits');
    expect(libraryCredits('ios').some((c) => /admob/i.test(c.name))).toBe(false);
    expect(libraryCredits('android').some((c) => /admob/i.test(c.name))).toBe(true);
    expect(libraryCredits('ios').some((c) => /Phaser/.test(c.name))).toBe(true);
  });
  it('i testi dei crediti esistono in tutte le lingue', () => {
    for (const l of Object.keys(APP_LOCALES) as (keyof typeof APP_LOCALES)[]) {
      for (const k of ['hub.comingSoon', 'credits.open', 'credits.original', 'credits.font', 'credits.instruments', 'credits.libraries', 'credits.texts']) {
        expect(APP_LOCALES[l][k], `${l} ${k}`).toBeTruthy();
      }
    }
  });
});

describe('giochi in arrivo: nascosti su iPhone (decisione 26)', () => {
  it('sul web di prova il menu mostra tutti i giochi', async () => {
    const { menuGames, comingSoonHidden } = await import('./release');
    expect(comingSoonHidden()).toBe(false);
    expect(menuGames(GAMES).length).toBe(GAMES.length);
  });
});
