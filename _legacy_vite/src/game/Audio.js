// Fully procedural sound — no audio files. Web Audio API only.
// Engine = two detuned oscillators whose pitch/volume track wheel speed.
// Plus: collision thuds (filtered noise burst), UI blips, checkpoint chime, ambient pad.
export default class Audio {
  constructor() {
    this.enabled = false;
    this.ctx = null;
    this.master = null;
    this.engine = null;
  }

  // Must be called from a user gesture (browsers block autoplay).
  init() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0.7;
    this.master.connect(ctx.destination);

    this._buildEngine();
    this._buildAmbient();
    this.enabled = true;
  }

  setMuted(muted) {
    if (!this.master) return;
    this.master.gain.setTargetAtTime(muted ? 0 : 0.7, this.ctx.currentTime, 0.05);
    this.muted = muted;
  }

  _buildEngine() {
    const ctx = this.ctx;
    const oscA = ctx.createOscillator();
    const oscB = ctx.createOscillator();
    oscA.type = "sawtooth";
    oscB.type = "square";
    oscB.detune.value = -12;

    const gain = ctx.createGain();
    gain.gain.value = 0.0;

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 700;
    lp.Q.value = 4;

    oscA.connect(gain);
    oscB.connect(gain);
    gain.connect(lp);
    lp.connect(this.master);

    oscA.start();
    oscB.start();
    this.engine = { oscA, oscB, gain, lp };
  }

  _buildAmbient() {
    const ctx = this.ctx;
    // soft evolving pad: two sine oscillators through a slow LFO-modulated gain
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    o1.type = "sine";
    o2.type = "sine";
    o1.frequency.value = 110;
    o2.frequency.value = 110 * 1.5;
    const g = ctx.createGain();
    g.gain.value = 0.05;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.035;
    lfo.connect(lfoGain);
    lfoGain.connect(g.gain);
    o1.connect(g);
    o2.connect(g);
    g.connect(this.master);
    o1.start();
    o2.start();
    lfo.start();
  }

  // speed01: 0..1 normalized speed; throttle: bool
  updateEngine(speed01, throttle) {
    if (!this.engine) return;
    const t = this.ctx.currentTime;
    const base = 55 + speed01 * 220;
    this.engine.oscA.frequency.setTargetAtTime(base, t, 0.06);
    this.engine.oscB.frequency.setTargetAtTime(base * 0.5, t, 0.06);
    this.engine.lp.frequency.setTargetAtTime(500 + speed01 * 2600, t, 0.08);
    const target = (throttle ? 0.12 : 0.05) + speed01 * 0.16;
    this.engine.gain.gain.setTargetAtTime(target, t, 0.1);
  }

  // filtered noise burst — intensity 0..1
  collision(intensity = 0.5) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const dur = 0.18 + intensity * 0.15;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const bp = ctx.createBiquadFilter();
    bp.type = "lowpass";
    bp.frequency.value = 280 + intensity * 600;
    const g = ctx.createGain();
    g.gain.value = Math.min(0.9, 0.25 + intensity * 0.7);
    src.connect(bp);
    bp.connect(g);
    g.connect(this.master);
    src.start();
  }

  // short pitched blip for UI / approaching a zone
  blip(freq = 660, dur = 0.09, type = "triangle", vol = 0.18) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = 0;
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g);
    g.connect(this.master);
    o.start();
    o.stop(ctx.currentTime + dur + 0.02);
  }

  // ascending arpeggio when a checkpoint/zone is unlocked
  chime() {
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => setTimeout(() => this.blip(f, 0.22, "sine", 0.22), i * 80));
  }

  // bright pickup for collectibles
  pickup() {
    if (!this.ctx) return;
    this.blip(880, 0.08, "square", 0.16);
    setTimeout(() => this.blip(1320, 0.12, "square", 0.16), 70);
  }
}
