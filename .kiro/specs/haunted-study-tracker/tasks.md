# Implementation Plan

- [x] 1. Set up the project
  - Create `index.html`, `styles.css`, the `src/` files and `package.json` with `fast-check` and a `test` script (`node --test`).
  - Add the theme CSS variables and fonts.
  - _Requirements: 6.4_

- [X] 2. Write the pure logic and its property-based tests
  - Implement every function in the design's logic table in `src/logic.js`.
  - Write the properties from the testing strategy in `test/logic.test.js`.
  - _Requirements: 2.2, 2.5, 4.1, 5.1, 5.2, 5.3_

- [X] 3. Storage
  - `load()` and `save(state)` in `src/storage.js`, with safe defaults if storage is empty or broken.
  - _Requirements: 1.4_

- [x] 4. Task list
  - Add/edit/delete form with validation, sorted pending list, warning wisp for tasks due within 24h.
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 2.5_

- [x] 5. Ghost haunting layer
  - Render one ghost per overdue task, styled by anger level, drifting with `requestAnimationFrame`.
  - Tooltip on hover/focus; click to offer completion.
  - Re-check anger levels every minute.
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.2_

- [x] 6. Exorcism
  - Completing a task plays the exorcism animation, removes the ghost and increments the counter.
  - _Requirements: 3.1, 3.3_

- [x] 7. Candle timer
  - 25-minute timer with start/pause/reset, melting candle, dims ghosts while running, logs minutes when done.
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 8. Streak and room light
  - Show streak count; drive `--room-light` from `roomBrightness`.
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 9. Sound and accessibility
  - Web Audio effects with a mute toggle (off by default); reduced-motion support; keyboard check.
  - _Requirements: 4.3, 6.1, 6.2, 6.3_

- [X] 10. Polish and deploy
  - Empty states ("No ghosts... for now"), demo data button for the video, README, deploy to GitHub Pages.
