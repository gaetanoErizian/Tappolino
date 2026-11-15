import { describe, expect, it } from 'vitest';
import {
  UNICORNS, COLORS, ACCESSORIES, REWARDS, START, STEPS, RUB_GOAL, RUB_RADIUS, MAX_STICKERS, ALBUM_MAX,
  unlocked, rewardFor, nextUnicorn, rubProgress, wear, layout, canPhoto, addPhoto, sanitizeLooks, sanitizeGroomed,
  unicornById, colorHex, type Look, type AccessoryId,
} from './salon';
import { ScratchGrid, maskFromAlpha } from '../../core/scratch';
import { gameTextures, STICKER_SPOTS, ACC_AT, ACC_SIZE, U } from './art';
import { mergeDefaults } from '../../core/storage';
import { LOCALES } from './locales';
import { DEFAULT_SAVE } from './save';
import { sound } from '../../core/sound';
import { PACK, THEME_LOOP, SFX_URLS, SFX_NAMES, registerUnicorniSound, sfx } from './sfx';
import entry from './entry';

describe('unicorni: voce di menu', () => {
  it('gioco 4, a pagamento, colore del brief, titoli nelle 6 lingue, tessera con la chiave giusta', () => {
    expect(entry.id).toBe('unicorni');
    expect(entry.order).toBe(4);
    expect(entry.free).toBe(false);
    expect(entry.color).toBe('#b58cf0');
    for (const l of ['it', 'en', 'es', 'fr', 'de', 'pt'] as const) expect(entry.titles[l].trim().length).toBeGreaterThan(0);
    const tile = entry.tile();
    expect(tile.key).toBe('tile_unicorni');
    expect([tile.w, tile.h]).toEqual([360, 280]);
  });
});

describe('unicorni: collezione e sblocchi', () => {
  it('6 unicorni, 6 colori, 8 accessori, id unici e colori validi', () => {
    for (const list of [UNICORNS.map((u) => u.id), COLORS.map((c) => c.id), ACCESSORIES.map((a) => a.id)]) expect(new Set(list).size).toBe(list.length);
    expect([UNICORNS.length, COLORS.length, ACCESSORIES.length]).toEqual([6, 6, 8]);
    for (const u of UNICORNS) {
      expect(u.coat).toMatch(/^#[0-9a-f]{6}$/);
      expect(u.mane).toMatch(/^#[0-9a-f]{6}$/);
    }
    for (const c of COLORS) expect(c.hex).toMatch(/^#[0-9a-f]{6}$/);
  });
  it('si parte con Perla, 3 colori e 3 accessori', () => {
    expect(unlocked(0)).toEqual({ unicorns: ['perla'], colors: START.colors, accessories: START.accessories });
  });
  it('una sorpresa per foto, ognuna sblocca qualcosa di nuovo, mai due volte', () => {
    const keys = REWARDS.map((r) => `${r.kind}:${r.id}`);
    expect(new Set(keys).size).toBe(keys.length);
    for (let n = 1; n <= REWARDS.length; n++) {
      const count = (u: ReturnType<typeof unlocked>) => u.unicorns.length + u.colors.length + u.accessories.length;
      expect(count(unlocked(n))).toBe(count(unlocked(n - 1)) + 1);
      expect(rewardFor(n)).toEqual(REWARDS[n - 1]);
    }
    expect(rewardFor(0)).toBeNull();
    expect(rewardFor(REWARDS.length + 1)).toBeNull();
  });
  it('alla fine tutto è sbloccato', () => {
    const all = unlocked(99);
    expect(all.unicorns.length).toBe(UNICORNS.length);
    expect(all.colors.length).toBe(COLORS.length);
    expect(all.accessories.length).toBe(ACCESSORIES.length);
  });
  it('al massimo 2 righe di barattoli e 2 vassoi da 4 accessori (bersagli grandi)', () => {
    expect(COLORS.length).toBeLessThanOrEqual(6);
    expect(ACCESSORIES.length).toBeLessThanOrEqual(8);
  });
  it('arriva prima il nuovo unicorno, poi uno a caso mai uguale al precedente', () => {
    expect(nextUnicorn(0, [], null)).toBe('perla');
    expect(nextUnicorn(1, ['perla'], 'perla')).toBe('perla');      // Rosa si sblocca con la 2ª foto
    expect(nextUnicorn(2, ['perla'], 'perla')).toBe('rosa');
    const all = UNICORNS.map((u) => u.id);
    for (const prev of all) for (const r of [0, 0.5, 0.999]) expect(nextUnicorn(99, all, prev, () => r)).not.toBe(prev);
  });
  it('id sconosciuti: si ripiega sul primo', () => {
    expect(unicornById('drago').id).toBe('perla');
    expect(colorHex('blu')).toBe(COLORS[0].hex);
  });
});

describe('unicorni: tappe e strofinare', () => {
  it('5 tappe, le prime 4 si finiscono strofinando una parte (mai tutto)', () => {
    expect(STEPS).toEqual(['wash', 'rinse', 'brush', 'color', 'decorate']);
    // mai tutta la superficie: gli ultimi angolini sarebbero una caccia frustrante
    for (const g of Object.values(RUB_GOAL)) { expect(g).toBeGreaterThan(0.3); expect(g).toBeLessThanOrEqual(0.7); }
    for (const r of Object.values(RUB_RADIUS)) { expect(r).toBeGreaterThanOrEqual(45); expect(r).toBeLessThanOrEqual(80); }
    expect(rubProgress('wash', 0)).toBe(0);
    expect(rubProgress('wash', RUB_GOAL.wash / 2)).toBeCloseTo(0.5);
    expect(rubProgress('brush', 1)).toBe(1);
  });
  it('griglia: strofinare scopre celle, la maschera conta solo il bersaglio', () => {
    const g = new ScratchGrid(100, 100, 20);
    expect(g.fraction()).toBe(0);
    g.stamp(50, 50, 25);
    expect(g.fraction()).toBeGreaterThan(0);
    g.clearRect(0, 0, 100, 100);
    expect(g.fraction()).toBe(1);
    // bersaglio: solo la colonna di sinistra (5 celle su 25)
    const mask = new Uint8Array(25);
    for (let r = 0; r < 5; r++) mask[r * 5] = 1;
    const m = new ScratchGrid(100, 100, 20, mask);
    expect(m.inMask(10, 50)).toBe(true);
    expect(m.inMask(90, 50)).toBe(false);
    expect(m.stamp(90, 50, 15)).toBe(0);       // fuori bersaglio: non conta
    expect(m.fraction()).toBe(0);
    m.line(10, 0, 10, 100, 12);
    expect(m.fraction()).toBe(1);
    expect(m.fractionIn(0, 0, 40, 40)).toBe(1);
  });
  it('un tratto veloce lascia un segno continuo', () => {
    const pts = ScratchGrid.along(0, 0, 100, 0, 10);
    expect(pts.length).toBe(10);
    expect(pts[pts.length - 1]).toEqual({ x: 100, y: 0 });
  });
  it('maschera dall\'alfa di un\'immagine', () => {
    const w = 40, h = 20, data = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < 20; x++) data[(y * w + x) * 4 + 3] = 255;   // metà sinistra piena
    expect(Array.from(maskFromAlpha(data, w, h, 10))).toEqual([1, 1, 0, 0, 1, 1, 0, 0]);
  });
});

describe('unicorni: accessori', () => {
  it('uno per testa, collo, viso e schiena: il nuovo sostituisce il vecchio', () => {
    let a: AccessoryId[] = [];
    a = wear(a, 'bow');
    a = wear(a, 'crown');
    a = wear(a, 'necklace');
    a = wear(a, 'glasses');
    a = wear(a, 'flower');
    expect(a).toEqual(['necklace', 'glasses', 'flower']);
  });
  it('adesivi fino al massimo, poi il nuovo prende il posto del più vecchio', () => {
    let a: AccessoryId[] = ['bow'];
    for (let i = 0; i < MAX_STICKERS; i++) a = wear(a, i % 2 ? 'heart' : 'star');
    expect(a.length).toBe(MAX_STICKERS + 1);
    a = wear(a, 'heart');
    expect(a.filter((x) => x === 'star' || x === 'heart').length).toBe(MAX_STICKERS);
    expect(a[0]).toBe('bow');
    const spots = layout(a).filter((x) => x.slot === 'body').map((x) => x.spot);
    expect(spots).toEqual([0, 1, 2, 3, 4, 5]);
    expect(STICKER_SPOTS.length).toBe(MAX_STICKERS);
  });
  it('la foto compare dopo il primo accessorio', () => {
    expect(canPhoto([])).toBe(false);
    expect(canPhoto(['star'])).toBe(true);
  });
  it('ogni accessorio ha texture, misura e posto sulla tela dell\'unicorno', () => {
    const keys = new Set(gameTextures().map((t) => t.key));
    for (const a of ACCESSORIES) {
      expect(keys.has(`un_acc_${a.id}`), a.id).toBe(true);
      expect(ACC_SIZE[a.id]).toBeTruthy();
      const at = a.slot === 'body' ? STICKER_SPOTS[0] : ACC_AT[a.id as keyof typeof ACC_AT];
      expect(at.x).toBeGreaterThan(0); expect(at.x).toBeLessThan(U.W);
      expect(at.y).toBeGreaterThan(0); expect(at.y).toBeLessThan(U.H);
    }
    for (const u of UNICORNS) expect(keys.has(`un_horn_${u.horn}`), u.horn).toBe(true);
  });
});

describe('unicorni: album e salvataggi', () => {
  const look = (u: Look['u']): Look => ({ u, c: 'pink', a: ['bow'] });
  it("l'album tiene le ultime 6 foto, la più recente per prima", () => {
    let list: Look[] = [];
    for (let i = 0; i < 9; i++) list = addPhoto(list, look(i % 2 ? 'rosa' : 'perla'));
    expect(list.length).toBe(ALBUM_MAX);
    list = addPhoto(list, look('notte'));
    expect(list[0].u).toBe('notte');
  });
  it('scarta foto non valide e rimette in ordine gli accessori', () => {
    const clean = sanitizeLooks([
      look('cielo'), { u: 'drago', c: 'pink', a: [] }, { u: 'rosa', c: 'blu', a: [] }, null, 'x',
      { u: 'pesca', c: 'mint', a: ['bow', 'crown', 'bomba', 7, 'star'] },
    ]);
    expect(clean.map((x) => x.u)).toEqual(['cielo', 'pesca']);
    expect(clean[1].a).toEqual(['crown', 'star']);
    expect(sanitizeLooks('no')).toEqual([]);
    expect(sanitizeGroomed(['rosa', 'drago', 'perla', 'rosa'])).toEqual(['perla', 'rosa']);
  });
  it('unisce dati vecchi con nuovi campi e ignora tipi sbagliati', () => {
    const s = mergeDefaults(DEFAULT_SAVE, JSON.stringify({ visits: 3, photos: 'x', extra: 1 }));
    expect(s.visits).toBe(3);
    expect(s.photos).toEqual([]);
    expect(s.tutorialDone).toBe(false);
    expect('extra' in s).toBe(false);
  });
});

describe('unicorni: grafica', () => {
  it('texture con chiavi uniche, prefisso "un_" e SVG ben formati', () => {
    const list = gameTextures();
    const keys = list.map((t) => t.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const t of list) {
      expect(t.key.startsWith('un_'), t.key).toBe(true);
      expect(t.svg.startsWith('<svg'), t.key).toBe(true);
      expect(t.svg).not.toContain('NaN');
      expect(t.svg).not.toContain('undefined');
    }
    // gli strati dell'unicorno combaciano: stessa misura della tela
    for (const k of ['un_coat', 'un_coat_hl', 'un_mane', 'un_mane_hl', 'un_mane_messy', 'un_mane_rainbow', 'un_mud']) {
      const t = list.find((x) => x.key === k)!;
      expect([t.w, t.h], k).toEqual([U.W, U.H]);
    }
  });
});

describe('unicorni: audio (core/sound)', () => {
  it('pacchetto "unicorni": musica ogg+mp3 con loop di 60 s e un file per ogni effetto', () => {
    registerUnicorniSound();
    const pack = (sound as unknown as { packs: Map<string, { music?: { ogg: string; mp3: string; loop: number }; sfx: Record<string, string> }> }).packs.get(PACK)!;
    expect(pack.music?.ogg).toMatch(/theme.*\.ogg/);
    expect(pack.music?.mp3).toMatch(/theme.*\.mp3/);
    expect(pack.music?.loop).toBe(THEME_LOOP);
    expect(THEME_LOOP).toBeGreaterThanOrEqual(30);
    expect(THEME_LOOP).toBeLessThanOrEqual(80);
    expect(Object.keys(SFX_URLS).sort()).toEqual([...SFX_NAMES].sort());
    expect(Object.keys(sfx).sort()).toEqual([...SFX_NAMES].sort());
  });
});

describe('unicorni: traduzioni', () => {
  const keys = Object.keys(LOCALES.it).sort();
  for (const [l, d] of Object.entries(LOCALES)) {
    it(`${l}: stesse chiavi, tutte prefissate "unicorni."`, () => {
      expect(Object.keys(d).sort()).toEqual(keys);
      for (const [k, v] of Object.entries(d)) {
        expect(k.startsWith('unicorni.')).toBe(true);
        expect(String(v).trim().length).toBeGreaterThan(0);
      }
      expect(d['unicorni.title']).toBe(entry.titles[l as keyof typeof entry.titles]);
    });
  }
});
