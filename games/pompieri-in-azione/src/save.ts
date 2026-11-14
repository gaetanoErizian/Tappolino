import { Store } from './core/storage';

export interface SaveData {
  /** livelli completati = indice del prossimo livello */
  levelsDone: number;
  catsSaved: number;
  flamesOut: number;
  truck: string;
  muted: boolean;
  lang: string;
  adsRemoved: boolean;
  tutorialDone: boolean;
  catTutorialDone: boolean;
}

export const DEFAULT_SAVE: SaveData = {
  levelsDone: 0,
  catsSaved: 0,
  flamesOut: 0,
  truck: 'red',
  muted: false,
  lang: '',
  adsRemoved: false,
  tutorialDone: false,
  catTutorialDone: false,
};

export const save = new Store<SaveData>('pompieri.save.v1', DEFAULT_SAVE);
