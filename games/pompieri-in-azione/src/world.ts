import Phaser from 'phaser';
import { TRUCK_PIVOT } from './art';
import { truckById, type TruckDef } from './levels';
import { sfx } from './sfx';

/** Elementi di scena condivisi: sfondo città, palazzo, camion dei pompieri. */

export const OUT = 0x2b2140;
export const GROUND_Y = 900;   // inizio marciapiede
export const STREET_Y = 940;   // inizio strada
export const CELL = 200;
export const FONT = '"Trebuchet MS", "Arial Rounded MT Bold", Verdana, sans-serif';

export function darken(c: number, pct: number): number {
  return Phaser.Display.Color.IntegerToColor(c).darken(pct).color;
}
export function lighten(c: number, pct: number): number {
  return Phaser.Display.Color.IntegerToColor(c).lighten(pct).color;
}

/**
 * Sfondo a piani (2.5D): cielo, sole, nuvole a due velocità, città lontana nella foschia,
 * casette e alberi a metà distanza, marciapiede e strada, cespugli sfocati in primo piano.
 * All'ingresso della scena i piani scorrono a velocità diverse (parallasse).
 */
export function drawBackdrop(scene: Phaser.Scene, opts: { street?: boolean; sunX?: number; foreground?: boolean } = {}): void {
  const g = scene.add.graphics().setDepth(0);
  g.fillGradientStyle(0x4fb3f2, 0x6cc4f7, 0xd4f0ff, 0xe2f5ff, 1);
  g.fillRect(-2000, -1600, 5920, GROUND_Y + 1600);

  const sun = scene.add.image(opts.sunX ?? 330, 190, 'sun').setDepth(1);
  scene.tweens.add({ targets: sun, scale: 1.06, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

  // nuvole: lontane (piccole, lente, più trasparenti) e vicine
  for (let i = 0; i < 6; i++) {
    const far = i < 3;
    const c = scene.add.image(-300 + i * 520, far ? 260 + (i % 2) * 60 : 110 + (i % 2) * 120, 'cloud')
      .setDepth(far ? 1.5 : 2.5).setAlpha(far ? 0.6 : 0.95).setScale(far ? 0.45 : 0.75 + (i % 3) * 0.15);
    scene.tweens.add({
      targets: c, x: c.x + 2600, duration: (far ? 180000 : 90000) + i * 9000, repeat: -1,
      onRepeat: () => { c.x = -1200; },
    });
  }

  const far = scene.add.tileSprite(-2000, GROUND_Y - 60, 5920, 380, 'skyline').setOrigin(0, 1).setDepth(3);
  const mid = scene.add.tileSprite(-2000, GROUND_Y + 4, 5920, 240, 'midtown').setOrigin(0, 1).setDepth(4);

  const s = scene.add.graphics().setDepth(5);
  // marciapiede: piano superiore chiaro + bordo del cordolo in ombra
  s.fillGradientStyle(0xf3ede2, 0xf3ede2, 0xd9cfbd, 0xd9cfbd, 1).fillRect(-2000, GROUND_Y, 5920, STREET_Y - GROUND_Y - 10);
  s.fillStyle(0xcfc4b0, 0.7);
  for (let x = -2000; x < 3920; x += 90) s.fillRect(x, GROUND_Y + 4, 4, STREET_Y - GROUND_Y - 16);
  s.fillStyle(0xffffff, 0.7).fillRect(-2000, GROUND_Y, 5920, 4);
  s.fillGradientStyle(0xb9ad97, 0xb9ad97, 0x8f846f, 0x8f846f, 1).fillRect(-2000, STREET_Y - 10, 5920, 14);
  // strada con sfumatura e ombra del cordolo
  s.fillGradientStyle(0x7a8292, 0x7a8292, 0x4f5564, 0x4f5564, 1).fillRect(-2000, STREET_Y + 4, 5920, 1400);
  s.fillStyle(0x1d2440, 0.22).fillRect(-2000, STREET_Y + 4, 5920, 16);
  if (opts.street !== false) {
    s.fillStyle(0xffffff, 0.8);
    for (let x = -2000; x < 3920; x += 220) s.fillRoundedRect(x, 1032, 120, 14, 7);
  }
  // decorazioni fuori dall'area di gioco (visibili su schermi larghi)
  scene.add.image(-200, GROUND_Y + 10, 'bush').setOrigin(0.5, 1).setDepth(6);
  scene.add.image(2140, GROUND_Y + 10, 'bush').setOrigin(0.5, 1).setDepth(6);
  scene.add.image(2320, GROUND_Y + 14, 'hydrant').setOrigin(0.5, 1).setDepth(6);
  // primo piano sfocato
  const fg: Phaser.GameObjects.Image[] = [];
  if (opts.foreground !== false) {
    fg.push(scene.add.image(40, 1170, 'bush_fg').setOrigin(0.5, 1).setScale(1.6).setDepth(800));
    fg.push(scene.add.image(1890, 1175, 'bush_fg').setOrigin(0.5, 1).setScale(1.7).setDepth(800));
  }
  // parallasse d'ingresso: ogni piano scorre di una quantità diversa
  const slide = (o: { x: number }, dx: number) => scene.tweens.add({ targets: o, x: o.x - dx, from: o.x, duration: 1400, ease: 'Cubic.easeOut' });
  far.x += 40; slide(far, 40);
  mid.x += 90; slide(mid, 90);
  fg.forEach((f) => { f.x += 260; slide(f, 260); });
}

export interface Cell {
  col: number;
  row: number;
  x: number;
  y: number;
  glow: Phaser.GameObjects.Image;
  busy: boolean;
}

/**
 * Palazzo 2.5D (Graphics): facciata con sfumatura luce alto-sinistra, fianco destro in ombra
 * e tetto in prospettiva, cornicioni con luce e ombra, porta incassata.
 */
export function drawBuilding(scene: Phaser.Scene, cx: number, cols: number, rows: number, wall: number): { cells: Cell[]; top: number; left: number; right: number } {
  const width = cols * CELL + 80;
  const left = cx - width / 2;
  const right = left + width;
  const winBase = GROUND_Y - 170;
  const top = winBase - rows * CELL;
  const D = 46; // profondità del fianco
  const g = scene.add.graphics().setDepth(20);
  const wl = lighten(wall, 14), wd = darken(wall, 14), side = darken(wall, 30), sideD = darken(wall, 40);

  // ombra portata sul marciapiede (verso destra, luce da sinistra)
  g.fillStyle(0x1d2440, 0.18).fillPoints([
    new Phaser.Math.Vector2(right, GROUND_Y), new Phaser.Math.Vector2(right + D + 60, GROUND_Y),
    new Phaser.Math.Vector2(right + D + 90, GROUND_Y + 34), new Phaser.Math.Vector2(left + 40, GROUND_Y + 34),
    new Phaser.Math.Vector2(left, GROUND_Y)], true);
  // fianco destro
  g.fillGradientStyle(side, sideD, side, sideD, 1);
  g.fillPoints([
    new Phaser.Math.Vector2(right, top + 10), new Phaser.Math.Vector2(right + D, top - 16),
    new Phaser.Math.Vector2(right + D, GROUND_Y - 26), new Phaser.Math.Vector2(right, GROUND_Y)], true);
  // facciata
  g.fillGradientStyle(wl, wall, wall, wd, 1).fillRect(left, top + 10, width, GROUND_Y - top - 10);
  // mattoncini decorativi (pseudo-casuali ma stabili) con luce e ombra
  let seed = cols * 31 + rows * 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < cols * rows * 3; i++) {
    const bx = left + 20 + rnd() * (width - 80), by = top + 30 + rnd() * (winBase - top - 40);
    g.fillStyle(darken(wall, 8), 0.8).fillRoundedRect(bx + 2, by + 3, 44, 18, 6);
    g.fillStyle(lighten(wall, 10), 0.9).fillRoundedRect(bx, by, 44, 18, 6);
  }
  // cornicioni tra i piani: piano superiore chiaro, ombra sotto
  for (let r = 0; r <= rows; r++) {
    const y = winBase - r * CELL;
    g.fillStyle(0x1d2440, 0.12).fillRect(left, y + 6, width, 10);
    g.fillStyle(darken(wall, 6)).fillRect(left - 6, y - 7, width + 12, 14);
    g.fillStyle(lighten(wall, 22)).fillRect(left - 6, y - 7, width + 12, 4);
    g.fillStyle(side).fillPoints([new Phaser.Math.Vector2(right + 6, y - 7), new Phaser.Math.Vector2(right + 6 + D * 0.3, y - 15),
      new Phaser.Math.Vector2(right + 6 + D * 0.3, y + 1), new Phaser.Math.Vector2(right + 6, y + 7)], true);
  }
  // tetto in prospettiva
  const rt = top - 34;
  g.fillStyle(lighten(wall, 6)).fillPoints([
    new Phaser.Math.Vector2(left - 24, rt), new Phaser.Math.Vector2(left - 24 + D, rt - 26),
    new Phaser.Math.Vector2(right + 24 + D, rt - 26), new Phaser.Math.Vector2(right + 24, rt)], true);
  g.fillGradientStyle(darken(wall, 10), darken(wall, 22), darken(wall, 18), darken(wall, 30), 1).fillRect(left - 24, rt, width + 48, 44);
  g.fillStyle(lighten(wall, 25)).fillRect(left - 24, rt, width + 48, 5);
  g.fillStyle(darken(wall, 38)).fillPoints([
    new Phaser.Math.Vector2(right + 24, rt), new Phaser.Math.Vector2(right + 24 + D, rt - 26),
    new Phaser.Math.Vector2(right + 24 + D, rt + 18), new Phaser.Math.Vector2(right + 24, rt + 44)], true);
  g.fillStyle(0x1d2440, 0.18).fillRect(left, rt + 44, width, 12);
  // comignolo metallico
  const cxm = left + 50;
  g.fillGradientStyle(0xf2f5fa, 0xaeb7c7, 0xd5dbe6, 0x8790a3, 1).fillRoundedRect(cxm, rt - 82, 70, 64, 10);
  g.fillStyle(0x8790a3).fillPoints([new Phaser.Math.Vector2(cxm + 70, rt - 76), new Phaser.Math.Vector2(cxm + 86, rt - 86),
    new Phaser.Math.Vector2(cxm + 86, rt - 28), new Phaser.Math.Vector2(cxm + 70, rt - 18)], true);
  g.fillStyle(0xffffff, 0.6).fillRect(cxm + 8, rt - 76, 8, 50);

  // piano terra: tenda a strisce, porta incassata, gradino
  const doorX = cx;
  g.fillStyle(0x1d2440, 0.2).fillRoundedRect(doorX - 106, GROUND_Y - 164, 212, 34, 12);
  for (let i = 0; i < 8; i++) {
    g.fillStyle(i % 2 ? 0xffffff : 0xff5a4a).fillRect(doorX - 100 + i * 25, GROUND_Y - 176, 25, 30);
  }
  g.fillGradientStyle(0xffffff, 0xffffff, 0x000000, 0x000000, 0.0, 0.0, 0.18, 0.18).fillRect(doorX - 100, GROUND_Y - 176, 200, 30);
  g.fillStyle(0x1d2440, 0.3).fillRoundedRect(doorX - 78, GROUND_Y - 152, 156, 152, { tl: 78, tr: 78, bl: 0, br: 0 });
  g.fillGradientStyle(0xc0794a, 0x9b5a34, 0x9b5a34, 0x6e3c20, 1);
  g.fillRoundedRect(doorX - 66, GROUND_Y - 142, 132, 142, { tl: 66, tr: 66, bl: 0, br: 0 });
  g.fillStyle(0x6e3c20, 0.6).fillRoundedRect(doorX - 48, GROUND_Y - 112, 40, 52, 8).fillRoundedRect(doorX + 8, GROUND_Y - 112, 40, 52, 8);
  g.fillStyle(0xd99a6a, 0.6).fillRect(doorX - 48, GROUND_Y - 112, 40, 3).fillRect(doorX + 8, GROUND_Y - 112, 40, 3);
  g.fillStyle(0xffd23f).fillCircle(doorX + 40, GROUND_Y - 62, 9);
  g.fillStyle(0xffffff, 0.8).fillCircle(doorX + 37, GROUND_Y - 65, 3);
  g.fillGradientStyle(0xe9e3d6, 0xe9e3d6, 0xb8ad98, 0xb8ad98, 1).fillRect(doorX - 82, GROUND_Y - 8, 164, 12);

  const cells: Cell[] = [];
  const x0 = left + 40 + CELL / 2;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = x0 + c * CELL;
      const y = winBase - CELL / 2 - r * CELL;
      scene.add.image(x, y + 5, 'window').setDepth(30);
      const glow = scene.add.image(x, y + 5, 'window_glow').setDepth(31).setAlpha(0);
      scene.add.image(x, y + 5, 'window_frame').setDepth(32);
      cells.push({ col: c, row: r, x, y, glow, busy: false });
    }
  }
  [doorX - 190, doorX + 190].forEach((x) => {
    if (x > left + 60 && x < right - 60) scene.add.image(x, GROUND_Y + 6, 'bush').setOrigin(0.5, 1).setScale(0.6).setDepth(33);
  });
  return { cells, top, left, right };
}

/** Il camion: corpo + cannone ad acqua orientabile + scala estensibile + lampeggiante. */
export class Truck {
  readonly body: Phaser.GameObjects.Image;
  readonly nozzle: Phaser.GameObjects.Image;
  readonly ladder: Phaser.GameObjects.TileSprite;
  readonly beacon: Phaser.GameObjects.Image;
  def: TruckDef;
  private sirenUntil = 0;

  static readonly LADDER_REST = 200;

  constructor(private scene: Phaser.Scene, readonly x: number, readonly y: number, truckId: string, depth = 50) {
    this.def = truckById(truckId);
    this.body = scene.add.image(x, y, `truck_${this.def.id}`).setOrigin(0, 0).setDepth(depth);
    this.ladder = scene.add.tileSprite(x + TRUCK_PIVOT.ladder.x, y + TRUCK_PIVOT.ladder.y, Truck.LADDER_REST, 48, 'ladder_tile')
      .setOrigin(0, 0.5).setDepth(depth + 1);
    this.nozzle = scene.add.image(x + TRUCK_PIVOT.nozzle.x, y + TRUCK_PIVOT.nozzle.y, 'nozzle')
      .setOrigin(22 / 140, 0.5).setDepth(depth + 2).setAngle(-25);
    this.beacon = scene.add.image(x + TRUCK_PIVOT.beacon.x, y + TRUCK_PIVOT.beacon.y, 'glow')
      .setDepth(depth + 3).setTint(0xff3b3b).setAlpha(0.15).setScale(0.6);
    scene.tweens.add({ targets: this.beacon, alpha: 0.55, duration: 600, yoyo: true, repeat: -1 });
  }

  setTruck(id: string): void {
    this.def = truckById(id);
    this.body.setTexture(`truck_${this.def.id}`);
  }

  contains(px: number, py: number): boolean {
    return px > this.x + 10 && px < this.x + 550 && py > this.y + 30 && py < this.y + 320;
  }

  /** Suona la sirena (con pausa minima tra una e l'altra) e fa un saltello. */
  honk(): void {
    const now = this.scene.time.now;
    if (now < this.sirenUntil) return;
    this.sirenUntil = now + 1300;
    sfx.siren(this.def.siren);
    const targets = [this.body, this.nozzle, this.ladder, this.beacon];
    this.scene.tweens.add({ targets, y: '-=18', duration: 120, yoyo: true, repeat: 2, ease: 'Quad.easeOut' });
    this.scene.tweens.add({ targets: this.beacon, scale: 1.4, duration: 150, yoyo: true, repeat: 3 });
  }

  /** Punta il cannone verso (tx,ty) e restituisce la posizione della bocca. */
  aim(tx: number, ty: number): { x: number; y: number } {
    const a = Phaser.Math.Angle.Between(this.nozzle.x, this.nozzle.y, tx, ty);
    const clamped = Phaser.Math.Clamp(a, -Math.PI * 0.95, -0.05);
    this.scene.tweens.add({ targets: this.nozzle, rotation: clamped, duration: 90, ease: 'Quad.easeOut' });
    const len = 124;
    return { x: this.nozzle.x + Math.cos(clamped) * len, y: this.nozzle.y + Math.sin(clamped) * len };
  }

  /** Getto d'acqua ad arco: gocce lungo una curva; onHit quando arrivano. */
  spray(tx: number, ty: number, onHit?: () => void): void {
    const from = this.aim(tx, ty);
    sfx.spray();
    const ctrl = new Phaser.Math.Vector2((from.x + tx) / 2, Math.min(from.y, ty) - 160);
    const curve = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(from.x, from.y), ctrl, new Phaser.Math.Vector2(tx, ty));
    const N = 12;
    for (let i = 0; i < N; i++) {
      const d = this.scene.add.image(from.x, from.y, 'drop').setDepth(60).setScale(0.6 + Math.random() * 0.5).setAlpha(0);
      const p = { t: 0 };
      this.scene.tweens.add({
        targets: p, t: 1, duration: 300, delay: i * 18, ease: 'Sine.easeIn',
        onStart: () => d.setAlpha(1),
        onUpdate: () => {
          const pt = curve.getPoint(p.t);
          const next = curve.getPoint(Math.min(1, p.t + 0.05));
          d.setPosition(pt.x, pt.y).setRotation(Phaser.Math.Angle.Between(pt.x, pt.y, next.x, next.y) - Math.PI / 2);
        },
        onComplete: () => {
          d.destroy();
          if (i === 3) onHit?.();
        },
      });
    }
    this.scene.time.delayedCall(300 + N * 18, () => {
      const e = this.scene.add.particles(tx, ty, 'drop', {
        speed: { min: 150, max: 380 }, angle: { min: 200, max: 340 }, gravityY: 1400,
        scale: { start: 0.5, end: 0.1 }, lifespan: 500, emitting: false,
      }).setDepth(61);
      e.explode(10);
      this.scene.time.delayedCall(600, () => e.destroy());
    });
  }

  /** Estende la scala fino a (tx,ty); resolve quando è in posizione. */
  extendLadder(tx: number, ty: number): Promise<void> {
    sfx.ladder();
    const angle = Phaser.Math.Angle.Between(this.ladder.x, this.ladder.y, tx, ty);
    const len = Phaser.Math.Distance.Between(this.ladder.x, this.ladder.y, tx, ty);
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this.ladder, rotation: angle, duration: 380, ease: 'Sine.easeInOut',
        onComplete: () => {
          this.scene.tweens.add({ targets: this.ladder, width: len, duration: 560, ease: 'Sine.easeOut', onComplete: () => resolve() });
        },
      });
    });
  }

  retractLadder(): void {
    this.scene.tweens.add({
      targets: this.ladder, width: Truck.LADDER_REST, duration: 450, ease: 'Sine.easeIn',
      onComplete: () => this.scene.tweens.add({ targets: this.ladder, rotation: 0, duration: 300 }),
    });
  }
}
