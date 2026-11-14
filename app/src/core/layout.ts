/**
 * Spazio riservato al banner nel footer.
 * Il canvas del gioco vive in #game (flex: 1) e #footer ha altezza --footer-h:
 * il gioco non finisce MAI sotto il banner, perché il suo contenitore si accorcia.
 */
type Listener = (footerPx: number) => void;
const listeners: Listener[] = [];
let footer = 0;

export function setFooterHeight(px: number): void {
  footer = Math.max(0, Math.round(px));
  document.documentElement.style.setProperty('--footer-h', `${footer}px`);
  // Lascia al browser il tempo di ricalcolare il layout, poi avvisa (Phaser ridimensiona il canvas).
  requestAnimationFrame(() => {
    window.dispatchEvent(new Event('resize'));
    listeners.forEach((l) => l(footer));
  });
}

export const footerHeight = (): number => footer;
export const onFooterChange = (l: Listener): void => { listeners.push(l); };

export function footerEl(): HTMLElement {
  return document.getElementById('footer') as HTMLElement;
}
