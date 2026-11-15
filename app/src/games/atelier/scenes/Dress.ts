import Phaser from 'phaser';
import { setupView, button, pin, burst, pulse, view } from '../../../core/ui';
import { urlParam } from '../../../core/platform';
import { muteButton, goTo } from '../../../core/hud';
import { DragManager, Hint, type DragItem } from '../../../core/drag';
import { HintHand } from '../../../core/ui';
import {
  CATEGORIES, DOLL_AT, BGS, itemsOf, itemById, unlockedItems, toggleItem, canShow, wornCount, isWorn, onDoll, slotPos, pickChar, emptyLook,
  type BgId, type Category, type ItemId, type Look,
} from '../logic';
import { PART_BOX } from '../dollArt';
import { drawAtelier, pedestal, Doll } from '../world';
import { save } from '../save';
import { sfx, playAtelierMusic } from '../sfx';

const TAB_X = 150;
const TAB_Y = [300, 480, 660, 840];
const SHOW_BTN = { x: 1790, y: 860 };
const IDLE_HINT_MS = 6000;
/** spazio utile dentro la vetrina */
const FIT_W = 150, FIT_H = 168;

interface Card { id: ItemId; card: Phaser.GameObjects.Image; star?: Phaser.GameObjects.Image; drag?: DragItem; gift?: Phaser.GameObjects.Image; x: number; y: number }

/**
 * L'atelier: il personaggio sta sulla pedana davanti allo specchio; ai lati le vetrine del guardaroba,
 * a sinistra le quattro categorie (abiti, copricapi, scarpe, accessori). Si trascina un capo sul personaggio
 * (oppure lo si tocca e vola da solo); toccando un capo già indossato lo si toglie. I capi ancora da
 * scoprire sono pacchi regalo. Con la freccia si sceglie lo sfondo e si va in sfilata.
 */
export class Dress extends Phaser.Scene {
  look!: Look;
  private doll!: Doll;
  private drag!: DragManager;
  private hint!: Hint;
  private tapHint!: HintHand;
  private cat: Category = 'dress';
  private cards: Card[] = [];
  private tabs: Phaser.GameObjects.Image[] = [];
  private tabGlow!: Phaser.GameObjects.Image;
  private showBtn!: Phaser.GameObjects.Image;
  private owned = new Set<ItemId>();
  private lastAction = 0;
  private flying = 0;
  private chooser: Phaser.GameObjects.GameObject[] = [];
  /** true mentre si sceglie lo sfondo o si parte per la sfilata */
  busy = false;

  constructor() { super('atelier:Dress'); }

  create(data: { char?: string; look?: Look }): void {
    const char = pickChar(data?.char ?? data?.look?.char, save.state.shows);
    this.look = data?.look ? { ...data.look, char } : emptyLook(char);
    this.owned = unlockedItems(save.state.shows);
    this.cards = [];
    this.tabs = [];
    this.chooser = [];
    this.busy = false;
    this.flying = 0;
    this.cat = 'dress';
    this.lastAction = this.time.now;

    setupView(this);
    this.cameras.main.fadeIn(250, 143, 211, 255);
    playAtelierMusic();
    drawAtelier(this, { mirror: true });
    pedestal(this, DOLL_AT.x, DOLL_AT.y + 6, 1, 30);
    this.doll = new Doll(this, this.look, DOLL_AT.x, DOLL_AT.y, DOLL_AT.scale, { depth: 40 });

    // la manina e il trascinamento prima del listener di scena (così sa se un tocco ha preso un capo)
    this.hint = new Hint(this);
    this.tapHint = new HintHand(this);
    this.drag = new DragManager(this, {
      onDrop: (it, x, y) => this.onDrop(it, x, y),
      onTap: (it) => this.onTapItem(it),
      onPick: () => { sfx.pick(); this.hideHints(); this.lastAction = this.time.now; },
    }, 125);

    const home = button(this, 0, 0, 'btn_home', () => goTo(this, 'atelier:Pick'), 0.85);
    pin(this, home, 'tl', 80, 80);
    muteButton(this);

    // categorie
    this.tabGlow = this.add.image(TAB_X, TAB_Y[0], 'glow').setScale(1.6).setTint(0xfff3c4).setAlpha(0.8).setBlendMode(Phaser.BlendModes.ADD).setDepth(990);
    CATEGORIES.forEach((c, i) => {
      const b = button(this, TAB_X, TAB_Y[i], `at_tab_${c}`, () => this.selectCat(c), 0.8);
      this.tabs.push(b);
    });
    this.showBtn = button(this, SHOW_BTN.x, SHOW_BTN.y, 'btn_next', () => this.openChooser(), 1).setAlpha(0).setVisible(false);
    this.selectCat('dress', true);
    this.refreshShow();

    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length || this.drag.dragging || this.busy) return;
      this.lastAction = this.time.now;
      const gift = this.cards.find((c) => c.gift && Phaser.Math.Distance.Between(p.worldX, p.worldY, c.x, c.y) < 120);
      if (gift?.gift) {
        sfx.gift();
        this.tweens.add({ targets: gift.gift, x: gift.x + 9, duration: 60, yoyo: true, repeat: 3, onComplete: () => gift.gift?.setX(gift.x) });
        return;
      }
      if (this.doll.hit(p.worldX, p.worldY)) {
        this.doll.giggle();
        sfx.hop();
        burst(this, p.worldX, p.worldY - 30, 'heart', { count: 4, speed: [120, 260], scale: [0.6, 0.2], gravity: -120, life: 900, depth: 900 });
        return;
      }
      burst(this, p.worldX, p.worldY, 'sparkle', { count: 5, tints: [0xffffff, 0xffc2dc], speed: [80, 200], scale: [0.4, 0], gravity: 0, life: 450, depth: 900 });
    });
    this.time.addEvent({ delay: 500, loop: true, callback: () => this.idleCheck() });
    if (urlParam('debug')) Object.assign(window, { __at: this });

    this.doll.c.y += 30;
    this.doll.c.alpha = 0;
    this.tweens.add({ targets: this.doll.c, y: DOLL_AT.y, alpha: 1, duration: 420, ease: 'Back.easeOut', onComplete: () => this.doll.giggle() });
    if (!save.state.tutorialDone) this.time.delayedCall(1100, () => this.showHint());
  }

  // =================================================================
  // Categorie e vetrine
  // =================================================================
  selectCat(c: Category, instant = false): void {
    if (this.busy) return;
    if (!instant) sfx.tab();
    this.cat = c;
    this.lastAction = this.time.now;
    this.hideHints();
    const i = CATEGORIES.indexOf(c);
    this.tabs.forEach((t, k) => { this.tweens.add({ targets: t, scale: k === i ? 0.95 : 0.74, alpha: k === i ? 1 : 0.85, duration: 180 }); });
    this.tweens.add({ targets: this.tabGlow, y: TAB_Y[i], duration: 180, ease: 'Quad.easeOut' });
    this.buildShelf(instant);
  }

  private buildShelf(instant: boolean): void {
    for (const c of this.cards) { c.card.destroy(); c.drag?.obj.destroy(); c.gift?.destroy(); c.star?.destroy(); }
    this.cards = [];
    this.drag.clear();
    const list = itemsOf(this.cat);
    list.forEach((item, i) => {
      const { x, y } = slotPos(i, list.length);
      const worn = isWorn(this.look, item.id);
      const card = this.add.image(x, y, worn ? 'at_slot_on' : 'at_slot').setDepth(500).setScale(0.88);
      const entry: Card = { id: item.id, card, x, y };
      if (this.owned.has(item.id)) {
        const key = `at_item_${item.id}`;
        const [, , w, h] = PART_BOX[key];
        const s = Math.min(FIT_W / w, FIT_H / h, 0.95);
        const img = this.add.image(x, y - 4, key).setDepth(520).setScale(s);
        entry.drag = this.drag.add(img, item.id);
        if (worn) entry.star = this.add.image(x + 70, y - 82, 'star').setDepth(530).setScale(0.42);
      } else {
        entry.gift = this.add.image(x, y + 4, 'at_gift').setDepth(520).setScale(0.62);
      }
      this.cards.push(entry);
      if (!instant) {
        const objs = [card, entry.drag?.obj, entry.gift, entry.star].filter(Boolean) as Phaser.GameObjects.Image[];
        for (const o of objs) {
          const s = o.scale;
          o.setScale(0);
          this.tweens.add({ targets: o, scale: s, duration: 260, delay: i * 35, ease: 'Back.easeOut' });
        }
      }
    });
  }

  /** Aggiorna le vetrine dopo un cambio di look (cornice rosa e stellina sui capi indossati). */
  private refreshCards(): void {
    for (const c of this.cards) {
      if (!c.drag) continue;
      const worn = isWorn(this.look, c.id);
      c.card.setTexture(worn ? 'at_slot_on' : 'at_slot');
      if (worn && !c.star) {
        c.star = this.add.image(c.x + 70, c.y - 82, 'star').setDepth(530).setScale(0);
        this.tweens.add({ targets: c.star, scale: 0.42, duration: 300, ease: 'Back.easeOut' });
      } else if (!worn && c.star) {
        c.star.destroy();
        c.star = undefined;
      }
    }
  }

  private refreshShow(): void {
    const ok = canShow(this.look);
    if (ok && !this.showBtn.visible) {
      this.showBtn.setVisible(true).setScale(0);
      this.tweens.add({ targets: this.showBtn, alpha: 1, scale: 1, duration: 360, ease: 'Back.easeOut', onComplete: () => pulse(this, this.showBtn) });
    } else if (!ok && this.showBtn.visible) {
      this.tweens.killTweensOf(this.showBtn);
      this.showBtn.setVisible(false).setAlpha(0).setScale(1);
    }
  }

  // =================================================================
  // Trascinamenti e tocchi
  // =================================================================
  private onDrop(it: DragItem, x: number, y: number): boolean {
    if (this.busy) return false;
    if (!onDoll(x, y)) { sfx.back(); return false; }
    const id = it.id as ItemId;
    if (isWorn(this.look, id)) {
      // già addosso: torna in vetrina, il personaggio sorride
      this.doll.giggle();
      return false;
    }
    this.putOn(it, false);
    return true;
  }

  private onTapItem(it: DragItem): void {
    if (this.busy) return;
    const id = it.id as ItemId;
    if (isWorn(this.look, id)) this.takeOff(id);
    else this.putOn(it, true);
  }

  /** Il capo vola dalla vetrina (o dal dito) al suo posto sul personaggio. */
  private putOn(it: DragItem, fromTap: boolean): void {
    const id = it.id as ItemId;
    const item = itemById(id)!;
    const res = toggleItem(this.look, id);
    this.look = res.look;
    this.lastAction = this.time.now;
    this.hideHints();
    if (!save.state.tutorialDone) save.update({ tutorialDone: true });
    const target = this.doll.slotPoint(item.slot, id);
    const o = it.obj;
    it.enabled = false;
    this.flying++;
    o.setDepth(1300);
    if (fromTap) sfx.swish();
    this.tweens.add({
      targets: o, x: target.x, y: target.y, scale: DOLL_AT.scale, duration: fromTap ? 380 : 200, ease: 'Quad.easeOut',
      onComplete: () => {
        this.flying--;
        this.doll.wear(item.slot, id);
        sfx.wear(wornCount(this.look) - 1);
        if (!fromTap) sfx.swish();
        this.doll.face('happy', 'open', 800);
        burst(this, target.x, target.y, 'sparkle', { count: 12, tints: [0xffffff, 0xffd04d, 0xff9cc6], speed: [150, 380], scale: [0.7, 0], gravity: 0, life: 650, depth: 1310 });
        // la vetrina si riempie di nuovo
        o.setPosition(it.homeX, it.homeY).setScale(0).setDepth(it.baseDepth);
        this.tweens.add({ targets: o, scale: it.baseScale, duration: 300, ease: 'Back.easeOut' });
        it.enabled = true;
        this.refreshCards();
        this.refreshShow();
      },
    });
  }

  private takeOff(id: ItemId): void {
    const item = itemById(id)!;
    const from = this.doll.slotPoint(item.slot, id);
    this.look = toggleItem(this.look, id).look;
    this.doll.wear(item.slot, undefined);
    sfx.off();
    this.doll.face('open', 'o', 500);
    burst(this, from.x, from.y, 'sparkle', { count: 8, tints: [0xffffff, 0xffc2dc], speed: [100, 260], scale: [0.5, 0], gravity: 0, life: 500, depth: 1310 });
    this.lastAction = this.time.now;
    this.refreshCards();
    this.refreshShow();
  }

  // =================================================================
  // Scelta dello sfondo e partenza per la sfilata
  // =================================================================
  openChooser(): void {
    if (this.busy || this.flying || !canShow(this.look)) return;
    this.busy = true;
    this.drag.enabled = false;
    this.hideHints();
    sfx.choose();
    const v = view(this);
    const dim = this.add.rectangle(v.left, v.top, v.right - v.left, v.bottom - v.top, 0x3a1a2a, 0.55).setOrigin(0).setDepth(1600).setAlpha(0).setInteractive();
    this.tweens.add({ targets: dim, alpha: 1, duration: 200 });
    dim.on('pointerdown', () => this.closeChooser());
    this.chooser.push(dim);
    BGS.forEach((bg, i) => {
      const x = 960 + (i - 1) * 520, y = 540;
      const th = this.add.image(x, y, `at_thumb_${bg}`).setDepth(1610).setScale(0).setInteractive({ useHandCursor: true });
      const fr = this.add.image(x, y, 'at_frame').setDepth(1611).setScale(0);
      this.tweens.add({ targets: th, scale: 1.4, duration: 320, delay: 80 + i * 90, ease: 'Back.easeOut' });
      this.tweens.add({ targets: fr, scale: 1.4, duration: 320, delay: 80 + i * 90, ease: 'Back.easeOut' });
      th.on('pointerdown', () => this.chooseBg(bg, th, fr));
      this.chooser.push(th, fr);
    });
    if (!save.state.album.length) this.time.delayedCall(700, () => { if (this.chooser.length) this.tapHint.show(960 - 520, 560); });
  }

  private closeChooser(): void {
    this.tapHint.hide();
    for (const o of this.chooser) o.destroy();
    this.chooser = [];
    this.busy = false;
    this.drag.enabled = true;
    this.lastAction = this.time.now;
  }

  chooseBg(bg: BgId, th?: Phaser.GameObjects.Image, fr?: Phaser.GameObjects.Image): void {
    if (!this.busy || !this.chooser.length) return;
    this.tapHint.hide();
    sfx.sparkle();
    const look: Look = { ...this.look, bg };
    if (th && fr) {
      this.tweens.add({ targets: [th, fr], scale: 1.6, duration: 160, yoyo: true });
      burst(this, th.x, th.y, 'sparkle', { count: 18, tints: [0xffffff, 0xffd04d, 0xff9cc6], speed: [200, 500], scale: [0.8, 0], gravity: 0, life: 800, depth: 1700 });
    }
    this.chooser.forEach((o) => o.disableInteractive());
    this.time.delayedCall(450, () => goTo(this, 'atelier:Show', { look }));
  }

  // =================================================================
  // Manina d'aiuto: alla prima partita subito, poi dopo qualche secondo senza azioni
  // =================================================================
  private hideHints(): void { this.hint.hide(); this.tapHint.hide(); }

  private idleCheck(): void {
    if (this.busy || this.flying || this.drag.dragging || this.hint.visible || this.tapHint.visible) return;
    if (this.time.now - this.lastAction > IDLE_HINT_MS) this.showHint();
  }

  private showHint(): void {
    if (this.busy || this.drag.dragging) return;
    this.lastAction = this.time.now;
    if (wornCount(this.look) >= 3 && this.showBtn.visible) { this.tapHint.show(SHOW_BTN.x, SHOW_BTN.y); return; }
    const free = this.cards.find((c) => c.drag && c.drag.enabled && !isWorn(this.look, c.id));
    if (free?.drag) {
      const item = itemById(free.id)!;
      const t = this.doll.slotPoint(item.slot, free.id);
      this.hint.drag(free.drag.obj.x, free.drag.obj.y - 30, t.x, t.y);
      return;
    }
    // tutto indossato in questa categoria: la manina indica la categoria successiva
    const next = (CATEGORIES.indexOf(this.cat) + 1) % CATEGORIES.length;
    this.tapHint.show(TAB_X, TAB_Y[next]);
  }

  // =================================================================
  // Solo test automatici (?debug=1)
  // =================================================================
  /** Mette il primo capo disponibile non ancora indossato della categoria corrente (come un tocco). */
  autoStep(): string {
    if (this.busy || this.flying) return 'busy';
    const free = this.cards.find((c) => c.drag && c.drag.enabled && !isWorn(this.look, c.id));
    if (!free?.drag) return 'none';
    this.onTapItem(free.drag);
    return free.id;
  }

  /** Mette un capo preciso (deve essere nella categoria corrente e già nel guardaroba). */
  wearId(id: ItemId): boolean {
    const c = this.cards.find((x) => x.id === id && x.drag);
    if (!c?.drag || this.busy || isWorn(this.look, id)) return false;
    this.onTapItem(c.drag);
    return true;
  }
}
