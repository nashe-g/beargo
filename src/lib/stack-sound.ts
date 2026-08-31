/**
 * Tiny synthesized sounds — no assets to load, nothing essential rides on
 * them (bars are loud, phones are muted). The AudioContext unlocks on the
 * first tap, which is always a user gesture.
 */

type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) {
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(
  c: AudioContext,
  freq: number,
  at: number,
  durationS: number,
  peak: number,
  type: OscillatorType = "triangle",
) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + durationS);
  osc.connect(gain).connect(c.destination);
  osc.start(at);
  osc.stop(at + durationS + 0.02);
}

/** Glass clink on a catch. Slight pitch variance so taps don't machine-gun. */
export function clinkSound() {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  const base = 1500 + Math.random() * 700;
  tone(c, base, now, 0.07, 0.035);
  tone(c, base * 2.6, now, 0.045, 0.014, "sine");
}

/** The whole tray goes. Noise burst plus a couple of falling clinks. */
export function crashSound() {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  const length = Math.floor(c.sampleRate * 0.32);
  const buffer = c.createBuffer(1, length, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 1.6;
  }
  const source = c.createBufferSource();
  source.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(3200, now);
  filter.frequency.exponentialRampToValueAtTime(420, now + 0.3);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.09, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
  source.connect(filter).connect(gain).connect(c.destination);
  source.start(now);
  tone(c, 1900, now + 0.03, 0.08, 0.03);
  tone(c, 1200, now + 0.12, 0.09, 0.024);
}

/** Short finish sting when a carry survives. Two quick notes, quiet. */
export function stingSound() {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  tone(c, 659, now, 0.1, 0.03);
  tone(c, 880, now + 0.09, 0.14, 0.03);
}
