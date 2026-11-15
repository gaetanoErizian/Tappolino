import { openOverlay, el, cardHeader, statusLine } from './overlay';
import { parentalGate } from './parentalGate';
import { t } from './i18n';
import { buy, getPrice, restore } from './purchase';
import { isNative, platform } from './platform';
import { isUnlocked, setUnlocked } from './appState';
import type { AppConfig } from './config';

/**
 * Acquisto unico "sblocca tutto" (decisione 2): sblocca tutti i giochi, presenti e futuri,
 * e su Android toglie il banner. Sempre dietro parental gate.
 */

/** Vantaggi mostrati al genitore (su iOS non c'è pubblicità, quindi non la nominiamo). */
export function benefits(): string[] {
  const b = [t('unlock.allGames'), t('unlock.future')];
  if (platform() !== 'ios') b.push(t('unlock.noAds'));
  b.push(t('unlock.once'));
  return b;
}

/** Blocco acquisto + ripristino, usato sia nell'offerta sia nell'area genitori. */
export function purchaseBlock(cfg: AppConfig, onDone?: () => void): HTMLElement {
  const box = el('div');
  const status = statusLine();
  const msg = status.el;
  const say = status.say;
  const actions = el('div');

  const render = async () => {
    actions.innerHTML = '';
    if (isUnlocked()) {
      actions.append(el('div', { className: 'tp-ok', textContent: t('parents.unlocked') }));
      return;
    }
    const btn = el('button', { className: 'tp-btn go', textContent: t('parents.unlockShort') });
    actions.append(btn);
    if (!isNative()) {
      btn.disabled = true;
      actions.append(el('p', { className: 'tp-small', textContent: t('parents.onlyInApp') }));
    } else {
      const price = await getPrice(cfg.productId);
      btn.textContent = price ? t('parents.unlock', { price }) : t('parents.unlockShort');
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        say(t('parents.wait'), true);
        const r = await buy(cfg.productId);
        btn.disabled = false;
        if (r === 'ok') { setUnlocked(true); say(t('parents.thanks')); void render(); onDone?.(); }
        else if (r === 'cancel') say('');
        else say(t('parents.storeError'));
      });
    }
    const rest = el('button', { className: 'tp-btn sec', textContent: t('parents.restore') });
    rest.addEventListener('click', async () => {
      if (!isNative()) { say(t('parents.onlyInApp')); return; }
      rest.disabled = true;
      say(t('parents.wait'), true);
      const owned = await restore(cfg.productId);
      rest.disabled = false;
      if (owned) { setUnlocked(true); say(t('parents.restored')); void render(); onDone?.(); }
      else if (owned === false) say(t('parents.nothingToRestore'));
      else say(t('parents.storeError'));
    });
    actions.append(rest);
  };
  void render();
  box.append(actions, msg);
  return box;
}

/** Tocco su un gioco bloccato: parental gate, poi l'offerta. */
export async function openUnlockOffer(cfg: AppConfig, gameTitle: string, onClose?: () => void): Promise<void> {
  if (!(await parentalGate())) { onClose?.(); return; }
  const { card, close } = openOverlay(onClose);
  card.append(cardHeader(t('unlock.title', { game: gameTitle })));
  const ul = el('ul', { className: 'tp-list' });
  benefits().forEach((b) => ul.append(el('li', { textContent: b })));
  card.append(ul, purchaseBlock(cfg, () => setTimeout(close, 900)));
}
