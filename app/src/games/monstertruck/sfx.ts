import { sound } from '../../core/sound';
import { comboRate } from './track';
import themeOgg from './audio/theme.ogg?url';
import themeMp3 from './audio/theme.mp3?url';

/**
 * Musica ed effetti dell'Officina dei Monster Truck: file audio preparati offline con strumenti campionati
 * (scripts/audio/monstertruck_music.py e monstertruck_sfx.py), suonati dal lettore comune core/sound
 * (pacchetto "monstertruck"). I volumi relativi degli effetti si regolano qui.
 */

export const PACK = 'monstertruck';

/** Durata esatta del loop della musica: deve coincidere con quella stampata da monstertruck_music.py. */
export const THEME_LOOP = 60;

const SFX_FILES = import.meta.glob('./audio/sfx_*.mp3', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
/** nome dell'effetto → URL del file */
export const SFX_URLS: Record<string, string> = Object.fromEntries(
  Object.entries(SFX_FILES).map(([p, url]) => [p.replace(/^.*sfx_(.+)\.mp3$/, '$1'), url]),
);

/** Registra il pacchetto audio (una volta sola, prima del preload del modulo). */
export function registerTruckSound(): void {
  sound.register(PACK, { music: { ogg: themeOgg, mp3: themeMp3, loop: THEME_LOOP }, sfx: SFX_URLS });
}

/** Avvia (o tiene in corso) la musica del gioco: ogni scena la chiama all'apertura. */
export function playTruckMusic(): void {
  sound.playMusic(PACK);
}

const p = (name: string, vol: number, jitter = 0.04) => (): void => sound.play(PACK, name, { vol, jitter });

/** Effetti usati dal gioco (ogni nome ha il suo file sfx_<nome>.mp3). */
export const SFX_NAMES = [
  'vroom', 'horn', 'jump', 'land', 'boing', 'crunch', 'star', 'bigstar', 'cheer', 'ooh', 'fanfare', 'newpart', 'fixed',
  'wrench', 'pump', 'pop', 'wash', 'clank', 'cough', 'paint', 'sticker', 'select', 'tap', 'locked', 'whoosh',
] as const;

export const sfx = {
  /** motore che romba (dito giù) */
  vroom: p('vroom', 0.5, 0.06),
  horn: p('horn', 0.6, 0.02),
  jump: p('jump', 0.5, 0.06),
  land: p('land', 0.7, 0.06),
  boing: p('boing', 0.7, 0.08),
  crunch: p('crunch', 0.7, 0.1),
  /** stella presa: quelle prese di fila salgono sulla scala */
  star: (combo: number): void => sound.play(PACK, 'star', { vol: 0.6, jitter: 0, rate: comboRate(combo) }),
  bigstar: p('bigstar', 0.75, 0),
  cheer: p('cheer', 0.55, 0.05),
  ooh: p('ooh', 0.5, 0.06),
  fanfare: p('fanfare', 0.75, 0),
  newpart: p('newpart', 0.75, 0),
  fixed: p('fixed', 0.7, 0),
  wrench: p('wrench', 0.6, 0.08),
  pump: p('pump', 0.55, 0.1),
  pop: p('pop', 0.65, 0.04),
  wash: p('wash', 0.55, 0.06),
  clank: p('clank', 0.65, 0.05),
  cough: p('cough', 0.4, 0.1),
  paint: p('paint', 0.6, 0.08),
  sticker: p('sticker', 0.65, 0.06),
  select: p('select', 0.6, 0.04),
  tap: p('tap', 0.45, 0.12),
  locked: p('locked', 0.5, 0.05),
  whoosh: p('whoosh', 0.45, 0.1),
};
