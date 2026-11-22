/**
 * UI module for Haunted Study Tracker
 * Handles rendering and DOM manipulation
 */

import { angerLevel, isWarning, ghostStyle, candleFraction } from "./logic.js";

/**
 * Create a ghost element for the haunting layer
 * @param {Object} task - Task object with id, title, deadline
 * @param {Date} now - Current date/time
 * @returns {HTMLElement} Ghost button element
 */
export function createGhost(task, now) {
  const level = angerLevel(task.deadline, now);
  const style = ghostStyle(level);

  if (style.opacity === 0) {
    return null;
  }

  const daysOverdue = (now - new Date(task.deadline)) / (1000 * 60 * 60 * 24);
  const daysText = daysOverdue < 1 ? "< 1 day" : `${Math.floor(daysOverdue)} days`;

  const button = document.createElement("button");
  button.className = "ghost-button";
  button.setAttribute("aria-label", `Overdue ${daysText}: ${task.title}`);
  button.setAttribute("data-task-id", task.id);
  button.setAttribute("data-anger-level", level);

  // Ghost SVG
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 100 120");
  svg.setAttribute("width", style.size);
  svg.setAttribute("height", style.size);
  svg.style.opacity = style.opacity;

  // Ghost color based on anger level
  const colors = {
    1: "rgba(232, 230, 240, 0.6)",
    2: "rgba(240, 100, 100, 0.8)",
    3: "rgba(192, 57, 43, 1)",
  };

  const ghostColor = colors[level] || colors[1];
  const glowColor = level === 3 ? "#c0392b" : "rgba(255, 179, 71, 0.5)";

  // Body
  const body = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  body.setAttribute("cx", "50");
  body.setAttribute("cy", "50");
  body.setAttribute("r", "40");
  body.setAttribute("fill", ghostColor);
  body.setAttribute("filter", `drop-shadow(0 0 ${15 * (level / 3)} ${glowColor})`);

  // Eyes
  const leftEye = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  leftEye.setAttribute("cx", "35");
  leftEye.setAttribute("cy", "45");
  leftEye.setAttribute("r", "6");
  leftEye.setAttribute("fill", "#0b0a12");

  const rightEye = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  rightEye.setAttribute("cx", "65");
  rightEye.setAttribute("cy", "45");
  rightEye.setAttribute("r", "6");
  rightEye.setAttribute("fill", "#0b0a12");

  // Mouth
  const mouth = document.createElementNS("http://www.w3.org/2000/svg", "path");
  mouth.setAttribute("d", "M 40 65 Q 50 75 60 65");
  mouth.setAttribute("stroke", "#0b0a12");
  mouth.setAttribute("stroke-width", "2");
  mouth.setAttribute("fill", "none");
  mouth.setAttribute("stroke-linecap", "round");

  svg.appendChild(body);
  svg.appendChild(leftEye);
  svg.appendChild(rightEye);
  svg.appendChild(mouth);

  button.appendChild(svg);
  button.style.position = "absolute";

  return button;
}

/**
 * Create a warning wisp next to a task
 * @returns {HTMLElement}
 */
export function createWarningWisp() {
  const span = document.createElement("span");
  span.className = "task-warning";
  span.textContent = "⚠️ Due soon";
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
 * Play exorcism animation on a ghost
 * @param {HTMLElement} ghostEl - Ghost button element
 * @param {Function} onComplete - Callback when animation completes
 */
export function playExorcismAnimation(ghostEl, onComplete) {
  ghostEl.classList.add("exorcising");

  // Create particles
  const rect = ghostEl.getBoundingClientRect();
  const container = ghostEl.parentElement;

  for (let i = 0; i < 8; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";
    particle.style.left = rect.left + rect.width / 2 + "px";
    particle.style.top = rect.top + rect.height / 2 + "px";
    particle.style.width = "10px";
    particle.style.height = "10px";
    particle.style.background = "rgba(255, 179, 71, 0.8)";
    particle.style.borderRadius = "50%";

    const angle = (i / 8) * Math.PI * 2;
    const distance = 100;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;

    particle.style.setProperty("--tx", `${tx}px`);
    particle.style.setProperty("--ty", `${ty}px`);

    container.appendChild(particle);

    setTimeout(() => particle.remove(), 600);
  }

  setTimeout(() => {
    ghostEl.remove();
    if (onComplete) onComplete();
  }, 600);
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

  // Add warning if needed
  if (!task.done && isWarning(task.deadline, now)) {
    info.appendChild(createWarningWisp());
  }

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const toggleBtn = document.createElement("button");
  toggleBtn.textContent = task.done ? "Undo" : "Done";
  toggleBtn.onclick = () => onToggle(task.id);

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete";
  deleteBtn.textContent = "Delete";
  deleteBtn.onclick = () => onDelete(task.id);

  actions.appendChild(toggleBtn);
  actions.appendChild(deleteBtn);

  item.appendChild(info);
  item.appendChild(actions);

  return item;
}
