import Phaser from 'phaser';
import { setupView, button, pulse, burst } from '../../../core/ui';
import { t } from '../../../core/i18n';
import { muteButton, homeButton, title3d, goTo } from '../../../core/hud';
import { backToHub } from '../../../launcher';
import { SpaceBg, RocketView, PlanetView } from '../world';
import { isPlanetId, usableRocket } from '../planets';
import { save } from '../save';
import { sfx, playRazzoMusic } from '../sfx';

/** Menu del gioco: parti, i miei pianeti, i miei razzi, casa (menu Tappolino). */
export class Menu extends Phaser.Scene {
  private bg!: SpaceBg;
  private rocket!: RocketView;
  private zooming = false;

  constructor() { super('razzo:Menu'); }

  create(): void {
    setupView(this);
    this.cameras.main.fadeIn(250, 10, 16, 60);
    playRazzoMusic();
    this.zooming = false;
    this.bg = new SpaceBg(this, { nebula: 'violet', decor: ['anelli', 'bolle'] });

    const ttl = title3d(this, 960, 140, t('razzo.title'), 116);
    this.tweens.add({ targets: ttl, scale: 1.04, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const play = button(this, 600, 500, 'btn_play', () => this.go('razzo:Flight'), 1);
    pulse(this, play);
    button(this, 470, 810, 'rz_btn_planets', () => this.go('razzo:Planets'), 0.9);
    button(this, 730, 810, 'rz_btn_hangar', () => this.go('razzo:Hangar'), 0.9);

    // l'ultimo pianeta visitato (o il pianeta di casa) e il razzo scelto che aspetta di partire
    const last = save.state.last;
    const planet = new PlanetView(this, isPlanetId(last) && save.state.visited.includes(last) ? last : 'casa', 1660, 960, 1.05, 30);
    this.rocket = new RocketView(this, usableRocket(save.state.rocket, save.state.trips), 1260, 520, 1.1, 60);
    this.rocket.thrust(0.45);
    this.tweens.add({ targets: this.rocket, y: 490, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    muteButton(this);
    homeButton(this, () => backToHub(this));

    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length) return;
      const { worldX: x, worldY: y } = p;
      if (planet.hit(x, y, 0)) {
        planet.giggle();
        burst(this, x, y, 'sparkle', { count: 8, tints: [0xffffff, 0xffe066], gravity: 0, life: 600 });
      } else if (Math.abs(x - this.rocket.x) < 200 && Math.abs(y - this.rocket.y) < 110) {
        this.zoom();
      } else {
        sfx.twinkle();
        burst(this, x, y, 'sparkle', { count: 6, tints: [0xffffff, 0xffe066, 0x9fd8ff], speed: [80, 220], scale: [0.6, 0], gravity: 0, life: 600 });
      }
    });
  }

  /** Il razzo sfreccia via a destra e rientra da sinistra. */
  private zoom(): void {
    if (this.zooming) return;
    this.zooming = true;
    sfx.zoom();
    const r = this.rocket;
    r.thrust(1);
    burst(this, r.x - 150, r.y, 'sparkle', { count: 10, tints: [0xffe066, 0xffffff], speed: [100, 300], scale: [0.8, 0], gravity: 0, life: 600 });
    this.tweens.add({
      targets: r, x: 2700, duration: 650, ease: 'Quad.easeIn',
      onComplete: () => {
        r.x = -800;
        this.tweens.add({ targets: r, x: 1260, duration: 1000, ease: 'Cubic.easeOut', onComplete: () => { r.thrust(0.45); this.zooming = false; } });
      },
    });
  }

  private go(key: string): void {
    goTo(this, key);
  }

  update(_t: number, delta: number): void {
    const dt = Math.min(0.05, delta / 1000);
    this.bg.update(dt, 0);
    this.rocket.sync(dt);
  }
}
