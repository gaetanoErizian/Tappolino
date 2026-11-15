import { sound } from '../../core/sound';
import themeOgg from './audio/theme.ogg?url';
import themeMp3 from './audio/theme.mp3?url';

/**
 * Musica ed effetti del Salone degli Unicorni: file audio preparati offline con strumenti campionati
 * (scripts/audio/unicorni_music.py e unicorni_sfx.py), suonati dal lettore comune core/sound (pacchetto "unicorni").
 * I volumi relativi degli effetti si regolano qui.
 */

export const PACK = 'unicorni';

/** Durata esatta del loop della musica: deve coincidere con quella stampata da unicorni_music.py. */
export const THEME_LOOP = 60;

const SFX_FILES = import.meta.glob('./audio/sfx_*.mp3', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
/** nome dell'effetto → URL del file */
export const SFX_URLS: Record<string, string> = Object.fromEntries(
  Object.entries(SFX_FILES).map(([p, url]) => [p.replace(/^.*sfx_(.+)\.mp3$/, '$1'), url]),
);

/** Registra il pacchetto audio (una volta sola, prima del preload del modulo). */
export function registerUnicorniSound(): void {
  sound.register(PACK, { music: { ogg: themeOgg, mp3: themeMp3, loop: THEME_LOOP }, sfx: SFX_URLS });
}

/** Avvia (o tiene in corso) la musica del gioco: ogni scena la chiama all'apertura. */
export function playUnicorniMusic(): void {
  sound.playMusic(PACK);
}

const p = (name: string, vol: number, jitter = 0.04) => (): void => sound.play(PACK, name, { vol, jitter });

/** Effetti usati dal gioco (ogni nome ha il suo file sfx_<nome>.mp3). */
export const SFX_NAMES = [
  'neigh', 'hop', 'squish', 'bubble', 'water', 'shake', 'brush', 'shine', 'pick', 'paint', 'magic', 'pop', 'step', 'camera', 'fanfare', 'whoosh',
] as const;

export const sfx = {
  /** nitrito magico (glissando di flauto e arpa) */
  neigh: p('neigh', 0.7, 0.05),
  hop: p('hop', 0.55, 0.06),
  squish: p('squish', 0.5, 0.15),
  bubble: p('bubble', 0.45, 0.2),
  water: p('water', 0.45, 0.08),
  shake: p('shake', 0.6, 0.04),
  brush: p('brush', 0.45, 0.14),
  shine: p('shine', 0.65, 0),
  pick: p('pick', 0.6, 0.06),
  paint: p('paint', 0.45, 0.12),
  magic: p('magic', 0.65, 0),
  /** accessorio messo: ogni volta un po' più acuto, su una scala pentatonica */
  pop: (i: number): void => sound.play(PACK, 'pop', { vol: 0.75, jitter: 0, rate: Math.pow(2, [0, 2, 4, 7, 9, 12][i % 6] / 12) }),
  step: p('step', 0.75, 0),
  camera: p('camera', 0.75, 0),
  fanfare: p('fanfare', 0.7, 0),
  whoosh: p('whoosh', 0.4, 0.1),
};
