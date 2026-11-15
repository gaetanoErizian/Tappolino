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

/** Tutto aperto: acquisto fatto, oppure modalità prova attiva (vedi sotto). */
export const isUnlocked = (): boolean => appState.state.unlocked || tester;

/** true solo se l'acquisto risulta davvero fatto (la modalità prova non conta). */
export const isPurchased = (): boolean => appState.state.unlocked;

/** Cambia lo stato di sblocco (acquisto, ripristino, verifica all'avvio) e avvisa chi ascolta. */
export function setUnlocked(v: boolean): void {
  if (appState.state.unlocked === v) return;
  appState.update({ unlocked: v });
  void appState.flush();
  listeners.forEach((l) => l(isUnlocked()));
}

/**
 * MODALITÀ PROVA — per chi collauda l'app, non per chi la usa.
 * Apre tutti i giochi (anche quelli bloccati) senza acquisto e senza toccare lo stato dell'acquisto vero.
 * Esiste SOLO sul web di prova e nelle build compilate con VITE_TESTER=1: nelle build per gli store
 * `testerAvailable()` è false e niente può attivarla (decisione 25).
 * Si attiva nell'area genitori toccando 5 volte la riga della versione, oppure sul web con #prova.
 * Quando è attiva un'etichetta "PROVA" resta sempre visibile sullo schermo.
 */
const TESTER_KEY = 'tappolino.tester';
let tester = false;

export function testerAvailable(): boolean {
  let native = false;
  try { native = !!(globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.(); } catch { /* web */ }
  return !native || import.meta.env?.VITE_TESTER === '1';
}

export const isTester = (): boolean => tester;

/** Da chiamare all'avvio: ripristina la modalità prova se era attiva. */
export function loadTester(): void {
  if (!testerAvailable()) { tester = false; return; }
  try { tester = globalThis.localStorage?.getItem(TESTER_KEY) === '1'; } catch { tester = false; }
  renderTesterBadge();
}

export function setTester(v: boolean): void {
  const next = v && testerAvailable();
  if (tester === next) return;
  tester = next;
  try { next ? globalThis.localStorage?.setItem(TESTER_KEY, '1') : globalThis.localStorage?.removeItem(TESTER_KEY); } catch { /* solo memoria */ }
  renderTesterBadge();
  listeners.forEach((l) => l(isUnlocked()));
}

function renderTesterBadge(): void {
  if (typeof document === 'undefined' || !document.body) return;
  let b = document.getElementById('tp-tester');
  if (!tester) { b?.remove(); return; }
  if (!b) {
    b = document.createElement('div');
    b.id = 'tp-tester';
    b.textContent = 'PROVA';
    b.style.cssText = 'position:fixed;top:calc(env(safe-area-inset-top) + 4px);left:50%;transform:translateX(-50%);z-index:150;pointer-events:none;'
      + 'padding:2px 12px;border-radius:999px;border:3px solid #2b2140;background:#ffc800;color:#2b2140;font:700 13px/1.3 "Fredoka",system-ui,sans-serif;letter-spacing:1.5px';
    document.body.appendChild(b);
  }
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
