import { sound } from '../../core/sound';
import themeOgg from './audio/theme.ogg?url';
import themeMp3 from './audio/theme.mp3?url';

/**
 * Musica ed effetti di Pupou: file audio preparati offline (scripts/audio/pupou_music.py e pupou_sfx.py),
 * suonati dal lettore comune core/sound (pacchetto "pupou"). Le puzzette sono tube, tromboni e fagotti con glissando
 * più una "pernacchia" sintetizzata offline: buffe, mai volgari.
 */
export const PACK = 'pupou';
/** Durata esatta del loop della musica: deve coincidere con quella stampata da pupou_music.py. */
export const THEME_LOOP = 48;

const SFX_FILES = import.meta.glob('./audio/sfx_*.mp3', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
export const SFX_URLS: Record<string, string> = Object.fromEntries(
  Object.entries(SFX_FILES).map(([p, url]) => [p.replace(/^.*sfx_(.+)\.mp3$/, '$1'), url]),
);

export function registerPupouSound(): void {
  sound.register(PACK, { music: { ogg: themeOgg, mp3: themeMp3, loop: THEME_LOOP }, sfx: SFX_URLS });
}
export function playPupouMusic(): void { sound.playMusic(PACK); }

const p = (name: string, vol: number, jitter = 0.04) => (): void => sound.play(PACK, name, { vol, jitter });

export const SFX_NAMES = [
  'fart_s', 'fart_m', 'fart_l', 'fart_mega', 'burp', 'chomp', 'gulp', 'giggle', 'sad', 'yawn', 'snore', 'scrub', 'shower', 'pop', 'coin', 'buy',
  'nope', 'tap', 'slide', 'flush', 'rumble', 'levelup', 'win', 'star', 'bell', 'buzz', 'grow', 'step', 'drop', 'hello',
] as const;

export const sfx = {
  /** puzzetta: 1 piccola, 2 media, 3 gigante */
  fart: (size: number): void => sound.play(PACK, size >= 3 ? 'fart_mega' : size === 2 ? (Math.random() < 0.5 ? 'fart_l' : 'fart_m') : (Math.random() < 0.5 ? 'fart_s' : 'fart_m'), { vol: 0.9, jitter: 0.12 }),
  burp: p('burp', 0.8, 0.1),
  chomp: p('chomp', 0.7, 0.08),
  gulp: p('gulp', 0.7, 0.08),
  giggle: p('giggle', 0.7, 0.06),
  sad: p('sad', 0.5, 0.03),
  yawn: p('yawn', 0.6, 0.03),
  snore: p('snore', 0.5, 0.04),
  scrub: p('scrub', 0.55, 0.12),
  shower: p('shower', 0.6, 0),
  pop: p('pop', 0.5, 0.15),
  coin: p('coin', 0.6, 0.03),
  buy: p('buy', 0.7, 0.02),
  nope: p('nope', 0.5, 0.02),
  tap: p('tap', 0.5, 0.06),
  slide: p('slide', 0.45, 0.1),
  flush: p('flush', 0.7, 0),
  rumble: p('rumble', 0.6, 0.06),
  levelup: p('levelup', 0.8, 0),
  win: p('win', 0.8, 0),
  star: p('star', 0.6, 0),
  bell: p('bell', 0.6, 0),
  buzz: p('buzz', 0.3, 0.08),
  grow: p('grow', 0.8, 0),
  hello: p('hello', 0.7, 0.08),
  /** passo sulla piastrella: ogni passo un po' più acuto */
  step: (i: number): void => sound.play(PACK, 'step', { vol: 0.55, jitter: 0, rate: Math.pow(2, ([0, 2, 4, 5, 7, 9, 11, 12][i % 8] + 12 * Math.floor((i % 16) / 8)) / 12) }),
  drop: p('drop', 0.6, 0.08),
};
