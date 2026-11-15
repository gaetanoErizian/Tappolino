import type Phaser from 'phaser';

/** Phaser.BlendModes.ERASE (valore numerico: così la logica pura si importa anche nei test senza Phaser). */
const ERASE = 17;
const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));

/**
 * Gesto dello STROFINARE, comune a tutti i giochi (nato nei giochi 3 e 4, unificato in regia: decisione 23).
 *
 * - `ScratchGrid`: logica pura (testabile) — una griglia di celle che si "puliscono" sotto un pennello circolare
 *   e dice quanta superficie è stata strofinata, in tutto o in un rettangolo. Con una **maschera** conta solo le
 *   celle del bersaglio (la sagoma di un personaggio): `maskFromTexture()` la ricava dall'alfa di una texture.
 * - `ScratchLayer`: lo strato in Phaser — una RenderTexture con la copertura (terra, fango, schiuma…).
 *   - modo `"erase"` (default): il dito cancella la copertura; modo `"paint"`: il dito aggiunge un timbro (`brush`).
 *   - `parent`: lo strato vive dentro un Container e si muove con lui; x, y, w, h sono locali al Container.
 *   - `rt`: riusa uno strato esistente (es. il risciacquo cancella la schiuma appena fatta).
 *   - `shadow`: un secondo strato d'ombra spostato in basso a destra, che dà profondità ai bordi di ciò che si scopre.
 *   - `brushShape`: `"round"` (morbido, default) oppure `"rough"` (bordo frastagliato, per terra e sabbia).
 *
 * Sempre: un solo listener di scena, un tocco senza movimento lascia già un segno (risposta immediata per i più
 * piccoli), più dita insieme, i tratti si disegnano una volta per fotogramma.
 */

export class ScratchGrid {
  readonly cols: number;
  readonly rows: number;
  private cells: Uint8Array;
  private mask: Uint8Array | null;
  private total: number;
  private clearedCount = 0;

  /** `mask`: 1 per le celle del bersaglio (cols × rows, riga per riga); senza maschera conta tutto il rettangolo. */
  constructor(readonly w: number, readonly h: number, readonly cell = 20, mask?: Uint8Array | null) {
    this.cols = Math.max(1, Math.ceil(w / cell));
    this.rows = Math.max(1, Math.ceil(h / cell));
    this.cells = new Uint8Array(this.cols * this.rows);
    this.mask = mask && mask.length === this.cells.length ? mask : null;
    this.total = this.mask ? this.mask.reduce((s, v) => s + (v ? 1 : 0), 0) : this.cells.length;
  }

  /** true se la cella che contiene il punto fa parte del bersaglio. */
  inMask(x: number, y: number): boolean {
    const col = Math.floor(x / this.cell), row = Math.floor(y / this.cell);
    if (col < 0 || row < 0 || col >= this.cols || row >= this.rows) return false;
    return !this.mask || this.mask[row * this.cols + col] === 1;
  }

  /** Pulisce le celle il cui centro cade nel cerchio (x, y, r). Restituisce quante celle nuove del bersaglio ha scoperto. */
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
        if (this.cells[i]) continue;
        this.cells[i] = 1;
        if (!this.mask || this.mask[i]) fresh++;
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
        if (this.cells[i]) continue;
        this.cells[i] = 1;
        if (!this.mask || this.mask[i]) this.clearedCount++;
      }
    }
  }

  /** Quota strofinata del bersaglio (0..1). */
  fraction(): number {
    return this.total ? this.clearedCount / this.total : 1;
  }

  /** Quota strofinata dentro un rettangolo (solo celle del bersaglio con il centro nel rettangolo; 0..1). */
  fractionIn(x: number, y: number, w: number, h: number): number {
    const c = this.cell;
    let tot = 0, done = 0;
    for (let row = 0; row < this.rows; row++) {
      const cy = (row + 0.5) * c;
      if (cy < y || cy > y + h) continue;
      for (let col = 0; col < this.cols; col++) {
        const cx = (col + 0.5) * c;
        if (cx < x || cx > x + w) continue;
        const i = row * this.cols + col;
        if (this.mask && !this.mask[i]) continue;
        tot++;
        done += this.cells[i];
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

/**
 * Maschera per celle da un'immagine RGBA (w × h, come ImageData): una cella è del bersaglio se almeno
 * `minShare` dei suoi pixel campionati ha alfa sopra `minAlpha`. Logica pura (testabile).
 */
export function maskFromAlpha(data: Uint8ClampedArray | Uint8Array, w: number, h: number, cell: number, minAlpha = 40, minShare = 0.35): Uint8Array {
  const cols = Math.max(1, Math.ceil(w / cell)), rows = Math.max(1, Math.ceil(h / cell));
  const out = new Uint8Array(cols * rows);
  const step = Math.max(1, Math.floor(cell / 4));
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let seen = 0, hit = 0;
      for (let y = row * cell + step / 2; y < Math.min(h, (row + 1) * cell); y += step) {
        for (let x = col * cell + step / 2; x < Math.min(w, (col + 1) * cell); x += step) {
          seen++;
          if (data[(Math.floor(y) * w + Math.floor(x)) * 4 + 3] > minAlpha) hit++;
        }
      }
      out[row * cols + col] = seen && hit / seen >= minShare ? 1 : 0;
    }
  }
  return out;
}

/** Maschera di una texture già registrata (canvas): ogni cella copre `cell` unità; `scale` = pixel della texture per unità. */
export function maskFromTexture(scene: Phaser.Scene, key: string, cell = 20, scale = 1): Uint8Array | null {
  const src = scene.textures.exists(key) ? scene.textures.get(key).getSourceImage() : null;
  if (!src || !('getContext' in src)) return null;
  const c = src as HTMLCanvasElement;
  try {
    const img = c.getContext('2d')!.getImageData(0, 0, c.width, c.height);
    return maskFromAlpha(img.data, c.width, c.height, Math.round(cell * scale));
  } catch {
    return null;
  }
}

export interface ScratchOpts {
  /** rettangolo dello strato: coordinate di scena, oppure locali a `parent` */
  x: number; y: number; w: number; h: number;
  /** lo strato vive dentro questo Container (personaggio): segue i suoi movimenti */
  parent?: Phaser.GameObjects.Container;
  /** texture della copertura iniziale (stessa misura dello strato), con tinta facoltativa */
  cover?: string;
  coverTint?: number;
  /** riusa uno strato esistente invece di crearne uno nuovo */
  rt?: Phaser.GameObjects.RenderTexture;
  /** "erase": il dito cancella la copertura (default) · "paint": il dito aggiunge il timbro `brush` */
  mode?: 'erase' | 'paint';
  /** solo "paint": texture del timbro (es. una nuvoletta di schiuma) */
  brush?: string;
  /** raggio del pennello (unità dello strato) */
  radius?: number;
  /** celle del bersaglio (vedi ScratchGrid); nel modo "paint" il timbro si posa solo sul bersaglio */
  mask?: Uint8Array | null;
  /** posizione nella lista del Container (solo con `parent`); altrimenti in cima */
  index?: number;
  depth?: number;
  /** forma del pennello nel modo "erase": tonda e morbida (default) o a bordo frastagliato */
  brushShape?: 'round' | 'rough';
  /** ombra dei bordi di ciò che si scopre: spostamento in basso a destra e opacità (solo modo "erase", senza `rt`) */
  shadow?: { dx: number; dy: number; alpha: number; color?: number };
  /** ogni passaggio del dito: punto di scena (dentro lo strato) e celle nuove scoperte */
  onScrub?: (x: number, y: number, fresh: number) => void;
  onStart?: (x: number, y: number) => void;
  onEnd?: () => void;
}

const CELL = 20;

/** Strato da strofinare: via la copertura (fango, criniera arruffata) oppure sopra un timbro (schiuma). */
export class ScratchLayer {
  readonly grid: ScratchGrid;
  enabled = true;
  private rt: Phaser.GameObjects.RenderTexture;
  private shade?: Phaser.GameObjects.RenderTexture;
  private brushKey: string;
  private radius: number;
  private mode: 'erase' | 'paint';
  /** ultimo punto (locale) di ogni dito che sta strofinando */
  private last = new Map<number, { x: number; y: number }>();
  private dirty = false;
  private paintStep = 0;

  constructor(private scene: Phaser.Scene, private o: ScratchOpts) {
    this.radius = o.radius ?? 70;
    this.mode = o.mode ?? 'erase';
    this.grid = new ScratchGrid(o.w, o.h, CELL, o.mask);
    this.brushKey = ensureBrush(scene, Math.round(this.radius * 1.15), o.brushShape ?? 'round');
    if (o.rt) {
      this.rt = o.rt;
    } else {
      const depth = o.depth ?? 10;
      if (this.mode === 'erase' && o.shadow && o.shadow.alpha > 0) {
        this.shade = scene.add.renderTexture(o.x, o.y, o.w, o.h).setOrigin(0).setDepth(depth - 0.01);
        this.shade.fill(o.shadow.color ?? 0x2a160a, o.shadow.alpha);
        this.shade.render();
      }
      this.rt = scene.add.renderTexture(o.x, o.y, o.w, o.h).setOrigin(0).setDepth(depth);
      if (o.parent) {
        const at = o.index;
        if (this.shade) { if (at !== undefined) o.parent.addAt(this.shade, at); else o.parent.add(this.shade); }
        if (at !== undefined) o.parent.addAt(this.rt, at + (this.shade ? 1 : 0)); else o.parent.add(this.rt);
      }
      if (o.cover) {
        this.rt.stamp(o.cover, undefined, 0, 0, { originX: 0, originY: 0, tint: o.coverTint });
        this.rt.render();
      }
    }
    scene.input.on('pointerdown', this.down, this);
    scene.input.on('pointermove', this.move, this);
    scene.input.on('pointerup', this.up, this);
    scene.input.on('pointerupoutside', this.up, this);
    scene.events.on('postupdate', this.flush, this);
    scene.events.once('shutdown', () => this.destroy());
  }

  get layer(): Phaser.GameObjects.RenderTexture { return this.rt; }
  get active(): boolean { return this.last.size > 0; }
  fraction(): number { return this.grid.fraction(); }

  /** Da punto di scena a coordinate dello strato (0..w, 0..h). */
  toLayer(x: number, y: number): { x: number; y: number } {
    const p = this.o.parent ? this.o.parent.pointToContainer({ x, y }) : { x, y };
    return { x: p.x - this.o.x, y: p.y - this.o.y };
  }

  /** Da coordinate dello strato a punto di scena. */
  toScene(lx: number, ly: number): { x: number; y: number } {
    const par = this.o.parent;
    if (!par) return { x: lx + this.o.x, y: ly + this.o.y };
    const m = par.getWorldTransformMatrix();
    const out = m.transformPoint(lx + this.o.x, ly + this.o.y);
    return { x: out.x, y: out.y };
  }

  /** true se il punto di scena è sopra lo strato (e, con la maschera, vicino al bersaglio). */
  contains(x: number, y: number): boolean {
    const p = this.toLayer(x, y);
    if (p.x < 0 || p.y < 0 || p.x > this.o.w || p.y > this.o.h) return false;
    if (!this.o.mask) return true;
    const r = this.radius * 0.7;
    return [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].some(([dx, dy]) => this.grid.inMask(p.x + dx, p.y + dy));
  }

  /** Quota strofinata di un rettangolo dato in coordinate dello strato. */
  fractionIn(x: number, y: number, w: number, h: number): number {
    return this.grid.fractionIn(x, y, w, h);
  }

  /** Come `fractionIn`, ma con il rettangolo in coordinate di scena (strati senza `parent`). */
  fractionInScene(x: number, y: number, w: number, h: number): number {
    return this.grid.fractionIn(x - this.o.x, y - this.o.y, w, h);
  }

  /** Un colpo di pennello in coordinate dello strato (anche da codice). */
  private strokeAt(lx: number, ly: number, scale = 1): number {
    if (this.mode === 'paint') {
      if (this.o.brush && this.grid.inMask(lx, ly) && this.paintStep++ % 2 === 0) {
        const j = this.radius * 0.35;
        this.rt.stamp(this.o.brush, undefined, lx + (Math.random() * 2 - 1) * j, ly + (Math.random() * 2 - 1) * j,
          { scale: (0.75 + Math.random() * 0.5) * scale, alpha: 0.95 });
        this.dirty = true;
      }
    } else {
      this.rt.stamp(this.brushKey, undefined, lx, ly, { scale, blendMode: ERASE });
      if (this.shade && this.o.shadow) this.shade.stamp(this.brushKey, undefined, lx + this.o.shadow.dx, ly + this.o.shadow.dy, { scale, blendMode: ERASE });
      this.dirty = true;
    }
    return this.grid.stamp(lx, ly, this.radius * scale);
  }

  /** Cancella (o dipinge) un cerchio in un punto di scena. */
  eraseAt(x: number, y: number, scale = 1): number {
    const p = this.toLayer(x, y);
    return this.strokeAt(p.x, p.y, scale);
  }

  /** Finisce lo strato: nel modo "erase" la copertura rimasta sfuma via; nel modo "paint" lo strato resta com'è. */
  clearAll(duration = 500): void {
    this.enabled = false;
    this.last.clear();
    this.grid.clearRect(0, 0, this.o.w, this.o.h);
    if (this.mode === 'erase') this.scene.tweens.add({ targets: [this.rt, this.shade].filter(Boolean), alpha: 0, duration });
  }

  /** Finisce lo strato e, a dissolvenza conclusa, libera la sua RenderTexture. */
  dispose(duration = 500): void {
    this.clearAll(duration);
    this.destroy();
    this.scene.time.delayedCall(duration + 50, () => { this.rt.destroy(); this.shade?.destroy(); });
  }

  /** Comincia a seguire un dito già appoggiato (es. lo strato è nato mentre il bambino strofinava). */
  begin(p: Phaser.Input.Pointer): void {
    if (!this.enabled || !p.isDown || this.last.has(p.id)) return;
    this.paintStep = 0;
    const l = this.toLayer(p.worldX, p.worldY);
    this.last.set(p.id, l);
    this.o.onStart?.(p.worldX, p.worldY);
    this.o.onScrub?.(p.worldX, p.worldY, this.strokeAt(l.x, l.y));
  }

  /** Smette di ascoltare il dito senza toccare lo strato (che può essere riusato da un altro ScratchLayer). */
  stop(): void {
    this.enabled = false;
    this.last.clear();
    this.flush();
    this.destroy();
  }

  private down(p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]): void {
    if (!this.enabled || over.length || !this.contains(p.worldX, p.worldY)) return;
    this.paintStep = 0;
    const l = this.toLayer(p.worldX, p.worldY);
    this.last.set(p.id, l);
    this.o.onStart?.(p.worldX, p.worldY);
    const fresh = this.strokeAt(l.x, l.y);
    this.o.onScrub?.(p.worldX, p.worldY, fresh);
  }

  private move(p: Phaser.Input.Pointer): void {
    const prev = this.last.get(p.id);
    if (!this.enabled || !prev || !p.isDown) return;
    const l = this.toLayer(p.worldX, p.worldY);
    const x = clamp(l.x, 0, this.o.w), y = clamp(l.y, 0, this.o.h);
    let fresh = 0;
    for (const q of ScratchGrid.along(prev.x, prev.y, x, y, this.radius * 0.4)) fresh += this.strokeAt(q.x, q.y);
    this.last.set(p.id, { x, y });
    const at = this.toScene(x, y);
    this.o.onScrub?.(at.x, at.y, fresh);
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

/** Pennello creato una volta per raggio e forma: tondo e morbido, oppure a bordo frastagliato (terra smossa). */
function ensureBrush(scene: Phaser.Scene, r: number, shape: 'round' | 'rough'): string {
  const key = `scratch_brush_${shape}_${r}`;
  if (scene.textures.exists(key)) return key;
  const size = r * 2 + 4;
  const tex = scene.textures.createCanvas(key, size, size)!;
  const ctx = tex.getContext();
  const c = size / 2;
  ctx.beginPath();
  if (shape === 'rough') {
    const n = 22;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rr = r * (0.84 + 0.1 * Math.sin(i * 2.7) + 0.06 * Math.cos(i * 5.3));
      const x = c + Math.cos(a) * rr, y = c + Math.sin(a) * rr;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.closePath();
  } else {
    ctx.arc(c, c, r, 0, Math.PI * 2);
  }
  const g = shape === 'rough' ? ctx.createRadialGradient(c, c, r * 0.35, c, c, r) : ctx.createRadialGradient(c, c, r * 0.3, c, c, r);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(shape === 'rough' ? 0.75 : 0.7, 'rgba(255,255,255,0.95)');
  g.addColorStop(1, shape === 'rough' ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fill();
  tex.refresh();
  return key;
}
