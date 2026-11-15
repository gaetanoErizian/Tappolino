import Phaser from 'phaser';
import { button, pin } from './ui';
import { isMuted, toggleMute } from './appState';
import { FONT } from './brand';

/** Pulsante muto in alto a destra (sempre visibile, in ogni scena). */
export function muteButton(scene: Phaser.Scene): Phaser.GameObjects.Image {
  const key = () => (isMuted() ? 'btn_sound_off' : 'btn_sound_on');
  const b = button(scene, 0, 0, key(), () => {
    toggleMute();
    b.setTexture(key());
  }, 0.9);
  pin(scene, b, 'tr', 80, 80);
  return b;
}

/** Pulsante casa in alto a sinistra. */
export function homeButton(scene: Phaser.Scene, onTap: () => void, key = 'btn_home'): Phaser.GameObjects.Image {
  const b = button(scene, 0, 0, key, onTap, 0.85);
  pin(scene, b, 'tl', 80, 80);
  return b;
}

/** Testo con contorno spesso, stile cartoon. */
export function title(scene: Phaser.Scene, x: number, y: number, text: string, size = 110): Phaser.GameObjects.Text {
  return scene.add.text(x, y, text, {
    fontFamily: FONT,
    fontSize: `${size}px`,
    fontStyle: '700',
    color: '#ffffff',
    stroke: '#4a2a1e',
    strokeThickness: Math.round(size * 0.16),
    align: 'center',
  }).setOrigin(0.5).setDepth(900).setShadow(0, Math.round(size * 0.08), 'rgba(43,33,64,0.55)', Math.round(size * 0.06), true, true);
}

/** Titolo "in rilievo": riempimento sfumato (luce dall'alto) su contorno scuro. */
export function title3d(scene: Phaser.Scene, x: number, y: number, text: string, size = 110): Phaser.GameObjects.Text {
  const t = title(scene, x, y, text, size);
  const grad = t.context.createLinearGradient(0, 0, 0, t.height);
  grad.addColorStop(0.15, '#fff7c2');
  grad.addColorStop(0.55, '#ffcf3a');
  grad.addColorStop(0.9, '#ff8a1e');
  t.setFill(grad);
  return t;
}

/** Passaggio di scena con dissolvenza (colore cielo). */
export function goTo(scene: Phaser.Scene, key: string, data?: object): void {
  scene.cameras.main.fadeOut(220, 143, 211, 255);
  scene.cameras.main.once('camerafadeoutcomplete', () => scene.scene.start(key, data));
}
