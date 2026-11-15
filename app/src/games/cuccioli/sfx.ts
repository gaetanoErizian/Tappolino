import { sound } from '../../core/sound';
import type { PetId } from './logic';
import themeOgg from './audio/theme.ogg?url';
import themeMp3 from './audio/theme.mp3?url';

/**
 * Musica ed effetti di Cuccioli dal Dottore: file audio preparati offline con strumenti campionati
 * (scripts/audio/cuccioli_music.py e cuccioli_sfx.py), suonati dal lettore comune core/sound (pacchetto "cuccioli").
 * I volumi relativi degli effetti si regolano qui.
 */

export const PACK = 'cuccioli';

/** Durata esatta del loop della musica: deve coincidere con quella stampata da cuccioli_music.py. */
export const THEME_LOOP = 60;

const SFX_FILES = import.meta.glob('./audio/sfx_*.mp3', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
/** nome dell'effetto → URL del file */
export const SFX_URLS: Record<string, string> = Object.fromEntries(
  Object.entries(SFX_FILES).map(([p, url]) => [p.replace(/^.*sfx_(.+)\.mp3$/, '$1'), url]),
);

/** Registra il pacchetto audio (una volta sola, prima del preload del modulo). */
export function registerCuccioliSound(): void {
  sound.register(PACK, { music: { ogg: themeOgg, mp3: themeMp3, loop: THEME_LOOP }, sfx: SFX_URLS });
}

/** Avvia (o tiene in corso) la musica del gioco: ogni scena la chiama all'apertura. */
export function playCuccioliMusic(): void {
  sound.playMusic(PACK);
}

const p = (name: string, vol: number, jitter = 0.04) => (): void => sound.play(PACK, name, { vol, jitter });

/** Effetti usati dal gioco (ogni nome ha il suo file sfx_<nome>.mp3). */
export const SFX_NAMES = [
  'pick', 'back', 'nope', 'whoosh', 'hop', 'scrub', 'sparkle', 'pluck', 'plaster', 'gulp', 'yum', 'rumble', 'yawn', 'snore',
  'stretch', 'sneeze', 'sneeze_big', 'shiver', 'scarf', 'cured', 'star', 'party', 'garden', 'ball',
  'voice_dog', 'voice_cat', 'voice_bunny', 'voice_bear', 'voice_fox', 'voice_panda', 'voice_pig', 'voice_lamb',
] as const;

export const sfx = {
  pick: p('pick', 0.6, 0.06),
  back: p('back', 0.5),
  /** strumento che non serve adesso: nota gentile, mai un "errore" */
  nope: p('nope', 0.55, 0.02),
  whoosh: p('whoosh', 0.4, 0.1),
  hop: p('hop', 0.45, 0.08),
  scrub: p('scrub', 0.6, 0.12),
  sparkle: p('sparkle', 0.7, 0),
  pluck: p('pluck', 0.75, 0.03),
  plaster: p('plaster', 0.75, 0.02),
  gulp: p('gulp', 0.7, 0.08),
  yum: p('yum', 0.7, 0.03),
  rumble: p('rumble', 0.5, 0.06),
  yawn: p('yawn', 0.5, 0.04),
  snore: p('snore', 0.55, 0.03),
  stretch: p('stretch', 0.55, 0.02),
  sneeze: p('sneeze', 0.45, 0.06),
  sneezeBig: p('sneeze_big', 0.7, 0.03),
  shiver: p('shiver', 0.35, 0.08),
  scarf: p('scarf', 0.65, 0),
  /** un guaio curato: ogni cura un po' più acuta della precedente */
  cured: (i: number): void => sound.play(PACK, 'cured', { vol: 0.8, jitter: 0, rate: Math.pow(2, [0, 2, 4, 7][i % 4] / 12) }),
  star: p('star', 0.6, 0),
  party: p('party', 0.75, 0),
  garden: p('garden', 0.7, 0),
  ball: p('ball', 0.55, 0.1),
  voice: (id: PetId): void => sound.play(PACK, `voice_${id}`, { vol: 0.85, jitter: 0.05 }),
};
