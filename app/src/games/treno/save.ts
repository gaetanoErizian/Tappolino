import { Store } from '../../core/storage';
import { sanitizeDelivered } from './logic';

/** Progressi di Treno degli Animali (chiave "tappolino.treno"). Lingua, muto e acquisto sono nello stato dell'app. */
export interface SaveData {
  /** viaggi completati (fa crescere piano la difficoltà: colori, forme, numeri) */
  trips: number;
  /** animali portati a casa, in ordine di arrivo (la collezione: le stazioni si sbloccano così) */
  delivered: string[];
  /** ultima stazione raggiunta */
  last: string;
  /** manina del primo trascinamento già vista */
  tutorialDone: boolean;
}

export const DEFAULT_SAVE: SaveData = { trips: 0, delivered: [], last: '', tutorialDone: false };

class TrenoStore extends Store<SaveData> {
  /** Dopo il caricamento ripulisce la collezione da eventuali dati non validi. */
  override async load(): Promise<SaveData> {
    const s = await super.load();
    const clean = sanitizeDelivered(s.delivered);
    if (JSON.stringify(clean) !== JSON.stringify(s.delivered)) this.update({ delivered: clean });
    if (!Number.isFinite(s.trips) || s.trips < 0) this.update({ trips: 0 });
    return this.state as SaveData;
  }
}

export const save = new TrenoStore('tappolino.treno', DEFAULT_SAVE);
