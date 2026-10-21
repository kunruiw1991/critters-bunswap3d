/**
 * Critter Treasure Scoop 3D: Magic Lens & Bun Swap!
 * Procedural WebAudio ASMR: Crystal X-Ray Mind-Reading Chime, Golden Shovel Scoop,
 * Imperial Treasure Chest Fanfare, & Squishy Steamed Bun Swap!
 * 100% Zero-Voiceover (zero speechSynthesis).
 */

const PENTATONIC_HZ = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1318.51];

let ctx = null;
let masterGain = null;
let compressor = null;
let noiseBuffer = null;
let muted = false;
let listenersBound = false;
let gestureUnlocked = false;
let resumePending = false;
const lastTriggerMap = new Map();

function hasUserActivation() {
  if (typeof navigator !== 'undefined' && navigator.userActivation) {
    return Boolean(navigator.userActivation.isActive || navigator.userActivation.hasBeenActive);
  }
  return gestureUnlocked;
}

function canTrigger(key, minGapMs = 20) {
  const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  const prev = lastTriggerMap.get(key) || 0;
  if (now - prev < minGapMs) return false;
  lastTriggerMap.set(key, now);
  return true;
}

function createNoiseBuffer(audioCtx) {
  const sampleRate = audioCtx.sampleRate || 44100;
  const length = Math.floor(sampleRate * 1.2);
  const buffer = audioCtx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.997 * b0 + white * 0.08;
    b1 = 0.96 * b1 + white * 0.18;
    b2 = 0.65 * b2 + white * 0.45;
    data[i] = (b0 + b1 + b2 + white * 0.35) * 0.06;
  }
  return buffer;
}

function ensureContext() {
  if (typeof window === 'undefined') return null;
  if (!hasUserActivation()) return null;
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    try {
      ctx = new AudioCtx();
      compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-16, ctx.currentTime);
      compressor.knee.setValueAtTime(24, ctx.currentTime);
      compressor.ratio.setValueAtTime(6, ctx.currentTime);
      compressor.attack.setValueAtTime(0.005, ctx.currentTime);
      compressor.release.setValueAtTime(0.18, ctx.currentTime);

      masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(muted ? 0.0001 : 0.72, ctx.currentTime);

      masterGain.connect(compressor);
      compressor.connect(ctx.destination);
      noiseBuffer = createNoiseBuffer(ctx);
    } catch (_) {
      return null;
    }
  }
  if (ctx && ctx.state === 'suspended' && !resumePending) {
    resumePending = true;
    try {
      const p = ctx.resume();
      if (p && typeof p.then === 'function') {
        p.then(() => { resumePending = false; }, () => { resumePending = false; });
      } else {
        resumePending = false;
      }
    } catch (_) {
      resumePending = false;
    }
  }
  return ctx;
}

function bindGestureUnlock() {
  if (listenersBound || typeof window === 'undefined') return;
  listenersBound = true;
  const unlock = (e) => {
    if (e && e.isTrusted === false) return;
    gestureUnlocked = true;
    ensureContext();
  };
  const opts = { capture: true, passive: true };
  window.addEventListener('pointerdown', unlock, opts);
  window.addEventListener('mousedown', unlock, opts);
  window.addEventListener('touchstart', unlock, opts);
  window.addEventListener('keydown', unlock, opts);
  window.addEventListener('click', unlock, opts);
}

bindGestureUnlock();

function scheduleBellNote(audioCtx, dest, freq, startTime, duration = 0.25, peakGain = 0.22) {
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(freq, startTime);

  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(freq * 2, startTime);

  const g2 = audioCtx.createGain();
  g2.gain.setValueAtTime(0.16, startTime);
  g2.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.45);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0008, startTime + duration);

  osc1.connect(gain);
  osc2.connect(g2);
  g2.connect(gain);
  gain.connect(dest);

  osc1.start(startTime);
  osc2.start(startTime);
  osc1.stop(startTime + duration + 0.02);
  osc2.stop(startTime + duration + 0.02);
}

function scheduleNoiseBurst(audioCtx, dest, startTime, duration, freqStart, freqEnd, Q, peakGain) {
  if (!noiseBuffer) noiseBuffer = createNoiseBuffer(audioCtx);
  const src = audioCtx.createBufferSource();
  src.buffer = noiseBuffer;
  src.loop = true;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.setValueAtTime(Q, startTime);
  filter.frequency.setValueAtTime(Math.max(60, freqStart), startTime);
  if (freqEnd && freqEnd !== freqStart) {
    filter.frequency.exponentialRampToValueAtTime(Math.max(60, freqEnd), startTime + duration);
  }

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0008, startTime + duration);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(dest);

  src.start(startTime, (startTime * 0.29) % 0.6);
  src.stop(startTime + duration + 0.02);
}

export const BunSwapAudio = {
  init() {
    bindGestureUnlock();
    return ensureContext();
  },
  isMuted() {
    return muted;
  },
  setMuted(bool) {
    muted = Boolean(bool);
    if (ctx && masterGain) {
      const now = ctx.currentTime;
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setTargetAtTime(muted ? 0.0001 : 0.72, now, 0.02);
    }
    return muted;
  },
  toggleMute() {
    return this.setMuted(!muted);
  },

  /**
   * Crystal X-Ray Magnifying Lens mind-reading reveal ("隐藏信息读心镜")
   */
  playLensScan(idx = 0) {
    if (muted || !canTrigger('lensScan', 40)) return;
    const audioCtx = ensureContext();
    if (!audioCtx || !masterGain) return;
    try {
      const t = audioCtx.currentTime;
      const baseIdx = idx % 3;
      scheduleBellNote(audioCtx, masterGain, PENTATONIC_HZ[baseIdx + 1], t, 0.22, 0.18);
      scheduleBellNote(audioCtx, masterGain, PENTATONIC_HZ[baseIdx + 3], t + 0.055, 0.26, 0.20);
      scheduleBellNote(audioCtx, masterGain, PENTATONIC_HZ[baseIdx + 4], t + 0.11, 0.30, 0.18);
    } catch (_) {}
  },

  /**
   * Golden Shovel digging mound + popping out the Golden Imperial Treasure Chest!
   */
  playShovelScoop(moundIdx = 0) {
    if (muted || !canTrigger('shovelScoop', 40)) return;
    const audioCtx = ensureContext();
    if (!audioCtx || !masterGain) return;
    try {
      const t = audioCtx.currentTime;
      scheduleNoiseBurst(audioCtx, masterGain, t, 0.18, 340, 920, 2.2, 0.24);
      const n = PENTATONIC_HZ[moundIdx % PENTATONIC_HZ.length];
      scheduleBellNote(audioCtx, masterGain, n, t + 0.06, 0.25, 0.22);
      scheduleBellNote(audioCtx, masterGain, n * 1.5, t + 0.13, 0.32, 0.24);
    } catch (_) {}
  },

  /**
   * Plump Steamed Bun swap into the pit ("掉包热腾腾大包子") + Critter cheer!
   */
  playBunSwap(combo = 1) {
    if (muted || !canTrigger('bunSwap', 40)) return;
    const audioCtx = ensureContext();
    if (!audioCtx || !masterGain) return;
    try {
      const t = audioCtx.currentTime;
      // Soft squishy bun plop
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(540, t + 0.09);
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.24, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.13);

      // Rising celebratory pentatonic arpeggio
      const shift = Math.min(2, Math.max(0, combo - 1));
      scheduleBellNote(audioCtx, masterGain, PENTATONIC_HZ[1 + shift], t + 0.05, 0.22, 0.20);
      scheduleBellNote(audioCtx, masterGain, PENTATONIC_HZ[3 + shift], t + 0.11, 0.26, 0.22);
      scheduleBellNote(audioCtx, masterGain, PENTATONIC_HZ[4 + shift], t + 0.17, 0.34, 0.24);
    } catch (_) {}
  },

  playWaveEnd(canAdvance = true) {
    if (muted || !canTrigger('waveEnd', 120)) return;
    const audioCtx = ensureContext();
    if (!audioCtx || !masterGain) return;
    try {
      const t = audioCtx.currentTime;
      const notes = canAdvance
        ? [523.25, 659.25, 783.99, 1046.50, 1318.51]
        : [523.25, 440.00, 392.00];
      notes.forEach((f, idx) => {
        scheduleBellNote(audioCtx, masterGain, f, t + idx * 0.085, 0.36, 0.22);
      });
    } catch (_) {}
  },
};
