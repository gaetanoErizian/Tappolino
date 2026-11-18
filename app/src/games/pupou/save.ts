import { Store } from '../../core/storage';
import { DEFAULT_GAME, sanitize, resume, type Game } from './logic';

/** Progressi di Pupou (chiave "tappolino.pupou"): bisogni, crescita, dispensa, armadio, amici. */
class PupouStore extends Store<Game> {
  override async load(): Promise<Game> {
    const raw = await super.load();
    this.update(resume(sanitize(raw), Date.now()));
    return this.state as Game;
  }
  /** Sostituisce tutto lo stato (le azioni della logica restituiscono sempre un Game completo). */
  set(g: Game): void { this.update({ ...g, last: Date.now() }); }
}

export const save = new PupouStore('tappolino.pupou', DEFAULT_GAME);
