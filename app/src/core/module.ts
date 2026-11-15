import type Phaser from 'phaser';
import type { SvgTex } from './textures';
import type { Dict, Lang } from './i18n';

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
  /** chiamata una volta al primo avvio del gioco: es. caricare i salvataggi */
  init?: () => Promise<void>;
  /**
   * Caricamenti lunghi del gioco (es. file audio con core/sound), mostrati nel loader Tappolino:
   * chiamare `report` con l'avanzamento 0..1. Un errore qui non impedisce di giocare.
   */
  preload?: (report: (p: number) => void) => Promise<void>;
}

/** Voce di menu di un gioco, come la vede l'app. */
export interface GameEntry {
  id: string;
  /** true solo per i 3 giochi gratis (decisione 2) */
  free: boolean;
  /** posizione nel menu (numero del gioco nella roadmap: 1, 2, 3…) */
  order: number;
  /** titolo del gioco nelle 6 lingue */
  titles: Record<Lang, string>;
  /** chiave del titolo nei testi dell'app ("games.<id>"): la calcola il registro, non va scritta in entry.ts */
  titleKey: string;
  /** colore della tessera nel menu */
  color: string;
  /** illustrazione della tessera (leggera: niente codice del gioco) */
  tile: () => SvgTex;
  load: () => Promise<{ default: GameModule }>;
}

/** Quello che `games/<id>/entry.ts` esporta di default. */
export type GameEntryDef = Omit<GameEntry, 'titleKey'>;

/** Un gioco è "in arrivo" se è nell'elenco della configurazione e la regola è attiva (vedi src/release.ts). */
export function comingSoon(id: string, list: readonly string[], active: boolean): boolean {
  return active && list.includes(id);
}

/** Un gioco si può aprire se è gratis o se l'acquisto unico è attivo. */
export function canPlay(entry: Pick<GameEntry, 'free'>, unlocked: boolean): boolean {
  return entry.free || unlocked;
}
