import { CONFIG } from './config';
import { isNative, platform, urlParam } from './core/platform';
import { isTester } from './core/appState';
import { comingSoon } from './core/module';

/**
 * Giochi "in arrivo" (decisioni 24 e 26): presenti nell'app ma non ancora pubblicati. Ogni aggiornamento ne apre uno
 * togliendolo da `CONFIG.comingSoon`. Non si aprono mai e non portano all'offerta.
 * - Android: si vedono nel menu con il nastro "In arrivo".
 * - iPhone e iPad: NON si vedono affatto. Apple respinge le app con contenuti "coming soon" (linea guida 2.1,
 *   completezza dell'app): lì il menu mostra solo i giochi pubblicati.
 * - Nell'app la regola è sempre attiva, tranne in modalità prova (build con VITE_TESTER=1).
 * - Sulle pagine web di prova tutti i giochi restano apribili; `#arrivo` mostra il menu come su Android,
 *   `#ios` come su iPhone.
 */
export const comingSoonActive = (): boolean =>
  isNative() ? !isTester() : urlParam('arrivo') === '1' || urlParam('ios') === '1';

/** true dove i giochi in arrivo vanno nascosti invece che mostrati con il nastro. */
export const comingSoonHidden = (): boolean => (isNative() ? platform() === 'ios' : urlParam('ios') === '1');

export const isComingSoon = (id: string): boolean => comingSoon(id, CONFIG.comingSoon, comingSoonActive());

/** I giochi da mostrare nel menu. */
export function menuGames<T extends { id: string }>(all: readonly T[]): T[] {
  return comingSoonHidden() ? all.filter((g) => !isComingSoon(g.id)) : [...all];
}
