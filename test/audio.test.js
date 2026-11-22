/**
 * Tests for audio.js module
 * Tests sound behavior and mute toggle functionality
 */

import { test, describe } from "node:test";
import { strict as assert } from "node:assert";
import * as fc from "fast-check";
import {
  initAudio,
  toggleMute,
  isSoundMuted,
  playExorcismSound,
  playSessionCompleteSound,
  updateSoundButtonUI,
} from "../src/audio.js";

// Better DOM mock for Node.js environment
class MockElement {
  constructor() {
    this.textContent = "";
    this.attributes = new Map();
  }
  
  getAttribute(name) {
    return this.attributes.get(name) || null;
  }
  
  setAttribute(name, value) {
    this.attributes.set(name, value);
  }
}

// Mock window.matchMedia if not available
if (typeof window === "undefined") {
  global.window = {
    matchMedia: (query) => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  };
}

// Mock document if not available
if (typeof document === "undefined") {
  global.document = {
    addEventListener: () => {},
    createElement: (tag) => new MockElement(),
  };
}

describe("audio module", () => {
  test("initAudio sets muted to true by default", () => {
    const state = { soundOn: false };
    initAudio(state);
    assert.equal(isSoundMuted(), true);
  });

  test("initAudio respects soundOn state", () => {
    const state = { soundOn: true };
    initAudio(state);
    assert.equal(isSoundMuted(), false);
  });

  test("toggleMute switches between muted and not muted", () => {
    const state = { soundOn: false };
    initAudio(state);
    
    // Start muted
    assert.equal(isSoundMuted(), true);
    
    // Toggle to unmuted
    const result1 = toggleMute();
    assert.equal(result1, false);
    assert.equal(isSoundMuted(), false);
    
    // Toggle back to muted
    const result2 = toggleMute();
    assert.equal(result2, true);
    assert.equal(isSoundMuted(), true);
  });

  test("updateSoundButtonUI handles valid button elements", () => {
    const state = { soundOn: false };
    initAudio(state);
    
    const button = new MockElement();
    updateSoundButtonUI(button);
    
    // Should set text content and aria attributes
    assert.ok(button.textContent.length > 0);
    assert.ok(button.getAttribute("aria-pressed") !== null);
  });

  test("updateSoundButtonUI handles null button gracefully", () => {
    const state = { soundOn: false };
    initAudio(state);
    
    // Should not throw
    assert.doesNotThrow(() => updateSoundButtonUI(null));
  });

  test("playExorcismSound and playSessionCompleteSound do not throw when muted", () => {
    const state = { soundOn: false };
    initAudio(state);
    
    assert.doesNotThrow(() => playExorcismSound());
    assert.doesNotThrow(() => playSessionCompleteSound());
  });

  test("playExorcismSound and playSessionCompleteSound do not throw when unmuted", () => {
    const state = { soundOn: true };
    initAudio(state);
    
    assert.doesNotThrow(() => playExorcismSound());
    assert.doesNotThrow(() => playSessionCompleteSound());
  });

  test("property: toggleMute always changes isSoundMuted() result", () => {
    fc.assert(
      fc.property(fc.boolean(), (initialMuted) => {
        const state = { soundOn: !initialMuted };
        initAudio(state);
        
        const beforeToggle = isSoundMuted();
        toggleMute();
        const afterToggle = isSoundMuted();
        
        return beforeToggle !== afterToggle;
      })
    );
  });

  test("property: sound state can be toggled multiple times consistently", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10 }), (toggleCount) => {
        const state = { soundOn: false };
        initAudio(state);
        
        // Toggle the specified number of times
        for (let i = 0; i < toggleCount; i++) {
          toggleMute();
        }
        
        // Result should depend on even/odd number of toggles
        const expectedMuted = toggleCount % 2 === 0;
        return isSoundMuted() === expectedMuted;
      })
    );
  });
});
