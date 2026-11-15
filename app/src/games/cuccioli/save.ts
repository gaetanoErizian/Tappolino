import { Store } from '../../core/storage';
import { sanitizeCured } from './logic';

/** Progressi di Cuccioli dal Dottore (chiave "tappolino.cuccioli"). Lingua, muto e acquisto sono nello stato dell'app. */
export interface SaveData {
  /** giardino: cuccioli curati, in ordine di arrivo */
  cured: string[];
  /** visite completate (fa crescere piano la difficoltà) */
  visits: number;
  /** ultimo cucciolo curato (per non ripeterlo subito ad album completo) */
  last: string;
  /** manina del primo trascinamento già vista */
  tutorialDone: boolean;
}

export const DEFAULT_SAVE: SaveData = { cured: [], visits: 0, last: '', tutorialDone: false };

class CuccioliStore extends Store<SaveData> {
  /** Dopo il caricamento ripulisce il giardino da eventuali dati non validi. */
  override async load(): Promise<SaveData> {
    const s = await super.load();
    const clean = sanitizeCured(s.cured);
    if (JSON.stringify(clean) !== JSON.stringify(s.cured)) this.update({ cured: clean });
    if (!Number.isFinite(s.visits) || s.visits < 0) this.update({ visits: 0 });
    return this.state as SaveData;
  }
}

export const save = new CuccioliStore('tappolino.cuccioli', DEFAULT_SAVE);
