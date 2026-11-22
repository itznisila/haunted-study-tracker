/**
 * Main entry point for Haunted Study Tracker
 * Initializes the app with event listeners and renders initial state
 */

import { load, save } from "./storage.js";
import { sortPending, isWarning, candleFraction, localDateKey, currentStreak, roomBrightness } from "./logic.js";
import { createTaskItem, formatDeadline, playExorcismAnimation, updateCandleWax, updateTimerDisplay } from "./ui.js";
import { renderGhosts, driftGhost } from "./ghosts.js";
import { initAudio, toggleMute, updateSoundButtonUI, playExorcismSound, playSessionCompleteSound, } from "./audio.js";

let state = null;
let editingTaskId = null;
let angerUpdateInterval = null;
let currentPopover = null;
let popoverKeyHandler = null;

// Timer state
let timerIntervalId = null;
let timerAnimationFrameId = null;
// Check if demo mode is enabled
const isDemoMode = new URLSearchParams(window.location.search).get("demo") === "1";
const TIMER_DURATION = isDemoMode ? 60 * 1000 : 25 * 60 * 1000; // 60 seconds in demo, 25 minutes normal
const timerState = {
  isRunning: false,
  timeRemaining: TIMER_DURATION,
  startTime: null,
};

/**
 * Generate a unique task ID
 */
function generateTaskId() {
  return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Shared exorcism used by ghost click and task-list toggle.
 * Plays the animation, counts each task only once, then saves and re-renders.
 */
function performExorcism(taskId, ghostEl) {
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return;

  // Play exorcism sound
  playExorcismSound();

  playExorcismAnimation(ghostEl, () => {
    if (!task.exorcisedAt) {
      state.exorcised = (state.exorcised || 0) + 1;
      task.exorcisedAt = new Date().toISOString();
      updateExorcisedCount();
    }
    save(state);
    renderTaskList();
  });
}

/**
 * Render the task list with sorted pending tasks
 */
function renderTaskList() {
  const taskList = document.getElementById("taskList");
  taskList.innerHTML = "";

  const pendingTasks = sortPending(state.tasks);
  const now = new Date();

  taskList.classList.toggle("empty-state", pendingTasks.length === 0);
  if (pendingTasks.length === 0) {
    const ghost = document.createElement("img");
    ghost.src = "assets/ghost.png";
    ghost.alt = "";
    ghost.className = "empty-ghost";
    const msg = document.createElement("p");
    msg.className = "empty-message";
    msg.textContent = "No ghosts... for now.";
    taskList.append(ghost, msg);
  }

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

// Ghosts sit in a fixed grid of slots to the right of the candle
const GHOST_CELL = 150; // px per slot (largest ghost is 150px)
const GHOST_GAP_FROM_CANDLE = 40; // px between candle and first column

/**
 * Smallest slot number not used by a ghost currently on screen.
 */
function freeGhostSlot(hauntingLayer) {
  const used = new Set(
    [...hauntingLayer.querySelectorAll(".ghost-button[data-slot]")].map((el) =>
      Number(el.dataset.slot)
    )
  );
  let slot = 0;
  while (used.has(slot)) slot++;
  return slot;
}

/**
 * Top-left position of a slot. Slots fill the empty space to the RIGHT of the candle first,
 * then the space to its LEFT (so ghosts never land on the timer or buttons), then the next row.
 * The ghost is centred inside its cell.
 */
function ghostSlotPosition(slot, size) {
  const candle = document.getElementById("candle").getBoundingClientRect();
  const column = document.querySelector(".timer-section").getBoundingClientRect();
  const top = candle.top - 40; // line up with the flame

  const rightStart = candle.right + GHOST_GAP_FROM_CANDLE;
  const rightCols = Math.max(1, Math.floor((window.innerWidth - 20 - rightStart) / GHOST_CELL));
  const leftEnd = candle.left - GHOST_GAP_FROM_CANDLE;
  const leftCols = Math.max(0, Math.floor((leftEnd - column.left) / GHOST_CELL));

  // Cells of one row, in fill order: all right-side cells, then left-side cells (nearest first)
  const row = [];
  for (let i = 0; i < rightCols; i++) row.push(rightStart + i * GHOST_CELL);
  for (let i = 0; i < leftCols; i++) row.push(leftEnd - (i + 1) * GHOST_CELL);

  const x = row[slot % row.length];
  const y = top + Math.floor(slot / row.length) * GHOST_CELL;
  return { x: x + (GHOST_CELL - size) / 2, y: y + (GHOST_CELL - size) / 2 };
}

/**
 * Render ghosts and set up only NEW ones (slot position, sway, click).
 * Each ghost gets a fixed slot to the right of the candle.
 */
function renderGhostsLayer() {
  const hauntingLayer = document.getElementById("hauntingLayer");
  const now = new Date();

  renderGhosts(state.tasks, now, hauntingLayer);

  hauntingLayer.querySelectorAll(".ghost-button").forEach((ghostEl) => {
    if (ghostEl.getAttribute("data-initialized") === "true") return;

    const taskId = ghostEl.getAttribute("data-task-id");
    const level = parseInt(ghostEl.getAttribute("data-anger-level"));
    const speed = Math.min(Math.max(level || 1, 1), 3);

    const slot = freeGhostSlot(hauntingLayer);
    ghostEl.dataset.slot = slot;
    // ponytail: slots are computed once; resizing the window won't move existing ghosts until reload
    const pos = ghostSlotPosition(slot, ghostEl.offsetWidth || GHOST_CELL);

    ghostEl.style.left = `${pos.x}px`;
    ghostEl.style.top = `${pos.y}px`;
    driftGhost(ghostEl, speed, pos.x, pos.y);

    ghostEl.addEventListener("click", (e) => {
      e.stopPropagation();
      showExorcismPopover(taskId, ghostEl);
    });

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
 * Handle ghost "Exorcise" confirm: mark done, then animate via the shared path
 */
function handleGhostClick(taskId, ghostEl) {
  const task = state.tasks.find((t) => t.id === taskId);
  if (task && !task.done) {
    task.done = true;
    task.completedAt = new Date().toISOString();
    performExorcism(taskId, ghostEl);
  }
}

/**
 * Show delete confirmation dialog
 */
function showDeleteConfirmation(taskId) {
  // Create confirmation dialog
  const dialog = document.createElement("div");
  dialog.className = "delete-confirm";
  
  const dialogContent = document.createElement("div");
  dialogContent.className = "delete-confirm-content";
  
  const title = document.createElement("div");
  title.className = "delete-confirm-title";
  title.textContent = "Banish this task forever?";
  
  const actions = document.createElement("div");
  actions.className = "delete-confirm-actions";
  
  const yesBtn = document.createElement("button");
  yesBtn.className = "delete-confirm-btn confirm";
  yesBtn.textContent = "Yes, banish it";
  
  const noBtn = document.createElement("button");
  noBtn.className = "delete-confirm-btn";
  noBtn.textContent = "No, keep it";
  
  actions.appendChild(yesBtn);
  actions.appendChild(noBtn);
  dialogContent.appendChild(title);
  dialogContent.appendChild(actions);
  dialog.appendChild(dialogContent);
  
  // Position in center
  dialog.style.left = "50%";
  dialog.style.top = "50%";
  
  document.body.appendChild(dialog);
  
  yesBtn.addEventListener("click", () => {
    dialog.remove();
    state.tasks = state.tasks.filter((t) => t.id !== taskId);
    save(state);
    renderTaskList();
    clearForm();
  });
  
  noBtn.addEventListener("click", () => {
    dialog.remove();
  });
  
  // Close on Escape
  const escapeHandler = (e) => {
    if (e.key === "Escape") {
      dialog.remove();
      document.removeEventListener("keydown", escapeHandler);
    }
  };
  document.addEventListener("keydown", escapeHandler);
  
  // Focus Yes button
  yesBtn.focus();
}

/**
 * Handle task deletion
 */
function handleDeleteTask(taskId) {
  showDeleteConfirmation(taskId);
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
    document.getElementById("taskDeadline").value = toDatetimeLocal(task.deadline);
    document.querySelector(".task-form button").textContent = "Update Task";
    document.getElementById("taskTitle").focus();
  }
}

/**
 * ISO deadline -> "YYYY-MM-DDTHH:mm" in local time, the format datetime-local inputs need
 */
function toDatetimeLocal(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
 * Update ghosts opacity based on timer state
 */
function updateGhostDimming() {
  const hauntingLayer = document.getElementById("hauntingLayer");
  if (timerState.isRunning) {
    hauntingLayer.classList.add("has-active-timer");
  } else {
    hauntingLayer.classList.remove("has-active-timer");
  }
}

/**
 * Handle timer tick - called by requestAnimationFrame
 */
function handleTimerTick() {
  if (!timerState.isRunning) {
    return;
  }

  const now = Date.now();
  const elapsed = now - timerState.startTime;
  timerState.timeRemaining = Math.max(0, TIMER_DURATION - elapsed);

  // Update display and candle
  const display = document.getElementById("timerDisplay");
  updateTimerDisplay(display, timerState.timeRemaining);

  const candle = document.getElementById("candle");
  const fraction = candleFraction(timerState.timeRemaining, TIMER_DURATION);
  updateCandleWax(candle, fraction);

  if (timerState.timeRemaining <= 0) {
    // Timer complete
    handleTimerComplete();
  } else {
    timerAnimationFrameId = requestAnimationFrame(handleTimerTick);
  }
}

/**
 * Start the timer
 */
function handleStartTimer() {
  if (timerState.isRunning) return;

  timerState.isRunning = true;
  timerState.startTime = Date.now() - (TIMER_DURATION - timerState.timeRemaining);
  
  updateGhostDimming();
  updateTimerButtons();
  handleTimerTick();
}

/**
 * Pause the timer
 */
function handlePauseTimer() {
  if (!timerState.isRunning) return;

  timerState.isRunning = false;
  cancelAnimationFrame(timerAnimationFrameId);
  
  updateGhostDimming();
  updateTimerButtons();
}

/**
 * Reset the timer
 */
function handleResetTimer() {
  timerState.isRunning = false;
  timerState.timeRemaining = TIMER_DURATION;
  cancelAnimationFrame(timerAnimationFrameId);

  const display = document.getElementById("timerDisplay");
  updateTimerDisplay(display, TIMER_DURATION);

  const candle = document.getElementById("candle");
  const flame = candle.querySelector(".flame");
  flame.classList.remove("paused");
  updateCandleWax(candle, 1);

  updateGhostDimming();
  updateTimerButtons();
}

/**
 * Complete the timer - add 25 minutes to today's sessions
 */
function handleTimerComplete() {
  timerState.isRunning = false;
  timerState.timeRemaining = TIMER_DURATION;
  cancelAnimationFrame(timerAnimationFrameId);

  // Play completion sound
  playSessionCompleteSound();

  // Log 25 minutes to today's session
  const today = new Date();
  const todayKey = localDateKey(today);
  
  if (!state.sessions) {
    state.sessions = {};
  }
  
  state.sessions[todayKey] = (state.sessions[todayKey] || 0) + 25;
  
  // Save state
  save(state);
  
  // Update streak display
  updateStreakDisplay();

  // Reset UI
  const display = document.getElementById("timerDisplay");
  updateTimerDisplay(display, TIMER_DURATION);

  const candle = document.getElementById("candle");
  updateCandleWax(candle, 1);

  updateGhostDimming();
  updateTimerButtons();

  // Flash candle briefly
  const flame = candle.querySelector(".flame");
  flame.classList.add("complete-flash");
  setTimeout(() => flame.classList.remove("complete-flash"), 600);
}

/**
 * Update timer button states
 */
function handleUpdateTimerButtons() {
  const startBtn = document.getElementById("startTimer");
  const pauseBtn = document.getElementById("pauseTimer");

  if (timerState.isRunning) {
    startBtn.disabled = true;
    pauseBtn.disabled = false;
  } else {
    startBtn.disabled = false;
    pauseBtn.disabled = true;
  }
}

/**
 * Alias for button update
 */
function updateTimerButtons() {
  handleUpdateTimerButtons();
}

/**
 * Update streak display
 */
function updateStreakDisplay() {
  // Demo mode can preview a streak for the video: ?demo=1&streak=5 (display only, never saved)
  const demoStreak = isDemoMode ? Number(new URLSearchParams(window.location.search).get("streak")) : NaN;
  const streak = Number.isFinite(demoStreak) && demoStreak >= 0
    ? demoStreak
    : currentStreak(state.sessions || {}, new Date());
  const streakCountEl = document.getElementById("streakCount");
  if (streakCountEl) streakCountEl.textContent = streak;
  // Light the room: 0 = dark, 7+ days = full candle glow (see .room::before in styles.css)
  document.documentElement.style.setProperty("--room-light", roomBrightness(streak));
}

/**
 * Load 3 demo tasks with different overdue periods
 */
function loadDemoGhosts() {
  if (!state.tasks) state.tasks = [];
  
  const now = new Date();
  
  // Add demo tasks
  const demoTasks = [
    {
      id: generateTaskId(),
      title: "OOD coursework",
      subject: "Object Oriented Development",
      deadline: new Date(now - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
      done: false,
      completedAt: null,
      exorcisedAt: null,
    },
    {
      id: generateTaskId(),
      title: "Data Science lab report",
      subject: "Data Science",
      deadline: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      done: false,
      completedAt: null,
      exorcisedAt: null,
    },
    {
      id: generateTaskId(),
      title: "Revise for Maths quiz",
      subject: "Mathematics",
      deadline: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      done: false,
      completedAt: null,
      exorcisedAt: null,
    },
  ];
  
  state.tasks.push(...demoTasks);
  save(state);
  renderTaskList();
}

/**
 * Initialize the application
 */
function initApp() {
  state = load();

  // Initialize audio system
  initAudio(state);

  const taskForm = document.getElementById("taskForm");
  taskForm.addEventListener("submit", handleFormSubmit);

  // Sound toggle button
  const soundToggle = document.getElementById("soundToggle");
  if (soundToggle) {
    updateSoundButtonUI(soundToggle);
    soundToggle.addEventListener("click", () => {
      const isMuted = toggleMute();
      state.soundOn = !isMuted;
      save(state);
      updateSoundButtonUI(soundToggle);
    });
  }

  // Timer event listeners
  document.getElementById("startTimer").addEventListener("click", handleStartTimer);
  document.getElementById("pauseTimer").addEventListener("click", handlePauseTimer);
  document.getElementById("resetTimer").addEventListener("click", handleResetTimer);

  // Initialize timer display
  const display = document.getElementById("timerDisplay");
  updateTimerDisplay(display, timerState.timeRemaining);
  updateTimerButtons();

  // Initialize candle
  const candle = document.getElementById("candle");
  updateCandleWax(candle, 1);

  renderTaskList();
  updateExorcisedCount();
  updateStreakDisplay();
  // Demo mode button
  if (isDemoMode) {
    const demoBtn = document.createElement("button");
    demoBtn.className = "demo-button";
    demoBtn.textContent = "Load demo ghosts";
    demoBtn.addEventListener("click", loadDemoGhosts);
    document.body.appendChild(demoBtn);
  }

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