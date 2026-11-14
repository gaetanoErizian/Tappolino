import type Phaser from 'phaser';
import { addLocales, t } from './core/i18n';
import { registerSvgTextures } from './core/textures';
import { audio } from './core/audio';
import { isUnlocked } from './core/appState';
import { canPlay, type GameEntry, type GameModule } from './core/module';
import { openUnlockOffer } from './core/unlockOffer';
import { goTo } from './core/hud';
import { urlParam } from './core/platform';
import { CONFIG } from './config';
import { HUB_SONG } from './hub/sfx';

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
  if (mod.song) audio.playSong(mod.song);
  goTo(scene, mod.startScene);
}

async function loadModule(scene: Phaser.Scene, entry: GameEntry): Promise<GameModule> {
  const cached = loaded.get(entry.id);
  if (cached) return cached;
  const mod = (await entry.load()).default;
  addLocales(mod.locales);
  await registerSvgTextures(scene, mod.textures());
  for (const S of mod.scenes) scene.game.scene.add('', S, false);
  loaded.set(entry.id, mod);
  return mod;
}

/** Pulsante "casa" dei giochi: torna al menu Tappolino. */
export function backToHub(scene: Phaser.Scene): void {
  audio.playSong(HUB_SONG);
  goTo(scene, 'Hub');
}
