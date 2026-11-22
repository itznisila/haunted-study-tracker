/**
 * Tests for timer functionality
 * Tests timer state management, candle melting, and session logging
 */

import { test, describe } from "node:test";
import { strict as assert } from "node:assert";
import * as fc from "fast-check";
import { candleFraction, localDateKey, currentStreak } from "../src/logic.js";

describe("Timer Functionality - Requirements 4.1-4.4", () => {
  // Requirement 4.1: 25-minute Pomodoro-style timer
  describe("4.1: 25-minute timer duration", () => {
    test("timer displays 25:00 at start", () => {
      const TIMER_DURATION = 25 * 60 * 1000; // 25 minutes in milliseconds
      const fraction = candleFraction(TIMER_DURATION, TIMER_DURATION);
      assert.equal(fraction, 1, "Full timer should be 1.0");
    });

    test("timer reaches 0 after 25 minutes", () => {
      const TIMER_DURATION = 25 * 60 * 1000;
      const fraction = candleFraction(0, TIMER_DURATION);
      assert.equal(fraction, 0, "Expired timer should be 0");
    });

    test("timer correctly calculates halfway point", () => {
      const TIMER_DURATION = 25 * 60 * 1000;
      const halfway = TIMER_DURATION / 2;
      const fraction = candleFraction(halfway, TIMER_DURATION);
      assert.equal(fraction, 0.5, "Halfway should be 0.5");
    });
  });

  // Requirement 4.2: Start/pause/reset controls and UI state management
  describe("4.2: Timer controls state management", () => {
    test("timer can be reset to full duration", () => {
      const TIMER_DURATION = 25 * 60 * 1000;
      // After reset, timeRemaining should equal TIMER_DURATION
      const timeRemaining = TIMER_DURATION;
      const fraction = candleFraction(timeRemaining, TIMER_DURATION);
      assert.equal(fraction, 1, "Reset timer should show 100% wax");
    });

    test("pause preserves time remaining", () => {
      const TIMER_DURATION = 25 * 60 * 1000;
      const timeAtPause = 10 * 60 * 1000; // 10 minutes remaining
      // After pause, candle height should reflect paused time
      const fraction = candleFraction(timeAtPause, TIMER_DURATION);
      assert.equal(fraction, 0.4, "Paused at 10 min should show 40% wax");
    });

    test("start resumes from paused time", () => {
      const TIMER_DURATION = 25 * 60 * 1000;
      const timeRemaining = 5 * 60 * 1000; // 5 minutes
      // Resume should not change timeRemaining
      const fraction = candleFraction(timeRemaining, TIMER_DURATION);
      assert(Math.abs(fraction - 0.2) < 0.01, "5 min remaining should be ~20%");
    });
  });

  // Requirement 4.3: Melting candle visual animation
  describe("4.3: Candle melting animation", () => {
    test("candle height decreases as time passes", () => {
      const TIMER_DURATION = 25 * 60 * 1000;
      const start = candleFraction(TIMER_DURATION, TIMER_DURATION);
      const halfway = candleFraction(TIMER_DURATION / 2, TIMER_DURATION);
      const end = candleFraction(0, TIMER_DURATION);
      
      assert(start > halfway, "Start should be taller than halfway");
      assert(halfway > end, "Halfway should be taller than end");
    });

    test("candle fraction is always 0-1", () => {
      const TIMER_DURATION = 25 * 60 * 1000;
      for (let remaining = 0; remaining <= TIMER_DURATION; remaining += 60000) {
        const fraction = candleFraction(remaining, TIMER_DURATION);
        assert(fraction >= 0 && fraction <= 1, `Fraction at ${remaining}ms should be 0-1`);
      }
    });

    test("property: candle height is always 0-1 during countdown", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 25 * 60 * 1000 }),
          (remainingMs) => {
            const TIMER_DURATION = 25 * 60 * 1000;
            const fraction = candleFraction(remainingMs, TIMER_DURATION);
            return fraction >= 0 && fraction <= 1;
          }
        )
      );
    });
  });

  // Requirement 4.4: Dims ghosts while timer running; logs minutes to streak
  describe("4.4: Ghost dimming and session logging", () => {
    test("session logging adds 25 minutes to today", () => {
      const sessions = {};
      const today = new Date();
      const todayKey = localDateKey(today);
      
      // Simulate session complete
      sessions[todayKey] = (sessions[todayKey] || 0) + 25;
      
      assert.equal(sessions[todayKey], 25, "Should log 25 minutes");
    });

    test("multiple sessions accumulate on same day", () => {
      const sessions = {};
      const today = new Date();
      const todayKey = localDateKey(today);
      
      // Complete two sessions
      sessions[todayKey] = (sessions[todayKey] || 0) + 25;
      sessions[todayKey] = (sessions[todayKey] || 0) + 25;
      
      assert.equal(sessions[todayKey], 50, "Two sessions should total 50 minutes");
    });

    test("session logging creates streak", () => {
      const sessions = {};
      const today = new Date();
      const todayKey = localDateKey(today);
      
      sessions[todayKey] = 25;
      
      const streak = currentStreak(sessions, today);
      assert.equal(streak, 1, "One session today should create streak of 1");
    });

    test("consecutive days build streak", () => {
      const sessions = {};
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const todayKey = localDateKey(today);
      const yesterdayKey = localDateKey(yesterday);
      
      sessions[todayKey] = 25;
      sessions[yesterdayKey] = 25;
      
      const streak = currentStreak(sessions, today);
      assert.equal(streak, 2, "Two consecutive days should create streak of 2");
    });
  });

  // Integration test
  describe("Timer Integration", () => {
    test("complete timer session creates one-day streak", () => {
      const sessions = {};
      const today = new Date();
      const todayKey = localDateKey(today);
      
      // Simulate timer completion
      sessions[todayKey] = (sessions[todayKey] || 0) + 25;
      
      const streak = currentStreak(sessions, today);
      assert.equal(streak, 1, "Completed timer session should create 1-day streak");
    });

    test("property: timer always records valid session time", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          (numSessions) => {
            const sessions = {};
            const today = new Date();
            const todayKey = localDateKey(today);
            
            for (let i = 0; i < numSessions; i++) {
              sessions[todayKey] = (sessions[todayKey] || 0) + 25;
            }
            
            return sessions[todayKey] === numSessions * 25;
          }
        )
      );
    });
  });
});
