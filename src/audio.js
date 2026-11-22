/**
 * Audio module for Haunted Study Tracker
 * Manages sound effects with mute toggle
 */

import { playWhoosh, playBell, resumeAudioContext } from "./sound.js";

// Audio state
let isMuted = true; // Off by default per requirements

/**
 * Initialize audio system
 * @param {Object} state - Application state with soundOn property
 */
export function initAudio(state) {
  // Load mute state from application state
  isMuted = !state.soundOn;
  
  // Resume audio context on user interaction
  document.addEventListener("click", resumeAudioContext, { once: true });
  document.addEventListener("keydown", resumeAudioContext, { once: true });
}

/**
 * Toggle mute state
 * @returns {boolean} New mute state (true = muted, false = sound on)
 */
export function toggleMute() {
  isMuted = !isMuted;
  return isMuted;
}

/**
 * Check if mute is enabled
 * @returns {boolean} True if muted
 */
export function isSoundMuted() {
  return isMuted;
}

/**
 * Play exorcism whoosh sound if not muted
 */
export function playExorcismSound() {
  if (!isMuted) {
    try {
      playWhoosh();
    } catch (e) {
      console.warn("Failed to play exorcism sound:", e);
    }
  }
}

/**
 * Play session complete bell sound if not muted
 */
export function playSessionCompleteSound() {
  if (!isMuted) {
    try {
      playBell();
    } catch (e) {
      console.warn("Failed to play bell sound:", e);
    }
  }
}

/**
 * Update UI button to reflect current mute state
 * @param {HTMLElement} button - Sound toggle button element
 */
export function updateSoundButtonUI(button) {
  if (!button) return;
  
  const icon = isMuted ? "🔇" : "🔊";
  const label = isMuted ? "Sound: Off" : "Sound: On";
  button.textContent = `${icon} ${label}`;
  button.setAttribute("aria-pressed", !isMuted ? "true" : "false");
}
