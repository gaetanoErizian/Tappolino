import Phaser from 'phaser';
import { setupView, button, pin, burst, pulse, HintHand, view } from '../../../core/ui';
import { muteButton, goTo } from '../../../core/hud';
import { FONT } from '../../../core/brand';
import { urlParam } from '../../../core/platform';
import { TF } from '../art';
import {
  COLORS, WHEELS, STICKERS, unlocked, usable, repairsFor, isRepairId, nextTrack, colorHex, type RepairId, type Kind,
} from '../parts';
import { TruckView, drawGarage, hex, WHEEL_STEP, WHEEL_FRAMES } from '../world';
import { save } from '../save';
import { sfx, playTruckMusic } from '../sfx';

const TS = 1.42;
const TRUCK_AT = 960;
const IDLE_HINT_MS = 6000;
const SLOT_Y = 968;
const SLOT_GAP = 150;

type Cat = Exclude<Kind, 'track'>;

interface Fix { id: RepairId; done: boolean; bubble: Phaser.GameObjects.Image; ph: number }
interface Slot { cat: Cat; id: string; x: number; frame: Phaser.GameObjects.Image; art: Phaser.GameObjects.Image[]; open: boolean; q?: Phaser.GameObjects.Text }

/**
 * Officina (gesto: tocco). Il truck arriva con tre guasti, ognuno con la sua nuvoletta: gomma a terra (pompa),
 * ruota smontata (torna a posto rotolando), fango (acqua e bolle), motore che fuma (chiave inglese).
 * Riparato tutto, si sceglie colore, ruote e adesivo, poi la bandiera a scacchi porta in pista.
 */
export class Garage extends Phaser.Scene {
  private truck!: TruckView;
  private liftY = 778;
  private fixes: Fix[] = [];
  private busy = false;
  private ready = false;
  private lastAction = 0;
  private hint!: HintHand;
  private mud: Array<{ img: Phaser.GameObjects.Image; tx: number; ty: number }> = [];
  private smokeEv?: Phaser.Time.TimerEvent;
  private jack?: Phaser.GameObjects.Image;
  private loose?: Phaser.GameObjects.Image;
  private looseShine?: Phaser.GameObjects.Image;
  private looseShadow?: Phaser.GameObjects.Image;
  private cats: Array<{ cat: Cat; btn: Phaser.GameObjects.Image; glow: Phaser.GameObjects.Image }> = [];
  private cat: Cat = 'color';
  private slots: Slot[] = [];
  private marker!: Phaser.GameObjects.Image;
  private go?: Phaser.GameObjects.Image;
  private hopping = false;

  constructor() { super('monstertruck:Garage'); }

  create(data: { repairs?: string[] }): void {
    this.fixes = [];
    this.mud = [];
    this.cats = [];
    this.slots = [];
    this.busy = false;
    this.ready = false;
    this.hopping = false;
    this.go = undefined;
    this.jack = this.loose = this.looseShadow = this.looseShine = undefined;
    this.lastAction = this.time.now;
    this.cat = 'color';

    setupView(this, () => this.placeSlots());
    this.cameras.main.fadeIn(250, 255, 214, 160);
    playTruckMusic();
    this.liftY = drawGarage(this).liftY;

    const s = save.state;
    this.truck = new TruckView(this, { color: s.color, wheel: s.wheel, sticker: s.sticker }, TRUCK_AT, this.liftY, TS, 60);
    // `repairs` solo per i test automatici e le catture degli store
    const forced = Array.isArray(data?.repairs) ? data.repairs.filter(isRepairId) : [];
    const list = forced.length ? forced : repairsFor(s.visits);
    save.update({ visits: s.visits + 1 });
    this.hint = new HintHand(this);
    for (const id of list) this.breakIt(id);
    this.truck.sync(0);

    muteButton(this);
    const home = button(this, 0, 0, 'btn_home', () => goTo(this, 'monstertruck:Menu'), 0.85);
    pin(this, home, 'tl', 80, 80);

    if (!save.state.garageTutorial) this.time.delayedCall(700, () => this.showHint());
    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length) return;
      this.onTap(p.worldX, p.worldY);
    });
    if (urlParam('debug')) Object.assign(window, { __mt: this });
  }

  // =================================================================
  // Guasti
  // =================================================================

  private breakIt(id: RepairId): void {
    const tr = this.truck;
    const bubble = this.add.image(0, 0, `mt_need_${id}`).setDepth(300).setScale(0);
    this.tweens.add({ targets: bubble, scale: 1, duration: 380, delay: 300 + this.fixes.length * 150, ease: 'Back.easeOut' });
    this.fixes.push({ id, done: false, bubble, ph: this.fixes.length * 1.7 });
    if (id === 'gomma') {
      tr.rearFlat = 0.68;
    } else if (id === 'ruota') {
      tr.setFrontVisible(false);
      const w = tr.wheelRest();
      this.jack = this.add.image(w.fx, this.liftY + 4, 'mt_jack').setOrigin(0.5, 1).setScale(0.9, 1.4).setDepth(58);
      this.looseShadow = this.add.image(1400, 910, 'shadow').setScale(0.9, 0.5).setDepth(56);
      this.loose = this.add.image(1400, 910 - TF.R * TS, `mt_wheel_${tr.look.wheel}_2`).setScale(TS).setDepth(57);
      this.looseShine = this.add.image(1400, 910 - TF.R * TS, 'mt_wheel_shine').setScale(TS).setDepth(57.1);
    } else if (id === 'fango') {
      for (const [x, y, sc] of [[86, 138, 1.05], [236, 150, 0.9], [356, 136, 0.8]] as const) {
        this.mud.push({ img: this.add.image(0, 0, 'mt_mud').setDepth(64).setScale(sc * TS), tx: x, ty: y });
      }
    } else {
      this.smokeEv = this.time.addEvent({ delay: 420, loop: true, callback: () => this.puff() });
      this.time.addEvent({ delay: 2600, loop: true, callback: () => { if (this.fixes.some((f) => f.id === 'motore' && !f.done)) { sfx.cough(); this.truck.kick(-50); } } });
    }
  }

  private puff(): void {
    const p = this.truck.bodyPoint(TF.smokeX, TF.smokeY);
    const img = this.add.image(p.x, p.y, 'mt_smoke').setDepth(70).setScale(0.3).setAlpha(0.9);
    this.tweens.add({ targets: img, x: p.x - 40 - Math.random() * 40, y: p.y - 170, scale: 0.9, alpha: 0, duration: 1500, ease: 'Sine.easeOut', onComplete: () => img.destroy() });
  }

  /** Punto da toccare per ogni guasto e posizione della nuvoletta. */
  private spot(id: RepairId): { x: number; y: number; bx: number; by: number } {
    const tr = this.truck;
    const w = tr.wheelRest();
    switch (id) {
      case 'gomma': return { x: w.rx, y: w.ry + 20, bx: w.rx - 190, by: w.ry - 40 };
      case 'ruota': return { x: this.loose?.x ?? w.fx, y: this.loose?.y ?? w.fy, bx: (this.loose?.x ?? w.fx) + 10, by: (this.loose?.y ?? w.fy) - 190 };
      case 'fango': { const p = tr.bodyPoint(150, 120), b = tr.bodyPoint(90, -10); return { x: p.x, y: p.y, bx: b.x, by: b.y }; }
      default: { const p = tr.bodyPoint(350, 110), b = tr.bodyPoint(370, -10); return { x: p.x, y: p.y, bx: b.x + 30, by: b.y }; }
    }
  }

  private onTap(x: number, y: number): void {
    this.lastAction = this.time.now;
    this.hint.hide();
    if (this.busy) return;
    const open = this.fixes.filter((f) => !f.done);
    if (open.length) {
      let best: Fix | null = null, bd = Infinity;
      for (const f of open) {
        const s = this.spot(f.id);
        const d = Math.min(Phaser.Math.Distance.Between(x, y, s.x, s.y), Phaser.Math.Distance.Between(x, y, s.bx, s.by));
        if (d < bd) { bd = d; best = f; }
      }
      // bersagli grandi: vicino a un guasto, oppure in un punto qualsiasi del truck (il guasto più vicino)
      if (best && (bd < 230 || this.truck.hit(x, y, 40))) { this.repair(best); return; }
      this.sparkle(x, y);
      return;
    }
    if (!this.ready) return;
    const slot = this.slots.find((s) => Math.abs(x - s.frame.x) < 72 && Math.abs(y - s.frame.y) < 80);
    if (slot) { this.choose(slot); return; }
    const c = this.cats.find((k) => Phaser.Math.Distance.Between(x, y, k.btn.x, k.btn.y) < 95);
    if (c) { this.showCat(c.cat); return; }
    if (this.truck.hit(x, y)) { this.hop(); return; }
    this.sparkle(x, y);
  }

  private sparkle(x: number, y: number): void {
    sfx.tap();
    burst(this, x, y, 'sparkle', { count: 6, tints: [0xffffff, 0xffe066, 0xffb84a], speed: [80, 220], scale: [0.6, 0], gravity: 0, life: 600 });
  }

  private repair(f: Fix): void {
    this.busy = true;
    this.hint.hide();
    const done = () => {
      f.done = true;
      this.tweens.add({ targets: f.bubble, scale: 0, duration: 200, ease: 'Back.easeIn', onComplete: () => f.bubble.setVisible(false) });
      const s = this.spot(f.id);
      burst(this, s.x, s.y, 'star', { count: 8, speed: [180, 420], scale: [0.6, 0], gravity: 500, life: 800, depth: 200 });
      if (!save.state.garageTutorial) save.update({ garageTutorial: true });
      this.busy = false;
      this.lastAction = this.time.now;
      if (this.fixes.every((k) => k.done)) this.allFixed();
      else if (!save.state.garageTutorial) this.showHint();
    };
    const tr = this.truck;
    if (f.id === 'gomma') {
      const w = tr.wheelRest();
      const pump = this.add.image(w.rx - 200, this.liftY + 6, 'mt_pump').setOrigin(0.5, 1).setDepth(66).setScale(0.9).setAlpha(0);
      this.tweens.add({ targets: pump, alpha: 1, duration: 150 });
      for (let k = 0; k < 3; k++) {
        this.time.delayedCall(180 + k * 300, () => {
          sfx.pump();
          this.tweens.add({ targets: pump, scaleY: 0.78, duration: 120, yoyo: true, ease: 'Quad.easeOut' });
          this.tweens.add({ targets: tr, rearFlat: 0.68 + (k + 1) * 0.09, duration: 200 });
          burst(this, w.rx - 120, w.ry + 30, 'dot', { count: 5, tints: [0xffffff, 0xcfefff], speed: [60, 160], scale: [0.9, 0], gravity: -60, life: 450, depth: 200 });
        });
      }
      this.time.delayedCall(1150, () => {
        sfx.pop();
        this.tweens.add({ targets: tr, rearFlat: 1, duration: 380, ease: 'Back.easeOut' });
        tr.kick(-160);
        this.tweens.add({ targets: pump, alpha: 0, duration: 300, delay: 300, onComplete: () => pump.destroy() });
        done();
      });
    } else if (f.id === 'ruota') {
      const w = tr.wheelRest();
      const lw = this.loose!;
      sfx.whoosh();
      this.tweens.add({ targets: this.looseShadow, alpha: 0, duration: 300 });
      const roll = { x: lw.x, y: lw.y, spin: 0 };
      const shine = this.looseShine!;
      const id = tr.look.wheel;
      this.tweens.add({
        targets: roll, x: w.fx, y: w.fy, spin: 400, duration: 800, ease: 'Cubic.easeInOut',
        onUpdate: () => {
          // la ruota rotola verso sinistra: i fotogrammi vanno all'indietro
          const k = ((2 - Math.floor(roll.spin / WHEEL_STEP)) % WHEEL_FRAMES + WHEEL_FRAMES) % WHEEL_FRAMES;
          lw.setTexture(`mt_wheel_${id}_${k}`).setPosition(roll.x, roll.y);
          shine.setPosition(roll.x, roll.y);
        },
        onComplete: () => {
          sfx.clank();
          lw.destroy();
          shine.destroy();
          tr.setFrontVisible(true);
          tr.kick(-180);
          burst(this, w.fx, w.fy, 'sparkle', { count: 10, tints: [0xffffff, 0xffe066], speed: [120, 320], scale: [0.8, 0], gravity: 0, life: 600, depth: 200 });
          this.tweens.add({ targets: this.jack, x: w.fx + 380, alpha: 0, duration: 500, delay: 150, ease: 'Quad.easeIn' });
          done();
        },
      });
    } else if (f.id === 'fango') {
      sfx.wash();
      for (const m of this.mud) {
        const { x, y } = m.img;
        for (let k = 0; k < 2; k++) burst(this, x, y, 'mt_bubble', { count: 5, speed: [60, 200], scale: [0.9, 0.3], gravity: -120, life: 900, depth: 200 });
        burst(this, x, y, 'dot', { count: 8, tints: [0x9fdcff, 0xffffff], speed: [100, 300], scale: [0.8, 0], gravity: 300, life: 600, depth: 200 });
        this.tweens.add({ targets: m.img, alpha: 0, scale: m.img.scale * 0.4, duration: 600, delay: 150, onComplete: () => m.img.destroy() });
      }
      this.time.delayedCall(800, () => { this.mud = []; sfx.select(); done(); });
    } else {
      const p = tr.bodyPoint(TF.smokeX, TF.smokeY + 30);
      const wr = this.add.image(p.x + 70, p.y - 30, 'mt_wrench').setDepth(210).setScale(0.8);
      for (let k = 0; k < 3; k++) {
        this.time.delayedCall(k * 260, () => {
          sfx.wrench();
          this.tweens.add({ targets: wr, y: wr.y + 26, x: wr.x - 10, duration: 110, yoyo: true, ease: 'Quad.easeOut' });
          burst(this, p.x + 20, p.y, 'sparkle', { count: 4, tints: [0xffffff, 0xffe066], speed: [100, 260], scale: [0.5, 0], gravity: 0, life: 400, depth: 200 });
        });
      }
      this.time.delayedCall(820, () => {
        this.smokeEv?.remove();
        this.tweens.add({ targets: wr, alpha: 0, y: wr.y - 60, duration: 300, onComplete: () => wr.destroy() });
        sfx.vroom();
        this.tweens.add({ targets: tr, x: TRUCK_AT + 6, duration: 50, yoyo: true, repeat: 5, onComplete: () => { tr.x = TRUCK_AT; } });
        const ex = tr.bodyPoint(138, 30);
        burst(this, ex.x, ex.y, 'star', { count: 6, speed: [120, 300], scale: [0.5, 0], gravity: -100, life: 700, depth: 200 });
        done();
      });
    }
  }

  /** Tutto riparato: clacson, saltello e si apre la scelta di colore, ruote e adesivi. */
  private allFixed(): void {
    sfx.fixed();
    this.time.delayedCall(350, () => sfx.horn());
    this.hop(true);
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 200, () => burst(this, 500 + Math.random() * 920, 200, 'confetti', {
        count: 18, tints: [0xff5e5e, 0xffd23f, 0x3cc46a, 0x4fa3ff, 0xff8a1e], speed: [250, 650], scale: [1.3, 0.6], life: 1500, gravity: 800,
      }));
    }
    this.time.delayedCall(500, () => this.openCustom());
  }

  private hop(silent = false): void {
    if (this.hopping) return;
    this.hopping = true;
    if (!silent) { sfx.horn(); }
    const tr = this.truck;
    this.tweens.add({
      targets: tr, y: this.liftY - 90, duration: 260, yoyo: true, ease: 'Quad.easeOut',
      onComplete: () => { tr.y = this.liftY; tr.kick(220); sfx.land(); this.hopping = false; },
    });
  }

  // =================================================================
  // Personalizzazione
  // =================================================================

  private openCustom(): void {
    this.ready = true;
    const keys: Array<[Cat, string]> = [['color', 'mt_cat_color'], ['wheel', 'mt_cat_wheel'], ['sticker', 'mt_cat_sticker']];
    keys.forEach(([cat, key], i) => {
      const glow = this.add.image(0, 0, 'glow').setScale(1.9).setTint(0xffe066).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0).setDepth(940);
      const btn = this.add.image(0, 0, key).setDepth(950).setScale(0);
      pin(this, btn, 'tl', 150, 330 + i * 200);
      pin(this, glow, 'tl', 150, 330 + i * 200);
      this.tweens.add({ targets: btn, scale: 0.92, duration: 350, delay: i * 90, ease: 'Back.easeOut' });
      this.cats.push({ cat, btn, glow });
    });
    this.marker = this.add.image(0, 0, 'star').setDepth(990).setScale(0.55).setVisible(false);
    this.showCat('color', true);

    const go = button(this, 0, 0, 'mt_btn_go', () => this.toRace(), 0);
    pin(this, go, 'br', 200, 330);
    this.tweens.add({ targets: go, scale: 1, duration: 420, delay: 300, ease: 'Back.easeOut', onComplete: () => pulse(this, go) });
    this.go = go;
  }

  private showCat(cat: Cat, silent = false): void {
    if (!silent) sfx.select();
    this.cat = cat;
    for (const c of this.cats) {
      const on = c.cat === cat;
      c.glow.setAlpha(on ? 0.85 : 0);
      if (c.btn.scale > 0.1) this.tweens.add({ targets: c.btn, scale: on ? 1.05 : 0.86, duration: 160, ease: 'Back.easeOut' });
    }
    this.slots.forEach((s) => { s.frame.destroy(); s.art.forEach((a) => a.destroy()); s.q?.destroy(); });
    this.slots = [];
    const races = save.state.races;
    const open = unlocked(races)[cat];
    const ids: string[] = cat === 'color' ? COLORS.map((c) => c.id) : cat === 'wheel' ? WHEELS.map((w) => w.id) : [...STICKERS];
    ids.forEach((id, i) => {
      const isOpen = open.includes(id);
      const frame = this.add.image(0, SLOT_Y, 'mt_slot').setDepth(960).setScale(0);
      const art: Phaser.GameObjects.Image[] = [];
      if (cat === 'color') {
        art.push(this.add.image(0, SLOT_Y - 4, 'mt_swatch').setTint(hex(colorHex(id))).setDepth(961));
        art.push(this.add.image(0, SLOT_Y - 4, 'mt_swatch_hi').setDepth(962));
      } else if (cat === 'wheel') {
        art.push(this.add.image(0, SLOT_Y - 4, `mt_wheel_${id}`).setDepth(961));
      } else {
        art.push(this.add.image(0, SLOT_Y - 4, `mt_stk_${id}`).setDepth(961));
      }
      const base = cat === 'wheel' ? 0.6 : cat === 'sticker' ? (id === 'nessuno' ? 0.85 : 0.66) : 0.9;
      art.forEach((a) => { a.setScale(0); this.tweens.add({ targets: a, scale: base, duration: 260, delay: 40 * i, ease: 'Back.easeOut' }); });
      this.tweens.add({ targets: frame, scale: 0.92, duration: 260, delay: 40 * i, ease: 'Back.easeOut' });
      let q: Phaser.GameObjects.Text | undefined;
      if (!isOpen) {
        art.forEach((a) => a.setTint(0x4a4458).setAlpha(0.55));
        q = this.add.text(0, SLOT_Y, '?', { fontFamily: FONT, fontSize: '70px', fontStyle: '700', color: '#ffffff', stroke: '#c4621a', strokeThickness: 9 }).setOrigin(0.5).setDepth(963);
      }
      this.slots.push({ cat, id, x: 0, frame, art, open: isOpen, q });
    });
    this.placeSlots();
  }

  /** Riga delle scelte, centrata sotto il truck (si adatta allo schermo). */
  private placeSlots(): void {
    if (!this.slots.length) return;
    const v = view(this);
    const n = this.slots.length;
    const span = Math.min(SLOT_GAP, (Math.min(v.right - 380, 1720) - Math.max(v.left + 300, 300)) / Math.max(1, n - 1));
    const cx = 960 - 40;
    this.slots.forEach((s, i) => {
      const x = cx + (i - (n - 1) / 2) * span;
      s.x = x;
      s.frame.x = x;
      s.art.forEach((a) => { a.x = x; });
      if (s.q) s.q.x = x;
    });
    const cur = this.current(this.cat);
    const sel = this.slots.find((s) => s.id === cur);
    if (sel && this.marker) {
      this.tweens.killTweensOf(this.marker);
      this.marker.setVisible(true).setPosition(sel.x + 50, SLOT_Y - 62);
      this.tweens.add({ targets: this.marker, y: SLOT_Y - 76, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  private current(cat: Cat): string {
    const s = save.state, r = s.races;
    return cat === 'color' ? usable('color', s.color, r) : cat === 'wheel' ? usable('wheel', s.wheel, r) : usable('sticker', s.sticker, r);
  }

  private choose(slot: Slot): void {
    if (!slot.open) {
      sfx.locked();
      this.tweens.add({ targets: [slot.frame, ...slot.art], x: slot.x + 12, duration: 70, yoyo: true, repeat: 2, onComplete: () => { slot.frame.x = slot.x; slot.art.forEach((a) => { a.x = slot.x; }); } });
      return;
    }
    const tr = this.truck;
    this.tweens.add({ targets: slot.frame, scale: 1.05, duration: 90, yoyo: true, ease: 'Quad.easeOut' });
    if (slot.cat === 'color') {
      save.update({ color: slot.id });
      tr.setLook({ color: slot.id });
      sfx.paint();
      const c = hex(colorHex(slot.id));
      for (const [px, py] of [[90, 120], [210, 70], [340, 120]]) {
        const p = tr.bodyPoint(px, py);
        burst(this, p.x, p.y, 'dot', { count: 10, tints: [c, 0xffffff], speed: [120, 380], scale: [1.3, 0], gravity: 400, life: 700, depth: 200 });
      }
      this.tweens.add({ targets: tr, squash: 0.92, duration: 90, yoyo: true, ease: 'Quad.easeOut' });
    } else if (slot.cat === 'wheel') {
      save.update({ wheel: slot.id });
      tr.setLook({ wheel: slot.id });
      sfx.clank();
      const w = tr.wheelRest();
      for (const [x, y] of [[w.rx, w.ry], [w.fx, w.fy]]) burst(this, x, y, 'sparkle', { count: 8, tints: [0xffffff, 0xffe066], speed: [120, 300], scale: [0.8, 0], gravity: 0, life: 600, depth: 200 });
      this.tweens.add({ targets: tr, spin: tr.spin + 360, duration: 500, ease: 'Cubic.easeOut' });
      tr.kick(-150);
    } else {
      save.update({ sticker: slot.id });
      tr.setLook({ sticker: slot.id });
      sfx.sticker();
      const p = tr.bodyPoint(TF.stkX, TF.stkY);
      burst(this, p.x, p.y, 'sparkle', { count: 10, tints: [0xffffff, 0xffe066], speed: [120, 320], scale: [0.8, 0], gravity: 0, life: 600, depth: 200 });
      if (slot.id !== 'nessuno') {
        this.stickerPop = 0;
        this.tweens.addCounter({ from: 0, to: 1, duration: 300, ease: 'Back.easeOut', onUpdate: (tw) => { this.stickerPop = tw.getValue() ?? 1; } });
      }
    }
    this.placeSlots();
  }

  /** Scala dell'adesivo appena attaccato (animazione "ciaf"). */
  private stickerPop = 1;

  private toRace(): void {
    sfx.vroom();
    const id = nextTrack(save.state.races, save.state.raced, save.state.track);
    const tr = this.truck;
    this.hint.hide();
    this.tweens.add({ targets: tr, x: 2600, duration: 900, ease: 'Quad.easeIn' });
    this.time.delayedCall(500, () => goTo(this, 'monstertruck:Race', { track: id }));
  }

  private showHint(): void {
    const f = this.fixes.find((k) => !k.done);
    if (f) { const s = this.spot(f.id); this.hint.show(s.x, s.y); }
    else if (this.go) this.hint.show(this.go.x, this.go.y);
    this.lastAction = this.time.now;
  }

  update(time: number, delta: number): void {
    const dt = Math.min(0.05, delta / 1000);
    const tr = this.truck;
    tr.sync(dt);
    if (this.stickerPop < 1) tr.sticker.setScale(tr.sticker.scaleX * this.stickerPop, tr.sticker.scaleY * this.stickerPop);
    for (const m of this.mud) {
      if (!m.img.active) continue;
      const p = tr.bodyPoint(m.tx, m.ty);
      m.img.setPosition(p.x, p.y);
    }
    for (const f of this.fixes) {
      if (f.done) continue;
      const s = this.spot(f.id);
      f.bubble.setPosition(s.bx, s.by + Math.sin(time / 380 + f.ph) * 10);
    }
    if (!this.busy && !this.hint.visible && time - this.lastAction > IDLE_HINT_MS && (this.fixes.some((k) => !k.done) || this.go)) this.showHint();
  }

  // ---------------------------------------------------------------- per le prove (?debug=1)
  /** Ripara il prossimo guasto (test e catture). */
  autoFix(): boolean {
    const f = this.fixes.find((k) => !k.done);
    if (f && !this.busy) { this.repair(f); return true; }
    return false;
  }

  get state(): { open: number; ready: boolean; cat: string } {
    return { open: this.fixes.filter((f) => !f.done).length, ready: this.ready, cat: this.cat };
  }
}
