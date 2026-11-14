import Phaser from 'phaser';

/**
 * Area di design fissa 1920×1080 sempre visibile; lo schermo reale (Scale.EXPAND) mostra
 * in più sfondo ai lati o sopra/sotto. La camera viene centrata sull'area di design.
 */
export const DESIGN_W = 1920;
export const DESIGN_H = 1080;

let uiSound: () => void = () => {};
export const setUiSound = (fn: () => void): void => { uiSound = fn; };

export interface View { left: number; top: number; right: number; bottom: number; }

export function view(scene: Phaser.Scene): View {
  const { width, height } = scene.scale;
  const dx = (width - DESIGN_W) / 2;
  const dy = (height - DESIGN_H) / 2;
  return { left: -dx, top: -dy, right: DESIGN_W + dx, bottom: DESIGN_H + dy };
}

/** Centra la camera e richiama onResize a ogni cambio dimensione (rotazione, banner). */
export function setupView(scene: Phaser.Scene, onResize?: (v: View) => void): void {
  const apply = () => {
    const v = view(scene);
    scene.cameras.main.setScroll(v.left, v.top);
    onResize?.(v);
  };
  apply();
  scene.scale.on('resize', apply);
  scene.events.once('shutdown', () => scene.scale.off('resize', apply));
}

type Corner = 'tl' | 'tr' | 'bl' | 'br';
/** Mantiene un oggetto ancorato a un angolo dello schermo reale. */
export function pin(scene: Phaser.Scene, obj: Phaser.GameObjects.Components.Transform, corner: Corner, dx: number, dy: number): void {
  const place = () => {
    const v = view(scene);
    obj.x = corner[1] === 'l' ? v.left + dx : v.right - dx;
    obj.y = corner[0] === 't' ? v.top + dy : v.bottom - dy;
  };
  place();
  scene.scale.on('resize', place);
  scene.events.once('shutdown', () => scene.scale.off('resize', place));
}

/** Pulsante grande con animazione di pressione e suono. Risponde al tocco (pointerdown) per immediatezza. */
export function button(scene: Phaser.Scene, x: number, y: number, key: string, onTap: () => void, scale = 1): Phaser.GameObjects.Image {
  const b = scene.add.image(x, y, key).setScale(scale).setDepth(1000);
  b.setInteractive({ useHandCursor: true });
  let busy = false;
  b.on('pointerdown', () => {
    if (busy) return;
    busy = true;
    uiSound();
    scene.tweens.add({
      targets: b, scale: scale * 0.86, duration: 70, yoyo: true, ease: 'Quad.easeOut',
      onComplete: () => { busy = false; onTap(); },
    });
  });
  return b;
}

/** Pulsazione "toccami" per il pulsante principale. */
export function pulse(scene: Phaser.Scene, obj: Phaser.GameObjects.Image, amount = 0.07): void {
  const s = obj.scale;
  scene.tweens.add({ targets: obj, scale: s * (1 + amount), duration: 650, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
}

/** Manina del tutorial: tocca ripetutamente un punto. Nessun testo da leggere. */
export class HintHand {
  private hand: Phaser.GameObjects.Image;
  private ring: Phaser.GameObjects.Arc;
  private tween?: Phaser.Tweens.TweenChain;

  constructor(private scene: Phaser.Scene) {
    this.ring = scene.add.circle(0, 0, 40).setStrokeStyle(8, 0xffffff, 0.9).setVisible(false).setDepth(2000);
    this.hand = scene.add.image(0, 0, 'hand').setOrigin(0.42, 0.04).setVisible(false).setDepth(2001);
  }

  get visible(): boolean { return this.hand.visible; }

  show(x: number, y: number): void {
    this.hide();
    this.hand.setPosition(x + 10, y + 30).setVisible(true).setAlpha(0);
    this.ring.setPosition(x, y);
    this.tween = this.scene.tweens.chain({
      targets: this.hand,
      loop: -1,
      tweens: [
        { alpha: 1, y: y + 30, duration: 200 },
        {
          y: y + 6, duration: 260, ease: 'Quad.easeIn',
          onComplete: () => {
            this.ring.setVisible(true).setScale(0.4).setAlpha(1);
            this.scene.tweens.add({ targets: this.ring, scale: 1.4, alpha: 0, duration: 450 });
          },
        },
        { y: y + 30, duration: 260, ease: 'Quad.easeOut' },
        { y: y + 30, duration: 400 },
      ],
    });
  }

  hide(): void {
    this.tween?.stop();
    this.tween = undefined;
    this.hand.setVisible(false);
    this.ring.setVisible(false);
  }
}

/** Esplosione di particelle colorate (feedback a ogni azione). */
export function burst(scene: Phaser.Scene, x: number, y: number, key: string, opts: {
  count?: number; tints?: number[]; speed?: [number, number]; scale?: [number, number]; life?: number; gravity?: number; depth?: number;
} = {}): void {
  const e = scene.add.particles(x, y, key, {
    speed: { min: opts.speed?.[0] ?? 200, max: opts.speed?.[1] ?? 500 },
    angle: { min: 0, max: 360 },
    scale: { start: opts.scale?.[0] ?? 0.8, end: opts.scale?.[1] ?? 0 },
    lifespan: opts.life ?? 700,
    gravityY: opts.gravity ?? 600,
    rotate: { min: 0, max: 360 },
    tint: opts.tints ?? [0xffffff],
    emitting: false,
  }).setDepth(opts.depth ?? 1500);
  e.explode(opts.count ?? 14);
  scene.time.delayedCall((opts.life ?? 700) + 100, () => e.destroy());
}
