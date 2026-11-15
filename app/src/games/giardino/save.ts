import { Store } from '../../core/storage';
import { BEDS, emptyGarden, isFlowerId, sanitizeGarden, type FlowerId, type Garden } from './logic';

/** Progressi del Giardino delle Fate (chiave "tappolino.giardino"). Lingua, muto e acquisto sono nello stato dell'app. */
export interface SaveData {
  /** le 3 aiuole con i loro vasi: è la collezione, resta per sempre */
  garden: Garden;
  /** ultimo fiore piantato (per non ripeterlo subito) */
  last: FlowerId | '';
  /** manina del primo seme già vista */
  tutorialDone: boolean;
}

export const DEFAULT_SAVE: SaveData = { garden: emptyGarden(), last: '', tutorialDone: false };

class GiardinoStore extends Store<SaveData> {
  /** Dopo il caricamento ripulisce il giardino da eventuali dati non validi. */
  override async load(): Promise<SaveData> {
    const s = await super.load();
    const clean = sanitizeGarden(s.garden);
    if (JSON.stringify(clean) !== JSON.stringify(s.garden) || clean.length !== BEDS) this.update({ garden: clean });
    if (s.last !== '' && !isFlowerId(s.last)) this.update({ last: '' });
    return this.state as SaveData;
  }
}

export const save = new GiardinoStore('tappolino.giardino', DEFAULT_SAVE);
