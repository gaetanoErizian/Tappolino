import { Store } from '../../core/storage';
import { sanitizePlanets, usableRocket } from './planets';

/** Progressi di Razzo tra le Stelle (chiave "tappolino.razzo"). Lingua, muto e acquisto sono nello stato dell'app. */
export interface SaveData {
  /** pianeti visitati, in ordine di scoperta */
  visited: string[];
  /** viaggi completati (sbloccano i razzi) */
  trips: number;
  /** stelle raccolte in tutto */
  stars: number;
  /** razzo scelto nell'hangar */
  rocket: string;
  /** meta dell'ultimo viaggio (per non ripeterla a collezione completa) */
  last: string;
  /** manina del "tieni premuto" già vista e capita */
  tutorial: boolean;
}

export const DEFAULT_SAVE: SaveData = { visited: [], trips: 0, stars: 0, rocket: 'rosso', last: '', tutorial: false };

class RazzoStore extends Store<SaveData> {
  /** Dopo il caricamento ripulisce i dati non validi (pianeti sconosciuti, razzo non ancora sbloccato). */
  override async load(): Promise<SaveData> {
    const s = await super.load();
    const visited = sanitizePlanets(s.visited);
    const trips = Math.max(0, Math.floor(Number.isFinite(s.trips) ? s.trips : 0), visited.length);
    const stars = Math.max(0, Math.floor(Number.isFinite(s.stars) ? s.stars : 0));
    const rocket = usableRocket(s.rocket, trips);
    if (JSON.stringify(visited) !== JSON.stringify(s.visited) || trips !== s.trips || stars !== s.stars || rocket !== s.rocket) {
      this.update({ visited, trips, stars, rocket });
    }
    return this.state as SaveData;
  }
}

export const save = new RazzoStore('tappolino.razzo', DEFAULT_SAVE);
