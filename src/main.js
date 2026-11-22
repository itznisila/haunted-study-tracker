/**
 * Main entry point for Haunted Study Tracker
 * Initializes the app with event listeners and renders initial state
 */

import { load, save } from "./storage.js";
import { sortPending, isWarning } from "./logic.js";
import { createTaskItem, formatDeadline, playExorcismAnimation } from "./ui.js";
import { renderGhosts, driftGhost, getGhostPosition, setGhostPosition } from "./ghosts.js";

let state = null;
let editingTaskId = null;
let angerUpdateInterval = null;
let currentPopover = null;
let popoverKeyHandler = null;

/**
 * Generate a unique task ID
 */
function generateTaskId() {
  return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Shared exorcism function used by both ghost click and task toggle paths
 * Plays animation, removes ghost, increments counter (only once per task)
 */
function performExorcism(taskId, ghostEl) {
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return;

  // Only increment counter if this task hasn't been counted yet
  if (!task.exorcisedAt) {
    playExorcismAnimation(ghostEl, () => {
      state.exorcised = (state.exorcised || 0) + 1;
      task.exorcisedAt = new Date().toISOString();
      save(state);
      updateExorcisedCount();
    });
  } else {
    // Task already counted - just remove the ghost without incrementing
    playExorcismAnimation(ghostEl, () => {
      save(state);
    });
  }
}

/**
 * Render the task list with sorted pending tasks
 */
function renderTaskList() {
  const taskList = document.getElementById("taskList");
  taskList.innerHTML = "";

  const pendingTasks = sortPending(state.tasks);
  const now = new Date();

  pendingTasks.forEach((task) => {
    const taskItem = createTaskItem(
      task,
      now,
      handleToggleTask,
      handleEditTask,
      handleDeleteTask
    );
    taskList.appendChild(taskItem);
  });

  renderGhostsLayer();
}

/**
 * Render ghosts in the haunting layer
 * Only initializes NEW ghosts - skips already-initialized ones
 * Preserves positions across re-renders, assigns random positions to new ghosts
 */
function renderGhostsLayer() {
  const hauntingLayer = document.getElementById("hauntingLayer");
  const now = new Date();

  renderGhosts(state.tasks, now, hauntingLayer);

  hauntingLayer.querySelectorAll(".ghost-button").forEach((ghostEl) => {
    // Skip if already initialized
    if (ghostEl.getAttribute("data-initialized") === "true") {
      return;
    }

    const taskId = ghostEl.getAttribute("data-task-id");
    
    // Check if this ghost already has a stored position
    let storedPos = getGhostPosition(taskId);
    let posX, posY;
    
    if (storedPos) {
      posX = storedPos.x;
      posY = storedPos.y;
    } else {
      // New ghost - random starting position
      posX = Math.random() * (window.innerWidth - 150);
      posY = Math.random() * (window.innerHeight - 150);
      setGhostPosition(taskId, posX, posY);
    }

    ghostEl.style.left = `${posX}px`;
    ghostEl.style.top = `${posY}px`;

    const level = parseInt(ghostEl.getAttribute("data-anger-level"));
    const speeds = { 1: 1, 2: 2, 3: 3 };
    const speed = speeds[level] || 1;

    driftGhost(ghostEl, speed, posX, posY);

    ghostEl.addEventListener("click", (e) => {
      e.stopPropagation();
      const taskId = ghostEl.getAttribute("data-task-id");
      showExorcismPopover(taskId, ghostEl);
    });

    // Mark as initialized
    ghostEl.setAttribute("data-initialized", "true");
  });
}

/**
 * Close the exorcism popover and cleanup event listeners
 */
function closeExorcismPopover() {
  if (currentPopover) {
    currentPopover.remove();
    currentPopover = null;
  }
  if (popoverKeyHandler) {
    document.removeEventListener("keydown", popoverKeyHandler);
    popoverKeyHandler = null;
  }
}

/**
 * Show popover to confirm exorcism
 */
function showExorcismPopover(taskId, ghostEl) {
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return;

  // Close any existing popover
  closeExorcismPopover();

  // Create popover
  const popover = document.createElement("div");
  popover.className = "exorcism-popover";
  
  const rect = ghostEl.getBoundingClientRect();
  popover.style.left = `${rect.left + rect.width / 2}px`;
  popover.style.top = `${rect.top - 10}px`;

  const popoverContent = document.createElement("div");
  popoverContent.className = "popover-content";
  
  const title = document.createElement("div");
  title.className = "popover-title";
  title.textContent = `Exorcise "${task.title}"?`;
  
  const actions = document.createElement("div");
  actions.className = "popover-actions";
  
  const exorciseBtn = document.createElement("button");
  exorciseBtn.className = "popover-btn exorcise-btn";
  exorciseBtn.textContent = "Exorcise";
  
  const cancelBtn = document.createElement("button");
  cancelBtn.className = "popover-btn cancel-btn";
  cancelBtn.textContent = "Not yet";
  
  actions.appendChild(exorciseBtn);
  actions.appendChild(cancelBtn);
  popoverContent.appendChild(title);
  popoverContent.appendChild(actions);
  popover.appendChild(popoverContent);

  document.body.appendChild(popover);
  currentPopover = popover;

  exorciseBtn.addEventListener("click", () => {
    closeExorcismPopover();
    handleGhostClick(taskId, ghostEl);
  });

  cancelBtn.addEventListener("click", closeExorcismPopover);

  // Close on Escape key
  popoverKeyHandler = (e) => {
    if (e.key === "Escape") {
      closeExorcismPopover();
    }
  };
  document.addEventListener("keydown", popoverKeyHandler);

  // Close on click outside popover
  const outsideClickHandler = (e) => {
    if (currentPopover && !currentPopover.contains(e.target) && e.target !== ghostEl) {
      closeExorcismPopover();
      document.removeEventListener("click", outsideClickHandler);
    }
  };
  document.addEventListener("click", outsideClickHandler);

  // Focus exorcise button for accessibility
  exorciseBtn.focus();
}

/**
 * Handle task completion toggle from task list
 */
function handleToggleTask(taskId) {
  const task = state.tasks.find((t) => t.id === taskId);
  if (task) {
    task.done = !task.done;
    if (task.done) {
      task.completedAt = new Date().toISOString();
      // Find and exorcise the ghost if it exists
      const hauntingLayer = document.getElementById("hauntingLayer");
      const ghostEl = hauntingLayer.querySelector(`[data-task-id="${taskId}"]`);
      if (ghostEl) {
        performExorcism(taskId, ghostEl);
        return; // Animation callback will handle save
      }
    } else {
      task.completedAt = null;
    }
    save(state);
    renderTaskList();
  }
}

/**
 * Handle ghost click to complete task with exorcism animation
 */
function handleGhostClick(taskId, ghostEl) {
  const task = state.tasks.find((t) => t.id === taskId);
  if (task && !task.done) {
    performExorcism(taskId, ghostEl);
    // After animation completes, mark task as done
    setTimeout(() => {
      task.done = true;
      task.completedAt = new Date().toISOString();
      save(state);
      renderTaskList();
    }, 600);
  }
}

/**
 * Handle task deletion
 */
function handleDeleteTask(taskId) {
  if (confirm("Delete this task?")) {
    state.tasks = state.tasks.filter((t) => t.id !== taskId);
    save(state);
    renderTaskList();
    clearForm();
  }
}

/**
 * Handle task editing
 */
function handleEditTask(taskId) {
  const task = state.tasks.find((t) => t.id === taskId);
  if (task) {
    editingTaskId = taskId;
    document.getElementById("taskTitle").value = task.title;
    document.getElementById("taskSubject").value = task.subject;
    document.getElementById("taskDeadline").value = task.deadline;
    document.querySelector(".task-form button").textContent = "Update Task";
  }
}

/**
 * Clear the form and reset editing state
 */
function clearForm() {
  document.getElementById("taskForm").reset();
  editingTaskId = null;
  document.querySelector(".task-form button").textContent = "Add Task";
  document.getElementById("errorMessage").textContent = "";
}

/**
 * Validate task input
 */
function validateTask() {
  const title = document.getElementById("taskTitle").value.trim();
  const subject = document.getElementById("taskSubject").value.trim();
  const deadline = document.getElementById("taskDeadline").value.trim();

  if (!title) {
    return "Task title is required";
  }

  if (!subject) {
    return "Subject is required";
  }

  if (!deadline) {
    return "Deadline is required";
  }

  const deadlineDate = new Date(deadline);
  if (isNaN(deadlineDate.getTime())) {
    return "Invalid deadline date";
  }

  return null;
}

/**
 * Handle form submission
 */
function handleFormSubmit(e) {
  e.preventDefault();

  const errorEl = document.getElementById("errorMessage");
  const error = validateTask();

  if (error) {
    errorEl.textContent = error;
    return;
  }

  errorEl.textContent = "";

  const title = document.getElementById("taskTitle").value.trim();
  const subject = document.getElementById("taskSubject").value.trim();
  const deadline = new Date(document.getElementById("taskDeadline").value).toISOString();

  if (editingTaskId) {
    const task = state.tasks.find((t) => t.id === editingTaskId);
    if (task) {
      task.title = title;
      task.subject = subject;
      task.deadline = deadline;
    }
  } else {
    const newTask = {
      id: generateTaskId(),
      title,
      subject,
      deadline,
      done: false,
      completedAt: null,
      exorcisedAt: null,
    };
    state.tasks.push(newTask);
  }

  save(state);
  renderTaskList();
  clearForm();
}

/**
 * Update the exorcised count display
 */
function updateExorcisedCount() {
  const exorcisedCountEl = document.getElementById("exorcisedCount");
  if (exorcisedCountEl) {
    exorcisedCountEl.textContent = state.exorcised || 0;
  }
}

/**
 * Initialize the application
 */
function initApp() {
  state = load();

  const taskForm = document.getElementById("taskForm");
  taskForm.addEventListener("submit", handleFormSubmit);

  renderTaskList();
  updateExorcisedCount();

  const hauntingLayer = document.getElementById("hauntingLayer");
  // 60-second interval calls renderGhostsLayer to handle newly overdue tasks
  angerUpdateInterval = setInterval(() => {
    renderGhostsLayer();
  }, 60000);

  console.log("Haunted Study Tracker initialized");
  console.log("State loaded:", state);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
