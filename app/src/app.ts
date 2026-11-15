import type Phaser from 'phaser';
import { CONFIG } from './config';
import { APP_LOCALES } from './locales';
import { initI18n, addLocales, setLang } from './core/i18n';
import { gameTitles } from './games/registry';
import { audio } from './core/audio';
import { initAds, removeAds } from './core/ads';
import { checkOwned } from './core/purchase';
import { openParentsArea } from './core/parentsArea';
import { setUiSound } from './core/ui';
import { urlParam, isNative } from './core/platform';
import { removeKeys } from './core/storage';
import { appState, isUnlocked, setUnlocked, onUnlockChange, loadTester, setTester } from './core/appState';
import { sound } from './core/sound';
import { installFullscreenButton } from './core/fullscreen';
import { hubSfx, registerHubSound, playHubMusic } from './hub/sfx';

/** Avvio dell'app: stato condiviso, lingua, audio, banner, verifica dell'acquisto unico. */
export async function startApp(): Promise<void> {
  if (urlParam('reset')) await removeKeys('tappolino.');
  const s = await appState.load();
  // Solo web di test: ?unlock=1 simula l'acquisto.
  if (!isNative() && urlParam('unlock') === '1') setUnlocked(true);
  // Modalità prova (solo web di prova e build con VITE_TESTER=1): resta attiva tra un avvio e l'altro; sul web la accende anche #prova.
  // Solo pagine web di prova: pulsante per lo schermo intero (dove il browser lo permette).
  if (!isNative()) installFullscreenButton();
  loadTester();
  if (!isNative() && urlParam('prova') === '1') setTester(true);
  initI18n(APP_LOCALES, urlParam('lang') ?? s.lang);
  addLocales(gameTitles());
  audio.setMuted(s.muted);
  sound.install();
  registerHubSound();
  playHubMusic();
  setUiSound(hubSfx.pop);
  void initAds(CONFIG, isUnlocked());
  onUnlockChange((v) => { if (v) void removeAds(); });
  // Verifica in background (anche dopo una reinstallazione).
  void checkOwned(CONFIG.productId).then((owned) => { if (owned) setUnlocked(true); });
}

/** Area genitori (dietro parental gate), mettendo in pausa la scena. */
export function openParents(scene: Phaser.Scene, onMuteChange?: () => void): void {
  scene.scene.pause();
  void openParentsArea({
    cfg: CONFIG,
    onMuteChange,
    onLangChange: (l) => { appState.update({ lang: l }); setLang(l); scene.scene.restart(); },
    onResetProgress: () => {
      // Cancella i progressi di tutti i giochi; acquisto, lingua e muto restano.
      void removeKeys('tappolino.', ['tappolino.app']).then(() => window.location.reload());
    },
    onClose: () => { if (scene.scene.isPaused()) scene.scene.resume(); },
  });
}
