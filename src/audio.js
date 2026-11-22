/**
 * Audio module for Haunted Study Tracker
 * Manages sound effects with mute toggle and reduced-motion support
 */

import { playWhoosh, playBell, resumeAudioContext } from "./sound.js";

// Audio state
let isMuted = true; // Off by default per requirements
let prefersReducedMotion = false;

/**
 * Check if system prefers reduced motion
 */
function checkReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Initialize audio system
 * @param {Object} state - Application state with soundOn property
 */
export function initAudio(state) {
  // Load mute state from application state
  isMuted = !state.soundOn;
  
  // Check system preference
  prefersReducedMotion = checkReducedMotion();
  
  // Listen for system preference changes
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  mediaQuery.addEventListener("change", (e) => {
    prefersReducedMotion = e.matches;
  });
  
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
  if (!isMuted && !prefersReducedMotion) {
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
  if (!isMuted && !prefersReducedMotion) {
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

/**
 * Check if animations should be reduced
 * @returns {boolean} True if system prefers reduced motion
 */
export function shouldReduceMotion() {
  return prefersReducedMotion;
}
