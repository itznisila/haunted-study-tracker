/**
 * Main entry point for Haunted Study Tracker
 * Initializes the app with event listeners and renders initial state
 */

import { load, save } from "./storage.js";
import { sortPending, isWarning } from "./logic.js";
import { createTaskItem, formatDeadline } from "./ui.js";

let state = null;
let editingTaskId = null;

/**
 * Generate a unique task ID
 * @returns {string}
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
}

/**
 * Handle task completion toggle
 * @param {string} taskId
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
 * Handle task deletion
 * @param {string} taskId
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
 * @param {string} taskId
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
 * @returns {string|null} Error message if invalid, null if valid
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
 * @param {Event} e
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
    // Update existing task
    const task = state.tasks.find((t) => t.id === editingTaskId);
    if (task) {
      task.title = title;
      task.subject = subject;
      task.deadline = deadline;
    }
  } else {
    // Add new task
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

  // Setup task form
  const taskForm = document.getElementById("taskForm");
  taskForm.addEventListener("submit", handleFormSubmit);

  // Render initial task list
  renderTaskList();

  console.log("Haunted Study Tracker initialized");
  console.log("State loaded:", state);
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
