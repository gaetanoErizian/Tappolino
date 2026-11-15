import { sound } from '../../core/sound';
import type { AnimalId } from './logic';
import themeOgg from './audio/theme.ogg?url';
import themeMp3 from './audio/theme.mp3?url';

/**
 * Musica ed effetti di Treno degli Animali: file audio preparati offline con strumenti campionati
 * (scripts/audio/treno_music.py e treno_sfx.py), suonati dal lettore comune core/sound (pacchetto "treno").
 * I volumi relativi degli effetti si regolano qui.
 */

export const PACK = 'treno';

/** Durata esatta del loop della musica: deve coincidere con quella stampata da treno_music.py. */
export const THEME_LOOP = 64;

const SFX_FILES = import.meta.glob('./audio/sfx_*.mp3', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
/** nome dell'effetto → URL del file */
export const SFX_URLS: Record<string, string> = Object.fromEntries(
  Object.entries(SFX_FILES).map(([p, url]) => [p.replace(/^.*sfx_(.+)\.mp3$/, '$1'), url]),
);

/** Registra il pacchetto audio (una volta sola, prima del preload del modulo). */
export function registerTrenoSound(): void {
  sound.register(PACK, { music: { ogg: themeOgg, mp3: themeMp3, loop: THEME_LOOP }, sfx: SFX_URLS });
}

/** Avvia (o tiene in corso) la musica del gioco: ogni scena la chiama all'apertura. */
export function playTrenoMusic(): void {
  sound.playMusic(PACK);
}

const p = (name: string, vol: number, jitter = 0.04) => (): void => sound.play(PACK, name, { vol, jitter });
/** Scala maggiore: 1, 2, 3, 4, 5 salgono di nota (per contare). */
const STEP = [0, 2, 4, 5, 7, 9, 11, 12];

/** Effetti usati dal gioco (ogni nome ha il suo file sfx_<nome>.mp3). */
export const SFX_NAMES = [
  'pick', 'back', 'nope', 'board', 'full', 'count', 'bell', 'whistle', 'chuff', 'brake', 'depart', 'party', 'station', 'star', 'hop', 'pop',
  'voice_cow', 'voice_pig', 'voice_sheep', 'voice_hen', 'voice_horse',
  'voice_monkey', 'voice_elephant', 'voice_giraffe', 'voice_lion', 'voice_parrot',
  'voice_penguin', 'voice_polarbear', 'voice_seal', 'voice_walrus', 'voice_puffin',
] as const;

export const sfx = {
  pick: p('pick', 0.6, 0.06),
  back: p('back', 0.5),
  /** vagone sbagliato: nota gentile dell'armonica, mai un "errore" */
  nope: p('nope', 0.55, 0.02),
  /** un animale seduto: ogni passeggero una nota più su */
  board: (i: number): void => sound.play(PACK, 'board', { vol: 0.75, jitter: 0, rate: Math.pow(2, STEP[i % STEP.length] / 12) }),
  full: p('full', 0.7, 0),
  /** si conta: 1, 2, 3, 4, 5 */
  count: (n: number): void => sound.play(PACK, 'count', { vol: 0.8, jitter: 0, rate: Math.pow(2, STEP[Math.max(0, n - 1) % STEP.length] / 12) }),
  bell: p('bell', 0.55, 0),
  whistle: p('whistle', 0.7, 0.02),
  chuff: p('chuff', 0.32, 0.12),
  brake: p('brake', 0.4, 0.04),
  depart: p('depart', 0.6, 0),
  party: p('party', 0.75, 0),
  station: p('station', 0.8, 0),
  star: p('star', 0.6, 0),
  hop: p('hop', 0.45, 0.08),
  pop: p('pop', 0.5, 0.1),
  voice: (id: AnimalId): void => sound.play(PACK, `voice_${id}`, { vol: 0.85, jitter: 0.05 }),
};
