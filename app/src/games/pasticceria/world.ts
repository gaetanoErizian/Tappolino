import Phaser from 'phaser';
import { colorHex, recipeById, type Creation, type CustomerId, type Recipe, type ToppingId } from './recipes';
import { CUST_H, CUST_MOUTH } from './art';

/** Elementi di scena condivisi: pasticceria a piani, bancone, dolce composto, cliente. Trascinamento e manina: core/drag. */

export const COUNTER_Y = 830;   // piano del bancone
export const hex = (c: string): number => parseInt(c.slice(1), 16);

/**
 * Sfondo 2.5D: parete a righe, finestra con paesaggio nella foschia (piano lontano), mensole (piano medio),
 * lampade con alone, bancone in primo piano, barattoli sfocati ai bordi. Parallasse all'ingresso.
 */
export function drawKitchen(scene: Phaser.Scene, opts: { counter?: boolean; window?: boolean; fgAside?: boolean } = {}): { fg: Phaser.GameObjects.Image[] } {
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
  // in partita i barattoli restano più ai margini, per non coprire ingredienti e vassoi
  const fg = [
    scene.add.image(opts.fgAside ? -190 : 40, 1200, 'pa_fg_jar').setOrigin(0.5, 1).setScale(1.25).setDepth(800),
    scene.add.image(opts.fgAside ? 2110 : 1890, 1190, 'pa_fg_stand').setOrigin(0.5, 1).setScale(1.2).setDepth(800),
  ];
  const slide = (o: { x: number }, dx: number) => {
    const x = o.x;
    o.x += dx;
    scene.tweens.add({ targets: o, x, duration: 1400, ease: 'Cubic.easeOut' });
  };
  far.forEach((f) => slide(f, 30));
  mid.forEach((m) => slide(m, 80));
  fg.forEach((f) => slide(f, 240));
  return { fg };
}

// ---------------------------------------------------------------------
// Dolce composto: piattino, base, glassa colorata con riflessi, decorazioni
// ---------------------------------------------------------------------

/** Altezza del bordo superiore di ogni dolce rispetto al suo centro: [senza glassa, con glassa]. */
const DESSERT_TOP: Record<string, [number, number]> = {
  cupcake: [-70, -255], cookie: [-118, -118], cake: [-140, -150], gelato: [-56, -238],
};

export class Dessert {
  readonly c: Phaser.GameObjects.Container;
  readonly recipe: Recipe;
  /** dolce senza piattino: origine sul piattino, così i morsi lo rimpiccioliscono verso il basso */
  private body: Phaser.GameObjects.Container;
  private plate?: Phaser.GameObjects.Image;
  private frost: Phaser.GameObjects.Image;
  private gloss: Phaser.GameObjects.Image;
  private tops: Phaser.GameObjects.Image[] = [];
  creation: Creation;

  constructor(private scene: Phaser.Scene, x: number, y: number, creation: Creation, opts: { plate?: boolean; depth?: number } = {}) {
    this.recipe = recipeById(creation.r);
    this.creation = { r: creation.r, c: null, t: [] };
    const r = this.recipe;
    const P = r.plateDy;
    const parts: Phaser.GameObjects.GameObject[] = [];
    if (opts.plate !== false) {
      this.plate = scene.add.image(0, P, 'pa_plate').setScale(r.id === 'gelato' ? 0.6 : r.id === 'cookie' ? 0.95 : 0.85);
      parts.push(this.plate);
    }
    this.frost = scene.add.image(0, r.frostDy - P, `pa_frost_${r.id}`).setVisible(false);
    this.gloss = scene.add.image(0, r.frostDy - P, `pa_frost_${r.id}_hl`).setVisible(false);
    this.body = scene.add.container(0, P, [scene.add.image(0, -P, `pa_base_${r.id}`), this.frost, this.gloss]);
    parts.push(this.body);
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
    const ly = dy - this.recipe.plateDy;
    const img = this.scene.add.image(dx, ly, `pa_top_${id}`).setScale(0.9).setData('y', ly);
    // le decorazioni più in basso stanno davanti (profondità)
    const first = this.body.getIndex(this.gloss) + 1;
    this.body.addAt(img, first + this.tops.filter((t) => (t.getData('y') as number) <= ly).length);
    this.tops.push(img);
    this.creation.t.push([id, Math.round(dx), Math.round(dy)]);
    if (animate) {
      img.setScale(0).setY(ly - 40);
      this.scene.tweens.add({ targets: img, scale: 0.9, y: ly, duration: 300, ease: 'Back.easeOut' });
    }
    return img;
  }

  /** Coordinate locali (scala compresa) di un punto del mondo. */
  toLocal(x: number, y: number): { x: number; y: number } {
    return { x: (x - this.c.x) / this.c.scaleX, y: (y - this.c.y) / this.c.scaleY };
  }

  /** Bordo più alto del dolce (coordinate del mondo): lì il cliente appoggia la bocca. */
  biteTop(): { x: number; y: number } {
    const top = DESSERT_TOP[this.recipe.id][this.frosted ? 1 : 0];
    const ly = this.recipe.plateDy + (top - this.recipe.plateDy) * this.body.scaleY;
    return { x: this.c.x, y: this.c.y + ly * this.c.scaleY };
  }

  /** Un morso: il dolce si rimpicciolisce verso il piattino. */
  bite(k = 0.7): void {
    const s = this.body.scaleX * k;
    this.scene.tweens.add({ targets: this.body, scaleX: s * 1.12, scaleY: s * 0.88, duration: 90, ease: 'Quad.easeOut',
      onComplete: () => this.scene.tweens.add({ targets: this.body, scaleX: s, scaleY: s, duration: 140, ease: 'Back.easeOut' }) });
  }

  /** Sparisce l'ultimo boccone, resta il piattino. */
  finish(): void {
    this.scene.tweens.add({ targets: this.body, scale: 0, duration: 160, ease: 'Quad.easeIn' });
  }

  /** Versione "sagoma" per i dolci ancora da scoprire. */
  silhouette(): void {
    this.plate?.setTint(0x5a4a6e);
    this.body.each((o: Phaser.GameObjects.GameObject) => (o as Phaser.GameObjects.Image).setTint(0x5a4a6e));
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

/** Base della texture del cliente quando sta in piedi dietro il bancone. */
export const CUST_Y = COUNTER_Y + 310;

export class Customer {
  readonly img: Phaser.GameObjects.Image;
  private bob: Phaser.Tweens.Tween;

  constructor(private scene: Phaser.Scene, readonly id: CustomerId, x: number, depth = 15) {
    this.img = scene.add.image(x, CUST_Y, `pa_cust_${id}_idle`).setOrigin(0.5, 1).setDepth(depth);
    this.bob = scene.tweens.add({ targets: this.img, scaleY: 1.025, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // Il busto si vede solo sopra il bancone: così il cliente può sporgersi davanti al dolce per mangiarlo.
    const clip = () => {
      if (!this.img.active) return;
      const top = this.img.y - CUST_H * this.img.scaleY;
      this.img.setCrop(0, 0, 440, Phaser.Math.Clamp((COUNTER_Y + 6 - top) / this.img.scaleY, 0, CUST_H));
    };
    clip();
    scene.events.on('update', clip);
    scene.events.once('shutdown', () => scene.events.off('update', clip));
  }

  /**
   * Morso: il cliente (dietro al dolce) si allunga finché la bocca tocca il bordo alto del dolce,
   * poi torna al suo posto. Il busto lungo resta sempre nascosto dal bancone.
   */
  biteAt(x: number, topY: number, onBite: () => void, onDone: () => void): void {
    const homeX = this.img.x;
    this.face('eat');
    const ty = Math.max(topY - 16 + CUST_MOUTH, COUNTER_Y + 30);
    this.scene.tweens.add({
      targets: this.img, x: x + 24, y: ty, duration: 280, ease: 'Quad.easeOut',
      onComplete: () => {
        onBite();
        this.scene.tweens.add({
          targets: this.img, x: homeX, y: CUST_Y, duration: 320, delay: 160, ease: 'Quad.easeInOut',
          onComplete: () => { this.face('idle'); onDone(); },
        });
      },
    });
  }

  face(state: 'idle' | 'eat' | 'happy'): void { this.img.setTexture(`pa_cust_${this.id}_${state}`); }

  /** Entra da destra. */
  enter(toX: number, onDone?: () => void): void {
    this.img.x = 2500;
    this.scene.tweens.add({
      targets: this.img, x: toX, duration: 900, ease: 'Cubic.easeOut',
      onUpdate: (tw) => { this.img.y = CUST_Y - Math.abs(Math.sin(tw.progress * Math.PI * 4)) * 26; },
      onComplete: () => { this.img.y = CUST_Y; onDone?.(); },
    });
  }

  leave(onDone?: () => void): void {
    this.scene.tweens.add({
      targets: this.img, x: 2600, duration: 800, ease: 'Cubic.easeIn',
      onUpdate: (tw) => { this.img.y = CUST_Y - Math.abs(Math.sin(tw.progress * Math.PI * 4)) * 26; },
      onComplete: () => onDone?.(),
    });
  }

  jump(): void {
    this.scene.tweens.add({ targets: this.img, y: CUST_Y - 30, duration: 140, yoyo: true, repeat: 1, ease: 'Quad.easeOut' });
  }

  destroy(): void { this.bob.stop(); this.img.destroy(); }
}
