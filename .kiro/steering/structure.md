---
inclusion: always
---

# Project structure

```
index.html          Single page
styles.css          All styles, CSS variables for the theme
assets/ghost.png    Ghost image used for ghosts, empty state and favicon
src/main.js         Entry point: load state, render, start loops
src/logic.js        Pure functions: ghost state, streaks, timer math
src/storage.js      Load/save state to localStorage
src/ui.js           Task rows, labels, exorcism effect
src/ghosts.js       Ghost creation, anger tint, sway animation
src/audio.js        Audio system with Web Audio effects and mute toggle
src/sound.js        Web Audio synthesis (private, used by audio.js)
test/               Unit + property-based tests (fast-check), run with npm test
```

Do not add new top-level folders without a reason.
