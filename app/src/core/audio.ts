/**
 * Audio sintetizzato con Web Audio: nessun file audio, nessuna licenza da gestire,
 * peso quasi zero. Musica a volume basso + effetti. Il muto è persistente (lo salva il gioco).
 */

export type Wave = OscillatorType;

export interface ToneOpts {
  freq: number;
  to?: number;            // frequenza finale (glissando)
  type?: Wave;
  dur?: number;           // secondi
  vol?: number;           // 0..1
  attack?: number;
  delay?: number;         // secondi da adesso
  vibrato?: number;       // Hz di vibrato (0 = nessuno)
  vibratoDepth?: number;  // Hz
}

export interface NoiseOpts {
  dur?: number;
  vol?: number;
  filter?: BiquadFilterType;
  freq?: number;
  to?: number;
  q?: number;
  delay?: number;
  attack?: number;
}

/** Nota musicale: [nota | null per pausa, durata in battiti]. Es. ['C5', 1] */
export type Note = [string | null, number];
export interface Track { wave: Wave; vol: number; notes: Note[]; }
export interface Song { bpm: number; tracks: Track[]; }

const NOTE_INDEX: Record<string, number> = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };

export function noteFreq(n: string): number {
  const m = /^([A-G]#?)(\d)$/.exec(n);
  if (!m) return 440;
  const semis = NOTE_INDEX[m[1]] + (Number(m[2]) + 1) * 12;
  return 440 * Math.pow(2, (semis - 69) / 12);
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfxBus!: GainNode;
  private musicBus!: GainNode;
  private noiseBuf: AudioBuffer | null = null;
  private _muted = false;
  private song: Song | null = null;
  private songTimer: ReturnType<typeof setInterval> | null = null;
  private nextTimes: number[] = [];
  private nextIdx: number[] = [];
  private hiddenSuspended = false;

  get muted(): boolean { return this._muted; }

  /** Va chiamato una volta all'avvio: sblocca l'audio al primo tocco (obbligatorio su iOS). */
  install(): void {
    const unlock = () => {
      this.ensure();
      void this.ctx?.resume();
    };
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
    this.master.gain.value = this._muted ? 0 : 1;
    this.master.connect(c.destination);
    this.sfxBus = c.createGain();
    this.sfxBus.gain.value = 0.55;
    this.sfxBus.connect(this.master);
    this.musicBus = c.createGain();
    this.musicBus.gain.value = 0.16;
    this.musicBus.connect(this.master);
    const len = c.sampleRate * 1;
    this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    if (this.song && !this.songTimer) this.startScheduler();
    return c;
  }

  setMuted(m: boolean): void {
    this._muted = m;
    if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.03);
  }

  tone(o: ToneOpts, bus: 'sfx' | 'music' = 'sfx', at?: number): void {
    const c = this.ensure();
    if (!c || c.state !== 'running') return;
    const t0 = at ?? c.currentTime + (o.delay ?? 0);
    const dur = o.dur ?? 0.2;
    const vol = o.vol ?? 0.5;
    const atk = o.attack ?? 0.01;
    const osc = c.createOscillator();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(o.freq, t0);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t0 + dur);
    if (o.vibrato) {
      const lfo = c.createOscillator();
      const lg = c.createGain();
      lfo.frequency.value = o.vibrato;
      lg.gain.value = o.vibratoDepth ?? 8;
      lfo.connect(lg).connect(osc.frequency);
      lfo.start(t0);
      lfo.stop(t0 + dur + 0.05);
    }
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(bus === 'sfx' ? this.sfxBus : this.musicBus);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  noise(o: NoiseOpts): void {
    const c = this.ensure();
    if (!c || c.state !== 'running' || !this.noiseBuf) return;
    const t0 = c.currentTime + (o.delay ?? 0);
    const dur = o.dur ?? 0.3;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const f = c.createBiquadFilter();
    f.type = o.filter ?? 'lowpass';
    f.frequency.setValueAtTime(o.freq ?? 1200, t0);
    if (o.to) f.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t0 + dur);
    f.Q.value = o.q ?? 1;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.vol ?? 0.4, t0 + (o.attack ?? 0.02));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(this.sfxBus);
    src.start(t0, Math.random() * 0.5);
    src.stop(t0 + dur + 0.05);
  }

  /** Avvia una canzone in loop (sostituisce la precedente). */
  playSong(song: Song): void {
    if (this.song === song) return;
    this.stopSong();
    this.song = song;
    if (this.ctx) this.startScheduler();
  }

  stopSong(): void {
    if (this.songTimer) clearInterval(this.songTimer);
    this.songTimer = null;
    this.song = null;
  }

  private startScheduler(): void {
    const c = this.ctx;
    const song = this.song;
    if (!c || !song) return;
    const start = c.currentTime + 0.1;
    this.nextTimes = song.tracks.map(() => start);
    this.nextIdx = song.tracks.map(() => 0);
    const beat = 60 / song.bpm;
    const tick = () => {
      if (!this.ctx || this.song !== song) return;
      if (this.ctx.state !== 'running') {
        // Dopo una pausa riallinea il tempo per non "recuperare" note perse.
        this.nextTimes = this.nextTimes.map(() => this.ctx!.currentTime + 0.1);
        return;
      }
      const horizon = this.ctx.currentTime + 0.25;
      song.tracks.forEach((tr, i) => {
        while (this.nextTimes[i] < horizon) {
          const [n, beats] = tr.notes[this.nextIdx[i]];
          const dur = beats * beat;
          if (n) this.tone({ freq: noteFreq(n), type: tr.wave, dur: Math.max(0.08, dur * 0.9), vol: tr.vol, attack: 0.015 }, 'music', this.nextTimes[i]);
          this.nextTimes[i] += dur;
          this.nextIdx[i] = (this.nextIdx[i] + 1) % tr.notes.length;
        }
      });
    };
    this.songTimer = setInterval(tick, 60);
    tick();
  }
}

export const audio = new AudioEngine();
