import { Store } from '../../core/storage';
import { sanitizeFound } from './dinos';

/** Progressi di Scavo dei Dinosauri (chiave "tappolino.dinosauri"). Lingua, muto e acquisto sono nello stato dell'app. */
export interface SaveData {
  /** album: dinosauri scoperti, in ordine di scoperta */
  found: string[];
  /** scavi completati */
  digs: number;
  /** ultimo dinosauro scavato (per non ripeterlo ad album completo) */
  last: string;
  /** manina dello strofinare già vista */
  tutorialDig: boolean;
  /** manina del montaggio già vista */
  tutorialBuild: boolean;
}

export const DEFAULT_SAVE: SaveData = { found: [], digs: 0, last: '', tutorialDig: false, tutorialBuild: false };

class DinosauriStore extends Store<SaveData> {
  /** Dopo il caricamento ripulisce l'album da eventuali dati non validi. */
  override async load(): Promise<SaveData> {
    const s = await super.load();
    const clean = sanitizeFound(s.found);
    if (JSON.stringify(clean) !== JSON.stringify(s.found)) this.update({ found: clean });
    return this.state as SaveData;
  }
}

export const save = new DinosauriStore('tappolino.dinosauri', DEFAULT_SAVE);
