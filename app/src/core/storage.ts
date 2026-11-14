import { Preferences } from '@capacitor/preferences';

/**
 * Salvataggio locale (nessun cloud, nessun account).
 * Un unico oggetto JSON per gioco, caricato all'avvio e tenuto in memoria.
 * Se lo storage non è disponibile (es. anteprima web restrittiva) si lavora solo in memoria.
 */
export class Store<T extends object> {
  private data: T;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly key: string, private readonly defaults: T) {
    this.data = structuredClone(defaults);
  }

  get state(): Readonly<T> {
    return this.data;
  }

  async load(): Promise<T> {
    let raw: string | null = null;
    try {
      raw = (await Preferences.get({ key: this.key })).value;
    } catch {
      try { raw = window.localStorage.getItem(this.key); } catch { raw = null; }
    }
    this.data = mergeDefaults(this.defaults, raw);
    return this.data;
  }

  update(patch: Partial<T>): void {
    this.data = { ...this.data, ...patch };
    this.scheduleSave();
  }

  reset(keep: Partial<T> = {}): void {
    this.data = { ...structuredClone(this.defaults), ...keep };
    this.scheduleSave(0);
  }

  private scheduleSave(delay = 150): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), delay);
  }

  async flush(): Promise<void> {
    const value = JSON.stringify(this.data);
    try {
      await Preferences.set({ key: this.key, value });
    } catch {
      try { window.localStorage.setItem(this.key, value); } catch { /* solo memoria */ }
    }
  }
}

/** Unisce i dati salvati ai valori di default (campi nuovi aggiunti in aggiornamenti). */
export function mergeDefaults<T extends object>(defaults: T, raw: string | null): T {
  const base = structuredClone(defaults);
  if (!raw) return base;
  try {
    const parsed = JSON.parse(raw) as Partial<T>;
    if (!parsed || typeof parsed !== 'object') return base;
    const out = { ...base } as Record<string, unknown>;
    for (const k of Object.keys(base)) {
      const v = (parsed as Record<string, unknown>)[k];
      const d = (base as Record<string, unknown>)[k];
      if (v === undefined || v === null) continue;
      if (Array.isArray(d) ? Array.isArray(v) : typeof v === typeof d) out[k] = v;
    }
    return out as T;
  } catch {
    return base;
  }
}

/** Cancella tutti i salvataggi con un certo prefisso tranne quelli indicati (es. "Azzera i progressi"). */
export async function removeKeys(prefix: string, keep: string[] = []): Promise<void> {
  try {
    const { keys } = await Preferences.keys();
    for (const k of keys) if (k.startsWith(prefix) && !keep.includes(k)) await Preferences.remove({ key: k });
  } catch {
    try {
      for (const k of Object.keys(window.localStorage)) {
        const bare = k.replace(/^CapacitorStorage\./, '');
        if (bare.startsWith(prefix) && !keep.includes(bare)) window.localStorage.removeItem(k);
      }
    } catch { /* solo memoria */ }
  }
}
