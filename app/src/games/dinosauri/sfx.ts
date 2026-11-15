import { sound } from '../../core/sound';
import type { DinoId } from './dinos';
import { dinoById } from './dinos';
import themeOgg from './audio/theme.ogg?url';
import themeMp3 from './audio/theme.mp3?url';

/**
 * Musica ed effetti di Scavo dei Dinosauri: file audio preparati offline con strumenti campionati
 * (scripts/audio/dinosauri_music.py e dinosauri_sfx.py), suonati dal lettore comune core/sound (pacchetto "dinosauri").
 * I volumi relativi degli effetti si regolano qui.
 */

export const PACK = 'dinosauri';

/** Durata esatta del loop della musica: deve coincidere con quella stampata da dinosauri_music.py. */
export const THEME_LOOP = 64;

const SFX_FILES = import.meta.glob('./audio/sfx_*.mp3', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
/** nome dell'effetto → URL del file */
export const SFX_URLS: Record<string, string> = Object.fromEntries(
  Object.entries(SFX_FILES).map(([p, url]) => [p.replace(/^.*sfx_(.+)\.mp3$/, '$1'), url]),
);

/** Registra il pacchetto audio (una volta sola, prima del preload del modulo). */
export function registerDinosauriSound(): void {
  sound.register(PACK, { music: { ogg: themeOgg, mp3: themeMp3, loop: THEME_LOOP }, sfx: SFX_URLS });
}

/** Avvia (o tiene in corso) la musica del gioco: ogni scena la chiama all'apertura. */
export function playDinosauriMusic(): void {
  sound.playMusic(PACK);
}

const p = (name: string, vol: number, jitter = 0.04) => (): void => sound.play(PACK, name, { vol, jitter });

/** Effetti usati dal gioco (ogni nome ha il suo file sfx_<nome>.mp3). */
export const SFX_NAMES = ['brush', 'crumble', 'found', 'treasure', 'pick', 'back', 'snap', 'magic', 'poof', 'roar_big', 'roar_mid', 'roar_small', 'hop', 'thud', 'camera', 'fanfare', 'whoosh'] as const;

export const sfx = {
  brush: p('brush', 0.45, 0.14),
  crumble: p('crumble', 0.6, 0.08),
  found: p('found', 0.75, 0),
  treasure: p('treasure', 0.65, 0),
  pick: p('pick', 0.6, 0.06),
  back: p('back', 0.5),
  /** osso al suo posto: ogni pezzo un po' più acuto del precedente */
  snap: (i: number): void => sound.play(PACK, 'snap', { vol: 0.85, jitter: 0, rate: Math.pow(2, [0, 2, 4, 5, 7, 9][i % 6] / 12) }),
  magic: p('magic', 0.7, 0),
  poof: p('poof', 0.7, 0.06),
  roar: (id: DinoId): void => { const d = dinoById(id); sound.play(PACK, `roar_${d.roar}`, { vol: 0.9, jitter: 0.03, rate: d.rate }); },
  hop: p('hop', 0.55, 0.06),
  thud: p('thud', 0.7, 0.08),
  camera: p('camera', 0.7, 0),
  fanfare: p('fanfare', 0.7, 0),
  whoosh: p('whoosh', 0.4, 0.1),
};
