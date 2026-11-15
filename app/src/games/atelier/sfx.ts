import { sound } from '../../core/sound';
import themeOgg from './audio/theme.ogg?url';
import themeMp3 from './audio/theme.mp3?url';

/**
 * Musica ed effetti dell'Atelier delle Principesse: file audio preparati offline con strumenti campionati
 * (scripts/audio/atelier_music.py e atelier_sfx.py), suonati dal lettore comune core/sound (pacchetto "atelier").
 * I volumi relativi degli effetti si regolano qui.
 */

export const PACK = 'atelier';

/** Durata esatta del loop della musica: deve coincidere con quella stampata da atelier_music.py. */
export const THEME_LOOP = 60;

const SFX_FILES = import.meta.glob('./audio/sfx_*.mp3', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
/** nome dell'effetto → URL del file */
export const SFX_URLS: Record<string, string> = Object.fromEntries(
  Object.entries(SFX_FILES).map(([p, url]) => [p.replace(/^.*sfx_(.+)\.mp3$/, '$1'), url]),
);

/** Registra il pacchetto audio (una volta sola, prima del preload del modulo). */
export function registerAtelierSound(): void {
  sound.register(PACK, { music: { ogg: themeOgg, mp3: themeMp3, loop: THEME_LOOP }, sfx: SFX_URLS });
}

/** Avvia (o tiene in corso) la musica del gioco: ogni scena la chiama all'apertura. */
export function playAtelierMusic(): void {
  sound.playMusic(PACK);
}

const p = (name: string, vol: number, jitter = 0.04) => (): void => sound.play(PACK, name, { vol, jitter });

/** Effetti usati dal gioco (ogni nome ha il suo file sfx_<nome>.mp3). */
export const SFX_NAMES = [
  'pick', 'wear', 'swish', 'back', 'off', 'tab', 'twirl', 'hop', 'step', 'flash', 'applause', 'fanfare', 'gift', 'open', 'sparkle', 'choose',
] as const;

export const sfx = {
  /** si prende un capo dalla vetrina */
  pick: p('pick', 0.55, 0.06),
  /** un capo va addosso: ogni capo un po' più acuto del precedente (scala di Re maggiore) */
  wear: (i: number): void => sound.play(PACK, 'wear', { vol: 0.75, jitter: 0, rate: Math.pow(2, [0, 2, 4, 7, 9, 12][Math.min(5, i)] / 12) }),
  /** fruscio di stoffa */
  swish: p('swish', 0.5, 0.12),
  /** il capo torna in vetrina */
  back: p('back', 0.45),
  /** un capo si toglie */
  off: p('off', 0.55, 0.03),
  tab: p('tab', 0.55, 0.03),
  twirl: p('twirl', 0.65, 0.03),
  hop: p('hop', 0.45, 0.08),
  step: p('step', 0.35, 0.12),
  flash: p('flash', 0.7, 0),
  applause: p('applause', 0.5, 0),
  fanfare: p('fanfare', 0.7, 0),
  gift: p('gift', 0.6, 0.05),
  open: p('open', 0.8, 0),
  sparkle: p('sparkle', 0.6, 0.05),
  choose: p('choose', 0.6, 0.02),
};
