import Phaser from 'phaser';
import { setupView, button, pulse, burst } from '../../../core/ui';
import { t } from '../../../core/i18n';
import { muteButton, homeButton, title3d, goTo } from '../../../core/hud';
import { backToHub } from '../../../launcher';
import { drawSalon, UnicornView, FLOOR_Y } from '../world';
import { save } from '../save';
import { sfx, playUnicorniMusic } from '../sfx';

const UNI_X = 1270;

/** Menu del gioco: gioca, album delle foto, casa (menu Tappolino). Sulla pedana l'ultimo unicorno fotografato. */
export class Menu extends Phaser.Scene {
  constructor() { super('unicorni:Menu'); }

  create(): void {
    setupView(this);
    this.cameras.main.fadeIn(250, 143, 211, 255);
    playUnicorniMusic();
    drawSalon(this, { platformX: UNI_X, shelf: false });

    const ttl = title3d(this, 960, 140, t('unicorni.title'), 112);
    this.tweens.add({ targets: ttl, scale: 1.04, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const play = button(this, 660, 540, 'btn_play', () => goTo(this, 'unicorni:Salon'), 1);
    pulse(this, play);
    button(this, 660, 820, 'un_btn_album', () => goTo(this, 'unicorni:Album'), 0.9);

    const look = save.state.photos[0] ?? { u: 'perla' as const, c: 'pink' as const, a: ['bow' as const] };
    const uni = new UnicornView(this, UNI_X, FLOOR_Y, look, { depth: 50 });

    muteButton(this);
    homeButton(this, () => backToHub(this));

    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length || !uni.c.getBounds().contains(p.worldX, p.worldY)) return;
      sfx.neigh();
      uni.face('happy');
      uni.hop(() => uni.face('open'));
      burst(this, p.worldX, p.worldY - 40, 'sparkle', { count: 12, tints: [0xffffff, 0xffe066, 0xffb3d9], gravity: 0, life: 700 });
    });
  }
}
