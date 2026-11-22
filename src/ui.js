/**
 * UI module for Haunted Study Tracker
 * Handles rendering and DOM manipulation
 */

import { angerLevel, isWarning } from "./logic.js";

/**
 * Create a warning wisp next to a task
 * @returns {HTMLElement}
 */
export function createWarningWisp() {
  const span = document.createElement("span");
  span.className = "task-warning";
  span.innerHTML = '<span class="mist-wisp"></span> Due soon';
  return span;
}

/**
 * Create an overdue label for tasks
 * @param {string} deadline - ISO string deadline
 * @param {Date} now - Current date/time
 * @returns {HTMLElement}
 */
export function createOverdueLabel(deadline, now) {
  const span = document.createElement("span");
  span.className = "task-overdue";

  const hoursOverdue = Math.max(0, (now - new Date(deadline)) / (1000 * 60 * 60));
  const amount =
    hoursOverdue < 1 ? "< 1h" :
    hoursOverdue < 24 ? `${Math.floor(hoursOverdue)}h` :
    `${Math.floor(hoursOverdue / 24)}d`;

  span.textContent = `👻 Haunting you · ${amount} overdue`;
  return span;
}

/**
 * Update candle wax fraction
 * @param {HTMLElement} candleEl - Candle element
 * @param {number} fraction - Fraction 0-1
 */
export function updateCandleWax(candleEl, fraction) {
  const wax = candleEl.querySelector(".wax");
  if (wax) {
    wax.style.height = `${Math.max(0, Math.min(100, fraction * 100))}%`;
  }
}

/**
 * Update timer display
 * @param {HTMLElement} display - Timer display element
 * @param {number} remainingMs - Milliseconds remaining
 */
export function updateTimerDisplay(display, remainingMs) {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  display.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Exorcism effect: burst of light particles, then the ghost flashes, spins and fades.
 * Removes the ghost and calls onComplete exactly once when finished.
 */
export function playExorcismAnimation(ghostEl, onComplete) {
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    ghostEl.remove();
    if (onComplete) onComplete();
  };

  const layer = ghostEl.parentElement;
  if (!layer) return finish();

  // Burst of light particles from the ghost's centre
  const cx = ghostEl.offsetLeft + ghostEl.offsetWidth / 2;
  const cy = ghostEl.offsetTop + ghostEl.offsetHeight / 2;
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const distance = 60 + Math.random() * 60;
    const p = document.createElement("span");
    p.className = "particle";
    p.style.left = `${cx - 6}px`;
    p.style.top = `${cy - 6}px`;
    p.style.setProperty("--tx", `${Math.cos(angle) * distance}px`);
    p.style.setProperty("--ty", `${Math.sin(angle) * distance}px`);
    layer.appendChild(p);
    setTimeout(() => p.remove(), 900);
  }

  ghostEl.classList.add("exorcising");
  ghostEl.addEventListener("animationend", finish, { once: true });
  setTimeout(finish, 1000); // fallback if animationend never fires (e.g. animations turned off)
}

/**
 * Format a date for display
 * @param {string} isoString - ISO string deadline
 * @returns {string} Formatted date
 */
export function formatDeadline(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Create a task item element
 * @param {Object} task - Task object
 * @param {Date} now - Current date/time
 * @param {Function} onToggle - Callback for toggle
 * @param {Function} onEdit - Callback for edit
 * @param {Function} onDelete - Callback for delete
 * @returns {HTMLElement}
 */
export function createTaskItem(task, now, onToggle, onEdit, onDelete) {
  const item = document.createElement("div");
  item.className = `task-item ${task.done ? "done" : ""}`;
  item.setAttribute("data-task-id", task.id);

  const info = document.createElement("div");
  info.className = "task-info";

  const title = document.createElement("div");
  title.className = "task-title";
  title.textContent = task.title;

  const meta = document.createElement("div");
  meta.className = "task-meta";
  meta.textContent = `${task.subject} — ${formatDeadline(task.deadline)}`;

  info.appendChild(title);
  info.appendChild(meta);

  // Add overdue or warning label if needed
  if (!task.done) {
    const level = angerLevel(task.deadline, now);
    if (level > 0) {
      // Task is overdue
      info.appendChild(createOverdueLabel(task.deadline, now));
    } else if (isWarning(task.deadline, now)) {
      // Task due soon but not overdue
      info.appendChild(createWarningWisp());
    }
  }

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const toggleBtn = document.createElement("button");
  const level = angerLevel(task.deadline, now);
  toggleBtn.textContent = task.done ? "Undo" : (level > 0 ? "Exorcise" : "Done");
  toggleBtn.setAttribute("aria-label", `${toggleBtn.textContent}: ${task.title}`);
  toggleBtn.onclick = () => onToggle(task.id);

  const editBtn = document.createElement("button");
  editBtn.textContent = "Edit";
  editBtn.setAttribute("aria-label", `Edit: ${task.title}`);
  editBtn.onclick = () => onEdit(task.id);

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete";
  deleteBtn.textContent = "Delete";
  deleteBtn.setAttribute("aria-label", `Delete: ${task.title}`);
  deleteBtn.onclick = () => onDelete(task.id);

  actions.appendChild(toggleBtn);
  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  item.appendChild(info);
  item.appendChild(actions);

  return item;
}