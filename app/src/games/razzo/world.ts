import Phaser from 'phaser';
import { view } from '../../core/ui';
import { PF, EYES, RF, SKY_TOP, SKY_BOTTOM } from './art';
import { planetById, type PlanetId, type RocketId } from './planets';
import { sfx } from './sfx';

/** Elementi di scena condivisi: spazio a piani in parallasse, razzo con fiamma, pianeta buffo. */

export const hex = (c: string): number => parseInt(c.slice(1), 16);

/** Zona coperta dallo sfondo: più larga dell'area di design, per i telefoni allungati e i tablet. */
const BG = { x: -1100, y: -700, w: 4120, h: 2480 };

/**
 * Spazio blu profondo: cielo sfumato con le stelle lontane (un solo piano a tutto schermo che scorre piano),
 * nebulose colorate, pianetini lontani nella foschia, stelline scintillanti più vicine e scie sfocate in primo piano.
 * Pensato per i telefoni economici: un solo piano copre tutto lo schermo, il resto sono immagini piccole o sfumate.
 * `update(dt, speed)` fa scorrere tutto verso sinistra alla velocità del viaggio (0 = fermo, solo deriva lenta).
 */
export class SpaceBg {
  private sky: Phaser.GameObjects.TileSprite;
  private nebulas: Phaser.GameObjects.Image[] = [];
  private decor: Phaser.GameObjects.Image[] = [];
  private twinkles: Phaser.GameObjects.Image[] = [];
  private dust: Phaser.GameObjects.Image[] = [];
  private t = 0;

  constructor(private scene: Phaser.Scene, opts: { nebula?: string; decor?: PlanetId[]; dust?: boolean } = {}) {
    // sopra e sotto l'area di design (tablet, schermi alti): tinta unita uguale al bordo del cielo
    scene.add.rectangle(BG.x, BG.y, BG.w, -BG.y, hex(SKY_TOP)).setOrigin(0).setDepth(0);
    scene.add.rectangle(BG.x, 1080, BG.w, BG.y + BG.h - 1080, hex(SKY_BOTTOM)).setOrigin(0).setDepth(0);
    this.sky = scene.add.tileSprite(BG.x, 0, BG.w, 1080, 'rz_sky').setOrigin(0).setDepth(1);
    const neb = opts.nebula ?? 'violet';
    const nebs: Array<[string, number, number, number, number]> = [[neb, 1300, 300, 2.3, 0.75], [neb === 'teal' ? 'pink' : 'teal', 200, 820, 1.7, 0.45]];
    for (const [k, x, y, sc, a] of nebs) this.nebulas.push(scene.add.image(x, y, `rz_neb_${k}`).setScale(sc).setAlpha(a).setDepth(2));
    // pianetini lontani, velati dalla foschia
    (opts.decor ?? []).forEach((id, i) => {
      const p = scene.add.image(i % 2 ? 980 : 1660, i % 2 ? 960 : 330, `rz_planet_${id}`).setScale(0.2 + (i % 2) * 0.08).setDepth(4).setAlpha(0.55).setTint(0xb8c4ff);
      this.decor.push(p);
    });
    for (let i = 0; i < 16; i++) {
      this.twinkles.push(scene.add.image(-200 + ((i * 523) % 2400), 60 + ((i * 337) % 960), 'rz_twinkle').setScale(0.35 + (i % 3) * 0.17).setDepth(5));
    }
    if (opts.dust) {
      for (let i = 0; i < 6; i++) {
        this.dust.push(scene.add.image(i * 420, 120 + ((i * 173) % 860), 'rz_dust').setDepth(800).setAlpha(0.28 + (i % 3) * 0.08).setScale(1.2 + (i % 2) * 0.8, 1 + (i % 2)));
      }
    }
    // entrata: i piani vicini arrivano un po' più da lontano (parallasse)
    const slide = (o: { x: number }, dx: number) => { const x = o.x; o.x += dx; scene.tweens.add({ targets: o, x, duration: 1400, ease: 'Cubic.easeOut' }); };
    this.nebulas.forEach((n) => slide(n, 60));
    this.decor.forEach((d) => slide(d, 120));
  }

  update(dt: number, speed: number): void {
    this.t += dt;
    const drift = 14 + speed;
    this.sky.tilePositionX += drift * 0.06 * dt;
    const v = view(this.scene);
    for (const n of this.nebulas) {
      n.x -= drift * 0.06 * dt;
      if (n.x < v.left - 900) n.x = v.right + 800;
    }
    for (const d of this.decor) {
      d.x -= drift * 0.1 * dt;
      if (d.x < v.left - 200) { d.x = v.right + 400; d.y = 200 + Math.random() * 680; }
    }
    this.twinkles.forEach((tw, i) => {
      tw.x -= drift * (0.22 + (i % 3) * 0.06) * dt;
      if (tw.x < v.left - 40) { tw.x = v.right + 40 + Math.random() * 200; tw.y = 40 + Math.random() * 1000; }
      tw.setAlpha(0.55 + 0.45 * Math.sin(this.t * (1.5 + (i % 4) * 0.4) + i));
    });
    for (const d of this.dust) {
      d.x -= (speed * 1.7 + 30) * dt;
      d.setVisible(speed > 50);
      if (d.x < v.left - 300) { d.x = v.right + 200 + Math.random() * 400; d.y = 100 + Math.random() * 880; }
    }
  }
}

/**
 * Il razzo: immagine + fiamma (+ alone quando spinge). Niente Container (Phaser 4 e rotazioni):
 * le due immagini si posizionano a mano, la fiamma resta attaccata allo scarico anche quando il razzo si inclina.
 */
export class RocketView {
  readonly img: Phaser.GameObjects.Image;
  private flame: Phaser.GameObjects.Image;
  private glow: Phaser.GameObjects.Image;
  private power = 0.45;
  private want = 0.45;
  x: number;
  y: number;
  /** inclinazione in gradi (0 = punta a destra, -90 = punta in alto) */
  angle = 0;
  /** schiacciamento (1 = normale) */
  squash = 1;

  constructor(scene: Phaser.Scene, id: RocketId, x: number, y: number, readonly scale = 0.82, depth = 60) {
    this.x = x;
    this.y = y;
    this.glow = scene.add.image(x, y, 'glow').setTint(0xffb84a).setBlendMode(Phaser.BlendModes.ADD).setDepth(depth - 1).setAlpha(0);
    this.flame = scene.add.image(x, y, 'rz_flame').setOrigin(1, 0.5).setDepth(depth - 0.5);
    this.img = scene.add.image(x, y, `rz_rocket_${id}`).setDepth(depth).setScale(scale);
    this.sync(0);
  }

  setRocket(id: RocketId): void { this.img.setTexture(`rz_rocket_${id}`); }

  /** Potenza della fiamma: 0 spenta, 1 piena (si avvicina dolcemente). */
  thrust(p: number): void { this.want = p; }

  setVisible(v: boolean): this {
    this.img.setVisible(v); this.flame.setVisible(v); this.glow.setVisible(v);
    return this;
  }

  setAlpha(a: number): void { this.img.setAlpha(a); this.flame.setAlpha(a); }

  sync(dt: number): void {
    this.power += (this.want - this.power) * Math.min(1, dt * 10);
    const s = this.scale;
    const rad = Phaser.Math.DegToRad(this.angle);
    this.img.setPosition(this.x, this.y).setAngle(this.angle).setScale(s * (2 - this.squash), s * this.squash);
    const tail = (RF.tailX - RF.w / 2) * s * (2 - this.squash);
    const fx = this.x + Math.cos(rad) * tail, fy = this.y + Math.sin(rad) * tail;
    const flick = 0.85 + Math.random() * 0.25;
    const len = (0.25 + this.power * 0.85) * flick;
    this.flame.setPosition(fx, fy).setAngle(this.angle).setScale(s * len, s * (0.55 + this.power * 0.45)).setVisible(this.img.visible && this.power > 0.03);
    this.glow.setPosition(fx - Math.cos(rad) * 50 * s, fy - Math.sin(rad) * 50 * s).setAlpha(this.power * 0.55).setScale(1.2 + this.power * 0.6);
  }

  destroy(): void { this.img.destroy(); this.flame.destroy(); this.glow.destroy(); }
}

/** Un pianeta buffo: sbatte le palpebre, ridacchia e si schiaccia quando lo tocchi. */
export class PlanetView {
  readonly img: Phaser.GameObjects.Image;
  private lid: Phaser.GameObjects.Image;
  private base: number;
  private busy = false;

  constructor(private scene: Phaser.Scene, readonly id: PlanetId | 'casa', x: number, y: number, scale: number, depth = 40, opts: { idle?: boolean } = {}) {
    this.base = scale;
    this.img = scene.add.image(x, y, `rz_planet_${id}`).setScale(scale).setDepth(depth);
    const tint = id === 'casa' ? 0x4aa8ef : hex(planetById(id).base);
    this.lid = scene.add.image(x, y, 'rz_lid').setScale(scale).setDepth(depth + 0.1).setTint(tint).setVisible(false);
    this.placeLid();
    if (opts.idle !== false) this.startIdle();
  }

  /** Raggio della sfera sullo schermo. */
  get radius(): number { return PF.r * this.img.scaleX; }
  /** Sommità della sfera (per appoggiarci il razzo). */
  get top(): number { return this.img.y + (PF.cy - PF.h / 2 - PF.r) * this.img.scaleY; }

  private placeLid(): void {
    this.lid.setPosition(this.img.x, this.img.y + (EYES.y - PF.cy) * this.img.scaleY).setScale(this.img.scaleX, this.img.scaleY);
  }

  setPosition(x: number, y: number): void { this.img.setPosition(x, y); this.placeLid(); }
  get x(): number { return this.img.x; }
  get y(): number { return this.img.y; }

  setAlpha(a: number): void { this.img.setAlpha(a); this.lid.setAlpha(a); }

  /** Respiro e battito di ciglia. */
  startIdle(): void {
    this.scene.tweens.add({ targets: this.img, scaleX: this.base * 1.015, scaleY: this.base * 0.99, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', onUpdate: () => this.placeLid() });
    const blink = () => {
      if (!this.img.active) return;
      if (!this.busy) {
        this.lid.setVisible(true);
        this.scene.time.delayedCall(150, () => { if (!this.busy) this.lid.setVisible(false); });
      }
      this.scene.time.delayedCall(2000 + Math.random() * 2600, blink);
    };
    this.scene.time.delayedCall(900 + Math.random() * 1500, blink);
  }

  /** Risatina: occhi chiusi felici, schiacciamento e saltello. */
  giggle(withSound = true): void {
    if (this.busy) return;
    this.busy = true;
    if (withSound) sfx.giggle(this.id === 'casa' ? 1 : planetById(this.id).giggle);
    this.lid.setVisible(true);
    const y = this.img.y;
    this.scene.tweens.add({ targets: this.img, y: y - 26 * this.base, duration: 140, yoyo: true, repeat: 2, ease: 'Sine.easeInOut', onUpdate: () => this.placeLid() });
    this.scene.time.delayedCall(900, () => { this.lid.setVisible(false); this.busy = false; this.img.y = y; this.placeLid(); });
  }

  hit(x: number, y: number, extra = 20): boolean {
    return Phaser.Math.Distance.Between(x, y, this.img.x, this.img.y) < this.radius + extra;
  }

  /** Sagoma scura (pianeta non ancora visitato). */
  silhouette(): void {
    this.img.setTint(0x1a2266).setAlpha(0.55);
    this.lid.setVisible(false);
    this.busy = true;
  }
}
