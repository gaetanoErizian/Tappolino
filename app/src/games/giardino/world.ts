import Phaser from 'phaser';
import { burst } from '../../core/ui';
import {
  CLOUD_MAX_X, CLOUD_MIN_X, CLOUD_Y, PLANT_TOP, PLOT_POS, flowerById, fairyById,
  type FairyId, type FlowerId, type Plot, type Stage,
} from './logic';
import { sfx } from './sfx';

/** Elementi di scena: radura a piani, vasi con le piante, nuvola, farfalle, fatine, lucciole. */

export const hex = (c: string): number => parseInt(c.slice(1), 16);

/** Il sole del mattino, in alto a sinistra (da lì viene la luce). */
export const SUN = { x: 420, y: 120 };

/** Linea dell'orizzonte (cielo → prato). */
export const HORIZON = 600;

const slideIn = (scene: Phaser.Scene, list: { x: number }[], dx: number): void => {
  for (const o of list) {
    const x = o.x;
    o.x += dx;
    scene.tweens.add({ targets: o, x, duration: 1400, ease: 'Cubic.easeOut' });
  }
};

/** Lucciole: piccole luci calde che vagano piano (si possono toccare). */
export interface Firefly { img: Phaser.GameObjects.Image }

/**
 * Radura al mattino, 2.5D: cielo chiaro con il sole in alto a sinistra, colline lontane nella foschia,
 * colline vicine con gli alberi, prato, decorazioni dell'aiuola (albero, stagno o funghi e arcobaleno),
 * erba alta sfocata in primo piano, lucciole. Parallasse all'ingresso.
 */
export function drawMeadow(scene: Phaser.Scene, bed: number): Firefly[] {
  const sky = scene.add.graphics().setDepth(0);
  sky.fillGradientStyle(0x8fd0ff, 0x8fd0ff, 0xfff1d8, 0xfff1d8, 1).fillRect(-2000, -1600, 5920, 1600 + HORIZON + 40);
  const sun = scene.add.image(SUN.x, SUN.y, 'sun').setScale(0.7).setDepth(0.4);
  scene.tweens.add({ targets: sun, scale: 0.75, duration: 2800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  const rays = scene.add.graphics().setDepth(0.45).setBlendMode(Phaser.BlendModes.ADD);
  rays.fillStyle(0xfff6c8, 0.07);
  for (const [a, b] of [[0.35, 0.5], [0.62, 0.72], [0.9, 1.02]]) {
    rays.beginPath().moveTo(SUN.x, SUN.y).lineTo(SUN.x + Math.cos(a) * 2400, SUN.y + Math.sin(a) * 2400).lineTo(SUN.x + Math.cos(b) * 2400, SUN.y + Math.sin(b) * 2400).closePath().fillPath();
  }
  const clouds = [
    scene.add.image(1500, 110, 'cloud').setScale(0.5).setAlpha(0.85).setDepth(0.5),
    scene.add.image(820, 70, 'cloud').setScale(0.36).setAlpha(0.75).setDepth(0.5),
  ];
  clouds.forEach((c, i) => scene.tweens.add({ targets: c, x: c.x + (i ? 60 : -80), duration: 9000 + i * 3000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }));

  const far: Phaser.GameObjects.Image[] = [];
  if (bed === 2) far.push(scene.add.image(1180, HORIZON + 20, 'gi_rainbow').setOrigin(0.5, 1).setAlpha(0.85).setDepth(0.8));
  far.push(scene.add.image(960, HORIZON + 30, 'gi_hills_far').setOrigin(0.5, 1).setDepth(1));
  const near = [scene.add.image(960, HORIZON + 90, 'gi_hills_near').setOrigin(0.5, 1).setDepth(2)];

  // prato: più chiaro verso l'orizzonte (foschia del mattino), macchie di luce, fiorellini
  const ground = scene.add.graphics().setDepth(3);
  ground.fillGradientStyle(0xb6e88a, 0xb6e88a, 0x5fae46, 0x5fae46, 1).fillRect(-2000, HORIZON + 40, 5920, 2000);
  ground.fillStyle(0xffffff, 0.12);
  ground.fillEllipse(700, 760, 1100, 120).fillEllipse(1400, 1010, 900, 90);
  const dots: [number, number, number][] = [];
  for (let i = 0; i < 70; i++) dots.push([((i * 397) % 2600) - 340, HORIZON + 70 + ((i * 211) % 440), i % 4]);
  for (const [x, y, k] of dots) {
    if (PLOT_POS.some((p) => Math.abs(p.x - x) < 170 * p.s && Math.abs(p.y - 30 - y) < 70)) continue;
    const r = 3 + (y - HORIZON) / 90;
    ground.fillStyle([0xffffff, 0xffd6ea, 0xfff3a0, 0xd9ccff][k], 0.9).fillCircle(x, y, r);
    ground.fillStyle(0x4f9e3a, 0.35).fillEllipse(x + r * 0.4, y + r * 1.4, r * 3, r * 0.9);
  }

  const mid: Phaser.GameObjects.Image[] = [];
  if (bed === 0) {
    mid.push(scene.add.image(70, 730, 'gi_tree').setOrigin(0.5, 1).setScale(0.95).setDepth(4));
    mid.push(scene.add.image(1800, 760, 'gi_bush').setOrigin(0.5, 1).setDepth(4));
  } else if (bed === 1) {
    mid.push(scene.add.image(1790, 770, 'gi_pond').setOrigin(0.5, 1).setDepth(4));
    mid.push(scene.add.image(150, 720, 'gi_tree').setOrigin(0.5, 1).setScale(0.78).setFlipX(true).setDepth(4));
  } else {
    mid.push(scene.add.image(150, 770, 'gi_mushroom').setOrigin(0.5, 1).setScale(0.95).setDepth(4));
    mid.push(scene.add.image(30, 700, 'gi_mushroom').setOrigin(0.5, 1).setScale(0.55).setDepth(3.9));
    mid.push(scene.add.image(1790, 790, 'gi_mushroom').setOrigin(0.5, 1).setDepth(4));
    mid.push(scene.add.image(1910, 720, 'gi_mushroom').setOrigin(0.5, 1).setScale(0.6).setDepth(3.9));
  }
  const fg = [
    scene.add.image(-330, 1110, 'gi_fg_grass').setOrigin(0, 1).setScale(0.62).setDepth(800),
    scene.add.image(2250, 1110, 'gi_fg_grass').setOrigin(1, 1).setScale(0.62).setFlipX(true).setDepth(800),
  ];
  slideIn(scene, far, 30);
  slideIn(scene, near, 60);
  slideIn(scene, mid, 110);
  slideIn(scene, fg, 220);

  // lucciole del mattino
  const flies: Firefly[] = [];
  for (let i = 0; i < 9; i++) {
    const img = scene.add.image(260 + ((i * 523) % 1400), 420 + ((i * 337) % 520), 'glow').setScale(0.22)
      .setTint(0xfff1a0).setBlendMode(Phaser.BlendModes.ADD).setDepth(700).setAlpha(0.7);
    flies.push({ img });
    wanderFly(scene, img);
    scene.tweens.add({ targets: img, alpha: 0.25, duration: 700 + i * 90, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
  return flies;
}

function wanderFly(scene: Phaser.Scene, img: Phaser.GameObjects.Image): void {
  const go = (): void => {
    if (!img.active) return;
    const x = Phaser.Math.Clamp(img.x + Phaser.Math.Between(-220, 220), 120, 1800);
    const y = Phaser.Math.Clamp(img.y + Phaser.Math.Between(-140, 140), 380, 1010);
    scene.tweens.add({ targets: img, x, y, duration: Phaser.Math.Between(2200, 3600), ease: 'Sine.easeInOut', onComplete: go });
  };
  go();
}

// =====================================================================
// Vaso: terra + pianta (seme, germoglio, bocciolo, fiore)
// =====================================================================

const PLANT_SCALE = 0.8;
/** Base della pianta sopra il punto del vaso (a scala 1). */
const STEM_BASE = 56;

export class PlotView {
  readonly x: number;
  readonly y: number;
  readonly s: number;
  readonly soil: Phaser.GameObjects.Image;
  plant?: Phaser.GameObjects.Image;
  glow?: Phaser.GameObjects.Image;
  bubble?: Phaser.GameObjects.Image;
  plot: Plot;
  private depth: number;

  constructor(private scene: Phaser.Scene, readonly i: number, plot: Plot) {
    const pos = PLOT_POS[i];
    this.x = pos.x; this.y = pos.y; this.s = pos.s;
    this.depth = 10 + pos.y / 100;
    this.plot = { ...plot };
    this.soil = scene.add.image(this.x, this.y, plot.s > 0 && plot.s < 4 ? 'gi_soil_wet' : 'gi_soil').setOrigin(0.5, 0.8).setScale(this.s).setDepth(this.depth);
    this.draw();
  }

  /** Cima della pianta (per fumetti, farfalle, scintille). */
  get top(): number { return this.y - PLANT_TOP[this.plot.s] * this.s; }
  /** Centro della corolla del fiore sbocciato. */
  get head(): { x: number; y: number } { return { x: this.x, y: this.y - (STEM_BASE + 232) * this.s }; }

  private draw(): void {
    this.plant?.destroy(); this.plant = undefined;
    this.glow?.destroy(); this.glow = undefined;
    const { s, f } = this.plot;
    if (s === 0 || !f) return;
    const k = this.s * PLANT_SCALE;
    const by = this.y - STEM_BASE * this.s;
    if (s === 1) this.plant = this.scene.add.image(this.x, this.y - 62 * this.s, 'gi_seed').setOrigin(0.5, 0.7).setScale(k);
    else if (s === 2) this.plant = this.scene.add.image(this.x, by, 'gi_sprout').setOrigin(0.5, 1).setScale(k);
    else if (s === 3) this.plant = this.scene.add.image(this.x, by, `gi_bud_${f}`).setOrigin(0.5, 1).setScale(k);
    else {
      this.plant = this.scene.add.image(this.x, by, `gi_fl_${f}`).setOrigin(0.5, 1).setScale(k);
      const h = this.head;
      this.glow = this.scene.add.image(h.x, h.y, 'glow').setScale(2.3 * this.s).setTint(hex(flowerById(f).glow))
        .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.5).setDepth(this.depth - 0.02);
      this.scene.tweens.add({ targets: this.glow, alpha: 0.25, scale: 2.0 * this.s, duration: 1600 + this.i * 130, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      // leggero ondeggiare del fiore
      this.scene.tweens.add({ targets: this.plant, scaleX: k * 0.97, scaleY: k * 1.02, duration: 1400 + this.i * 170, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    this.plant.setDepth(this.depth + 0.01);
  }

  /** Nuovo stato del vaso, con l'animazione giusta. */
  set(plot: Plot): void {
    const before = this.plot.s;
    this.plot = { ...plot };
    this.soil.setTexture(plot.s > 0 && plot.s < 4 ? 'gi_soil_wet' : 'gi_soil');
    this.draw();
    this.setThirsty(plot.s > 0 && plot.s < 4);
    if (!this.plant || plot.s === before) return;
    const p = this.plant;
    const sx = p.scaleX, sy = p.scaleY;
    if (plot.s === 4) {
      p.setScale(sx * 0.2, sy * 0.2);
      this.scene.tweens.killTweensOf(p);
      this.scene.tweens.add({
        targets: p, scaleX: sx, scaleY: sy, duration: 700, ease: 'Back.easeOut',
        onComplete: () => this.scene.tweens.add({ targets: p, scaleX: sx * 0.97, scaleY: sy * 1.02, duration: 1400 + this.i * 170, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }),
      });
      this.glow?.setScale(0.2);
    } else if (plot.s > 1) {
      p.setScale(sx * 0.5, sy * 0.2);
      this.scene.tweens.add({ targets: p, scaleX: sx, scaleY: sy, duration: 420, ease: 'Back.easeOut' });
    }
    this.squashSoil();
  }

  squashSoil(): void {
    const s = this.s;
    this.scene.tweens.add({ targets: this.soil, scaleX: s * 1.08, scaleY: s * 0.88, duration: 90, yoyo: true, ease: 'Quad.easeOut' });
  }

  /** Il seme cade dall'alto e si infila nella terra. */
  dropSeed(onLand: () => void): void {
    const k = this.s * PLANT_SCALE;
    const seed = this.scene.add.image(this.x, this.y - 420 * this.s, 'gi_seed').setScale(k * 1.2).setDepth(this.depth + 0.5);
    const trail = this.scene.time.addEvent({
      delay: 50, repeat: 8,
      callback: () => burst(this.scene, seed.x, seed.y - 10, 'sparkle', { count: 1, tints: [0xfff3a0, 0xffffff], speed: [10, 40], scale: [0.4, 0], gravity: 0, life: 420, depth: this.depth + 0.4 }),
    });
    this.scene.tweens.add({
      targets: seed, y: this.y - 62 * this.s, scale: k, duration: 420, ease: 'Quad.easeIn',
      onComplete: () => { trail.remove(); seed.destroy(); onLand(); },
    });
  }

  /** Fumetto "ho sete" sopra la piantina. */
  setThirsty(on: boolean): void {
    if (!on) { this.bubble?.destroy(); this.bubble = undefined; return; }
    const y = this.top - 40 * this.s;
    if (!this.bubble) {
      this.bubble = this.scene.add.image(this.x + 66 * this.s, y, 'gi_bubble').setScale(0).setDepth(this.depth + 0.6).setOrigin(0.25, 0.9);
      this.scene.tweens.add({ targets: this.bubble, scale: 0.62 * this.s, duration: 300, delay: 350, ease: 'Back.easeOut' });
      this.scene.tweens.add({ targets: this.bubble, y: y - 10, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    } else {
      this.scene.tweens.killTweensOf(this.bubble);
      this.bubble.setPosition(this.x + 66 * this.s, y).setScale(0.62 * this.s);
      this.scene.tweens.add({ targets: this.bubble, y: y - 10, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  /** La piantina assetata si dondola e chiede la pioggia. */
  ask(): void {
    sfx.thirsty();
    if (this.plant) {
      const p = this.plant, sx = p.scaleX;
      this.scene.tweens.add({ targets: p, scaleX: sx * 1.12, duration: 110, yoyo: true, repeat: 1 });
    }
    if (this.bubble) {
      const b = this.bubble, s = b.scale;
      this.scene.tweens.add({ targets: b, scale: s * 1.3, duration: 140, yoyo: true });
    }
  }

  /** Il fiore canta la sua nota e saltella un po'. */
  sing(vol = 0.75): void {
    if (!this.plant || this.plot.s !== 4 || !this.plot.f) return;
    sfx.sing(this.plot.f, vol);
    const p = this.plant, k = this.s * PLANT_SCALE;
    this.scene.tweens.killTweensOf(p);
    this.scene.tweens.chain({
      targets: p,
      tweens: [
        { scaleX: k * 1.1, scaleY: k * 0.9, duration: 90, ease: 'Quad.easeOut' },
        { scaleX: k * 0.94, scaleY: k * 1.1, duration: 140, ease: 'Quad.easeOut' },
        { scaleX: k, scaleY: k, duration: 260, ease: 'Back.easeOut' },
      ],
      onComplete: () => { if (p.active) this.scene.tweens.add({ targets: p, scaleX: k * 0.97, scaleY: k * 1.02, duration: 1400 + this.i * 170, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); },
    });
    const h = this.head;
    const tint = hex(flowerById(this.plot.f).glow);
    burst(this.scene, h.x, h.y - 40 * this.s, 'sparkle', { count: 6, tints: [0xffffff, tint], speed: [100, 260], scale: [0.5, 0], gravity: -60, life: 700, depth: 750 });
    this.note(h.x + 70 * this.s, h.y - 80 * this.s, tint);
  }

  /** Notina che vola via dal fiore che canta. */
  private note(x: number, y: number, tint: number): void {
    const g = this.scene.add.graphics().setDepth(760).setPosition(x, y);
    g.fillStyle(tint, 1).fillEllipse(0, 0, 26, 20).fillRect(9, -44, 5, 44);
    g.lineStyle(3, 0xffffff, 0.9).strokeEllipse(0, 0, 26, 20);
    g.fillStyle(0xffffff, 0.7).fillEllipse(-5, -4, 8, 5);
    g.setScale(0);
    this.scene.tweens.add({ targets: g, scale: 1, duration: 200, ease: 'Back.easeOut' });
    this.scene.tweens.add({ targets: g, y: y - 120, x: x + 40, alpha: 0, duration: 1100, delay: 120, ease: 'Sine.easeOut', onComplete: () => g.destroy() });
  }

  hide(): void { this.plant?.setVisible(false); this.glow?.setVisible(false); this.bubble?.setVisible(false); }
}

// =====================================================================
// La nuvoletta
// =====================================================================

export class CloudView {
  readonly img: Phaser.GameObjects.Image;
  busy = false;
  private bob: Phaser.Tweens.Tween;

  constructor(private scene: Phaser.Scene, x: number) {
    this.img = scene.add.image(Phaser.Math.Clamp(x, CLOUD_MIN_X, CLOUD_MAX_X), CLOUD_Y, 'gi_cloud').setDepth(600).setScale(0.82);
    this.bob = scene.tweens.add({ targets: this.img, y: CLOUD_Y + 10, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  get x(): number { return this.img.x; }

  hit(x: number, y: number): boolean {
    const dx = (x - this.img.x) / 190, dy = (y - this.img.y) / 120;
    return dx * dx + dy * dy < 1;
  }

  /** Schiacciatina al tocco (risposta immediata anche quando è già al lavoro). */
  squish(): void {
    this.scene.tweens.add({ targets: this.img, scaleX: 0.9, scaleY: 0.74, duration: 90, yoyo: true, ease: 'Quad.easeOut' });
  }

  /** Va sopra la piantina e fa piovere; `onRain` a metà pioggia, `onDone` alla fine. */
  rainOn(x: number, targetY: number, onRain: () => void, onDone: () => void): void {
    this.busy = true;
    const tx = Phaser.Math.Clamp(x, CLOUD_MIN_X, CLOUD_MAX_X);
    const dur = Math.min(650, 120 + Math.abs(tx - this.img.x) * 0.6);
    this.scene.tweens.add({
      targets: this.img, x: tx, duration: dur, ease: 'Sine.easeInOut',
      onComplete: () => {
        this.img.setTexture('gi_cloud_rain');
        sfx.rain();
        this.squish();
        this.drops(tx, targetY, 900);
        this.scene.time.delayedCall(650, onRain);
        this.scene.time.delayedCall(1000, () => { this.img.setTexture('gi_cloud'); this.busy = false; onDone(); });
      },
    });
  }

  /** Poche gocce e una risatina: niente da innaffiare adesso. */
  sprinkle(): void {
    sfx.cloud();
    this.squish();
    this.img.setTexture('gi_cloud_rain');
    this.drops(this.img.x, CLOUD_Y + 360, 300, 6);
    this.scene.time.delayedCall(450, () => { if (!this.busy) this.img.setTexture('gi_cloud'); });
  }

  private drops(x: number, targetY: number, ms: number, qty = 0): void {
    const y0 = this.img.y + 70;
    const speed = 900;
    const life = Math.max(200, ((targetY - y0) / speed) * 1000);
    const e = this.scene.add.particles(0, 0, 'gi_drop', {
      x: { min: x - 110, max: x + 110 }, y: y0,
      speedY: { min: speed * 0.9, max: speed * 1.1 }, speedX: { min: -10, max: 10 },
      lifespan: life, scale: { min: 0.7, max: 1.1 }, alpha: { start: 1, end: 0.6 },
      frequency: qty ? -1 : 22, emitting: !qty,
    }).setDepth(590);
    if (qty) e.explode(qty);
    else this.scene.time.delayedCall(ms, () => e.stop());
    this.scene.time.delayedCall(ms + life + 200, () => e.destroy());
    // spruzzi a terra
    if (!qty) {
      for (let k = 0; k < 4; k++) {
        this.scene.time.delayedCall(life + k * 180, () => burst(this.scene, x + Phaser.Math.Between(-80, 80), targetY, 'dot', { count: 4, tints: [0xbfe8ff, 0xffffff], speed: [80, 180], scale: [0.5, 0], gravity: 500, life: 380, depth: 595 }));
      }
    }
  }

  stop(): void { this.bob.stop(); }
}

// =====================================================================
// Farfalle
// =====================================================================

export class Butterfly {
  readonly img: Phaser.GameObjects.Image;
  private flap: Phaser.Tweens.Tween;
  private away = false;

  constructor(private scene: Phaser.Scene, flower: FlowerId, private home: { x: number; y: number }, arrive = false) {
    const from = arrive ? { x: home.x < 960 ? -150 : 2070, y: home.y - 200 } : home;
    this.img = scene.add.image(from.x, from.y, `gi_bf_${flower}`).setScale(0.6).setDepth(520 + Math.random());
    this.flap = scene.tweens.add({ targets: this.img, scaleX: 0.16, duration: 110 + Math.random() * 40, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    if (arrive) {
      scene.tweens.add({ targets: this.img, x: home.x, y: home.y, duration: 1800, ease: 'Sine.easeInOut', onComplete: () => this.wander() });
    } else {
      this.scene.time.delayedCall(Math.random() * 1500, () => this.wander());
    }
  }

  private wander(): void {
    if (!this.img.active || this.away) return;
    const x = this.home.x + Phaser.Math.Between(-170, 170);
    const y = Phaser.Math.Clamp(this.home.y + Phaser.Math.Between(-110, 90), 300, 980);
    this.scene.tweens.add({ targets: this.img, x, y, duration: Phaser.Math.Between(1600, 2800), ease: 'Sine.easeInOut', onComplete: () => this.wander() });
  }

  hit(x: number, y: number): boolean { return !this.away && Phaser.Math.Distance.Between(x, y, this.img.x, this.img.y) < 80; }

  /** Volo veloce in alto e ritorno. */
  flutter(): void {
    sfx.flutter();
    this.away = true;
    this.scene.tweens.killTweensOf(this.img);
    this.flap = this.scene.tweens.add({ targets: this.img, scaleX: 0.16, duration: 60, yoyo: true, repeat: -1 });
    burst(this.scene, this.img.x, this.img.y, 'sparkle', { count: 6, tints: [0xffffff, 0xfff3a0], speed: [80, 200], scale: [0.4, 0], gravity: 0, life: 500, depth: 760 });
    const ux = this.img.x + Phaser.Math.Between(-260, 260);
    this.scene.tweens.chain({
      targets: this.img,
      tweens: [
        { x: ux, y: this.img.y - 260, duration: 600, ease: 'Sine.easeOut' },
        { x: this.home.x, y: this.home.y, duration: 1300, ease: 'Sine.easeInOut' },
      ],
      onComplete: () => {
        this.flap.stop();
        this.flap = this.scene.tweens.add({ targets: this.img, scaleX: 0.16, duration: 130, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.away = false;
        this.wander();
      },
    });
  }
}

// =====================================================================
// Fatine
// =====================================================================

/** Posti dove volano le fatine: ai lati dell'aiuola e in alto, sopra i fiori (così non coprono i vasi). */
export const FAIRY_SPOTS = [
  { x: 1700, y: 460 }, { x: 240, y: 470 }, { x: 760, y: 300 }, { x: 1190, y: 290 }, { x: 110, y: 690 }, { x: 1810, y: 680 },
];

export class FairyView {
  readonly c: Phaser.GameObjects.Container;
  private body: Phaser.GameObjects.Image;
  busy = false;
  private hover?: Phaser.Tweens.Tween;

  constructor(private scene: Phaser.Scene, readonly id: FairyId, private spot: { x: number; y: number }, scale = 0.72, depth = 560) {
    const f = fairyById(id);
    this.c = scene.add.container(spot.x, spot.y).setDepth(depth).setScale(scale);
    const wl = scene.add.image(-4, -8, 'gi_wing').setOrigin(1, 0.55).setFlipX(true).setTint(hex(f.wing)).setScale(0.75).setAlpha(0.9);
    const wr = scene.add.image(4, -8, 'gi_wing').setOrigin(0, 0.55).setTint(hex(f.wing)).setScale(0.75).setAlpha(0.9);
    const glow = scene.add.image(0, 0, 'glow').setScale(1.5).setTint(hex(f.wing)).setAlpha(0.45).setBlendMode(Phaser.BlendModes.ADD);
    this.body = scene.add.image(0, 0, `gi_fairy_${id}`);
    this.c.add([glow, wl, wr, this.body]);
    scene.tweens.add({ targets: [wl, wr], scaleX: 0.28, duration: 150, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.idle();
  }

  private idle(): void {
    this.hover?.stop();
    this.hover = this.scene.tweens.add({ targets: this.c, y: this.c.y - 18, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  hit(x: number, y: number): boolean {
    return Phaser.Math.Distance.Between(x, y, this.c.x, this.c.y) < 95 * this.c.scale / 0.72;
  }

  /** Vola verso un punto lasciando una scia di scintille. */
  flyTo(x: number, y: number, ms: number, onDone?: () => void): void {
    this.busy = true;
    this.hover?.stop();
    const tint = hex(fairyById(this.id).wing);
    const trail = this.scene.time.addEvent({
      delay: 70, loop: true,
      callback: () => burst(this.scene, this.c.x, this.c.y + 30, 'sparkle', { count: 1, tints: [0xffffff, tint, 0xfff3a0], speed: [10, 60], scale: [0.45, 0], gravity: 40, life: 600, depth: this.c.depth - 1 }),
    });
    if (x < this.c.x) this.body.setFlipX(true); else this.body.setFlipX(false);
    this.scene.tweens.add({
      targets: this.c, x, y, duration: ms, ease: 'Sine.easeInOut',
      onComplete: () => { trail.remove(); this.body.setFlipX(false); this.busy = false; this.idle(); onDone?.(); },
    });
  }

  /** Arrivo da fuori scena: entra volando, fa una giravolta e saluta. */
  arrive(onDone?: () => void): void {
    const to = { ...this.spot };
    this.c.setPosition(to.x < 960 ? -200 : 2120, 120);
    sfx.fairy();
    this.flyTo(to.x, to.y, 1500, () => { this.twirl(false); onDone?.(); });
  }

  /** Giravolta (oggetto piccolo: si gira con la scala, non con la rotazione) e polvere di fata. */
  twirl(sound = true): void {
    if (sound) sfx.giggle();
    const s = this.c.scale;
    this.scene.tweens.chain({
      targets: this.body,
      tweens: [{ scaleX: -1, duration: 160, ease: 'Sine.easeInOut' }, { scaleX: 1, duration: 160, ease: 'Sine.easeInOut' }],
    });
    this.scene.tweens.add({ targets: this.c, scale: s * 1.12, duration: 160, yoyo: true });
    const tint = hex(fairyById(this.id).wing);
    burst(this.scene, this.c.x, this.c.y, 'sparkle', { count: 12, tints: [0xffffff, tint, 0xfff3a0], speed: [120, 320], scale: [0.55, 0], gravity: 80, life: 800, depth: this.c.depth + 1 });
    burst(this.scene, this.c.x, this.c.y - 20, 'heart', { count: 2, speed: [80, 160], scale: [0.45, 0.15], gravity: -100, life: 900, depth: this.c.depth + 1 });
  }

  /** Ogni tanto cambia posto, restando vicino alla sua casa. */
  roam(): void {
    if (this.busy) return;
    const x = Phaser.Math.Clamp(this.spot.x + Phaser.Math.Between(-120, 120), 90, 1830);
    const y = Phaser.Math.Clamp(this.spot.y + Phaser.Math.Between(-50, 50), 260, 720);
    this.flyTo(x, y, 1800);
  }
}

/** Testo di una fatina o di un fiore (nome) che compare e sparisce. */
export function floatingLabel(scene: Phaser.Scene, x: number, y: number, text: string, font: string, color = '#3f9a3a'): void {
  const lbl = scene.add.text(x, y, text, {
    fontFamily: font, fontSize: '46px', fontStyle: '700', color: '#ffffff', stroke: color, strokeThickness: 9,
  }).setOrigin(0.5).setDepth(950).setScale(0);
  lbl.x = Phaser.Math.Clamp(x, 140 + lbl.width / 2, 1780 - lbl.width / 2);
  scene.tweens.add({ targets: lbl, scale: 1, y: y - 30, duration: 300, ease: 'Back.easeOut' });
  scene.tweens.add({ targets: lbl, alpha: 0, duration: 400, delay: 1500, onComplete: () => lbl.destroy() });
}

export type { Stage };
