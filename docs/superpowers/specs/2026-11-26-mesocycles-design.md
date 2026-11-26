# Mesocycles Design

## Goal

Let the user run a training block (a mesocycle): N training weeks followed by a deload. Each training week has a target RIR (reps in reserve) that gets harder over the block. The app shows where you are in the block and what RIR to aim for, on Home and on Log Set.

The target is a reference only. It never changes what gets saved.

## Decisions (approved 2026-11-26)

- **Weeks are Mon–Sun calendar weeks**, matching the Home week strip. Every mesocycle starts on a Monday, so every week, including week 1, is a full week.
- **The start date is never chosen.** It is today if today is a Monday, otherwise the next Monday. A block set up mid-week is "upcoming" until then. If you forgot on Monday and set it up on Tuesday, you wait for next Monday (no catch-up option, since that would bring back short first weeks).
- **Block length is configurable per mesocycle**: 2–8 training weeks, 0–2 deload weeks. Default is 4 + 1.
- **Length is set when starting a mesocycle**, not in a global settings screen. It belongs to the block, not the user.
- **Target RIR ramp**: the start and end RIR are editable when starting a mesocycle (default 3 → 0). The target for each training week is linearly interpolated and rounded.
- **Deload weeks** always show the target as `4+`.
- **When the last week ends**, the mesocycle is marked complete automatically and Home shows a "Block finished, start a new one" card. History is kept.
- **Target RIR is display-only**: a week chip, a target chip, and a target dot on the RIR slider. No presetting the slider, no flagging missed sets.
- **One active mesocycle at a time.**

## Ramp

For `N` training weeks, week `i` (1-based):

```
target(i) = N === 1 ? startRir : round(startRir + (endRir - startRir) * (i - 1) / (N - 1))
```

Rounding is `Math.round` (ties go up in value, so toward the easier RIR).

| Training weeks | 3 → 0 | 4 → 1 |
| --- | --- | --- |
| 3 | 3, 2, 0 | 4, 3, 1 |
| 4 | 3, 2, 1, 0 | 4, 3, 2, 1 |
| 5 | 3, 2, 2, 1, 0 | 4, 3, 3, 2, 1 |
| 6 | 3, 2, 2, 1, 1, 0 | 4, 3, 3, 2, 2, 1 |

Known quirk: with 3 weeks and 3 → 0, the tie at 1.5 rounds to 2, so the ramp is 3, 2, 0 (a bigger last-week jump). That is acceptable, and the user can pick 3 → 1 if they want an even ramp.

Validation: `startRir` and `endRir` are integers 0–4 (the RIR slider's scale tops out at `4+`) and `startRir >= endRir`.

## Data Model

New `mesocycles` table:

- `id`
- `start_date` (date, always a Monday; the client computes it with `getNextStartDate` and the server validates it)
- `training_weeks` (integer, 2–8)
- `deload_weeks` (integer, 0–2, default 1)
- `start_rir` (integer 0–4, default 3)
- `end_rir` (integer 0–4, default 0)
- `ended_at` (date, nullable): set only when the user ends a block early. Natural completion is computed from dates, not stored.
- `created_at`

Not chosen: `workouts.mesocycle_id`. The current week is derived from `start_date` and today, so workouts don't need a foreign key, and there are no extra writes to keep in sync. Revisit if comparing blocks becomes a feature.

The current week and phase are never stored. They are computed so they cannot go stale.

## Shared Logic (`packages/shared`)

Pure, runtime-agnostic functions with unit tests (the first tests in the repo that aren't API integration tests):

- `getNextStartDate(today: string): string`: `today` if it is a Monday, otherwise the next Monday
- `getTargetRir(meso, week): number | '4+'`
- `getMesocycleStatus(meso, today: string)` returns one of:
  - `{ phase: 'training', week, totalWeeks, targetRir }`
  - `{ phase: 'deload', week, totalWeeks, targetRir: '4+' }`
  - `{ phase: 'completed' }` (all weeks have passed, or `ended_at` is set)
  - `{ phase: 'upcoming', startsOn, daysUntilStart }` (start date is in the future)

Dates are local `YYYY-MM-DD` strings, and `today` is passed in, never read from the clock inside the function. This makes the logic deterministic and easy to test.

## API Design

- `GET /mesocycles/current` → the most recent mesocycle in any phase (upcoming, running, finished or ended), or `null`. The client derives what to show from its status. (It is not `/active` because Home needs the finished block to show the "Block finished" card.)
- `POST /mesocycles` → body `{ startDate, trainingWeeks, deloadWeeks, startRir, endRir }`. `startDate` must be a Monday and not in the past. Returns 201. Returns 409 if one is already active or upcoming. Returns 400 on invalid input.
- `PATCH /mesocycles/:id/end` → sets `ended_at` to today (end an active block early). Returns 404 if missing, 409 if the block hasn't started.
- `DELETE /mesocycles/:id` → cancels an upcoming block (a block that never started leaves no trace). Returns 204. Returns 404 if missing, 409 if the block has already started.

Request and response types are camelCase, and the DB columns are snake_case, mapped explicitly in `server/db/mesocycles.ts`. The mobile app gets typed functions in `lib/api/` (`getActiveMesocycle`, `startMesocycle`, `endMesocycle`).

## Mobile UI

All UI follows the Iron direction (see `docs/superpowers/specs/2026-11-18-iron-redesign-design.md`). No new colours or fonts. The RIR colour scale is reused for the target dot and chip.

- **Home, active block**: a meso card with a segmented bar (one segment per week, deload last), the label `Week 2 of 5 · Target RIR 2`, and an "End block" action.
- **Home, no active block**: a card with a "Start mesocycle" button that opens the start sheet.
- **Home, upcoming block**: the same card with the title `Starts Mon 30 Nov`, an `IN 4 DAYS` chip, a dimmed bar, the week 1 target, and a "Cancel block" action.
- **Home, block just finished**: a "Block finished" card with a "Start a new block" button, shown for 7 days after the block's last day. A block ended early goes straight to the "Start mesocycle" card.
- **Start sheet** (modal, bordered `Card`): training-weeks stepper, deload-weeks stepper, start RIR and end RIR steppers, a read-only "Starts" line (`Today · Mon 30 Nov` on a Monday, `Next Monday · 30 Nov` otherwise), and a live preview of the per-week target ramp. A "Start block" button submits.
- **Log Set** shows the chips only while today falls inside the current block (not while it is upcoming, finished or ended): a week chip (`Week 2 · Training`), a target chip (`Target RIR 2`), and a target dot on the `RirSlider`. During deload the chips read `Deload` and `4+`.

## Out of Scope

- Per-block history or comparing blocks.
- Presetting the RIR slider or flagging sets that miss the target.
- Editing a block after it starts (end it and start a new one).
- Multiple concurrent blocks.
- A configurable first day of the week (for example Sunday). It would also change the Home week strip, so it is its own feature.

## Build Order (detailed in a plan doc after the mockup is approved)

1. Shared pure functions + unit tests.
2. Migration + `server/db/mesocycles.ts`.
3. Routes + `curl` verification.
4. `lib/api/` functions.
5. Home cards and start sheet.
6. Log Set chips and slider target dot (touches `RirSlider`, so this is the riskiest step).

## Notes

- Request and response types for this resource (`Mesocycle`, `NewMesocycle`, the limits) live in `packages/shared`, imported by both the API and the app.
- Tests use Vitest (shared unit tests; API route tests with supertest against the in-memory SQLite `test` environment). See `docs/superpowers/plans/2026-11-26-mesocycles-plan.md`.
