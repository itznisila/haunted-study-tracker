/**
 * Main entry point for Haunted Study Tracker
 * Initializes the app with event listeners and renders initial state
 */

import { load, save } from "./storage.js";

/**
 * Initialize the application
 */
function initApp() {
  const state = load();

  // Setup would go here for tasks, timer, etc.
  // For now, just ensure the app can load without errors
  console.log("Haunted Study Tracker initialized");
  console.log("State loaded:", state);
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
