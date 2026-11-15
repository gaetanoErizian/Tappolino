import { audio } from './audio';

/**
 * Lettore audio comune a campioni: musica con strumenti veri ed effetti preparati offline (file audio).
 * Ogni parte dell'app registra un "pacchetto" (il menu dei giochi è `hub`, ogni gioco usa il proprio id)
 * con una musica in loop e i suoi effetti. Suona una sola musica alla volta.
 * Il muto segue quello dell'app (core/audio).
 */
export interface MusicDef {
  ogg: string;
  mp3: string;
  /** durata esatta del loop in secondi (quella scritta dallo script che genera la musica) */
  loop: number;
}

export interface SoundPack {
  music?: MusicDef;
  /** nome dell'effetto → URL del file (mp3) */
  sfx: Record<string, string>;
}

export interface PlayOpts { vol?: number; rate?: number; jitter?: number; delay?: number; }

const MUSIC_VOL = 0.42;
const SFX_VOL = 0.9;

class Sound {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private musicBus!: GainNode;
  private sfxBus!: GainNode;
  private packs = new Map<string, SoundPack>();
  private buffers = new Map<string, AudioBuffer>();
  private loading = new Map<string, Promise<void>>();
  private installed = false;
  private wanted: string | null = null;
  private playing: { pack: string; src: AudioBufferSourceNode; gain: GainNode } | null = null;
  private hiddenSuspended = false;

  /** Una volta sola: sblocco al primo tocco (obbligatorio su iOS), pausa in background, muto sincronizzato. */
  install(): void {
    if (this.installed || typeof window === 'undefined') return;
    this.installed = true;
    const unlock = () => { this.ensure(); void this.ctx?.resume().then(() => this.sync()); };
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
  }

  register(id: string, pack: SoundPack): void {
    this.packs.set(id, pack);
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
    return c;
  }

  /**
   * Scarica e decodifica musica ed effetti di un pacchetto. `onProgress` (0..1) alimenta la barra del loader.
   * Un file che non si carica non blocca gli altri: quel suono semplicemente non si sentirà.
   */
  preload(id: string, onProgress?: (p: number) => void): Promise<void> {
    const pending = this.loading.get(id);
    if (pending) return pending;
    const pack = this.packs.get(id);
    if (!pack || !this.ensure()) { onProgress?.(1); return Promise.resolve(); }
    const jobs: Array<() => Promise<void>> = [];
    if (pack.music) {
      const m = pack.music;
      const canOgg = typeof Audio !== 'undefined' && new Audio().canPlayType('audio/ogg; codecs="vorbis"') !== '';
      jobs.push(() => this.load(`${id}/music`, canOgg ? m.ogg : m.mp3).catch(() => (canOgg ? this.load(`${id}/music`, m.mp3) : undefined)).then(() => this.sync()));
    }
    for (const [name, url] of Object.entries(pack.sfx)) jobs.push(() => this.load(`${id}/${name}`, url));
    let ready = 0;
    const p = Promise.all(jobs.map((job) => job().catch(() => undefined).then(() => { ready++; onProgress?.(ready / jobs.length); }))).then(() => undefined);
    this.loading.set(id, p);
    return p;
  }

  private async load(key: string, url: string): Promise<void> {
    if (this.buffers.has(key)) return;
    const c = this.ctx!;
    // I file piccoli possono arrivare come data: URL (niente fetch, che alcune pagine di test bloccano).
    const data = url.startsWith('data:') ? base64ToBuffer(url.slice(url.indexOf(',') + 1)) : await (await fetch(url)).arrayBuffer();
    // Safari vecchi: decodeAudioData solo con callback.
    const buf = await new Promise<AudioBuffer>((ok, ko) => {
      const p = c.decodeAudioData(data, ok, ko) as Promise<AudioBuffer> | undefined;
      p?.catch?.(ko);
    });
    this.buffers.set(key, buf);
  }

  /** Effetto sonoro di un pacchetto; piccole variazioni di tono evitano che i suoni ripetuti stanchino. */
  play(pack: string, name: string, o: PlayOpts = {}): void {
    const c = this.ctx;
    const buf = this.buffers.get(`${pack}/${name}`);
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

  /** Avvia in loop la musica del pacchetto (sfumando quella in corso). */
  playMusic(pack: string): void {
    this.install();
    this.wanted = pack;
    void this.preload(pack);
    this.sync();
  }

  /** Sfuma e ferma la musica (es. quando parte un gioco con la sua musica). */
  stopMusic(): void {
    this.wanted = null;
    this.sync();
  }

  /** Musica attualmente richiesta (per i test e per il debug). */
  get music(): string | null { return this.wanted; }

  private tick(): void {
    if (!this.ctx) return;
    const m = audio.muted ? 0 : 1;
    if (this.master.gain.value !== m) this.master.gain.setTargetAtTime(m, this.ctx.currentTime, 0.05);
    this.sync();
  }

  private sync(): void {
    const c = this.ctx;
    if (!c) return;
    if (this.playing && this.playing.pack !== this.wanted) {
      const { src, gain } = this.playing;
      gain.gain.setTargetAtTime(0, c.currentTime, 0.12);
      setTimeout(() => { try { src.stop(); } catch { /* già ferma */ } }, 800);
      this.playing = null;
    }
    if (!this.wanted || this.playing || c.state !== 'running') return;
    const buf = this.buffers.get(`${this.wanted}/music`);
    const def = this.packs.get(this.wanted)?.music;
    if (!buf || !def) return;
    const src = c.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    // MP3: alcuni decoder lasciano qualche millisecondo di silenzio iniziale; il loop parte dopo.
    const start = leadingSilence(buf);
    src.loopStart = start;
    src.loopEnd = Math.min(buf.duration, start + def.loop);
    const gain = c.createGain();
    gain.gain.setValueAtTime(0, c.currentTime);
    gain.gain.linearRampToValueAtTime(1, c.currentTime + 1.0);
    src.connect(gain).connect(this.musicBus);
    src.start(c.currentTime, start);
    this.playing = { pack: this.wanted, src, gain };
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

export const sound = new Sound();
