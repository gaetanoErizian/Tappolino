import { openOverlay, el } from './overlay';
import { parentalGate } from './parentalGate';
import { t, lang, LANG_NAMES, SUPPORTED, type Lang } from './i18n';
import { buy, getPrice, restore } from './purchase';
import { isNative } from './platform';
import type { GameConfig } from './config';

export interface ParentsOptions {
  cfg: GameConfig;
  adsRemoved: () => boolean;
  onAdsRemoved: () => void;
  muted: () => boolean;
  setMuted: (m: boolean) => void;
  onLangChange: (l: Lang) => void;
  onResetProgress: () => void;
  onClose?: () => void;
}

/** Area genitori: sempre dietro il parental gate. */
export async function openParentsArea(o: ParentsOptions): Promise<void> {
  if (!(await parentalGate())) {
    o.onClose?.();
    return;
  }
  const { card, close } = openOverlay(o.onClose);
  const msg = el('div', { className: 'tp-msg' });
  const say = (s: string) => { msg.textContent = s; };

  card.append(el('h2', { textContent: t('parents.title') }), el('p', { textContent: t('parents.intro') }));

  // --- Pubblicità ---
  const adsBox = el('div');
  const renderAds = async () => {
    adsBox.innerHTML = '';
    if (o.adsRemoved()) {
      adsBox.append(el('p', { textContent: '✓ ' + t('parents.adsRemoved') }));
      return;
    }
    const btn = el('button', { className: 'tp-btn', textContent: t('parents.removeAds', { price: '…' }) });
    adsBox.append(btn);
    if (!isNative()) {
      btn.disabled = true;
      btn.textContent = t('parents.removeAds', { price: '0,99 €' });
      adsBox.append(el('p', { className: 'tp-small', textContent: t('parents.onlyInApp') }));
      return;
    }
    const price = await getPrice(o.cfg.productId);
    btn.textContent = price ? t('parents.removeAds', { price }) : t('parents.removeAdsShort');
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      say(t('parents.wait'));
      const r = await buy(o.cfg.productId);
      btn.disabled = false;
      if (r === 'ok') { o.onAdsRemoved(); say(t('parents.thanks')); void renderAds(); }
      else if (r === 'cancel') say('');
      else say(t('parents.storeError'));
    });
  };
  await renderAds();

  const restoreBtn = el('button', { className: 'tp-btn sec', textContent: t('parents.restore') });
  restoreBtn.addEventListener('click', async () => {
    if (!isNative()) { say(t('parents.onlyInApp')); return; }
    restoreBtn.disabled = true;
    say(t('parents.wait'));
    const owned = await restore(o.cfg.productId);
    restoreBtn.disabled = false;
    if (owned) { o.onAdsRemoved(); say(t('parents.restored')); void renderAds(); }
    else if (owned === false) say(t('parents.nothingToRestore'));
    else say(t('parents.storeError'));
  });
  card.append(adsBox, restoreBtn, msg);

  // --- Lingua ---
  const sel = el('select');
  SUPPORTED.forEach((l) => sel.append(el('option', { value: l, textContent: LANG_NAMES[l], selected: l === lang() })));
  sel.addEventListener('change', () => {
    o.onLangChange(sel.value as Lang);
    close();
  });
  card.append(el('div', { className: 'tp-row' }, el('span', { textContent: t('parents.language') }), sel));

  // --- Audio ---
  const sound = el('button', { className: 'tp-btn sec' });
  const renderSound = () => { sound.textContent = o.muted() ? '🔇 ' + t('parents.soundOff') : '🔊 ' + t('parents.soundOn'); };
  renderSound();
  sound.addEventListener('click', () => { o.setMuted(!o.muted()); renderSound(); });
  card.append(sound);

  // --- Azzera progressi (doppia conferma) ---
  const reset = el('button', { className: 'tp-btn sec', textContent: t('parents.reset') });
  let armed: ReturnType<typeof setTimeout> | null = null;
  reset.addEventListener('click', () => {
    if (!armed) {
      reset.textContent = t('parents.resetConfirm');
      armed = setTimeout(() => { armed = null; reset.textContent = t('parents.reset'); }, 4000);
      return;
    }
    clearTimeout(armed);
    armed = null;
    o.onResetProgress();
    close();
  });
  card.append(reset);

  // --- Privacy ---
  const privacy = el('p', { className: 'tp-small' });
  const link = el('a', { className: 'tp-link', href: o.cfg.privacyUrl, target: '_blank', rel: 'noopener', textContent: t('parents.privacy') });
  privacy.append(link, el('br'), `${o.cfg.developer} · v${o.cfg.version}`);
  card.append(el('p', { className: 'tp-small', textContent: t('parents.noData') }), privacy);
}
