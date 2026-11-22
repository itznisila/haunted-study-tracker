# 👻 Haunted Study Tracker

**Overdue work haunts you. Focus drives the ghosts away.**

A study tracker for university students where procrastination literally haunts your screen. Every overdue assignment becomes a ghost that grows bigger and angrier the longer you ignore it. Focus with a melting-candle Pomodoro timer, exorcise your ghosts by finishing the work, and keep a daily streak to light up the room.

Built for **Kiroween 2026** (Costume Contest category) with [Kiro](https://kiro.dev).

- **Live app:** https://itznisila.github.io/haunted-study-tracker/
- **Demo mode (for judges):** https://itznisila.github.io/haunted-study-tracker/?demo=1&streak=4
- **Demo video:** _add YouTube link_

---

## The spooky design carries information

Every effect answers a question for the student. Nothing is decoration only.

| What you see | What it tells you |
|---|---|
| A ghost appears beside the candle | A task is overdue |
| Ghost size and colour: small pale → orange → big red glow | How overdue: under 1 day → 1–3 days → more than 3 days |
| "👻 Haunting you · 2d overdue" label on a task | Which task each ghost belongs to |
| Animated mist wisp + "Due soon" | Due within the next 24 hours |
| Candle wax melting, flame sinking | Time left in your 25-minute focus session |
| Ghosts fade while the timer runs | Focus keeps the ghosts away |
| Warm candlelight filling the room | Your daily study streak (dark at 0, fully lit at 7 days) |
| Ghost flashes, bursts into light and vanishes | You finished the task ("exorcised") |

## Features

- **Tasks:** add, edit, complete and delete (with a themed "Banish this task forever?" confirm). Sorted by deadline, saved in your browser.
- **Ghost layer:** one ghost per overdue task, in fixed spots around the candle. Click a ghost to exorcise it, with a confirm popover so a misclick never completes a task.
- **Candle timer:** 25-minute Pomodoro with start, pause and reset. Each finished session counts toward your streak.
- **Streak and room light:** consecutive study days light the room with warm candle glow.
- **Exorcism counter:** each task is counted once, whether you complete it from the list or by clicking its ghost.
- **Sound:** synthesized with the Web Audio API (a whoosh for exorcisms, a bell when a session ends). Off by default, remembered between visits. No audio files and no copyrighted music.
- **Works offline, no account, no server.** Everything stays in `localStorage`.

## Accessibility

- Every control works with the keyboard, with a visible focus outline. Escape closes the popovers.
- Ghosts are real buttons with labels like "Overdue 2 days: OOD coursework".
- Respects the system **reduced motion** setting: ghosts stop drifting and flicker and animations are turned off.
- Errors are announced to screen readers (`role="alert"`).

## Run it locally

```bash
npm install      # only installs fast-check, used by the tests
npx serve .      # then open http://localhost:3000
npm test         # runs the unit and property-based tests
```

It is plain HTML, CSS and JavaScript modules, with no build step.

### Demo mode

Add `?demo=1` to the URL:

- the focus timer lasts **60 seconds** instead of 25 minutes
- a **Load demo ghosts** button adds three overdue tasks (12 hours, 2 days and 5 days overdue), so you can see all three ghost levels
- add `&streak=4` (any number) to preview the room light for that streak. This is display only and never saved.

## How I used Kiro

### Spec-driven development

The whole app was built from a Kiro spec in `.kiro/specs/haunted-study-tracker/`:

- `requirements.md`: 6 requirements written as user stories with acceptance criteria
- `design.md`: data model, a table of pure logic functions, UI and the testing strategy
- `tasks.md`: 10 implementation tasks, each linked to its requirements and run with Kiro's **Start task**

### Steering files

`.kiro/steering/` keeps Kiro consistent across every task:

- `product.md`: the product idea and the main design rule, "spooky elements must carry information, never just decorate"
- `tech.md`: plain JS with no framework, Web Audio only, accessibility rules, and a Windows/PowerShell environment note added after the agent kept using Linux shell commands
- `structure.md`: where each module lives

### Agent hook

A manual **Run tests** hook runs `npm test` and summarises failures on demand. It is manual rather than triggered on save, to keep credit use low.

### Property-based testing (fast-check)

All game logic lives in pure functions in `src/logic.js`, so it can be tested with generated inputs. Property tests check things like "anger level is always 0–3 and never decreases as time passes" and "room brightness is always between 0 and 1". These tests and my reviews found real bugs:

- **Timezone bug:** the streak used UTC dates. In Sri Lanka (UTC+5:30), a session between midnight and 5:30 AM was saved under the previous day. The fix was a `localDateKey()` helper.
- **Streak off-by-one:** consecutive days were counted one short, because the date was moved back twice.
- **Out-of-range inputs:** once the fast-check v4 range syntax was fixed (the old `fc.integer(min, max)` form is silently ignored), the property tests generated negative values and showed that `ghostStyle(-1)` returned `undefined`, which would crash rendering, and that `roomBrightness` could go negative. Both now clamp their input.

### Reviewing the agent

I reviewed and browser-tested every task instead of trusting the summaries. Things I caught and fixed: drift animation loops piling up on each re-render, ghosts placed behind the task list, a candle whose wax couldn't be seen melting, the room light never actually being set, tests deleted to make the suite pass, and a sound module that went silent whenever reduced motion was on.

I used **Claude Haiku 4.5** in Kiro to stay within the free credits.

## Project structure

```
index.html          Single page
styles.css          All styles and theme variables
assets/ghost.png    Ghost image
src/main.js         App wiring: state, rendering, timer, ghosts, dialogs
src/logic.js        Pure, tested functions: anger level, streak, room light, candle
src/ghosts.js       Ghost creation, anger tint, sway animation
src/ui.js           Task rows, labels, exorcism effect
src/audio.js        Sound on/off and effects
src/sound.js        Web Audio synthesis
src/storage.js      Load/save to localStorage with safe defaults
test/               Unit and property-based tests (node --test + fast-check)
.kiro/              Kiro spec and steering files
```

## Credits

- Ghost image (`assets/ghost.png`): _add source and licence_
- Fonts: Creepster and Inter from Google Fonts (SIL Open Font License)
- All sounds are generated in code with the Web Audio API

## License

[MIT](LICENSE)
