import Phaser from 'phaser';
import { view } from '../../core/ui';
import { TF, WHEEL_PX } from './art';
import { colorHex, trackById, type TrackId } from './parts';
import { GROUND, rng, type Ground } from './track';

/** Elementi di scena condivisi: il truck componibile, l'arena a piani in parallasse, il terreno, l'officina. */

export const hex = (c: string): number => parseInt(c.slice(1), 16);

export interface Look { color: string; wheel: string; sticker: string }

/** Zona coperta dallo sfondo: più larga dell'area di design, per i telefoni allungati e i tablet. */
const BG = { x: -1100, w: 4120 };

const AX = TF.frontX - TF.cx;          // mezzo passo (unità della texture)
const AY = TF.axleY - TF.cy;           // assi sotto il centro della carrozzeria

/*
 * Niente rotazioni in Phaser: con Phaser 4 le immagini ruotate si tagliano a triangoli (app/README.md).
 * Le ruote girano cambiando fotogramma (6 fotogrammi da 10°: cerchi e tasselli si ripetono ogni 60°) e in pista
 * la carrozzeria si inclina scegliendo tra fotogrammi già inclinati, disegnati una volta su canvas 2D.
 */
export const WHEEL_STEP = 10;
export const WHEEL_FRAMES = 6;
/** Inclinazioni disponibili in pista: da -TILT_MAX a +TILT_MAX gradi, ogni TILT_STEP. */
export const TILT_MAX = 24;
export const TILT_STEP = 3;
const TILT_RES = 0.72;
const TILT_W = 500, TILT_H = 440;

function canvasOf(scene: Phaser.Scene, key: string): CanvasImageSource | null {
  if (!scene.textures.exists(key)) return null;
  return scene.textures.get(key).getSourceImage() as CanvasImageSource;
}

/** Fotogrammi della ruota (ruotata su canvas, una volta sola per tipo di ruota). */
export function wheelFrames(scene: Phaser.Scene, id: string): void {
  const src = canvasOf(scene, `mt_wheel_${id}`);
  if (!src) return;
  for (let k = 0; k < WHEEL_FRAMES; k++) {
    const key = `mt_wheel_${id}_${k}`;
    if (scene.textures.exists(key)) continue;
    const c = document.createElement('canvas');
    c.width = c.height = WHEEL_PX;
    const g = c.getContext('2d')!;
    g.translate(WHEEL_PX / 2, WHEEL_PX / 2);
    g.rotate((k * WHEEL_STEP * Math.PI) / 180);
    g.drawImage(src, -WHEEL_PX / 2, -WHEEL_PX / 2);
    scene.textures.addCanvas(key, c);
  }
}

let tiltLook = '';
/**
 * Carrozzeria completa (telaio, vernice del colore scelto, vetri e riflessi, adesivo) già inclinata, un fotogramma
 * ogni TILT_STEP gradi. Si rifà solo se il truck è cambiato. Va chiamata prima di creare il truck in pista.
 */
export function tiltFrames(scene: Phaser.Scene, look: Look): void {
  const sig = `${look.color}/${look.sticker}`;
  const n = (2 * TILT_MAX) / TILT_STEP + 1;
  if (sig === tiltLook && scene.textures.exists(`mt_tilt_${n - 1}`)) return;
  const body = canvasOf(scene, 'mt_body'), hi = canvasOf(scene, 'mt_body_hi'), ch = canvasOf(scene, 'mt_chassis');
  if (!body || !hi || !ch) return;
  // vernice: grigio × colore (come il tint di Phaser), poi la sagoma originale come maschera
  const paint = document.createElement('canvas');
  paint.width = TF.w; paint.height = TF.h;
  const p = paint.getContext('2d')!;
  p.drawImage(body, 0, 0);
  p.globalCompositeOperation = 'multiply';
  p.fillStyle = colorHex(look.color);
  p.fillRect(0, 0, TF.w, TF.h);
  p.globalCompositeOperation = 'destination-in';
  p.drawImage(body, 0, 0);
  const stk = look.sticker !== 'nessuno' ? canvasOf(scene, `mt_stk_${look.sticker}`) : null;
  for (let k = 0; k < n; k++) {
    const key = `mt_tilt_${k}`;
    if (scene.textures.exists(key)) scene.textures.remove(key);
    const c = document.createElement('canvas');
    c.width = Math.round(TILT_W * TILT_RES); c.height = Math.round(TILT_H * TILT_RES);
    const g = c.getContext('2d')!;
    g.translate(c.width / 2, c.height / 2);
    g.rotate(((-TILT_MAX + k * TILT_STEP) * Math.PI) / 180);
    g.scale(TILT_RES, TILT_RES);
    g.drawImage(ch, -TF.cx, -TF.cy);
    g.drawImage(paint, -TF.cx, -TF.cy);
    g.drawImage(hi, -TF.cx, -TF.cy);
    if (stk) g.drawImage(stk, TF.stkX - TF.cx - 170 * 0.41, TF.stkY - TF.cy - 100 * 0.41, 170 * 0.82, 100 * 0.82);
    scene.textures.addCanvas(key, c);
  }
  tiltLook = sig;
}

/**
 * Il monster truck: telaio, due ruote, carrozzeria colorata, riflessi e adesivo; in pista (`tilt`) la carrozzeria è
 * un'unica immagine scelta tra i fotogrammi inclinati. Niente Container e niente rotazioni: le immagini si
 * posizionano a mano a ogni `sync()`. (x, y) è il punto di contatto con il terreno, a metà tra le ruote.
 */
export class TruckView {
  readonly body: Phaser.GameObjects.Image;
  private hi: Phaser.GameObjects.Image;
  private chassis: Phaser.GameObjects.Image;
  readonly rear: Phaser.GameObjects.Image;
  readonly front: Phaser.GameObjects.Image;
  private shineR: Phaser.GameObjects.Image;
  private shineF: Phaser.GameObjects.Image;
  readonly sticker: Phaser.GameObjects.Image;
  private comp?: Phaser.GameObjects.Image;
  private shadow: Phaser.GameObjects.Image;
  x: number;
  y: number;
  /** inclinazione in gradi (positiva = muso giù): sposta le ruote; la carrozzeria si inclina solo in pista */
  angle = 0;
  /** spostamento della carrozzeria sulle molle (positivo = giù) */
  susp = 0;
  private suspV = 0;
  /** schiacciamento (1 = normale) */
  squash = 1;
  /** rotazione delle ruote (gradi) */
  spin = 0;
  /** scostamento delle ruote dalla posizione di riposo (le molle seguono i dossi) */
  rearDy = 0;
  frontDy = 0;
  /** gomma a terra: schiacciamento verticale della ruota dietro (1 = gonfia) */
  rearFlat = 1;
  /** y del terreno sotto il truck (per l'ombra); null = niente ombra */
  floorY: number | null = null;
  look: Look;
  private frontVisible = true;

  constructor(private scene: Phaser.Scene, look: Look, x: number, y: number, readonly scale = 1, depth = 60, readonly tilt = false) {
    this.x = x;
    this.y = y;
    this.look = { ...look };
    wheelFrames(scene, look.wheel);
    if (tilt) tiltFrames(scene, this.look);
    this.shadow = scene.add.image(x, y, 'shadow').setDepth(depth - 2).setAlpha(0.8);
    this.chassis = scene.add.image(x, y, 'mt_chassis').setDepth(depth - 1);
    // in officina le ruote stanno sotto i passaruota; in pista davanti alla carrozzeria (un'immagine sola)
    const wd = tilt ? depth + 3 : depth;
    this.rear = scene.add.image(x, y, `mt_wheel_${look.wheel}_0`).setDepth(wd);
    this.front = scene.add.image(x, y, `mt_wheel_${look.wheel}_0`).setDepth(wd);
    this.shineR = scene.add.image(x, y, 'mt_wheel_shine').setDepth(wd + 0.1);
    this.shineF = scene.add.image(x, y, 'mt_wheel_shine').setDepth(wd + 0.1);
    this.body = scene.add.image(x, y, 'mt_body').setDepth(depth + 1);
    this.hi = scene.add.image(x, y, 'mt_body_hi').setDepth(depth + 2);
    this.sticker = scene.add.image(x, y, 'mt_stk_stella').setDepth(depth + 1.5);
    if (tilt) {
      this.comp = scene.add.image(x, y, 'mt_tilt_0').setDepth(depth + 1);
      [this.body, this.hi, this.chassis, this.sticker].forEach((o) => o.setVisible(false));
    }
    this.setLook(look);
    this.sync(0);
  }

  setLook(look: Partial<Look>): void {
    this.look = { ...this.look, ...look };
    wheelFrames(this.scene, this.look.wheel);
    this.body.setTint(hex(colorHex(this.look.color)));
    const has = this.look.sticker !== 'nessuno' && this.scene.textures.exists(`mt_stk_${this.look.sticker}`);
    if (has) this.sticker.setTexture(`mt_stk_${this.look.sticker}`);
    this.sticker.setVisible(has && !this.tilt && this.body.visible);
  }

  /** Mostra o nasconde la ruota davanti (guasto "ruota smontata"). */
  setFrontVisible(v: boolean): void {
    this.frontVisible = v;
    this.front.setVisible(v);
    this.shineF.setVisible(v);
  }

  /** Centri delle ruote a riposo, per l'inclinazione attuale. */
  wheelRest(): { rx: number; ry: number; fx: number; fy: number } {
    const s = this.scale, a = Phaser.Math.DegToRad(this.angle);
    const c = Math.cos(a), sn = Math.sin(a);
    // centro degli assi: sopra il punto di contatto di un raggio di ruota
    const mx = this.x + sn * TF.R * s, my = this.y - c * TF.R * s;
    return { rx: mx - c * AX * s, ry: my - sn * AX * s, fx: mx + c * AX * s, fy: my + sn * AX * s };
  }

  /** Molla della carrozzeria: un colpo verso il basso (atterraggi, salti in officina). */
  kick(v: number): void { this.suspV += v; }

  /** Inclinazione davvero disegnata (in pista: quella del fotogramma più vicino; altrove 0). */
  private shownAngle(): number {
    if (!this.tilt) return 0;
    const a = Phaser.Math.Clamp(this.angle, -TILT_MAX, TILT_MAX);
    return Math.round(a / TILT_STEP) * TILT_STEP;
  }

  sync(dt: number): void {
    const s = this.scale;
    // molla smorzata della carrozzeria
    if (dt > 0) {
      this.suspV += (-120 * this.susp - 11 * this.suspV) * dt;
      this.susp += this.suspV * dt;
      this.susp = Phaser.Math.Clamp(this.susp, -40, 40);
    }
    const w = this.wheelRest();
    const ry = w.ry + this.rearDy, fy = w.fy + this.frontDy;
    const flatDrop = (1 - this.rearFlat) * TF.R * s;
    const fr = ((Math.floor(this.spin / WHEEL_STEP) % WHEEL_FRAMES) + WHEEL_FRAMES) % WHEEL_FRAMES;
    const wkey = `mt_wheel_${this.look.wheel}_${fr}`;
    const rsx = s * (1 + (1 - this.rearFlat) * 0.25), rsy = s * this.rearFlat;
    this.rear.setTexture(wkey).setPosition(w.rx, ry + flatDrop * 0.5).setScale(rsx, rsy);
    this.shineR.setPosition(w.rx, ry + flatDrop * 0.5).setScale(rsx, rsy);
    this.front.setTexture(`mt_wheel_${this.look.wheel}_${(fr + 3) % WHEEL_FRAMES}`).setPosition(w.fx, fy).setScale(s);
    this.shineF.setPosition(w.fx, fy).setScale(s);
    // carrozzeria sopra gli assi (media delle due ruote), sulle molle
    const a = Phaser.Math.DegToRad(this.shownAngle());
    const c = Math.cos(a), sn = Math.sin(a);
    const mx = (w.rx + w.fx) / 2, my = (ry + flatDrop * 0.5 + fy) / 2 + this.susp * s;
    const bx = mx + sn * AY * s, by = my - c * AY * s;
    const sx = s * (2 - this.squash), sy = s * this.squash;
    if (this.comp) {
      const k = Math.round((this.shownAngle() + TILT_MAX) / TILT_STEP);
      this.comp.setTexture(`mt_tilt_${k}`).setPosition(bx, by).setScale(sx / TILT_RES, sy / TILT_RES);
    } else {
      this.body.setPosition(bx, by).setScale(sx, sy);
      this.hi.setPosition(bx, by).setScale(sx, sy);
      this.chassis.setPosition(bx, by - this.susp * s * 0.5).setScale(s);
      this.sticker.setPosition(bx + (TF.stkX - TF.cx) * sx, by + (TF.stkY - TF.cy) * sy).setScale(sx * 0.82, sy * 0.82);
    }
    this.bodyAt = { x: bx, y: by, a, sx, sy };
    if (this.floorY === null) this.shadow.setVisible(false);
    else {
      const h = Math.max(0, this.floorY - this.y);
      const k = Math.max(0.35, 1 - h / 500);
      this.shadow.setVisible(true).setPosition(this.x, this.floorY + 4).setScale(2.1 * s * k, 0.7 * s * k).setAlpha(0.75 * k);
    }
  }

  private bodyAt = { x: 0, y: 0, a: 0, sx: 1, sy: 1 };

  /** Punto della carrozzeria (coordinate della texture TF) in coordinate di scena. */
  bodyPoint(tx: number, ty: number): { x: number; y: number } {
    const { x, y, a, sx, sy } = this.bodyAt;
    const ox = (tx - TF.cx) * sx, oy = (ty - TF.cy) * sy;
    return { x: x + Math.cos(a) * ox - Math.sin(a) * oy, y: y + Math.sin(a) * ox + Math.cos(a) * oy };
  }

  setVisible(v: boolean): this {
    const parts = this.comp ? [this.comp] : [this.body, this.hi, this.chassis];
    [...parts, this.rear, this.shineR, this.shadow].forEach((o) => o.setVisible(v));
    this.front.setVisible(v && this.frontVisible);
    this.shineF.setVisible(v && this.frontVisible);
    if (!this.comp) this.sticker.setVisible(v && this.look.sticker !== 'nessuno');
    return this;
  }

  /** Il truck contiene il punto (tocchi). */
  hit(px: number, py: number, pad = 30): boolean {
    const s = this.scale;
    return Math.abs(px - this.x) < (TF.w / 2) * s + pad && py < this.y + pad && py > this.y - (TF.R + AY + TF.cy) * s - pad;
  }
}

// ---------------------------------------------------------------- arena a piani

const PROPS: Record<TrackId, Array<[string, number]>> = {
  arena: [['mt_cone', 0.8], ['mt_tires', 0.42], ['mt_barrel', 0.5]],
  dune: [['mt_cactus', 0.8], ['mt_rock', 0.7], ['mt_cactus', 0.6]],
  cantiere: [['mt_cone', 0.8], ['mt_barrel', 0.55], ['mt_tires', 0.42]],
  canyon: [['mt_rock', 0.8], ['mt_cactus', 0.65], ['mt_rock', 0.55]],
  notte: [['mt_post', 0.8], ['mt_cone', 0.8], ['mt_tires', 0.42]],
};

/**
 * Arena all'aperto: cielo, sole (o luna e stelle di notte), sfondo lontano nella foschia, tribune con il pubblico,
 * barriera a bordo pista e cespugli sfocati in primo piano. `update(dt, speed)` fa scorrere i piani a velocità diverse.
 * Pensata per i telefoni economici: pochi piani larghi (TileSprite), il resto immagini piccole.
 */
export class ArenaBg {
  private far: Phaser.GameObjects.TileSprite;
  private stands: Phaser.GameObjects.TileSprite;
  private fence: Phaser.GameObjects.TileSprite;
  private clouds: Phaser.GameObjects.Image[] = [];
  private fg: Phaser.GameObjects.Image[] = [];
  private floods: Phaser.GameObjects.Image[] = [];
  private cheering = 0;
  private standsY = 470;

  constructor(private scene: Phaser.Scene, readonly track: TrackId, opts: { fg?: boolean } = {}) {
    const t = trackById(track);
    const night = track === 'notte';
    scene.add.image(960, 540, `mt_sky_${track}`).setDisplaySize(BG.w + 400, 2600).setDepth(0);
    if (night) {
      scene.add.tileSprite(BG.x, -400, BG.w, 900, 'mt_nightsky').setOrigin(0).setDepth(1);
      scene.add.image(1500, 170, 'mt_moon').setDepth(2);
    } else {
      scene.add.image(1560, 150, 'sun').setScale(0.9).setDepth(2);
      for (let i = 0; i < 3; i++) this.clouds.push(scene.add.image(200 + i * 700, 90 + (i % 2) * 90, 'cloud').setScale(0.7 + (i % 2) * 0.3).setAlpha(0.9).setDepth(3));
    }
    this.far = scene.add.tileSprite(BG.x, 300, BG.w, 360, `mt_far_${track}`).setOrigin(0).setDepth(4);
    this.stands = scene.add.tileSprite(BG.x, this.standsY, BG.w, 300, 'mt_stands').setOrigin(0).setDepth(6);
    if (night) {
      this.stands.setTint(0x9aa0d0);
      this.far.setAlpha(0.95);
      for (let i = 0; i < 4; i++) {
        const x = i * 900;
        const g = scene.add.image(x, 330, 'glow').setScale(4, 3).setTint(0xfff3c4).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.35).setDepth(5);
        const p = scene.add.image(x, 520, 'mt_flood').setOrigin(0.5, 1).setScale(0.9).setDepth(5);
        this.floods.push(p, g);
      }
    }
    // foschia leggera sulle tribune: il pubblico resta dietro, stelle e truck si leggono meglio
    scene.add.rectangle(BG.x, this.standsY - 20, BG.w, 340, hex(t.sky[1]), night ? 0.18 : 0.32).setOrigin(0).setDepth(6.5);
    this.fence = scene.add.tileSprite(BG.x, 712, BG.w, 120, 'mt_fence').setOrigin(0).setDepth(7);
    if (opts.fg !== false) {
      for (let i = 0; i < 4; i++) {
        this.fg.push(scene.add.image(i * 820, 1110, 'mt_fg').setOrigin(0.5, 1).setScale(1.6, 1.1).setTint(hex(t.ground[2])).setAlpha(0.9).setDepth(900));
      }
    }
  }

  /** Il pubblico esulta: braccia alzate e un saltello delle tribune. */
  cheer(ms = 1500): void {
    this.cheering = ms / 1000;
    this.stands.setTexture('mt_stands_cheer');
    this.scene.tweens.killTweensOf(this.stands);
    this.stands.y = this.standsY;
    this.scene.tweens.add({ targets: this.stands, y: this.standsY - 14, duration: 140, yoyo: true, repeat: Math.max(1, Math.round(ms / 400)), ease: 'Sine.easeOut' });
  }

  update(dt: number, speed: number): void {
    const v = view(this.scene);
    this.far.tilePositionX += speed * 0.08 * dt;
    this.stands.tilePositionX += speed * 0.3 * dt;
    this.fence.tilePositionX += speed * 0.62 * dt;
    for (const c of this.clouds) {
      c.x -= (8 + speed * 0.03) * dt;
      if (c.x < v.left - 250) c.x = v.right + 250;
    }
    for (let i = 0; i < this.floods.length; i++) {
      const o = this.floods[i];
      o.x -= speed * 0.3 * dt;
      if (o.x < v.left - 300) o.x += 3600;
    }
    for (const f of this.fg) {
      f.x -= speed * 1.35 * dt;
      if (f.x < v.left - 400) f.x += 3280;
    }
    if (this.cheering > 0) {
      this.cheering -= dt;
      if (this.cheering <= 0) this.stands.setTexture('mt_stands');
    }
  }
}

/**
 * Terreno della pista: un poligono ridisegnato a ogni fotogramma (strato profondo, fascia, bordo chiaro con il
 * riflesso e sassolini), più gli oggetti decorativi a bordo pista che scorrono con il terreno.
 */
export class GroundView {
  private g: Phaser.GameObjects.Graphics;
  private props: Array<{ img: Phaser.GameObjects.Image; x: number }> = [];
  private cols: { deep: number; band: number; top: number; edge: number; light: number; dot: number };

  constructor(private scene: Phaser.Scene, private ground: Ground, track: TrackId, len: number, avoid: number[], depth = 20) {
    const t = trackById(track);
    this.cols = {
      deep: hex(t.ground[2]), band: hex(t.ground[1]), top: hex(t.ground[0]), edge: hex(t.edge),
      light: 0xffffff, dot: hex(t.ground[2]),
    };
    this.g = scene.add.graphics().setDepth(depth);
    // decorazioni a bordo pista, lontane da trampolini e scatoloni
    const r = rng(len + track.length * 97);
    const list = PROPS[track];
    for (let x = 900; x < len + 1600; x += 700 + Math.floor(r() * 500)) {
      if (avoid.some((a) => Math.abs(a - x) < 420)) continue;
      const [key, sc] = list[Math.floor(r() * list.length)];
      const img = scene.add.image(0, 0, key).setOrigin(0.5, 1).setScale(sc).setDepth(depth - 1);
      if (key === 'mt_post') img.setDepth(depth - 2);
      this.props.push({ img, x });
    }
  }

  /** Disegna il terreno visibile; `cam` è la x del mondo che sta sul bordo sinistro dell'area di design. */
  draw(cam: number): void {
    const v = view(this.scene);
    const g = this.g.clear();
    const step = 24;
    const x0 = Math.floor((v.left + cam) / step) * step - step, x1 = v.right + cam + step;
    const top: Phaser.Math.Vector2[] = [];
    for (let x = x0; x <= x1; x += step) top.push(new Phaser.Math.Vector2(x - cam, this.ground.at(x)));
    const bottom = v.bottom + 20;
    g.fillStyle(this.cols.deep, 1);
    g.fillPoints([...top, new Phaser.Math.Vector2(x1 - cam, bottom), new Phaser.Math.Vector2(x0 - cam, bottom)], true);
    const band = top.map((p) => new Phaser.Math.Vector2(p.x, p.y + 16));
    const band2 = top.map((p) => new Phaser.Math.Vector2(p.x, p.y + 90)).reverse();
    g.fillStyle(this.cols.band, 1).fillPoints([...band, ...band2], true);
    const band3 = top.map((p) => new Phaser.Math.Vector2(p.x, p.y + 40)).reverse();
    g.fillStyle(this.cols.top, 1).fillPoints([...band, ...band3], true);
    g.lineStyle(18, this.cols.edge, 1).strokePoints(top.map((p) => new Phaser.Math.Vector2(p.x, p.y + 6)));
    g.lineStyle(4, this.cols.light, 0.45).strokePoints(top.map((p) => new Phaser.Math.Vector2(p.x, p.y + 1)));
    // sassolini nel terreno (posizioni fisse nel mondo)
    g.fillStyle(this.cols.dot, 0.55);
    for (let x = Math.floor(x0 / 90) * 90; x < x1; x += 90) {
      const h = Math.sin(x * 12.9898) * 43758.5453;
      const f = h - Math.floor(h);
      const y = this.ground.at(x) + 60 + f * 120;
      g.fillEllipse(x - cam + f * 40, y, 14 + f * 18, 8 + f * 8);
    }
    for (const p of this.props) {
      const sx = p.x - cam;
      const vis = sx > v.left - 200 && sx < v.right + 200;
      p.img.setVisible(vis);
      if (vis) p.img.setPosition(sx, this.ground.at(p.x) + 14);
    }
  }
}

/** Arena ferma per il menu: terreno piano con la barriera, il pubblico e un trampolino. */
export function drawMenuGround(scene: Phaser.Scene, track: TrackId): void {
  const t = trackById(track);
  const g = scene.add.graphics().setDepth(20);
  const v = { left: -1100, right: 3020, bottom: 1800 };
  const prof = (x: number) => {
    const a = 1200, L = 280;
    if (x < a || x > a + L + 30) return GROUND;
    if (x <= a + L) return GROUND - (1.1 * (x - a) ** 2) / (2 * L);
    return GROUND - 154 * (1 - (x - a - L) / 30);
  };
  const pts: Phaser.Math.Vector2[] = [];
  for (let x = v.left; x <= v.right; x += 10) pts.push(new Phaser.Math.Vector2(x, prof(x)));
  g.fillStyle(hex(t.ground[2])).fillPoints([...pts, new Phaser.Math.Vector2(v.right, v.bottom), new Phaser.Math.Vector2(v.left, v.bottom)], true);
  const band = pts.map((p) => new Phaser.Math.Vector2(p.x, p.y + 16));
  g.fillStyle(hex(t.ground[1])).fillPoints([...band, ...pts.map((p) => new Phaser.Math.Vector2(p.x, p.y + 90)).reverse()], true);
  g.fillStyle(hex(t.ground[0])).fillPoints([...band, ...pts.map((p) => new Phaser.Math.Vector2(p.x, p.y + 40)).reverse()], true);
  g.lineStyle(18, hex(t.edge)).strokePoints(pts.map((p) => new Phaser.Math.Vector2(p.x, p.y + 6)));
  g.lineStyle(4, 0xffffff, 0.45).strokePoints(pts.map((p) => new Phaser.Math.Vector2(p.x, p.y + 1)));
}

// ---------------------------------------------------------------- officina

/** Officina: parete con il pannello degli attrezzi, porta aperta sull'arena, pavimento, lampade, ponte sollevatore. */
export function drawGarage(scene: Phaser.Scene): { liftY: number } {
  scene.add.rectangle(BG.x, -900, BG.w, 960, 0xefe0c2).setOrigin(0).setDepth(0);
  scene.add.tileSprite(BG.x, 0, BG.w, 700, 'mt_gwall').setOrigin(0).setDepth(1);
  scene.add.image(1420, 700, 'mt_gdoor').setOrigin(0.5, 1).setScale(1.05, 1).setDepth(2);
  scene.add.image(560, 300, 'mt_pegboard').setScale(1.05).setDepth(2);
  scene.add.image(960, 700, 'mt_gfloor').setOrigin(0.5, 0).setDisplaySize(BG.w, 420).setDepth(3);
  scene.add.rectangle(BG.x, 1118, BG.w, 900, 0x5a6068).setOrigin(0).setDepth(3);
  for (const [x, y] of [[760, 0], [1240, 0]]) {
    scene.add.image(x, y, 'mt_lamp').setOrigin(0.5, 0).setDepth(4);
    scene.add.image(x, y + 210, 'glow').setScale(3.4, 2.4).setTint(0xfff1c4).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.45).setDepth(4);
  }
  scene.add.image(330, 780, 'mt_tires').setOrigin(0.5, 1).setScale(0.85).setDepth(5);
  scene.add.image(1640, 760, 'mt_barrel').setOrigin(0.5, 1).setScale(0.8).setDepth(5);
  scene.add.image(1790, 790, 'mt_toolbox').setOrigin(0.5, 1).setScale(0.8).setDepth(5);
  const liftY = 790;
  scene.add.image(960, liftY + 20, 'mt_lift').setDepth(10);
  return { liftY: liftY - 12 };
}
