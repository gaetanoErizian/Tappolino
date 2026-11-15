/**
 * Loader Tappolino: schermata di caricamento in sovrapposizione, uguale in tutta l'app.
 * La scritta Tappolino, la barra con i colori delle lettere e la mascotte Tappo che la percorre.
 * La barra segue l'avanzamento reale dei passi; si chiude solo quando tutto è andato a buon fine,
 * e se qualcosa fallisce mostra il pulsante "riprova".
 *
 * Il markup e lo stile stanno in index.html (#tp-loader), così il loader è visibile dal primo istante,
 * prima ancora che il codice dell'app sia caricato.
 */

const MIN_VISIBLE_MS = 700;

let shownAt = 0;
let current = 0;

const root = (): HTMLElement | null => document.getElementById('tp-loader');

function setBar(p: number): void {
  const el = root();
  if (!el) return;
  current = Math.max(0, Math.min(1, p));
  el.style.setProperty('--p', current.toFixed(4));
  el.setAttribute('aria-valuenow', String(Math.round(current * 100)));
}

export const loader = {
  /** true se il loader è sullo schermo. */
  get visible(): boolean {
    const el = root();
    return !!el && !el.hidden;
  },

  /** Mostra il loader (riparte da zero se non era già visibile). */
  show(): void {
    const el = root();
    if (!el) return;
    el.classList.remove('tpl-failed', 'tpl-done', 'tpl-out');
    if (el.hidden) {
      setBar(0);
      el.hidden = false;
      // forza il ricalcolo così la dissolvenza d'ingresso parte davvero
      void el.offsetWidth;
      shownAt = performance.now();
    } else if (!shownAt) {
      // primo avvio: il loader è già nella pagina
      shownAt = performance.now();
    }
    el.classList.add('tpl-in');
  },

  /** Avanzamento 0..1. Non torna mai indietro. */
  set(p: number): void {
    if (p > current) setBar(p);
  },

  /** Caricamento riuscito: barra piena, saltello di Tappo, poi il loader si dissolve. */
  async done(): Promise<void> {
    const el = root();
    if (!el || el.hidden) return;
    setBar(1);
    const wait = MIN_VISIBLE_MS - (performance.now() - shownAt);
    if (wait > 0) await sleep(wait);
    el.classList.add('tpl-done');
    await sleep(420);
    el.classList.add('tpl-out');
    await sleep(320);
    el.hidden = true;
    el.classList.remove('tpl-in', 'tpl-done', 'tpl-out');
    shownAt = 0;
    current = 0;
  },

  /** Caricamento fallito: la barra si ferma e compare "riprova". */
  fail(onRetry: () => void): void {
    const el = root();
    if (!el) return;
    el.hidden = false;
    el.classList.add('tpl-in', 'tpl-failed');
    const btn = el.querySelector<HTMLButtonElement>('.tpl-retry');
    if (!btn) return;
    btn.onclick = () => {
      btn.onclick = null;
      el.classList.remove('tpl-failed');
      setBar(0);
      onRetry();
    };
  },
};

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** Un passo di caricamento: `weight` è il suo peso sulla barra, `run` riceve una funzione per l'avanzamento interno (0..1). */
export interface LoadStep {
  weight: number;
  run: (report: (p: number) => void) => Promise<unknown> | unknown;
  /** Se true, un errore in questo passo non blocca il caricamento (es. audio non disponibile). */
  optional?: boolean;
}

/** Posizione sulla barra dopo `done` passi interi più una frazione del successivo. */
export function progressOf(steps: Pick<LoadStep, 'weight'>[], index: number, inner: number): number {
  const total = steps.reduce((s, x) => s + x.weight, 0) || 1;
  const before = steps.slice(0, index).reduce((s, x) => s + x.weight, 0);
  const w = steps[index]?.weight ?? 0;
  return (before + w * Math.max(0, Math.min(1, inner))) / total;
}

/**
 * Esegue i passi mostrando il loader. Si risolve solo a caricamento riuscito:
 * in caso di errore resta aperto con "riprova" e ricomincia quando il genitore lo tocca.
 */
export function runWithLoader(steps: LoadStep[]): Promise<void> {
  return new Promise((resolve) => {
    const attempt = async () => {
      loader.show();
      try {
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          loader.set(progressOf(steps, i, 0.04));
          try {
            await step.run((p) => loader.set(progressOf(steps, i, p)));
          } catch (e) {
            if (!step.optional) throw e;
            console.warn('Passo di caricamento facoltativo saltato:', e);
          }
          loader.set(progressOf(steps, i, 1));
        }
      } catch (e) {
        console.warn('Caricamento non riuscito:', e);
        loader.fail(() => void attempt());
        return;
      }
      await loader.done();
      resolve();
    };
    void attempt();
  });
}

/** Limita la durata di un passo facoltativo: oltre il tempo massimo si prosegue. */
export function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | undefined> {
  return Promise.race([p, new Promise<undefined>((r) => setTimeout(() => r(undefined), ms))]);
}
