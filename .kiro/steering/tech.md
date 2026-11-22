---
inclusion: always
---

# Tech rules

- Plain **HTML, CSS and JavaScript (ES modules)**. No framework, no build step, no bundler.
- The app must run by opening `index.html` through any static server and must deploy to **GitHub Pages** as-is.
- Data is stored in `localStorage` under one key: `hst:v1`.
- Animations: CSS animations/transitions first; `requestAnimationFrame` only for ghost movement.
- Sound: generate effects with the **Web Audio API**. Do not add audio files or any copyrighted music.
- Fonts: Google Fonts only (`Creepster` for headings, `Inter` for body text).
- Only dev dependency allowed: `fast-check` for property-based tests, run with `node --test`.

## Code style
- Keep game/state logic in pure functions in `src/logic.js` (no DOM access) so it can be tested.
- DOM code lives in `src/ui.js`; `src/main.js` only wires things together.
- Small functions, clear names, no classes unless they clearly help.

## Accessibility (must not be broken by the theme)
- Text contrast at least 4.5:1.
- All controls reachable by keyboard, with visible focus.
- Respect `prefers-reduced-motion`: ghosts stop drifting and flicker effects are disabled.
- Sounds are off by default and have a mute toggle.

## Environment
- OS is Windows, shell is PowerShell. Use Kiro's file tools to edit files.
  Chain commands with ';' not '&&'. No tail/head/grep — use Select-Object/Select-String.
- Never delete a failing test to make the suite pass. Fix the code, or if a test
  needs the browser DOM, don't write it.