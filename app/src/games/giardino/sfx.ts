import { sound } from '../../core/sound';
import { noteRate, type FlowerId } from './logic';
import themeOgg from './audio/theme.ogg?url';
import themeMp3 from './audio/theme.mp3?url';

/**
 * Musica ed effetti del Giardino delle Fate: file audio preparati offline con strumenti campionati
 * (scripts/audio/giardino_music.py e giardino_sfx.py), suonati dal lettore comune core/sound (pacchetto "giardino").
 * I volumi relativi degli effetti si regolano qui.
 */

export const PACK = 'giardino';

/** Durata esatta del loop della musica: deve coincidere con quella stampata da giardino_music.py. */
export const THEME_LOOP = 64;

const SFX_FILES = import.meta.glob('./audio/sfx_*.mp3', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
/** nome dell'effetto → URL del file */
export const SFX_URLS: Record<string, string> = Object.fromEntries(
  Object.entries(SFX_FILES).map(([p, url]) => [p.replace(/^.*sfx_(.+)\.mp3$/, '$1'), url]),
);

/** Registra il pacchetto audio (una volta sola, prima del preload del modulo). */
export function registerGiardinoSound(): void {
  sound.register(PACK, { music: { ogg: themeOgg, mp3: themeMp3, loop: THEME_LOOP }, sfx: SFX_URLS });
}

/** Avvia (o tiene in corso) la musica del gioco: ogni scena la chiama all'apertura. */
export function playGiardinoMusic(): void {
  sound.playMusic(PACK);
}

const p = (name: string, vol: number, jitter = 0.04) => (): void => sound.play(PACK, name, { vol, jitter });

/** Effetti usati dal gioco (ogni nome ha il suo file sfx_<nome>.mp3). */
export const SFX_NAMES = [
  'plant', 'rain', 'grow', 'bloom', 'sing', 'thirsty', 'cloud', 'fairy', 'giggle', 'flutter', 'twinkle', 'bed_done', 'page', 'pop',
] as const;

export const sfx = {
  /** il seme cade nella terra */
  plant: p('plant', 0.7, 0.05),
  /** la nuvola fa piovere */
  rain: p('rain', 0.6, 0.03),
  /** germoglio o bocciolo che spunta (un po' più acuto a ogni passo) */
  grow: (stage: number): void => sound.play(PACK, 'grow', { vol: 0.7, jitter: 0, rate: Math.pow(2, [0, 0, 0, 4, 7][stage] / 12) }),
  /** il fiore sboccia */
  bloom: p('bloom', 0.8, 0),
  /** il fiore canta la sua nota (scala pentatonica: insieme non stonano mai) */
  sing: (id: FlowerId, vol = 0.75, delay = 0): void => sound.play(PACK, 'sing', { vol, jitter: 0, rate: noteRate(id), delay }),
  /** "ho sete": la piantina chiede la pioggia */
  thirsty: p('thirsty', 0.55, 0.05),
  /** tocco sulla nuvola senza niente da innaffiare */
  cloud: p('cloud', 0.6, 0.06),
  /** arriva una fatina */
  fairy: p('fairy', 0.8, 0),
  /** fatina toccata: risatina */
  giggle: p('giggle', 0.6, 0.06),
  /** farfalla toccata */
  flutter: p('flutter', 0.5, 0.08),
  /** lucciola o scintilla */
  twinkle: p('twinkle', 0.45, 0.12),
  /** aiuola piena */
  bedDone: p('bed_done', 0.85, 0),
  /** passaggio a un'altra aiuola */
  page: p('page', 0.55, 0.03),
  /** cartoncino dell'album */
  pop: p('pop', 0.6, 0.06),
};
