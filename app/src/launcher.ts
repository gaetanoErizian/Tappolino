import type Phaser from 'phaser';
import { addLocales, t } from './core/i18n';
import { registerSvgTextures } from './core/textures';
import { isUnlocked } from './core/appState';
import { canPlay, type GameEntry, type GameModule } from './core/module';
import { openUnlockOffer } from './core/unlockOffer';
import { goTo } from './core/hud';
import { urlParam } from './core/platform';
import { CONFIG } from './config';
import { sound } from './core/sound';
import { runWithLoader, withTimeout, type LoadStep } from './core/loader';
import { hubSfx, playHubMusic } from './hub/sfx';

/** Avvio dei giochi dal menu: controllo sblocco, caricamento dinamico del modulo, ritorno al menu. */
const loaded = new Map<string, GameModule>();

/** Solo web di test: ?lock=1 mostra tutti i giochi come bloccati (per provare il percorso di acquisto). */
export const isForcedLocked = (): boolean => urlParam('lock') === '1';

export async function launchGame(scene: Phaser.Scene, entry: GameEntry): Promise<void> {
  if (!canPlay(entry, isUnlocked()) || isForcedLocked()) {
    // Un gioco bloccato non si avvia mai: parental gate, poi l'offerta di sblocco.
    scene.scene.pause();
    await openUnlockOffer(CONFIG, t(entry.titleKey), () => { if (scene.scene.isPaused()) scene.scene.resume(); });
    return;
  }
  const mod = await loadModule(scene, entry);
  // La musica del menu si ferma: da qui suona quella del gioco.
  sound.stopMusic();
  goTo(scene, mod.startScene);
}

/**
 * Carica un gioco mostrando il loader Tappolino: codice, salvataggi, grafica, audio.
 * Si risolve solo a caricamento riuscito (in caso di errore il loader propone "riprova").
 */
async function loadModule(scene: Phaser.Scene, entry: GameEntry): Promise<GameModule> {
  const cached = loaded.get(entry.id);
  if (cached) return cached;
  let mod!: GameModule;
  const steps: LoadStep[] = [
    { weight: 3, run: async () => { mod = (await entry.load()).default; } },
    { weight: 1, run: async () => { await mod.init?.(); addLocales(mod.locales); } },
    { weight: 5, run: (report) => registerSvgTextures(scene, mod.textures(), report) },
    { weight: 3, optional: true, run: (report) => (mod.preload ? withTimeout(mod.preload(report), 12000) : undefined) },
    { weight: 1, run: () => { for (const S of mod.scenes) scene.game.scene.add('', S, false); } },
  ];
  await runWithLoader(steps);
  hubSfx.ready();
  loaded.set(entry.id, mod);
  return mod;
}

/** Pulsante "casa" dei giochi: torna al menu Tappolino. */
export function backToHub(scene: Phaser.Scene): void {
  playHubMusic();
  goTo(scene, 'Hub');
}
