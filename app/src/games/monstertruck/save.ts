import { Store } from '../../core/storage';
import { usable, sanitizeTracks, isTrackId, type TrackId } from './parts';

/** Progressi dell'Officina dei Monster Truck (chiave "tappolino.monstertruck"). Lingua, muto e acquisto sono nello stato dell'app. */
export interface SaveData {
  /** gare finite (ognuna sblocca un pezzo o una pista) */
  races: number;
  /** stelle raccolte in tutto */
  stars: number;
  /** truck personalizzato */
  color: string;
  wheel: string;
  sticker: string;
  /** pista scelta (collezione delle piste) */
  track: string;
  /** piste già provate almeno una volta */
  raced: string[];
  /** visite in officina (la prima ha sempre gli stessi guasti) */
  visits: number;
  /** manina del "tieni premuto" in pista già vista e capita */
  tutorial: boolean;
  /** manina dei tocchi in officina già vista */
  garageTutorial: boolean;
}

export const DEFAULT_SAVE: SaveData = {
  races: 0, stars: 0, color: 'arancio', wheel: 'classica', sticker: 'stella', track: 'arena', raced: [], visits: 0, tutorial: false, garageTutorial: false,
};

class TruckStore extends Store<SaveData> {
  /** Dopo il caricamento ripulisce i dati non validi (pezzi sconosciuti o non ancora sbloccati). */
  override async load(): Promise<SaveData> {
    const s = await super.load();
    const races = Math.max(0, Math.floor(Number.isFinite(s.races) ? s.races : 0));
    const fixed: Partial<SaveData> = {
      races,
      stars: Math.max(0, Math.floor(Number.isFinite(s.stars) ? s.stars : 0)),
      visits: Math.max(0, Math.floor(Number.isFinite(s.visits) ? s.visits : 0)),
      color: usable('color', s.color, races),
      wheel: usable('wheel', s.wheel, races),
      sticker: usable('sticker', s.sticker, races),
      track: usable('track', s.track, races),
      raced: sanitizeTracks(s.raced),
    };
    if (Object.entries(fixed).some(([k, v]) => JSON.stringify(v) !== JSON.stringify((s as unknown as Record<string, unknown>)[k]))) this.update(fixed);
    return this.state as SaveData;
  }
}

export const save = new TruckStore('tappolino.monstertruck', DEFAULT_SAVE);

/** Pista valida per la gara (salvataggio o parametro). */
export const trackOr = (id: unknown, fallback: TrackId): TrackId => (isTrackId(id) ? id : fallback);
