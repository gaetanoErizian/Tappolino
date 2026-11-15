import Phaser from 'phaser';
import { setupView, button, pin, burst, pulse, view, HintHand } from '../../../core/ui';
import { urlParam } from '../../../core/platform';
import { t } from '../../../core/i18n';
import { muteButton, goTo, title3d } from '../../../core/hud';
import { FONT } from '../../../core/brand';
import { sound } from '../../../core/sound';
import {
  BEDS, CLOUD_Y, FAIRY_IDS, PLOTS_LEFT_TO_RIGHT, PLOT_POS, TOTAL_PLOTS,
  bedFull, bedsOpen, bloomCount, currentBed, discoveredFlowers, emptyPlot, fairiesFor, fairyArriving, flowerById, gardenFull,
  plant, plotAt, thirstyNear, water, type FairyId, type Garden as GardenData,
} from '../logic';
import { drawMeadow, PlotView, CloudView, Butterfly, FairyView, FAIRY_SPOTS, floatingLabel, hex, type Firefly } from '../world';
import { save } from '../save';
import { sfx, playGiardinoMusic } from '../sfx';

const IDLE_HINT_MS = 5000;

/**
 * L'aiuola: un tocco sulla terra pianta un seme, un tocco sulla nuvola lo fa bere e crescere.
 * I fiori sbocciati cantano, arrivano le farfalle e, ogni tanto, una fatina nuova.
 * Quando l'aiuola è piena si fa festa e si apre quella accanto.
 */
export class Garden extends Phaser.Scene {
  bed = 0;
  private plots: PlotView[] = [];
  private cloud!: CloudView;
  private flies: Firefly[] = [];
  private butterflies: Butterfly[] = [];
  private fairies: FairyView[] = [];
  private slots: Phaser.GameObjects.Image[] = [];
  private hint!: HintHand;
  private nextBtn?: Phaser.GameObjects.Image;
  private lastAction = 0;
  /** festa o arrivo di una fatina in corso: i tocchi rispondono, ma niente nuove cose da fare */
  celebrating = false;

  constructor() { super('giardino:Garden'); }

  get garden(): GardenData { return save.state.garden; }

  create(data: { bed?: number }): void {
    const g = this.garden;
    const want = Number.isInteger(data?.bed) ? Number(data.bed) : currentBed(g);
    this.bed = Phaser.Math.Clamp(want, 0, bedsOpen(g) - 1);
    this.plots = [];
    this.butterflies = [];
    this.fairies = [];
    this.slots = [];
    this.nextBtn = undefined;
    this.celebrating = false;
    this.lastAction = this.time.now;

    setupView(this, (v) => this.slots.forEach((s, i) => { s.y = v.top + 66; void i; }));
    this.cameras.main.fadeIn(250, 143, 211, 255);
    playGiardinoMusic();
    this.flies = drawMeadow(this, this.bed);

    g[this.bed].forEach((pl, i) => this.plots.push(new PlotView(this, i, pl)));
    this.plots.forEach((p) => p.setThirsty(p.plot.s > 0 && p.plot.s < 4));
    const firstThirsty = thirstyNear(g, this.bed, 960);
    this.cloud = new CloudView(this, firstThirsty >= 0 ? PLOT_POS[firstThirsty].x : 960);

    // farfalle dei fiori di questa aiuola, fatine già arrivate
    this.plots.forEach((p) => { if (p.plot.s === 4 && p.plot.f) this.addButterfly(p, false); });
    const nf = fairiesFor(bloomCount(g));
    for (let k = 0; k < nf; k++) this.addFairy(FAIRY_IDS[k]);
    this.time.addEvent({ delay: 2600, loop: true, callback: () => { const f = Phaser.Utils.Array.GetRandom(this.fairies); f?.roam(); } });

    this.buildSlots();
    this.hint = new HintHand(this);

    const home = button(this, 0, 0, 'btn_home', () => goTo(this, 'giardino:Menu'), 0.85);
    pin(this, home, 'tl', 80, 80);
    muteButton(this);
    if (this.bed > 0) {
      const back = button(this, 0, 0, 'btn_back', () => this.goBed(this.bed - 1), 0.75);
      pin(this, back, 'bl', 110, 110);
    }
    if (this.bed + 1 < bedsOpen(g)) this.showNext(false);

    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length) return;
      this.onTap(p.worldX, p.worldY);
    });
    this.time.addEvent({ delay: 500, loop: true, callback: () => this.idleCheck() });
    if (urlParam('debug')) Object.assign(window, { __gi: this, __sound: sound });

    if (!save.state.tutorialDone && emptyPlot(g, this.bed) >= 0) this.time.delayedCall(1200, () => this.showHint());
  }

  // =================================================================
  // Tocchi
  // =================================================================
  private onTap(x: number, y: number): void {
    this.lastAction = this.time.now;
    this.hint.hide();
    if (this.cloud.hit(x, y)) { this.tapCloud(); return; }
    const fairy = this.fairies.find((f) => f.hit(x, y));
    if (fairy) { fairy.twirl(); return; }
    const bf = this.butterflies.find((b) => b.hit(x, y));
    if (bf) { bf.flutter(); return; }
    const i = plotAt(this.garden, this.bed, x, y);
    if (i >= 0) { this.tapPlot(i); return; }
    const fly = this.flies.find((f) => Phaser.Math.Distance.Between(x, y, f.img.x, f.img.y) < 70);
    if (fly) {
      sfx.twinkle();
      burst(this, fly.img.x, fly.img.y, 'sparkle', { count: 8, tints: [0xfff3a0, 0xffffff], speed: [80, 220], scale: [0.45, 0], gravity: 0, life: 600, depth: 760 });
      return;
    }
    burst(this, x, y, 'sparkle', { count: 6, tints: [0xffffff, 0xd6f7b0, 0xfff3a0], speed: [80, 220], scale: [0.45, 0], gravity: 0, life: 500, depth: 760 });
  }

  private tapPlot(i: number): void {
    const pv = this.plots[i];
    const pl = this.garden[this.bed][i];
    if (pl.s === 0) { this.plantAt(i); return; }
    if (pl.s < 4) {
      pv.ask();
      this.cloud.squish();
      this.time.delayedCall(250, () => { if (!this.hint.visible) this.hint.show(this.cloud.x, CLOUD_Y + 20); });
      return;
    }
    pv.sing();
  }

  /** Pianta un seme: cade con la scia di luce, la terra si gonfia, compare il fumetto della sete. */
  private plantAt(i: number): void {
    const res = plant(this.garden, this.bed, i, save.state.last);
    if (!res) return;
    save.update({ garden: res.garden, last: res.flower });
    const pv = this.plots[i];
    pv.dropSeed(() => {
      sfx.plant();
      pv.set(res.garden[this.bed][i]);
      burst(this, pv.x, pv.y - 60 * pv.s, 'dot', { count: 10, tints: [0xc98a55, 0x8a5424, 0xfff3a0], speed: [100, 260], scale: [0.6, 0], gravity: 700, life: 500, depth: 700 });
      if (!save.state.tutorialDone) this.time.delayedCall(600, () => this.hint.show(this.cloud.x, CLOUD_Y + 20));
    });
  }

  /** Tocco sulla nuvola: piove sulla piantina assetata più vicina, che cresce di un passo. */
  private tapCloud(): void {
    if (this.cloud.busy) { this.cloud.squish(); return; }
    const i = thirstyNear(this.garden, this.bed, this.cloud.x);
    if (i < 0) {
      this.cloud.sprinkle();
      const e = emptyPlot(this.garden, this.bed);
      if (e >= 0 && !this.celebrating) this.time.delayedCall(400, () => this.hint.show(PLOT_POS[e].x, PLOT_POS[e].y - 50 * PLOT_POS[e].s));
      return;
    }
    const pv = this.plots[i];
    this.cloud.rainOn(pv.x, pv.y - 40 * pv.s, () => this.grow(i), () => { this.lastAction = this.time.now; });
  }

  private grow(i: number): void {
    const res = water(this.garden, this.bed, i);
    if (!res) return;
    const before = discoveredFlowers(this.garden);
    save.update({ garden: res.garden });
    const pv = this.plots[i];
    pv.set(res.garden[this.bed][i]);
    if (!res.bloomed) {
      sfx.grow(res.stage);
      burst(this, pv.x, pv.top, 'sparkle', { count: 8, tints: [0xffffff, 0xd6f7b0], speed: [80, 220], scale: [0.5, 0], gravity: 0, life: 600, depth: 760 });
      return;
    }
    this.onBloom(pv, before);
  }

  // =================================================================
  // Fiore sbocciato, fatine, aiuola piena
  // =================================================================
  private onBloom(pv: PlotView, before: string[]): void {
    const f = pv.plot.f;
    if (!f) return;
    sfx.bloom();
    this.time.delayedCall(450, () => pv.sing(0.6));
    const h = pv.head;
    const tint = hex(flowerById(f).glow);
    burst(this, h.x, h.y, 'sparkle', { count: 22, tints: [0xffffff, tint, 0xfff3a0], speed: [180, 480], scale: [0.7, 0], gravity: 60, life: 1000, depth: 760 });
    burst(this, h.x, h.y, 'confetti', { count: 14, tints: [tint, 0xffffff], speed: [160, 380], scale: [0.7, 0.3], gravity: 420, life: 1300, depth: 760 });
    this.refreshSlot(pv.i, true);
    if (!before.includes(f)) this.time.delayedCall(600, () => floatingLabel(this, h.x, h.y - 150 * pv.s, t(`giardino.flower.${f}`), FONT, '#4f9e3a'));
    this.time.delayedCall(700, () => this.addButterfly(pv, true));
    if (!save.state.tutorialDone) save.update({ tutorialDone: true });

    const blooms = bloomCount(this.garden);
    const fairy = fairyArriving(blooms);
    const full = bedFull(this.garden, this.bed);
    if (fairy || full) this.celebrating = true;
    let wait = 900;
    if (fairy) {
      this.time.delayedCall(wait, () => this.fairyArrives(fairy));
      wait += 2700;
    }
    if (full) this.time.delayedCall(wait, () => this.celebrateBed());
    else if (fairy) this.time.delayedCall(wait, () => { this.celebrating = false; });
  }

  private fairyArrives(id: FairyId): void {
    const fv = this.addFairy(id);
    fv.arrive(() => {
      floatingLabel(this, fv.c.x, fv.c.y - 130, t(`giardino.fairy.${id}`), FONT, '#7d55c8');
    });
  }

  /** Aiuola piena: i fiori cantano in fila, fatine in festa; poi si apre l'aiuola accanto. */
  celebrateBed(): void {
    this.celebrating = true;
    this.hint.hide();
    sfx.bedDone();
    PLOTS_LEFT_TO_RIGHT.forEach((i, k) => this.time.delayedCall(500 + k * 230, () => {
      const pv = this.plots[i];
      pv.sing(0.55);
      const h = pv.head;
      burst(this, h.x, h.y, 'sparkle', { count: 10, tints: [0xffffff, 0xfff3a0], speed: [120, 320], scale: [0.6, 0], gravity: 0, life: 800, depth: 760 });
    }));
    this.fairies.forEach((f, k) => this.time.delayedCall(700 + k * 200, () => f.twirl(k === 0)));
    const done = gardenFull(this.garden);
    this.time.delayedCall(2300, () => {
      const lbl = title3d(this, 960, 200, t(done ? 'giardino.gardenDone' : 'giardino.bedDone'), done ? 84 : 100).setScale(0).setDepth(960);
      this.tweens.add({ targets: lbl, scale: 1, duration: 450, ease: 'Back.easeOut' });
      this.tweens.add({ targets: lbl, alpha: 0, duration: 500, delay: 3000, onComplete: () => lbl.destroy() });
      burst(this, 960, 260, 'confetti', { count: 40, tints: [0xff8fb8, 0xffe36a, 0x8ade6a, 0x7fd1ff, 0xb58cf0], speed: [300, 700], scale: [0.9, 0.4], gravity: 650, life: 1600, depth: 955 });
      burst(this, 960, 260, 'star', { count: 10, speed: [250, 520], scale: [0.5, 0.1], gravity: 400, life: 1300, depth: 955 });
    });
    this.time.delayedCall(3200, () => {
      this.celebrating = false;
      if (this.bed + 1 < BEDS) this.showNext(true);
    });
  }

  private showNext(fresh: boolean): void {
    if (this.nextBtn) return;
    const b = button(this, 0, 0, 'btn_next', () => this.goBed(this.bed + 1), 0.8);
    pin(this, b, 'br', 150, 130);
    this.nextBtn = b;
    if (fresh) {
      b.setScale(0);
      this.tweens.add({ targets: b, scale: 0.8, duration: 400, ease: 'Back.easeOut', onComplete: () => pulse(this, b) });
    }
  }

  goBed(b: number): void {
    if (b < 0 || b >= bedsOpen(this.garden)) return;
    sfx.page();
    goTo(this, 'giardino:Garden', { bed: b });
  }

  private addButterfly(pv: PlotView, arrive: boolean): void {
    if (!pv.plot.f) return;
    const h = pv.head;
    this.butterflies.push(new Butterfly(this, pv.plot.f, { x: h.x + (pv.i % 2 ? 90 : -90), y: h.y - 70 }, arrive));
  }

  private addFairy(id: FairyId): FairyView {
    const k = FAIRY_IDS.indexOf(id);
    const fv = new FairyView(this, id, FAIRY_SPOTS[k % FAIRY_SPOTS.length]);
    this.fairies.push(fv);
    return fv;
  }

  // =================================================================
  // In alto: i 7 vasi dell'aiuola (pallino = da far fiorire, fiorellino = sbocciato)
  // =================================================================
  private buildSlots(): void {
    const top = view(this).top;
    this.garden[this.bed].forEach((_, i) => {
      const x = 960 + (i - 3) * 76;
      const s = this.add.image(x, top + 66, 'gi_slot').setDepth(900).setScale(0.9);
      this.slots.push(s);
      this.refreshSlot(i, false);
    });
  }

  private refreshSlot(i: number, anim: boolean): void {
    const s = this.slots[i];
    const pl = this.garden[this.bed][i];
    if (!s) return;
    if (pl.s === 4 && pl.f) {
      s.setTexture(`gi_fl_${pl.f}`).setOrigin(0.5, 130 / 420).setScale(anim ? 0 : 0.2);
      if (anim) {
        this.tweens.add({ targets: s, scale: 0.2, duration: 400, ease: 'Back.easeOut' });
        burst(this, s.x, s.y, 'sparkle', { count: 8, tints: [0xffffff, 0xfff3a0], speed: [80, 200], scale: [0.4, 0], gravity: 0, life: 500, depth: 950 });
      }
    } else {
      s.setTexture('gi_slot').setOrigin(0.5).setScale(0.9);
    }
  }

  // =================================================================
  // Manina d'aiuto: cosa fare adesso
  // =================================================================
  private showHint(): void {
    if (this.celebrating) return;
    const g = this.garden;
    if (thirstyNear(g, this.bed, this.cloud.x) >= 0) { this.hint.show(this.cloud.x, CLOUD_Y + 20); return; }
    const e = emptyPlot(g, this.bed);
    if (e >= 0) { const p = PLOT_POS[e]; this.hint.show(p.x, p.y - 50 * p.s); return; }
    if (this.nextBtn) this.hint.show(this.nextBtn.x, this.nextBtn.y);
  }

  private idleCheck(): void {
    if (this.hint.visible || this.cloud.busy || this.celebrating) return;
    if (this.time.now - this.lastAction > IDLE_HINT_MS) this.showHint();
  }

  // =================================================================
  // Per i test automatici e le catture degli store (?debug=1)
  // =================================================================
  /** Fa la prossima mossa utile: pianta nella terra vuota oppure tocca la nuvola. */
  autoStep(): void {
    if (this.cloud.busy) return;
    const g = this.garden;
    if (thirstyNear(g, this.bed, this.cloud.x) >= 0) { this.onTap(this.cloud.x, CLOUD_Y); return; }
    const e = emptyPlot(g, this.bed);
    if (e >= 0) { const p = PLOT_POS[e]; this.onTap(p.x, p.y - 30); }
  }

  get busy(): boolean { return this.cloud.busy || this.celebrating; }
  get state(): { bed: number; blooms: number; total: number; fairies: number; hint: boolean } {
    return { bed: this.bed, blooms: bloomCount(this.garden), total: TOTAL_PLOTS, fairies: this.fairies.length, hint: this.hint.visible };
  }
}
