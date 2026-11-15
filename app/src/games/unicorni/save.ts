import { Store } from '../../core/storage';
import { sanitizeLooks, sanitizeGroomed, type Look } from './salon';

/** Progressi del Salone degli Unicorni (chiave "tappolino.unicorni"). Lingua, muto e acquisto sono nello stato dell'app. */
export interface SaveData {
  /** foto ricordo scattate: decide unicorni, colori e accessori sbloccati */
  visits: number;
  /** ultime foto, nell'album (la più recente per prima) */
  photos: Look[];
  /** unicorni pettinati almeno una volta */
  groomed: string[];
  /** ultimo unicorno venuto al salone (per non ripeterlo) */
  last: string;
  /** manine d'aiuto già viste */
  tutorialDone: boolean;
}

export const DEFAULT_SAVE: SaveData = { visits: 0, photos: [], groomed: [], last: '', tutorialDone: false };

class UnicorniStore extends Store<SaveData> {
  /** Dopo il caricamento ripulisce album ed elenco da eventuali dati non validi. */
  override async load(): Promise<SaveData> {
    const s = await super.load();
    const photos = sanitizeLooks(s.photos), groomed = sanitizeGroomed(s.groomed);
    const visits = Number.isFinite(s.visits) ? Math.max(0, Math.floor(s.visits)) : 0;
    if (JSON.stringify(photos) !== JSON.stringify(s.photos) || JSON.stringify(groomed) !== JSON.stringify(s.groomed) || visits !== s.visits) {
      this.update({ photos, groomed, visits });
    }
    return this.state as SaveData;
  }
}

export const save = new UnicorniStore('tappolino.unicorni', DEFAULT_SAVE);
