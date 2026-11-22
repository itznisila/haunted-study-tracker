/**
 * Ghost haunting layer module for Haunted Study Tracker
 * Renders and animates ghosts for overdue tasks
 */

import { angerLevel, ghostStyle } from "./logic.js";

// Map to track animation frame IDs for cleanup
const animationFrameIds = new Map();

// Map to store ghost positions (persisted across re-renders)
const ghostPositions = new Map();

/**
 * How far (px) a ghost sways left/right around its fixed slot. Higher anger = wider.
 */
export function ghostWanderRange(speed) {
  return 8 + (speed - 1) * 6; // 8, 14, 20 px: ghosts hover in their slot, angrier = more restless
}

/**
 * Create a ghost SVG silhouette with proper head, wavy bottom, and eyes
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

  // Ghost body with wavy bottom: rounded head, 3-bump wavy bottom
  const body = document.createElementNS("http://www.w3.org/2000/svg", "path");
  // Path: rounded head (arc) + wavy bumpy bottom (sine wave with 3 bumps)
  body.setAttribute("d", "M 30 25 Q 20 25 20 40 Q 20 60 30 70 Q 25 75 30 80 Q 40 75 50 80 Q 60 75 70 80 Q 75 75 70 70 Q 80 60 80 40 Q 80 25 70 25 Q 60 20 50 20 Q 40 20 30 25 Z");
  body.setAttribute("fill", ghostColor);
  body.setAttribute("filter", `drop-shadow(0 0 ${glowRadius}px ${glowColor})`);

  // Left eye - narrows (becomes more oval) at higher anger levels
  const leftEye = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
  leftEye.setAttribute("cx", "35");
  leftEye.setAttribute("cy", "45");
  if (level === 3) {
    leftEye.setAttribute("rx", "4");
    leftEye.setAttribute("ry", "7");
  } else {
    leftEye.setAttribute("rx", "6");
    leftEye.setAttribute("ry", "6");
  }
  leftEye.setAttribute("fill", "#0b0a12");

  // Right eye - narrows at higher anger
  const rightEye = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
  rightEye.setAttribute("cx", "65");
  rightEye.setAttribute("cy", "45");
  if (level === 3) {
    rightEye.setAttribute("rx", "4");
    rightEye.setAttribute("ry", "7");
  } else {
    rightEye.setAttribute("rx", "6");
    rightEye.setAttribute("ry", "6");
  }
  rightEye.setAttribute("fill", "#0b0a12");

  // Mouth
  const mouth = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  mouth.setAttribute("cx", "50");
  mouth.setAttribute("cy", "60");
  mouth.setAttribute("r", "4");
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
 * Handles adding new ghosts, removing ghosts no longer overdue, and updating existing ones
 */
export function renderGhosts(tasks, now, container) {
  const existingGhosts = new Set();
  
  // Update or remove existing ghosts
  container.querySelectorAll(".ghost-button:not(.exorcising)").forEach((ghost) => {
    const taskId = ghost.getAttribute("data-task-id");
    const task = tasks.find((t) => t.id === taskId && !t.done);

    if (task) {
      // Task still overdue - update if anger level changed
      const newLevel = angerLevel(task.deadline, now);
      const oldLevel = parseInt(ghost.getAttribute("data-anger-level"));
      
      if (newLevel !== oldLevel) {
        const style = ghostStyle(newLevel);
        ghost.setAttribute("data-anger-level", newLevel);
        
        // Clear children and recreate SVG with new level
        ghost.innerHTML = "";
        const svg = createGhostSVG(newLevel, style.size);
        svg.style.opacity = style.opacity;
        ghost.appendChild(svg);
        
        // Update label
        const daysOverdue = (now - new Date(task.deadline)) / (1000 * 60 * 60 * 24);
        const daysText = daysOverdue < 1 ? "< 1 day" : `${Math.floor(daysOverdue)} days`;
        ghost.setAttribute("aria-label", `Overdue ${daysText}: ${task.title}`);
      }
      
      existingGhosts.add(taskId);
    } else {
      // Task no longer overdue - remove ghost
      cancelAnimationFrame(animationFrameIds.get(taskId));
      animationFrameIds.delete(taskId);
      ghostPositions.delete(taskId);
      ghost.remove();
    }
  });

  // Add new ghosts for tasks that became overdue
  tasks.forEach((task) => {
    if (!task.done && !existingGhosts.has(task.id)) {
      const ghostEl = createGhostElement(task, now);
      if (ghostEl) {
        container.appendChild(ghostEl);
      }
    }
  });
}

/**
 * Start drift animation for a ghost element with slow wandering and bob
 * Ghosts wander slowly across the haunting layer
 */
export function driftGhost(element, speed, initialX, initialY) {
  let startTime = null;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    element.style.left = `${initialX}px`;
    element.style.top = `${initialY}px`;
    return;
  }

  const taskId = element.getAttribute("data-task-id");
  const container = element.parentElement;
  
  // Small wander so the ghost stays in the empty spot it spawned in
  const amplitude = ghostWanderRange(speed);

  function animate(timestamp) {
    if (!element.parentElement) {
      animationFrameIds.delete(taskId);
      return;
    }

    if (!startTime) {
      startTime = timestamp;
    }

    const elapsed = timestamp - startTime;
    // Slow frequency: speed 1 = 0.0003, speed 3 = 0.0009 (90-180 second cycles)
    const frequency = 0.0003 * speed;
    
    // Wandering X movement (slow sine wave)
    const wanderX = Math.sin(elapsed * frequency) * amplitude;
    
    // Gentle bob in Y (slower oscillation)
    const bob = Math.sin(elapsed * frequency * 0.5) * 8;

    const newX = Math.max(0, Math.min(initialX + wanderX, container.clientWidth - 100));
    const newY = Math.max(0, Math.min(initialY + bob, container.clientHeight - 100));

    element.style.left = `${newX}px`;
    element.style.top = `${newY}px`;

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
        ghostEl.innerHTML = "";
        const svg = createGhostSVG(newLevel, style.size);
        svg.style.opacity = style.opacity;
        ghostEl.appendChild(svg);

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

/**
 * Get stored position for a ghost, or null if no position stored
 */
export function getGhostPosition(taskId) {
  return ghostPositions.get(taskId);
}

/**
 * Store position for a ghost
 */
export function setGhostPosition(taskId, x, y) {
  ghostPositions.set(taskId, { x, y });
}