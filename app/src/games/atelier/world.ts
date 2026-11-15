import Phaser from 'phaser';
import { PART_BOX, FIT_HEAD, hasHairBack } from './dollArt';
import { charById, DOLL_W, FEET_Y, HEAD_TOP_REF, SLOTS, type BgId, type ItemId, type Look, type Slot } from './logic';

/** Elementi di scena condivisi: atelier a piani, sfondi della sfilata, personaggio vestibile animato. */

export const hex = (c: string): number => parseInt(c.slice(1), 16);

/** Linea tra parete e pavimento dell'atelier. */
export const FLOOR_Y = 720;
/** Perno della testa nello spazio del personaggio (collo). */
const NECK_Y = 360;

type Movable = { x: number };

const slideIn = (scene: Phaser.Scene, list: Movable[], dx: number): void => {
  for (const o of list) {
    const x = o.x;
    o.x += dx;
    scene.tweens.add({ targets: o, x, duration: 1400, ease: 'Cubic.easeOut' });
  }
};

// =====================================================================
// Atelier
// =====================================================================

export interface AtelierOpts {
  /** specchio grande al centro (dietro il personaggio) */
  mirror?: boolean;
  /** due manichini vestiti nella stanza */
  mannequins?: boolean;
  /** lampadari in alto */
  chandeliers?: boolean;
}

/**
 * Atelier 2.5D: parete rosa antico con decori dorati e boiserie panna (piano lontano), tende, specchio
 * con cornice d'oro, lampadari e manichini (piano medio), pavimento a listoni con tappeto, stoffe sfocate
 * in primo piano. Parallasse all'ingresso.
 */
export function drawAtelier(scene: Phaser.Scene, opts: AtelierOpts = {}): void {
  const wall = scene.add.graphics().setDepth(0);
  wall.fillGradientStyle(0xf2c9cc, 0xf2c9cc, 0xdba0a8, 0xdba0a8, 1).fillRect(-2000, -1600, 5920, 1600 + FLOOR_Y);
  // decoro a rombi dorati, leggero
  wall.fillStyle(0xfff3d6, 0.28);
  for (let y = -320; y < FLOOR_Y - 180; y += 110) {
    for (let x = -600 + ((y / 110) % 2 === 0 ? 0 : 55); x < 2500; x += 110) {
      wall.fillTriangle(x, y - 16, x + 10, y, x - 10, y);
      wall.fillTriangle(x, y + 16, x + 10, y, x - 10, y);
    }
  }
  // boiserie panna con cornici d'oro
  wall.fillGradientStyle(0xfff8ec, 0xfff8ec, 0xf0dcc2, 0xf0dcc2, 1).fillRect(-2000, FLOOR_Y - 190, 5920, 190);
  wall.fillStyle(0xe8b84a, 1).fillRect(-2000, FLOOR_Y - 200, 5920, 14);
  wall.fillStyle(0xfff3c4, 0.8).fillRect(-2000, FLOOR_Y - 200, 5920, 4);
  wall.lineStyle(5, 0xd9a64a, 0.8);
  for (let x = -480; x < 2400; x += 320) wall.strokeRoundedRect(x + 30, FLOOR_Y - 160, 260, 120, 18);
  wall.fillStyle(0xa8741c, 0.4).fillRect(-2000, FLOOR_Y - 12, 5920, 12);

  // pavimento a listoni di legno chiaro, più scuro verso lo spettatore
  const floor = scene.add.graphics().setDepth(0.2);
  floor.fillGradientStyle(0xf3d6ae, 0xf3d6ae, 0xd9a978, 0xd9a978, 1).fillRect(-2000, FLOOR_Y, 5920, 2000);
  floor.lineStyle(4, 0xc49060, 0.45);
  for (let k = -24; k <= 24; k++) floor.lineBetween(960 + k * 90, FLOOR_Y, 960 + k * 230, FLOOR_Y + 900);
  for (let y = FLOOR_Y + 36, h = 36; y < 1900; h *= 1.4, y += h) floor.lineBetween(-2000, y, 3920, y);
  floor.fillStyle(0x5a2a1a, 0.12).fillRect(-2000, FLOOR_Y, 5920, 14);
  // tappeto tondo rosa con bordo d'oro
  floor.fillStyle(0xa8741c, 0.9).fillEllipse(960, 990, 1180, 230);
  floor.fillStyle(0xe8a2b4, 1).fillEllipse(960, 986, 1140, 206);
  floor.lineStyle(6, 0xfff3c4, 0.7).strokeEllipse(960, 986, 1020, 168);

  const far: Movable[] = [];
  const midList: Movable[] = [];
  // luce morbida dall'alto a sinistra
  const light = scene.add.image(520, 160, 'glow').setScale(9, 6).setTint(0xfff3e0).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD).setDepth(0.5);
  far.push(light);

  if (opts.mirror !== false) {
    const m = scene.add.image(960, 440, 'at_mirror').setDepth(1.5);
    const shine = scene.add.image(860, 300, 'glow').setScale(2.2, 3).setAlpha(0.3).setBlendMode(Phaser.BlendModes.ADD).setDepth(1.6);
    scene.tweens.add({ targets: shine, alpha: 0.12, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    far.push(m, shine);
  }
  const curtains = [
    scene.add.image(-60, -40, 'at_curtain').setOrigin(0, 0).setDepth(2),
    scene.add.image(1980, -40, 'at_curtain').setOrigin(0, 0).setFlipX(true).setDepth(2),
  ];
  curtains[1].setOrigin(1, 0);
  midList.push(...curtains);

  if (opts.chandeliers) {
    for (const x of [430, 1490]) {
      const ch = scene.add.image(x, -30, 'at_chandelier').setOrigin(0.5, 0).setDepth(2.2).setScale(0.8);
      const gl = scene.add.image(x, 140, 'glow').setScale(2.6, 1.8).setTint(0xfff1b0).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(2.3);
      scene.tweens.add({ targets: gl, alpha: 0.32, duration: 1600 + x, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      midList.push(ch, gl);
    }
  }
  if (opts.mannequins) {
    const m1 = new Doll(scene, { char: 'lia', dress: 'gown_lilac', neck: 'necklace' }, 300, FLOOR_Y + 70, 0.62, { depth: 3, mannequin: true });
    const m2 = new Doll(scene, { char: 'lia', dress: 'coat', neck: 'bowtie' }, 1620, FLOOR_Y + 70, 0.62, { depth: 3, mannequin: true });
    midList.push(m1.c, m2.c);
  }

  const fg = [
    scene.add.image(-80, 1150, 'at_fabric').setOrigin(0.5, 1).setDepth(800).setScale(1.1),
    scene.add.image(2010, 1170, 'at_fabric').setOrigin(0.5, 1).setDepth(800).setFlipX(true),
  ];
  slideIn(scene, far, 30);
  slideIn(scene, midList, 70);
  slideIn(scene, fg, 220);
}

/** Pedana rosa e oro su cui sta il personaggio (i piedi al centro del piano). */
export function pedestal(scene: Phaser.Scene, x: number, y: number, scale = 1, depth = 30): Phaser.GameObjects.Image {
  return scene.add.image(x, y, 'at_pedestal').setOrigin(0.5, 66 / 160).setScale(scale).setDepth(depth);
}

// =====================================================================
// Sfondi della sfilata
// =====================================================================

/** Linea del terreno negli sfondi della sfilata. */
export const STAGE_Y = 760;

export function drawBackdrop(scene: Phaser.Scene, bg: BgId): void {
  const g = scene.add.graphics().setDepth(0);
  const far: Movable[] = [];
  const mid: Movable[] = [];
  const fg: Movable[] = [];
  if (bg === 'castle') {
    g.fillGradientStyle(0x7cc8ff, 0x7cc8ff, 0xffe0ea, 0xffe0ea, 1).fillRect(-2000, -1600, 5920, 1600 + STAGE_Y);
    const sun = scene.add.image(1620, 150, 'sun').setScale(0.8).setDepth(0.3);
    scene.tweens.add({ targets: sun, scale: 0.85, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const clouds = [scene.add.image(380, 160, 'cloud').setScale(0.8).setDepth(0.4), scene.add.image(1180, 110, 'cloud').setScale(0.6).setAlpha(0.9).setDepth(0.4)];
    clouds.forEach((c, i) => scene.tweens.add({ targets: c, x: c.x + (i ? -60 : 60), duration: 9000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }));
    far.push(scene.add.image(960, 640, 'at_hills').setOrigin(0.5, 1).setDepth(0.6));
    const castle = scene.add.image(960, 650, 'at_castle').setOrigin(0.5, 1).setScale(0.82).setDepth(1);
    const haze = scene.add.graphics().setDepth(1.1);
    haze.fillGradientStyle(0xffffff, 0xffffff, 0xffffff, 0xffffff, 0, 0, 0.35, 0.35).fillRect(-2000, 300, 5920, 360);
    far.push(castle);
    const ground = scene.add.graphics().setDepth(1.5);
    ground.fillGradientStyle(0xa8dc90, 0xa8dc90, 0x6cbc5c, 0x6cbc5c, 1).fillRect(-2000, 620, 5920, 2000);
    // viale rosa verso il castello
    ground.fillStyle(0xf6c2d2, 1).beginPath().moveTo(900, 640).lineTo(1020, 640).lineTo(1400, 1300).lineTo(520, 1300).closePath().fillPath();
    ground.fillStyle(0xffffff, 0.35).beginPath().moveTo(930, 640).lineTo(990, 640).lineTo(1100, 1300).lineTo(820, 1300).closePath().fillPath();
    mid.push(
      scene.add.image(300, 760, 'at_hedge').setOrigin(0.5, 1).setDepth(2),
      scene.add.image(1640, 760, 'at_hedge').setOrigin(0.5, 1).setDepth(2).setFlipX(true),
    );
    fg.push(
      scene.add.image(-60, 1160, 'at_roses').setOrigin(0.5, 1).setDepth(800).setScale(1.05),
      scene.add.image(1990, 1170, 'at_roses').setOrigin(0.5, 1).setDepth(800).setFlipX(true),
    );
  } else if (bg === 'forest') {
    g.fillGradientStyle(0xd8f5e0, 0xd8f5e0, 0x9fdcae, 0x9fdcae, 1).fillRect(-2000, -1600, 5920, 1600 + STAGE_Y);
    far.push(scene.add.image(960, 660, 'at_forest_far').setOrigin(0.5, 1).setDepth(0.5));
    // raggi di luce tra gli alberi
    const rays = scene.add.graphics().setDepth(0.8).setBlendMode(Phaser.BlendModes.ADD);
    rays.fillStyle(0xfff6c0, 0.16);
    for (const [x, w] of [[760, 120], [980, 90], [1180, 140]]) rays.beginPath().moveTo(x, -200).lineTo(x + w, -200).lineTo(x + w * 2.4 + 120, 1100).lineTo(x + 120, 1100).closePath().fillPath();
    scene.tweens.add({ targets: rays, alpha: 0.55, duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const back = [
      scene.add.image(560, 700, 'at_tree').setOrigin(0.5, 1).setScale(0.55).setDepth(1).setAlpha(0.75).setTint(0xcfe8d6),
      scene.add.image(1380, 700, 'at_tree').setOrigin(0.5, 1).setScale(0.6).setDepth(1).setAlpha(0.75).setTint(0xcfe8d6).setFlipX(true),
    ];
    far.push(...back);
    const ground = scene.add.graphics().setDepth(1.5);
    ground.fillGradientStyle(0x8fd47a, 0x8fd47a, 0x4f9e48, 0x4f9e48, 1).fillRect(-2000, 660, 5920, 2000);
    ground.fillStyle(0xffffff, 0.12);
    for (let i = 0; i < 7; i++) ground.fillEllipse(960 + (i - 3) * 480, 760 + (i % 3) * 120, 360, 40);
    mid.push(
      scene.add.image(140, 1000, 'at_tree').setOrigin(0.5, 1).setDepth(2),
      scene.add.image(1800, 1000, 'at_tree').setOrigin(0.5, 1).setDepth(2).setFlipX(true).setScale(0.95),
      scene.add.image(480, 830, 'at_mushroom').setOrigin(0.5, 1).setDepth(2.5).setScale(0.9),
      scene.add.image(1480, 860, 'at_mushroom').setOrigin(0.5, 1).setDepth(2.5).setScale(0.7),
    );
    const flies = scene.add.particles(0, 0, 'dot', {
      x: { min: 200, max: 1720 }, y: { min: 200, max: 900 }, speed: { min: 10, max: 40 }, scale: { start: 0.5, end: 0.1 },
      alpha: { start: 0.9, end: 0 }, lifespan: 2600, frequency: 220, tint: [0xfff6a0, 0xffffff, 0xd6ffd0], blendMode: Phaser.BlendModes.ADD,
    }).setDepth(700);
    void flies;
    fg.push(
      scene.add.image(-40, 1170, 'at_ferns').setOrigin(0.5, 1).setDepth(800).setScale(1.1),
      scene.add.image(1970, 1180, 'at_ferns').setOrigin(0.5, 1).setDepth(800).setFlipX(true),
    );
  } else {
    g.fillGradientStyle(0x5a3f9a, 0x5a3f9a, 0xd98ac0, 0xd98ac0, 1).fillRect(-2000, -1600, 5920, 1600 + STAGE_Y);
    g.fillStyle(0xffffff, 0.06);
    for (let x = -400; x < 2400; x += 160) g.fillRect(x, -400, 60, STAGE_Y + 400);
    far.push(
      scene.add.image(340, 700, 'at_window').setOrigin(0.5, 1).setDepth(0.5),
      scene.add.image(1580, 700, 'at_window').setOrigin(0.5, 1).setDepth(0.5),
    );
    // pavimento a scacchi lucido in prospettiva
    const floor = scene.add.graphics().setDepth(1);
    floor.fillStyle(0xfff0f6, 1).fillRect(-2000, 700, 5920, 2000);
    floor.fillStyle(0xf2b8d0, 1);
    let y = 700;
    for (let r = 0, h = 40; r < 10; r++, y += h, h *= 1.3) {
      const w = 120 + r * 30;
      for (let x = -1800 + (r % 2) * w; x < 3800; x += w * 2) floor.fillRect(x, y, w, h);
    }
    floor.fillStyle(0x5a2a6a, 0.15).fillRect(-2000, 700, 5920, 12);
    const glowL = scene.add.image(960, 720, 'glow').setScale(10, 2).setAlpha(0.3).setTint(0xfff0f8).setBlendMode(Phaser.BlendModes.ADD).setDepth(1.2);
    void glowL;
    for (const x of [600, 1320]) {
      const ch = scene.add.image(x, -40, 'at_chandelier').setOrigin(0.5, 0).setDepth(2).setScale(0.75);
      const gl = scene.add.image(x, 120, 'glow').setScale(2.8, 2).setTint(0xfff1b0).setAlpha(0.55).setBlendMode(Phaser.BlendModes.ADD).setDepth(2.1);
      scene.tweens.add({ targets: gl, alpha: 0.3, duration: 1400 + x, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      mid.push(ch, gl);
    }
    mid.push(scene.add.image(960, 210, 'at_garland').setDepth(2.4).setScale(1.25));
    // luci colorate che danzano sul pavimento
    const spots = [0xff8cc6, 0x8fd3ff, 0xffd04d].map((c, i) => {
      const s = scene.add.image(600 + i * 360, 880, 'glow').setScale(3.2, 1).setTint(c).setAlpha(0.45).setBlendMode(Phaser.BlendModes.ADD).setDepth(1.3);
      scene.tweens.add({ targets: s, x: s.x + (i % 2 ? -260 : 260), duration: 2200 + i * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      return s;
    });
    void spots;
    fg.push(
      scene.add.image(-30, 1120, 'at_balloons').setOrigin(0.5, 1).setDepth(800),
      scene.add.image(1960, 1130, 'at_balloons').setOrigin(0.5, 1).setDepth(800).setFlipX(true).setScale(0.95),
    );
  }
  slideIn(scene, far, 30);
  slideIn(scene, mid, 90);
  slideIn(scene, fg, 220);
}

// =====================================================================
// Personaggio
// =====================================================================

type Eyes = 'open' | 'closed' | 'happy';
type Mouth = 'smile' | 'open' | 'o';
const EYE_KEY: Record<Eyes, string> = { open: 'at_eye', closed: 'at_eye_closed', happy: 'at_eye_happy' };
const MOUTH_KEY: Record<Mouth, string> = { smile: 'at_mouth_smile', open: 'at_mouth_open', o: 'at_mouth_o' };

/** Centro di un pezzo nello spazio del personaggio, rispetto ai piedi. */
function center(key: string): { x: number; y: number } {
  const [x, y, w, h] = PART_BOX[key] ?? [0, 0, DOLL_W, FEET_Y];
  return { x: x + w / 2 - DOLL_W / 2, y: y + h / 2 - FEET_Y };
}

export interface DollOpts {
  depth?: number;
  /** manichino dell'atelier: niente testa, il corpo è la sagoma di stoffa */
  mannequin?: boolean;
  /** ombra a terra (default sì) */
  shadow?: boolean;
}

/**
 * Personaggio vestibile, fatto a strati in un Container con l'origine ai piedi:
 * mantello/ali, capelli dietro, corpo, scarpe, abito, collana, testa (con occhi, bocca, copricapo), oggetto in mano.
 * Si anima con scala e posizione (niente rotazioni di oggetti grandi): respiro, sbattere d'occhi, saltelli,
 * giravolta (scala orizzontale che si inverte), facce felici.
 */
export class Doll {
  /** contenitore esterno: posizione e scala di base */
  readonly c: Phaser.GameObjects.Container;
  /** contenitore interno: saltelli, schiacciamenti, giravolte */
  readonly inner: Phaser.GameObjects.Container;
  look: Look;
  private headC?: Phaser.GameObjects.Container;
  private eyes: Phaser.GameObjects.Image[] = [];
  private mouth?: Phaser.GameObjects.Image;
  private hairBack?: Phaser.GameObjects.Image;
  private parts = new Map<Slot, Phaser.GameObjects.Image>();
  private shadow?: Phaser.GameObjects.Image;
  private eyeState: Eyes = 'open';
  private blinkTimer?: Phaser.Time.TimerEvent;
  private faceTimer?: Phaser.Time.TimerEvent;
  private hopping = false;
  readonly s: number;

  constructor(private scene: Phaser.Scene, look: Look, x: number, y: number, scale = 1, private opts: DollOpts = {}) {
    this.look = { ...look };
    this.s = scale;
    this.c = scene.add.container(x, y).setDepth(opts.depth ?? 40).setScale(scale);
    if (opts.shadow !== false && !opts.mannequin) {
      this.shadow = scene.add.image(0, 0, 'shadow').setScale(1.5, 0.55).setAlpha(0.8);
      this.c.add(this.shadow);
    }
    this.inner = scene.add.container(0, 0);
    this.c.add(this.inner);
    this.build();
    if (!opts.mannequin) {
      this.blinkTimer = scene.time.addEvent({ delay: 2600 + Math.random() * 1600, loop: true, callback: () => this.blink() });
      scene.tweens.add({ targets: [this.headC, this.hairBack].filter(Boolean), y: '-=4', duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    scene.events.once('shutdown', () => this.stop());
    // anche quando il personaggio vive dentro un altro contenitore (ritratti) e viene distrutto con lui
    this.c.once('destroy', () => this.stop());
  }

  private stop(): void {
    this.blinkTimer?.remove();
    this.faceTimer?.remove();
    this.blinkTimer = this.faceTimer = undefined;
    if (this.headC) this.scene.tweens.killTweensOf(this.headC);
    if (this.hairBack) this.scene.tweens.killTweensOf(this.hairBack);
    this.scene.tweens.killTweensOf(this.inner);
  }

  private build(): void {
    const sc = this.scene;
    const ch = charById(this.look.char);
    const img = (key: string) => {
      const p = center(key);
      return sc.add.image(p.x, p.y, key);
    };
    const holder = (slot: Slot) => {
      const im = sc.add.image(0, 0, '__DEFAULT').setVisible(false);
      this.parts.set(slot, im);
      return im;
    };
    this.inner.add(holder('back'));
    if (!this.opts.mannequin && hasHairBack(ch)) {
      this.hairBack = img(`at_hairback_${ch.id}`);
      this.inner.add(this.hairBack);
    }
    this.inner.add(this.opts.mannequin ? img('at_mannequin') : img(`at_body_${ch.skin}`));
    this.inner.add(holder('feet'));
    this.inner.add(holder('dress'));
    this.inner.add(holder('neck'));
    if (!this.opts.mannequin) {
      const hc = sc.add.container(0, NECK_Y - FEET_Y);
      const hp = center(`at_head_${ch.id}`);
      hc.add(sc.add.image(hp.x, hp.y + FEET_Y - NECK_Y, `at_head_${ch.id}`));
      this.eyes = [sc.add.image(157 - 200, 236 - NECK_Y, 'at_eye'), sc.add.image(243 - 200, 236 - NECK_Y, 'at_eye')];
      this.mouth = sc.add.image(0, 292 - NECK_Y, 'at_mouth_smile');
      hc.add([...this.eyes, this.mouth]);
      const hw = sc.add.image(0, 0, '__DEFAULT').setVisible(false);
      this.parts.set('head', hw);
      hc.add(hw);
      this.headC = hc;
      this.inner.add(hc);
    }
    this.inner.add(holder('hand'));
    for (const s of SLOTS) this.show(s, this.look[s]);
  }

  /** Posizione di un capo (rispetto ai piedi, nello spazio del personaggio) e contenitore che lo ospita. */
  private placement(slot: Slot, id: ItemId): { x: number; y: number } {
    const p = center(`at_item_${id}`);
    if (slot !== 'head') return p;
    const dy = FIT_HEAD.has(id) ? 0 : charById(this.look.char).top - HEAD_TOP_REF;
    return { x: p.x, y: p.y + FEET_Y - NECK_Y + dy };
  }

  private show(slot: Slot, id: ItemId | undefined): Phaser.GameObjects.Image | undefined {
    const im = this.parts.get(slot);
    if (!im) return undefined;
    this.scene.tweens.killTweensOf(im);
    if (!id) { im.setVisible(false); return im; }
    const p = this.placement(slot, id);
    im.setTexture(`at_item_${id}`).setPosition(p.x, p.y).setVisible(true).setScale(1).setAlpha(1);
    return im;
  }

  /** Mette (o toglie, con id vuoto) un capo, con un piccolo rimbalzo. */
  wear(slot: Slot, id: ItemId | undefined, anim = true): void {
    if (slot === 'head' && this.opts.mannequin) return;
    this.look = { ...this.look, [slot]: id };
    if (!id) delete this.look[slot];
    const im = this.show(slot, id);
    if (im && id && anim) {
      im.setScale(1.12, 0.9);
      this.scene.tweens.add({ targets: im, scaleX: 1, scaleY: 1, duration: 420, ease: 'Elastic.easeOut', easeParams: [1.1, 0.5] });
    }
  }

  setLook(look: Look): void {
    for (const s of SLOTS) this.wear(s, look[s], false);
    this.look = { ...look };
  }

  /** Punto (in coordinate di scena) dove sta il capo quando è indossato. */
  slotPoint(slot: Slot, id: ItemId): { x: number; y: number } {
    const p = this.placement(slot, id);
    const yOff = slot === 'head' ? NECK_Y - FEET_Y : 0;
    return { x: this.c.x + p.x * this.s, y: this.c.y + (p.y + yOff) * this.s };
  }

  hit(x: number, y: number): boolean {
    return Math.abs(x - this.c.x) < 175 * this.s && y < this.c.y + 20 * this.s && y > this.c.y - 840 * this.s;
  }

  // ------------------------------------------------------------------ espressioni
  face(eyes: Eyes, mouth: Mouth, ms = 0): void {
    this.eyeState = eyes;
    this.eyes.forEach((e) => e.setTexture(EYE_KEY[eyes]));
    this.mouth?.setTexture(MOUTH_KEY[mouth]);
    this.faceTimer?.remove();
    if (ms > 0) this.faceTimer = this.scene.time.delayedCall(ms, () => { if (this.c.active) this.face('open', 'smile'); });
  }

  private blink(): void {
    if (this.eyeState !== 'open' || !this.eyes.length || !this.c.active) return;
    this.eyes.forEach((e) => e.setTexture('at_eye_closed'));
    this.scene.time.delayedCall(140, () => { if (this.eyeState === 'open') this.eyes.forEach((e) => e.setTexture('at_eye')); });
  }

  // ------------------------------------------------------------------ movimenti
  /** Saltello con schiacciamento all'atterraggio. */
  hop(h = 60, onDone?: () => void): void {
    if (this.hopping) { onDone?.(); return; }
    this.hopping = true;
    const sc = this.scene;
    sc.tweens.killTweensOf(this.inner);
    this.inner.setPosition(0, 0).setScale(this.inner.scaleX < 0 ? -1 : 1, 1);
    const sx = Math.sign(this.inner.scaleX) || 1;
    sc.tweens.chain({
      targets: this.inner,
      tweens: [
        { scaleX: 1.08 * sx, scaleY: 0.9, duration: 90, ease: 'Quad.easeOut' },
        { y: -h, scaleX: 0.95 * sx, scaleY: 1.06, duration: 220, ease: 'Quad.easeOut' },
        { y: 0, scaleX: sx, scaleY: 1, duration: 200, ease: 'Quad.easeIn' },
        { scaleX: 1.06 * sx, scaleY: 0.93, duration: 80, yoyo: true },
      ],
      onComplete: () => { this.hopping = false; onDone?.(); },
    });
    if (this.shadow) sc.tweens.add({ targets: this.shadow, scaleX: 1.1, alpha: 0.5, duration: 310, yoyo: true, ease: 'Quad.easeOut' });
  }

  /** Giravolta: il personaggio si gira su se stesso saltando. */
  twirl(onDone?: () => void): void {
    if (this.hopping) { onDone?.(); return; }
    this.hopping = true;
    const sc = this.scene;
    sc.tweens.killTweensOf(this.inner);
    this.inner.setPosition(0, 0).setScale(1, 1);
    this.face('happy', 'open', 1100);
    const st = { t: 0 };
    sc.tweens.add({
      targets: st, t: 1, duration: 760, ease: 'Sine.easeInOut',
      onUpdate: () => {
        this.inner.scaleX = Math.cos(st.t * Math.PI * 2);
        if (Math.abs(this.inner.scaleX) < 0.06) this.inner.scaleX = this.inner.scaleX < 0 ? -0.06 : 0.06;
        this.inner.y = -Math.sin(st.t * Math.PI) * 70;
      },
      onComplete: () => { this.inner.setScale(1, 1).setY(0); this.hopping = false; onDone?.(); },
    });
    if (this.shadow) sc.tweens.add({ targets: this.shadow, scaleX: 1.1, alpha: 0.5, duration: 380, yoyo: true });
  }

  /** Risatina: faccia felice e piccolo saltello. */
  giggle(): void {
    this.face('happy', 'open', 900);
    this.hop(36);
  }

  /** Cammina fino a x con piccoli saltelli. */
  walkTo(x: number, ms: number, onDone?: () => void): void {
    const sc = this.scene;
    this.face('open', 'smile');
    const steps = Math.max(2, Math.round(ms / 330));
    const bob = sc.tweens.add({ targets: this.inner, y: -22, duration: ms / steps / 2, yoyo: true, repeat: steps - 1, ease: 'Quad.easeOut' });
    sc.tweens.add({ targets: this.c, x, duration: ms, ease: 'Sine.easeInOut', onComplete: () => { bob.stop(); this.inner.y = 0; onDone?.(); } });
  }

  destroy(): void {
    this.c.destroy(true);
  }
}
