import Phaser from 'phaser';
import { BODY, HEAD } from './art';
import { petById, PET_HIT, SPOTS, type PetId, type SpotId, type ProblemId } from './logic';
import { sfx } from './sfx';

/** Elementi di scena condivisi: ambulatorio a piani, giardino della clinica, cucciolo animato. */

export const hex = (c: string): number => parseInt(c.slice(1), 16);

/** Linea tra parete e pavimento dell'ambulatorio. */
export const FLOOR_Y = 640;

const slideIn = (scene: Phaser.Scene, list: { x: number }[], dx: number): void => {
  for (const o of list) {
    const x = o.x;
    o.x += dx;
    scene.tweens.add({ targets: o, x, duration: 1400, ease: 'Cubic.easeOut' });
  }
};

/**
 * Ambulatorio 2.5D: parete crema con zoccolo verde acqua, finestra sul giardino (piano lontano, con foschia),
 * mensola, quadretto e lampada (piano della parete), lettino (piano medio), piante sfocate in primo piano.
 * Parallasse all'ingresso. `tableX` sposta il lettino (nel menu sta a destra).
 */
export function drawClinic(scene: Phaser.Scene, opts: { tableX?: number; tableY?: number; tray?: boolean } = {}): void {
  const tx = opts.tableX ?? 960, ty = opts.tableY ?? 770;
  const wall = scene.add.graphics().setDepth(0);
  wall.fillGradientStyle(0xfffcf4, 0xfffcf4, 0xf6e8cc, 0xf6e8cc, 1).fillRect(-2000, -1600, 5920, 1600 + FLOOR_Y);
  // carta da parati a pois leggeri
  wall.fillStyle(0x4cc3a5, 0.1);
  for (let y = -300; y < FLOOR_Y - 140; y += 90) for (let x = -400 + ((y / 90) % 2) * 45; x < 2400; x += 90) wall.fillCircle(x, y, 9);
  // zoccolo verde acqua con listello
  wall.fillGradientStyle(0x7ddcc3, 0x7ddcc3, 0x3fb497, 0x3fb497, 1).fillRect(-2000, FLOOR_Y - 150, 5920, 150);
  wall.fillStyle(0xffffff, 1).fillRect(-2000, FLOOR_Y - 162, 5920, 16);
  wall.fillStyle(0x2a8f78, 0.35).fillRect(-2000, FLOOR_Y - 146, 5920, 6);
  // pavimento a piastrelle (luce dall'alto: più chiaro vicino alla parete)
  const floor = scene.add.graphics().setDepth(0.2);
  floor.fillGradientStyle(0xe9f6f1, 0xe9f6f1, 0xbfe3d8, 0xbfe3d8, 1).fillRect(-2000, FLOOR_Y, 5920, 2000);
  floor.lineStyle(4, 0xa9d6c8, 0.7);
  for (let k = -20; k <= 20; k++) floor.lineBetween(960 + k * 110, FLOOR_Y, 960 + k * 260, FLOOR_Y + 900);
  for (let y = FLOOR_Y + 40, h = 40; y < 1900; h *= 1.35, y += h) floor.lineBetween(-2000, y, 3920, y);
  floor.fillStyle(0x1d2440, 0.12).fillRect(-2000, FLOOR_Y, 5920, 12);

  const far = [scene.add.image(960, 330, 'cu_view').setDepth(1)];
  const wallProps = [
    scene.add.image(960, 330, 'cu_window').setDepth(1.5),
    scene.add.image(590, 300, 'cu_curtain').setOrigin(0.5, 0.5).setDepth(1.6),
    scene.add.image(1330, 300, 'cu_curtain').setOrigin(0.5, 0.5).setFlipX(true).setDepth(1.6),
    scene.add.image(260, 300, 'cu_shelf').setDepth(1.5),
    scene.add.image(1690, 300, 'cu_poster').setDepth(1.5).setScale(0.9),
  ];
  const lamp = scene.add.image(1500, -60, 'cu_lamp').setOrigin(0.5, 0).setDepth(1.7);
  const glow = scene.add.image(1500, 220, 'glow').setScale(2.4, 1.6).setTint(0xfff1b0).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(1.8);
  scene.tweens.add({ targets: glow, alpha: 0.32, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  // sole che entra dalla finestra
  const sunbeam = scene.add.graphics().setDepth(0.3).setBlendMode(Phaser.BlendModes.ADD);
  sunbeam.fillStyle(0xfff3c0, 0.08).beginPath().moveTo(640, 560).lineTo(1300, 560).lineTo(1500, 1080).lineTo(760, 1080).closePath().fillPath();

  const mid = [scene.add.image(tx, ty, 'cu_table').setOrigin(0.5, 40 / 330).setDepth(4)];
  const fg = [
    scene.add.image(-110, 1150, 'cu_fg_plant').setOrigin(0.5, 1).setDepth(800).setScale(1.05),
    scene.add.image(2040, 1180, 'cu_fg_plant').setOrigin(0.5, 1).setDepth(800).setFlipX(true).setScale(0.9),
  ];
  slideIn(scene, far, 30);
  slideIn(scene, [...wallProps, lamp, glow], 60);
  slideIn(scene, mid, 120);
  slideIn(scene, fg, 240);
}

/**
 * Giardino della clinica 2.5D: cielo, sole, colline nella foschia (lontano), alberi, staccionata e clinica (medio),
 * prato con fiori, erba alta sfocata in primo piano.
 */
export function drawGarden(scene: Phaser.Scene): void {
  const sky = scene.add.graphics().setDepth(0);
  sky.fillGradientStyle(0x6cc4ff, 0x6cc4ff, 0xc9ecff, 0xc9ecff, 1).fillRect(-2000, -1600, 5920, 2160);
  const sun = scene.add.image(1640, 140, 'sun').setDepth(0.5).setScale(0.9);
  scene.tweens.add({ targets: sun, scale: 0.95, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  const clouds = [scene.add.image(500, 150, 'cloud').setAlpha(0.95).setScale(0.8).setDepth(0.6), scene.add.image(1180, 90, 'cloud').setAlpha(0.85).setScale(0.6).setDepth(0.6)];
  clouds.forEach((c, i) => scene.tweens.add({ targets: c, x: c.x + (i ? -70 : 70), duration: 10000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }));
  const far = [scene.add.image(960, 560, 'cu_hills').setOrigin(0.5, 1).setDepth(1)];
  const grass = scene.add.graphics().setDepth(2);
  grass.fillGradientStyle(0x9be08a, 0x9be08a, 0x5fbf5a, 0x5fbf5a, 1).fillRect(-2000, 520, 5920, 2000);
  grass.fillStyle(0xffffff, 0.12);
  for (let i = 0; i < 9; i++) grass.fillEllipse(960 + (i - 4) * 420, 600 + (i % 3) * 170, 360, 46);
  const mid = [
    scene.add.image(1780, 560, 'cu_tree').setOrigin(0.5, 1).setDepth(3).setScale(0.95),
    scene.add.image(1080, 556, 'cu_tree').setOrigin(0.5, 1).setDepth(2.5).setScale(0.6),
    scene.add.image(640, 540, 'cu_fence').setOrigin(0.5, 1).setDepth(2.6),
    scene.add.image(1280, 540, 'cu_fence').setOrigin(0.5, 1).setDepth(2.6),
    scene.add.image(60, 590, 'cu_clinic').setOrigin(0.5, 1).setDepth(3).setScale(0.9),
    scene.add.image(1500, 580, 'cu_bush').setOrigin(0.5, 1).setDepth(3.1).setScale(0.8),
  ];
  const fl = ['cu_flower_a', 'cu_flower_b', 'cu_flower_c'];
  for (let i = 0; i < 22; i++) {
    const x = 120 + ((i * 397) % 1700), y = 700 + ((i * 131) % 330);
    if (Math.abs(y - 800) < 40 && Math.abs(x - 960) < 300) continue;
    const fo = scene.add.image(x, y, fl[i % 3]).setOrigin(0.5, 1).setDepth(4 + y / 1000).setScale(0.7 + (i % 4) * 0.12);
    scene.tweens.add({ targets: fo, scaleX: fo.scaleX * 0.92, duration: 1400 + (i % 5) * 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
  const fg = [
    scene.add.image(-60, 1110, 'cu_fg_grass').setOrigin(0.5, 1).setDepth(800).setScale(1.2),
    scene.add.image(1990, 1120, 'cu_fg_grass').setOrigin(0.5, 1).setDepth(800).setFlipX(true),
  ];
  slideIn(scene, far, 30);
  slideIn(scene, mid, 80);
  slideIn(scene, fg, 240);
}

// =====================================================================
// Cucciolo animato
// =====================================================================

type Eyes = 'open' | 'closed' | 'happy' | 'sleepy';
type Mouth = 'smile' | 'open' | 'o' | 'wavy';
const EYE_KEY: Record<Eyes, string> = { open: 'cu_eye', closed: 'cu_eye_closed', happy: 'cu_eye_happy', sleepy: 'cu_eye_sleepy' };
const HOP_MS = 560;
const MOUTH_KEY: Record<Mouth, string> = { smile: 'cu_mouth_smile', open: 'cu_mouth_open', o: 'cu_mouth_o', wavy: 'cu_mouth_wavy' };

/**
 * Cucciolo seduto, costruito a pezzi (coda, corpo, zampette, testa con occhi e bocca) in un Container
 * con l'origine ai piedi. Si anima con scala e posizione (niente rotazioni di oggetti grandi):
 * saltelli, schiacciamenti, coda che scodinzola, occhi che sbattono. I guai si vedono sul cucciolo.
 */
export class PetView {
  readonly c: Phaser.GameObjects.Container;
  readonly id: PetId;
  readonly head: Phaser.GameObjects.Container;
  private eyes: Phaser.GameObjects.Image[];
  private mouth: Phaser.GameObjects.Image;
  private tail: Phaser.GameObjects.Image;
  private shadow: Phaser.GameObjects.Image;
  private eyeState: Eyes = 'open';
  private mouthState: Mouth = 'smile';
  private blinkTimer: Phaser.Time.TimerEvent;
  private tailTween?: Phaser.Tweens.Tween;
  private idle?: Phaser.Tweens.Tween;
  /** strati dei guai e delle cure (per chiave) */
  private layers = new Map<string, Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform & Phaser.GameObjects.Components.Alpha & Phaser.GameObjects.Components.Visible>();
  private fx: Phaser.Time.TimerEvent[] = [];
  private shiverTween?: Phaser.Tweens.Tween;
  private baseX: number;
  busy = false;
  private partying = false;
  private hopState?: { t: number; h: number; y0: number; onLand?: () => void; landed: boolean };

  constructor(private scene: Phaser.Scene, id: PetId, x: number, y: number, readonly s = 1, opts: { depth?: number } = {}) {
    this.id = id;
    this.baseX = x;
    const sc = scene;
    this.shadow = sc.add.image(0, 4, 'shadow').setScale(2.2, 0.55).setAlpha(0.75);
    const bushy = petById(id).tail === 'bushy';
    this.tail = sc.add.image(bushy ? 150 : 118, bushy ? -70 : -86, `cu_${id}_tail`).setOrigin(0.15, 0.85);
    const body = sc.add.image(0, 0, `cu_${id}_body`).setOrigin(0.5, BODY.ground / BODY.h);
    const pawL = sc.add.image(SPOTS.pawL.x, SPOTS.pawL.y, `cu_${id}_paw`);
    const pawR = sc.add.image(SPOTS.pawR.x, SPOTS.pawR.y, `cu_${id}_paw`).setFlipX(true);
    const headImg = sc.add.image(0, 0, `cu_${id}_head`).setOrigin(HEAD.cx / HEAD.w, HEAD.cy / HEAD.h);
    this.eyes = [-58, 58].map((dx) => sc.add.image(dx, -10, 'cu_eye'));
    this.mouth = sc.add.image(0, SPOTS.mouth.y + 390, 'cu_mouth_smile');
    this.head = sc.add.container(0, -390, [headImg, ...this.eyes, this.mouth]);
    this.c = sc.add.container(x, y, [this.shadow, this.tail, body, pawL, pawR, this.head]).setScale(s).setDepth(opts.depth ?? 40);
    this.blinkTimer = sc.time.addEvent({ delay: 2600, loop: true, callback: () => this.blink() });
    this.wag(false);
    this.breathe();
    sc.events.on('update', this.tickHop, this);
    sc.events.once('shutdown', () => { this.destroyFx(); sc.events.off('update', this.tickHop, this); });
  }

  // ------------------------------------------------------------- faccia
  /** Faccia a riposo: assonnata o infreddolita finché quei guai non sono curati. */
  restFace(): void {
    this.setEyes(this.active.includes('sleepy') ? 'sleepy' : 'open');
    this.setMouth(this.active.includes('cold') ? 'wavy' : 'smile');
  }

  setEyes(e: Eyes): void { this.faceVer++; this.eyeState = e; this.eyes.forEach((o) => o.setTexture(EYE_KEY[e])); }
  setMouth(m: Mouth): void { this.faceVer++; this.mouthState = m; this.mouth.setTexture(MOUTH_KEY[m]); }
  /** cresce a ogni cambio di espressione: una risatina torna alla faccia di prima solo se nel frattempo nessuno l'ha cambiata */
  private faceVer = 0;

  private blink(): void {
    if (this.eyeState !== 'open') return;
    this.eyes.forEach((o) => o.setTexture('cu_eye_closed'));
    this.scene.time.delayedCall(140, () => { if (this.eyeState === 'open') this.eyes.forEach((o) => o.setTexture('cu_eye')); });
  }

  /** Coda che scodinzola (piccola: si può ruotare). */
  wag(fast: boolean): void {
    this.tailTween?.stop();
    this.tail.setAngle(-8);
    this.tailTween = this.scene.tweens.add({ targets: this.tail, angle: 16, duration: fast ? 110 : 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  private breathe(): void {
    this.idle?.stop();
    this.head.y = -390;
    this.idle = this.scene.tweens.add({ targets: this.head, y: -384, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  // ------------------------------------------------------------- gesti
  /**
   * Saltello sul posto con schiacciamento all'atterraggio. Calcolato a ogni fotogramma (niente catene di tween):
   * un nuovo saltello può partire in qualsiasi momento, anche dal richiamo dell'atterraggio, senza perdere richiami.
   */
  hop(height = 70, onLand?: () => void): void {
    const y0 = this.hopState ? this.hopState.y0 : this.c.y;
    this.hopState = { t: 0, h: height, y0, onLand, landed: false };
    this.scene.tweens.add({ targets: this.shadow, scaleX: 1.6, alpha: 0.4, duration: 280, yoyo: true, delay: 90 });
  }

  private tickHop(_t: number, dt: number): void {
    const h = this.hopState;
    if (!h) return;
    h.t += Math.min(dt, 100);
    const k = h.t / HOP_MS, s = this.s;
    const lerp = (a: number, b: number, u: number) => a + (b - a) * Math.max(0, Math.min(1, u));
    let y = h.y0, sx = s, sy = s;
    if (k < 0.16) { const u = k / 0.16; sx = lerp(s, s * 1.08, u); sy = lerp(s, s * 0.88, u); }
    else if (k < 0.52) { const u = (k - 0.16) / 0.36, e = 1 - (1 - u) * (1 - u); y = h.y0 - h.h * s * e; sx = lerp(s * 1.08, s * 0.94, u * 2); sy = lerp(s * 0.88, s * 1.08, u * 2); }
    else if (k < 0.86) { const u = (k - 0.52) / 0.34; y = h.y0 - h.h * s * (1 - u * u); sx = lerp(s * 0.94, s, u); sy = lerp(s * 1.08, s, u); }
    else { const u = (k - 0.86) / 0.14, w = Math.sin(Math.PI * Math.min(1, u)); sx = s * (1 + 0.06 * w); sy = s * (1 - 0.1 * w); }
    this.c.setPosition(this.c.x, y).setScale(sx, sy);
    if (!h.landed && k >= 0.86) {
      h.landed = true;
      h.onLand?.();
      if (this.hopState !== h) return;
    }
    if (k >= 1) { this.c.setScale(s).setY(h.y0); this.hopState = undefined; }
  }

  /** Il cucciolo fa le feste: tre saltelli, coda velocissima, occhi felici, bocca aperta. */
  party(): void {
    this.partying = true;
    this.stopProblemFx();
    this.setEyes('happy');
    this.setMouth('open');
    this.wag(true);
    sfx.voice(this.id);
    this.hop(110, () => this.hop(90, () => this.hop(120)));
  }

  /** Testa che dice "no" (strumento sbagliato), senza ruotare: piccolo spostamento a destra e sinistra. */
  shakeNo(): void {
    this.scene.tweens.add({ targets: this.head, x: 16, duration: 70, yoyo: true, repeat: 2, ease: 'Sine.easeInOut', onComplete: () => { this.head.x = 0; } });
  }

  /** Coccola: occhi felici, saltello, voce. */
  giggle(): void {
    if (this.busy) return;
    this.setEyes('happy');
    this.setMouth('open');
    const ver = this.faceVer;
    sfx.voice(this.id);
    this.hop(60);
    this.scene.time.delayedCall(700, () => { if (ver === this.faceVer && !this.partying) this.restFace(); });
  }

  /** Arriva saltellando da (fromX) fino al suo posto. */
  enter(fromX: number, onDone?: () => void): void {
    const x = this.c.x;
    this.c.x = fromX;
    const hops = 4;
    let i = 0;
    const step = () => {
      if (i++ >= hops) { onDone?.(); return; }
      sfx.hop();
      this.hop(80, step);
      this.scene.tweens.add({ targets: this.c, x: fromX + ((x - fromX) * i) / hops, duration: 380, ease: 'Sine.easeInOut' });
    };
    step();
  }

  /** Esce saltellando verso destra (o sinistra). */
  leave(toX: number, onDone?: () => void): void {
    this.hop(80, () => this.hop(80));
    this.scene.tweens.add({ targets: this.c, x: toX, duration: 900, ease: 'Quad.easeIn', onComplete: () => onDone?.() });
  }

  // ------------------------------------------------------------- geometria
  /** Punto di cura in coordinate di scena. */
  spot(id: SpotId): { x: number; y: number } {
    const s = SPOTS[id];
    return { x: this.c.x + s.x * this.c.scaleX, y: this.c.y + s.y * this.c.scaleY };
  }

  /** Da coordinate di scena a coordinate del cucciolo (scala 1). */
  toLocal(x: number, y: number): { x: number; y: number } {
    return { x: (x - this.c.x) / this.s, y: (y - this.c.y) / this.s };
  }

  hit(x: number, y: number): boolean {
    const l = this.toLocal(x, y);
    return ((l.x - PET_HIT.x) / PET_HIT.rx) ** 2 + ((l.y - PET_HIT.y) / PET_HIT.ry) ** 2 <= 1;
  }

  // ------------------------------------------------------------- guai e cure
  private layer<T extends Phaser.GameObjects.Image>(key: string, make: () => T, onHead = false): T {
    const old = this.layers.get(key);
    if (old) return old as unknown as T;
    const o = make();
    if (onHead) this.head.add(o);
    else this.c.addAt(o, this.c.getIndex(this.head));
    this.layers.set(key, o);
    return o;
  }

  private drop(key: string, fade = 250): void {
    const o = this.layers.get(key);
    if (!o) return;
    this.layers.delete(key);
    this.scene.tweens.add({ targets: o, alpha: 0, duration: fade, onComplete: () => o.destroy() });
  }

  /** Mostra un guaio (con le sue piccole animazioni da fermo). */
  showProblem(id: ProblemId): void {
    const sc = this.scene;
    const pop = (o: Phaser.GameObjects.Image, sx = 1, sy = sx) => { o.setScale(0); sc.tweens.add({ targets: o, scaleX: sx, scaleY: sy, duration: 320, ease: 'Back.easeOut' }); };
    switch (id) {
      case 'dirty': {
        const m = this.layer('mud', () => sc.add.image(SPOTS.pawL.x, SPOTS.pawL.y - 8, 'cu_mud'));
        pop(m, 1.1);
        const m2 = this.layer('mud2', () => sc.add.image(SPOTS.pawL.x + 6, SPOTS.pawL.y - 120, 'cu_mud'));
        pop(m2, 0.55);
        break;
      }
      case 'thorn': {
        const t = this.layer('thorn', () => sc.add.image(SPOTS.pawR.x + 6, SPOTS.pawR.y - 36, 'cu_thorn').setOrigin(0.5, 0.9));
        pop(t, 1.35);
        this.fx.push(sc.time.addEvent({ delay: 2400, loop: true, callback: () => { if (!this.busy) sc.tweens.add({ targets: t, scaleY: 1.5, duration: 120, yoyo: true }); } }));
        break;
      }
      case 'hungry': {
        const b = this.layer('thought', () => sc.add.image(270, -580, 'cu_thought'));
        const ic = this.layer('thoughtIcon', () => sc.add.image(280, -596, 'cu_tool_bottle').setScale(0.66));
        pop(b, 1.2);
        pop(ic, 0.66);
        sc.tweens.add({ targets: [b, ic], y: '-=10', duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.fx.push(sc.time.addEvent({ delay: 3300, loop: true, callback: () => { if (!this.busy) { sfx.rumble(); this.squish(); } } }));
        break;
      }
      case 'sleepy': {
        this.setEyes('sleepy');
        this.fx.push(sc.time.addEvent({ delay: 1300, loop: true, callback: () => { if (!this.busy) this.zzz(); } }));
        this.fx.push(sc.time.addEvent({ delay: 4200, loop: true, callback: () => { if (!this.busy) this.yawn(); } }));
        break;
      }
      case 'sneezy': {
        const n = this.layer('rednose', () => sc.add.image(0, 30, 'cu_rednose').setBlendMode(Phaser.BlendModes.NORMAL), true);
        pop(n);
        sc.tweens.add({ targets: n, alpha: 0.55, duration: 700, yoyo: true, repeat: -1 });
        this.fx.push(sc.time.addEvent({ delay: 3800, loop: true, callback: () => { if (!this.busy) this.sneeze(false); } }));
        break;
      }
      case 'cold': {
        this.setMouth('wavy');
        this.shiverTween = sc.tweens.add({ targets: this.c, x: this.baseX + 5, duration: 45, yoyo: true, repeat: -1 });
        this.fx.push(sc.time.addEvent({ delay: 450, loop: true, callback: () => this.snowflake() }));
        this.fx.push(sc.time.addEvent({ delay: 2600, loop: true, callback: () => { if (!this.busy) sfx.shiver(); } }));
        break;
      }
    }
  }

  /** Fine dei piccoli effetti da fermo (prima della festa). */
  private stopProblemFx(): void {
    this.fx.forEach((e) => e.remove());
    this.fx = [];
    this.shiverTween?.stop();
    this.shiverTween = undefined;
    this.c.x = this.baseX;
  }

  private destroyFx(): void { this.stopProblemFx(); this.blinkTimer.remove(); }

  /** Ferma le animazioni di un guaio curato (le altre continuano). */
  private calm(id: ProblemId): void {
    this.active = this.active.filter((p) => p !== id);
    // ogni guaio ha i suoi timer: si tolgono tutti e si ricreano quelli dei guai rimasti
    this.fx.forEach((e) => e.remove());
    this.fx = [];
    if (id === 'cold') { this.shiverTween?.stop(); this.shiverTween = undefined; this.c.x = this.baseX; }
    for (const p of this.active) if (p !== id) this.reFx(p);
  }

  /** Guai ancora presenti (li imposta la scena). */
  active: ProblemId[] = [];

  private reFx(id: ProblemId): void {
    const sc = this.scene;
    if (id === 'thorn') { const t = this.layers.get('thorn'); if (t) this.fx.push(sc.time.addEvent({ delay: 2400, loop: true, callback: () => { if (!this.busy) sc.tweens.add({ targets: t, scaleY: 1.5, duration: 120, yoyo: true }); } })); }
    if (id === 'hungry') this.fx.push(sc.time.addEvent({ delay: 3300, loop: true, callback: () => { if (!this.busy) { sfx.rumble(); this.squish(); } } }));
    if (id === 'sleepy') {
      this.fx.push(sc.time.addEvent({ delay: 1300, loop: true, callback: () => { if (!this.busy) this.zzz(); } }));
      this.fx.push(sc.time.addEvent({ delay: 4200, loop: true, callback: () => { if (!this.busy) this.yawn(); } }));
    }
    if (id === 'sneezy') this.fx.push(sc.time.addEvent({ delay: 3800, loop: true, callback: () => { if (!this.busy) this.sneeze(false); } }));
    if (id === 'cold') {
      this.fx.push(sc.time.addEvent({ delay: 450, loop: true, callback: () => this.snowflake() }));
      this.fx.push(sc.time.addEvent({ delay: 2600, loop: true, callback: () => { if (!this.busy) sfx.shiver(); } }));
    }
  }

  private squish(): void {
    const s = this.s;
    this.scene.tweens.add({ targets: this.c, scaleX: s * 1.05, scaleY: s * 0.96, duration: 110, yoyo: true, repeat: 1 });
  }

  private zzz(): void {
    const p = { x: this.c.x + 120 * this.s, y: this.c.y - 560 * this.s };
    const z = this.scene.add.image(p.x, p.y, 'cu_zzz').setScale(0.3).setDepth(this.c.depth + 5).setAlpha(0);
    this.scene.tweens.add({ targets: z, x: p.x + 80, y: p.y - 140, scale: 0.8, alpha: { from: 1, to: 0 }, duration: 1600, ease: 'Sine.easeOut', onComplete: () => z.destroy() });
  }

  private yawn(): void {
    sfx.yawn();
    this.setMouth('o');
    this.scene.tweens.add({ targets: this.head, scaleY: 1.06, duration: 400, yoyo: true, hold: 300 });
    this.scene.time.delayedCall(1100, () => { if (this.mouthState === 'o') this.restFace(); });
  }

  /** Starnuto: la testa si carica e scatta in avanti; con il fazzoletto lo starnuto finisce lì dentro. */
  sneeze(big: boolean, onDone?: () => void): void {
    const sc = this.scene;
    this.setMouth('o');
    this.setEyes('closed');
    sc.tweens.chain({
      targets: this.head,
      tweens: [
        { scaleY: 1.08, scaleX: 0.96, y: -404, duration: big ? 500 : 280, ease: 'Sine.easeOut' },
        {
          scaleY: 0.9, scaleX: 1.06, y: -380, duration: 90, ease: 'Quad.easeIn',
          onComplete: () => {
            (big ? sfx.sneezeBig : sfx.sneeze)();
            const n = this.spot('nose');
            const e = sc.add.particles(n.x, n.y, 'dot', { speed: { min: 120, max: big ? 520 : 260 }, angle: { min: 200, max: 340 }, scale: { start: big ? 0.9 : 0.5, end: 0 }, lifespan: 600, gravityY: 300, tint: [0xffffff, 0xdff3ff], emitting: false }).setDepth(this.c.depth + 6);
            e.explode(big ? 22 : 8);
            sc.time.delayedCall(800, () => e.destroy());
          },
        },
        { scaleY: 1, scaleX: 1, y: -390, duration: 260, ease: 'Back.easeOut' },
      ],
      onComplete: () => { this.restFace(); onDone?.(); },
    });
  }

  private snowflake(): void {
    const x = this.c.x + Phaser.Math.Between(-260, 260) * this.s, y = this.c.y - Phaser.Math.Between(520, 700) * this.s;
    const f = this.scene.add.image(x, y, 'cu_snow').setScale((0.7 + Math.random() * 0.6) * Math.max(0.6, this.s)).setAlpha(0.95).setDepth(this.c.depth + 4);
    this.scene.tweens.add({ targets: f, y: y + 300, x: x + Phaser.Math.Between(-60, 60), alpha: 0, duration: 2200, ease: 'Sine.easeIn', onComplete: () => f.destroy() });
  }

  // ------------------------------------------------------------- cure (animazioni; la scena gestisce lo strumento)
  /** Fango che si scioglie un po' a ogni passata della spugna (k da 0 a 1). */
  cleanMud(k: number): void {
    for (const key of ['mud', 'mud2']) this.layers.get(key)?.setAlpha(Math.max(0, 1 - k));
    if (k >= 1) { this.drop('mud', 120); this.drop('mud2', 120); this.calm('dirty'); }
  }

  /** La spina vola via; resta la piccola bua rosa (si cura con il cerotto). */
  pullThorn(): void {
    const t = this.layers.get('thorn');
    if (t) {
      this.layers.delete('thorn');
      this.scene.tweens.add({ targets: t, y: t.y - 160, x: t.x + 60, alpha: 0, duration: 500, ease: 'Quad.easeOut', onComplete: () => t.destroy() });
    }
    const o = this.layer('ouch', () => this.scene.add.image(SPOTS.pawR.x, SPOTS.pawR.y - 10, 'cu_ouch'));
    o.setAlpha(0);
    this.scene.tweens.add({ targets: o, alpha: 1, duration: 300 });
  }

  putPlaster(): void {
    this.drop('ouch', 150);
    const p = this.layer('plaster', () => this.scene.add.image(SPOTS.pawR.x, SPOTS.pawR.y - 8, 'cu_plaster').setScale(0.7));
    p.setScale(1.4).setAlpha(0);
    this.scene.tweens.add({ targets: p, scale: 0.7, alpha: 1, duration: 260, ease: 'Back.easeOut' });
    this.calm('thorn');
  }

  /** Beve dal biberon: bocca a "o", tre sorsi con la pancia che si gonfia un po'. */
  drink(onDone: () => void): void {
    this.drop('thought');
    this.drop('thoughtIcon');
    this.setMouth('o');
    this.setEyes('closed');
    let n = 0;
    const sip = () => {
      if (n++ >= 3) {
        sfx.yum();
        this.setEyes('happy');
        this.setMouth('open');
        this.calm('hungry');
        this.scene.time.delayedCall(500, () => { this.restFace(); onDone(); });
        return;
      }
      sfx.gulp();
      this.scene.tweens.add({ targets: this.c, scaleX: this.s * (1 + 0.025 * n), scaleY: this.s * (1 - 0.02 * n), duration: 160, yoyo: true, onComplete: () => this.scene.time.delayedCall(120, sip) });
    };
    sip();
  }

  /** Copertina: si addormenta un momento (Zzz e russatina), poi si sveglia riposato con una stiracchiata. */
  nap(onDone: () => void): void {
    const sc = this.scene;
    const b = this.layer('blanket', () => sc.add.image(0, -262, 'cu_blanket').setOrigin(0.5, 0.06));
    b.setScale(0.6, 0.2).setAlpha(0);
    sc.tweens.add({ targets: b, scaleX: 0.92, scaleY: 0.92, alpha: 1, duration: 380, ease: 'Back.easeOut' });
    this.stopProblemFx();
    this.setEyes('closed');
    this.setMouth('smile');
    this.wag(false);
    let k = 0;
    const tick = () => {
      if (k++ < 3) { this.zzz(); if (k === 2) sfx.snore(); sc.time.delayedCall(600, tick); return; }
      this.drop('blanket', 400);
      this.setEyes('open');
      this.setMouth('o');
      sfx.stretch();
      sc.tweens.add({ targets: this.c, scaleY: this.s * 1.1, scaleX: this.s * 0.95, duration: 360, yoyo: true, ease: 'Sine.easeInOut' });
      sc.time.delayedCall(800, () => {
        this.calm('sleepy');
        this.restFace();
        onDone();
      });
    };
    sc.time.delayedCall(450, tick);
  }

  /** Fazzoletto sul naso: un grande starnuto lì dentro, poi il naso torna normale. */
  blow(onDone: () => void): void {
    const t = this.layer('tissue', () => this.scene.add.image(0, 30, 'cu_tissue').setScale(0.8), true);
    t.setScale(0.3).setAlpha(0);
    this.scene.tweens.add({ targets: t, scale: 0.8, alpha: 1, duration: 200, ease: 'Back.easeOut' });
    this.scene.time.delayedCall(250, () => this.sneeze(true, () => {
      this.drop('rednose', 200);
      const tt = this.layers.get('tissue');
      if (tt) {
        this.layers.delete('tissue');
        this.scene.tweens.add({ targets: tt, y: tt.y - 120, x: 180, alpha: 0, scale: 0.4, duration: 500, ease: 'Quad.easeIn', onComplete: () => tt.destroy() });
      }
      this.calm('sneezy');
      onDone();
    }));
  }

  /** Sciarpa al collo: smette di tremare, arriva un bel calduccio. */
  wrapScarf(): void {
    const s = this.layer('scarf', () => this.scene.add.image(0, -270, 'cu_scarf').setOrigin(0.5, 0.2));
    s.setScale(1.3, 0.3).setAlpha(0);
    this.scene.tweens.add({ targets: s, scaleX: 1, scaleY: 1, alpha: 1, duration: 340, ease: 'Back.easeOut' });
    this.calm('cold');
    this.restFace();
  }
}
