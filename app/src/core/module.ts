import type Phaser from 'phaser';
import type { SvgTex } from './textures';
import type { Dict, Lang } from './i18n';
import type { Song } from './audio';

/**
 * Contratto di un modulo gioco (docs/05-STRATEGIA-E-ROADMAP.md).
 * `games/<id>/index.ts` esporta di default un GameModule; `games/registry.ts` elenca le voci
 * leggere (tessera, titolo, gratis/bloccato) e carica il modulo solo quando il gioco viene aperto.
 */
export interface GameModule {
  id: string;
  /** texture del gioco (rasterizzate al primo avvio del gioco) */
  textures: () => SvgTex[];
  /** testi del gioco nelle 6 lingue, chiavi prefissate "<id>." */
  locales: Record<Lang, Dict>;
  /** scene Phaser con chiavi prefissate "<id>:" */
  scenes: Phaser.Types.Scenes.SceneType[];
  /** scena da cui parte il gioco (di solito "<id>:Menu") */
  startScene: string;
  /** musica del gioco */
  song?: Song;
}

export interface GameEntry {
  id: string;
  /** true solo per i 3 giochi gratis (decisione 2) */
  free: boolean;
  /** chiave del titolo nei testi dell'app (es. "games.pompieri") */
  titleKey: string;
  /** colore della tessera nel menu */
  color: string;
  /** illustrazione della tessera (leggera: niente codice del gioco) */
  tile: () => SvgTex;
  load: () => Promise<{ default: GameModule }>;
}

/** Un gioco si può aprire se è gratis o se l'acquisto unico è attivo. */
export function canPlay(entry: Pick<GameEntry, 'free'>, unlocked: boolean): boolean {
  return entry.free || unlocked;
}
