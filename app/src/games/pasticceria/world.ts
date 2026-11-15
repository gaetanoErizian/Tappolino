import Phaser from 'phaser';
import { colorHex, recipeById, type Creation, type CustomerId, type Recipe, type ToppingId } from './recipes';

/** Elementi di scena condivisi: pasticceria a piani, bancone, dolce composto, cliente, trascinamento, manina. */

export const COUNTER_Y = 830;   // piano del bancone
export const FONT = '"Trebuchet MS", "Arial Rounded MT Bold", Verdana, sans-serif';
export const hex = (c: string): number => parseInt(c.slice(1), 16);

/**
 * Sfondo 2.5D: parete a righe, finestra con paesaggio nella foschia (piano lontano), mensole (piano medio),
 * lampade con alone, bancone in primo piano, barattoli sfocati ai bordi. Parallasse all'ingresso.
 */
export function drawKitchen(scene: Phaser.Scene, opts: { counter?: boolean; window?: boolean } = {}): void {
  const g = scene.add.graphics().setDepth(0);
  g.fillGradientStyle(0xffe6ef, 0xffe6ef, 0xffcadb, 0xffcadb, 1).fillRect(-2000, -1600, 5920, 3200);
  g.fillStyle(0xffffff, 0.32);
  for (let x = -2000; x < 3920; x += 120) g.fillRect(x, -1600, 46, 3200);
  // zoccolo della parete dietro il bancone
  g.fillStyle(0xf7b3c9, 1).fillRect(-2000, 700, 5920, 140);
  g.fillStyle(0xffffff, 0.5).fillRect(-2000, 700, 5920, 6);

  const far: Phaser.GameObjects.Image[] = [];
  if (opts.window !== false) far.push(scene.add.image(960, 330, 'pa_window').setDepth(2));
  const mid = [
    scene.add.image(250, 470, 'pa_shelf').setDepth(3).setScale(0.82),
    scene.add.image(1670, 470, 'pa_shelf').setDepth(3).setScale(0.82).setFlipX(true),
  ];
  // foschia leggera sui piani lontani
  scene.add.rectangle(-2000, -1600, 5920, 2300, 0xfff2f7, 0.16).setOrigin(0).setDepth(3.5);
  for (const [x, k] of [[520, 'pa_lamp_a'], [1400, 'pa_lamp_b']] as const) {
    scene.add.image(x, -30, k).setOrigin(0.5, 0).setDepth(4);
    const glow = scene.add.image(x, 262, 'glow').setDepth(4.5).setScale(2.6, 1.6).setTint(0xfff0b0).setAlpha(0.45).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({ targets: glow, alpha: 0.3, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  if (opts.counter !== false) {
    const c = scene.add.graphics().setDepth(20);
    // piano in marmo chiaro, spigolo illuminato, ombra sotto il bordo
    c.fillGradientStyle(0xfffaf3, 0xfffaf3, 0xeedfcb, 0xeedfcb, 1).fillRect(-2000, COUNTER_Y, 5920, 40);
    c.fillStyle(0xffffff, 0.9).fillRect(-2000, COUNTER_Y, 5920, 4);
    c.fillStyle(0xe5d3bc, 0.6);
    for (let x = -1900; x < 3920; x += 260) c.fillEllipse(x, COUNTER_Y + 22, 120, 5);
    c.fillGradientStyle(0x8fdccc, 0x8fdccc, 0x4fa896, 0x4fa896, 1).fillRect(-2000, COUNTER_Y + 40, 5920, 1400);
    c.fillStyle(0x2f6f62, 0.35).fillRect(-2000, COUNTER_Y + 40, 5920, 14);
    for (let x = -1960; x < 3920; x += 330) {
      c.fillStyle(0x2f6f62, 0.25).fillRoundedRect(x + 6, COUNTER_Y + 82, 290, 400, 26);
      c.fillStyle(0x7ccfbe, 1).fillRoundedRect(x, COUNTER_Y + 76, 290, 400, 26);
      c.lineStyle(4, 0xb6eee2, 0.9).strokeRoundedRect(x, COUNTER_Y + 76, 290, 400, 26);
      c.fillStyle(0xffffff, 0.8).fillRoundedRect(x + 115, COUNTER_Y + 100, 60, 14, 7);
    }
  }
  const fg = [
    scene.add.image(40, 1200, 'pa_fg_jar').setOrigin(0.5, 1).setScale(1.25).setDepth(800),
    scene.add.image(1890, 1190, 'pa_fg_stand').setOrigin(0.5, 1).setScale(1.2).setDepth(800),
  ];
  const slide = (o: { x: number }, dx: number) => {
    const x = o.x;
    o.x += dx;
    scene.tweens.add({ targets: o, x, duration: 1400, ease: 'Cubic.easeOut' });
  };
  far.forEach((f) => slide(f, 30));
  mid.forEach((m) => slide(m, 80));
  fg.forEach((f) => slide(f, 240));
}

// ---------------------------------------------------------------------
// Dolce composto: piattino, base, glassa colorata con riflessi, decorazioni
// ---------------------------------------------------------------------

export class Dessert {
  readonly c: Phaser.GameObjects.Container;
  readonly recipe: Recipe;
  private frost: Phaser.GameObjects.Image;
  private gloss: Phaser.GameObjects.Image;
  private tops: Phaser.GameObjects.Image[] = [];
  creation: Creation;

  constructor(private scene: Phaser.Scene, x: number, y: number, creation: Creation, opts: { plate?: boolean; depth?: number } = {}) {
    this.recipe = recipeById(creation.r);
    this.creation = { r: creation.r, c: null, t: [] };
    const r = this.recipe;
    const parts: Phaser.GameObjects.GameObject[] = [];
    if (opts.plate !== false) {
      parts.push(scene.add.image(0, r.plateDy, 'pa_plate').setScale(r.id === 'gelato' ? 0.6 : r.id === 'cookie' ? 0.95 : 0.85));
    }
    parts.push(scene.add.image(0, 0, `pa_base_${r.id}`));
    this.frost = scene.add.image(0, r.frostDy, `pa_frost_${r.id}`).setVisible(false);
    this.gloss = scene.add.image(0, r.frostDy, `pa_frost_${r.id}_hl`).setVisible(false);
    parts.push(this.frost, this.gloss);
    this.c = scene.add.container(x, y, parts).setDepth(opts.depth ?? 50);
    if (creation.c) this.setColor(creation.c, false);
    for (const [id, dx, dy] of creation.t) this.addTopping(id, dx, dy, false);
  }

  get frosted(): boolean { return this.creation.c !== null; }
  get toppingCount(): number { return this.tops.length; }

  setColor(color: string, animate = true): void {
    const tint = hex(colorHex(color));
    const first = !this.frost.visible;
    this.creation.c = color as Creation['c'];
    this.frost.setVisible(true).setTint(tint);
    this.gloss.setVisible(true);
    if (animate && first) {
      for (const o of [this.frost, this.gloss]) {
        o.setScale(0.2);
        this.scene.tweens.add({ targets: o, scale: 1, duration: 420, ease: 'Back.easeOut' });
      }
    } else if (animate) {
      this.scene.tweens.add({ targets: [this.frost, this.gloss], scaleX: 1.06, scaleY: 0.94, duration: 120, yoyo: true });
    }
  }

  addTopping(id: ToppingId, dx: number, dy: number, animate = true): Phaser.GameObjects.Image {
    const img = this.scene.add.image(dx, dy, `pa_top_${id}`).setScale(0.9);
    // le decorazioni più in basso stanno davanti (profondità)
    const first = this.c.getIndex(this.gloss) + 1;
    this.c.addAt(img, first + this.tops.filter((t) => t.y <= dy).length);
    this.tops.push(img);
    this.creation.t.push([id, Math.round(dx), Math.round(dy)]);
    if (animate) {
      img.setScale(0).setY(dy - 40);
      this.scene.tweens.add({ targets: img, scale: 0.9, y: dy, duration: 300, ease: 'Back.easeOut' });
    }
    return img;
  }

  /** Coordinate locali (scala compresa) di un punto del mondo. */
  toLocal(x: number, y: number): { x: number; y: number } {
    return { x: (x - this.c.x) / this.c.scaleX, y: (y - this.c.y) / this.c.scaleY };
  }

  /** Versione "sagoma" per i dolci ancora da scoprire. */
  silhouette(): void {
    this.c.each((o: Phaser.GameObjects.GameObject) => (o as Phaser.GameObjects.Image).setTint(0x5a4a6e));
  }
}

/** Anteprima di una ricetta: glassa rosa e ciliegina. */
export const previewCreation = (r: Recipe): Creation => ({
  r: r.id, c: r.id === 'gelato' ? 'pink' : r.id === 'cookie' ? 'vanilla' : 'pink',
  t: [['cherry', r.area.x, r.area.y - (r.id === 'cupcake' ? 70 : r.id === 'gelato' ? 80 : 6)], ['sprinkles', r.area.x - r.area.rx * 0.5, r.area.y + 6], ['sprinkles', r.area.x + r.area.rx * 0.5, r.area.y + 10]],
});

// ---------------------------------------------------------------------
// Cliente-animaletto dietro il bancone
// ---------------------------------------------------------------------

export class Customer {
  readonly img: Phaser.GameObjects.Image;
  private bob: Phaser.Tweens.Tween;

  constructor(private scene: Phaser.Scene, readonly id: CustomerId, x: number, depth = 15) {
    this.img = scene.add.image(x, COUNTER_Y + 70, `pa_cust_${id}_idle`).setOrigin(0.5, 1).setDepth(depth);
    this.bob = scene.tweens.add({ targets: this.img, scaleY: 1.025, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  face(state: 'idle' | 'eat' | 'happy'): void { this.img.setTexture(`pa_cust_${this.id}_${state}`); }

  /** Entra da destra. */
  enter(toX: number, onDone?: () => void): void {
    this.img.x = 2500;
    this.scene.tweens.add({
      targets: this.img, x: toX, duration: 900, ease: 'Cubic.easeOut',
      onUpdate: (tw) => { this.img.y = COUNTER_Y + 70 - Math.abs(Math.sin(tw.progress * Math.PI * 4)) * 26; },
      onComplete: () => { this.img.y = COUNTER_Y + 70; onDone?.(); },
    });
  }

  leave(onDone?: () => void): void {
    this.scene.tweens.add({
      targets: this.img, x: 2600, duration: 800, ease: 'Cubic.easeIn',
      onUpdate: (tw) => { this.img.y = COUNTER_Y + 70 - Math.abs(Math.sin(tw.progress * Math.PI * 4)) * 26; },
      onComplete: () => onDone?.(),
    });
  }

  jump(): void {
    this.scene.tweens.add({ targets: this.img, y: COUNTER_Y + 40, duration: 140, yoyo: true, repeat: 1, ease: 'Quad.easeOut' });
  }

  destroy(): void { this.bob.stop(); this.img.destroy(); }
}

// ---------------------------------------------------------------------
// Trascinamento: un listener di scena, si prende l'oggetto più vicino al dito (raggio ampio)
// ---------------------------------------------------------------------

export interface DragItem {
  obj: Phaser.GameObjects.Image;
  id: string;
  homeX: number;
  homeY: number;
  baseScale: number;
  shadow?: Phaser.GameObjects.Image;
  enabled: boolean;
}

export interface DragHandlers {
  /** true = accettato (l'oggetto non torna a casa da solo) */
  onDrop: (item: DragItem, x: number, y: number) => boolean;
  /** tocco senza trascinamento */
  onTap?: (item: DragItem) => void;
  onPick?: (item: DragItem) => void;
}

export class DragManager {
  items: DragItem[] = [];
  enabled = true;
  private cur: DragItem | null = null;
  private off = { x: 0, y: 0 };
  private start = { x: 0, y: 0 };
  private moved = 0;
  private trail: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(private scene: Phaser.Scene, private h: DragHandlers, private radius = 170) {
    this.trail = scene.add.particles(0, 0, 'sparkle', {
      speed: { min: 10, max: 60 }, scale: { start: 0.45, end: 0 }, lifespan: 500, frequency: 50,
      tint: [0xffffff, 0xffe066, 0xffb3d9], emitting: false,
    }).setDepth(1490);
    scene.input.on('pointerdown', this.down, this);
    scene.input.on('pointermove', this.move, this);
    scene.input.on('pointerup', this.up, this);
    scene.input.on('pointerupoutside', this.up, this);
    scene.events.once('shutdown', () => {
      scene.input.off('pointerdown', this.down, this);
      scene.input.off('pointermove', this.move, this);
      scene.input.off('pointerup', this.up, this);
      scene.input.off('pointerupoutside', this.up, this);
    });
  }

  add(obj: Phaser.GameObjects.Image, id: string, shadow?: Phaser.GameObjects.Image): DragItem {
    const it: DragItem = { obj, id, homeX: obj.x, homeY: obj.y, baseScale: obj.scaleX, shadow, enabled: true };
    this.items.push(it);
    return it;
  }

  clear(): void { this.items = []; this.cur = null; this.trail.stop(); }

  get dragging(): boolean { return this.cur !== null; }

  private down(p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]): void {
    if (!this.enabled || over.length || this.cur) return;
    let best: DragItem | null = null;
    let bd = this.radius;
    for (const it of this.items) {
      if (!it.enabled) continue;
      // centro visivo dell'oggetto (l'origine può essere in basso)
      const cy = it.obj.y - (it.obj.originY - 0.5) * it.obj.displayHeight;
      const d = Phaser.Math.Distance.Between(p.worldX, p.worldY, it.obj.x, cy);
      if (d < bd) { bd = d; best = it; }
    }
    if (!best) return;
    this.cur = best;
    this.off = { x: best.obj.x - p.worldX, y: best.obj.y - p.worldY };
    this.start = { x: p.worldX, y: p.worldY };
    this.moved = 0;
    this.scene.tweens.killTweensOf(best.obj);
    best.obj.setDepth(1400);
    this.scene.tweens.add({ targets: best.obj, scale: best.baseScale * 1.12, duration: 120, ease: 'Quad.easeOut' });
    if (best.shadow) this.scene.tweens.add({ targets: best.shadow, alpha: 0.25, duration: 120 });
    this.h.onPick?.(best);
  }

  private move(p: Phaser.Input.Pointer): void {
    if (!this.cur || !p.isDown) return;
    this.cur.obj.setPosition(p.worldX + this.off.x, p.worldY + this.off.y);
    this.moved = Math.max(this.moved, Phaser.Math.Distance.Between(p.worldX, p.worldY, this.start.x, this.start.y));
    if (this.moved > 30) { this.trail.setPosition(p.worldX, p.worldY); if (!this.trail.emitting) this.trail.start(); }
  }

  private up(p: Phaser.Input.Pointer): void {
    const it = this.cur;
    if (!it) return;
    this.cur = null;
    this.trail.stop();
    if (this.moved < 30 && this.h.onTap) {
      this.home(it, true);
      this.h.onTap(it);
      return;
    }
    if (!this.h.onDrop(it, p.worldX, p.worldY)) this.home(it);
  }

  /** Riporta l'oggetto al suo posto (rimbalzo). */
  home(it: DragItem, instant = false): void {
    it.obj.setDepth(40);
    if (it.shadow) this.scene.tweens.add({ targets: it.shadow, alpha: 0.8, duration: 200 });
    if (instant) { it.obj.setPosition(it.homeX, it.homeY).setScale(it.baseScale); return; }
    this.scene.tweens.add({ targets: it.obj, x: it.homeX, y: it.homeY, scale: it.baseScale, duration: 380, ease: 'Back.easeOut' });
  }
}

// ---------------------------------------------------------------------
// Manina: tocco, trascinamento, movimento circolare. Nessun testo da leggere.
// ---------------------------------------------------------------------

export class Hint {
  private hand: Phaser.GameObjects.Image;
  private timer?: Phaser.Time.TimerEvent;
  private tweens: Phaser.Tweens.Tween[] = [];

  constructor(private scene: Phaser.Scene) {
    this.hand = scene.add.image(0, 0, 'hand').setOrigin(0.42, 0.04).setVisible(false).setDepth(2001);
  }

  get visible(): boolean { return this.hand.visible; }

  drag(x1: number, y1: number, x2: number, y2: number): void {
    this.hide();
    const run = () => {
      this.hand.setPosition(x1, y1).setVisible(true).setAlpha(0).setScale(1);
      this.tweens.push(this.scene.tweens.chain({
        targets: this.hand,
        tweens: [
          { alpha: 1, duration: 200 },
          { scale: 0.85, duration: 150 },
          { x: x2, y: y2, duration: 900, ease: 'Sine.easeInOut' },
          { scale: 1, duration: 150 },
          { alpha: 0, duration: 250, delay: 150 },
        ],
      }) as unknown as Phaser.Tweens.Tween);
    };
    run();
    this.timer = this.scene.time.addEvent({ delay: 2200, loop: true, callback: run });
  }

  tap(x: number, y: number): void {
    this.hide();
    this.hand.setPosition(x, y + 20).setVisible(true).setAlpha(1).setScale(1);
    this.tweens.push(this.scene.tweens.add({ targets: this.hand, y: y - 6, scale: 0.88, duration: 320, yoyo: true, repeat: -1, ease: 'Quad.easeInOut' }));
  }

  circle(cx: number, cy: number, rx: number, ry: number): void {
    this.hide();
    this.hand.setVisible(true).setAlpha(1).setScale(0.9);
    const st = { a: 0 };
    this.tweens.push(this.scene.tweens.add({
      targets: st, a: Math.PI * 2, duration: 1300, repeat: -1,
      onUpdate: () => this.hand.setPosition(cx + Math.cos(st.a) * rx, cy + Math.sin(st.a) * ry),
    }));
  }

  hide(): void {
    this.timer?.remove();
    this.timer = undefined;
    this.tweens.forEach((t) => t.stop());
    this.tweens = [];
    this.hand.setVisible(false);
  }
}
