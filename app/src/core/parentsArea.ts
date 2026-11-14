import { openOverlay, el } from './overlay';
import { parentalGate } from './parentalGate';
import { t, lang, LANG_NAMES, SUPPORTED, type Lang } from './i18n';
import { benefits, purchaseBlock } from './unlockOffer';
import { isMuted, setMuted } from './appState';
import type { AppConfig } from './config';

export interface ParentsOptions {
  cfg: AppConfig;
  onLangChange: (l: Lang) => void;
  onResetProgress: () => void;
  onMuteChange?: () => void;
  onClose?: () => void;
}

/** Area genitori: sempre dietro il parental gate. */
export async function openParentsArea(o: ParentsOptions): Promise<void> {
  if (!(await parentalGate())) {
    o.onClose?.();
    return;
  }
  const { card, close } = openOverlay(o.onClose);

  card.append(el('h2', { textContent: t('parents.title') }), el('p', { textContent: t('parents.intro') }));

  // --- Sblocca tutto ---
  card.append(el('h3', { textContent: t('parents.unlockTitle') }));
  const ul = el('ul', { className: 'tp-list' });
  benefits().forEach((b) => ul.append(el('li', { textContent: b })));
  card.append(ul, purchaseBlock(o.cfg));

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
  const renderSound = () => { sound.textContent = isMuted() ? '🔇 ' + t('parents.soundOff') : '🔊 ' + t('parents.soundOn'); };
  renderSound();
  sound.addEventListener('click', () => { setMuted(!isMuted()); renderSound(); o.onMuteChange?.(); });
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
