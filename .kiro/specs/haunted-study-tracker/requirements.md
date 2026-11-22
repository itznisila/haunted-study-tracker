# Requirements Document

## Introduction
Haunted Study Tracker helps students stay on top of assignments by turning overdue work into ghosts that haunt the screen, and focused study into light that drives them away.

## Requirements

### Requirement 1: Manage tasks
**User Story:** As a student, I want to add my assignments with deadlines, so that I can see what I need to do.

#### Acceptance Criteria
1. WHEN the user enters a title, subject and deadline and submits THEN the system SHALL add the task to the list and save it.
2. IF the title is empty or the deadline is missing THEN the system SHALL show an error and SHALL NOT add the task.
3. WHEN the user edits or deletes a task THEN the system SHALL update the list and save it.
4. WHEN the page is reloaded THEN the system SHALL restore all tasks from localStorage.
5. The system SHALL list pending tasks sorted by deadline, soonest first.

### Requirement 2: Overdue tasks become ghosts
**User Story:** As a student, I want overdue tasks to haunt me, so that I cannot ignore them.

#### Acceptance Criteria
1. WHEN a pending task's deadline has passed THEN the system SHALL show a ghost for that task on the haunting layer.
2. The system SHALL give each ghost an anger level based on how long the task is overdue:
   level 1 (under 1 day), level 2 (1 to 3 days), level 3 (more than 3 days).
3. WHEN the anger level increases THEN the ghost SHALL become larger, darker and move faster.
4. WHEN the user hovers over or focuses a ghost THEN the system SHALL show the task title and how long it is overdue.
5. WHEN a task is due within 24 hours but not yet overdue THEN the system SHALL show a faint "warning" wisp next to it in the list.

### Requirement 3: Exorcise ghosts
**User Story:** As a student, I want to feel rewarded when I finish work, so that I stay motivated.

#### Acceptance Criteria
1. WHEN the user marks a task complete THEN the system SHALL play an exorcism animation and remove its ghost.
2. WHEN the user clicks a ghost THEN the system SHALL offer to mark that task complete.
3. The system SHALL keep a count of total ghosts exorcised.

### Requirement 4: Candle focus timer
**User Story:** As a student, I want a focus timer, so that I can study in focused blocks.

#### Acceptance Criteria
1. WHEN the user starts the timer THEN the system SHALL count down 25 minutes and show a candle that melts in proportion to the time left.
2. WHEN the user pauses or resets the timer THEN the candle SHALL pause or return to full.
3. WHEN a session completes THEN the system SHALL play a sound (if sound is on), add 25 minutes to today's study time and save it.
4. While a session is running, the system SHALL dim the ghosts to show that focus keeps them away.

### Requirement 5: Streak lights the room
**User Story:** As a student, I want to see my study streak, so that I build a daily habit.

#### Acceptance Criteria
1. The system SHALL count a day as a "study day" when at least one focus session was completed that day.
2. The system SHALL show the current streak of consecutive study days, ending today or yesterday.
3. The system SHALL make the room background brighter as the streak grows, up to a maximum at 7 days.
4. IF the streak breaks THEN the room SHALL return to fully dark.

### Requirement 6: Accessible and comfortable
**User Story:** As a user, I want the spooky theme to stay usable, so that it helps rather than annoys me.

#### Acceptance Criteria
1. WHEN the user's system has `prefers-reduced-motion` enabled THEN the system SHALL stop ghost movement and flicker effects.
2. The system SHALL start with sound off and provide a mute toggle.
3. All controls SHALL be usable with the keyboard alone.
4. The system SHALL work offline and without an account.
