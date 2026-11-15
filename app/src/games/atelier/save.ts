import { Store } from '../../core/storage';
import { sanitizeAlbum, sanitizeLook, type Look } from './logic';

/** Progressi dell'Atelier delle Principesse (chiave "tappolino.atelier"). Lingua, muto e acquisto sono nello stato dell'app. */
export interface SaveData {
  /** sfilate fatte: decidono le sorprese sbloccate */
  shows: number;
  /** galleria dei ritratti (gli ultimi 6, il più recente per primo) */
  album: Look[];
  /** ultimo look in sfilata (si vede nel menu); null all'inizio */
  last: Look | null;
  /** manina del primo trascinamento già vista */
  tutorialDone: boolean;
}

export const DEFAULT_SAVE: SaveData = { shows: 0, album: [], last: null, tutorialDone: false };

class AtelierStore extends Store<SaveData> {
  /** Dopo il caricamento ripulisce i dati non validi (aggiornamenti, salvataggi rovinati). */
  override async load(): Promise<SaveData> {
    const s = await super.load();
    const album = sanitizeAlbum(s.album);
    const last = sanitizeLook(s.last);
    const shows = Number.isFinite(s.shows) && s.shows > 0 ? Math.floor(s.shows) : 0;
    if (JSON.stringify(album) !== JSON.stringify(s.album) || JSON.stringify(last) !== JSON.stringify(s.last) || shows !== s.shows) {
      this.update({ album, last, shows });
    }
    return this.state as SaveData;
  }
}

export const save = new AtelierStore('tappolino.atelier', DEFAULT_SAVE);
