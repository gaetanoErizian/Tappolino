import { openOverlay, el, cardHeader } from './overlay';
import { BRAND } from './brand';
import { testerAvailable, isTester, setTester } from './appState';
import { parentalGate } from './parentalGate';
import { t, lang, LANG_NAMES, SUPPORTED, type Lang } from './i18n';
import { benefits, purchaseBlock } from './unlockOffer';
import { isMuted, setMuted } from './appState';
import type { AppConfig } from './config';
import { openCredits } from './credits';

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

  card.append(cardHeader(t('parents.title')), el('p', { textContent: t('parents.intro') }));
  const section = (text: string, color: string): HTMLElement => {
    const h = el('h3', { textContent: text });
    h.style.setProperty('--dot', color);
    return h;
  };

  // --- Sblocca tutto ---
  card.append(section(t('parents.unlockTitle'), BRAND.green));
  const ul = el('ul', { className: 'tp-list' });
  benefits().forEach((b) => ul.append(el('li', { textContent: b })));
  card.append(ul, purchaseBlock(o.cfg));

  // --- Lingua: una pastiglia per lingua ---
  const chips = el('div', { className: 'tp-chips' });
  SUPPORTED.forEach((l) => {
    const b = el('button', { type: 'button', textContent: LANG_NAMES[l] });
    b.setAttribute('aria-pressed', String(l === lang()));
    b.addEventListener('click', () => {
      if (l === lang()) return;
      o.onLangChange(l);
      close();
    });
    chips.append(b);
  });
  card.append(section(t('parents.language'), BRAND.blue), chips);

  // --- Audio: interruttore ---
  const label = el('span');
  const sw = el('button', { type: 'button', className: 'tp-switch' });
  sw.setAttribute('role', 'switch');
  const renderSound = () => {
    sw.setAttribute('aria-checked', String(!isMuted()));
    label.textContent = isMuted() ? t('parents.soundOff') : t('parents.soundOn');
  };
  renderSound();
  sw.addEventListener('click', () => { setMuted(!isMuted()); renderSound(); o.onMuteChange?.(); });
  card.append(el('div', { className: 'tp-row' }, label, sw));

  // --- Azzera progressi (doppia conferma) ---
  const reset = el('button', { className: 'tp-btn warn', textContent: t('parents.reset') });
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

  // --- Crediti e licenze (decisione 22) ---
  const credits = el('button', { type: 'button', className: 'tp-btn sec', textContent: t('credits.open') });
  credits.addEventListener('click', () => openCredits());
  card.append(credits);

  // --- Privacy ---
  const privacy = el('p', { className: 'tp-small' });
  const link = el('a', { className: 'tp-link', href: o.cfg.privacyUrl, target: '_blank', rel: 'noopener', textContent: t('parents.privacy') });
  const version = el('span', { textContent: `${o.cfg.developer} · v${o.cfg.version}` });
  privacy.append(link, el('br'), version);
  card.append(el('p', { className: 'tp-small', textContent: t('parents.noData') }), privacy);

  // --- Modalità prova (nascosta): 5 tocchi sulla riga della versione. Non esiste nelle build per gli store. ---
  if (testerAvailable()) {
    const info = el('div', { className: 'tp-ok' });
    const render = () => {
      info.hidden = !isTester();
      info.textContent = '';
      if (!isTester()) return;
      const off = el('button', { type: 'button', className: 'tp-btn sec', textContent: t('tester.turnOff') });
      off.style.margin = '0';
      off.style.width = 'auto';
      off.addEventListener('click', () => { setTester(false); render(); });
      info.append(el('span', { textContent: t('tester.on') }), off);
    };
    let taps = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    version.addEventListener('click', () => {
      taps++;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { taps = 0; }, 2500);
      if (taps >= 5) { taps = 0; setTester(!isTester()); render(); info.scrollIntoView({ block: 'nearest' }); }
    });
    render();
    card.append(info);
  }
}
