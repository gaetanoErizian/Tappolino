import Phaser from 'phaser';
import { U, PARTS, ACC_AT, STICKER_SPOTS, ACC_SIZE } from './art';
import { unicornById, colorHex, layout, wear as wearList, type AccessoryId, type ColorId, type Unicorn, type UnicornId } from './salon';

/** Elementi di scena condivisi: salone tra le nuvole a piani e l'unicorno a strati. */

export const hex = (c: string): number => parseInt(c.slice(1), 16);

/** Mescola due colori #rrggbb (k = quota del secondo). */
export function mix(a: string, b: string, k: number): string {
  const pa = hex(a), pb = hex(b);
  const ch = [16, 8, 0].map((s) => Math.round(((pa >> s) & 255) * (1 - k) + ((pb >> s) & 255) * k));
  return '#' + ch.map((c) => c.toString(16).padStart(2, '0')).join('');
}

/** Tinta della criniera spettinata all'arrivo: il colore dell'unicorno, un po' spento. */
export const dullMane = (u: Unicorn): number => hex(mix(u.mane, '#bdb8cc', 0.38));

/** Piano dove poggiano gli zoccoli nel salone. */
export const FLOOR_Y = 880;

/**
 * Sfondo 2.5D: cielo lilla e rosa, arcobaleno e nuvole lontane nella foschia (piano lontano), tende turchesi,
 * specchio e mensola dei flaconi (piano medio), lampade a stella con alone, pavimento di nuvole e pedana,
 * nuvole sfocate in primo piano ai bordi. Parallasse all'ingresso.
 */
export function drawSalon(scene: Phaser.Scene, opts: { platformX?: number | null; mirror?: boolean; shelf?: boolean; fgAside?: boolean } = {}): void {
  const g = scene.add.graphics().setDepth(0);
  g.fillGradientStyle(0xc9b6ff, 0xc9b6ff, 0xffd2ea, 0xffd2ea, 1).fillRect(-2000, -1600, 5920, 2300);
  g.fillGradientStyle(0xffd2ea, 0xffd2ea, 0xffe6f2, 0xffe6f2, 1).fillRect(-2000, 700, 5920, 900);

  const far: Phaser.GameObjects.GameObject[] = [];
  far.push(scene.add.image(960, 760, 'un_rainbow').setOrigin(0.5, 1).setScale(1.25).setAlpha(0.38).setDepth(1));
  const bank: [number, number, number, number][] = [[120, 640, 1.9, 0xf3eaff], [560, 690, 2.2, 0xffeef8], [1000, 650, 2.0, 0xf0e6ff], [1450, 690, 2.3, 0xffeef8], [1860, 640, 1.9, 0xf3eaff]];
  for (const [x, y, s, tint] of bank) far.push(scene.add.image(x, y, 'cloud').setScale(s).setTint(tint).setAlpha(0.95).setDepth(1.2));
  for (const [x, y, s] of [[300, 220, 0.8], [1640, 160, 0.7], [1180, 300, 0.55]] as const) {
    far.push(scene.add.image(x, y, 'cloud').setScale(s).setAlpha(0.8).setDepth(1.1));
  }
  // foschia sui piani lontani
  scene.add.rectangle(-2000, -1600, 5920, 2400, 0xfff4fb, 0.22).setOrigin(0).setDepth(1.5);

  const mid: Phaser.GameObjects.Image[] = [
    scene.add.image(-70, -40, 'un_curtain').setOrigin(0, 0).setDepth(3).setScale(1.15),
    scene.add.image(1990, -40, 'un_curtain').setOrigin(0, 0).setDepth(3).setScale(-1.15, 1.15),
  ];
  if (opts.mirror !== false) mid.push(scene.add.image(330, 470, 'un_mirror').setDepth(2.6).setScale(0.9));
  if (opts.shelf !== false) mid.push(scene.add.image(1610, 560, 'un_shelf').setDepth(2.6).setScale(0.95));
  for (const x of [640, 1290]) {
    scene.add.image(x, -40, 'un_lamp').setOrigin(0.5, 0).setDepth(4).setScale(0.9);
    const glow = scene.add.image(x, 172, 'glow').setDepth(4.5).setScale(2.4).setTint(0xfff0b0).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({ targets: glow, alpha: 0.3, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  // pavimento di nuvole
  const fl = scene.add.graphics().setDepth(5);
  fl.fillGradientStyle(0xfdf7ff, 0xfdf7ff, 0xe8dcff, 0xe8dcff, 1).fillRect(-2000, FLOOR_Y - 40, 5920, 1400);
  for (let x = -1900; x < 3900; x += 230) {
    fl.fillStyle(0xffffff, 1).fillEllipse(x, FLOOR_Y - 34 + ((x / 230) % 2) * 10, 300, 110);
  }
  fl.fillStyle(0xd9c8f6, 0.5).fillRect(-2000, FLOOR_Y + 70, 5920, 8);
  if (opts.platformX !== null) {
    scene.add.image(opts.platformX ?? 930, FLOOR_Y, 'un_platform').setOrigin(0.5, 86 / 220).setDepth(6);
  }

  // scintille che fluttuano
  for (let i = 0; i < 7; i++) {
    const s = scene.add.image(200 + Math.random() * 1520, 150 + Math.random() * 600, 'sparkle').setDepth(7).setScale(0.3 + Math.random() * 0.3).setAlpha(0);
    scene.tweens.add({ targets: s, alpha: 0.85, y: s.y - 40, duration: 1600 + Math.random() * 900, yoyo: true, repeat: -1, delay: Math.random() * 2000, ease: 'Sine.easeInOut' });
  }

  // primo piano: nuvole sfocate agli angoli (più ai margini in partita)
  const fx = opts.fgAside ? 160 : 0;
  const fg = [
    scene.add.image(-60 - fx, 1130, 'cloud').setScale(2.6).setDepth(800).setAlpha(0.95).setTint(0xfff6fc),
    scene.add.image(1980 + fx, 1140, 'cloud').setScale(2.8).setDepth(800).setAlpha(0.95).setTint(0xf7f0ff),
  ];
  const slide = (o: { x: number }, dx: number) => {
    const x = o.x;
    o.x += dx;
    scene.tweens.add({ targets: o, x, duration: 1400, ease: 'Cubic.easeOut' });
  };
  far.forEach((f) => slide(f as unknown as { x: number }, 30));
  mid.forEach((m) => slide(m, 90));
  fg.forEach((f) => slide(f, 260));
}

// ---------------------------------------------------------------------
// Unicorno a strati
// ---------------------------------------------------------------------

export interface LookIn {
  u: UnicornId;
  /** colore della criniera; null = quello con cui arriva */
  c: ColorId | null;
  a: AccessoryId[];
}

/** Da coordinate della tela dell'unicorno a coordinate locali (origine sugli zoccoli). */
export const local = (cx: number, cy: number): { x: number; y: number } => ({ x: cx - U.OX, y: cy - U.OY });

type Layer = 'mud' | 'foam' | 'maneCover' | 'messyCover';

export class UnicornView {
  readonly c: Phaser.GameObjects.Container;
  readonly u: Unicorn;
  private coat: Phaser.GameObjects.Image;
  private hl: Phaser.GameObjects.Image;
  private mane: Phaser.GameObjects.Image;
  private rainbow: Phaser.GameObjects.Image;
  private maneHl: Phaser.GameObjects.Image;
  private messy: Phaser.GameObjects.Image;
  private eye: Phaser.GameObjects.Image;
  private acc: Phaser.GameObjects.Container;
  private shadow: Phaser.GameObjects.Image;
  private faceState: 'open' | 'happy' = 'open';
  private blinkEv?: Phaser.Time.TimerEvent;
  private breath?: Phaser.Tweens.Tween;
  private baseScale: number;
  private groundY: number;
  private hopping = false;
  color: ColorId | null;
  accessories: AccessoryId[] = [];

  constructor(private scene: Phaser.Scene, x: number, y: number, look: LookIn, opts: { scale?: number; depth?: number; messy?: boolean; shadow?: boolean } = {}) {
    this.u = unicornById(look.u);
    this.color = look.c;
    this.baseScale = opts.scale ?? 1;
    this.groundY = y;
    const full = (key: string) => scene.add.image(-U.OX, -U.OY, key).setOrigin(0, 0);
    this.shadow = scene.add.image(-10, 2, 'shadow').setScale(2.9, 0.75).setAlpha(opts.shadow === false ? 0 : 0.75);
    this.coat = full('un_coat').setTint(hex(this.u.coat));
    const parts: Phaser.GameObjects.GameObject[] = [this.shadow, this.coat];
    if (this.u.stars) parts.push(full('un_coat_stars'));
    this.hl = full('un_coat_hl');
    this.mane = full('un_mane');
    this.rainbow = full('un_mane_rainbow').setVisible(false);
    this.maneHl = full('un_mane_hl');
    this.messy = full('un_mane_messy').setTint(dullMane(this.u)).setVisible(!!opts.messy);
    this.maneHl.setVisible(!opts.messy);
    const horn = scene.add.image(PARTS.horn.x - U.OX, PARTS.horn.y - U.OY, `un_horn_${this.u.horn}`).setOrigin(0, 0);
    this.eye = scene.add.image(PARTS.eye.x - U.OX, PARTS.eye.y - U.OY, 'un_eye_open').setOrigin(0, 0);
    this.acc = scene.add.container(0, 0);
    parts.push(this.hl, this.mane, this.rainbow, this.maneHl, this.messy, horn, this.eye, this.acc);
    this.c = scene.add.container(x, y, parts).setDepth(opts.depth ?? 50).setScale(this.baseScale);
    this.applyMane();
    for (const id of look.a) this.wear(id, false);
    this.blinkEv = scene.time.addEvent({ delay: 2600, loop: true, callback: () => this.blink() });
    this.breathe(true);
  }

  /** Posizione nella lista del Container dove inserire uno strato da strofinare. */
  indexFor(layer: Layer): number {
    if (layer === 'mud' || layer === 'foam') return this.c.getIndex(this.hl) + 1;
    // la criniera arruffata copre anche i riflessi; il colore vecchio sta sotto i riflessi
    if (layer === 'messyCover') return this.c.getIndex(this.maneHl) + 1;
    return this.c.getIndex(this.rainbow) + 1;
  }

  /** Respiro leggero (si ferma durante i passaggi che hanno bisogno della sagoma ferma). */
  breathe(on: boolean): void {
    this.breath?.stop();
    this.breath = undefined;
    const s = this.baseScale;
    this.c.setScale(s);
    if (on) this.breath = this.scene.tweens.add({ targets: this.c, scaleY: s * 1.012, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  get scale(): number { return this.baseScale; }

  /** Colore attuale della criniera come tinta (null = arcobaleno). */
  maneTint(c: ColorId | null = this.color): number | null {
    if (c === 'rainbow') return null;
    return hex(c ? colorHex(c) : this.u.mane);
  }

  setMane(c: ColorId | null): void {
    this.color = c;
    this.applyMane();
  }

  private applyMane(): void {
    const tint = this.maneTint();
    this.rainbow.setVisible(tint === null);
    this.mane.setVisible(tint !== null);
    if (tint !== null) this.mane.setTint(tint);
  }

  /** Criniera arruffata (immagine) on/off; `gloss` = riflessi della criniera pettinata. */
  setMessy(on: boolean, gloss = !on): void {
    this.messy.setVisible(on);
    this.maneHl.setVisible(gloss);
  }

  face(state: 'open' | 'happy'): void {
    this.faceState = state;
    this.eye.setTexture(`un_eye_${state}`);
  }

  private blink(): void {
    if (!this.c.active || this.faceState !== 'open') return;
    this.eye.setTexture('un_eye_closed');
    this.scene.time.delayedCall(130, () => { if (this.c.active && this.faceState === 'open') this.eye.setTexture('un_eye_open'); });
  }

  /** Saltello di gioia (squash & stretch dagli zoccoli). Un tocco durante il salto non ne fa partire un altro. */
  hop(onLand?: () => void): void {
    if (this.hopping) { onLand?.(); return; }
    this.hopping = true;
    const s = this.baseScale, y = this.groundY;
    this.breath?.pause();
    this.scene.tweens.chain({
      targets: this.c,
      tweens: [
        { scaleY: s * 0.9, scaleX: s * 1.06, duration: 110, ease: 'Quad.easeOut' },
        { y: y - 90 * s, scaleY: s * 1.08, scaleX: s * 0.95, duration: 240, ease: 'Quad.easeOut' },
        { y, scaleY: s, scaleX: s, duration: 230, ease: 'Quad.easeIn' },
        { scaleY: s * 0.92, scaleX: s * 1.05, duration: 90, yoyo: true, ease: 'Quad.easeOut' },
      ],
      onComplete: () => { this.c.setScale(s); this.c.y = y; this.hopping = false; this.breath?.resume(); onLand?.(); },
    });
    this.scene.tweens.add({ targets: this.shadow, scaleX: 2.2, alpha: 0.4, duration: 240, yoyo: true, delay: 110 });
  }

  /** Si scrolla l'acqua di dosso. */
  shake(): void {
    const s = this.baseScale;
    this.breath?.pause();
    this.scene.tweens.add({
      targets: this.c, scaleX: { from: s * 1.05, to: s * 0.96 }, duration: 70, yoyo: true, repeat: 4,
      onComplete: () => { this.c.setScale(s); this.breath?.resume(); },
    });
  }

  /** Camminata d'ingresso (dall'esterno a destra) con piccoli balzi. */
  trotIn(fromX: number, toX: number, onDone?: () => void): void {
    const y = this.groundY;
    this.c.x = fromX;
    this.scene.tweens.add({
      targets: this.c, x: toX, duration: 1500, ease: 'Cubic.easeOut',
      onUpdate: (tw) => { this.c.y = y - Math.abs(Math.sin(tw.progress * Math.PI * 6)) * 26 * (1 - tw.progress * 0.5); },
      onComplete: () => { this.c.y = y; onDone?.(); },
    });
  }

  // ---------------- accessori ----------------

  /** Centro (coordinate locali) di un accessorio indossato in una certa posizione. */
  static spot(id: AccessoryId, spot: number): { x: number; y: number } {
    const at = id === 'star' || id === 'heart' ? STICKER_SPOTS[spot % STICKER_SPOTS.length] : ACC_AT[id];
    return local(at.x, at.y);
  }

  /** Indossa un accessorio (con le regole di salon.wear) e ridisegna gli accessori. Restituisce il punto di scena dove è andato. */
  wear(id: AccessoryId, animate = true): { x: number; y: number } {
    // regole: uno per posto, adesivi fino al massimo
    const out = wearList(this.accessories, id);
    this.accessories = out;
    const after = layout(out);
    // ricostruisce: gli oggetti che restano non si animano, il nuovo sì
    this.acc.removeAll(true);
    const order = ['body', 'neck', 'back', 'face', 'head'];
    const sorted = [...after].sort((a, b) => order.indexOf(a.slot) - order.indexOf(b.slot));
    let target = { x: 0, y: 0 };
    for (const a of sorted) {
      const p = UnicornView.spot(a.id, a.spot);
      const img = this.scene.add.image(p.x, p.y, `un_acc_${a.id}`);
      this.acc.add(img);
      const isNew = a === after[after.length - 1];
      if (isNew) {
        target = p;
        if (animate) {
          img.setScale(0);
          this.scene.tweens.add({ targets: img, scale: 1, duration: 320, ease: 'Back.easeOut' });
        }
      }
    }
    const m = this.c.getWorldTransformMatrix();
    const w = m.transformPoint(target.x, target.y);
    return { x: w.x, y: w.y };
  }

  /** Punto di scena dove andrebbe l'accessorio se lo si indossasse adesso. */
  targetFor(id: AccessoryId): { x: number; y: number } {
    const after = layout(wearList(this.accessories, id));
    const a = after[after.length - 1];
    const p = UnicornView.spot(a.id, a.spot);
    const w = this.c.getWorldTransformMatrix().transformPoint(p.x, p.y);
    return { x: w.x, y: w.y };
  }

  /** Dimensione (unità di scena) di un accessorio, per le animazioni di volo. */
  static accSize(id: AccessoryId): number { return Math.max(...ACC_SIZE[id]); }

  /** Da punto della tela dell'unicorno a punto di scena. */
  toScene(cx: number, cy: number): { x: number; y: number } {
    const l = local(cx, cy);
    const m = this.c.getWorldTransformMatrix();
    const w = m.transformPoint(l.x, l.y);
    return { x: w.x, y: w.y };
  }

  /** Sagoma scura per gli unicorni ancora da scoprire. */
  silhouette(): void {
    this.c.each((o: Phaser.GameObjects.GameObject) => {
      if (o instanceof Phaser.GameObjects.Image && o !== this.shadow) o.setTint(0x6a5a8e);
    });
    this.eye.setVisible(false);
    this.maneHl.setVisible(false);
    this.hl.setVisible(false);
    this.blinkEv?.remove();
  }

  destroy(): void {
    this.blinkEv?.remove();
    this.breath?.stop();
    this.c.destroy();
  }
}


/**
 * Foto ricordo (polaroid): cornice, sfondo arcobaleno e l'unicorno in miniatura con il suo look.
 * Restituisce il Container (origine al centro della cornice) e l'unicorno, per farlo saltellare al tocco.
 */
export function makePolaroid(scene: Phaser.Scene, x: number, y: number, look: LookIn | null, depth = 60): { c: Phaser.GameObjects.Container; uni: UnicornView | null } {
  const frame = scene.add.image(0, 0, 'un_polaroid');
  const bg = scene.add.image(-4, -29, 'un_photo_bg');
  const parts: Phaser.GameObjects.GameObject[] = [frame, bg];
  let uni: UnicornView | null = null;
  if (look) {
    uni = new UnicornView(scene, -6, 84, look, { scale: 0.3, shadow: true });
    uni.face('happy');
    parts.push(uni.c, scene.add.image(112, 128, 'heart').setScale(0.42));
  } else {
    bg.setAlpha(0.35);
    frame.setAlpha(0.6);
  }
  const c = scene.add.container(x, y, parts).setDepth(depth);
  return { c, uni };
}
