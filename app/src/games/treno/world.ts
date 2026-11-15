import { wheelFrame } from '../../core/wheels';
import Phaser from 'phaser';
import { LOCO, WAGON, TICKET, RAIL, STATION_COLOR, WHEEL_FRAMES } from './art';
import { AN } from './animals';
import {
  COLORS, TRAIN_RED, RAIL_Y, ANIMAL_SCALE, SEAT_SCALE, wagonW, seatX, trainLayout,
  type AnimalId, type Kind, type Passenger, type StationId, type WagonSpec,
} from './logic';
import { sfx } from './sfx';
import { FONT } from '../../core/brand';

/** Elementi di scena condivisi: stazioncina, stazioni di arrivo, treno animato, animali con il biglietto. */

export const hex = (c: string): number => parseInt(c.slice(1), 16);

/** Bordo del marciapiede (sotto la massicciata). */
export const CURB_Y = RAIL_Y + 78;

const slideIn = (scene: Phaser.Scene, list: { x: number }[], dx: number): void => {
  for (const o of list) {
    const x = o.x;
    o.x += dx;
    scene.tweens.add({ targets: o, x, duration: 1400, ease: 'Cubic.easeOut' });
  }
};

/** Cielo a sfumatura, sole e nuvole che passano piano. */
function sky(scene: Phaser.Scene, top: number, bottom: number, sun = true): Phaser.GameObjects.Image[] {
  const g = scene.add.graphics().setDepth(0);
  g.fillGradientStyle(top, top, bottom, bottom, 1).fillRect(-2000, -1600, 5920, 2300);
  const out: Phaser.GameObjects.Image[] = [];
  if (sun) {
    const s = scene.add.image(1660, 130, 'sun').setDepth(0.5).setScale(0.8);
    scene.tweens.add({ targets: s, scale: 0.85, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    out.push(s);
  }
  [[420, 150, 0.8], [1150, 90, 0.55], [-200, 220, 0.6]].forEach(([x, y, s], i) => {
    const c = scene.add.image(x, y, 'cloud').setDepth(0.6).setScale(s).setAlpha(0.95);
    scene.tweens.add({ targets: c, x: x + (i % 2 ? -90 : 90), duration: 11000 + i * 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  });
  return out;
}

/** Binario (si ripete): la rotaia sta a RAIL_Y. */
export function track(scene: Phaser.Scene, depth = 5): Phaser.GameObjects.TileSprite {
  return scene.add.tileSprite(960, RAIL_Y - RAIL.top, 5920, RAIL.h, 'tr_rail').setOrigin(0.5, 0).setDepth(depth);
}

/** Marciapiede di legno con il cordolo di pietra e la linea gialla. */
function platform(scene: Phaser.Scene, snowy = false): void {
  const g = scene.add.graphics().setDepth(6);
  g.fillGradientStyle(0xd2a066, 0xd2a066, 0xa86f3c, 0xa86f3c, 1).fillRect(-2000, CURB_Y, 5920, 1400);
  g.lineStyle(4, 0x7a4a24, 0.45);
  let row = 0;
  for (let y = CURB_Y + 40, h = 34; y < 1500; h *= 1.22, y += h, row++) {
    g.lineBetween(-2000, y, 3920, y);
    for (let x = -2000 + (row % 2) * 160; x < 3920; x += 320) g.lineBetween(x, y - h, x, y);
  }
  g.fillStyle(0xffffff, 0.1).fillRect(-2000, CURB_Y + 22, 5920, 18);
  // cordolo di pietra e linea gialla
  g.fillGradientStyle(0xe9e4da, 0xe9e4da, 0xb9b0a0, 0xb9b0a0, 1).fillRect(-2000, CURB_Y - 6, 5920, 28);
  g.fillStyle(0xffffff, 0.6).fillRect(-2000, CURB_Y - 6, 5920, 4);
  g.fillStyle(0xffc61a, 1).fillRect(-2000, CURB_Y + 34, 5920, 9);
  g.fillStyle(0x1d2440, 0.18).fillRect(-2000, CURB_Y + 22, 5920, 8);
  if (snowy) {
    g.fillStyle(0xffffff, 0.85);
    for (let x = -1900; x < 3900; x += 130) g.fillEllipse(x + (x % 3) * 20, CURB_Y + 2, 120, 16);
  }
}

/** Erba (o neve) tra le colline e il binario. */
function ground(scene: Phaser.Scene, top: number, bottom: number, y = 470): void {
  const g = scene.add.graphics().setDepth(2);
  g.fillGradientStyle(top, top, bottom, bottom, 1).fillRect(-2000, y, 5920, RAIL_Y - y + 40);
}

/** Cartello con lo stemma della stazione di destinazione. */
export function signpost(scene: Phaser.Scene, x: number, y: number, dest: StationId, s = 0.85): Phaser.GameObjects.Image[] {
  const post = scene.add.image(x, y, 'tr_signpost').setOrigin(0.5, 1).setScale(s).setDepth(7 + y / 1000);
  const emb = scene.add.image(x - 6 * s, y - (340 - 84) * s, `tr_emb_${dest}`).setScale(0.82 * s).setDepth(7.01 + y / 1000);
  return [post, emb];
}

/**
 * Stazioncina di campagna 2.5D: cielo, colline nella foschia (lontano), stazione rossa di legno, alberi e staccionata
 * (medio), binario, marciapiede di legno con lampioni e cartello della destinazione, cespugli sfocati in primo piano.
 */
export function drawStation(scene: Phaser.Scene, dest?: StationId): void {
  sky(scene, 0x5fb8ff, 0xcdeeff);
  const far = [
    scene.add.image(960, 470, 'tr_hills_far').setOrigin(0.5, 1).setScale(2).setDepth(1).setAlpha(0.95),
  ];
  const hills = [scene.add.image(960, 500, 'tr_hills').setOrigin(0.5, 1).setScale(2).setDepth(1.5)];
  ground(scene, 0x8fd078, 0x6cbf58, 480);
  const mid = [
    scene.add.image(240, 590, 'tr_tree').setOrigin(0.5, 1).setScale(0.82).setDepth(3),
    scene.add.image(1700, 590, 'tr_tree').setOrigin(0.5, 1).setScale(0.7).setDepth(3),
    scene.add.image(560, 596, 'tr_fence').setOrigin(0.5, 1).setScale(0.8).setDepth(3.2),
    scene.add.image(1400, 596, 'tr_fence').setOrigin(0.5, 1).setScale(0.8).setDepth(3.2),
    scene.add.image(960, 594, 'tr_station').setOrigin(0.5, 1).setScale(0.74).setDepth(3.5),
    scene.add.image(1880, 600, 'tr_bush').setOrigin(0.5, 1).setScale(0.8).setDepth(3.6),
    scene.add.image(60, 600, 'tr_bush').setOrigin(0.5, 1).setScale(0.7).setDepth(3.6),
  ];
  track(scene);
  platform(scene);
  const props = [
    scene.add.image(-60, CURB_Y + 60, 'tr_lamp').setOrigin(0.5, 1).setScale(0.8).setDepth(7.7),
    scene.add.image(1980, CURB_Y + 60, 'tr_lamp').setOrigin(0.5, 1).setScale(0.8).setDepth(7.7),
    scene.add.image(-230, CURB_Y + 150, 'tr_bench').setScale(0.8).setDepth(7.8),
    ...(dest ? signpost(scene, 110, CURB_Y + 70, dest, 0.72) : []),
  ];
  const fg = [
    scene.add.image(-170, 1150, 'tr_fg_bush').setOrigin(0.5, 1).setDepth(800).setScale(0.9),
    scene.add.image(2100, 1160, 'tr_fg_bush').setOrigin(0.5, 1).setDepth(800).setFlipX(true).setScale(0.8),
  ];
  slideIn(scene, far, 30);
  slideIn(scene, hills, 50);
  slideIn(scene, mid, 90);
  slideIn(scene, props, 160);
  slideIn(scene, fg, 260);
}

/** Le tre stazioni da raggiungere: ognuna con il suo cielo, il suo paesaggio e il suo primo piano. */
export function drawDest(scene: Phaser.Scene, id: StationId): void {
  const skies: Record<StationId, [number, number]> = { fattoria: [0x5fb8ff, 0xd6f1ff], giungla: [0x52c6c0, 0xe0f8d8], polo: [0x8ccdf0, 0xf2f8ff] };
  sky(scene, skies[id][0], skies[id][1], id !== 'polo');
  scene.add.image(960, 560, `tr_far_${id}`).setOrigin(0.5, 1).setScale(2).setDepth(1).setAlpha(id === 'giungla' ? 0.9 : 0.95);
  if (id === 'fattoria') {
    ground(scene, 0x9fd88a, 0x74c45e, 540);
    scene.add.image(1460, 600, 'tr_barn').setOrigin(0.5, 1).setScale(0.78).setDepth(3.4);
    scene.add.image(420, 600, 'tr_haystack').setOrigin(0.5, 1).setScale(0.9).setDepth(3.4);
    for (let i = 0; i < 6; i++) {
      const s = scene.add.image(640 + i * 70, 610 - (i % 2) * 8, 'tr_sunflower').setOrigin(0.5, 1).setScale(0.6 + (i % 3) * 0.06).setDepth(3.5);
      scene.tweens.add({ targets: s, scaleX: s.scaleX * 0.93, duration: 1300 + i * 120, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    scene.add.image(1900, 600, 'tr_tree').setOrigin(0.5, 1).setScale(0.72).setDepth(3.3);
    scene.add.image(150, 604, 'tr_fence').setOrigin(0.5, 1).setScale(0.6).setDepth(3.2);
  } else if (id === 'giungla') {
    ground(scene, 0x5cbf6a, 0x3a9a50, 520);
    scene.add.image(250, 610, 'tr_palm').setOrigin(0.5, 1).setScale(0.82).setDepth(3.4);
    scene.add.image(1720, 610, 'tr_palm').setOrigin(0.5, 1).setScale(0.95).setFlipX(true).setDepth(3.4);
    scene.add.image(1180, 604, 'tr_palm').setOrigin(0.5, 1).setScale(0.6).setDepth(3.2);
    for (const [x, s] of [[560, 0.9], [860, 0.7], [1480, 0.85], [2000, 0.8], [-80, 0.8]] as const) scene.add.image(x, 604, 'tr_jungle_bush').setOrigin(0.5, 1).setScale(s).setDepth(3.5);
    const leaves = scene.add.particles(0, 0, 'tr_leaf', {
      x: { min: -400, max: 2300 }, y: -40, speedY: { min: 60, max: 120 }, speedX: { min: -50, max: 50 }, rotate: { min: 0, max: 360 },
      scale: { min: 0.7, max: 1.2 }, lifespan: 12000, frequency: 700, tint: [0x5cbf6a, 0x3dbb4f, 0xffc61a],
    }).setDepth(790);
    leaves.fastForward(6000);
  } else {
    ground(scene, 0xf4faff, 0xd6eaf7, 540);
    scene.add.image(1480, 604, 'tr_igloo').setOrigin(0.5, 1).setScale(0.82).setDepth(3.4);
    for (const [x, s] of [[300, 0.85], [430, 0.65], [1820, 0.8], [960, 0.55], [-60, 0.75]] as const) scene.add.image(x, 606, 'tr_snowpine').setOrigin(0.5, 1).setScale(s).setDepth(3.3);
    // aurora leggera nel cielo
    const au = scene.add.graphics().setDepth(0.4).setBlendMode(Phaser.BlendModes.ADD);
    au.fillStyle(0x7affc8, 0.12).fillEllipse(700, 140, 1500, 120);
    au.fillStyle(0xb58cf0, 0.1).fillEllipse(1300, 200, 1300, 100);
    scene.tweens.add({ targets: au, alpha: 0.5, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const snow = scene.add.particles(0, 0, 'tr_flake', {
      x: { min: -400, max: 2300 }, y: -40, speedY: { min: 50, max: 110 }, speedX: { min: -30, max: 30 },
      scale: { min: 0.5, max: 1.1 }, alpha: { start: 0.95, end: 0.6 }, lifespan: 16000, frequency: 160,
    }).setDepth(790);
    snow.fastForward(9000);
  }
  track(scene);
  platform(scene, id === 'polo');
  signpost(scene, 110, CURB_Y + 70, id, 0.72);
  scene.add.image(1980, CURB_Y + 60, 'tr_lamp').setOrigin(0.5, 1).setScale(0.8).setDepth(7.7);
  const fgKey = id === 'polo' ? 'tr_fg_snow' : id === 'giungla' ? 'tr_leaves' : 'tr_fg_bush';
  scene.add.image(-170, 1150, fgKey).setOrigin(0.5, 1).setDepth(800).setScale(0.9);
  scene.add.image(2100, 1160, fgKey).setOrigin(0.5, 1).setDepth(800).setFlipX(true).setScale(0.8);
}

// =====================================================================
// Treno
// =====================================================================

/** Faccia felice per un po' (dopo torna normale). */
export function happyFace(scene: Phaser.Scene, img: Phaser.GameObjects.Image, id: AnimalId, ms = 900): void {
  img.setTexture(`tr_an_${id}_happy`);
  const ver = ((img.getData('fv') as number) ?? 0) + 1;
  img.setData('fv', ver);
  if (ms > 0) scene.time.delayedCall(ms, () => { if (img.active && img.getData('fv') === ver) img.setTexture(`tr_an_${id}`); });
}

export interface WagonView {
  spec: WagonSpec;
  c: Phaser.GameObjects.Container;
  panel: Phaser.GameObjects.Image;
  plate: Phaser.GameObjects.Image;
  symbol?: Phaser.GameObjects.Image | Phaser.GameObjects.Text;
  backrests: Phaser.GameObjects.Image[];
  seated: { id: AnimalId; img: Phaser.GameObjects.Image }[];
  wheels: Phaser.GameObjects.Image[];
  w: number;
}

/** Posto a sedere in coordinate del vagone: piedi nascosti dietro la fiancata, testa e spalle sopra il bordo. */
export const SEAT_FEET = -122;

/**
 * Treno a pezzi: locomotiva (con le ruote che girano e lo stemma della destinazione) e vagoni scoperti
 * (schienali, animali seduti, fiancata colorata, targa con forma, colore o numero). Si muove con move(dx):
 * le ruote girano della giusta quantità. Nessuna rotazione di oggetti grandi.
 */
export class TrainView {
  readonly loco: Phaser.GameObjects.Container;
  readonly wagons: WagonView[] = [];
  private locoWheels: { img: Phaser.GameObjects.Image; r: number; key: string }[] = [];
  /** quanta strada hanno fatto le ruote (per scegliere il fotogramma dei raggi) */
  private dist = 0;
  private smoke: Phaser.GameObjects.Particles.ParticleEmitter;
  private bobs: Phaser.Tweens.Tween[] = [];

  constructor(private scene: Phaser.Scene, readonly kind: Kind, specs: readonly WagonSpec[], dest: StationId, x0 = 960, depth = 20) {
    const lay = trainLayout(specs.map((w) => w.cap), x0);
    const sc = scene;
    // locomotiva
    const body = sc.add.image(0, 0, 'tr_loco').setOrigin(0.5, LOCO.rail / LOCO.h);
    const parts: Phaser.GameObjects.GameObject[] = [body];
    LOCO.wheels.forEach((w, i) => {
      const key = i < 2 ? 'tr_wheel_big' : 'tr_wheel';
      const img = sc.add.image(w.x - LOCO.w / 2, -w.r, `${key}_0`);
      this.locoWheels.push({ img, r: w.r, key });
      parts.push(img);
    });
    parts.push(sc.add.image(LOCO.plate.x - LOCO.w / 2, LOCO.plate.y - LOCO.rail, `tr_emb_${dest}`).setScale(0.36));
    this.loco = sc.add.container(lay.loco, RAIL_Y, parts).setDepth(depth + 1);
    // vagoni
    specs.forEach((spec, i) => this.wagons.push(this.makeWagon(spec, lay.wagons[i], depth)));
    this.smoke = sc.add.particles(0, 0, 'tr_puff', {
      speedY: { min: -170, max: -110 }, speedX: { min: -90, max: -40 }, scale: { start: 0.45, end: 1.3 }, alpha: { start: 0.95, end: 0 },
      lifespan: 1500, emitting: false,
    }).setDepth(depth + 30);
  }

  private makeWagon(spec: WagonSpec, x: number, depth: number): WagonView {
    const sc = this.scene, c = spec.cap, W = wagonW(c), oy = WAGON.rail / WAGON.h;
    const back = sc.add.image(0, 0, `tr_wagon_back_${c}`).setOrigin(0.5, oy);
    const backrests: Phaser.GameObjects.Image[] = [];
    for (let k = 0; k < c; k++) backrests.push(sc.add.image(seatX(0, k, c), WAGON.backrestY + 30 - WAGON.rail, 'tr_backrest').setScale(0.9));
    const paint = this.kind === 'color' && spec.color ? COLORS[spec.color] : TRAIN_RED;
    const panel = sc.add.image(0, 0, `tr_wagon_panel_${c}`).setOrigin(0.5, oy).setTint(hex(paint));
    const trim = sc.add.image(0, 0, `tr_wagon_trim_${c}`).setOrigin(0.5, oy);
    const plate = sc.add.image(0, WAGON.plateY - WAGON.rail, 'tr_plate').setScale(0.78);
    let symbol: WagonView['symbol'];
    if (this.kind === 'shape' && spec.shape) symbol = sc.add.image(plate.x, plate.y, `tr_shape_${spec.shape}`).setScale(0.68);
    else if (this.kind === 'color' && spec.color) symbol = sc.add.image(plate.x, plate.y, `tr_dot_${spec.color}`).setScale(0.62);
    else symbol = sc.add.text(plate.x, plate.y + 2, String(c), { fontFamily: FONT, fontSize: '64px', fontStyle: '700', color: '#c8382f', stroke: '#ffffff', strokeThickness: 6 }).setOrigin(0.5);
    const wheels = [-1, 1].map((s) => sc.add.image(s * (W / 2 - 62), -WAGON.wheelR, 'tr_wheel_wagon_0'));
    const list: Phaser.GameObjects.GameObject[] = [back, ...backrests, panel, trim, plate, symbol, ...wheels];
    const cont = sc.add.container(x, RAIL_Y, list).setDepth(depth);
    return { spec, c: cont, panel, plate, symbol, backrests, seated: [], wheels, w: W };
  }

  /** Tutti i pezzi del treno (per spostarli insieme). */
  get parts(): Phaser.GameObjects.Container[] { return [this.loco, ...this.wagons.map((w) => w.c)]; }

  /** Sposta il treno di dx: le ruote girano in proporzione. */
  move(dx: number): void {
    for (const p of this.parts) p.x += dx;
    this.spin(dx);
  }

  /** Fa girare le ruote come se il treno avanzasse di dx (anche restando fermo sullo schermo, nel viaggio). */
  spin(dx: number): void {
    this.dist += dx;
    // angolo percorso (in gradi) → fotogramma dei raggi: un fotogramma ogni 15°
    const frame = (r: number) => wheelFrame(this.dist, r, WHEEL_FRAMES, 45);
    this.locoWheels.forEach((w) => w.img.setTexture(`${w.key}_${frame(w.r)}`));
    const fw = `tr_wheel_wagon_${frame(WAGON.wheelR)}`;
    this.wagons.forEach((w) => w.wheels.forEach((img) => { if (img.texture.key !== fw) img.setTexture(fw); }));
  }

  /** Porta il treno da qui a toX con un tween (ruote, sbuffi). */
  drive(toX: number, ms: number, ease: string, onDone?: () => void, puffEvery = 260): void {
    const st = { x: this.loco.x };
    let last = st.x, acc = 0;
    this.scene.tweens.add({
      targets: st, x: toX, duration: ms, ease,
      onUpdate: () => {
        const dx = st.x - last;
        last = st.x;
        this.move(dx);
        acc += Math.abs(dx);
        if (acc > puffEvery * 0.35) { acc = 0; this.puff(1); }
      },
      onComplete: () => onDone?.(),
    });
  }

  /** Sbuffi di vapore dal comignolo. */
  puff(n = 2): void {
    const x = this.loco.x + LOCO.chimney.x - LOCO.w / 2, y = this.loco.y + LOCO.chimney.y - LOCO.rail;
    this.smoke.emitParticleAt(x, y, n);
  }

  /** Il fischio: sbuffo grande e la locomotiva che si stiracchia. */
  whistle(): void {
    sfx.whistle();
    this.puff(5);
    this.scene.tweens.add({ targets: this.loco, scaleY: 1.06, scaleX: 0.97, duration: 160, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
  }

  /** Centro della targa del vagone i, in coordinate di scena. */
  plateAt(i: number): { x: number; y: number } {
    const w = this.wagons[i];
    return { x: w.c.x + w.plate.x, y: w.c.y + w.plate.y };
  }

  /** Posto libero k del vagone i, in coordinate di scena (piedi dell'animale). */
  seatAt(i: number, k: number): { x: number; y: number } {
    const w = this.wagons[i];
    return { x: w.c.x + seatX(0, k, w.spec.cap), y: w.c.y + SEAT_FEET };
  }

  /** Fa sedere un animale nel posto successivo (dietro la fiancata). */
  seat(i: number, id: AnimalId): Phaser.GameObjects.Image {
    const w = this.wagons[i];
    const k = w.seated.length;
    const img = this.scene.add.image(seatX(0, k, w.spec.cap), SEAT_FEET, `tr_an_${id}`).setOrigin(0.5, AN.ground / AN.h).setScale(SEAT_SCALE);
    w.c.addAt(img, w.c.getIndex(w.panel));
    w.seated.push({ id, img });
    if (w.backrests[k]) this.scene.tweens.add({ targets: w.backrests[k], alpha: 0, duration: 200 });
    return img;
  }

  /** Il vagone che dice "no" (spostandosi un poco, senza ruotare). */
  shake(i: number): void {
    const c = this.wagons[i].c, x = c.x;
    this.scene.tweens.add({ targets: c, x: x + 12, duration: 60, yoyo: true, repeat: 2, ease: 'Sine.easeInOut', onComplete: () => { c.x = x; } });
  }

  /** Il vagone si illumina (pieno o appena scelto). */
  glow(i: number): void {
    const p = this.plateAt(i);
    const g = this.scene.add.image(p.x, p.y, 'glow').setScale(1.8).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD).setDepth(60);
    this.scene.tweens.add({ targets: g, alpha: 0.9, duration: 220, yoyo: true, hold: 260, onComplete: () => g.destroy() });
    this.scene.tweens.add({ targets: [this.wagons[i].plate, this.wagons[i].symbol], scale: '*=1.25', duration: 160, yoyo: true });
  }

  /** Gli animali seduti dondolano a tempo con le rotaie. */
  bob(on: boolean): void {
    this.bobs.forEach((t) => t.stop());
    this.bobs = [];
    if (!on) return;
    this.wagons.forEach((w, i) => w.seated.forEach((s, k) => {
      s.img.y = SEAT_FEET;
      this.bobs.push(this.scene.tweens.add({ targets: s.img, y: SEAT_FEET - 10, duration: 190, yoyo: true, repeat: -1, delay: (i * 3 + k) * 60, ease: 'Sine.easeInOut' }));
    }));
  }

  /** Animale seduto toccato nel treno (per i tocchi durante il viaggio). */
  hitSeated(x: number, y: number): { id: AnimalId; img: Phaser.GameObjects.Image } | null {
    for (const w of this.wagons) for (const s of w.seated) {
      const sx = w.c.x + s.img.x, sy = w.c.y + s.img.y - 200 * SEAT_SCALE;
      if (Math.abs(x - sx) < 80 && Math.abs(y - sy) < 100) return s;
    }
    return null;
  }

  hitLoco(x: number, y: number): boolean {
    return Math.abs(x - this.loco.x) < LOCO.w / 2 && y > this.loco.y - LOCO.rail && y < this.loco.y + 10;
  }

  get right(): number { return this.loco.x + LOCO.w / 2; }
  get left(): number { const w = this.wagons[this.wagons.length - 1]; return w ? w.c.x - w.w / 2 : this.loco.x - LOCO.w / 2; }
}

// =====================================================================
// Animali in attesa sul marciapiede, con il biglietto appeso al collo
// =====================================================================

/** Dove sta il biglietto rispetto ai piedi dell'animale (unità della texture). */
const TICKET_DY = -40;
const TICKET_SCALE = 0.86;

export class Waiter {
  readonly img: Phaser.GameObjects.Image;
  readonly shadow: Phaser.GameObjects.Image;
  readonly card?: Phaser.GameObjects.Image;
  readonly sym?: Phaser.GameObjects.Image;
  readonly top?: Phaser.GameObjects.Image;
  private idleTimer: Phaser.Time.TimerEvent;
  busy = false;

  constructor(private scene: Phaser.Scene, readonly p: Passenger, kind: Kind, x: number, y: number, depth = 40) {
    const sc = scene;
    this.shadow = sc.add.image(x, y + 4, 'shadow').setScale(0.9, 0.4).setAlpha(0.8).setDepth(depth - 1);
    this.img = sc.add.image(x, y, `tr_an_${p.animal}`).setOrigin(0.5, AN.ground / AN.h).setScale(ANIMAL_SCALE).setDepth(depth);
    if (kind === 'color' && p.color) {
      this.card = sc.add.image(x, y, 'tr_ticket').setOrigin(0.5, TICKET.cy / TICKET.h).setTint(hex(COLORS[p.color]));
    } else if (kind === 'shape' && p.shape) {
      this.card = sc.add.image(x, y, 'tr_ticket').setOrigin(0.5, TICKET.cy / TICKET.h).setTint(0xfff3d6);
      this.sym = sc.add.image(x, y, `tr_shape_${p.shape}`);
    }
    if (this.card) this.top = sc.add.image(x, y, 'tr_ticket_top').setOrigin(0.5, TICKET.cy / TICKET.h);
    this.sync();
    sc.events.on('update', this.sync, this);
    this.idleTimer = sc.time.addEvent({ delay: 2600 + Math.random() * 2200, loop: true, callback: () => this.fidget() });
    sc.events.once('shutdown', () => this.stop());
  }

  /** Il biglietto segue l'animale (anche quando lo si trascina). */
  sync(): void {
    const o = this.img;
    if (!o.active) return;
    const d = o.depth;
    const s = o.scaleX * TICKET_SCALE;
    const ty = o.y + TICKET_DY * o.scaleY;
    this.card?.setPosition(o.x, ty).setScale(s).setDepth(d + 0.01).setAlpha(o.alpha);
    this.top?.setPosition(o.x, ty).setScale(s).setDepth(d + 0.03).setAlpha(o.alpha);
    this.sym?.setPosition(o.x, ty + 4 * s).setScale(1.0 * s).setDepth(d + 0.02).setAlpha(o.alpha);
  }

  /** Piccolo saltello d'attesa (solo se nessuno lo sta trascinando). */
  private fidget(): void {
    if (this.busy || !this.img.active || this.img.depth > 1000 || this.scene.tweens.isTweening(this.img)) return;
    const y = this.img.y;
    this.scene.tweens.add({ targets: this.img, y: y - 26, duration: 170, yoyo: true, ease: 'Quad.easeOut', onComplete: () => { this.img.y = y; } });
  }

  /** Saluto felice al tocco o all'arrivo. */
  cheer(): void {
    happyFace(this.scene, this.img, this.p.animal);
    sfx.voice(this.p.animal);
  }

  /** Toglie il biglietto con una piccola animazione verso (x, y) (la targa del vagone). */
  punch(x: number, y: number): void {
    const list = [this.card, this.sym, this.top].filter(Boolean) as Phaser.GameObjects.Image[];
    this.scene.events.off('update', this.sync, this);
    list.forEach((o) => this.scene.tweens.add({ targets: o, x, y, scale: o.scale * 0.4, alpha: 0, duration: 380, ease: 'Quad.easeIn', onComplete: () => o.destroy() }));
  }

  stop(): void {
    this.idleTimer.remove();
    this.scene.events.off('update', this.sync, this);
  }

  destroy(): void {
    this.stop();
    [this.img, this.shadow, this.card, this.sym, this.top].forEach((o) => o?.destroy());
  }
}

/** Colore dell'anello dello stemma (per i titoli delle stazioni). */
export const stationTint = (id: StationId): number => hex(STATION_COLOR[id]);
