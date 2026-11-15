import Phaser from 'phaser';
import { setupView, button, pin, burst } from '../../../core/ui';
import { t } from '../../../core/i18n';
import { muteButton, title3d, goTo } from '../../../core/hud';
import { FONT } from '../../../core/brand';
import { SpaceBg, PlanetView, hex } from '../world';
import { PLANETS } from '../planets';
import { save } from '../save';
import { sfx, playRazzoMusic } from '../sfx';

const S = 0.4;

/** I miei pianeti: la mappa delle stelle; quelli da visitare sono sagome con il punto interrogativo. */
export class Planets extends Phaser.Scene {
  private bg!: SpaceBg;

  constructor() { super('razzo:Planets'); }

  create(): void {
    setupView(this);
    this.cameras.main.fadeIn(250, 10, 16, 60);
    playRazzoMusic();
    this.bg = new SpaceBg(this, { nebula: 'pink' });
    title3d(this, 960, 110, t('razzo.planets'), 96);

    // costellazione che unisce i pianeti nell'ordine del viaggio
    const pos = PLANETS.map((_, i) => ({ x: 960 + ((i % 4) - 1.5) * 400 + (Math.floor(i / 4) ? 60 : -60), y: 390 + Math.floor(i / 4) * 340 }));
    const g = this.add.graphics().setDepth(20);
    g.lineStyle(5, 0xbfd0ff, 0.35);
    for (let i = 1; i < pos.length; i++) {
      const a = pos[i - 1], b = pos[i];
      const n = Math.floor(Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y) / 26);
      for (let k = 1; k < n; k += 2) {
        const u0 = k / n, u1 = (k + 1) / n;
        g.lineBetween(a.x + (b.x - a.x) * u0, a.y + (b.y - a.y) * u0, a.x + (b.x - a.x) * u1, a.y + (b.y - a.y) * u1);
      }
    }

    const visited = save.state.visited;
    const views: PlanetView[] = [];
    PLANETS.forEach((p, i) => {
      const { x, y } = pos[i];
      const has = visited.includes(p.id);
      const pv = new PlanetView(this, p.id, x, y, S, 30, { idle: false });
      pv.img.setScale(0);
      this.tweens.add({ targets: pv.img, scale: S, duration: 380, delay: 100 + i * 70, ease: 'Back.easeOut', onComplete: () => { if (has) pv.startIdle(); } });
      if (has) {
        this.add.text(x, y + 118, t(`razzo.planet.${p.id}`), {
          fontFamily: FONT, fontSize: '32px', fontStyle: '700', color: '#ffffff', stroke: '#2a2a8a', strokeThickness: 7,
        }).setOrigin(0.5).setDepth(33);
        views.push(pv);
      } else {
        pv.silhouette();
        this.add.text(x, y, '?', { fontFamily: FONT, fontSize: '96px', fontStyle: '700', color: '#ffffff', stroke: '#3c4fc4', strokeThickness: 10 }).setOrigin(0.5).setDepth(33).setAlpha(0.85);
      }
    });

    this.add.text(960, 1012, t('razzo.count', { n: visited.length, tot: PLANETS.length }), {
      fontFamily: FONT, fontSize: '48px', fontStyle: '700', color: '#ffffff', stroke: '#2a2a8a', strokeThickness: 8,
    }).setOrigin(0.5).setDepth(70);
    // tutte le stelle raccolte nei viaggi
    const star = this.add.image(1560, 1012, 'star').setScale(0.6).setDepth(70);
    this.add.text(star.x + 36, 1014, String(save.state.stars), {
      fontFamily: FONT, fontSize: '48px', fontStyle: '700', color: '#ffe066', stroke: '#6a3a00', strokeThickness: 8,
    }).setOrigin(0, 0.5).setDepth(70);

    muteButton(this);
    const home = button(this, 0, 0, 'btn_home', () => goTo(this, 'razzo:Menu'), 0.85);
    pin(this, home, 'tl', 80, 80);

    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length) return;
      const pv = views.find((v) => v.hit(p.worldX, p.worldY, 30));
      if (pv) {
        pv.giggle();
        const light = PLANETS.find((x) => x.id === pv.id)!.light;
        burst(this, pv.x, pv.y - 60, 'sparkle', { count: 10, tints: [0xffffff, hex(light), 0xffe066], speed: [150, 380], scale: [0.8, 0], gravity: 0, life: 700 });
      } else {
        sfx.twinkle();
        burst(this, p.worldX, p.worldY, 'sparkle', { count: 6, tints: [0xffffff, 0xffe066, 0x9fd8ff], speed: [80, 220], scale: [0.6, 0], gravity: 0, life: 600 });
      }
    });
  }

  update(_t: number, delta: number): void {
    this.bg.update(Math.min(0.05, delta / 1000), 0);
  }
}
