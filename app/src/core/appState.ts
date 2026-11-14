import { Store } from './storage';
import { audio } from './audio';

/**
 * Stato condiviso dell'app (chiave "tappolino.app"), gestito dal core:
 * acquisto unico, lingua scelta dal genitore, muto.
 * I progressi dei giochi stanno in chiavi separate "tappolino.<id>".
 */
export interface AppState {
  unlocked: boolean;
  muted: boolean;
  lang: string;
}

export const APP_STATE_DEFAULTS: AppState = { unlocked: false, muted: false, lang: '' };
export const appState = new Store<AppState>('tappolino.app', APP_STATE_DEFAULTS);

type Listener = (unlocked: boolean) => void;
const listeners: Listener[] = [];

export const isUnlocked = (): boolean => appState.state.unlocked;

/** Cambia lo stato di sblocco (acquisto, ripristino, verifica all'avvio) e avvisa chi ascolta. */
export function setUnlocked(v: boolean): void {
  if (appState.state.unlocked === v) return;
  appState.update({ unlocked: v });
  void appState.flush();
  listeners.forEach((l) => l(v));
}

export function onUnlockChange(l: Listener): () => void {
  listeners.push(l);
  return () => { const i = listeners.indexOf(l); if (i >= 0) listeners.splice(i, 1); };
}

export const isMuted = (): boolean => appState.state.muted;

export function setMuted(m: boolean): void {
  appState.update({ muted: m });
  audio.setMuted(m);
}

export function toggleMute(): boolean {
  setMuted(!appState.state.muted);
  return appState.state.muted;
}
