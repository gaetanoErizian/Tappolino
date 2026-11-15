import { sound } from '../../core/sound';
import themeOgg from './audio/theme.ogg?url';
import themeMp3 from './audio/theme.mp3?url';

/**
 * Musica ed effetti di Pasticceria Magica: file audio preparati offline (scripts/audio/pasticceria_music.py
 * e pasticceria_sfx.py), suonati dal lettore comune core/sound (pacchetto "pasticceria").
 * I volumi relativi degli effetti si regolano qui.
 */

export const PACK = 'pasticceria';

/** Durata esatta del loop della musica: deve coincidere con quella stampata da pasticceria_music.py. */
export const THEME_LOOP = 80;

const SFX_FILES = import.meta.glob('./audio/sfx_*.mp3', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
/** nome dell'effetto → URL del file */
export const SFX_URLS: Record<string, string> = Object.fromEntries(
  Object.entries(SFX_FILES).map(([p, url]) => [p.replace(/^.*sfx_(.+)\.mp3$/, '$1'), url]),
);

/** Registra il pacchetto audio (una volta sola, prima del preload del modulo). */
export function registerPasticceriaSound(): void {
  sound.register(PACK, { music: { ogg: themeOgg, mp3: themeMp3, loop: THEME_LOOP }, sfx: SFX_URLS });
}

/** Avvia (o tiene in corso) la musica del gioco: ogni scena di Pasticceria la chiama all'apertura. */
export function playPasticceriaMusic(): void {
  sound.playMusic(PACK);
}

const p = (name: string, vol: number, jitter = 0.04) => (): void => sound.play(PACK, name, { vol, jitter });

export const sfx = {
  pick: p('pick', 0.6, 0.06),
  back: p('back', 0.5),
  plop: p('plop', 0.9, 0.08),
  ding: p('ding', 0.8, 0),
  stir: p('stir', 0.55, 0.12),
  smooth: p('smooth', 0.7, 0),
  doorOpen: p('doorOpen', 0.6),
  doorClose: p('doorClose', 0.75),
  tick: p('tick', 0.35, 0.02),
  bubble: p('bubble', 0.5, 0.1),
  freeze: p('freeze', 0.45, 0.03),
  squeeze: p('squeeze', 0.85, 0.06),
  topping: p('topping', 0.6, 0.1),
  nope: p('nope', 0.55, 0),
  magic: p('magic', 0.65, 0),
  chomp: p('chomp', 0.95, 0.08),
  yum: p('yum', 0.75, 0),
  hello: p('hello', 0.6, 0.02),
  fanfare: p('fanfare', 0.65, 0),
  whoosh: p('whoosh', 0.4, 0.1),
};
