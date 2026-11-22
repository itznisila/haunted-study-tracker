/**
 * Sound module for Haunted Study Tracker
 * Uses Web Audio API to play simple sounds
 */

let audioContext = null;

/**
 * Get or create audio context
 */
function getAudioContext() {
  if (!audioContext) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioContext = new AudioContext();
    }
  }
  return audioContext;
}

/**
 * Play a whoosh sound (exorcism effect)
 */
export function playWhoosh() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Swooshing pitch sweep down
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.start(now);
    osc.stop(now + 0.2);
  } catch (e) {
    console.error("Failed to play whoosh:", e);
  }
}

/**
 * Play a bell sound (timer complete)
 */
export function playBell() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Create multiple oscillators for a bell-like sound
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const freq = 400 + i * 150; // Multiple frequencies
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

      osc.start(now);
      osc.stop(now + 0.5);
    }
  } catch (e) {
    console.error("Failed to play bell:", e);
  }
}

/**
 * Resume audio context (required by browser autoplay policy)
 */
export function resumeAudioContext() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") {
    ctx.resume();
  }
}
