// Procedural Web-Audio engine — no audio files. Ambient pad, footsteps, engine,
// collect chimes, UI blips, the "world online" swell, and a boot drone.
class AudioEngine {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  musicGain: GainNode | null = null;
  started = false;
  muted = false;
  private engine: { osc: OscillatorNode; sub: OscillatorNode; gain: GainNode; lp: BiquadFilterNode } | null = null;

  init() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.6;
    this.master.connect(ctx.destination);

    this.musicGain = ctx.createGain();
    this.musicGain.gain.value = 0.0;
    this.musicGain.connect(this.master);

    this.buildAmbient();
    this.buildEngine();
    this.started = true;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.6, this.ctx.currentTime, 0.05);
  }

  // ambient pad whose brightness grows with world vitality
  private padFilter: BiquadFilterNode | null = null;
  private buildAmbient() {
    const ctx = this.ctx!;
    const freqs = [55, 82.5, 110, 164.8];
    const filt = ctx.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.value = 400;
    filt.Q.value = 1;
    filt.connect(this.musicGain!);
    this.padFilter = filt;
    for (const f of freqs) {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = 0.06;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.05 + Math.random() * 0.05;
      const lg = ctx.createGain();
      lg.gain.value = 0.03;
      lfo.connect(lg);
      lg.connect(g.gain);
      o.connect(g);
      g.connect(filt);
      o.start();
      lfo.start();
    }
    this.musicGain!.gain.setTargetAtTime(0.5, ctx.currentTime, 2);
  }

  // vitality 0..1 -> brighter, richer pad
  setVitality(v: number) {
    if (!this.padFilter || !this.ctx) return;
    this.padFilter.frequency.setTargetAtTime(400 + v * 3200, this.ctx.currentTime, 1.5);
  }

  private buildEngine() {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const sub = ctx.createOscillator();
    osc.type = "sawtooth";
    sub.type = "square";
    sub.detune.value = -12;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 600;
    lp.Q.value = 3;
    osc.connect(gain);
    sub.connect(gain);
    gain.connect(lp);
    lp.connect(this.master!);
    osc.start();
    sub.start();
    this.engine = { osc, sub, gain, lp };
  }

  updateEngine(speed01: number, on: boolean) {
    if (!this.engine || !this.ctx) return;
    const t = this.ctx.currentTime;
    const base = 50 + speed01 * 230;
    this.engine.osc.frequency.setTargetAtTime(base, t, 0.06);
    this.engine.sub.frequency.setTargetAtTime(base * 0.5, t, 0.06);
    this.engine.lp.frequency.setTargetAtTime(500 + speed01 * 2600, t, 0.08);
    this.engine.gain.gain.setTargetAtTime(on ? 0.05 + speed01 * 0.14 : 0, t, 0.12);
  }
  engineOff() {
    if (this.engine && this.ctx) this.engine.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
  }

  private blip(freq: number, dur: number, type: OscillatorType, vol: number) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g);
    g.connect(this.master);
    o.start();
    o.stop(ctx.currentTime + dur + 0.02);
  }

  collect() {
    this.blip(880, 0.08, "square", 0.14);
    setTimeout(() => this.blip(1320, 0.12, "square", 0.14), 60);
  }
  chime() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => setTimeout(() => this.blip(f, 0.25, "sine", 0.18), i * 90));
  }
  ui() {
    this.blip(560, 0.06, "triangle", 0.1);
  }
  step(soft = false) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const dur = 0.08;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = soft ? 220 : 420;
    const g = ctx.createGain();
    g.gain.value = soft ? 0.06 : 0.1;
    src.connect(bp);
    bp.connect(g);
    g.connect(this.master);
    src.start();
  }
  boot() {
    if (!this.ctx) return;
    this.blip(110, 1.2, "sawtooth", 0.12);
    setTimeout(() => this.blip(220, 0.8, "sine", 0.1), 300);
  }
  finale() {
    [261.6, 329.6, 392, 523.25, 659.25, 783.99].forEach((f, i) =>
      setTimeout(() => this.blip(f, 0.6, "sine", 0.16), i * 120)
    );
  }
}

export const audio = new AudioEngine();
