/**
 * Pannelli HTML sopra il gioco (parental gate, area genitori).
 * HTML invece del canvas: testo nitido, accessibile, facile da tradurre.
 */
const CSS = `
.tp-ov{position:fixed;inset:0;z-index:100;background:rgba(43,33,64,.72);display:flex;align-items:center;justify-content:center;
  padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);animation:tpfade .18s ease-out}
@keyframes tpfade{from{opacity:0}to{opacity:1}}
.tp-card{position:relative;background:#fffaf0;border:5px solid #2b2140;border-radius:28px;box-shadow:0 10px 0 rgba(0,0,0,.25);
  width:min(560px,92vw);max-height:88vh;overflow:auto;padding:22px 22px 18px;color:#2b2140;font-family:"Trebuchet MS",system-ui,sans-serif;
  box-sizing:border-box;-webkit-user-select:none;user-select:none;touch-action:manipulation}
.tp-card h2{margin:0 0 10px 0;font-size:22px}
.tp-card p{margin:6px 0 12px;font-size:16px;line-height:1.35}
.tp-card h3{margin:14px 0 4px;font-size:18px}
.tp-list{margin:6px 0 10px;padding:0;list-style:none;font-size:16px;line-height:1.5}
.tp-list li::before{content:'✓ ';color:#2e9e57;font-weight:bold}
.tp-x{position:sticky;float:right;top:0;margin:-8px -8px 0 8px;z-index:2;width:44px;height:44px;border-radius:50%;border:4px solid #2b2140;background:#fff;font-size:22px;
  font-weight:bold;color:#2b2140;line-height:1;cursor:pointer}
.tp-btn{display:block;width:100%;margin:10px 0;padding:14px 16px;border-radius:18px;border:4px solid #2b2140;background:#ffd23f;color:#2b2140;
  font-size:18px;font-weight:bold;cursor:pointer;box-shadow:0 5px 0 #2b2140;font-family:inherit}
.tp-btn:active{transform:translateY(4px);box-shadow:0 1px 0 #2b2140}
.tp-btn.sec{background:#fff}
.tp-btn[disabled]{opacity:.55}
.tp-row{display:flex;gap:10px;align-items:center;justify-content:space-between;margin:10px 0;font-size:17px}
.tp-row select{font-size:17px;padding:8px;border-radius:12px;border:3px solid #2b2140;background:#fff;color:#2b2140}
.tp-hold{position:relative;width:150px;height:150px;margin:8px auto 4px;border-radius:50%;border:5px solid #2b2140;background:#fff;display:flex;
  align-items:center;justify-content:center;font-size:52px;touch-action:none;cursor:pointer}
.tp-hold svg{position:absolute;inset:-5px;width:150px;height:150px;transform:rotate(-90deg)}
.tp-choices{display:flex;gap:12px;justify-content:center;margin:14px 0 4px}
.tp-choices button{width:84px;height:72px;font-size:30px;font-weight:bold;border-radius:18px;border:4px solid #2b2140;background:#fff;color:#2b2140;
  box-shadow:0 5px 0 #2b2140;font-family:inherit;cursor:pointer}
.tp-small{font-size:13px;opacity:.7;text-align:center;margin-top:12px}
.tp-msg{min-height:22px;font-size:15px;text-align:center;font-weight:bold}
a.tp-link{color:#2b2140}
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
