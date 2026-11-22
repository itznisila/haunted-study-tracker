/**
 * Ghost haunting layer module for Haunted Study Tracker
 * Renders and animates ghosts for overdue tasks
 */

import { angerLevel, ghostStyle } from "./logic.js";

// Map to track animation frame IDs for cleanup
const animationFrameIds = new Map();

/**
 * Create a ghost SVG element
 */
function createGhostSVG(level, size) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 100 120");
  svg.setAttribute("width", size);
  svg.setAttribute("height", size);
  svg.classList.add("ghost-svg");

  const colors = {
    1: "rgba(232, 230, 240, 0.6)",
    2: "rgba(240, 100, 100, 0.8)",
    3: "rgba(192, 57, 43, 1)",
  };

  const ghostColor = colors[level] || colors[1];
  const glowColor = level === 3 ? "#c0392b" : level === 2 ? "rgba(240, 100, 100, 0.8)" : "rgba(255, 179, 71, 0.5)";
  const glowRadius = level === 1 ? 8 : level === 2 ? 12 : 15;

  const body = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  body.setAttribute("cx", "50");
  body.setAttribute("cy", "50");
  body.setAttribute("r", "40");
  body.setAttribute("fill", ghostColor);
  body.setAttribute("filter", `drop-shadow(0 0 ${glowRadius}px ${glowColor})`);

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

  const mouth = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  mouth.setAttribute("cx", "50");
  mouth.setAttribute("cy", "70");
  mouth.setAttribute("r", "5");
  mouth.setAttribute("fill", "#0b0a12");

  svg.appendChild(body);
  svg.appendChild(leftEye);
  svg.appendChild(rightEye);
  svg.appendChild(mouth);

  return svg;
}

/**
 * Create a ghost button element
 */
export function createGhostElement(task, now) {
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
  button.setAttribute("title", `${task.title}\nOverdue: ${daysText}`);

  const svg = createGhostSVG(level, style.size);
  svg.style.opacity = style.opacity;

  button.appendChild(svg);
  button.style.position = "absolute";
  button.style.pointerEvents = "auto";

  return button;
}

/**
 * Render ghosts in the haunting layer
 */
export function renderGhosts(tasks, now, container) {
  container.querySelectorAll(".ghost-button:not(.exorcising)").forEach((ghost) => {
    const ghostId = ghost.getAttribute("data-task-id");
    if (animationFrameIds.has(ghostId)) {
      cancelAnimationFrame(animationFrameIds.get(ghostId));
      animationFrameIds.delete(ghostId);
    }
    ghost.remove();
  });

  tasks.forEach((task) => {
    if (!task.done) {
      const ghostEl = createGhostElement(task, now);
      if (ghostEl) {
        container.appendChild(ghostEl);
      }
    }
  });
}

/**
 * Start drift animation for a ghost element
 */
export function driftGhost(element, speed, initialX, initialY) {
  let startTime = null;
  let posX = initialX;
  let posY = initialY;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    element.style.left = `${posX}px`;
    element.style.top = `${posY}px`;
    return;
  }

  const taskId = element.getAttribute("data-task-id");

  function animate(timestamp) {
    if (!element.parentElement) {
      animationFrameIds.delete(taskId);
      return;
    }

    if (!startTime) {
      startTime = timestamp;
    }

    const elapsed = timestamp - startTime;
    const amplitude = 20 * (speed / 3);
    const frequency = 0.002 * speed;

    const driftX = Math.sin(elapsed * frequency) * amplitude;
    const driftY = Math.cos(elapsed * frequency * 0.7) * amplitude * 0.6;

    element.style.left = `${posX + driftX}px`;
    element.style.top = `${posY + driftY}px`;

    const frameId = requestAnimationFrame(animate);
    animationFrameIds.set(taskId, frameId);
  }

  const frameId = requestAnimationFrame(animate);
  animationFrameIds.set(taskId, frameId);
}

/**
 * Update anger levels - reads CURRENT state.tasks each time
 */
export function updateAngerLevels(getStateTasks, now, container) {
  const tasks = getStateTasks();
  
  container.querySelectorAll(".ghost-button").forEach((ghostEl) => {
    const taskId = ghostEl.getAttribute("data-task-id");
    const task = tasks.find((t) => t.id === taskId);

    if (task) {
      const newLevel = angerLevel(task.deadline, now);
      const oldLevel = parseInt(ghostEl.getAttribute("data-anger-level"));

      if (newLevel !== oldLevel) {
        ghostEl.setAttribute("data-anger-level", newLevel);

        const style = ghostStyle(newLevel);
        const svg = ghostEl.querySelector(".ghost-svg");
        if (svg) {
          svg.setAttribute("width", style.size);
          svg.setAttribute("height", style.size);
          svg.style.opacity = style.opacity;
        }

        const daysOverdue = (now - new Date(task.deadline)) / (1000 * 60 * 60 * 24);
        const daysText = daysOverdue < 1 ? "< 1 day" : `${Math.floor(daysOverdue)} days`;
        ghostEl.setAttribute("aria-label", `Overdue ${daysText}: ${task.title}`);
      }
    }
  });
}

/**
 * Start the anger level update interval (every 60 seconds)
 */
export function startAngerUpdateInterval(getStateTasks, container) {
  return setInterval(() => {
    updateAngerLevels(getStateTasks, new Date(), container);
  }, 60000);
}