# 👻 Haunted Study Tracker

A dark, atmospheric Pomodoro timer and task manager where your overdue work literally haunts you as ghosts.

## Overview

**Haunted Study Tracker** combines task management with a creepy visual metaphor: the longer you procrastinate, the more angry ghosts appear on your screen. The spookier they look, the more overdue the task.

### How the Spooky Design Carries Information

- **Ghost Size & Color**: Visual representation of how overdue tasks are
  - Level 1 (< 1 day overdue): Small, pale ghosts (90px, 0.85 opacity)
  - Level 2 (1-3 days): Medium, orange-tinted ghosts (115px, 0.92 opacity)
  - Level 3 (> 3 days): Large, angry red ghosts (150px, 1 opacity)
  
- **Candle & Wax**: Represents your Pomodoro focus sessions
  - The flame burns while you're focusing
  - Wax melts as the timer ticks down
  - Flame flickers in a relaxing animation
  
- **Room Light**: Your study streak
  - Darkness increases with consecutive study days
  - 7-day streak = full candle glow illuminating the entire room

## Features

✨ **Core Functionality**
- Add tasks with title, subject, and deadline
- Pomodoro timer (25 minutes, 60 seconds in demo mode)
- Automatic ghost generation for overdue tasks
- Track daily study sessions and streaks

🎨 **Visual Polish**
- Dark gothic UI with creepy atmosphere
- Smooth ghost animations and drift effects
- Particle effects on task completion (exorcism)
- Responsive, keyboard-accessible interface
- Respect for `prefers-reduced-motion` system setting

🔊 **Audio & Accessibility**
- Web Audio effects (whoosh sound on exorcism, bell on timer complete)
- Mute toggle (default: off)
- Full keyboard navigation
- Proper ARIA labels and focus management
- Themed inline dialogs (delete confirmation, exorcism confirmation)

📋 **Task Management**
- Color-coded urgency labels for overdue tasks
- "Due soon" warnings with animated mist wisp
- Exorcise button for overdue tasks (instead of "Done")
- Delete confirmation with themed dialog
- Edit existing tasks
- Task list shows completed tasks grayed out

## How to Run Locally

Install `npx serve` and run:
```bash
npm install
npm test          # Run property-based tests
npx serve .       # Open in browser at http://localhost:3000
```

## Demo Mode

Add `?demo=1` to the URL to enable demo mode:
```
http://localhost:3000?demo=1
```

Demo mode features:
- Timer is 60 seconds instead of 25 minutes (perfect for testing)
- "Load demo ghosts" button appears to populate the task list with 3 overdue tasks (12 hours, 2 days, 5 days overdue)

## How I Used Kiro

This project was developed using **spec-driven development** with Kiro, following a structured task-based approach:

### Spec Structure
- **requirements.md**: User needs and feature definitions
- **design.md**: Architecture, component design, visual/UX design
- **tasks.md**: Implementation tasks tied to specific requirements
- **Steering files** (.kiro/steering/): Project structure and conventions

### Workflow Benefits
1. **Clear Task Breakdown**: Each task references specific requirements
2. **Property-Based Testing**: Used fast-check library to catch subtle bugs:
   - UTC streak calculation bug (was using local dates inconsistently)
   - `ghostStyle(-1)` returning undefined (now clamps to 0-3 range)
   - `roomBrightness` going negative when streak = 0 (now returns 0-1 range)
3. **Incremental Implementation**: Each task built on previous ones, with continuous testing

### Key Dependencies
- **fast-check**: Property-based testing for logic.js
- **Creepster font**: Spooky heading font from Google Fonts
- **Web Audio API**: Native sound synthesis (no external audio files)

## Live Demo

[Demo link placeholder - add your GitHub Pages or deployment URL]

## Image Credits

- Ghost icon (assets/ghost.png): [Credit placeholder]

## License

MIT

---

**Enjoy your haunted study sessions! 👻**
