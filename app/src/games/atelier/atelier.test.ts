import { describe, expect, it } from 'vitest';
import {
  CHARACTERS, CHAR_IDS, ITEMS, ITEM_IDS, CATEGORIES, SLOTS, BGS, START_ITEMS, START_CHARS, SURPRISES, SKINS, DOLL_AT, SLOT_COLS, ALBUM_MAX,
  unlockedItems, unlockedChars, rewardFor, isComplete, toggleItem, wornCount, isWorn, canShow, sanitizeLook, sanitizeAlbum, addToAlbum,
  signatureLook, itemsOf, slotPos, onDoll, pickChar, emptyLook, charById, type Look,
} from './logic';
import { gameTextures } from './art';
import { PART_BOX, FIT_HEAD } from './dollArt';
import { atelierTile } from './tile';
import entry from './entry';
import { mergeDefaults } from '../../core/storage';
import { LOCALES } from './locales';
import { DEFAULT_SAVE } from './save';
import { sound } from '../../core/sound';
import { PACK, THEME_LOOP, SFX_URLS, SFX_NAMES, registerAtelierSound, sfx } from './sfx';

describe('atelier: voce di menu', () => {
  it('gioco 10, non gratis, colore e titoli dal brief', () => {
    expect(entry.id).toBe('atelier');
    expect(entry.order).toBe(10);
    expect(entry.free).toBe(false);
    expect(entry.color).toBe('#ee6fa8');
    for (const l of ['it', 'en', 'es', 'fr', 'de', 'pt'] as const) {
      expect(entry.titles[l].length).toBeGreaterThan(3);
      expect(LOCALES[l]['atelier.title']).toBe(entry.titles[l]);
    }
    expect(atelierTile().key).toBe('tile_atelier');
    expect(atelierTile().svg).not.toContain('NaN');
    expect(atelierTile().svg).not.toContain('undefined');
  });
});

describe('atelier: grafica', () => {
  const list = gameTextures();
  const keys = new Set(list.map((t) => t.key));
  it('texture con chiavi uniche, prefisso "at_" e SVG validi, di dimensioni ragionevoli', () => {
    expect(keys.size).toBe(list.length);
    for (const t of list) {
      expect(t.key.startsWith('at_'), t.key).toBe(true);
      expect(t.svg.startsWith('<svg'), t.key).toBe(true);
      expect(t.svg, t.key).not.toContain('NaN');
      expect(t.svg, t.key).not.toContain('undefined');
      expect(t.w * t.h, t.key).toBeLessThanOrEqual(2400 * 420);
    }
  });
  it('ogni personaggio ha testa e pelle; ogni capo il suo disegno con il riquadro sul corpo', () => {
    for (const c of CHARACTERS) {
      expect(keys.has(`at_head_${c.id}`)).toBe(true);
      expect(keys.has(`at_body_${c.skin}`)).toBe(true);
    }
    for (const i of ITEMS) {
      expect(keys.has(`at_item_${i.id}`), i.id).toBe(true);
      const [, , w, h] = PART_BOX[`at_item_${i.id}`];
      expect(w).toBeGreaterThan(20);
      expect(h).toBeGreaterThan(20);
    }
    for (const k of ['at_eye', 'at_eye_closed', 'at_eye_happy', 'at_mouth_smile', 'at_mouth_open', 'at_mouth_o', 'at_mannequin', 'at_mirror', 'at_gift',
      'at_slot', 'at_slot_on', 'at_frame', 'at_pedestal', 'at_btn_gallery', 'at_castle', 'at_tree', 'at_garland']) {
      expect(keys.has(k), k).toBe(true);
    }
    for (const c of CATEGORIES) expect(keys.has(`at_tab_${c}`)).toBe(true);
    for (const b of BGS) expect(keys.has(`at_thumb_${b}`)).toBe(true);
  });
  it('solo l\'elmo calza sulla testa; gli altri copricapi si appoggiano sui capelli', () => {
    expect([...FIT_HEAD]).toEqual(['helmet']);
  });
});

describe('atelier: personaggi e guardaroba', () => {
  it('6 personaggi originali, principesse, principi e cavalieri, con pelle e capelli diversi', () => {
    expect(CHARACTERS.length).toBe(6);
    expect(new Set(CHAR_IDS).size).toBe(6);
    expect(CHARACTERS.filter((c) => c.girl).length).toBe(3);
    expect(new Set(CHARACTERS.map((c) => c.hair)).size).toBe(6);
    expect(new Set(CHARACTERS.map((c) => c.skin)).size).toBeGreaterThanOrEqual(4);
    for (const c of Object.values(SKINS)) expect(c).toMatch(/^#[0-9a-f]{6}$/);
    for (const c of CHARACTERS) {
      expect(c.hairColor).toMatch(/^#[0-9a-f]{6}$/);
      expect(c.top).toBeGreaterThan(50);
      expect(c.top).toBeLessThan(110);
      // lo stile di presentazione usa capi veri, ognuno al suo posto
      for (const [slot, id] of Object.entries(c.signature)) expect(ITEMS.find((i) => i.id === id)?.slot).toBe(slot);
    }
    // c'è chi si presenta da cavaliere e chi da principe
    expect(CHARACTERS.some((c) => c.signature.dress === 'armor')).toBe(true);
    expect(CHARACTERS.some((c) => c.signature.dress === 'tunic')).toBe(true);
  });
  it('28 capi, 8 per categoria (4 scarpe), id unici', () => {
    expect(new Set(ITEM_IDS).size).toBe(ITEMS.length);
    expect(itemsOf('dress').length).toBe(8);
    expect(itemsOf('head').length).toBe(8);
    expect(itemsOf('feet').length).toBe(4);
    expect(itemsOf('extra').length).toBe(8);
    for (const i of ITEMS) expect(SLOTS).toContain(i.slot);
  });
});

describe('atelier: collezione', () => {
  it('si parte con 2 amici e 11 capi, di ogni categoria', () => {
    expect([...unlockedChars(0)]).toEqual(START_CHARS);
    expect(unlockedItems(0).size).toBe(START_ITEMS.length);
    for (const c of CATEGORIES) expect(itemsOf(c).some((i) => START_ITEMS.includes(i.id))).toBe(true);
  });
  it('ogni sfilata regala una sorpresa diversa, fino a sbloccare tutto', () => {
    const seen = new Set<string>();
    for (let s = 0; s < SURPRISES.length; s++) {
      const r = rewardFor(s)!;
      expect(r).toBeTruthy();
      const k = `${r.kind}:${r.id}`;
      expect(seen.has(k)).toBe(false);
      seen.add(k);
      // la sorpresa non era già disponibile
      if (r.kind === 'item') expect(unlockedItems(s).has(r.id)).toBe(false);
      else expect(unlockedChars(s).has(r.id)).toBe(false);
      expect(isComplete(s)).toBe(false);
    }
    expect(rewardFor(SURPRISES.length)).toBe(null);
    expect(isComplete(SURPRISES.length)).toBe(true);
    expect(unlockedItems(SURPRISES.length).size).toBe(ITEMS.length);
    expect(unlockedChars(SURPRISES.length).size).toBe(CHARACTERS.length);
    expect(unlockedItems(999).size).toBe(ITEMS.length);
    expect(unlockedItems(-3).size).toBe(START_ITEMS.length);
  });
  it('i nuovi amici arrivano presto e a intervalli (non tutti alla fine)', () => {
    const at = SURPRISES.map((r, i) => (r.kind === 'char' ? i : -1)).filter((i) => i >= 0);
    expect(at.length).toBe(4);
    expect(at[0]).toBeLessThanOrEqual(2);
    for (let k = 1; k < at.length; k++) expect(at[k] - at[k - 1]).toBeGreaterThanOrEqual(3);
  });
});

describe('atelier: vestire', () => {
  it('un capo si mette, un altro dello stesso posto lo sostituisce, toccato di nuovo si toglie', () => {
    let l: Look = emptyLook('lia');
    expect(canShow(l)).toBe(false);
    let r = toggleItem(l, 'gown_pink');
    expect(r.action).toBe('on');
    l = r.look;
    expect(l.dress).toBe('gown_pink');
    r = toggleItem(l, 'tunic');
    expect(r.replaced).toBe('gown_pink');
    l = r.look;
    expect(l.dress).toBe('tunic');
    expect(isWorn(l, 'gown_pink')).toBe(false);
    l = toggleItem(l, 'wand').look;
    l = toggleItem(l, 'necklace').look;
    l = toggleItem(l, 'cape').look;
    expect(wornCount(l)).toBe(4);
    expect(canShow(l)).toBe(true);
    // in mano un oggetto solo: lo scudo prende il posto della bacchetta
    l = toggleItem(l, 'shield').look;
    expect(l.hand).toBe('shield');
    r = toggleItem(l, 'tunic');
    expect(r.action).toBe('off');
    expect(r.look.dress).toBeUndefined();
    expect('dress' in r.look).toBe(false);
  });
  it('look dai salvataggi: personaggio e capi validi, ognuno al suo posto', () => {
    expect(sanitizeLook(null)).toBe(null);
    expect(sanitizeLook({ char: 'drago' })).toBe(null);
    expect(sanitizeLook({ char: 'mei', dress: 'crown', head: 'crown', feet: 'xxx', hand: 'wand', bg: 'luna' }))
      .toEqual({ char: 'mei', head: 'crown', hand: 'wand' });
    expect(sanitizeLook({ char: 'leo', dress: 'armor', bg: 'forest' })).toEqual({ char: 'leo', dress: 'armor', bg: 'forest' });
  });
  it('galleria: gli ultimi 6 ritratti, il più recente per primo', () => {
    let a: Look[] = [];
    for (let i = 0; i < 9; i++) a = addToAlbum(a, { char: CHAR_IDS[i % 6], bg: BGS[i % 3] });
    expect(a.length).toBe(ALBUM_MAX);
    expect(a[0].char).toBe(CHAR_IDS[8 % 6]);
    expect(sanitizeAlbum([{ char: 'lia' }, 'x', { char: 'nope' }, ...a])).toHaveLength(ALBUM_MAX);
    expect(sanitizeAlbum('rotto')).toEqual([]);
  });
  it('stile di presentazione: solo i capi già nel guardaroba, se richiesto', () => {
    const full = signatureLook('leo');
    expect(full.dress).toBe('armor');
    expect(full.hand).toBe('shield');
    const own = signatureLook('leo', unlockedItems(0));
    expect(own.dress).toBe('armor');
    expect(own.hand).toBeUndefined();
  });
  it('personaggio scelto: solo tra quelli già arrivati', () => {
    expect(pickChar('teo', 0)).toBe('teo');
    expect(pickChar('sami', 0)).toBe('lia');
    expect(pickChar('sami', SURPRISES.length)).toBe('sami');
    expect(pickChar(undefined, 0)).toBe('lia');
    expect(charById('xx').id).toBe('lia');
  });
});

describe('atelier: scena dell\'atelier', () => {
  it('vetrine: al massimo 2 righe, ben distanziate, lontane dal personaggio e dentro lo schermo', () => {
    for (const c of CATEGORIES) {
      const n = itemsOf(c).length;
      const ps = Array.from({ length: n }, (_, i) => slotPos(i, n));
      expect(new Set(ps.map((p) => `${p.x},${p.y}`)).size).toBe(n);
      expect(new Set(ps.map((p) => p.y)).size).toBeLessThanOrEqual(2);
      for (const p of ps) {
        expect(Math.abs(p.x - DOLL_AT.x)).toBeGreaterThanOrEqual(360);
        expect(p.x - 110).toBeGreaterThan(240);
        expect(p.x + 110).toBeLessThan(1700);
        expect(p.y - 125).toBeGreaterThan(200);
        expect(p.y + 125).toBeLessThan(1000);
      }
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        const a = ps[i], b = ps[j];
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(215);
      }
    }
    expect(SLOT_COLS.length).toBe(4);
  });
  it('lasciare un capo sul personaggio: bersaglio generoso, lontano no', () => {
    expect(onDoll(DOLL_AT.x, DOLL_AT.y - 400)).toBe(true);
    expect(onDoll(DOLL_AT.x + 200, DOLL_AT.y - 700)).toBe(true);
    expect(onDoll(DOLL_AT.x, DOLL_AT.y - 10)).toBe(true);
    expect(onDoll(SLOT_COLS[0], 400)).toBe(false);
    expect(onDoll(SLOT_COLS[3], 690)).toBe(false);
    expect(onDoll(DOLL_AT.x, 10)).toBe(false);
  });
  it('il personaggio (anche con il cappello più alto) resta nello schermo', () => {
    const lift = Math.min(...CHARACTERS.map((c) => c.top)) - 100;
    for (const i of ITEMS.filter((x) => x.slot === 'head')) {
      const top = PART_BOX[`at_item_${i.id}`][1] + (FIT_HEAD.has(i.id) ? 0 : lift);
      expect(DOLL_AT.y + (top - 830) * DOLL_AT.scale, i.id).toBeGreaterThan(0);
    }
  });
});

describe('atelier: salvataggi', () => {
  it('default e dati vecchi o rovinati', () => {
    expect(DEFAULT_SAVE).toEqual({ shows: 0, album: [], last: null, tutorialDone: false });
    const m = mergeDefaults(DEFAULT_SAVE, JSON.stringify({ shows: 'tre', album: {}, tutorialDone: true, extra: 1 }));
    expect(m.shows).toBe(0);
    expect(m.album).toEqual([]);
    expect(m.tutorialDone).toBe(true);
    expect('extra' in m).toBe(false);
  });
});

describe('atelier: audio (core/sound)', () => {
  it('pacchetto "atelier": musica ogg+mp3 con loop di 60 s e un file per ogni effetto', () => {
    registerAtelierSound();
    const pack = (sound as unknown as { packs: Map<string, { music?: { ogg: string; mp3: string; loop: number }; sfx: Record<string, string> }> }).packs.get(PACK)!;
    expect(pack.music?.ogg).toMatch(/theme.*\.ogg/);
    expect(pack.music?.mp3).toMatch(/theme.*\.mp3/);
    expect(pack.music?.loop).toBe(THEME_LOOP);
    expect(THEME_LOOP).toBeGreaterThanOrEqual(30);
    expect(THEME_LOOP).toBeLessThanOrEqual(80);
    expect(Object.keys(SFX_URLS).sort()).toEqual([...SFX_NAMES].sort());
    for (const n of SFX_NAMES) expect(typeof (sfx as Record<string, unknown>)[n]).toBe('function');
  });
});

describe('atelier: traduzioni', () => {
  const keys = Object.keys(LOCALES.it).sort();
  for (const [l, d] of Object.entries(LOCALES)) {
    it(`${l}: stesse chiavi, tutte prefissate "atelier.", nessun testo vuoto`, () => {
      expect(Object.keys(d).sort()).toEqual(keys);
      for (const [k, v] of Object.entries(d)) {
        expect(k.startsWith('atelier.')).toBe(true);
        expect(String(v).trim().length).toBeGreaterThan(0);
      }
      for (const k of ['atelier.title', 'atelier.bravo', 'atelier.new.item', 'atelier.new.char.f', 'atelier.new.char.m', 'atelier.gallery', 'atelier.complete']) expect(d[k]).toBeTruthy();
    });
  }
});
