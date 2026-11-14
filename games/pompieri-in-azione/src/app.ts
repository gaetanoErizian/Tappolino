import type Phaser from 'phaser';
import { save } from './save';
import { CONFIG } from './game.config';
import { LOCALES } from './locales';
import { initI18n, setLang } from './core/i18n';
import { audio } from './core/audio';
import { initAds, removeAds } from './core/ads';
import { checkOwned } from './core/purchase';
import { openParentsArea } from './core/parentsArea';
import { setUiSound } from './core/ui';
import { urlParam } from './core/platform';
import { sfx, SONG } from './sfx';

/** Avvio dell'app: salvataggi, lingua, audio, banner, verifica acquisto. */
export async function startApp(): Promise<void> {
  const s = await save.load();
  if (urlParam('reset')) save.reset();
  initI18n(LOCALES, urlParam('lang') ?? s.lang);
  audio.install();
  audio.setMuted(s.muted);
  audio.playSong(SONG);
  setUiSound(sfx.pop);
  void initAds(CONFIG, s.adsRemoved);
  // Verifica in background (anche dopo reinstallazione): se acquistato, toglie il banner.
  void checkOwned(CONFIG.productId).then((owned) => {
    if (owned && !save.state.adsRemoved) markAdsRemoved();
  });
}

export function markAdsRemoved(): void {
  save.update({ adsRemoved: true });
  void removeAds();
}

export function toggleMute(): boolean {
  const m = !save.state.muted;
  save.update({ muted: m });
  audio.setMuted(m);
  return m;
}

/** Apre l'area genitori (dietro parental gate) mettendo in pausa la scena. */
export function openParents(scene: Phaser.Scene, onMuteChange?: () => void): void {
  scene.scene.pause();
  void openParentsArea({
    cfg: CONFIG,
    adsRemoved: () => save.state.adsRemoved,
    onAdsRemoved: markAdsRemoved,
    muted: () => save.state.muted,
    setMuted: (m) => { save.update({ muted: m }); audio.setMuted(m); onMuteChange?.(); },
    onLangChange: (l) => { save.update({ lang: l }); setLang(l); scene.scene.restart(); },
    onResetProgress: () => {
      const { muted, lang, adsRemoved } = save.state;
      save.reset({ muted, lang, adsRemoved });
      scene.scene.start('Menu');
    },
    onClose: () => { if (scene.scene.isPaused()) scene.scene.resume(); },
  });
}
