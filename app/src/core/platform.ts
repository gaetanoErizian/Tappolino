import { Capacitor } from '@capacitor/core';

export type Platform = 'android' | 'ios' | 'web';

/** Piattaforma corrente: 'android' | 'ios' | 'web'. */
export function platform(): Platform {
  const p = Capacitor.getPlatform();
  return p === 'android' || p === 'ios' ? p : 'web';
}

export const isNative = (): boolean => platform() !== 'web';

/**
 * Parametri URL (solo web di test: ?banner=1, ?lang=en, ?reset=1, ?lock=1, ?unlock=1, ?game=<id>).
 * Dove la query string non arriva (pagina pubblicata su claude.ai) vale anche l'hash: #lock, #unlock, #reset.
 */
export function urlParam(name: string): string | null {
  try {
    const v = new URLSearchParams(window.location.search).get(name);
    if (v !== null) return v;
    return window.location.hash.slice(1) === name ? '1' : null;
  } catch {
    return null;
  }
}
