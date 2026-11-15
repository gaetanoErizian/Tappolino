import { Store } from '../../core/storage';
import { sanitizeCreations, type Creation } from './recipes';

/** Progressi di Pasticceria Magica (chiave "tappolino.pasticceria"). Lingua, muto e acquisto sono nello stato dell'app. */
export interface SaveData {
  /** dolci serviti: decide ricette, decorazioni e colori sbloccati */
  served: number;
  /** ultimi dolci creati, in vetrina */
  creations: Creation[];
  /** ultima ricetta scelta */
  recipe: string;
  /** ultimo cliente (per non ripeterlo) */
  customer: string;
  tutorialDone: boolean;
}

export const DEFAULT_SAVE: SaveData = {
  served: 0,
  creations: [],
  recipe: 'cupcake',
  customer: '',
  tutorialDone: false,
};

class PasticceriaStore extends Store<SaveData> {
  /** Dopo il caricamento ripulisce la vetrina da eventuali dati non validi. */
  override async load(): Promise<SaveData> {
    const s = await super.load();
    const clean = sanitizeCreations(s.creations);
    if (JSON.stringify(clean) !== JSON.stringify(s.creations)) this.update({ creations: clean });
    return this.state as SaveData;
  }
}

export const save = new PasticceriaStore('tappolino.pasticceria', DEFAULT_SAVE);
