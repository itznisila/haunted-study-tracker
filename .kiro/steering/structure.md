---
inclusion: always
---

# Project structure

```
index.html          Single page
styles.css          All styles, CSS variables for the theme
src/main.js         Entry point: load state, render, start loops
src/logic.js        Pure functions: ghost state, streaks, timer math
src/storage.js      Load/save state to localStorage
src/ui.js           Rendering and event handlers
src/sound.js        Web Audio sound effects
test/logic.test.js  Property-based tests (fast-check) for logic.js
```

Do not add new top-level folders without a reason.
