/**
 * Tests for storage.js
 * Uses Node's built-in test runner with fast-check for property testing
 */

import { test, describe, beforeEach } from "node:test";
import { strict as assert } from "node:assert";
import * as fc from "fast-check";
import { load, save } from "../src/storage.js";

// Mock localStorage on globalThis
function setupStorageMock() {
  const store = {};
  globalThis.localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value;
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      for (const key in store) {
        delete store[key];
      }
    },
  };
}

describe("storage", () => {
  beforeEach(() => {
    setupStorageMock();
  });

  test("load returns safe defaults for empty storage", () => {
    const state = load();
    assert.deepEqual(state.tasks, []);
    assert.deepEqual(state.sessions, {});
    assert.equal(state.exorcised, 0);
    assert.equal(state.soundOn, false);
  });

  test("save and load roundtrip", () => {
    const originalState = {
      tasks: [{ id: 1, title: "Test", deadline: "2026-01-01", done: false }],
      sessions: { "2026-01-01": 25 },
      exorcised: 5,
      soundOn: true,
    };
    save(originalState);
    const loadedState = load();
    assert.deepEqual(loadedState, originalState);
  });

  test("property: save(state) then load() returns equal object", () => {
    fc.assert(
      fc.property(
        fc.record({
          tasks: fc.array(
            fc.record({
              id: fc.integer(),
              title: fc.string(),
              deadline: fc.date().map((d) => d.toISOString()),
              done: fc.boolean(),
            })
          ),
          sessions: fc.dictionary(fc.string(), fc.integer({ min: 0, max: 1000 })),
          exorcised: fc.integer({ min: 0, max: 100 }),
          soundOn: fc.boolean(),
        }),
        (state) => {
          save(state);
          const loaded = load();
          return JSON.stringify(loaded) === JSON.stringify(state);
        }
      )
    );
  });

  test("load handles corrupted JSON gracefully", () => {
    globalThis.localStorage.setItem("hst:v1", "not valid json");
    const state = load();
    // Should return safe defaults
    assert.deepEqual(state.tasks, []);
    assert.deepEqual(state.sessions, {});
    assert.equal(state.exorcised, 0);
    assert.equal(state.soundOn, false);
  });

  test("load coerces invalid types to safe defaults", () => {
    globalThis.localStorage.setItem("hst:v1", JSON.stringify({
      tasks: "not an array",
      sessions: "not an object",
      exorcised: "not a number",
      soundOn: "not a boolean",
    }));
    const state = load();
    assert.deepEqual(state.tasks, []);
    assert.deepEqual(state.sessions, {});
    assert.equal(state.exorcised, 0);
    assert.equal(state.soundOn, false);
  });
});
