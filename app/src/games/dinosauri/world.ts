import Phaser from 'phaser';
import { dinoById, FLOOR, FRAME, GROUND, type DinoId } from './dinos';
import { faceOf } from './skeleton';
import { sfx } from './sfx';

/** Elementi di scena condivisi: deserto al tramonto a piani, buca dello scavo, dinosauro vivo. */

export const hex = (c: string): number => parseInt(c.slice(1), 16);

/**
 * Sfondo 2.5D: cielo del tramonto, sole basso con alone, altipiani lontani nella foschia, dune (piano medio),
 * suolo caldo; tenda, cassa, attrezzi e lanterna ai lati; rocce sfocate in primo piano. Parallasse all'ingresso.
 * `horizon` sposta la linea dell'orizzonte (più in alto nello scavo, che si guarda dall'alto).
 */
export function drawDesert(scene: Phaser.Scene, opts: { horizon?: number; props?: 'menu' | 'dig' | 'album' } = {}): void {
  const hz = opts.horizon ?? 560;
  // cielo del tramonto: una sola sfumatura morbida (texture), colore pieno sopra
  scene.add.rectangle(-2000, -1600, 5920, 1600 + hz - 1300, 0x5b4fa8).setOrigin(0).setDepth(0);
  scene.add.image(-2000, hz - 1300, 'di_sky').setOrigin(0).setDisplaySize(5920, 1400).setDepth(0);
  // stelline che si accendono in alto
  for (let i = 0; i < 18; i++) {
    const x = (i * 337) % 1920, y = hz - 420 - ((i * 151) % 500);
    const s = scene.add.image(x, y, 'sparkle').setScale(0.12 + (i % 3) * 0.05).setAlpha(0.5).setDepth(0.5);
    scene.tweens.add({ targets: s, alpha: 0.15, duration: 1200 + (i % 5) * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
  const sun = scene.add.image(kindSunX(opts.props), hz - 90, 'di_sun').setDepth(1).setScale(1.1);
  scene.tweens.add({ targets: sun, scale: 1.16, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  const clouds = [scene.add.image(380, hz - 300, 'cloud').setTint(0xffc2b0).setAlpha(0.7).setScale(0.8).setDepth(1.2),
    scene.add.image(1150, hz - 380, 'cloud').setTint(0xffb8c8).setAlpha(0.6).setScale(0.6).setDepth(1.2)];
  clouds.forEach((c, i) => scene.tweens.add({ targets: c, x: c.x + (i ? -60 : 60), duration: 9000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }));

  const far = [scene.add.image(960, hz + 4, 'di_mesa_far').setOrigin(0.5, 1).setDepth(2).setScale(1.2, 1)];
  const mid = [scene.add.image(960, hz + 90, 'di_dunes').setOrigin(0.5, 1).setDepth(3).setScale(1.25, 1)];
  // suolo
  const ground = scene.add.graphics().setDepth(4);
  ground.fillGradientStyle(0xe9a463, 0xe9a463, 0xc97a42, 0xc97a42, 1).fillRect(-2000, hz + 60, 5920, 2400);
  ground.fillStyle(0xffd9a0, 0.35);
  for (let i = 0; i < 16; i++) ground.fillEllipse(-200 + i * 160, hz + 120 + (i % 3) * 140, 120, 10);

  const props: Phaser.GameObjects.Image[] = [];
  const kind = opts.props ?? 'menu';
  if (kind === 'menu') {
    props.push(scene.add.image(1600, hz + 210, 'di_tent').setOrigin(0.5, 0.9).setDepth(5).setScale(1.25));
    props.push(scene.add.image(1520, hz + 300, 'di_crate').setOrigin(0.5, 0.92).setDepth(6));
    props.push(scene.add.image(260, hz + 290, 'di_tools').setOrigin(0.5, 0.94).setDepth(6));
    lantern(scene, 1820, hz + 120, 6);
  } else if (kind === 'dig') {
    props.push(scene.add.image(150, 560, 'di_tent').setOrigin(0.5, 0.9).setDepth(5).setScale(0.8));
    props.push(scene.add.image(1790, 560, 'di_tools').setOrigin(0.5, 0.94).setDepth(5).setScale(0.8));
    props.push(scene.add.image(1790, 770, 'di_crate').setOrigin(0.5, 0.92).setDepth(5).setScale(0.7));
    lantern(scene, 140, 760, 6);
  } else {
    props.push(scene.add.image(1750, hz + 200, 'di_tent').setOrigin(0.5, 0.9).setDepth(5));
  }
  const fg = [
    scene.add.image(-150, 1180, 'di_fg_rock').setOrigin(0.5, 1).setDepth(800).setScale(1.1),
    scene.add.image(2080, 1200, 'di_fg_rock').setOrigin(0.5, 1).setDepth(800).setFlipX(true),
  ];
  const slide = (o: { x: number }, dx: number) => {
    const x = o.x;
    o.x += dx;
    scene.tweens.add({ targets: o, x, duration: 1400, ease: 'Cubic.easeOut' });
  };
  far.forEach((o) => slide(o, 30));
  mid.forEach((o) => slide(o, 70));
  props.forEach((o) => slide(o, 120));
  fg.forEach((o) => slide(o, 240));
}

/** Il sole si sposta per non finire dietro la tenda. */
const kindSunX = (k?: string): number => (k === 'dig' ? 1300 : 980);

/** Lanterna con alone che respira (luce additiva, con parsimonia). */
function lantern(scene: Phaser.Scene, x: number, y: number, depth: number): void {
  const pole = scene.add.graphics().setDepth(depth);
  pole.fillStyle(0x6a3e1a, 1).fillRect(x - 5, y - 150, 10, 260).fillRect(x - 5, y - 150, 50, 8);
  scene.add.image(x + 40, y - 146, 'di_lantern').setOrigin(0.5, 0).setScale(0.8).setDepth(depth);
  const glow = scene.add.image(x + 40, y - 90, 'glow').setScale(1.6).setTint(0xffd27a).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(depth + 0.1);
  scene.tweens.add({ targets: glow, alpha: 0.3, scale: 1.4, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
}

/**
 * La buca dello scavo: bordo, parete di fondo a strati, fondo di roccia chiara (sotto la terra),
 * paletti con corda e bandierine. La terra da strofinare è uno strato a parte (ScratchLayer).
 */
export function drawPit(scene: Phaser.Scene): void {
  const { x, y, w, h } = FLOOR;
  const g = scene.add.graphics().setDepth(6);
  // bordo e ombra esterna
  g.fillStyle(0x6a3418, 0.35).fillRoundedRect(x - 26, y - 70, w + 52, h + 110, 40);
  g.fillStyle(0x8a4a22, 1).fillRoundedRect(x - 20, y - 74, w + 40, h + 96, 36);
  // parete di fondo a strati (luce dall'alto: strati più chiari in alto)
  const bands = [0xc0773f, 0xa65f2e, 0xd08a4c, 0x94532a];
  bands.forEach((c, i) => g.fillStyle(c, 1).fillRect(x, y - 64 + i * 16, w, 16));
  g.fillStyle(0xffd9a0, 0.5).fillRect(x, y - 64, w, 4);
  g.fillStyle(0x3a1808, 0.3).fillRect(x, y - 8, w, 8);
  // pareti laterali in ombra
  g.fillStyle(0x6a3418, 0.6).fillRect(x - 6, y - 64, 12, h + 64).fillRect(x + w - 6, y - 64, 12, h + 64);
  scene.add.image(x, y, 'di_rock').setOrigin(0).setDepth(7);
  // bordo anteriore illuminato
  const lip = scene.add.graphics().setDepth(11);
  lip.fillStyle(0xf5c98e, 1).fillRoundedRect(x - 20, y + h, w + 40, 26, 12);
  lip.fillStyle(0xffe8c4, 0.8).fillRect(x, y + h + 2, w, 5);
  lip.fillStyle(0x6a3418, 0.35).fillRect(x, y + h - 6, w, 6);
  // paletti e corda con bandierine
  const stakes = [x - 30, x + w / 3, x + (2 * w) / 3, x + w + 30];
  const top = y - 92;
  const rope = scene.add.graphics().setDepth(12);
  rope.lineStyle(5, 0xf6e2b8, 1);
  for (let i = 0; i < stakes.length - 1; i++) {
    const a = stakes[i], b = stakes[i + 1];
    const curve = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(a, top), new Phaser.Math.Vector2((a + b) / 2, top + 30), new Phaser.Math.Vector2(b, top));
    curve.draw(rope, 24);
    const flags = [0.25, 0.5, 0.75];
    flags.forEach((t, k) => {
      const p = curve.getPoint(t);
      const col = [0xff5a5f, 0xffc800, 0x36a9f0][(i + k) % 3];
      rope.fillStyle(col, 1).fillTriangle(p.x - 12, p.y, p.x + 12, p.y, p.x, p.y + 26);
    });
  }
  for (const sx of stakes) {
    rope.fillStyle(0x3a1d0e, 0.3).fillEllipse(sx + 6, top + 44, 26, 8);
    rope.fillStyle(0x8a5523, 1).fillRoundedRect(sx - 7, top - 8, 14, 52, 4);
    rope.fillStyle(0xd9a066, 1).fillRect(sx - 4, top - 6, 4, 46);
  }
}

/**
 * Dinosauro vivo: immagine + palpebra (tint della pelle) + bocca (sorriso / ruggito).
 * Il contenitore ha l'origine ai piedi (centro del FRAME, a terra), così scala e salti restano appoggiati.
 */
export class DinoView {
  readonly c: Phaser.GameObjects.Container;
  readonly id: DinoId;
  private img: Phaser.GameObjects.Image;
  private lid?: Phaser.GameObjects.Image;
  private smile?: Phaser.GameObjects.Image;
  private open?: Phaser.GameObjects.Image;
  private busy = false;
  private base: number;

  constructor(private scene: Phaser.Scene, id: DinoId, x: number, y: number, scale = 1, opts: { face?: boolean; depth?: number; idle?: boolean } = {}) {
    this.id = id;
    this.base = scale;
    const ox = -FRAME.w / 2, oy = -GROUND;
    this.img = scene.add.image(ox, oy, `di_dino_${id}`).setOrigin(0);
    const parts: Phaser.GameObjects.GameObject[] = [this.img];
    if (opts.face !== false) {
      const fc = faceOf(id);
      this.smile = scene.add.image(ox + fc.mouth.x, oy + fc.mouth.y, 'di_mouth_smile').setOrigin(100 / 140, 30 / 100).setScale(fc.s);
      this.open = scene.add.image(ox + fc.mouth.x, oy + fc.mouth.y, 'di_mouth_open').setOrigin(100 / 140, 30 / 100).setScale(fc.s).setVisible(false);
      this.lid = scene.add.image(ox + fc.eye.x, oy + fc.eye.y, 'di_lid').setScale((fc.eyeR / 28) * 1.08).setTint(hex(dinoById(id).color)).setVisible(false);
      parts.push(this.smile, this.open, this.lid);
    }
    this.c = scene.add.container(x, y, parts).setDepth(opts.depth ?? 50).setScale(scale);
    if (opts.idle !== false) this.idle();
  }

  /** Respiro e battito di ciglia. */
  private idle(): void {
    this.scene.tweens.add({ targets: this.c, scaleY: this.base * 1.025, scaleX: this.base * 0.99, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const blink = () => {
      if (!this.c.active) return;
      if (this.lid && !this.busy) {
        this.lid.setVisible(true);
        this.scene.time.delayedCall(140, () => this.lid?.setVisible(false));
      }
      this.scene.time.delayedCall(1800 + Math.random() * 2600, blink);
    };
    this.scene.time.delayedCall(1200 + Math.random() * 1500, blink);
  }

  /** Ruggito simpatico: bocca aperta, schiacciamento e allungamento, suono. */
  roar(withSound = true): void {
    if (this.busy) return;
    this.busy = true;
    if (withSound) sfx.roar(this.id);
    this.smile?.setVisible(false);
    if (this.open) {
      const s = faceOf(this.id).s;
      this.open.setVisible(true).setScale(s * 0.6);
      this.scene.tweens.add({ targets: this.open, scale: s, duration: 160, ease: 'Back.easeOut' });
    }
    this.scene.tweens.add({ targets: this.img, scaleX: 1.04, scaleY: 1.06, duration: 180, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
    this.scene.time.delayedCall(900, () => {
      this.open?.setVisible(false);
      this.smile?.setVisible(true);
      this.busy = false;
    });
  }

  /** Saltello con atterraggio schiacciato. */
  hop(): void {
    const y = this.c.y;
    sfx.hop();
    this.scene.tweens.add({
      targets: this.c, y: y - 110 * this.base, duration: 260, ease: 'Quad.easeOut', yoyo: true,
      onComplete: () => {
        this.c.y = y;
        sfx.thud();
        this.scene.tweens.add({ targets: this.img, scaleY: 0.9, scaleX: 1.06, duration: 90, yoyo: true, ease: 'Quad.easeOut' });
      },
    });
  }

  /** Il punto della testa (per le note del ruggito), in coordinate di scena. */
  headPoint(): { x: number; y: number } {
    const fc = faceOf(this.id);
    return { x: this.c.x + (fc.mouth.x - FRAME.w / 2) * this.base, y: this.c.y + (fc.mouth.y - GROUND) * this.base };
  }

  /** Il dinosauro è stato toccato? (riquadro del corpo con margine) */
  hit(x: number, y: number): boolean {
    const s = this.base;
    return x > this.c.x - (FRAME.w / 2) * s && x < this.c.x + (FRAME.w / 2) * s && y > this.c.y - GROUND * s && y < this.c.y + 30 * s;
  }
}
