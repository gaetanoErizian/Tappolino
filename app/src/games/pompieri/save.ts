import { Store } from '../../core/storage';

/** Progressi di Pompieri (chiave "tappolino.pompieri"). Lingua, muto e acquisto sono nello stato dell'app. */
export interface SaveData {
  /** livelli completati = indice del prossimo livello */
  levelsDone: number;
  catsSaved: number;
  flamesOut: number;
  truck: string;
  tutorialDone: boolean;
  catTutorialDone: boolean;
}

export const DEFAULT_SAVE: SaveData = {
  levelsDone: 0,
  catsSaved: 0,
  flamesOut: 0,
  truck: 'red',
  tutorialDone: false,
  catTutorialDone: false,
};

export const save = new Store<SaveData>('tappolino.pompieri', DEFAULT_SAVE);
