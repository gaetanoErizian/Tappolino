import { Store } from '../../core/storage';
import { DEFAULT_GAME, sanitize, resume, type Game } from './logic';

/** Progressi di Cacchino (chiave "tappolino.cacchino"): bisogni, crescita, dispensa, armadio, amici. */
class CacchinoStore extends Store<Game> {
  override async load(): Promise<Game> {
    const raw = await super.load();
    this.update(resume(sanitize(raw), Date.now()));
    return this.state as Game;
  }
  /** Sostituisce tutto lo stato (le azioni della logica restituiscono sempre un Game completo). */
  set(g: Game): void { this.update({ ...g, last: Date.now() }); }
}

export const save = new CacchinoStore('tappolino.cacchino', DEFAULT_GAME);
