import Phaser from 'phaser';
import { button, pin } from '../core/ui';
import { save } from '../save';
import { openParents, toggleMute } from '../app';

/** Pulsante muto in alto a destra (sempre visibile). */
export function muteButton(scene: Phaser.Scene): Phaser.GameObjects.Image {
  const key = () => (save.state.muted ? 'btn_sound_off' : 'btn_sound_on');
  const b = button(scene, 0, 0, key(), () => {
    toggleMute();
    b.setTexture(key());
  }, 0.9);
  pin(scene, b, 'tr', 80, 80);
  return b;
}

/** Lucchetto dell'area genitori (piccolo, in alto a sinistra). */
export function parentsButton(scene: Phaser.Scene, onMute: () => void): Phaser.GameObjects.Image {
  const b = button(scene, 0, 0, 'btn_lock', () => openParents(scene, onMute), 0.9);
  pin(scene, b, 'tl', 70, 70);
  return b;
}

/** Testo con contorno spesso, stile cartoon. */
export function title(scene: Phaser.Scene, x: number, y: number, text: string, size = 110): Phaser.GameObjects.Text {
  return scene.add.text(x, y, text, {
    fontFamily: '"Trebuchet MS", "Arial Rounded MT Bold", Verdana, sans-serif',
    fontSize: `${size}px`,
    fontStyle: 'bold',
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

/** Passaggio di scena con dissolvenza. */
export function goTo(scene: Phaser.Scene, key: string, data?: object): void {
  scene.cameras.main.fadeOut(220, 143, 211, 255);
  scene.cameras.main.once('camerafadeoutcomplete', () => scene.scene.start(key, data));
}
