import { Capacitor } from '@capacitor/core';

export type Platform = 'android' | 'ios' | 'web';

/** Piattaforma corrente: 'android' | 'ios' | 'web'. */
export function platform(): Platform {
  const p = Capacitor.getPlatform();
  return p === 'android' || p === 'ios' ? p : 'web';
}

export const isNative = (): boolean => platform() !== 'web';

/** Parametri URL (solo web, per i test: ?banner=1, ?lang=en, ?reset=1). */
export function urlParam(name: string): string | null {
  try {
    return new URLSearchParams(window.location.search).get(name);
  } catch {
    return null;
  }
}
