import { BRAND, FONT, RAINBOW, MARK_SVG, svgDataUrl } from './brand';

/**
 * Pannelli HTML sopra il gioco (blocco adulti, area genitori, offerta di sblocco) in stile Tappolino:
 * cartoncino color panna con il nastro arcobaleno del logo, carattere Fredoka, pulsanti "a caramella"
 * e la mascotte Tappo nell'intestazione. HTML invece del canvas: testo nitido, accessibile, facile da tradurre.
 */
const CSS = `
.tp-ov{position:fixed;inset:0;z-index:100;background:rgba(43,33,64,.74);display:flex;align-items:center;justify-content:center;
  padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);animation:tpfade .18s ease-out}
@keyframes tpfade{from{opacity:0}to{opacity:1}}
@keyframes tppop{from{transform:translateY(18px) scale(.94)}to{transform:none}}
.tp-card{--ink:${BRAND.ink};position:relative;background:${BRAND.cream};border:5px solid var(--ink);border-radius:30px;box-shadow:0 10px 0 rgba(29,24,48,.55);
  width:min(580px,92vw);max-height:90vh;overflow:auto;padding:0 22px 18px;color:var(--ink);font-family:${FONT};font-weight:500;
  box-sizing:border-box;-webkit-user-select:none;user-select:none;touch-action:manipulation;animation:tppop .22s cubic-bezier(.2,.9,.3,1.3)}
.tp-card::before{content:'';display:block;position:sticky;top:0;z-index:3;height:12px;margin:0 -22px;
  background:linear-gradient(90deg,${RAINBOW.join(',')});border-bottom:4px solid var(--ink)}
.tp-head{display:flex;align-items:center;gap:12px;margin:12px 0 6px;min-height:64px}
.tp-head img{width:54px;height:61px;flex:none;animation:tpbob 1.6s ease-in-out infinite alternate}
@keyframes tpbob{from{transform:rotate(-5deg)}to{transform:rotate(5deg) translateY(-3px)}}
.tp-card h2{margin:0;font-size:25px;line-height:1.12;font-weight:700;letter-spacing:.2px;flex:1}
.tp-card p{margin:6px 0 12px;font-size:16.5px;line-height:1.38}
.tp-card h3{display:flex;align-items:center;gap:8px;margin:18px 0 6px;font-size:18px;font-weight:700}
.tp-card h3::before{content:'';width:14px;height:14px;border-radius:50%;background:var(--dot,${BRAND.blue});border:3px solid var(--ink);flex:none}
.tp-list{margin:6px 0 12px;padding:0;list-style:none;font-size:16.5px;line-height:1.3}
.tp-list li{position:relative;padding:5px 0 5px 34px}
.tp-list li::before{content:'';position:absolute;left:0;top:4px;width:22px;height:22px;border-radius:50%;background:${BRAND.green};border:3px solid var(--ink);box-sizing:border-box}
.tp-list li::after{content:'';position:absolute;left:7px;top:8px;width:6px;height:10px;border:solid #fff;border-width:0 3px 3px 0;transform:rotate(42deg)}
.tp-x{position:absolute;top:28px;right:14px;z-index:4;width:46px;height:46px;border-radius:50%;border:4px solid var(--ink);
  background:${BRAND.coral};box-shadow:0 4px 0 var(--ink);font:700 22px/1 ${FONT};color:#fff;cursor:pointer;padding:0}
.tp-head{padding-right:52px}
.tp-x:active{transform:translateY(3px);box-shadow:0 1px 0 var(--ink)}
.tp-btn{position:relative;display:block;width:100%;margin:12px 0;padding:14px 16px;border-radius:20px;border:4px solid var(--ink);color:var(--ink);
  background:${BRAND.yellow} linear-gradient(rgba(255,255,255,.55),rgba(255,255,255,0) 52%);font:700 19px/1.15 ${FONT};cursor:pointer;box-shadow:0 6px 0 var(--ink)}
.tp-btn:active{transform:translateY(5px);box-shadow:0 1px 0 var(--ink)}
.tp-btn.go{background-color:${BRAND.green};color:#fff;text-shadow:0 2px 0 rgba(29,24,48,.45)}
.tp-btn.sec{background-color:#fff}
.tp-btn.warn{background-color:#ffd9d6}
.tp-btn[disabled]{opacity:.55}
.tp-row{display:flex;gap:12px;align-items:center;justify-content:space-between;margin:10px 0;font-size:17.5px;font-weight:600}
.tp-chips{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 4px}
.tp-chips button{flex:1 1 30%;padding:10px 6px;border-radius:16px;border:3px solid var(--ink);background:#fff;color:var(--ink);font:600 16px/1 ${FONT};
  cursor:pointer;box-shadow:0 4px 0 var(--ink)}
.tp-chips button:active{transform:translateY(3px);box-shadow:0 1px 0 var(--ink)}
.tp-chips button[aria-pressed=true]{background:${BRAND.blue} linear-gradient(rgba(255,255,255,.4),rgba(255,255,255,0) 55%);color:#fff;text-shadow:0 2px 0 rgba(29,24,48,.4)}
.tp-switch{position:relative;flex:none;width:78px;height:42px;border-radius:999px;border:4px solid var(--ink);background:#cfd4e2;cursor:pointer;padding:0;
  box-shadow:0 4px 0 var(--ink);transition:background .15s}
.tp-switch::after{content:'';position:absolute;top:3px;left:3px;width:28px;height:28px;border-radius:50%;background:#fff;border:3px solid var(--ink);box-sizing:border-box;
  transition:transform .18s cubic-bezier(.3,.9,.4,1.4)}
.tp-switch[aria-checked=true]{background:${BRAND.green}}
.tp-switch[aria-checked=true]::after{transform:translateX(36px)}
.tp-hold{position:relative;width:164px;height:164px;margin:10px auto 6px;border-radius:50%;border:5px solid var(--ink);background:#fff;display:flex;
  align-items:center;justify-content:center;touch-action:none;cursor:pointer;box-shadow:0 7px 0 var(--ink)}
.tp-hold.down{transform:translateY(5px);box-shadow:0 2px 0 var(--ink)}
.tp-hold svg{position:absolute;inset:-5px;width:164px;height:164px;transform:rotate(-90deg)}
.tp-hold img{width:92px;height:104px;pointer-events:none}
.tp-hold.down img{animation:tpbob .22s ease-in-out infinite alternate}
.tp-choices{display:flex;gap:14px;justify-content:center;margin:16px 0 6px}
.tp-choices button{width:92px;height:78px;border-radius:22px;border:4px solid var(--ink);color:#fff;text-shadow:0 3px 0 rgba(29,24,48,.45);
  background:var(--c) linear-gradient(rgba(255,255,255,.45),rgba(255,255,255,0) 55%);box-shadow:0 6px 0 var(--ink);font:700 34px/1 ${FONT};cursor:pointer}
.tp-choices button:active{transform:translateY(5px);box-shadow:0 1px 0 var(--ink)}
.tp-small{font-size:13.5px;opacity:.72;text-align:center;margin-top:12px}
.tp-msg{min-height:24px;font-size:16px;text-align:center;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px}
.tp-msg.wait::before{content:'';width:22px;height:22px;background:${BRAND.yellow};animation:tpspin .9s linear infinite;
  clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)}
@keyframes tpspin{to{transform:rotate(360deg)}}
.tp-ok{display:flex;align-items:center;gap:10px;margin:10px 0;padding:12px 14px;border-radius:18px;border:3px solid var(--ink);background:#dff7e6;font-weight:600}
a.tp-link{color:${BRAND.violet};font-weight:600}
`;

let styled = false;

export function openOverlay(onClose?: () => void): { card: HTMLElement; close: () => void } {
  if (!styled) {
    const s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);
    styled = true;
  }
  const root = document.getElementById('overlay') as HTMLElement;
  const ov = document.createElement('div');
  ov.className = 'tp-ov';
  const card = document.createElement('div');
  card.className = 'tp-card';
  const x = document.createElement('button');
  x.className = 'tp-x';
  x.setAttribute('aria-label', 'close');
  x.textContent = '✕';
  card.appendChild(x);
  ov.appendChild(card);
  root.appendChild(ov);
  // Impedisce che i tocchi arrivino al gioco sotto.
  ov.addEventListener('pointerdown', (e) => e.stopPropagation());
  // Un tocco fuori dal cartoncino lo chiude (la ✕ scorre via con il contenuto nei pannelli lunghi).
  ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    ov.remove();
    onClose?.();
  };
  x.addEventListener('click', close);
  return { card, close };
}

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]> = {}, ...children: (Node | string)[]): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  Object.assign(e, props);
  children.forEach((c) => e.append(c));
  return e;
}

/** Intestazione dei pannelli: Tappo e il titolo. */
export function cardHeader(text: string): HTMLElement {
  const img = el('img', { src: svgDataUrl(MARK_SVG), alt: '' });
  return el('div', { className: 'tp-head' }, img, el('h2', { textContent: text }));
}

/** Immagine di Tappo (isolata dal resto della pagina). */
export const tappoImg = (): HTMLImageElement => el('img', { src: svgDataUrl(MARK_SVG), alt: '', draggable: false });

/** Messaggio di stato sotto i pulsanti; con `wait` mostra la stellina che gira. */
export function statusLine(): { el: HTMLElement; say: (text: string, wait?: boolean) => void } {
  const box = el('div', { className: 'tp-msg' });
  box.setAttribute('role', 'status');
  return { el: box, say: (text, wait = false) => { box.textContent = text; box.classList.toggle('wait', wait); } };
}
