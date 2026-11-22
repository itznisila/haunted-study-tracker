/**
 * Pure business logic for Haunted Study Tracker
 * All functions are deterministic and have no side effects
 */

/**
 * Convert a Date to "YYYY-MM-DD" using local date components
 * @param {Date} date
 * @returns {string}
 */
export function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Calculate anger level for a ghost based on task deadline
 * @param {string} deadline - ISO string deadline
 * @param {Date} now - Current date/time
 * @returns {number} 0 (not overdue), 1 (<1 day), 2 (1-3 days), 3 (>3 days)
 */
export function angerLevel(deadline, now) {
  const deadlineDate = new Date(deadline);
  
  // Return 0 if the deadline is an invalid date
  if (isNaN(deadlineDate.getTime())) {
    return 0;
  }
  
  const msOverdue = now - deadlineDate;

  if (msOverdue < 0) {
    return 0; // Not yet overdue
  }

  const daysOverdue = msOverdue / (1000 * 60 * 60 * 24);

  if (daysOverdue < 1) {
    return 1;
  } else if (daysOverdue < 3) {
    return 2;
  } else {
    return 3;
  }
}

/**
 * Check if a task is a warning (due within 24 hours but not overdue)
 * @param {string} deadline - ISO string deadline
 * @param {Date} now - Current date/time
 * @returns {boolean}
 */
export function isWarning(deadline, now) {
  const deadlineDate = new Date(deadline);
  const msUntil = deadlineDate - now;
  const hoursUntil = msUntil / (1000 * 60 * 60);

  return msUntil > 0 && hoursUntil <= 24;
}

/**
 * Get visual style for a ghost based on anger level
 * @param {number} level - Anger level (0-3)
 * @returns {{size: number, opacity: number, speed: number}}
 */
export function ghostStyle(level) {
  // Clamp level to 0-3 range
  const clampedLevel = Math.max(0, Math.min(3, Math.floor(level)));
  
  const styles = {
    0: { size: 60, opacity: 0, speed: 0 },
    1: { size: 90, opacity: 0.85, speed: 1 },
    2: { size: 115, opacity: 0.92, speed: 2 },
    3: { size: 150, opacity: 1, speed: 3 },
  };

  return styles[clampedLevel];
}

/**
 * Calculate the current study streak
 * @param {{[key: string]: number}} sessions - Object mapping date strings to minutes studied
 * @param {Date} today - Today's date
 * @returns {number} Number of consecutive study days
 */
export function currentStreak(sessions, today) {
  if (!sessions || Object.keys(sessions).length === 0) {
    return 0;
  }

  let streak = 0;
  let checkDate = new Date(today);

  // Check if today has study time, using local date
  const todayStr = localDateKey(checkDate);
  if (sessions[todayStr] && sessions[todayStr] > 0) {
    streak = 1;
  } else {
    // Check if yesterday has study time
    checkDate.setDate(checkDate.getDate() - 1);
    const yesterdayStr = localDateKey(checkDate);
    if (sessions[yesterdayStr] && sessions[yesterdayStr] > 0) {
      streak = 1;
    } else {
      return 0;
    }
  }

  // Count backwards from the starting point
  while (true) {
    checkDate.setDate(checkDate.getDate() - 1);
    const dateStr = localDateKey(checkDate);
    if (sessions[dateStr] && sessions[dateStr] > 0) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calculate room brightness as a function of streak
 * @param {number} streak - Current streak count
 * @returns {number} Brightness from 0 to 1
 */
export function roomBrightness(streak) {
  // Clamp to 0-1 range
  const clampedStreak = Math.max(0, streak);
  return Math.min(clampedStreak, 7) / 7;
}

/**
 * Calculate candle wax fraction remaining
 * @param {number} remainingMs - Milliseconds remaining
 * @param {number} totalMs - Total milliseconds
 * @returns {number} Fraction 0-1
 */
export function candleFraction(remainingMs, totalMs) {
  // Return 0 if totalMs <= 0
  if (totalMs <= 0) {
    return 0;
  }
  
  return Math.max(0, Math.min(1, remainingMs / totalMs));
}

/**
 * Sort tasks by deadline, pending first
 * @param {Array} tasks - Array of task objects
 * @returns {Array} Sorted array of pending tasks
 */
export function sortPending(tasks) {
  return tasks
    .filter((task) => !task.done)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
}
