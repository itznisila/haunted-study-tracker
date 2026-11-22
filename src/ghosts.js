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
 * Create the ghost picture. Anger level is shown by size (set here),
 * opacity (set by caller) and a colour tint + glow in CSS via data-anger-level.
 */
function createGhostImage(level, size) {
  const img = document.createElement("img");
  img.src = "assets/ghost.png";
  img.alt = ""; // the button's aria-label already describes the ghost
  img.width = size;
  img.height = size;
  img.draggable = false;
  img.className = "ghost-img";
  return img;
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

  const img = createGhostImage(level, style.size);
  img.style.opacity = style.opacity;

  button.appendChild(img);
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
        
        // Clear children and recreate the ghost image with new level
        ghost.innerHTML = "";
        const img = createGhostImage(newLevel, style.size);
        img.style.opacity = style.opacity;
        ghost.appendChild(img);
        
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
        const img = createGhostImage(newLevel, style.size);
        img.style.opacity = style.opacity;
        ghostEl.appendChild(img);

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