import { sound } from '../../core/sound';
import type { SirenKind } from './levels';
import themeOgg from './audio/theme.ogg?url';
import themeMp3 from './audio/theme.mp3?url';

/**
 * Musica ed effetti di Pompieri in Azione: file audio preparati offline (scripts/audio/pompieri_music.py
 * e pompieri_sfx.py), suonati dal lettore comune core/sound (pacchetto "pompieri").
 * I volumi relativi degli effetti si regolano qui.
 */

export const PACK = 'pompieri';

/** Durata esatta del loop della musica: deve coincidere con quella stampata da pompieri_music.py. */
export const THEME_LOOP = 61.935484;

const SFX_FILES = import.meta.glob('./audio/sfx_*.mp3', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
/** nome dell'effetto → URL del file */
export const SFX_URLS: Record<string, string> = Object.fromEntries(
  Object.entries(SFX_FILES).map(([p, url]) => [p.replace(/^.*sfx_(.+)\.mp3$/, '$1'), url]),
);

/** Registra il pacchetto audio (una volta sola, prima del preload del modulo). */
export function registerPompieriSound(): void {
  sound.register(PACK, { music: { ogg: themeOgg, mp3: themeMp3, loop: THEME_LOOP }, sfx: SFX_URLS });
}

/** Avvia (o tiene in corso) la musica del gioco: ogni scena di Pompieri la chiama all'apertura. */
export function playPompieriMusic(): void {
  sound.playMusic(PACK);
}

const p = (name: string, vol: number, jitter = 0.04) => (): void => sound.play(PACK, name, { vol, jitter });

/** Sirene: un suono per camion (levels.ts → TruckDef.siren). */
export const SIRENS: SirenKind[] = ['hilo', 'wail', 'yelp', 'honk', 'tune', 'space'];

export const sfx = {
  /** tocco (camion bloccato nel garage) */
  pop: p('pop', 0.8, 0.06),
  /** getto d'acqua del cannone */
  spray: p('spray', 0.6, 0.08),
  /** fiamma spenta: vapore + due note che salgono */
  extinguish: p('extinguish', 0.75, 0.03),
  /** una fiammella si accende (morbida, mai paurosa) */
  flameAppear: p('flameAppear', 0.45, 0.1),
  /** stellina che entra nella barra */
  star: p('star', 0.5, 0.05),
  /** miagolio del gattino */
  meow: p('meow', 0.65, 0.07),
  /** la scala si allunga */
  ladder: p('ladder', 0.8, 0.02),
  /** gattino salvo */
  hearts: p('hearts', 0.7, 0),
  /** livello completato */
  fanfare: p('fanfare', 0.8, 0),
  /** medaglia */
  medal: p('medal', 0.75, 0),
  /** camion nuovo che entra */
  whoosh: p('whoosh', 0.5, 0.08),
  /** sirena del camion */
  siren(kind: SirenKind): void {
    sound.play(PACK, `siren_${kind}`, { vol: kind === 'tune' ? 0.7 : 0.55, jitter: 0.01 });
  },
};
