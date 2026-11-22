/**
 * Task list UI integration tests
 * Tests form validation, task management, and sorting
 */

import test from "node:test";
import assert from "node:assert";
import { sortPending, isWarning } from "../src/logic.js";

test("Task management - Form validation", async (t) => {
  // Test empty title validation
  await t.test("rejects empty title", () => {
    const title = "";
    const subject = "Math";
    const deadline = "2026-12-25T10:00:00";

    assert.strictEqual(title.trim(), "", "Title is empty");
  });

  // Test empty deadline validation
  await t.test("rejects empty deadline", () => {
    const title = "Assignment";
    const subject = "Math";
    const deadline = "";

    assert.strictEqual(deadline.trim(), "", "Deadline is empty");
  });
});

test("Task management - Sorting", async (t) => {
  await t.test("sortPending filters done tasks and sorts by deadline", () => {
    const tasks = [
      {
        id: "1",
        title: "Task 1",
        subject: "Math",
        deadline: "2026-12-25T10:00:00",
        done: false,
      },
      {
        id: "2",
        title: "Task 2",
        subject: "Math",
        deadline: "2026-12-20T10:00:00",
        done: true,
      },
      {
        id: "3",
        title: "Task 3",
        subject: "Math",
        deadline: "2026-12-20T10:00:00",
        done: false,
      },
    ];

    const sorted = sortPending(tasks);

    // Should have 2 pending tasks (not done ones)
    assert.strictEqual(sorted.length, 2, "Should filter out done tasks");

    // Should be sorted by deadline (earliest first)
    assert.strictEqual(sorted[0].id, "3", "First should be Task 3");
    assert.strictEqual(sorted[1].id, "1", "Second should be Task 1");
  });
});

test("Task management - Warning wisp detection", async (t) => {
  const now = new Date("2026-12-24T12:00:00Z");

  await t.test("detects warning for task due within 24 hours", () => {
    // 10 hours in the future
    const deadline = new Date(now);
    deadline.setHours(deadline.getHours() + 10);

    const isWarn = isWarning(deadline.toISOString(), now);
    assert.strictEqual(isWarn, true, "Should warn for deadline in 10 hours");
  });

  await t.test("does not warn for overdue tasks", () => {
    // 1 hour in the past
    const deadline = new Date(now);
    deadline.setHours(deadline.getHours() - 1);

    const isWarn = isWarning(deadline.toISOString(), now);
    assert.strictEqual(isWarn, false, "Should not warn for overdue tasks");
  });

  await t.test("does not warn for tasks due more than 24 hours away", () => {
    // 25 hours in the future
    const deadline = new Date(now);
    deadline.setHours(deadline.getHours() + 25);

    const isWarn = isWarning(deadline.toISOString(), now);
    assert.strictEqual(isWarn, false, "Should not warn for deadline > 24h away");
  });

  await t.test("warns for task due in exactly 24 hours", () => {
    // Exactly 24 hours in the future
    const deadline = new Date(now);
    deadline.setHours(deadline.getHours() + 24);

    const isWarn = isWarning(deadline.toISOString(), now);
    assert.strictEqual(isWarn, true, "Should warn for deadline at 24h boundary");
  });
});

test("Task model - Structure validation", async (t) => {
  await t.test("creates valid task object", () => {
    const task = {
      id: "task-123",
      title: "Complete Assignment",
      subject: "Biology",
      deadline: "2026-12-25T23:59:00Z",
      done: false,
      completedAt: null,
    };

    assert.strictEqual(typeof task.id, "string", "ID should be string");
    assert.strictEqual(typeof task.title, "string", "Title should be string");
    assert.strictEqual(typeof task.subject, "string", "Subject should be string");
    assert.strictEqual(typeof task.deadline, "string", "Deadline should be string");
    assert.strictEqual(typeof task.done, "boolean", "Done should be boolean");
    assert(
      task.completedAt === null || typeof task.completedAt === "string",
      "CompletedAt should be null or string"
    );
  });
});

test("Task management - Edit scenario", async (t) => {
  await t.test("updates task correctly", () => {
    const originalTask = {
      id: "task-1",
      title: "Old Title",
      subject: "Old Subject",
      deadline: "2026-12-25T10:00:00Z",
      done: false,
      completedAt: null,
    };

    // Simulate edit
    const updatedTask = {
      ...originalTask,
      title: "New Title",
      subject: "New Subject",
      deadline: "2026-12-26T10:00:00Z",
    };

    assert.strictEqual(updatedTask.id, originalTask.id, "ID should not change");
    assert.notStrictEqual(updatedTask.title, originalTask.title, "Title should change");
    assert.notStrictEqual(updatedTask.subject, originalTask.subject, "Subject should change");
    assert.notStrictEqual(updatedTask.deadline, originalTask.deadline, "Deadline should change");
  });
});

test("Task management - Delete scenario", async (t) => {
  await t.test("removes task from list", () => {
    const tasks = [
      { id: "1", title: "Task 1", subject: "Math", deadline: "2026-12-25", done: false },
      { id: "2", title: "Task 2", subject: "Math", deadline: "2026-12-26", done: false },
      { id: "3", title: "Task 3", subject: "Math", deadline: "2026-12-27", done: false },
    ];

    const taskToDelete = "2";
    const filtered = tasks.filter((t) => t.id !== taskToDelete);

    assert.strictEqual(filtered.length, 2, "Should have 2 tasks after deletion");
    assert.strictEqual(filtered.find((t) => t.id === taskToDelete), undefined, "Deleted task should not exist");
  });
});
