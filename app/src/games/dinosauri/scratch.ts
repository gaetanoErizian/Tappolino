import type Phaser from 'phaser';

/** Phaser.BlendModes.ERASE (valore numerico: così la logica pura si importa anche nei test senza Phaser). */
const ERASE = 17;
const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));

/**
 * Gesto dello STROFINARE (gioco 3; da unificare in regia con quello del gioco 4, decisione 23).
 *
 * - ScratchGrid: logica pura (testabile) — una griglia di celle che si "puliscono" sotto un pennello
 *   circolare; dice quanta superficie è scoperta in tutto o in un rettangolo.
 * - ScratchLayer: lo strato da togliere in Phaser — una RenderTexture con la copertura (terra, schiuma…)
 *   che il dito cancella con un pennello morbido. Un solo listener di scena; un tocco senza movimento
 *   cancella comunque un cerchio (risposta immediata per i più piccoli). Opzionale: un secondo strato
 *   d'ombra spostato in basso a destra, che dà profondità ai bordi dello scavo (luce dall'alto a sinistra).
 *
 * Le coordinate pubbliche sono sempre di scena; la griglia lavora in coordinate locali dello strato.
 */

export class ScratchGrid {
  readonly cols: number;
  readonly rows: number;
  private cells: Uint8Array;
  private clearedCount = 0;

  constructor(readonly w: number, readonly h: number, readonly cell = 20) {
    this.cols = Math.max(1, Math.ceil(w / cell));
    this.rows = Math.max(1, Math.ceil(h / cell));
    this.cells = new Uint8Array(this.cols * this.rows);
  }

  /** Pulisce le celle il cui centro cade nel cerchio (x, y, r). Restituisce quante celle nuove ha scoperto. */
  stamp(x: number, y: number, r: number): number {
    const c = this.cell;
    const c0 = Math.max(0, Math.floor((x - r) / c)), c1 = Math.min(this.cols - 1, Math.floor((x + r) / c));
    const r0 = Math.max(0, Math.floor((y - r) / c)), r1 = Math.min(this.rows - 1, Math.floor((y + r) / c));
    let fresh = 0;
    for (let row = r0; row <= r1; row++) {
      for (let col = c0; col <= c1; col++) {
        const cx = (col + 0.5) * c, cy = (row + 0.5) * c;
        if ((cx - x) ** 2 + (cy - y) ** 2 > r * r) continue;
        const i = row * this.cols + col;
        if (!this.cells[i]) { this.cells[i] = 1; fresh++; }
      }
    }
    this.clearedCount += fresh;
    return fresh;
  }

  /** Punti lungo un tratto, a passo regolare, per un segno continuo anche con il dito veloce. */
  static along(x0: number, y0: number, x1: number, y1: number, step: number): { x: number; y: number }[] {
    const d = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(1, Math.ceil(d / Math.max(1, step)));
    return Array.from({ length: n }, (_, i) => ({ x: x0 + ((x1 - x0) * (i + 1)) / n, y: y0 + ((y1 - y0) * (i + 1)) / n }));
  }

  /** Pulisce lungo il tratto da (x0,y0) a (x1,y1). */
  line(x0: number, y0: number, x1: number, y1: number, r: number): number {
    let fresh = 0;
    for (const p of ScratchGrid.along(x0, y0, x1, y1, r * 0.4)) fresh += this.stamp(p.x, p.y, r);
    return fresh;
  }

  /** Pulisce tutte le celle di un rettangolo. */
  clearRect(x: number, y: number, w: number, h: number): void {
    const c = this.cell;
    for (let row = Math.max(0, Math.floor(y / c)); row <= Math.min(this.rows - 1, Math.floor((y + h) / c)); row++) {
      for (let col = Math.max(0, Math.floor(x / c)); col <= Math.min(this.cols - 1, Math.floor((x + w) / c)); col++) {
        const i = row * this.cols + col;
        if (!this.cells[i]) { this.cells[i] = 1; this.clearedCount++; }
      }
    }
  }

  /** Quota scoperta di tutto lo strato (0..1). */
  fraction(): number {
    return this.clearedCount / this.cells.length;
  }

  /** Quota scoperta dentro un rettangolo (celle con il centro nel rettangolo; 0..1). */
  fractionIn(x: number, y: number, w: number, h: number): number {
    const c = this.cell;
    let tot = 0, done = 0;
    for (let row = 0; row < this.rows; row++) {
      const cy = (row + 0.5) * c;
      if (cy < y || cy > y + h) continue;
      for (let col = 0; col < this.cols; col++) {
        const cx = (col + 0.5) * c;
        if (cx < x || cx > x + w) continue;
        tot++;
        done += this.cells[row * this.cols + col];
      }
    }
    return tot ? done / tot : 1;
  }

  isClear(x: number, y: number): boolean {
    const col = Math.floor(x / this.cell), row = Math.floor(y / this.cell);
    if (col < 0 || row < 0 || col >= this.cols || row >= this.rows) return true;
    return this.cells[row * this.cols + col] === 1;
  }
}

export interface ScratchOpts {
  /** rettangolo dello strato, in coordinate di scena */
  x: number; y: number; w: number; h: number;
  /** texture della copertura (stessa misura dello strato) */
  cover: string;
  /** raggio del pennello (unità di design) */
  radius?: number;
  depth?: number;
  /** ombra dei bordi dello scavo: spostamento in basso a destra e opacità (0 = niente ombra) */
  shadow?: { dx: number; dy: number; alpha: number; color?: number };
  /** ogni passaggio del dito: punto in scena e celle nuove scoperte */
  onScrub?: (x: number, y: number, fresh: number) => void;
  onStart?: (x: number, y: number) => void;
  onEnd?: () => void;
}

/** Strato da strofinare via (terra sullo scavo, schiuma sull'unicorno…). */
export class ScratchLayer {
  readonly grid: ScratchGrid;
  enabled = true;
  private rt: Phaser.GameObjects.RenderTexture;
  private shade?: Phaser.GameObjects.RenderTexture;
  private brushKey: string;
  private radius: number;
  /** ultimo punto di ogni dito che sta strofinando (più dita insieme) */
  private last = new Map<number, { x: number; y: number }>();
  private dirty = false;

  constructor(private scene: Phaser.Scene, private o: ScratchOpts) {
    this.radius = o.radius ?? 70;
    this.grid = new ScratchGrid(o.w, o.h, 20);
    this.brushKey = ensureBrush(scene, Math.round(this.radius * 1.15));
    const depth = o.depth ?? 10;
    if (o.shadow && o.shadow.alpha > 0) {
      this.shade = scene.add.renderTexture(o.x, o.y, o.w, o.h).setOrigin(0).setDepth(depth - 0.01);
      this.shade.fill(o.shadow.color ?? 0x2a160a, o.shadow.alpha);
      this.shade.render();
    }
    this.rt = scene.add.renderTexture(o.x, o.y, o.w, o.h).setOrigin(0).setDepth(depth);
    this.rt.stamp(o.cover, undefined, 0, 0, { originX: 0, originY: 0 });
    this.rt.render();

    scene.input.on('pointerdown', this.down, this);
    scene.input.on('pointermove', this.move, this);
    scene.input.on('pointerup', this.up, this);
    scene.input.on('pointerupoutside', this.up, this);
    scene.events.on('postupdate', this.flush, this);
    scene.events.once('shutdown', () => this.destroy());
  }

  get layer(): Phaser.GameObjects.RenderTexture { return this.rt; }
  get active(): boolean { return this.last.size > 0; }

  /** true se il punto di scena è sopra lo strato. */
  contains(x: number, y: number): boolean {
    return x >= this.o.x && x <= this.o.x + this.o.w && y >= this.o.y && y <= this.o.y + this.o.h;
  }

  /** Quota scoperta di un rettangolo dato in coordinate di scena. */
  fractionIn(x: number, y: number, w: number, h: number): number {
    return this.grid.fractionIn(x - this.o.x, y - this.o.y, w, h);
  }

  /** Cancella un cerchio (coordinate di scena), anche da codice (crollo della terra attorno a un osso). */
  eraseAt(x: number, y: number, scale = 1): number {
    const lx = x - this.o.x, ly = y - this.o.y;
    const cfg: Phaser.Types.Textures.StampConfig = { scale, blendMode: ERASE };
    this.rt.stamp(this.brushKey, undefined, lx, ly, cfg);
    if (this.shade && this.o.shadow) this.shade.stamp(this.brushKey, undefined, lx + this.o.shadow.dx, ly + this.o.shadow.dy, cfg);
    this.dirty = true;
    return this.grid.stamp(lx, ly, this.radius * scale);
  }

  /** Toglie tutta la copertura rimasta, con una dissolvenza. */
  clearAll(duration = 500): void {
    this.enabled = false;
    this.grid.clearRect(0, 0, this.o.w, this.o.h);
    this.scene.tweens.add({ targets: [this.rt, this.shade].filter(Boolean), alpha: 0, duration });
  }

  private down(p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]): void {
    if (!this.enabled || over.length || !this.contains(p.worldX, p.worldY)) return;
    this.last.set(p.id, { x: p.worldX, y: p.worldY });
    this.o.onStart?.(p.worldX, p.worldY);
    const fresh = this.eraseAt(p.worldX, p.worldY);
    this.o.onScrub?.(p.worldX, p.worldY, fresh);
  }

  private move(p: Phaser.Input.Pointer): void {
    const prev = this.last.get(p.id);
    if (!this.enabled || !prev || !p.isDown) return;
    const x = clamp(p.worldX, this.o.x, this.o.x + this.o.w);
    const y = clamp(p.worldY, this.o.y, this.o.y + this.o.h);
    let fresh = 0;
    for (const q of ScratchGrid.along(prev.x, prev.y, x, y, this.radius * 0.4)) fresh += this.eraseAt(q.x, q.y);
    this.last.set(p.id, { x, y });
    this.o.onScrub?.(x, y, fresh);
  }

  private up(p: Phaser.Input.Pointer): void {
    if (!this.last.delete(p.id) || this.last.size) return;
    this.o.onEnd?.();
  }

  /** I tratti si disegnano una volta per fotogramma (Phaser 4: render() dopo i comandi). */
  private flush(): void {
    if (!this.dirty) return;
    this.dirty = false;
    this.rt.render();
    this.shade?.render();
  }

  destroy(): void {
    this.scene.input.off('pointerdown', this.down, this);
    this.scene.input.off('pointermove', this.move, this);
    this.scene.input.off('pointerup', this.up, this);
    this.scene.input.off('pointerupoutside', this.up, this);
    this.scene.events.off('postupdate', this.flush, this);
  }
}

/** Pennello morbido e un po' irregolare (bordi di terra smossa), creato una volta per raggio. */
function ensureBrush(scene: Phaser.Scene, r: number): string {
  const key = `scratch_brush_${r}`;
  if (scene.textures.exists(key)) return key;
  const size = r * 2 + 4;
  const tex = scene.textures.createCanvas(key, size, size)!;
  const ctx = tex.getContext();
  const c = size / 2;
  // corpo pieno con bordo frastagliato
  ctx.beginPath();
  const n = 22;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (0.84 + 0.1 * Math.sin(i * 2.7) + 0.06 * Math.cos(i * 5.3));
    const x = c + Math.cos(a) * rr, y = c + Math.sin(a) * rr;
    if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
  }
  ctx.closePath();
  const g = ctx.createRadialGradient(c, c, r * 0.35, c, c, r);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.75, 'rgba(255,255,255,0.95)');
  g.addColorStop(1, 'rgba(255,255,255,0.35)');
  ctx.fillStyle = g;
  ctx.fill();
  tex.refresh();
  return key;
}
