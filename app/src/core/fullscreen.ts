/**
 * Pulsante "schermo intero" per le SOLE pagine web di prova (nelle app non serve: sono già a schermo intero).
 * Compare solo dove il browser lo permette: su iPhone Safari non offre lo schermo intero alle pagine, e una pagina
 * ospitata dentro un'altra (come quelle pubblicate su claude.ai) può non averne il permesso. In quei casi non si vede.
 */
type FsDoc = Document & { webkitFullscreenEnabled?: boolean; webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => Promise<void> };
type FsEl = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> };

export function fullscreenSupported(doc: FsDoc = document): boolean {
  return !!(doc.fullscreenEnabled || doc.webkitFullscreenEnabled);
}

const ICON_IN = '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />';
const ICON_OUT = '<path d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5" />';

export function installFullscreenButton(): void {
  const doc = document as FsDoc;
  if (!fullscreenSupported(doc) || document.getElementById('tp-fs')) return;
  const root = document.documentElement as FsEl;
  const b = document.createElement('button');
  b.id = 'tp-fs';
  b.type = 'button';
  b.setAttribute('aria-label', 'fullscreen');
  b.style.cssText =
    'position:fixed;right:calc(env(safe-area-inset-right) + 6px);bottom:calc(var(--footer-h, 0px) + env(safe-area-inset-bottom) + 4px);z-index:150;'
    + 'width:38px;height:38px;padding:6px;border-radius:12px;border:2px solid #2b2140;background:#ffc800;opacity:.85;cursor:pointer;touch-action:manipulation';
  const isOn = () => !!(doc.fullscreenElement || doc.webkitFullscreenElement);
  const render = () => {
    b.innerHTML = `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="#2b2140" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${isOn() ? ICON_OUT : ICON_IN}</svg>`;
  };
  b.addEventListener('pointerdown', (e) => e.stopPropagation());
  b.addEventListener('click', () => {
    if (isOn()) {
      void (doc.exitFullscreen ? doc.exitFullscreen() : doc.webkitExitFullscreen?.());
      return;
    }
    const go = root.requestFullscreen ? root.requestFullscreen({ navigationUI: 'hide' }) : root.webkitRequestFullscreen?.();
    // In orizzontale come nell'app (dove il browser lo consente: di solito solo su Android).
    void Promise.resolve(go).then(() => (screen.orientation as unknown as { lock?: (o: string) => Promise<void> }).lock?.('landscape')).catch(() => undefined);
  });
  document.addEventListener('fullscreenchange', render);
  document.addEventListener('webkitfullscreenchange', render);
  render();
  document.body.appendChild(b);
}
