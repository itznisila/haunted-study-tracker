/**
 * Main entry point for Haunted Study Tracker
 * Initializes the app with event listeners and renders initial state
 */

import { load, save } from "./storage.js";
import { sortPending, isWarning } from "./logic.js";
import { createTaskItem, formatDeadline, playExorcismAnimation } from "./ui.js";
import { renderGhosts, driftGhost, startAngerUpdateInterval } from "./ghosts.js";

let state = null;
let editingTaskId = null;
let angerUpdateInterval = null;

/**
 * Generate a unique task ID
 */
function generateTaskId() {
  return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
 * Render ghosts in the haunting layer and position them randomly
 */
function renderGhostsLayer() {
  const hauntingLayer = document.getElementById("hauntingLayer");
  const now = new Date();

  renderGhosts(state.tasks, now, hauntingLayer);

  hauntingLayer.querySelectorAll(".ghost-button").forEach((ghostEl) => {
    const posX = Math.random() * (window.innerWidth - 150);
    const posY = Math.random() * (window.innerHeight - 150);

    ghostEl.style.left = `${posX}px`;
    ghostEl.style.top = `${posY}px`;

    const level = parseInt(ghostEl.getAttribute("data-anger-level"));
    const speeds = { 1: 1, 2: 2, 3: 3 };
    const speed = speeds[level] || 1;

    driftGhost(ghostEl, speed, posX, posY);

    ghostEl.addEventListener("click", () => {
      const taskId = ghostEl.getAttribute("data-task-id");
      showExorcismPopover(taskId, ghostEl);
    });
  });
}

/**
 * Show popover to confirm exorcism
 */
function showExorcismPopover(taskId, ghostEl) {
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return;

  // Remove existing popover if any
  const existing = document.querySelector(".exorcism-popover");
  if (existing) existing.remove();

  // Create popover
  const popover = document.createElement("div");
  popover.className = "exorcism-popover";
  
  const rect = ghostEl.getBoundingClientRect();
  popover.style.left = `${rect.left + rect.width / 2}px`;
  popover.style.top = `${rect.top - 10}px`;

  popover.innerHTML = `
    <div class="popover-content">
      <div class="popover-title">Exorcise &quot;${task.title}&quot;?</div>
      <div class="popover-actions">
        <button class="popover-btn exorcise-btn">Exorcise</button>
        <button class="popover-btn cancel-btn">Not yet</button>
      </div>
    </div>
  `;

  document.body.appendChild(popover);

  const exorciseBtn = popover.querySelector(".exorcise-btn");
  const cancelBtn = popover.querySelector(".cancel-btn");
  const closePopover = () => popover.remove();

  exorciseBtn.addEventListener("click", () => {
    closePopover();
    handleGhostClick(taskId, ghostEl);
  });

  cancelBtn.addEventListener("click", closePopover);

  // Close on Escape key
  const keyHandler = (e) => {
    if (e.key === "Escape") {
      closePopover();
      document.removeEventListener("keydown", keyHandler);
    }
  };
  document.addEventListener("keydown", keyHandler);

  // Focus exorcise button for accessibility
  exorciseBtn.focus();
}

/**
 * Handle task completion toggle
 */
function handleToggleTask(taskId) {
  const task = state.tasks.find((t) => t.id === taskId);
  if (task) {
    task.done = !task.done;
    if (task.done) {
      task.completedAt = new Date().toISOString();
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
    playExorcismAnimation(ghostEl, () => {
      handleToggleTask(taskId);
    });
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
    };
    state.tasks.push(newTask);
  }

  save(state);
  renderTaskList();
  clearForm();
}

/**
 * Initialize the application
 */
function initApp() {
  state = load();

  const taskForm = document.getElementById("taskForm");
  taskForm.addEventListener("submit", handleFormSubmit);

  renderTaskList();

  const hauntingLayer = document.getElementById("hauntingLayer");
  // Pass a function that returns current state.tasks
  angerUpdateInterval = startAngerUpdateInterval(() => state.tasks, hauntingLayer);

  console.log("Haunted Study Tracker initialized");
  console.log("State loaded:", state);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}