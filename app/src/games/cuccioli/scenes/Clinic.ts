import Phaser from 'phaser';
import { setupView, button, pin, burst, view } from '../../../core/ui';
import { urlParam } from '../../../core/platform';
import { muteButton, goTo } from '../../../core/hud';
import { DragManager, Hint, type DragItem } from '../../../core/drag';
import { sound } from '../../../core/sound';
import {
  nextPet, isPetId, isProblemId, problemsFor, stepsOf, trayTools, ailmentFor, toolNeeded, isCured, onPet, problemById, addCured, trayX,
  PET_AT, TRAY_Y, type Ailment, type PetId, type ToolId,
} from '../logic';
import { drawClinic, PetView } from '../world';
import { save } from '../save';
import { sfx, playCuccioliMusic } from '../sfx';

const IDLE_HINT_MS = 5000;
const TOOL_SCALE = 0.92;

interface Badge { bg: Phaser.GameObjects.Image; icon: Phaser.GameObjects.Image; star: Phaser.GameObjects.Image; ail: number; k: number; done: boolean }

/**
 * Una visita: il cucciolo arriva sul lettino con i suoi guai; si trascina (o si tocca) lo strumento giusto
 * sul punto giusto; a cure finite il cucciolo fa le feste e va a vivere nel giardino della clinica.
 */
export class Clinic extends Phaser.Scene {
  private petId!: PetId;
  private pet!: PetView;
  private ailments: Ailment[] = [];
  private badges: Badge[] = [];
  private drag!: DragManager;
  private hint!: Hint;
  private tools: DragItem[] = [];
  private busy = true;
  private finished = false;
  private errors = 0;
  private curedSteps = 0;
  private lastAction = 0;

  constructor() { super('cuccioli:Clinic'); }

  create(data: { pet?: string; problems?: string[] }): void {
    this.petId = isPetId(data?.pet) ? data.pet : nextPet(save.state.cured, save.state.last);
    // `problems` solo per i test automatici e le catture degli store
    const forced = Array.isArray(data?.problems) ? data.problems.filter(isProblemId) : [];
    const problems = forced.length ? forced : problemsFor(save.state.visits);
    this.ailments = problems.map((id) => ({ id, done: 0 }));
    this.badges = [];
    this.tools = [];
    this.busy = true;
    this.finished = false;
    this.errors = 0;
    this.curedSteps = 0;
    this.lastAction = this.time.now;

    setupView(this, (v) => this.badges.forEach((b) => { b.bg.y = v.top + 78; b.icon.y = v.top + 74; b.star.y = v.top + 112; }));
    this.cameras.main.fadeIn(250, 143, 211, 255);
    playCuccioliMusic();
    drawClinic(this);
    this.add.image(960, TRAY_Y + 6, 'cu_tray').setDepth(850).setScale(0.98, 0.9);

    this.pet = new PetView(this, this.petId, PET_AT.x, PET_AT.y, PET_AT.scale, { depth: 40 });
    this.pet.active = [...problems];
    this.hint = new Hint(this);
    this.drag = new DragManager(this, {
      onDrop: (it, x, y) => this.onDrop(it, x, y),
      onTap: (it) => this.onTapTool(it),
      onPick: () => { sfx.pick(); this.hint.hide(); this.lastAction = this.time.now; },
    }, 160);
    this.drag.enabled = false;

    const home = button(this, 0, 0, 'btn_home', () => goTo(this, 'cuccioli:Menu'), 0.85);
    pin(this, home, 'tl', 80, 80);
    muteButton(this);

    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length || this.drag.dragging) return;
      if (this.pet.hit(p.worldX, p.worldY) && !this.busy) {
        this.pet.giggle();
        burst(this, p.worldX, p.worldY - 40, 'heart', { count: 4, speed: [120, 260], scale: [0.6, 0.2], gravity: -120, life: 900, depth: 900 });
      } else {
        burst(this, p.worldX, p.worldY, 'sparkle', { count: 5, tints: [0xffffff, 0xa7f0dc], speed: [80, 200], scale: [0.4, 0], gravity: 0, life: 450, depth: 900 });
      }
    });
    this.time.addEvent({ delay: 500, loop: true, callback: () => this.idleCheck() });
    if (urlParam('debug')) Object.assign(window, { __cu: this, __sound: sound });

    // il cucciolo arriva saltellando, poi compaiono i guai e gli strumenti
    this.pet.c.setVisible(true);
    this.pet.enter(2350, () => {
      sfx.voice(this.petId);
      this.ailments.forEach((a, i) => this.time.delayedCall(250 + i * 380, () => { this.pet.showProblem(a.id); sfx.pick(); }));
      this.time.delayedCall(300 + this.ailments.length * 380, () => this.buildBadges());
      this.time.delayedCall(500 + this.ailments.length * 380, () => this.buildTray(problems));
    });
  }

  // =================================================================
  // Pastiglie in alto: gli strumenti da usare, con la stellina quando la cura è fatta
  // =================================================================
  private buildBadges(): void {
    const top = view(this).top;
    const steps: { tool: ToolId; ail: number; k: number }[] = [];
    this.ailments.forEach((a, ai) => problemById(a.id).tools.forEach((tool, k) => steps.push({ tool, ail: ai, k })));
    const n = steps.length;
    steps.forEach((s, i) => {
      const x = 960 + (i - (n - 1) / 2) * 140;
      const bg = this.add.image(x, top + 78, 'cu_badge').setDepth(900).setScale(0);
      const icon = this.add.image(x, top + 74, `cu_tool_${s.tool}`).setDepth(901).setScale(0);
      const star = this.add.image(x + 40, top + 112, 'star').setDepth(902).setScale(0);
      this.tweens.add({ targets: bg, scale: 0.85, duration: 300, delay: i * 90, ease: 'Back.easeOut' });
      this.tweens.add({ targets: icon, scale: 0.46, duration: 300, delay: i * 90 + 60, ease: 'Back.easeOut' });
      this.badges.push({ bg, icon, star, ail: s.ail, k: s.k, done: false });
    });
    this.refreshBadges();
  }

  /** Le pastiglie dei passi non ancora possibili (il cerotto prima della spina) restano chiare. */
  private refreshBadges(): void {
    for (const b of this.badges) {
      const a = this.ailments[b.ail];
      const ready = a.done >= b.k;
      b.icon.setAlpha(b.done || ready ? 1 : 0.4);
      b.bg.setAlpha(b.done || ready ? 1 : 0.6);
      if (!b.done && a.done > b.k) {
        b.done = true;
        sfx.star();
        this.tweens.add({ targets: b.star, scale: 0.5, duration: 400, ease: 'Back.easeOut' });
        this.tweens.add({ targets: [b.bg], scale: 1.0, duration: 150, yoyo: true });
        burst(this, b.bg.x, b.bg.y, 'sparkle', { count: 10, tints: [0xffffff, 0xffe066], gravity: 0, life: 600, depth: 950 });
      }
    }
  }

  // =================================================================
  // Vassoio degli strumenti
  // =================================================================
  private buildTray(problems: Parameters<typeof trayTools>[0]): void {
    const list = trayTools(problems, save.state.visits);
    list.forEach((id, i) => {
      const x = trayX(i, list.length), y = TRAY_Y - 8;
      const sh = this.add.image(x, TRAY_Y + 58, 'shadow').setScale(0.75, 0.3).setDepth(855).setAlpha(0.8);
      const img = this.add.image(x, y + 300, `cu_tool_${id}`).setDepth(860).setScale(TOOL_SCALE);
      this.tweens.add({
        targets: img, y, duration: 420, delay: i * 80, ease: 'Back.easeOut',
        onComplete: () => {
          this.tools.push(this.drag.add(img, id, sh));
          if (this.tools.length === list.length) this.ready();
        },
      });
    });
  }

  private ready(): void {
    this.busy = false;
    this.drag.enabled = true;
    this.lastAction = this.time.now;
    if (!save.state.tutorialDone) this.time.delayedCall(500, () => this.showHint());
  }

  // =================================================================
  // Trascinamenti e tocchi
  // =================================================================
  private onDrop(it: DragItem, x: number, y: number): boolean {
    if (this.busy) return false;
    const tool = it.id as ToolId;
    const l = this.pet.toLocal(x, y);
    if (onPet(l.x, l.y)) {
      const i = ailmentFor(this.ailments, tool, l.x, l.y);
      if (i >= 0) { this.apply(it, i, false); return true; }
      this.wrong(it, true);
      return false;
    }
    sfx.back();
    return false;
  }

  private onTapTool(it: DragItem): void {
    if (this.busy) return;
    const i = ailmentFor(this.ailments, it.id as ToolId);
    if (i >= 0) this.apply(it, i, true);
    else this.wrong(it, false);
  }

  /** Strumento che adesso non serve: il cucciolo fa "no" con la testa, lo strumento torna al suo posto. Nessun errore. */
  private wrong(it: DragItem, onThePet: boolean): void {
    sfx.nope();
    this.lastAction = this.time.now;
    if (onThePet) this.pet.shakeNo();
    else this.tweens.add({ targets: it.obj, angle: { from: -10, to: 10 }, duration: 70, yoyo: true, repeat: 2, onComplete: () => it.obj.setAngle(0) });
    if (++this.errors >= 2) { this.errors = 0; this.time.delayedCall(400, () => this.showHint()); }
  }

  // =================================================================
  // Le cure
  // =================================================================
  private apply(it: DragItem, ai: number, fromTap: boolean): void {
    const a = this.ailments[ai];
    const tool = toolNeeded(a)!;
    const prob = problemById(a.id);
    this.busy = true;
    this.pet.busy = true;
    this.drag.enabled = false;
    this.errors = 0;
    this.hint.hide();
    this.lastAction = this.time.now;
    it.enabled = false;
    it.obj.setDepth(1300);
    if (fromTap) sfx.whoosh();
    const sp = this.pet.spot(prob.spot);
    const off: Record<ToolId, [number, number]> = {
      sponge: [0, -10], tweezers: [6, -110], plaster: [0, -20], bottle: [70, 20], blanket: [0, -60], tissue: [0, 40], scarf: [0, 0],
    };
    const [dx, dy] = off[tool];
    this.tweens.add({
      targets: it.obj, x: sp.x + dx, y: sp.y + dy, scale: TOOL_SCALE * (tool === 'bottle' ? 0.9 : 0.8), duration: fromTap ? 420 : 220, ease: 'Quad.easeOut',
      onComplete: () => this.useTool(it, tool, sp, () => this.afterCure(it, ai)),
    });
  }

  private useTool(it: DragItem, tool: ToolId, sp: { x: number; y: number }, done: () => void): void {
    const o = it.obj;
    switch (tool) {
      case 'sponge': {
        let k = 0;
        const pass = () => {
          k++;
          sfx.scrub();
          this.pet.cleanMud(k / 5);
          burst(this, sp.x + Phaser.Math.Between(-40, 40), sp.y - 20, 'cu_bubble', { count: 4, speed: [60, 180], scale: [0.9, 0.5], gravity: -260, life: 900, depth: 1310 });
          if (k >= 5) {
            sfx.sparkle();
            burst(this, sp.x, sp.y - 20, 'sparkle', { count: 14, tints: [0xffffff, 0xa7f0dc, 0xffe066], gravity: 0, speed: [150, 380], life: 700, depth: 1310 });
            this.time.delayedCall(250, done);
            return;
          }
          this.tweens.add({ targets: o, x: sp.x + (k % 2 ? 46 : -46), duration: 150, ease: 'Sine.easeInOut', onComplete: pass });
        };
        pass();
        break;
      }
      case 'tweezers':
        this.tweens.chain({
          targets: o,
          tweens: [
            { scaleX: o.scaleX * 0.82, y: o.y + 18, duration: 160, ease: 'Quad.easeOut' },
            {
              y: o.y - 90, duration: 280, ease: 'Back.easeIn',
              onStart: () => { this.pet.pullThorn(); sfx.pluck(); burst(this, sp.x, sp.y - 30, 'sparkle', { count: 8, tints: [0xffffff, 0xffe066], gravity: 0, life: 500, depth: 1310 }); },
            },
            { scaleX: o.scaleX, duration: 120 },
          ],
          onComplete: () => this.time.delayedCall(250, done),
        });
        break;
      case 'plaster':
        this.tweens.add({
          targets: o, scale: o.scale * 0.6, alpha: 0, duration: 200,
          onComplete: () => {
            this.pet.putPlaster();
            sfx.plaster();
            burst(this, sp.x, sp.y - 10, 'star', { count: 6, speed: [150, 320], scale: [0.35, 0.1], gravity: 300, life: 700, depth: 1310 });
            this.time.delayedCall(400, done);
          },
        });
        break;
      case 'bottle':
        this.tweens.add({ targets: o, angle: -38, duration: 200 });
        this.pet.drink(() => { this.tweens.add({ targets: o, angle: 0, duration: 150 }); done(); });
        this.time.delayedCall(300, () => burst(this, sp.x + 20, sp.y - 30, 'heart', { count: 3, speed: [80, 160], scale: [0.5, 0.2], gravity: -150, life: 900, depth: 1310 }));
        break;
      case 'blanket':
        sfx.whoosh();
        this.tweens.add({ targets: o, alpha: 0, scale: o.scale * 1.4, duration: 220 });
        this.pet.nap(done);
        break;
      case 'tissue':
        // la scatola resta lì: sul naso va solo il fazzoletto
        this.tweens.add({ targets: o, alpha: 0, scale: o.scale * 0.7, duration: 180 });
        this.pet.blow(() => this.time.delayedCall(200, done));
        break;
      case 'scarf':
        this.tweens.add({ targets: o, alpha: 0, scale: o.scale * 1.3, duration: 200 });
        this.time.delayedCall(150, () => {
          sfx.scarf();
          this.pet.wrapScarf();
          const g = this.add.image(sp.x, sp.y - 60, 'glow').setScale(3).setTint(0xffb36b).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD).setDepth(45);
          this.tweens.add({ targets: g, alpha: 0.7, duration: 300, yoyo: true, hold: 300, onComplete: () => g.destroy() });
          burst(this, sp.x, sp.y - 40, 'heart', { count: 6, speed: [150, 300], scale: [0.6, 0.2], gravity: -100, life: 1000, depth: 1310 });
          this.time.delayedCall(700, done);
        });
        break;
    }
  }

  private afterCure(it: DragItem, ai: number): void {
    const a = this.ailments[ai];
    a.done++;
    sfx.cured(this.curedSteps++);
    this.refreshBadges();
    if (!save.state.tutorialDone) save.update({ tutorialDone: true });
    // lo strumento torna sul vassoio
    it.obj.setAlpha(1).setAngle(0).setScale(TOOL_SCALE * 0.5);
    it.obj.setPosition(it.homeX, it.homeY + 40);
    this.tweens.add({ targets: it.obj, x: it.homeX, y: it.homeY, scale: TOOL_SCALE, duration: 320, ease: 'Back.easeOut', onComplete: () => { it.obj.setDepth(it.baseDepth); } });
    it.enabled = true;
    this.pet.busy = false;
    this.lastAction = this.time.now;
    if (this.ailments.every(isCured)) { this.finish(); return; }
    if (isCured(a)) this.pet.giggle();
    this.busy = false;
    this.drag.enabled = true;
  }

  // =================================================================
  // Festa e giardino
  // =================================================================
  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    this.busy = true;
    this.drag.enabled = false;
    this.hint.hide();
    const isNew = !save.state.cured.includes(this.petId);
    save.update({ visits: save.state.visits + 1, cured: addCured(save.state.cured, this.petId), last: this.petId, tutorialDone: true });
    this.time.delayedCall(350, () => {
      sfx.party();
      this.pet.party();
      const c = this.pet.spot('neck');
      burst(this, c.x, c.y - 120, 'confetti', { count: 40, tints: [0xff5a5f, 0xffc800, 0x4cc3a5, 0x36a9f0, 0xb58cf0, 0xff8fb0], speed: [300, 750], scale: [1, 0.5], gravity: 700, life: 1600, depth: 1500 });
      burst(this, c.x, c.y - 200, 'heart', { count: 10, speed: [200, 480], scale: [0.9, 0.3], gravity: 200, life: 1400, depth: 1500 });
      burst(this, c.x, c.y, 'cu_pawprint', { count: 10, tints: [0xffffff, 0xffe066, 0xa7f0dc], speed: [200, 520], scale: [0.9, 0.3], gravity: 300, life: 1300, depth: 1500 });
    });
    // gli strumenti scendono dal vassoio
    this.tools.forEach((t, i) => this.tweens.add({ targets: t.obj, y: t.obj.y + 260, alpha: 0, duration: 400, delay: 700 + i * 40, ease: 'Back.easeIn' }));
    this.time.delayedCall(2600, () => {
      sfx.whoosh();
      this.pet.leave(-500);
      this.time.delayedCall(500, () => goTo(this, 'cuccioli:Garden', { arrive: this.petId, isNew }));
    });
  }

  // =================================================================
  // Manina d'aiuto: subito alla prima visita, poi dopo qualche secondo senza azioni o dopo due tentativi
  // =================================================================
  private idleCheck(): void {
    if (this.busy || this.hint.visible || this.drag.dragging) return;
    if (this.time.now - this.lastAction > IDLE_HINT_MS) this.showHint();
  }

  private showHint(): void {
    if (this.busy || this.drag.dragging) return;
    const a = this.ailments.find((x) => !isCured(x));
    if (!a) return;
    const tool = toolNeeded(a);
    const item = this.tools.find((t) => t.id === tool && t.enabled);
    if (!item) return;
    const sp = this.pet.spot(problemById(a.id).spot);
    this.hint.drag(item.obj.x, item.obj.y - 40, sp.x, sp.y);
    this.lastAction = this.time.now;
  }

  // =================================================================
  // Solo test automatici (?debug=1): esegue la prossima cura come un tocco sullo strumento giusto
  // =================================================================
  autoStep(): string {
    if (this.finished) return 'done';
    if (this.busy) return 'busy';
    const a = this.ailments.find((x) => !isCured(x));
    if (!a) return 'done';
    const tool = toolNeeded(a);
    const item = this.tools.find((t) => t.id === tool);
    if (!item) return 'no-tool';
    this.onTapTool(item);
    return `${a.id}:${tool}`;
  }

  /** Strumenti e passi di questa visita (per i test). */
  get steps(): ToolId[] { return stepsOf(this.ailments.map((a) => a.id)); }
}
