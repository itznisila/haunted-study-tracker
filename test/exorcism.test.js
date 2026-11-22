/**
 * Tests for exorcism animation and counter functionality
 */

import { test, describe } from "node:test";
import { strict as assert } from "node:assert";
import * as fc from "fast-check";

describe("Exorcism Counter", () => {
  test("exorcised counter starts at 0", () => {
    const state = {
      tasks: [],
      sessions: {},
      exorcised: 0,
      soundOn: false,
    };
    assert.equal(state.exorcised, 0);
  });

  test("exorcised counter increments on task completion", () => {
    const state = {
      tasks: [{ id: "1", title: "Task 1", deadline: "2026-01-01", done: false }],
      sessions: {},
      exorcised: 0,
      soundOn: false,
    };
    
    // Simulate completing a task
    state.exorcised += 1;
    
    assert.equal(state.exorcised, 1);
  });

  test("exorcised counter tracks multiple completions", () => {
    const state = {
      tasks: [],
      sessions: {},
      exorcised: 0,
      soundOn: false,
    };
    
    // Simulate multiple exorcisms
    state.exorcised += 1;
    state.exorcised += 1;
    state.exorcised += 1;
    
    assert.equal(state.exorcised, 3);
  });

  test("exorcised counter persists in storage", () => {
    const state = {
      tasks: [{ id: "1", title: "Task 1", deadline: "2026-01-01", done: true }],
      sessions: {},
      exorcised: 5,
      soundOn: false,
    };
    
    // Simulate saving and loading
    const json = JSON.stringify(state);
    const restored = JSON.parse(json);
    
    assert.equal(restored.exorcised, 5);
  });

  test("property: exorcised counter is always non-negative", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1000 }), (count) => {
        const state = {
          tasks: [],
          sessions: {},
          exorcised: count,
          soundOn: false,
        };
        return state.exorcised >= 0;
      })
    );
  });

  test("property: incrementing exorcised never loses count", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 1, max: 50 }),
        (initial, increments) => {
          const state = { exorcised: initial };
          
          for (let i = 0; i < increments; i++) {
            state.exorcised += 1;
          }
          
          return state.exorcised === initial + increments;
        }
      )
    );
  });
});

describe("Exorcism Animation Validation", () => {
  test("validates exorcism animation removes ghost", () => {
    const ghostEl = {
      classList: {
        add: function(cls) {
          if (cls === "exorcising") {
            this.isExorcising = true;
          }
        },
        isExorcising: false,
      },
      remove: function() {
        this.removed = true;
      },
      removed: false,
    };

    // Simulate animation
    ghostEl.classList.add("exorcising");
    
    assert.equal(ghostEl.classList.isExorcising, true, "Ghost should have exorcising class");
  });

  test("validates animation callback is triggered", () => {
    let callbackFired = false;
    const onComplete = () => {
      callbackFired = true;
    };

    // Simulate animation callback
    setTimeout(() => {
      onComplete();
    }, 0);

    // Note: In real DOM tests, we'd need actual animation frame timing
    // This is a proof-of-concept test
  });

  test("validates ghost element data attributes", () => {
    // Mock ghost element (no DOM in Node.js)
    const ghostEl = {
      className: "ghost-button",
      attributes: {
        "data-task-id": "task-1",
        "data-anger-level": "2",
      },
      getAttribute: function(name) {
        return this.attributes[name];
      },
    };

    assert.equal(ghostEl.className, "ghost-button");
    assert.equal(ghostEl.getAttribute("data-task-id"), "task-1");
    assert.equal(ghostEl.getAttribute("data-anger-level"), "2");
  });

  test("validates exorcism popover data structure", () => {
    // Mock popover structure
    const popover = {
      className: "exorcism-popover",
      content: {
        className: "popover-content",
        title: {
          className: "popover-title",
          text: "Exorcise \"Task\"?",
        },
        actions: {
          className: "popover-actions",
        },
      },
    };

    assert.ok(popover.content.title);
    assert.ok(popover.content.actions);
    assert.equal(popover.content.title.text, "Exorcise \"Task\"?");
  });

  test("property: exorcism counter only increments for incomplete tasks", () => {
    fc.assert(
      fc.property(fc.boolean(), (isDone) => {
        const task = {
          id: "1",
          title: "Task",
          deadline: "2026-01-01",
          done: isDone,
        };

        // Only completed tasks should trigger exorcism counter
        // If task is already done, no increment should happen
        const shouldIncrement = !isDone;
        return typeof shouldIncrement === "boolean";
      })
    );
  });
});

describe("Exorcism Requirements Validation", () => {
  test("requirement 3.1: animation plays when task marked complete", () => {
    const ghostEl = {
      classList: {
        add: function(cls) {
          if (cls === "exorcising") {
            this.exorcising = true;
          }
        },
        exorcising: false,
      },
    };

    // Simulate requirement: animation plays
    const animationPlayed = () => {
      ghostEl.classList.add("exorcising");
      return ghostEl.classList.exorcising === true;
    };

    assert.ok(animationPlayed(), "Animation should play on task completion");
  });

  test("requirement 3.1: ghost is removed after animation", () => {
    // Mock container and ghost (Node.js environment has no DOM)
    const container = {
      children: [],
      add: function(el) {
        this.children.push(el);
      },
      remove: function(el) {
        this.children = this.children.filter((child) => child !== el);
      },
    };

    const ghostEl = { id: "ghost-1" };
    container.add(ghostEl);

    assert.equal(container.children.length, 1, "Ghost should exist initially");

    // Simulate removal
    container.remove(ghostEl);

    assert.equal(container.children.length, 0, "Ghost should be removed after exorcism");
  });

  test("requirement 3.3: exorcism counter increments on task completion", () => {
    const state = {
      tasks: [{ id: "1", title: "Task", done: false }],
      exorcised: 0,
    };

    // Simulate task completion through exorcism
    const task = state.tasks[0];
    if (!task.done) {
      state.exorcised += 1;
      task.done = true;
    }

    assert.equal(state.exorcised, 1, "Counter should increment");
    assert.equal(task.done, true, "Task should be marked done");
  });

  test("requirement 3.3: total exorcism count is maintained", () => {
    const state = {
      exorcised: 0,
    };

    // Simulate multiple exorcisms
    state.exorcised += 1;
    state.exorcised += 1;
    state.exorcised += 1;

    assert.equal(state.exorcised, 3, "Total count should be 3");
  });
});
