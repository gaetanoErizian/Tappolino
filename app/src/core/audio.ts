/**
 * Stato del muto, condiviso da tutta l'app.
 * Il muto è persistente (lo salva core/appState) e lo applica il lettore audio comune core/sound.
 * La vecchia sintesi in tempo reale è stata tolta: musica e suoni sono file audio con strumenti veri.
 */
class AudioState {
  private _muted = false;

  get muted(): boolean { return this._muted; }

  setMuted(m: boolean): void { this._muted = m; }
}

export const audio = new AudioState();
