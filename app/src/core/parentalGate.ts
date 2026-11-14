import { openOverlay, el } from './overlay';
import { t, tList } from './i18n';

/**
 * Blocco per adulti (Apple 1.3 / Google Families): due prove che un bambino piccolo
 * non supera per caso:
 *  1. tenere premuto il pulsante per 3 secondi;
 *  2. risolvere una somma scritta IN LETTERE (serve saper leggere) scegliendo tra 3 numeri.
 * Risolve true se superato, false se chiuso o sbagliato.
 */
export function parentalGate(): Promise<boolean> {
  return new Promise((resolve) => {
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      ov.close();
      resolve(ok);
    };
    const ov = openOverlay(() => finish(false));
    const { card } = ov;

    // --- Passo 1: tieni premuto ---
    const title = el('h2', { textContent: t('gate.title') });
    const info = el('p', { textContent: t('gate.hold') });
    const hold = el('div', { className: 'tp-hold' });
    hold.innerHTML = `<svg viewBox="0 0 150 150"><circle cx="75" cy="75" r="68" fill="none" stroke="#ffd23f" stroke-width="12"
      stroke-dasharray="427.3" stroke-dashoffset="427.3" stroke-linecap="round"/></svg><span>✋</span>`;
    const ring = hold.querySelector('circle') as SVGCircleElement;
    card.append(title, info, hold);

    const HOLD_MS = 3000;
    let start = 0;
    let raf = 0;
    const reset = () => {
      cancelAnimationFrame(raf);
      start = 0;
      ring.style.strokeDashoffset = '427.3';
    };
    const step = () => {
      const p = Math.min(1, (performance.now() - start) / HOLD_MS);
      ring.style.strokeDashoffset = String(427.3 * (1 - p));
      if (p >= 1) {
        hold.removeEventListener('pointerup', reset);
        showQuestion();
        return;
      }
      raf = requestAnimationFrame(step);
    };
    hold.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      hold.setPointerCapture(e.pointerId);
      start = performance.now();
      raf = requestAnimationFrame(step);
    });
    hold.addEventListener('pointerup', reset);
    hold.addEventListener('pointercancel', reset);
    hold.addEventListener('contextmenu', (e) => e.preventDefault());

    // --- Passo 2: somma in lettere ---
    function showQuestion() {
      cancelAnimationFrame(raf);
      hold.remove();
      const words = tList('numbers');
      const a = 3 + Math.floor(Math.random() * 7); // 3..9
      const b = 3 + Math.floor(Math.random() * 7);
      const sum = a + b;
      info.textContent = t('gate.question', { a: words[a] ?? String(a), b: words[b] ?? String(b) });
      const options = new Set<number>([sum]);
      while (options.size < 3) {
        const d = sum + (Math.floor(Math.random() * 7) - 3);
        if (d > 0 && d !== sum) options.add(d);
      }
      const row = el('div', { className: 'tp-choices' });
      [...options].sort(() => Math.random() - 0.5).forEach((n) => {
        const b2 = el('button', { textContent: String(n) });
        b2.addEventListener('click', () => finish(n === sum));
        row.append(b2);
      });
      card.append(row);
    }
  });
}
