/**
 * Storage module for Haunted Study Tracker
 * Handles localStorage with safe defaults
 */

const STORAGE_KEY = "hst:v1";

/**
 * Load state from localStorage with safe defaults
 * @returns {{tasks: Array, sessions: Object, exorcised: number, soundOn: boolean}}
 */
export function load() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
        sessions: typeof parsed.sessions === "object" && parsed.sessions !== null ? parsed.sessions : {},
        exorcised: typeof parsed.exorcised === "number" ? parsed.exorcised : 0,
        soundOn: typeof parsed.soundOn === "boolean" ? parsed.soundOn : false,
      };
    }
  } catch (e) {
    console.error("Failed to load state from storage:", e);
  }

  // Safe defaults
  return {
    tasks: [],
    sessions: {},
    exorcised: 0,
    soundOn: false,
  };
}

/**
 * Save state to localStorage
 * @param {{tasks: Array, sessions: Object, exorcised: number, soundOn: boolean}} state
 */
export function save(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save state to storage:", e);
  }
}
