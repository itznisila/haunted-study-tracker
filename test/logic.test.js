/**
 * Unit and property-based tests for logic.js
 * Uses Node's built-in test runner with fast-check for property testing
 */

import { test, describe } from "node:test";
import { strict as assert } from "node:assert";
import * as fc from "fast-check";
import {
  localDateKey,
  angerLevel,
  isWarning,
  ghostStyle,
  currentStreak,
  roomBrightness,
  candleFraction,
  sortPending,
} from "../src/logic.js";

describe("localDateKey", () => {
  test("formats date correctly", () => {
    const date = new Date("2026-01-15T10:30:00Z");
    const key = localDateKey(date);
    // Note: localDateKey uses local date components, not UTC
    // So the result depends on timezone, but should be YYYY-MM-DD format
    assert.match(key, /^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("angerLevel", () => {
  test("returns 0 for future deadlines", () => {
    const future = new Date();
    future.setDate(future.getDate() + 1);
    const level = angerLevel(future.toISOString(), new Date());
    assert.equal(level, 0);
  });

  test("returns 1 for deadlines less than 1 day overdue", () => {
    const now = new Date();
    const deadline = new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12 hours ago
    const level = angerLevel(deadline.toISOString(), now);
    assert.equal(level, 1);
  });

  test("returns 2 for deadlines 1-3 days overdue", () => {
    const now = new Date();
    const deadline = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
    const level = angerLevel(deadline.toISOString(), now);
    assert.equal(level, 2);
  });

  test("returns 3 for deadlines more than 3 days overdue", () => {
    const now = new Date();
    const deadline = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
    const level = angerLevel(deadline.toISOString(), now);
    assert.equal(level, 3);
  });

  test("returns 0 for invalid date", () => {
    const level = angerLevel("invalid-date", new Date());
    assert.equal(level, 0);
  });

  test("property: angerLevel is always 0-3", () => {
    fc.assert(
      fc.property(fc.date(), fc.date(), (deadline, now) => {
        const level = angerLevel(deadline.toISOString(), now);
        return level >= 0 && level <= 3;
      })
    );
  });

  test("property: angerLevel never decreases as now moves forward", () => {
    fc.assert(
      fc.property(fc.date(), fc.integer({ min: 0, max: 10 * 24 * 60 * 60 * 1000 }), (deadline, offset) => {
        const now1 = new Date();
        const now2 = new Date(now1.getTime() + offset);
        const level1 = angerLevel(deadline.toISOString(), now1);
        const level2 = angerLevel(deadline.toISOString(), now2);
        return level1 <= level2;
      })
    );
  });
});

describe("isWarning", () => {
  test("returns true for deadlines within 24 hours", () => {
    const now = new Date();
    const deadline = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours from now
    assert.equal(isWarning(deadline.toISOString(), now), true);
  });

  test("returns false for deadlines more than 24 hours away", () => {
    const now = new Date();
    const deadline = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days from now
    assert.equal(isWarning(deadline.toISOString(), now), false);
  });

  test("returns false for overdue deadlines", () => {
    const now = new Date();
    const deadline = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
    assert.equal(isWarning(deadline.toISOString(), now), false);
  });

  test("property: isWarning is always boolean", () => {
    fc.assert(
      fc.property(fc.date(), fc.date(), (deadline, now) => {
        const result = isWarning(deadline.toISOString(), now);
        return typeof result === "boolean";
      })
    );
  });
});

describe("ghostStyle", () => {
  test("returns valid style object for each level", () => {
    for (let level = 0; level <= 3; level++) {
      const style = ghostStyle(level);
      assert.equal(typeof style.size, "number");
      assert.equal(typeof style.opacity, "number");
      assert.equal(typeof style.speed, "number");
      assert.ok(style.opacity >= 0 && style.opacity <= 1);
    }
  });

  test("level 0 is smallest and most transparent", () => {
    const level0 = ghostStyle(0);
    const level3 = ghostStyle(3);
    assert.ok(level0.size <= level3.size);
    assert.ok(level0.opacity <= level3.opacity);
    assert.ok(level0.speed <= level3.speed);
  });

  test("property: ghostStyle never decreases size/opacity/speed as level rises, never undefined", () => {
    fc.assert(
      fc.property(fc.integer({ min: -10, max: 10 }), (level1) => {
        const level2 = level1 + 1;
        const style1 = ghostStyle(level1);
        const style2 = ghostStyle(level2);
        // Both should be defined objects
        if (!style1 || !style2) return false;
        if (typeof style1.size !== "number" || typeof style2.size !== "number") return false;
        // Properties should never decrease
        return (
          style1.size <= style2.size &&
          style1.opacity <= style2.opacity &&
          style1.speed <= style2.speed
        );
      })
    );
  });
});

describe("currentStreak", () => {
  test("returns 0 for empty sessions", () => {
    const today = new Date();
    const streak = currentStreak({}, today);
    assert.equal(streak, 0);
  });

  test("returns 1 for today only", () => {
    const today = new Date();
    const todayStr = localDateKey(today);
    const streak = currentStreak({ [todayStr]: 25 }, today);
    assert.equal(streak, 1);
  });

  test("counts consecutive days using local dates", () => {
    const today = new Date();
    const sessions = {};
    // Use local date components to avoid timezone issues
    const todayKey = localDateKey(today);
    const yesterdayKey = localDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1));
    const twoDaysAgoKey = localDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2));
    
    sessions[todayKey] = 25;
    sessions[yesterdayKey] = 25;
    sessions[twoDaysAgoKey] = 25;
    
    const streak = currentStreak(sessions, today);
    assert.equal(streak, 3);
  });

  test("breaks on gap in sessions", () => {
    const today = new Date();
    const sessions = {};
    const todayKey = localDateKey(today);
    const twoDaysAgoKey = localDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2));
    
    sessions[todayKey] = 25;
    sessions[twoDaysAgoKey] = 25;

    const streak = currentStreak(sessions, today);
    assert.equal(streak, 1); // Only today counts
  });

  test("property: currentStreak is always >= 0", () => {
    fc.assert(
      fc.property(fc.dictionary(fc.string(), fc.integer({ min: 0, max: 100 })), fc.date(), (sessions, today) => {
        const streak = currentStreak(sessions, today);
        return streak >= 0;
      })
    );
  });
});

describe("roomBrightness", () => {
  test("returns 0 for 0 streak", () => {
    assert.equal(roomBrightness(0), 0);
  });

  test("returns 1 for 7+ streak", () => {
    assert.equal(roomBrightness(7), 1);
    assert.equal(roomBrightness(10), 1);
  });

  test("returns increasing values as streak grows", () => {
    const brightness1 = roomBrightness(1);
    const brightness3 = roomBrightness(3);
    const brightness5 = roomBrightness(5);
    assert.ok(brightness1 < brightness3);
    assert.ok(brightness3 < brightness5);
  });

  test("property: roomBrightness is always between 0 and 1", () => {
    fc.assert(
      fc.property(fc.integer({ min: -10, max: 10 }), (streak) => {
        const brightness = roomBrightness(streak);
        return brightness >= 0 && brightness <= 1;
      })
    );
  });

  test("property: roomBrightness never decreases as streak rises", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 50 }), (streak) => {
        const b1 = roomBrightness(streak);
        const b2 = roomBrightness(streak + 1);
        return b1 <= b2;
      })
    );
  });
});

describe("candleFraction", () => {
  test("returns 1 when no time has elapsed", () => {
    const fraction = candleFraction(60000, 60000);
    assert.equal(fraction, 1);
  });

  test("returns 0 when time is up", () => {
    const fraction = candleFraction(0, 60000);
    assert.equal(fraction, 0);
  });

  test("returns 0.5 when halfway through", () => {
    const fraction = candleFraction(30000, 60000);
    assert.equal(fraction, 0.5);
  });

  test("clamps to 0-1 range", () => {
    assert.equal(candleFraction(-10000, 60000), 0);
    assert.equal(candleFraction(70000, 60000), 1);
  });

  test("returns 0 when totalMs is 0", () => {
    const fraction = candleFraction(10000, 0);
    assert.equal(fraction, 0);
  });

  test("returns 0 when totalMs is negative", () => {
    const fraction = candleFraction(10000, -1000);
    assert.equal(fraction, 0);
  });

  test("property: candleFraction is always 0-1 with positive totalMs", () => {
    fc.assert(
      fc.property(fc.integer({ min: -1000, max: 100000 }), fc.integer({ min: 1, max: 100000 }), (remaining, total) => {
        const fraction = candleFraction(remaining, total);
        return fraction >= 0 && fraction <= 1;
      })
    );
  });
});

describe("sortPending", () => {
  test("filters out done tasks", () => {
    const tasks = [
      { id: 1, title: "Task 1", deadline: "2026-01-01", done: true },
      { id: 2, title: "Task 2", deadline: "2026-01-02", done: false },
    ];
    const sorted = sortPending(tasks);
    assert.equal(sorted.length, 1);
    assert.equal(sorted[0].id, 2);
  });

  test("sorts by deadline ascending", () => {
    const tasks = [
      { id: 1, title: "Task 1", deadline: "2026-01-03", done: false },
      { id: 2, title: "Task 2", deadline: "2026-01-01", done: false },
      { id: 3, title: "Task 3", deadline: "2026-01-02", done: false },
    ];
    const sorted = sortPending(tasks);
    assert.deepEqual(sorted.map((t) => t.id), [2, 3, 1]);
  });

  test("property: sorted tasks are ordered by deadline", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.integer(),
            title: fc.string(),
            deadline: fc.date().map((d) => d.toISOString()),
            done: fc.boolean(),
          })
        ),
        (tasks) => {
          const sorted = sortPending(tasks);
          for (let i = 1; i < sorted.length; i++) {
            const prev = new Date(sorted[i - 1].deadline);
            const curr = new Date(sorted[i].deadline);
            if (prev > curr) return false;
          }
          return true;
        }
      )
    );
  });

  test("property: sortPending result contains no done tasks", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.integer(),
            title: fc.string(),
            deadline: fc.date().map((d) => d.toISOString()),
            done: fc.boolean(),
          })
        ),
        (tasks) => {
          const sorted = sortPending(tasks);
          return sorted.every((t) => !t.done);
        }
      )
    );
  });
});
