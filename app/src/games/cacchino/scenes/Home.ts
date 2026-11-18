import Phaser from 'phaser';
import { setupView, button, burst, type View } from '../../../core/ui';
import { muteButton, homeButton, title3d, goTo } from '../../../core/hud';
import { DragManager, Hint, type DragItem } from '../../../core/drag';
import { FONT } from '../../../core/brand';
import { t } from '../../../core/i18n';
import { urlParam } from '../../../core/platform';
import { sound } from '../../../core/sound';
import { backToHub } from '../../../launcher';
import {
  NEEDS, ROOM_LEVEL, NEED_ROOM, FRIENDS, WEARS, MAX_HEARTS, ACTIVITY_PUZZLE, tick, mood, urgent, levelOf, stageOf, feed, fart, complete, buyFood, tapWear,
  sleep, cheer, playKind, roomOpen, friendOpen, shopFoods, foodById, fartSize, type Game, type Need, type Room, type Activity, type PuzzleKind, type Outcome,
} from '../logic';
import { save } from '../save';
import { CacchinoView } from '../cacchino';
import { sfx, playCacchinoMusic } from '../sfx';

const PET = { x: 960, y: 852 };
const IDLE_HINT_MS = 6500;
type Mode = 'idle' | 'busy' | 'scrub' | 'tray' | 'panel';
interface Prop { img: Phaser.GameObjects.Image; act: string; friend?: string; extra: Phaser.GameObjects.GameObject[] }
interface Gauge { need: Need; x: number; pill: Phaser.GameObjects.Image; icon: Phaser.GameObjects.Image }
export interface HomeData { room?: Room; done?: { act: Activity; kind: PuzzleKind; friend?: string } }

const ROOM_PROPS: Record<Room, { key: string; x: number; y: number; act: string; s?: number }[]> = {
  kitchen: [{ key: 'pp_fridge', x: 330, y: 812, act: 'fridge' }, { key: 'pp_stove', x: 1590, y: 812, act: 'cook' }],
  bath: [{ key: 'pp_potty', x: 350, y: 822, act: 'potty' }, { key: 'pp_tub', x: 1560, y: 840, act: 'bath', s: 0.95 }],
  bedroom: [{ key: 'pp_bed', x: 400, y: 842, act: 'sleep', s: 0.95 }, { key: 'pp_wardrobe', x: 1620, y: 812, act: 'wardrobe', s: 0.95 }],
  school: [{ key: 'pp_board', x: 420, y: 842, act: 'school' }],
  park: [{ key: 'pp_ball', x: 610, y: 900, act: 'ball' }],
};
const FRIEND_AT: Record<string, number> = { roll: 330, soap: 1420, plunger: 1730 };
const TABS: (Room | 'shop')[] = ['kitchen', 'bath', 'bedroom', 'park', 'school', 'shop'];

/**
 * La casa di Cacchino: cinque stanze, i bisogni in alto, le stanze in basso. Si tocca un mobile per fare un'attività
 * (quelle importanti passano da un rompicapo), si tocca Cacchino per farlo ridere... o per fargli fare una puzzetta.
 */
export class Home extends Phaser.Scene {
  private g!: Game;
  private room: Room = 'kitchen';
  private mode: Mode = 'idle';
  private pet!: CacchinoView;
  private bg!: Phaser.GameObjects.Image;
  private props: Prop[] = [];
  private gauges: Gauge[] = [];
  private arcs!: Phaser.GameObjects.Graphics;
  private levelPill!: Phaser.GameObjects.Image;
  private levelText!: Phaser.GameObjects.Text;
  private coinTag!: Phaser.GameObjects.Image;
  private coinIcon!: Phaser.GameObjects.Image;
  private coinText!: Phaser.GameObjects.Text;
  private tabs: { id: Room | 'shop'; btn: Phaser.GameObjects.Image; lock?: Phaser.GameObjects.GameObject[] }[] = [];
  private tabGlow!: Phaser.GameObjects.Image;
  private bubble!: Phaser.GameObjects.Container;
  private bubbleIcon!: Phaser.GameObjects.Image;
  private night!: Phaser.GameObjects.Rectangle;
  private flies: Phaser.GameObjects.Image[] = [];
  private drag!: DragManager;
  private hint!: Hint;
  private tray: Phaser.GameObjects.GameObject[] = [];
  private panel: Phaser.GameObjects.GameObject[] = [];
  private sponge!: Phaser.GameObjects.Image;
  private foam: Phaser.GameObjects.Image[] = [];
  private scrub = { acc: 0, from: 0, last: 0 };
  private cleanShown: number | null = null;
  private lastAction = 0;
  private lastGiggle = 0;
  private ticks = 0;
  private v!: View;

  constructor() { super('cacchino:Home'); }

  create(data: HomeData): void {
    this.g = { ...(save.state as Game) };
    const level = levelOf(this.g.xp).level;
    this.room = data?.room && roomOpen(data.room, level) ? data.room : 'kitchen';
    this.mode = 'idle';
    this.props = []; this.gauges = []; this.tabs = []; this.flies = []; this.tray = []; this.panel = []; this.foam = [];
    this.cleanShown = null;
    this.ticks = 0;
    // la primissima volta la manina arriva subito
    this.lastAction = this.time.now - (this.g.tutorial === 0 ? IDLE_HINT_MS - 1800 : 0);
    this.cameras.main.fadeIn(250, 143, 211, 255);
    playCacchinoMusic();

    this.bg = this.add.image(960, 540, `pp_bg_${this.room}`).setScale(2).setDepth(0);
    this.night = this.add.rectangle(960, 540, 5000, 4000, 0x141a4a, 0.58).setDepth(500).setVisible(false);
    this.pet = new CacchinoView(this, PET.x, PET.y, 100);
    this.pet.setStage(stageOf(level));
    this.pet.setWear(this.g.worn);
    for (let i = 0; i < 2; i++) this.flies.push(this.add.image(0, 0, 'pp_fly').setDepth(130).setVisible(false).setScale(0.7));
    this.sponge = this.add.image(0, 0, 'pp_sponge').setDepth(1100).setVisible(false);

    this.hint = new Hint(this);
    this.drag = new DragManager(this, {
      onDrop: (it, x, y) => this.onFoodDrop(it, x, y),
      onTap: (it) => this.feedItem(it.id, it.obj.x, it.obj.y),
      onPick: () => { sfx.tap(); this.touch(); },
    }, 130);

    this.buildHud();
    this.buildTabs();
    this.buildBubble();
    this.buildRoom();
    homeButton(this, () => { this.commit(); backToHub(this); });
    muteButton(this);
    setupView(this, (v) => this.layout(v));

    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => this.onDown(p, over));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.onMove(p));
    this.input.on('pointerup', () => { if (this.mode === 'scrub') this.sponge.setScale(1); });
    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.second() });
    this.events.once('shutdown', () => this.commit());
    if (urlParam('debug')) Object.assign(window, { __pp: this, __sound: sound });

    this.refresh();
    if (this.g.asleep) this.setSleep(true, true);
    if (data?.done) {
      const before = { ...this.g };
      const o = complete(this.g, data.done.act, data.done.kind, data.done.friend);
      this.g = o.game;
      this.commit();
      this.mode = 'busy';
      if (data.done.act === 'bath') this.cleanShown = before.needs.clean;
      this.refresh();
      this.time.delayedCall(450, () => this.reward(data.done!.act, o, data.done!.friend));
    }
  }

  // ================================================================= stato
  private get level(): number { return levelOf(this.g.xp).level; }
  private commit(): void { save.set(this.g); }
  private touch(): void { this.lastAction = this.time.now; this.hint.hide(); }

  private second(): void {
    const wasAsleep = this.g.asleep;
    this.g = { ...this.g, ...tick(this.g, 1 / 60) };
    if (wasAsleep && !this.g.asleep) this.setSleep(false);
    if (this.g.asleep && this.ticks % 4 === 0) { sfx.snore(); this.zzz(); }
    if (++this.ticks % 5 === 0) this.commit();
    this.refresh();
    this.idleHint();
  }

  /** Ridisegna tutto ciò che dipende dallo stato: bisogni, livello, monete, faccia, nuvoletta. */
  private refresh(): void {
    const n = this.g.needs;
    const clean = this.cleanShown ?? n.clean;
    this.pet.setState(mood(n), clean, this.g.asleep);
    const lv = levelOf(this.g.xp);
    this.levelText.setText(String(lv.level));
    this.coinText.setText(String(this.g.coins));
    this.arcs.clear();
    const y = this.levelPill.y;
    for (const gz of this.gauges) {
      const val = (gz.need === 'clean' ? clean : n[gz.need]) / 100;
      const col = val < 0.25 ? 0xf2553d : val < 0.5 ? 0xffb81f : 0x35c46a;
      this.arcs.lineStyle(13, 0xd6dcec, 1).beginPath().arc(gz.x, y, 51, 0, Math.PI * 2).strokePath();
      if (val > 0.01) this.arcs.lineStyle(13, col, 1).beginPath().arc(gz.x, y, 51, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * val).strokePath();
    }
    this.arcs.lineStyle(13, 0xd6dcec, 1).beginPath().arc(this.levelPill.x, y, 51, 0, Math.PI * 2).strokePath();
    this.arcs.lineStyle(13, 0xb06af0, 1).beginPath().arc(this.levelPill.x, y, 51, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.02, lv.into / lv.need)).strokePath();
    // nuvoletta: la cosa di cui ha più bisogno
    const u = this.mode === 'idle' && !this.g.asleep ? urgent(n) : null;
    this.bubble.setVisible(!!u);
    if (u) { this.bubbleIcon.setTexture(`pp_need_${u}`); const h = this.pet.headPos(); this.bubble.setPosition(h.x + 190 * this.pet.scale + 60, Math.max(this.v.top + 250, h.y + 30)); }
  }

  // ================================================================= interfaccia fissa
  private num(x: number, y: number, s: string, size = 50, color = '#4a2a1e'): Phaser.GameObjects.Text {
    return this.add.text(x, y, s, { fontFamily: FONT, fontSize: `${size}px`, fontStyle: '700', color }).setOrigin(0.5);
  }

  private buildHud(): void {
    this.arcs = this.add.graphics().setDepth(1001);
    this.levelPill = this.add.image(0, 0, 'pp_pill').setDepth(1000).setScale(0.92);
    this.levelText = this.num(0, 0, '1', 58, '#6a3ac4').setDepth(1002);
    NEEDS.forEach((need) => {
      const pill = this.add.image(0, 0, 'pp_pill').setDepth(1000).setScale(0.92);
      const icon = this.add.image(0, 0, `pp_need_${need}`).setDepth(1002).setScale(0.62);
      this.gauges.push({ need, x: 0, pill, icon });
    });
    this.coinTag = this.add.image(0, 0, 'pp_tag').setDepth(1300).setScale(1.5, 1.45);
    this.coinIcon = this.add.image(0, 0, 'pp_coin').setDepth(1301).setScale(0.86);
    this.coinText = this.num(0, 0, '0', 52).setDepth(1301);
  }

  private buildTabs(): void {
    this.tabGlow = this.add.image(0, 0, 'glow').setDepth(1040).setScale(1.5).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.9);
    this.tweens.add({ targets: this.tabGlow, scale: 1.75, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    for (const id of TABS) {
      const btn = button(this, 0, 0, `pp_tab_${id}`, () => this.onTab(id), 0.78).setDepth(1050);
      this.tabs.push({ id, btn });
    }
    this.refreshTabs();
  }

  private refreshTabs(): void {
    for (const tb of this.tabs) {
      tb.lock?.forEach((o) => o.destroy());
      tb.lock = undefined;
      const open = tb.id === 'shop' || roomOpen(tb.id, this.level);
      tb.btn.setTint(open ? 0xffffff : 0x8a8fa0);
      if (!open) {
        const lv = ROOM_LEVEL[tb.id as Room];
        tb.lock = [this.add.image(tb.btn.x + 44, tb.btn.y - 48, 'btn_lock').setDepth(1052).setScale(0.62), this.add.image(tb.btn.x - 30, tb.btn.y + 62, 'star').setDepth(1052).setScale(0.6),
          this.num(tb.btn.x + 22, tb.btn.y + 64, String(lv), 44, '#ffffff').setDepth(1052).setStroke('#4a2a1e', 8)];
      }
    }
    const cur = this.tabs.find((tb) => tb.id === this.room);
    if (cur) this.tabGlow.setPosition(cur.btn.x, cur.btn.y - 4);
  }

  private buildBubble(): void {
    const b = this.add.image(0, 0, 'pp_bubble');
    this.bubbleIcon = this.add.image(0, -18, 'pp_need_food').setScale(0.82);
    this.bubble = this.add.container(0, 0, [b, this.bubbleIcon]).setDepth(150).setVisible(false);
    this.tweens.add({ targets: this.bubble, scale: 1.06, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  private layout(v: View): void {
    this.v = v;
    const y = v.top + 84;
    const w = v.right - v.left;
    // i bisogni stanno al centro; su schermi stretti si avvicinano
    const step = Math.min(150, (w - 1000) / 5 + 96);
    this.gauges.forEach((gz, i) => { gz.x = 960 + (i - 2) * step + 30; gz.pill.setPosition(gz.x, y); gz.icon.setPosition(gz.x, y); });
    const lx = this.gauges[0].x - step - 30;
    this.levelPill.setPosition(lx, y);
    this.levelText.setPosition(lx, y - 2);
    const cx = this.gauges[4].x + step + 70;
    this.coinTag.setPosition(cx, y);
    this.coinIcon.setPosition(cx - 72, y);
    this.coinText.setPosition(cx + 26, y);
    const ty = v.bottom - 96;
    this.tabs.forEach((tb, i) => tb.btn.setPosition(960 + (i - (TABS.length - 1) / 2) * 176, ty));
    this.refreshTabs();
    if (this.tray.length) this.openTray();
    this.refresh();
  }

  // ================================================================= stanze
  private buildRoom(): void {
    this.props.forEach((p) => { p.img.destroy(); p.extra.forEach((e) => e.destroy()); });
    this.props = [];
    this.bg.setTexture(`pp_bg_${this.room}`);
    for (const d of ROOM_PROPS[this.room]) {
      const img = this.add.image(d.x, d.y, d.key).setOrigin(0.5, 1).setDepth(d.act === 'ball' ? 110 : 40).setScale(d.s ?? 1);
      this.props.push({ img, act: d.act, extra: [] });
    }
    if (this.room === 'park') {
      this.props.push({ img: this.add.image(1650, 150, 'sun').setDepth(5).setScale(0.9).setOrigin(0.5, 0.5), act: 'none', extra: [] });
      for (const f of FRIENDS) {
        const x = FRIEND_AT[f.id];
        const open = friendOpen(f.id, this.level);
        const img = this.add.image(x, 862, `pp_friend_${f.id}`).setOrigin(0.5, 1).setDepth(60).setScale(0.92);
        const extra: Phaser.GameObjects.GameObject[] = [this.add.image(x, 868, 'shadow').setDepth(59).setScale(1.2, 0.9)];
        if (open) {
          const hearts = this.g.friends[f.id] ?? 0;
          for (let i = 0; i < MAX_HEARTS; i++) extra.push(this.add.image(x + (i - 2) * 44, 540, 'heart').setDepth(61).setScale(0.5).setAlpha(i < hearts ? 1 : 0.28));
          this.tweens.add({ targets: img, scaleY: 0.96, duration: 900 + x % 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        } else {
          img.setTint(0x30364a).setAlpha(0.55);
          extra.push(this.add.image(x, 640, 'btn_lock').setDepth(62).setScale(0.8), this.add.image(x - 34, 740, 'star').setDepth(62).setScale(0.6),
            this.num(x + 20, 742, String(f.level), 50, '#ffffff').setDepth(62).setStroke('#4a2a1e', 8));
        }
        this.props.push({ img, act: open ? 'friend' : 'locked', friend: f.id, extra });
      }
    }
    for (const p of this.props) {
      if (['none', 'locked', 'ball'].includes(p.act)) continue;
      const s = p.img.scaleX;
      if (p.act !== 'friend') this.tweens.add({ targets: p.img, scaleX: s * 1.02, scaleY: s * 0.985, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  private onTab(id: Room | 'shop'): void {
    this.touch();
    if (this.mode !== 'idle' && this.mode !== 'tray') return;
    if (this.g.asleep) { this.setSleep(false); return; }
    if (id === 'shop') { this.closeTray(); this.openShop(); return; }
    if (!roomOpen(id, this.level)) { sfx.nope(); return; }
    if (id === this.room) return;
    this.closeTray();
    this.room = id;
    sfx.slide();
    this.cameras.main.flash(180, 255, 255, 255);
    this.buildRoom();
    this.refreshTabs();
    this.pet.hop(40, 160);
  }

  // ================================================================= tocchi
  private onDown(p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]): void {
    this.touch();
    if (over.length || this.drag.dragging) return;
    const x = p.worldX, y = p.worldY;
    if (this.mode === 'scrub') { this.sponge.setPosition(x, y).setScale(0.9); if (this.pet.hit(x, y)) this.scrubAdd(260, x, y); return; }
    if (this.mode === 'busy' || this.mode === 'panel') return;
    if (this.g.asleep) { this.setSleep(false); return; }
    if (this.bubble.visible && Phaser.Math.Distance.Between(x, y, this.bubble.x, this.bubble.y - 20) < 100) {
      const u = urgent(this.g.needs);
      if (u) { const r = NEED_ROOM[u]; this.onTab(roomOpen(r, this.level) ? r : 'kitchen'); }
      return;
    }
    if (this.pet.hit(x, y, 0)) { this.poke(); return; }
    // il mobile toccato (quello più vicino tra quelli sotto il dito)
    let best: Prop | null = null;
    for (const pr of this.props) {
      if (pr.act === 'none') continue;
      const b = pr.img.getBounds();
      if (x > b.x - 20 && x < b.right + 20 && y > b.y - 20 && y < b.bottom + 30) best = pr;
    }
    if (best) { this.act(best); return; }
    if (this.pet.hit(x, y, 50)) { this.poke(); return; }
    burst(this, x, y, 'sparkle', { count: 5, tints: [0xffffff, 0xffe066], speed: [80, 200], scale: [0.4, 0], gravity: 0, life: 450, depth: 900 });
  }

  private onMove(p: Phaser.Input.Pointer): void {
    if (this.mode !== 'scrub' || !p.isDown) return;
    const d = Phaser.Math.Distance.Between(p.worldX, p.worldY, this.sponge.x, this.sponge.y);
    this.sponge.setPosition(p.worldX, p.worldY);
    if (this.pet.hit(p.worldX, p.worldY, 10)) this.scrubAdd(d, p.worldX, p.worldY);
  }

  private act(pr: Prop): void {
    const s = pr.img.scaleX;
    this.tweens.add({ targets: pr.img, scaleX: s * 1.08, scaleY: s * 0.94, duration: 90, yoyo: true });
    switch (pr.act) {
      case 'fridge': sfx.tap(); if (this.tray.length) this.closeTray(); else this.openTray(); break;
      case 'cook': case 'bath': case 'potty': case 'school': this.startPuzzle(pr.act); break;
      case 'friend': this.startPuzzle('play', pr.friend); break;
      case 'sleep': this.setSleep(true); break;
      case 'wardrobe': this.openWardrobe(); break;
      case 'ball': this.kickBall(pr); break;
      default: sfx.nope();
    }
  }

  private startPuzzle(act: Activity, friend?: string): void {
    // troppo stanco per studiare o giocare: prima la nanna
    if ((act === 'school' || act === 'play') && this.g.needs.energy < 8) {
      sfx.yawn(); this.pet.express('sleepy', 'o', 1200);
      const tb = this.tabs.find((x) => x.id === 'bedroom');
      if (tb) this.hint.tap(tb.btn.x, tb.btn.y);
      return;
    }
    const kind = act === 'play' ? playKind(this.g) : ACTIVITY_PUZZLE[act];
    this.mode = 'busy';
    this.commit();
    sfx.bell();
    goTo(this, 'cacchino:Puzzle', { act, kind, n: this.g.solved[kind], friend, room: this.room });
  }

  /** Tocco su Cacchino: puzzetta se c'è aria nel pancino, altrimenti solletico. */
  private poke(): void {
    const o = fart(this.g);
    this.g = o.game;
    if (o.size > 0) {
      this.pet.fart(o.size);
      if (o.size >= 2) this.reactFriends();
      this.afterOutcome(o);
    } else {
      this.pet.giggle();
      if (this.time.now - this.lastGiggle > 500) { sfx.giggle(); this.lastGiggle = this.time.now; }
      const h = this.pet.headPos();
      burst(this, this.pet.x, h.y + 80, 'heart', { count: 3, speed: [120, 260], scale: [0.6, 0.2], gravity: -120, life: 900, depth: 900 });
    }
    this.refresh();
  }

  private reactFriends(): void {
    for (const p of this.props) if (p.act === 'friend') this.tweens.add({ targets: p.img, y: p.img.y - 50, duration: 180, yoyo: true, ease: 'Quad.easeOut', delay: 250 });
  }

  private kickBall(pr: Prop): void {
    const y0 = 900;
    this.tweens.killTweensOf(pr.img);
    pr.img.setY(y0);
    sfx.pop();
    this.tweens.add({ targets: pr.img, y: y0 - 320, duration: 380, yoyo: true, ease: 'Quad.easeOut' });
    this.tweens.add({ targets: pr.img, x: pr.img.x < 800 ? 1200 : 610, duration: 760, ease: 'Sine.easeInOut' });
    if (!this.g.asleep) { this.g = cheer(this.g, 2); this.pet.giggle(); this.refresh(); }
  }

  // ================================================================= pappa
  private openTray(): void {
    this.closeTray(true);
    this.mode = 'tray';
    const ids = Object.keys(this.g.inv).filter((id) => this.g.inv[id] > 0 && foodById(id));
    const y = this.v.bottom - 104;
    const w = Math.min(1500, this.v.right - this.v.left - 260);
    const bar = this.add.graphics().setDepth(1060);
    bar.fillStyle(0x1d2440, 0.25).fillRoundedRect(960 - w / 2 + 6, y - 82, w, 180, 60);
    bar.fillStyle(0xfff6e2, 1).fillRoundedRect(960 - w / 2, y - 92, w, 180, 60);
    bar.lineStyle(6, 0xd9bd86, 1).strokeRoundedRect(960 - w / 2, y - 92, w, 180, 60);
    this.tray.push(bar);
    this.tabs.forEach((tb) => { tb.btn.setVisible(false); tb.lock?.forEach((o) => (o as Phaser.GameObjects.Image).setVisible(false)); });
    this.tabGlow.setVisible(false);
    this.tray.push(button(this, 960 + w / 2 - 20, y - 86, 'pp_btn_close', () => this.closeTray(), 0.7).setDepth(1090));
    this.drag.clear();
    const step = Math.min(176, (w - 160) / Math.max(1, ids.length));
    ids.forEach((id, i) => {
      const x = 960 + (i - (ids.length - 1) / 2) * step;
      const img = this.add.image(x, y - 4, `pp_food_${id}`).setDepth(1070).setScale(0.98);
      this.drag.add(img, id);
      const bx = x + 50, by = y - 60;
      const badge = this.add.image(bx, by, 'pp_badge').setDepth(1071).setScale(0.78);
      const n = this.num(bx, by - 2, String(this.g.inv[id]), 36, '#ffffff').setDepth(1072);
      this.tray.push(img, badge, n);
    });
    if (!ids.length) {
      // dispensa vuota: la manina porta al negozio (o ai fornelli se non ci sono monete)
      const shop = this.add.image(960, y - 4, 'pp_tab_shop').setDepth(1070).setScale(0.6).setAlpha(0.9);
      this.tray.push(shop);
    }
  }

  private closeTray(keepMode = false): void {
    this.tray.forEach((o) => o.destroy());
    this.tray = [];
    this.drag.clear();
    this.tabs.forEach((tb) => { tb.btn.setVisible(true); tb.lock?.forEach((o) => (o as Phaser.GameObjects.Image).setVisible(true)); });
    this.tabGlow.setVisible(true);
    if (!keepMode && this.mode === 'tray') this.mode = 'idle';
  }

  private onFoodDrop(it: DragItem, x: number, y: number): boolean {
    if (!this.pet.hit(x, y, 90)) return false;
    return this.feedItem(it.id, x, y);
  }

  private feedItem(id: string, x: number, y: number): boolean {
    const f = foodById(id);
    const o = feed(this.g, id);
    if (!f || !o.ok) { sfx.nope(); return false; }
    this.g = { ...o.game, tutorial: Math.max(1, o.game.tutorial) };
    const m = this.pet.mouthPos();
    const fly = this.add.image(x, y, `pp_food_${id}`).setDepth(1400);
    this.tweens.add({ targets: fly, x: m.x, y: m.y, scale: 0.25, duration: 260, ease: 'Quad.easeIn', onComplete: () => fly.destroy() });
    this.time.delayedCall(200, () => this.pet.eat(!!f.drink, () => {
      if (f.gas >= 20) { sfx.rumble(); this.pet.express('open', 'o', 700); }
      if (id === 'soda') this.time.delayedCall(350, () => { sfx.burp(); this.pet.express('happy', 'open', 600); });
      // pancino strapieno d'aria: parte da sola la puzzetta gigante
      if (fartSize(this.g.gas) === 3) this.time.delayedCall(900, () => { if (this.mode === 'tray' || this.mode === 'idle') this.poke(); });
      this.afterOutcome(o);
    }));
    this.openTray();
    this.refresh();
    return true;
  }

  // ================================================================= nanna
  private setSleep(on: boolean, silent = false): void {
    if (on && this.mode !== 'idle') return;
    this.g = sleep(this.g, on);
    this.night.setVisible(on);
    if (on) {
      this.closeTray();
      if (this.room !== 'bedroom') { this.room = 'bedroom'; this.buildRoom(); this.refreshTabs(); }
      if (!silent) sfx.yawn();
      this.night.setAlpha(0);
      this.tweens.add({ targets: this.night, alpha: 0.58, duration: 500 });
      // a nanna sul lettino
      const bed = this.props.find((p) => p.act === 'sleep');
      if (bed) this.pet.moveTo(bed.img.x - 20, bed.img.y - 150);
    } else {
      this.pet.moveTo(PET.x, PET.y);
    }
    if (!on && !silent) {
      sfx.hello();
      this.pet.express('happy', 'grin', 1200);
      this.pet.hop(50, 200);
    }
    this.commit();
    this.refresh();
  }

  private zzz(): void {
    const h = this.pet.headPos();
    for (let i = 0; i < 3; i++) {
      const z = this.add.image(h.x + 90, h.y + 40, 'pp_zzz').setDepth(600).setScale(0.4 + i * 0.2).setAlpha(0);
      this.tweens.add({ targets: z, x: h.x + 150 + i * 60, y: h.y - 60 - i * 70, alpha: { from: 1, to: 0 }, duration: 1800, delay: i * 350, onComplete: () => z.destroy() });
    }
  }

  // ================================================================= premi dopo un rompicapo
  private reward(act: Activity, o: Outcome & { coins: number }, friend?: string): void {
    const end = (): void => { this.mode = 'idle'; this.cleanShown = null; this.afterOutcome(o); this.refresh(); this.touch(); };
    this.flyCoins(o.coins);
    if (act === 'bath') { this.startScrub(end); return; }
    if (act === 'potty') { this.pottyShow(end); return; }
    if (act === 'cook') {
      const fr = this.props.find((p) => p.act === 'fridge');
      const st = this.props.find((p) => p.act === 'cook');
      for (let i = 0; i < 2; i++) {
        const s = this.add.image(st?.img.x ?? 1590, 560, 'pp_food_soup').setDepth(900).setScale(0.3);
        this.tweens.add({ targets: s, scale: 1.2, y: 420, duration: 350, delay: i * 250, ease: 'Back.easeOut' });
        this.tweens.add({ targets: s, x: fr?.img.x ?? 330, y: 560, scale: 0.4, duration: 600, delay: 700 + i * 250, ease: 'Quad.easeIn', onComplete: () => { s.destroy(); sfx.pop(); } });
      }
      this.pet.express('happy', 'open', 1500);
      this.time.delayedCall(1700, end);
      return;
    }
    if (act === 'school') {
      sfx.star();
      const h = this.pet.headPos();
      burst(this, h.x, h.y, 'star', { count: 14, speed: [250, 600], scale: [0.7, 0.1], life: 1000, depth: 900 });
      this.pet.express('happy', 'grin', 1500);
      this.pet.hop(80, 240);
      this.time.delayedCall(1300, end);
      return;
    }
    // gioco con un amico: saltano insieme, cuori
    const fp = this.props.find((p) => p.friend === friend && p.act === 'friend');
    sfx.giggle();
    this.pet.giggle();
    this.pet.hop(90, 240);
    if (fp) {
      this.tweens.add({ targets: fp.img, y: fp.img.y - 90, duration: 240, yoyo: true, repeat: 1, ease: 'Quad.easeOut' });
      burst(this, (fp.img.x + this.pet.x) / 2, 520, 'heart', { count: 9, speed: [150, 420], scale: [0.8, 0.2], gravity: -100, life: 1100, depth: 900 });
    }
    this.time.delayedCall(1200, () => { this.buildRoom(); end(); });
  }

  private flyCoins(n: number): void {
    const k = Math.min(8, Math.max(3, Math.round(n / 2)));
    for (let i = 0; i < k; i++) {
      const c = this.add.image(960 + (Math.random() - 0.5) * 240, 520 + (Math.random() - 0.5) * 120, 'pp_coin').setDepth(1500).setScale(0);
      this.tweens.add({ targets: c, scale: 0.9, duration: 200, delay: i * 70, ease: 'Back.easeOut' });
      this.tweens.add({ targets: c, x: this.coinIcon.x, y: this.coinIcon.y, scale: 0.5, duration: 500, delay: 350 + i * 70, ease: 'Quad.easeIn', onComplete: () => { c.destroy(); sfx.coin(); this.tweens.add({ targets: this.coinIcon, scale: 1.05, duration: 60, yoyo: true }); } });
    }
  }

  /** Bagnetto: si strofina Cacchino con la spugna finché è tutto insaponato, poi la doccia lo fa brillare. */
  private startScrub(end: () => void): void {
    this.mode = 'scrub';
    this.scrub = { acc: 0, from: this.cleanShown ?? 0, last: 0 };
    this.sponge.setVisible(true).setPosition(this.pet.x + 260, this.pet.y - 200);
    this.hint.circle(this.pet.x, this.pet.y - this.pet.height * 0.5, 130, 100);
    this.scrubEnd = end;
  }
  private scrubEnd: (() => void) | null = null;

  private scrubAdd(d: number, x: number, y: number): void {
    if (this.mode !== 'scrub') return;
    this.hint.hide();
    this.scrub.acc += d;
    const pr = Math.min(1, this.scrub.acc / 3400);
    this.cleanShown = this.scrub.from + (100 - this.scrub.from) * pr;
    if (this.time.now - this.scrub.last > 110) {
      this.scrub.last = this.time.now;
      if (this.foam.length < 46) {
        const b = this.add.image(x + (Math.random() - 0.5) * 60, y + (Math.random() - 0.5) * 60, 'pp_soapbubble').setDepth(105).setScale(0);
        this.tweens.add({ targets: b, scale: 0.6 + Math.random() * 0.7, duration: 200, ease: 'Back.easeOut' });
        this.foam.push(b);
      }
      if (this.foam.length % 3 === 0) sfx.scrub();
    }
    this.refresh();
    if (pr >= 1) this.shower();
  }

  private shower(): void {
    this.mode = 'busy';
    this.sponge.setVisible(false);
    sfx.shower();
    const h = this.pet.headPos();
    const e = this.add.particles(this.pet.x, h.y - 260, 'pp_drop', { x: { min: -200, max: 200 }, speedY: { min: 700, max: 1000 }, scale: { min: 0.5, max: 0.9 }, lifespan: 700, frequency: 18, alpha: { start: 1, end: 0.4 } }).setDepth(108);
    this.pet.express('happy', 'open', 2200);
    this.foam.forEach((b, i) => this.tweens.add({ targets: b, y: b.y + 260, alpha: 0, duration: 600, delay: 200 + i * 22, onComplete: () => b.destroy() }));
    this.foam = [];
    this.time.delayedCall(1500, () => {
      e.stop();
      this.time.delayedCall(800, () => e.destroy());
      sfx.star();
      burst(this, this.pet.x, this.pet.y - this.pet.height * 0.5, 'sparkle', { count: 22, tints: [0xffffff, 0xbfe8ff, 0xffe066], speed: [200, 600], scale: [1, 0], gravity: 0, life: 900, depth: 900 });
      this.pet.hop(70, 220);
      const end = this.scrubEnd; this.scrubEnd = null;
      this.time.delayedCall(500, () => end?.());
    });
  }

  /** Vasino: Cacchino ci salta sopra, si concentra... e parte la fanfara. */
  private pottyShow(end: () => void): void {
    const potty = this.props.find((p) => p.act === 'potty');
    const tx = potty?.img.x ?? 350, ty = (potty?.img.y ?? 822) - 132;
    const pos = { x: this.pet.x, y: this.pet.y };
    const glide = (x: number, y: number, done: () => void): void => {
      this.tweens.add({ targets: pos, x, y, duration: 420, ease: 'Sine.easeInOut', onUpdate: () => this.pet.moveTo(pos.x, pos.y), onComplete: done });
    };
    glide(tx, ty, () => {
      this.pet.express('strain', 'zip', 900);
      sfx.rumble();
      this.time.delayedCall(800, () => {
        this.pet.fart(3);
        this.g = { ...this.g, farts: this.g.farts + 1 };
        this.reactFriends();
        this.time.delayedCall(1300, () => {
          sfx.flush();
          glide(PET.x, PET.y, end);
        });
      });
    });
  }

  // ================================================================= crescita
  private afterOutcome(o: Outcome): void {
    this.commit();
    if (!o.levelUp) return;
    this.time.delayedCall(500, () => {
      sfx.levelup();
      const tx = title3d(this, 960, 330, t('cacchino.level', { n: o.levelUp! }), 150).setDepth(1600).setScale(0);
      this.tweens.add({ targets: tx, scale: 1, duration: 420, ease: 'Back.easeOut' });
      burst(this, 960, 330, 'star', { count: 24, speed: [300, 900], scale: [0.9, 0.1], life: 1300, depth: 1590 });
      let sub: Phaser.GameObjects.Text | null = null;
      if (o.stageUp !== undefined) {
        this.time.delayedCall(700, () => { sfx.grow(); this.pet.grow(o.stageUp!); });
        sub = title3d(this, 960, 480, t(`cacchino.stage${o.stageUp}`), 96).setDepth(1600).setAlpha(0);
        this.tweens.add({ targets: sub, alpha: 1, duration: 300, delay: 900 });
      }
      this.tweens.add({ targets: [tx, ...(sub ? [sub] : [])], alpha: 0, duration: 400, delay: 2600, onComplete: () => { tx.destroy(); sub?.destroy(); } });
      this.refreshTabs();
      if (this.room === 'park') this.buildRoom();
    });
  }

  // ================================================================= negozio e armadio
  private openPanel(x: number, w: number): { close: () => void; add: <O extends Phaser.GameObjects.GameObject>(o: O) => O } {
    this.closePanel();
    this.mode = 'panel';
    this.bubble.setVisible(false);
    const add = <O extends Phaser.GameObjects.GameObject>(o: O): O => { this.panel.push(o); return o; };
    const dim = add(this.add.rectangle(960, 540, 6000, 4000, 0x1d2440, 0.55).setDepth(1190).setInteractive());
    dim.on('pointerdown', () => this.closePanel());
    const top = this.v.top + 170, h = this.v.bottom - top - 30;
    const card = add(this.add.graphics().setDepth(1200));
    card.fillStyle(0x1d2440, 0.3).fillRoundedRect(x - w / 2 + 8, top + 12, w, h, 56);
    card.fillStyle(0xfff0d0, 1).fillRoundedRect(x - w / 2, top, w, h, 56);
    card.lineStyle(8, 0xd9a54a, 1).strokeRoundedRect(x - w / 2, top, w, h, 56);
    add(this.add.zone(x, top + h / 2, w, h).setDepth(1201).setInteractive());
    add(button(this, x + w / 2 - 30, top + 20, 'pp_btn_close', () => this.closePanel(), 0.8).setDepth(1260));
    return { close: () => this.closePanel(), add };
  }

  private closePanel(): void {
    if (!this.panel.length) return;
    this.panel.forEach((o) => o.destroy());
    this.panel = [];
    this.mode = 'idle';
    this.pet.c.setDepth(100);
    this.pet.moveTo(PET.x, PET.y);
    this.refresh();
  }

  private priceTag(add: <O extends Phaser.GameObjects.GameObject>(o: O) => O, x: number, y: number, price: number, enough: boolean): void {
    add(this.add.image(x, y, 'pp_tag').setDepth(1232).setScale(0.92).setAlpha(enough ? 1 : 0.7));
    add(this.add.image(x - 38, y, 'pp_coin').setDepth(1233).setScale(0.48));
    add(this.num(x + 18, y - 1, String(price), 36, enough ? '#4a2a1e' : '#c0392b').setDepth(1233));
  }
  private levelLock(add: <O extends Phaser.GameObjects.GameObject>(o: O) => O, x: number, y: number, lv: number): void {
    add(this.add.image(x - 28, y, 'star').setDepth(1233).setScale(0.52));
    add(this.num(x + 20, y, String(lv), 40, '#ffffff').setDepth(1233).setStroke('#4a2a1e', 8));
  }

  private openShop(): void {
    const items = shopFoods();
    const cols = 6, rows = Math.ceil(items.length / cols);
    const w = Math.min(1560, this.v.right - this.v.left - 80);
    const { add } = this.openPanel(960, w);
    const top = this.v.top + 170, h = this.v.bottom - top - 30;
    const cw = (w - 120) / cols, ch = (h - 70) / rows;
    const s = Math.min(1, cw / 215, ch / 250);
    items.forEach((f, i) => {
      const x = 960 + ((i % cols) - (cols - 1) / 2) * cw, y = top + 45 + ch * (Math.floor(i / cols) + 0.5) - 14;
      const open = this.level >= f.level;
      const slot = add(this.add.image(x, y, 'pp_slot').setDepth(1210).setScale(s).setInteractive({ useHandCursor: true }));
      const icon = add(this.add.image(x, y - 8 * s, `pp_food_${f.id}`).setDepth(1220).setScale(0.82 * s).setAlpha(open ? 1 : 0.3));
      if (!open) { add(this.add.image(x, y - 12 * s, 'btn_lock').setDepth(1232).setScale(0.6 * s)); this.levelLock(add, x, y + 86 * s, f.level); }
      else this.priceTag(add, x, y + 92 * s, f.price, this.g.coins >= f.price);
      const own = this.g.inv[f.id] ?? 0;
      if (own > 0) { add(this.add.image(x + 66 * s, y - 66 * s, 'pp_badge').setDepth(1234).setScale(0.74 * s)); add(this.num(x + 66 * s, y - 68 * s, String(own), 34 * s, '#ffffff').setDepth(1235)); }
      slot.on('pointerdown', () => {
        const o = buyFood(this.g, f.id);
        if (!o.ok) { sfx.nope(); this.tweens.add({ targets: [slot, icon], x: x + 10, duration: 50, yoyo: true, repeat: 2 }); return; }
        this.g = o.game; this.commit(); sfx.buy();
        burst(this, x, y, 'sparkle', { count: 8, tints: [0xffe066, 0xffffff], speed: [150, 400], scale: [0.6, 0], gravity: 0, life: 500, depth: 1300 });
        this.openShop();
      });
    });
    this.refresh();
  }

  private openWardrobe(): void {
    if (this.mode !== 'idle' && this.mode !== 'panel') return;
    const left = this.v.left, right = this.v.right;
    const w = Math.min(1080, (right - left) * 0.58);
    const cx = right - 50 - w / 2;
    const { add } = this.openPanel(cx, w);
    // Cacchino si mette in posa a sinistra, davanti al velo scuro
    this.pet.c.setDepth(1250);
    this.pet.moveTo(Math.max(left + 330, (left + cx - w / 2) / 2), this.v.bottom - 110);
    const top = this.v.top + 170, h = this.v.bottom - top - 30;
    const cols = 4, rows = 3;
    const cw = (w - 110) / cols, ch = (h - 70) / rows;
    const s = Math.min(1, cw / 215, ch / 250);
    WEARS.forEach((it, i) => {
      const x = cx + ((i % cols) - (cols - 1) / 2) * cw, y = top + 45 + ch * (Math.floor(i / cols) + 0.5) - 14;
      const owned = this.g.owned.includes(it.id);
      const open = this.level >= it.level;
      const on = this.g.worn[it.slot] === it.id;
      const slot = add(this.add.image(x, y, on ? 'pp_slot_on' : 'pp_slot').setDepth(1210).setScale(s).setInteractive({ useHandCursor: true }));
      const tex = this.textures.get(`pp_wear_${it.id}`).getSourceImage();
      const k = Math.min(140 / tex.width, 110 / tex.height) * s;
      const icon = add(this.add.image(x, y - (owned ? 0 : 14 * s), `pp_wear_${it.id}`).setDepth(1220).setScale(k).setAlpha(owned || open ? 1 : 0.3));
      if (!owned) {
        if (!open) { add(this.add.image(x, y - 12 * s, 'btn_lock').setDepth(1232).setScale(0.6 * s)); this.levelLock(add, x, y + 86 * s, it.level); }
        else this.priceTag(add, x, y + 92 * s, it.price, this.g.coins >= it.price);
      } else if (on) add(this.add.image(x + 64 * s, y - 64 * s, 'pp_btn_ok').setDepth(1234).setScale(0.3 * s));
      slot.on('pointerdown', () => {
        const o = tapWear(this.g, it.id);
        if (!o.ok) { sfx.nope(); this.tweens.add({ targets: [slot, icon], x: x + 10, duration: 50, yoyo: true, repeat: 2 }); return; }
        this.g = o.game; this.commit();
        if (o.bought) sfx.buy(); else sfx.pop();
        this.pet.setWear(this.g.worn);
        this.pet.giggle();
        const hp = this.pet.headPos();
        burst(this, this.pet.x, hp.y + 60, 'sparkle', { count: 10, tints: [0xffe066, 0xffffff, 0xff9ccb], speed: [150, 400], scale: [0.7, 0], gravity: 0, life: 600, depth: 1300 });
        const px = this.pet.x, py = this.pet.y;
        this.openWardrobe();
        this.pet.moveTo(px, py);
      });
    });
    this.refresh();
  }

  // ================================================================= manina d'aiuto
  private idleHint(): void {
    if (this.g.asleep || this.hint.visible) return;
    // dispensa aperta: la manina mostra come si dà da mangiare (trascinare, o anche solo toccare)
    if (this.mode === 'tray' && this.time.now - this.lastAction > 3200 && this.drag.items.length) {
      const it = this.drag.items[0].obj, m = this.pet.mouthPos();
      this.hint.drag(it.x, it.y, m.x, m.y);
      return;
    }
    if (this.mode !== 'idle' || this.time.now - this.lastAction < IDLE_HINT_MS) return;
    const u = urgent(this.g.needs, 55);
    const prop = (act: string): Prop | undefined => this.props.find((p) => p.act === act);
    const tapProp = (p?: Prop): void => { if (p) this.hint.tap(p.img.x, p.img.y - p.img.displayHeight * 0.45); };
    const tapTab = (id: Room | 'shop'): void => { const tb = this.tabs.find((x) => x.id === id); if (tb) this.hint.tap(tb.btn.x, tb.btn.y - 10); };
    if (!u) {
      // tutto a posto: un rompicapo per guadagnare monete e crescere, o una bella puzzetta
      if (fartSize(this.g.gas) > 0) this.hint.tap(this.pet.x, this.pet.y - this.pet.height * 0.4);
      else tapProp(prop('cook') ?? prop('school') ?? prop('bath') ?? prop('friend'));
      return;
    }
    let room = NEED_ROOM[u];
    if (!roomOpen(room, this.level)) { this.hint.tap(this.pet.x, this.pet.y - this.pet.height * 0.4); return; }
    if (u === 'food' || u === 'water') {
      const has = Object.keys(this.g.inv).some((id) => { const f = foodById(id); return f && this.g.inv[id] > 0 && (u === 'food' ? f.food > 8 : f.water > 8); });
      if (!has) { if (u === 'water' || this.g.coins >= 4) { tapTab('shop'); return; } room = 'kitchen'; if (this.room === room) { tapProp(prop('cook')); return; } }
    }
    if (this.room !== room) { tapTab(room); return; }
    if (u === 'food' || u === 'water') tapProp(prop('fridge'));
    else if (u === 'clean') tapProp(prop('bath'));
    else if (u === 'energy') tapProp(prop('sleep'));
    else tapProp(prop('friend') ?? prop('ball'));
  }

  update(time: number): void {
    this.pet.update(time);
    // mosche: arrivano quando Cacchino è sporco
    const dirty = (this.cleanShown ?? this.g.needs.clean) < 38 && this.mode !== 'panel';
    const h = this.pet.headPos();
    this.flies.forEach((f, i) => {
      f.setVisible(dirty);
      if (!dirty) return;
      const a = time / 420 + i * 2.4;
      f.setPosition(h.x + Math.cos(a) * (190 + i * 40), h.y + 70 + Math.sin(a * 1.7) * 70).setFlipX(Math.sin(a) > 0);
      f.setScale(0.7, 0.7 + Math.sin(time / 30) * 0.06);
    });
    if (dirty && Math.floor(time / 4000) !== Math.floor((time - this.game.loop.delta) / 4000)) sfx.buzz();
  }
}
