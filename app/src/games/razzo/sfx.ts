import { sound } from '../../core/sound';
import { comboRate } from './course';
import themeOgg from './audio/theme.ogg?url';
import themeMp3 from './audio/theme.mp3?url';

/**
 * Musica ed effetti di Razzo tra le Stelle: file audio preparati offline con strumenti campionati
 * (scripts/audio/razzo_music.py e razzo_sfx.py), suonati dal lettore comune core/sound (pacchetto "razzo").
 * I volumi relativi degli effetti si regolano qui.
 */

export const PACK = 'razzo';

/** Durata esatta del loop della musica: deve coincidere con quella stampata da razzo_music.py. */
export const THEME_LOOP = 64;

const SFX_FILES = import.meta.glob('./audio/sfx_*.mp3', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
/** nome dell'effetto → URL del file */
export const SFX_URLS: Record<string, string> = Object.fromEntries(
  Object.entries(SFX_FILES).map(([p, url]) => [p.replace(/^.*sfx_(.+)\.mp3$/, '$1'), url]),
);

/** Registra il pacchetto audio (una volta sola, prima del preload del modulo). */
export function registerRazzoSound(): void {
  sound.register(PACK, { music: { ogg: themeOgg, mp3: themeMp3, loop: THEME_LOOP }, sfx: SFX_URLS });
}

/** Avvia (o tiene in corso) la musica del gioco: ogni scena la chiama all'apertura. */
export function playRazzoMusic(): void {
  sound.playMusic(PACK);
}

const p = (name: string, vol: number, jitter = 0.04) => (): void => sound.play(PACK, name, { vol, jitter });

/** Effetti usati dal gioco (ogni nome ha il suo file sfx_<nome>.mp3). */
export const SFX_NAMES = ['star', 'bigstar', 'boing', 'lift', 'launch', 'land', 'flag', 'fanfare', 'newrocket', 'giggle', 'select', 'zoom', 'twinkle', 'whoosh'] as const;

export const sfx = {
  /** stella presa: le stelle prese di fila salgono sulla scala */
  star: (combo: number): void => sound.play(PACK, 'star', { vol: 0.62, jitter: 0, rate: comboRate(combo) }),
  bigstar: p('bigstar', 0.75, 0),
  boing: p('boing', 0.8, 0.1),
  lift: p('lift', 0.32, 0.12),
  launch: p('launch', 0.6, 0),
  land: p('land', 0.75, 0.04),
  flag: p('flag', 0.7, 0),
  fanfare: p('fanfare', 0.75, 0),
  newrocket: p('newrocket', 0.75, 0),
  giggle: (rate: number): void => sound.play(PACK, 'giggle', { vol: 0.7, jitter: 0.03, rate }),
  select: p('select', 0.65, 0),
  zoom: p('zoom', 0.55, 0.06),
  twinkle: p('twinkle', 0.4, 0.15),
  whoosh: p('whoosh', 0.45, 0.1),
};
