import type Phaser from 'phaser';
import { audio } from '../../core/audio';
import themeOgg from './audio/theme.ogg?url';
import themeMp3 from './audio/theme.mp3?url';

/**
 * Audio campionato di Pasticceria Magica: musica con strumenti veri (file audio) ed effetti preparati
 * offline (scripts/audio/). Il muto segue quello dell'app (core/audio). Nato nel modulo (decisione 17):
 * candidato a passare in core/ quando anche altri giochi useranno file audio.
 */

/** Durata esatta del loop della musica (deve coincidere con lo script pasticceria_music.py). */
export const THEME_LOOP = 80;

const SFX_FILES = import.meta.glob('./audio/sfx_*.mp3', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const SFX_URL: Record<string, string> = Object.fromEntries(
  Object.entries(SFX_FILES).map(([p, url]) => [p.replace(/^.*sfx_(.+)\.mp3$/, '$1'), url]),
);

const MUSIC_VOL = 0.42;
const SFX_VOL = 0.9;

class SampledAudio {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private musicBus!: GainNode;
  private sfxBus!: GainNode;
  private buffers = new Map<string, AudioBuffer>();
  private loading = false;
  private installed = false;
  private music: AudioBufferSourceNode | null = null;
  private musicGain: GainNode | null = null;
  private wantMusic = false;
  private game: Phaser.Game | null = null;
  private hiddenSuspended = false;

  /** Una volta sola: sblocco al primo tocco (iOS), pausa in background, muto sincronizzato. */
  install(): void {
    if (this.installed) return;
    this.installed = true;
    const unlock = () => { this.ensure(); void this.ctx?.resume().then(() => this.syncMusic()); };
    window.addEventListener('pointerdown', unlock, { capture: true });
    window.addEventListener('touchend', unlock, { capture: true });
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) {
        this.hiddenSuspended = this.ctx.state === 'running';
        void this.ctx.suspend();
      } else if (this.hiddenSuspended) {
        void this.ctx.resume();
      }
    });
    setInterval(() => this.tick(), 200);
    this.ensure();
  }

  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
    } catch {
      return null;
    }
    const c = this.ctx;
    this.master = c.createGain();
    this.master.gain.value = audio.muted ? 0 : 1;
    this.master.connect(c.destination);
    this.musicBus = c.createGain();
    this.musicBus.gain.value = MUSIC_VOL;
    this.musicBus.connect(this.master);
    this.sfxBus = c.createGain();
    this.sfxBus.gain.value = SFX_VOL;
    this.sfxBus.connect(this.master);
    void this.loadAll();
    return c;
  }

  private async loadAll(): Promise<void> {
    if (this.loading || !this.ctx) return;
    this.loading = true;
    const canOgg = typeof Audio !== 'undefined' && new Audio().canPlayType('audio/ogg; codecs="vorbis"') !== '';
    // prima la musica, poi gli effetti (in parallelo, sono piccoli)
    await this.load('theme', canOgg ? themeOgg : themeMp3).catch(() => (canOgg ? this.load('theme', themeMp3) : undefined));
    this.syncMusic();
    await Promise.all(Object.entries(SFX_URL).map(([k, url]) => this.load(k, url).catch(() => undefined)));
  }

  private async load(key: string, url: string): Promise<void> {
    const c = this.ctx!;
    // i file più piccoli Vite li incorpora come data: URL (niente fetch, che le pagine di test potrebbero bloccare)
    const data = url.startsWith('data:') ? base64ToBuffer(url.slice(url.indexOf(',') + 1)) : await (await fetch(url)).arrayBuffer();
    // Safari vecchi: decodeAudioData solo con callback
    const buf = await new Promise<AudioBuffer>((ok, ko) => {
      const p = c.decodeAudioData(data, ok, ko) as Promise<AudioBuffer> | undefined;
      p?.catch?.(ko);
    });
    this.buffers.set(key, buf);
  }

  /** Effetto sonoro; piccole variazioni di tono evitano che i suoni ripetuti stanchino. */
  play(name: string, o: { vol?: number; rate?: number; jitter?: number; delay?: number } = {}): void {
    const c = this.ctx;
    const buf = this.buffers.get(name);
    if (!c || c.state !== 'running' || !buf || audio.muted) return;
    const src = c.createBufferSource();
    src.buffer = buf;
    const j = o.jitter ?? 0.04;
    src.playbackRate.value = (o.rate ?? 1) * (1 + (Math.random() * 2 - 1) * j);
    const g = c.createGain();
    g.gain.value = o.vol ?? 1;
    src.connect(g).connect(this.sfxBus);
    src.start(c.currentTime + (o.delay ?? 0));
  }

  /** La musica suona finché una scena di Pasticceria è attiva; la musica del menu Tappolino si ferma. */
  startMusic(scene: Phaser.Scene): void {
    this.install();
    this.game = scene.game;
    this.wantMusic = true;
    audio.stopSong();
    this.syncMusic();
  }

  private tick(): void {
    if (!this.ctx) return;
    const m = audio.muted ? 0 : 1;
    if (this.master.gain.value !== m) this.master.gain.setTargetAtTime(m, this.ctx.currentTime, 0.05);
    // tornati al menu Tappolino? la musica si ferma
    if (this.wantMusic && this.game && !this.game.scene.getScenes(true).some((s) => s.scene.key.startsWith('pasticceria:'))) {
      this.wantMusic = false;
      this.syncMusic();
    }
  }

  private syncMusic(): void {
    const c = this.ctx;
    if (!c) return;
    if (!this.wantMusic) {
      if (this.music && this.musicGain) {
        const s = this.music, g = this.musicGain;
        g.gain.setTargetAtTime(0, c.currentTime, 0.15);
        setTimeout(() => { try { s.stop(); } catch { /* già ferma */ } }, 900);
        this.music = null;
        this.musicGain = null;
      }
      return;
    }
    const buf = this.buffers.get('theme');
    if (this.music || !buf || c.state !== 'running') return;
    const src = c.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    // MP3: alcuni decoder lasciano ~25 ms di silenzio iniziale; il loop parte dopo
    const start = leadingSilence(buf);
    src.loopStart = start;
    src.loopEnd = Math.min(buf.duration, start + THEME_LOOP);
    const g = c.createGain();
    g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime(1, c.currentTime + 1.2);
    src.connect(g).connect(this.musicBus);
    src.start(c.currentTime, start);
    this.music = src;
    this.musicGain = g;
  }
}

function base64ToBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

/** Secondi di silenzio all'inizio del buffer (al massimo 0,1 s). */
function leadingSilence(buf: AudioBuffer): number {
  const d = buf.getChannelData(0);
  const max = Math.min(d.length, Math.floor(buf.sampleRate * 0.1));
  for (let i = 0; i < max; i++) if (Math.abs(d[i]) > 1e-4) return i < buf.sampleRate * 0.005 ? 0 : i / buf.sampleRate;
  return 0;
}

export const sound = new SampledAudio();
