import type Phaser from 'phaser';

/**
 * Getto d'acqua del cannone: un flusso continuo disegnato lungo l'arco, non una fila di gocce.
 * Il getto esce dalla bocca, raggiunge il bersaglio, resta teso un istante e poi si stacca dal cannone.
 * È un nastro a tre strati (bordo blu, corpo azzurro, riflesso chiaro) che si allarga verso la punta,
 * con una leggera ondulazione e striature bianche che scorrono per dare il senso della corrente.
 */
const GROW_MS = 200;   // la punta arriva al bersaglio
const HOLD_MS = 250;   // getto pieno
const FADE_MS = 220;   // la coda si stacca dal cannone e raggiunge la punta
const SAMPLES = 20;
const HALF_WIDTH = 23; // semi-larghezza di riferimento (unità di design)

type Curve = Phaser.Curves.QuadraticBezier;

export function waterJet(scene: Phaser.Scene, curve: Curve, onHit?: () => void, depth = 60): void {
  const g = scene.add.graphics().setDepth(depth);
  const end = curve.getPoint(1);
  const splash = scene.add.particles(end.x, end.y, 'drop', {
    speed: { min: 140, max: 380 }, angle: { min: 195, max: 345 }, gravityY: 1500,
    scale: { start: 0.42, end: 0.08 }, alpha: { start: 0.95, end: 0.2 }, lifespan: 420, frequency: 20, quantity: 2, emitting: false,
  }).setDepth(depth + 1);
  const foam = scene.add.image(end.x, end.y, 'glow').setDepth(depth + 1).setTint(0xd8f2ff).setAlpha(0).setScale(0.55);
  const t0 = scene.time.now;
  let hit = false;
  let dead = false;

  const cleanup = () => {
    if (dead) return;
    dead = true;
    scene.events.off('update', draw);
    scene.events.off('shutdown', cleanup);
    g.destroy();
    foam.destroy();
    splash.stop();
    // le ultime gocce dello spruzzo finiscono di cadere
    scene.time.delayedCall(500, () => splash.destroy());
  };

  const draw = () => {
    const now = scene.time.now;
    const el = now - t0;
    const head = Math.sin(Math.min(1, el / GROW_MS) * Math.PI / 2);
    const tail = el <= GROW_MS + HOLD_MS ? 0 : Math.min(1, (el - GROW_MS - HOLD_MS) / FADE_MS) ** 1.4;
    if (!hit && el >= GROW_MS) {
      hit = true;
      onHit?.();
      splash.start();
      foam.setAlpha(0.75);
    }
    if (tail >= 1) { cleanup(); return; }
    if (hit) foam.setScale(0.5 + 0.12 * Math.sin(now * 0.05)).setAlpha(0.75 * (1 - tail));

    g.clear();
    const pts = sample(curve, tail, head, now);
    ribbon(g, pts, 1, 0, 0x1a6fbd, 1);
    ribbon(g, pts, 0.76, 0, 0x55c4ff, 1);
    ribbon(g, pts, 0.3, -0.34, 0xe6f8ff, 0.9);
    // striature che scorrono lungo la corrente
    g.lineStyle(4.5, 0xffffff, 0.62);
    for (let k = 0; k < 5; k++) {
      const ph = (now * 0.0042 + k / 5) % 1;
      const a = Math.floor(ph * (pts.length - 2));
      const b = Math.min(pts.length - 1, a + 2);
      const side = ((k % 3) - 1) * 0.36;
      g.lineBetween(pts[a].x + pts[a].nx * pts[a].w * side, pts[a].y + pts[a].ny * pts[a].w * side,
        pts[b].x + pts[b].nx * pts[b].w * side, pts[b].y + pts[b].ny * pts[b].w * side);
    }
    // punta schiumosa
    const tip = pts[pts.length - 1];
    g.fillStyle(0xffffff, 0.55).fillCircle(tip.x, tip.y, tip.w * 0.62);
  };

  scene.events.on('update', draw);
  scene.events.once('shutdown', cleanup);
  draw();
}

interface Pt { x: number; y: number; nx: number; ny: number; w: number; }

/** Punti del getto tra coda e punta: posizione, normale (verso l'alto) e semi-larghezza. */
export function sample(curve: Curve, tail: number, head: number, time: number): Pt[] {
  const out: Pt[] = [];
  const span = Math.max(0.001, head - tail);
  for (let i = 0; i <= SAMPLES; i++) {
    const t = tail + span * (i / SAMPLES);
    const p = curve.getPoint(t);
    const tg = curve.getTangent(t);
    let nx = -tg.y, ny = tg.x;
    if (ny > 0) { nx = -nx; ny = -ny; }
    // ondulazione: nulla alla bocca del cannone, più ampia verso la punta
    const wob = Math.sin(t * 13 - time * 0.022) * 4 * t;
    // il getto si allarga con la distanza; coda e punta sono arrotondate
    const edge = Math.min(1, (i + 1.6) / 3, (SAMPLES - i + 1.4) / 3);
    out.push({ x: p.x + nx * wob, y: p.y + ny * wob, nx, ny, w: HALF_WIDTH * (0.72 + 0.55 * t) * edge });
  }
  return out;
}

/** Uno strato del nastro: `k` scala la larghezza, `shift` lo sposta lungo la normale (in frazioni di larghezza). */
function ribbon(g: Phaser.GameObjects.Graphics, pts: Pt[], k: number, shift: number, color: number, alpha: number): void {
  g.fillStyle(color, alpha);
  g.beginPath();
  pts.forEach((p, i) => {
    const x = p.x + p.nx * p.w * (shift + k), y = p.y + p.ny * p.w * (shift + k);
    if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
  });
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    g.lineTo(p.x + p.nx * p.w * (shift - k), p.y + p.ny * p.w * (shift - k));
  }
  g.closePath();
  g.fillPath();
}
