export const SUPPORTED = ['it', 'en', 'es', 'fr', 'de', 'pt'] as const;
export type Lang = (typeof SUPPORTED)[number];
export type Dict = Record<string, string | string[]>;

let dicts: Record<string, Dict> = {};
let current: Lang = 'en';

/** Lingua del dispositivo, ridotta a una di quelle supportate (default inglese). */
export function deviceLang(): Lang {
  const list = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language]) || ['en'];
  for (const l of list) {
    const code = String(l).slice(0, 2).toLowerCase();
    if ((SUPPORTED as readonly string[]).includes(code)) return code as Lang;
  }
  return 'en';
}

export function initI18n(all: Record<Lang, Dict>, preferred?: string | null): Lang {
  dicts = all;
  return setLang(preferred && (SUPPORTED as readonly string[]).includes(preferred) ? (preferred as Lang) : deviceLang());
}

export function setLang(l: Lang): Lang {
  current = l;
  try { document.documentElement.lang = l; } catch { /* ignore */ }
  return current;
}

export const lang = (): Lang => current;

/** Testo tradotto; {nome} viene sostituito con params.nome. */
export function t(key: string, params: Record<string, string | number> = {}): string {
  const v = dicts[current]?.[key] ?? dicts.en?.[key] ?? key;
  const s = Array.isArray(v) ? v.join(' ') : v;
  return s.replace(/\{(\w+)\}/g, (_, k: string) => (k in params ? String(params[k]) : `{${k}}`));
}

/** Voce di tipo elenco (es. numeri in lettere). */
export function tList(key: string): string[] {
  const v = dicts[current]?.[key] ?? dicts.en?.[key];
  return Array.isArray(v) ? v : [];
}

/** Nome della lingua nella lingua stessa, per il selettore genitori. */
export const LANG_NAMES: Record<Lang, string> = {
  it: 'Italiano', en: 'English', es: 'Español', fr: 'Français', de: 'Deutsch', pt: 'Português',
};
