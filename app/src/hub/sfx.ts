import { sound } from '../core/sound';
import themeOgg from './audio/theme.ogg?url';
import themeMp3 from './audio/theme.mp3?url';

/**
 * Musica e suoni del menu dei giochi: strumenti veri (file audio in ./audio/, generati da
 * scripts/audio/hub_audio.py), suonati dal lettore comune core/sound.
 */

/** Durata esatta del loop della musica: deve coincidere con quella stampata da hub_audio.py. */
export const HUB_LOOP = 35.555556;

const SFX_FILES = import.meta.glob('./audio/sfx_*.mp3', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

/** Pacchetto audio del menu (id "hub"). */
export function registerHubSound(): void {
  sound.register('hub', {
    music: { ogg: themeOgg, mp3: themeMp3, loop: HUB_LOOP },
    sfx: Object.fromEntries(Object.entries(SFX_FILES).map(([p, url]) => [p.replace(/^.*sfx_(.+)\.mp3$/, '$1'), url])),
  });
}

export const hubSfx = {
  /** tocco su un pulsante */
  pop(): void { sound.play('hub', 'pop', { vol: 0.8, jitter: 0.06 }); },
  /** apertura di un gioco */
  open(): void { sound.play('hub', 'open', { jitter: 0 }); },
  /** gioco bloccato */
  locked(): void { sound.play('hub', 'locked', { jitter: 0.02 }); },
  /** caricamento riuscito */
  ready(): void { sound.play('hub', 'ready', { vol: 0.8, jitter: 0 }); },
  /** cambio pagina */
  page(): void { sound.play('hub', 'page', { jitter: 0.03 }); },
};

/** Avvia (o riprende) la musica del menu. */
export function playHubMusic(): void {
  sound.playMusic('hub');
}
