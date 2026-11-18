import Phaser from 'phaser';
import { setupView, button, pin, burst } from '../../../core/ui';
import { muteButton, goTo } from '../../../core/hud';
import { Hint } from '../../../core/drag';
import { urlParam } from '../../../core/platform';
import { levelOf, stageOf, type Activity, type PuzzleKind, type Room, type Game } from '../logic';
import { generate } from '../puzzles';
import { neighbors, pathHint, type PathLevel } from '../puzzles/path';
import { canMove, jarDone, sortDone, sortHint, type SortLevel } from '../puzzles/sort';
import { canExit, blocker, exitHint, DX, DY, type ExitLevel, type Puff } from '../puzzles/exit';
import type { SeqLevel } from '../puzzles/seq';
import { save } from '../save';
import { PupouView } from '../pupou';
import { sfx, playPupouMusic } from '../sfx';

export interface PuzzleData { act: Activity; kind: PuzzleKind; n: number; friend?: string; room: Room }
const BX = 1050, BY = 600, BW = 1260, BH = 770;
const SORT_FOODS = ['apple', 'banana', 'broccoli', 'carrot', 'icecream'];
const SEQ_FOODS = ['apple', 'banana', 'carrot', 'broccoli', 'cheese', 'icecream', 'pizza', 'cake', 'water'];
const BG: Record<PuzzleKind, string> = { path: 'bath', exit: 'bath', sort: 'kitchen', seq: 'school' };
const IDLE_MS = 7000;

/** Quello che ogni rompicapo deve saper fare per la scena. */
interface Board { hint(): void; reset?(): void; down?(x: number, y: number): void; move?(x: number, y: number): void; auto(): boolean }

/**
 * La scena dei rompicapo: quattro giochi di logica generati dal codice, uno per attività.
 * Non si perde mai: si può ricominciare, chiedere un aiutino (la manina mostra la mossa) o tornare a casa.
 */
export class Puzzle extends Phaser.Scene {
  private d!: PuzzleData;
  private board!: Board;
  private hint!: Hint;
  private pet!: PupouView;
  private won = false;
  private lastAction = 0;
  private objs: Phaser.GameObjects.GameObject[] = [];

  constructor() { super('pupou:Puzzle'); }

  create(data: PuzzleData): void {
    this.d = data;
    this.won = false;
    this.objs = [];
    this.lastAction = this.time.now;
    setupView(this);
    this.cameras.main.fadeIn(250, 143, 211, 255);
    playPupouMusic();
    this.add.image(960, 540, `pp_bg_${data.act === 'play' ? 'park' : BG[data.kind]}`).setScale(2).setDepth(0);
    this.add.rectangle(960, 540, 6000, 4000, 0xffffff, 0.42).setDepth(1);

    const g = save.state as Game;
    this.pet = new PupouView(this, 210, 960, 50, 0.62);
    this.pet.setStage(stageOf(levelOf(g.xp).level));
    this.pet.setWear(g.worn);
    this.pet.setState('ok', 100, false);

    this.hint = new Hint(this);
    const back = button(this, 0, 0, 'btn_back', () => goTo(this, 'pupou:Home', { room: data.room }), 0.85);
    pin(this, back, 'tl', 80, 80);
    muteButton(this);
    const hb = button(this, 0, 0, 'pp_btn_hint', () => { this.touch(); this.board.hint(); }, 0.95);
    pin(this, hb, 'br', 100, 330);

    const lv = generate(data.kind, data.n);
    this.board = data.kind === 'path' ? this.pathBoard(lv as PathLevel) : data.kind === 'sort' ? this.sortBoard(lv as SortLevel)
      : data.kind === 'exit' ? this.exitBoard(lv as ExitLevel) : this.seqBoard(lv as SeqLevel);
    if (this.board.reset) {
      const rb = button(this, 0, 0, 'pp_btn_redo', () => { this.touch(); if (!this.won) { sfx.slide(); this.board.reset!(); } }, 0.95);
      pin(this, rb, 'br', 100, 520);
    }
    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => { this.touch(); if (!over.length && !this.won) this.board.down?.(p.worldX, p.worldY); });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => { if (p.isDown && !this.won) this.board.move?.(p.worldX, p.worldY); });
    this.time.addEvent({ delay: 500, loop: true, callback: () => { if (!this.won && !this.hint.visible && this.time.now - this.lastAction > IDLE_MS) this.board.hint(); } });
    // i primissimi rompicapo di ogni tipo si aprono con la manina che mostra come si fa
    if (data.n < 2) this.time.delayedCall(700, () => { if (!this.won) this.board.hint(); });
    if (urlParam('debug')) Object.assign(window, { __pz: this });
  }

  update(time: number): void { this.pet.update(time); }

  private touch(): void { this.lastAction = this.time.now; this.hint.hide(); }
  private keep<O extends Phaser.GameObjects.GameObject>(o: O): O { this.objs.push(o); return o; }
  /** Per i test automatici: esegue una mossa giusta. */
  autoStep(): boolean { return !this.won && this.board.auto(); }

  private panel(w: number, h: number, color = 0xfff6e2, line = 0xd9bd86, cy = BY): void {
    const g = this.add.graphics().setDepth(5);
    g.fillStyle(0x1d2440, 0.22).fillRoundedRect(BX - w / 2 + 8, cy - h / 2 + 14, w, h, 48);
    g.fillStyle(color, 0.96).fillRoundedRect(BX - w / 2, cy - h / 2, w, h, 48);
    g.lineStyle(8, line, 1).strokeRoundedRect(BX - w / 2, cy - h / 2, w, h, 48);
  }

  private win(): void {
    if (this.won) return;
    this.won = true;
    this.hint.hide();
    sfx.win();
    this.pet.express('happy', 'grin', 2500);
    this.pet.hop(90, 240);
    burst(this, BX, BY, 'confetti', { count: 40, tints: [0xff5e9a, 0x36a9f0, 0xffd23a, 0x35c46a, 0xb06af0], speed: [300, 1000], life: 1500, depth: 1500 });
    burst(this, BX, BY, 'star', { count: 14, speed: [300, 800], scale: [0.9, 0.1], life: 1200, depth: 1500 });
    this.time.delayedCall(650, () => this.pet.fart(2));
    this.time.delayedCall(1700, () => goTo(this, 'pupou:Home', { room: this.d.room, done: { act: this.d.act, kind: this.d.kind, friend: this.d.friend } }));
  }

  // ================================================================= passa la spugna (tratto unico)
  private pathBoard(lv: PathLevel): Board {
    const cell = Math.min(BW / lv.w, BH / lv.h, 235);
    const x0 = BX - (lv.w * cell) / 2 + cell / 2, y0 = BY - (lv.h * cell) / 2 + cell / 2;
    const at = (c: number) => ({ x: x0 + (c % lv.w) * cell, y: y0 + Math.floor(c / lv.w) * cell });
    const total = lv.blocked.filter((b) => !b).length;
    this.panel(lv.w * cell + 50, lv.h * cell + 50, 0xdff4ff, 0x7cc4f0);
    const tiles = lv.blocked.map((b, c) => { const p = at(c); return this.add.image(p.x, p.y, b ? 'pp_tile_block' : 'pp_tile_dirty').setScale((cell / 200) * 0.97).setDepth(10); });
    const trail = this.add.graphics().setDepth(20);
    const sponge = this.add.image(0, 0, 'pp_sponge').setDepth(30).setScale(Math.min(1, cell / 190));
    let path: number[] = [];
    const draw = (): void => {
      tiles.forEach((tl, c) => { if (!lv.blocked[c]) tl.setTexture(path.includes(c) ? 'pp_tile_clean' : 'pp_tile_dirty'); });
      trail.clear();
      if (path.length > 1) {
        for (const [wd, col, al] of [[cell * 0.36, 0x4aa9cc, 0.35], [cell * 0.26, 0xffffff, 0.95]] as const) {
          trail.lineStyle(wd, col, al).beginPath();
          path.forEach((c, i) => { const p = at(c); if (i) trail.lineTo(p.x, p.y); else trail.moveTo(p.x, p.y); });
          trail.strokePath();
          trail.fillStyle(col, al);
          for (const c of path) { const p = at(c); trail.fillCircle(p.x, p.y, wd / 2); }
        }
      }
      const h = at(path[path.length - 1]);
      sponge.setPosition(h.x, h.y);
    };
    const reset = (): void => { path = [lv.start]; draw(); };
    const cellAt = (x: number, y: number): number => {
      const cx = Math.round((x - x0) / cell), cy = Math.round((y - y0) / cell);
      if (cx < 0 || cy < 0 || cx >= lv.w || cy >= lv.h) return -1;
      // serve stare ben dentro la casella: in diagonale non si salta per sbaglio
      const p = at(cy * lv.w + cx);
      return Math.abs(x - p.x) < cell * 0.42 && Math.abs(y - p.y) < cell * 0.42 ? cy * lv.w + cx : -1;
    };
    const go = (c: number): boolean => {
      if (c < 0 || lv.blocked[c]) return false;
      const head = path[path.length - 1];
      if (c === head) return false;
      const i = path.indexOf(c);
      if (i >= 0) {
        // tornare su una casella già pulita: si accorcia il percorso fin lì
        if (i === path.length - 2) { path.pop(); sfx.tap(); draw(); return true; }
        return false;
      }
      if (!neighbors(head, lv.w, lv.h).includes(c)) return false;
      path.push(c);
      sfx.step(path.length - 2);
      const p = at(c);
      burst(this, p.x, p.y, 'pp_soapbubble', { count: 3, speed: [60, 200], scale: [0.5, 0], gravity: -200, life: 500, depth: 40 });
      draw();
      if (path.length === total) this.win();
      return true;
    };
    reset();
    return {
      reset,
      down: (x, y) => { const c = cellAt(x, y); const i = path.indexOf(c); if (i >= 0 && i < path.length - 2) { path = path.slice(0, i + 1); sfx.tap(); draw(); } else go(c); },
      move: (x, y) => { go(cellAt(x, y)); },
      hint: () => {
        const nx = pathHint(lv, path);
        const h = at(path[path.length - 1]);
        if (nx < 0) { if (path.length > 1) { path.pop(); sfx.nope(); draw(); } return; }
        const p = at(nx);
        this.hint.drag(h.x, h.y, p.x, p.y);
      },
      auto: () => { const nx = pathHint(lv, path); if (nx < 0) { if (path.length > 1) path.pop(); draw(); return true; } return go(nx); },
    };
  }

  // ================================================================= riordina i barattoli (ordina e incastra)
  private sortBoard(lv: SortLevel): Board {
    const J = lv.jars.length;
    const step = Math.min(250, BW / J);
    const jh = lv.cap * 120 + 80;
    const s = Math.min(1, step / 212, BH / jh);
    const jx = (j: number) => BX + (j - (J - 1) / 2) * step;
    const bottom = BY + (jh * s) / 2;
    const py = (i: number) => bottom - (34 + 60 + i * 118) * s;
    this.panel(Math.min(BW + 40, J * step + 80), jh * s + 150, 0xfff6e2, 0xd9bd86);
    let jars: number[][] = [];
    let sprites: Phaser.GameObjects.Image[][] = [];
    let sel = -1;
    const jarImgs = lv.jars.map((_, j) => this.add.image(jx(j), bottom, `pp_jar_${lv.cap}`).setOrigin(0.5, 1).setScale(s).setDepth(10));
    const lift = (j: number, up: boolean): void => {
      const sp = sprites[j][sprites[j].length - 1];
      if (!sp) return;
      this.tweens.killTweensOf(sp);
      this.tweens.add({ targets: sp, y: up ? bottom - jh * s - 50 * s : py(sprites[j].length - 1), duration: 130, ease: 'Quad.easeOut' });
    };
    const reset = (): void => {
      sprites.flat().forEach((o) => o.destroy());
      jars = lv.jars.map((j) => [...j]);
      sel = -1;
      sprites = jars.map((j, ji) => j.map((c, i) => this.add.image(jx(ji), py(i), `pp_food_${SORT_FOODS[c]}`).setScale(0.74 * s).setDepth(20)));
      jarImgs.forEach((im) => im.clearTint());
    };
    const moveTo = (a: number, b: number): void => {
      const sp = sprites[a].pop() as Phaser.GameObjects.Image;
      jars[b].push(jars[a].pop() as number);
      sprites[b].push(sp);
      sel = -1;
      sfx.drop();
      this.tweens.killTweensOf(sp);
      const topY = bottom - jh * s - 50 * s;
      this.tweens.chain({ targets: sp, tweens: [{ y: topY, duration: 90 }, { x: jx(b), duration: 160, ease: 'Sine.easeInOut' }, { y: py(jars[b].length - 1), duration: 140, ease: 'Bounce.easeOut' }] });
      if (jarDone(jars[b], lv.cap)) {
        this.time.delayedCall(380, () => { sfx.star(); jarImgs[b].setTint(0xc8ffb0); burst(this, jx(b), bottom - (jh * s) / 2, 'star', { count: 8, speed: [200, 500], scale: [0.6, 0.1], life: 800, depth: 60 }); });
      }
      if (sortDone(jars, lv.cap)) this.time.delayedCall(450, () => this.win());
    };
    const tapJar = (j: number): void => {
      if (j < 0 || j >= J) return;
      if (sel < 0) {
        if (!jars[j].length || jarDone(jars[j], lv.cap)) { sfx.nope(); return; }
        sel = j; lift(j, true); sfx.tap();
        return;
      }
      if (sel === j) { lift(j, false); sel = -1; sfx.tap(); return; }
      if (canMove(jars, lv.cap, sel, j)) { moveTo(sel, j); return; }
      // mossa non valida: il barattolo fa di no, e se ha qualcosa diventa lui quello scelto
      sfx.nope();
      this.tweens.add({ targets: jarImgs[j], x: jx(j) + 10, duration: 50, yoyo: true, repeat: 2, onComplete: () => jarImgs[j].setX(jx(j)) });
      lift(sel, false);
      sel = -1;
    };
    reset();
    return {
      reset,
      down: (x, y) => { if (Math.abs(y - BY) < BH / 2 + 60) tapJar(Math.round((x - jx(0)) / step)); },
      hint: () => {
        const mv = sortHint(jars, lv.cap);
        if (!mv) { sfx.nope(); reset(); return; }
        if (sel >= 0 && sel !== mv[0]) { lift(sel, false); sel = -1; }
        this.hint.drag(jx(mv[0]), bottom - jh * s * 0.5, jx(mv[1]), bottom - jh * s * 0.5);
      },
      auto: () => { const mv = sortHint(jars, lv.cap); if (!mv) { reset(); return true; } if (sel >= 0) { lift(sel, false); sel = -1; } moveTo(mv[0], mv[1]); return true; },
    };
  }

  // ================================================================= fuori le puzzette (uscita a catena)
  private exitBoard(lv: ExitLevel): Board {
    const cell = Math.min(BW / lv.w, BH / lv.h, 225);
    const x0 = BX - (lv.w * cell) / 2 + cell / 2, y0 = BY - (lv.h * cell) / 2 + cell / 2;
    this.panel(lv.w * cell + 50, lv.h * cell + 50, 0xeaf7ff, 0x7cc4f0);
    const grid = this.add.graphics().setDepth(6);
    grid.fillStyle(0xbfe0f5, 0.9);
    for (let c = 0; c < lv.w * lv.h; c++) grid.fillRoundedRect(x0 + (c % lv.w) * cell - cell * 0.45, y0 + Math.floor(c / lv.w) * cell - cell * 0.45, cell * 0.9, cell * 0.9, 22);
    const puffs: (Puff | null)[] = [...lv.puffs];
    const sc = (cell / 180) * 0.9;
    const imgs = lv.puffs.map((p) => {
      const im = this.add.image(x0 + p.x * cell, y0 + p.y * cell, `pp_puff_${p.dir}`).setScale(sc).setDepth(20);
      this.tweens.add({ targets: im, scaleX: sc * 1.05, scaleY: sc * 0.96, duration: 700 + ((p.x * 7 + p.y * 13) % 5) * 90, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      return im;
    });
    const tap = (i: number): boolean => {
      const p = puffs[i];
      if (!p) return false;
      const im = imgs[i];
      if (canExit(puffs, i, lv.w, lv.h)) {
        puffs[i] = null;
        sfx.fart(1);
        this.tweens.killTweensOf(im);
        im.setDepth(40);
        this.tweens.add({ targets: im, x: im.x + DX[p.dir] * 1700, y: im.y + DY[p.dir] * 1700, duration: 650, ease: 'Quad.easeIn', onComplete: () => im.destroy() });
        burst(this, im.x, im.y, 'pp_cloud', { count: 4, speed: [80, 220], scale: [0.25, 0.5], gravity: -80, life: 500, depth: 15 });
        if (puffs.every((q) => q === null)) this.time.delayedCall(300, () => this.win());
        return true;
      }
      // strada chiusa: la nuvoletta sbatte contro quella davanti, che traballa
      sfx.nope();
      const bx = im.x, by = im.y;
      this.tweens.add({ targets: im, x: bx + DX[p.dir] * cell * 0.22, y: by + DY[p.dir] * cell * 0.22, duration: 90, yoyo: true, onComplete: () => im.setPosition(bx, by) });
      const bl = blocker(puffs, i, lv.w, lv.h);
      if (bl >= 0) this.tweens.add({ targets: imgs[bl], angle: 8, duration: 60, yoyo: true, repeat: 2, delay: 80, onComplete: () => imgs[bl].setAngle(0) });
      return false;
    };
    return {
      down: (x, y) => {
        const cx = Math.round((x - x0) / cell), cy = Math.round((y - y0) / cell);
        const i = puffs.findIndex((p) => p !== null && p.x === cx && p.y === cy);
        if (i >= 0) tap(i);
      },
      hint: () => { const i = exitHint(puffs, lv.w, lv.h); if (i >= 0) this.hint.tap(imgs[i].x, imgs[i].y); },
      auto: () => { const i = exitHint(puffs, lv.w, lv.h); return i >= 0 && tap(i); },
    };
  }

  // ================================================================= cosa viene dopo? (sequenze)
  private seqBoard(lv: SeqLevel): Board {
    let qi = 0;
    let busy = false;
    let opts: { img: Phaser.GameObjects.Image; icon: Phaser.GameObjects.Image; sym: number; off: boolean }[] = [];
    let holeAt = { x: 0, y: 0 };
    let holeCard: Phaser.GameObjects.Image | null = null;
    this.panel(BW, 300, 0xfff6e2, 0xd9bd86, 470);
    const dots = lv.questions.map((_, i) => this.add.image(BX + (i - 1) * 90, 230, 'star_empty').setDepth(10).setScale(0.8));
    const rowY = 470, optY = 830;
    const build = (): void => {
      this.objs.forEach((o) => o.destroy());
      this.objs = [];
      opts = [];
      busy = false;
      const q = lv.questions[qi];
      const n = q.items.length;
      const step = Math.min(196, (BW - 60) / n);
      const cs = step / 215;
      q.items.forEach((sym, i) => {
        const x = BX + (i - (n - 1) / 2) * step;
        const card = this.keep(this.add.image(x, rowY, sym < 0 ? 'pp_card_q' : 'pp_card').setScale(0).setDepth(10));
        this.tweens.add({ targets: card, scale: cs, duration: 260, delay: i * 60, ease: 'Back.easeOut' });
        if (sym < 0) {
          holeAt = { x, y: rowY }; holeCard = card;
          this.tweens.add({ targets: card, scale: cs * 1.08, duration: 500, delay: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        } else {
          const ic = this.keep(this.add.image(x, rowY - 4, `pp_food_${SEQ_FOODS[sym]}`).setScale(0).setDepth(11));
          this.tweens.add({ targets: ic, scale: cs * 0.92, duration: 260, delay: i * 60 + 40, ease: 'Back.easeOut' });
        }
      });
      const m = q.options.length;
      q.options.forEach((sym, i) => {
        const x = BX + (i - (m - 1) / 2) * 280;
        const img = this.keep(this.add.image(x, optY, 'pp_card').setScale(0).setDepth(10));
        const icon = this.keep(this.add.image(x, optY - 4, `pp_food_${SEQ_FOODS[sym]}`).setScale(0).setDepth(11));
        this.tweens.add({ targets: img, scale: 1.12, duration: 300, delay: 500 + i * 90, ease: 'Back.easeOut' });
        this.tweens.add({ targets: icon, scale: 1.1, duration: 300, delay: 540 + i * 90, ease: 'Back.easeOut' });
        opts.push({ img, icon, sym, off: false });
      });
    };
    const pick = (o: (typeof opts)[number]): boolean => {
      if (busy || o.off) return false;
      const q = lv.questions[qi];
      if (o.sym !== q.answer) {
        o.off = true;
        sfx.nope();
        const x = o.img.x;
        this.tweens.add({ targets: [o.img, o.icon], x: x + 12, duration: 50, yoyo: true, repeat: 2, onComplete: () => { o.img.setX(x).setAlpha(0.4); o.icon.setX(x).setAlpha(0.3); } });
        this.pet.express('open', 'o', 600);
        return false;
      }
      busy = true;
      sfx.star();
      this.pet.giggle();
      this.tweens.killTweensOf(holeCard!);
      holeCard?.setTexture('pp_card');
      const cs = holeCard ? holeCard.scale : 0.9;
      this.tweens.add({ targets: o.icon, x: holeAt.x, y: holeAt.y - 4, scale: cs * 0.92, duration: 320, ease: 'Quad.easeInOut' });
      burst(this, holeAt.x, holeAt.y, 'star', { count: 8, speed: [200, 500], scale: [0.6, 0.1], life: 800, depth: 60 });
      dots[qi].setTexture('star');
      this.tweens.add({ targets: dots[qi], scale: 1.1, duration: 150, yoyo: true });
      this.time.delayedCall(950, () => { qi++; if (qi >= lv.questions.length) this.win(); else { sfx.slide(); build(); } });
      return true;
    };
    build();
    return {
      down: (x, y) => { const o = opts.find((k) => Math.abs(x - k.img.x) < 130 && Math.abs(y - k.img.y) < 140); if (o) pick(o); },
      hint: () => { const o = opts.find((k) => k.sym === lv.questions[qi]?.answer); if (o && !busy) this.hint.tap(o.img.x, o.img.y); },
      auto: () => { const o = opts.find((k) => k.sym === lv.questions[qi]?.answer); return !!o && pick(o); },
    };
  }
}
