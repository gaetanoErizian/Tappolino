import { BRAND, FONT, LOGO_SVG, svgDataUrl } from './brand';

/**
 * Password della pagina di prova per i tester (decisione 28). Esiste SOLO nella build `--mode pages`
 * (GitHub Pages): lì VITE_GATE_HASH contiene l'impronta della password, calcolata dal flusso di pubblicazione
 * a partire dal segreto TEST_PAGE_PASSWORD. Nelle app e nelle altre build non c'è nulla.
 *
 * È un cancello di cortesia, non una protezione vera: il controllo avviene nel browser e il codice del
 * repository è pubblico. Serve a non lasciare la pagina aperta a chi capita sull'indirizzo.
 */
export const GATE_SALT = 'tappolino-pagina-di-prova';
export const GATE_ROUNDS = 100_000;
const KEY = 'tappolino.gate';

/** Maiuscole e spazi ai bordi non contano: i genitori la scrivono sul telefono. */
export const normalizePassword = (p: string): string => p.trim().toLowerCase();

export async function gateHash(password: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(normalizePassword(password)), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(GATE_SALT), iterations: GATE_ROUNDS }, key, 256);
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Si risolve quando la password è giusta (o subito, dove il cancello non esiste). */
export function testGate(expected: string | undefined = import.meta.env?.VITE_GATE_HASH as string | undefined): Promise<void> {
  if (!expected) return Promise.resolve();
  try { if (localStorage.getItem(KEY) === expected) return Promise.resolve(); } catch { /* memoria non disponibile: si chiede ogni volta */ }
  const it = (navigator.language || 'it').toLowerCase().startsWith('it');
  const T = it
    ? { title: 'Pagina di prova riservata', hint: 'Scrivi la password che hai ricevuto.', ph: 'Password', go: 'Entra', no: 'Password sbagliata, riprova.' }
    : { title: 'Private test page', hint: 'Type the password you were given.', ph: 'Password', go: 'Enter', no: 'Wrong password, try again.' };
  const F = FONT.replace(/"/g, "'"); // dentro gli attributi style non possono stare le virgolette doppie
  return new Promise((resolve) => {
    const ov = document.createElement('div');
    ov.style.cssText = `position:fixed;inset:0;z-index:300;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;background:linear-gradient(#4fb3f2,#d4f0ff);font-family:${F};color:${BRAND.ink}`;
    ov.innerHTML = `<form style="width:min(420px,100%);background:${BRAND.cream};border:5px solid ${BRAND.ink};border-radius:28px;box-shadow:0 10px 0 rgba(29,24,48,.55);padding:18px 20px;text-align:center">
      <img alt="Tappolino" style="width:min(260px,70%);height:auto" />
      <h1 style="font-size:22px;margin:8px 0 4px"></h1>
      <p style="font-size:16px;margin:0 0 12px"></p>
      <input name="p" type="text" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false"
        style="width:100%;box-sizing:border-box;font:600 20px ${F};text-align:center;padding:12px;border-radius:16px;border:4px solid ${BRAND.ink};background:#fff;color:${BRAND.ink}" />
      <button type="submit" style="width:100%;margin-top:12px;padding:13px;border-radius:18px;border:4px solid ${BRAND.ink};background:${BRAND.green};color:#fff;font:700 20px ${F};box-shadow:0 5px 0 ${BRAND.ink};cursor:pointer"></button>
      <div role="alert" style="min-height:22px;margin-top:10px;font-size:15px;font-weight:600;color:#c0392b"></div></form>`;
    const form = ov.querySelector('form') as HTMLFormElement;
    (ov.querySelector('img') as HTMLImageElement).src = svgDataUrl(LOGO_SVG);
    (ov.querySelector('h1') as HTMLElement).textContent = T.title;
    (ov.querySelector('p') as HTMLElement).textContent = T.hint;
    const input = ov.querySelector('input') as HTMLInputElement;
    input.placeholder = T.ph;
    (ov.querySelector('button') as HTMLElement).textContent = T.go;
    const msg = ov.querySelector('[role=alert]') as HTMLElement;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      void gateHash(input.value).then((h) => {
        if (h !== expected) { msg.textContent = T.no; input.select(); return; }
        try { localStorage.setItem(KEY, expected); } catch { /* pazienza: verrà richiesta di nuovo */ }
        ov.remove();
        resolve();
      });
    });
    document.body.appendChild(ov);
    input.focus();
  });
}
