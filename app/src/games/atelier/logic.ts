/**
 * Logica pura dell'"Atelier delle Principesse" (nessuna dipendenza da Phaser: testabile con Vitest).
 * Si sceglie un personaggio, lo si veste trascinando (o toccando) abiti, copricapi, scarpe e accessori,
 * si sceglie lo sfondo (castello, bosco, festa) e si fa la sfilata. Ogni sfilata regala una sorpresa:
 * un capo nuovo nel guardaroba oppure un nuovo personaggio.
 */

export type CharId = 'lia' | 'teo' | 'nina' | 'leo' | 'mei' | 'sami';
export type Category = 'dress' | 'head' | 'feet' | 'extra';
export type Slot = 'dress' | 'head' | 'feet' | 'neck' | 'hand' | 'back';
export type BgId = 'castle' | 'forest' | 'party';
export type SkinId = 'light' | 'tan' | 'brown' | 'dark';
export type HairId = 'long' | 'curls' | 'puffs' | 'tousled' | 'bob' | 'ringlets';

/** Spazio del personaggio ("doll space"): 400 unità di larghezza, piedi a FEET_Y. */
export const DOLL_W = 400;
export const FEET_Y = 830;
/** Altezza di riferimento della cima dei capelli: i copricapi sono disegnati per questa e poi spostati. */
export const HEAD_TOP_REF = 100;

export interface Character {
  id: CharId;
  skin: SkinId;
  hair: HairId;
  hairColor: string;
  /** cima dei capelli (doll space): ci si appoggiano corone e cappelli */
  top: number;
  /** lentiggini sulle guance */
  freckles?: boolean;
  /** per i testi ("una nuova amica" / "un nuovo amico") */
  girl: boolean;
  /** il look con cui si presenta nella scelta dei personaggi */
  signature: Partial<Record<Slot, ItemId>>;
}

export const CHARACTERS: Character[] = [
  { id: 'lia', girl: true, skin: 'light', hair: 'long', hairColor: '#8a4b2a', top: 84, signature: { dress: 'gown_pink', head: 'tiara', feet: 'slippers', neck: 'necklace' } },
  { id: 'teo', girl: false, skin: 'brown', hair: 'curls', hairColor: '#2e2020', top: 78, signature: { dress: 'tunic', head: 'crown', feet: 'boots', back: 'cape' } },
  { id: 'nina', girl: true, skin: 'dark', hair: 'puffs', hairColor: '#35221a', top: 96, signature: { dress: 'party', head: 'star_tiara', feet: 'sparkle', hand: 'wand' } },
  { id: 'leo', girl: false, skin: 'light', hair: 'tousled', hairColor: '#d4692e', top: 80, freckles: true, signature: { dress: 'armor', head: 'helmet', feet: 'knight_boots', hand: 'shield' } },
  { id: 'mei', girl: true, skin: 'tan', hair: 'bob', hairColor: '#231c2a', top: 92, signature: { dress: 'fairy', head: 'wreath', feet: 'slippers', back: 'wings' } },
  { id: 'sami', girl: false, skin: 'tan', hair: 'ringlets', hairColor: '#e9b544', top: 70, signature: { dress: 'coat', head: 'hat', feet: 'boots', hand: 'bouquet' } },
];
export const CHAR_IDS = CHARACTERS.map((c) => c.id);
export const isCharId = (id: unknown): id is CharId => CHARACTERS.some((c) => c.id === id);
export const charById = (id: string): Character => CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];

export const SKINS: Record<SkinId, string> = { light: '#ffdcc6', tan: '#f0c398', brown: '#c88a5c', dark: '#8a573a' };

export type ItemId =
  | 'gown_pink' | 'tunic' | 'armor' | 'party' | 'fairy' | 'gown_lilac' | 'coat' | 'rainbow'
  | 'tiara' | 'crown' | 'helmet' | 'wreath' | 'hat' | 'star_tiara' | 'hennin' | 'bow'
  | 'slippers' | 'boots' | 'sparkle' | 'knight_boots'
  | 'necklace' | 'cape' | 'wand' | 'shield' | 'bouquet' | 'wings' | 'bowtie' | 'parasol';

export interface Item { id: ItemId; cat: Category; slot: Slot; }

const it = (id: ItemId, cat: Category, slot: Slot = cat as Slot): Item => ({ id, cat, slot });

/** Il guardaroba completo, in ordine di vetrina (per categoria). */
export const ITEMS: Item[] = [
  it('gown_pink', 'dress'), it('tunic', 'dress'), it('armor', 'dress'), it('party', 'dress'),
  it('fairy', 'dress'), it('coat', 'dress'), it('gown_lilac', 'dress'), it('rainbow', 'dress'),
  it('tiara', 'head'), it('crown', 'head'), it('helmet', 'head'), it('wreath', 'head'),
  it('hat', 'head'), it('star_tiara', 'head'), it('hennin', 'head'), it('bow', 'head'),
  it('slippers', 'feet'), it('boots', 'feet'), it('sparkle', 'feet'), it('knight_boots', 'feet'),
  it('necklace', 'extra', 'neck'), it('cape', 'extra', 'back'), it('wand', 'extra', 'hand'), it('wings', 'extra', 'back'),
  it('shield', 'extra', 'hand'), it('bouquet', 'extra', 'hand'), it('bowtie', 'extra', 'neck'), it('parasol', 'extra', 'hand'),
];
export const ITEM_IDS = ITEMS.map((i) => i.id);
export const isItemId = (id: unknown): id is ItemId => ITEMS.some((i) => i.id === id);
export const itemById = (id: string): Item | undefined => ITEMS.find((i) => i.id === id);

export const CATEGORIES: Category[] = ['dress', 'head', 'feet', 'extra'];
export const SLOTS: Slot[] = ['back', 'feet', 'dress', 'neck', 'head', 'hand'];
export const BGS: BgId[] = ['castle', 'forest', 'party'];
export const isBgId = (id: unknown): id is BgId => BGS.includes(id as BgId);

export const itemsOf = (cat: Category): Item[] => ITEMS.filter((i) => i.cat === cat);

// =====================================================================
// Collezione: ogni sfilata regala una sorpresa, nell'ordine
// =====================================================================

/** Personaggi e capi disponibili fin dalla prima partita. */
export const START_CHARS: CharId[] = ['lia', 'teo'];
export const START_ITEMS: ItemId[] = ['gown_pink', 'tunic', 'armor', 'tiara', 'crown', 'helmet', 'slippers', 'boots', 'necklace', 'cape', 'wand'];

export type Reward = { kind: 'item'; id: ItemId } | { kind: 'char'; id: CharId };

/** Le sorprese, una per sfilata: si alternano capi di tutte le categorie e nuovi amici. */
export const SURPRISES: Reward[] = [
  { kind: 'item', id: 'party' },
  { kind: 'char', id: 'nina' },
  { kind: 'item', id: 'wreath' },
  { kind: 'item', id: 'wings' },
  { kind: 'item', id: 'sparkle' },
  { kind: 'char', id: 'leo' },
  { kind: 'item', id: 'fairy' },
  { kind: 'item', id: 'hat' },
  { kind: 'item', id: 'bouquet' },
  { kind: 'char', id: 'mei' },
  { kind: 'item', id: 'coat' },
  { kind: 'item', id: 'star_tiara' },
  { kind: 'item', id: 'shield' },
  { kind: 'item', id: 'knight_boots' },
  { kind: 'char', id: 'sami' },
  { kind: 'item', id: 'gown_lilac' },
  { kind: 'item', id: 'hennin' },
  { kind: 'item', id: 'bowtie' },
  { kind: 'item', id: 'rainbow' },
  { kind: 'item', id: 'bow' },
  { kind: 'item', id: 'parasol' },
];

/** La sorpresa che arriva con la sfilata numero `shows` (0 = la prima); null quando la collezione è completa. */
export const rewardFor = (shows: number): Reward | null => SURPRISES[shows] ?? null;

function earned(shows: number): Reward[] {
  return SURPRISES.slice(0, Math.max(0, Math.min(SURPRISES.length, Math.floor(shows))));
}

export function unlockedItems(shows: number): Set<ItemId> {
  const out = new Set<ItemId>(START_ITEMS);
  for (const r of earned(shows)) if (r.kind === 'item') out.add(r.id);
  return out;
}

export function unlockedChars(shows: number): Set<CharId> {
  const out = new Set<CharId>(START_CHARS);
  for (const r of earned(shows)) if (r.kind === 'char') out.add(r.id);
  return out;
}

export const isComplete = (shows: number): boolean => shows >= SURPRISES.length;

// =====================================================================
// Il look
// =====================================================================

export interface Look {
  char: CharId;
  dress?: ItemId;
  head?: ItemId;
  feet?: ItemId;
  neck?: ItemId;
  hand?: ItemId;
  back?: ItemId;
  bg?: BgId;
}

export const emptyLook = (char: CharId): Look => ({ char });

export const wornCount = (l: Look): number => SLOTS.filter((s) => !!l[s]).length;

export const isWorn = (l: Look, id: ItemId): boolean => SLOTS.some((s) => l[s] === id);

/**
 * Tocco o trascinamento di un capo: se non è indossato lo mette (togliendo quello che occupava lo stesso posto),
 * se è già indossato lo toglie. Restituisce il nuovo look e cosa è successo.
 */
export function toggleItem(l: Look, id: ItemId): { look: Look; action: 'on' | 'off'; replaced?: ItemId } {
  const item = itemById(id);
  if (!item) return { look: l, action: 'off' };
  if (l[item.slot] === id) {
    const look = { ...l };
    delete look[item.slot];
    return { look, action: 'off' };
  }
  const replaced = l[item.slot];
  return { look: { ...l, [item.slot]: id }, action: 'on', replaced };
}

/** Si può andare in sfilata appena c'è almeno un capo addosso. */
export const canShow = (l: Look): boolean => wornCount(l) >= 1;

/** Look letto dai salvataggi: personaggio valido, capi esistenti e al posto giusto. */
export function sanitizeLook(raw: unknown): Look | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (!isCharId(r.char)) return null;
  const out: Look = { char: r.char };
  for (const s of SLOTS) {
    const v = r[s];
    if (isItemId(v) && itemById(v)!.slot === s) out[s] = v;
  }
  if (isBgId(r.bg)) out.bg = r.bg;
  return out;
}

export const ALBUM_MAX = 6;

/** La galleria tiene gli ultimi ritratti, il più recente per primo. */
export function addToAlbum(album: Look[], l: Look): Look[] {
  return [{ ...l }, ...album].slice(0, ALBUM_MAX);
}

export function sanitizeAlbum(raw: unknown): Look[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(sanitizeLook).filter((l): l is Look => !!l).slice(0, ALBUM_MAX);
}

/** Look di presentazione di un personaggio (con i soli capi già nel guardaroba se `owned` è dato). */
export function signatureLook(id: CharId, owned?: Set<ItemId>): Look {
  const out: Look = { char: id };
  for (const [slot, item] of Object.entries(charById(id).signature) as [Slot, ItemId][]) {
    if (!owned || owned.has(item)) out[slot] = item;
  }
  return out;
}

// =====================================================================
// Disposizione delle vetrine nell'atelier (area di design 1920×1080)
// =====================================================================

export const DOLL_AT = { x: 960, y: 975, scale: 0.92 };
/** colonne delle vetrine: due a sinistra e due a destra del personaggio */
export const SLOT_COLS = [370, 590, 1330, 1550];
/** righe (al massimo 2: sul telefono restano bersagli grandi) */
export const SLOT_ROW_Y = [400, 690];
export const SLOT_ONE_ROW_Y = 545;

/** Posizione della vetrina numero i quando la categoria ha n capi. */
export function slotPos(i: number, n: number): { x: number; y: number } {
  const rows = n > 4 ? 2 : 1;
  const r = Math.floor(i / 4);
  const order = [1, 2, 0, 3]; // prima le colonne interne, vicine al personaggio
  const col = order[i % 4];
  return { x: SLOT_COLS[col], y: rows === 1 ? SLOT_ONE_ROW_Y : SLOT_ROW_Y[Math.min(r, 1)] };
}

/** Il punto (in area di design) dove un dito che lascia un capo "colpisce" il personaggio. */
export function onDoll(x: number, y: number, at = DOLL_AT): boolean {
  const s = at.scale;
  return Math.abs(x - at.x) < 250 * s && y > at.y - 860 * s && y < at.y + 40 * s;
}

/** Personaggio da mostrare: quello indicato, altrimenti il primo disponibile. */
export function pickChar(id: unknown, shows: number): CharId {
  const ok = unlockedChars(shows);
  return isCharId(id) && ok.has(id) ? id : START_CHARS[0];
}
