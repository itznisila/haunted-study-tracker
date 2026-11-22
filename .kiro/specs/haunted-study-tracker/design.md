# Design Document

## Overview
A single static page with three areas: the **task list** (left), the **candle timer** (right) and a full-screen **haunting layer** behind both where ghosts drift. The room brightness is a CSS variable driven by the streak.

## Data model (localStorage key `hst:v1`)
```js
{
  tasks: [{ id, title, subject, deadline /* ISO string */, done, completedAt }],
  sessions: { "2026-11-22": 50 },   // minutes studied per local date
  exorcised: 0,
  soundOn: false
}
```

## Pure logic (`src/logic.js`)
| Function | Returns |
|---|---|
| `angerLevel(deadline, now)` | `0` not overdue, `1` < 1 day, `2` 1–3 days, `3` > 3 days |
| `isWarning(deadline, now)` | `true` if due within the next 24 hours |
| `ghostStyle(level)` | `{ size, opacity, speed }` — non-decreasing as level rises |
| `currentStreak(sessions, today)` | consecutive study days ending today or yesterday |
| `roomBrightness(streak)` | number 0–1, `min(streak, 7) / 7` |
| `candleFraction(remainingMs, totalMs)` | number 0–1, clamped |
| `sortPending(tasks)` | pending tasks sorted by deadline |

## UI (`src/ui.js`)
- **Ghost**: an SVG or CSS shape with eyes; anger level sets size, colour (pale → deep red glow) and drift speed. Each ghost is a `<button>` with an `aria-label` like "Overdue 2 days: DSA coursework".
- **Exorcism**: ghost spins, flashes white, dissolves into particles (CSS keyframes), counter increments.
- **Candle**: CSS candle; wax height = `candleFraction`; flame flickers with CSS animation.
- **Room**: `--room-light` CSS variable from `roomBrightness`, used in a radial gradient behind everything.
- **Warning wisp**: small animated mist icon next to tasks due within 24h.

## Theme
- Colours: near-black `#0b0a12`, fog purple `#2a1f3d`, ghost white `#e8e6f0`, candle amber `#ffb347`, anger red `#c0392b`.
- Headings `Creepster`, body `Inter`.

## Sound (`src/sound.js`)
Web Audio only: low "whoosh" for exorcism, soft bell for session complete. Off by default.

## Testing strategy
Property-based tests with `fast-check` on `src/logic.js`:
- `angerLevel` is always 0–3 and never decreases as `now` moves later.
- `ghostStyle` size/opacity/speed never decrease as level rises.
- `roomBrightness` is always within 0–1 and never decreases as streak rises.
- `candleFraction` is always within 0–1.
- `sortPending` output contains no done tasks and is ordered by deadline.
- Saving then loading state returns an equal object.
