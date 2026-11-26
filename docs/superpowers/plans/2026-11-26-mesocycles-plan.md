# Mesocycles plan

**Goal:** build the feature specified in `docs/superpowers/specs/2026-11-26-mesocycles-design.md` and shown in the approved mockup (https://claude.ai/artifact/LCwHxoHndujzkdK7ehSBWU): a training block of N training weeks + a deload, started on a Monday, with a target RIR per week shown on Home and Log Set. Read the spec first; this plan only says *how* and *in what order*.

**Why this order:** pure logic first (cheap to test, everything else depends on it), then data, then API, then the client, then screens. Each step ends in a commit that works on its own, and nothing user-visible appears until step 6.

## Facts checked on 2026-11-26 (so executors don't re-derive them)

- `packages/shared/package.json` is only `{ "name": "workout-log-shared" }`. It is symlinked at `node_modules/workout-log-shared`, but **nothing imports it yet**: no `main`, no source, no tsconfig. The mobile app imports API model types by relative path (`../../../api/server/models/gym`).
- `apps/api/tsconfig.json` has `"rootDir": "server"`. Importing TypeScript source from `packages/shared` will likely fail `tsc` with TS6059 ("not under rootDir"). Since the API uses `noEmit`, dropping `rootDir` is the expected fix.
- `apps/api/server/db/knexfile.js` already has a `test` environment with an in-memory SQLite database (`NODE_ENV=test`), and `server/server.ts` exports the Express app separately from `index.ts` (which calls `listen`). So route tests with supertest need no extra plumbing.
- `apps/mobile/lib/week.ts` has the Mon–Sun week logic on local `Date` objects (used by the week strip). `apps/mobile/lib/dates.ts` has `parseApiDate`. The new shared logic works on `YYYY-MM-DD` strings instead and does **not** replace `week.ts` (separate refactor, later).
- **`RirSlider` already accepts `target?: number`** (index 0–4, 4 = "4+") and draws the dot under that segment (`components/workout/RirSlider.tsx`). Do not edit `RirSlider`; only pass the prop.
- Migrations live in `apps/api/server/db/migrations/` as `YYYYMMDDHHMMSS_name.js` (knex, ESM). The dev DB is `apps/api/server/db/dev.sqlite3`. The knexfile `dev` path cannot be redirected, so **never run the app's API against a copy**; use the `test` env for tests.
- API conventions to match (see `routes/gyms.ts`, `db/gyms.ts`): routes validate and map to status codes, `db/*.ts` does knex and maps snake_case ↔ camelCase explicitly (never spread objects into `.insert()`/`.update()`), 400/404/409 answer `{ "error": "message" }`, every 500 answers the plain text `Something went wrong`.

## Decisions (yours to approve before the step that needs them)

- **D1. Test runner: Vitest, in two places.** Pure-logic tests in `packages/shared`; API integration tests with `supertest` for the mesocycle routes against the in-memory `test` DB. Cost: three dev dependencies (`vitest`, `supertest`, `@types/supertest`) and a small DB setup helper. Benefit: the rules in this feature (Monday start, 409 states, ramp rounding) are exactly what tests protect, and it starts roadmap item 8. *Needed before step 1.* *Alternative:* curl scripts only. Cheaper now, but they don't re-run on every change.
- **D2. `packages/shared` is consumed as TypeScript source, no build step.** `package.json` gets `"type": "module"` and `"main"`/`"types"` pointing at `src/index.ts`; API (tsx) and mobile (Metro) import `workout-log-shared` directly. *Alternative:* compile to `dist/` first. More tooling to keep in sync for no benefit at this size. Step 1 proves both runtimes can import it, and **stops and asks** if either can't.
- **D3. The spec's `GET /mesocycles/active` becomes `GET /mesocycles/current`.** It returns the most recent mesocycle in *any* phase (or `null`) and the client decides what to show from its status. Reason: after a block finishes, `active` would be `null` and Home couldn't show the "Block finished" card. (Spec updated to match.) *Needed before step 4.*
- **D4. How long the "Block finished" card shows:** 7 days after the block's last day, then Home falls back to the "Start mesocycle" card. A block you **ended early** goes straight to the "Start mesocycle" card (you chose to stop; it is not a prompt). *Alternative:* show it until a new block is started. That never goes away on its own. *Needed before step 6.*
- **D5. New resource types live in `packages/shared`**, not in `apps/api/server/models`: `Mesocycle` (response), `NewMesocycle` (request body) and the limits as constants. Both sides import them from one place. It is the first piece of roadmap item 2, applied to a new resource only; the existing models are not moved.
- **D6. "Today" on the server is the server's local date** (a `getToday()` helper that uses local date parts, never `toISOString()`). That is correct while the API and the phone are in the same time zone (true until deployment, roadmap item 11) and is noted as a known limitation. The app sends its own local date as `startDate`, and the server validates it against its own today.
- **D7. Confirmation for "End block" and "Cancel block".** The mockup has the buttons but no confirm dialogs. Both reuse the existing bordered-card confirm modal pattern from Home's delete-workout flow (no new pattern). Ending a block is not undoable.

## Gotchas for every executor

- Dates are `YYYY-MM-DD` strings. **Never `toISOString()` for a local date**: in New Zealand it returns the previous day in the morning. Local date = `getFullYear()/getMonth()/getDate()`. Date arithmetic goes through `Date.UTC(...)` (or equivalent) so DST changes (NZ has them) can't shift a day.
- No commits, no writes to `dev.sqlite3`, no taps in the shared simulator, no `.ts`/`.tsx` scratch files in the repo (the user's editor type-checks them). Scratch files go in the scratchpad directory.
- Each executor reports: files changed, commands run with results (lint, `tsc --noEmit`, tests), and anything they were unsure about.

## Steps (one commit each; the main session reviews every diff, re-runs lint/tsc/tests, commits)

### 1. Shared package wiring + Vitest — *Opus* (cross-runtime tooling, sets the pattern)
- `packages/shared`: `package.json` per D2 (+ `test` script, `vitest` dev dependency), `src/index.ts`, and `src/mesocycle.ts` holding **only types and constants for now**: `Mesocycle`, `NewMesocycle`, `MESOCYCLE_LIMITS` (training weeks 2–8, deload weeks 0–2, RIR 0–4, defaults 4+1 and 3→0).
- Root `package.json`: a `test` script that runs the workspaces' tests. API: Vitest + supertest dev dependencies (config only; no tests yet). Drop `rootDir` from `apps/api/tsconfig.json` if TS6059 appears.
- **Proof, all four must pass:** (a) a real import of `workout-log-shared` in an API file type-checks (`npx tsc --noEmit -p apps/api`) and `npm run dev:api` starts; (b) the same import type-checks in the mobile app (`npx tsc --noEmit` in `apps/mobile`); (c) Metro bundles it: fetch the iOS bundle from the running Metro and check for HTTP 200 and the shared module's text in it; (d) `npm test` runs (it may report "no tests" until step 2). The imports used for the proof must be reverted or become real usages (no throwaway imports left behind).
- Commit: `Wire up shared package and Vitest`

### 2. Pure mesocycle logic + unit tests — *Sonnet (high)*
In `packages/shared/src/mesocycle.ts` (+ `mesocycle.test.ts` beside it), all pure and taking `today` as an argument:
- `getNextStartDate(today)`: today if Monday, else the next Monday.
- `getTargetRir(meso, week)`: the linear ramp from the spec (`round(start − (start − end) × i / (N − 1))`, ties toward easier) for training weeks; `4` for deload weeks (displayed `4+` by the UI).
- `getMesocycleStatus(meso, today)`: the four phases in the spec (`upcoming` with `startsOn` and `daysUntilStart`, `training`/`deload` with `week`, `totalWeeks`, `targetRir`, `completed`), where `ended_at` set ⇒ `completed`. Also expose whether it completed naturally or was ended early (needed by D4), plus the block's last day.
- `getMesocycleInputError(input, today)`: returns an error message or `null`; checks the limits, `startRir >= endRir`, start is a Monday and not before `getNextStartDate`'s Monday logic allows (not in the past).
- **Tests must cover:** every row of the ramp tables in the spec (3–6 weeks, 3→0 and 4→1) plus 2 weeks, 8 weeks and a flat ramp (start = end); `getNextStartDate` from each weekday and across a month end and a year end; status the day before start, the first day, the last day of a training week, the Sunday→Monday boundary, the first deload day, the last day of the block, the day after (completed), `ended_at` set, and a block that spans a DST change and a year end; every validation failure.
- Commit: `Add mesocycle logic and tests`

### 3. Migration + data access — *Sonnet (high)*
- Migration `…_create_mesocycles.js`: the `mesocycles` table from the spec (`start_date` date not null, `training_weeks`, `deload_weeks` default 1, `start_rir` default 3, `end_rir` default 0, `ended_at` date nullable, `created_at` timestamp default now), with a working `down`.
- `apps/api/server/db/mesocycles.ts`: `getCurrentMesocycle()` (latest by `start_date`, ties by `id`), `createMesocycle(data)`, `endMesocycle(id, today)`, `deleteMesocycle(id)`, `getMesocycleById(id)`; explicit snake_case ↔ camelCase mapping; nullable `endedAt` typed `string | null`.
- Verify: migrate up and down from scratch on the in-memory `test` DB (a small script in the scratchpad, or a Vitest test). The main session then runs `npm run db:migrate -w apps/api` on the dev DB (additive only: it adds a table and touches no existing data).
- Commit: `Add mesocycles table`

### 4. Routes + integration tests — *Opus* (write rules and the state machine)
`apps/api/server/routes/mesocycles.ts`, registered in `routes/index.ts`, plus `server/clock.ts` with `getToday()`:
- `GET /mesocycles/current` → latest mesocycle or `null` (D3).
- `POST /mesocycles` → validates with `getMesocycleInputError` (400); **409** if the current mesocycle is upcoming or training/deload; 201 with the new row.
- `PATCH /mesocycles/:id/end` → 404 missing; **409** if upcoming ("hasn't started, cancel it instead") or already ended/finished; else sets `ended_at` to today and returns the row.
- `DELETE /mesocycles/:id` → 404 missing; **409** if it has started; else 204.
- Non-numeric id → 400. Error bodies are `{ "error": "..." }`, 500s are plain text, like the other routes.
- Tests (supertest, in-memory DB, `NODE_ENV=test`, a fake clock with `vi.useFakeTimers({ toFake: ['Date'] })`): the happy path of each route; every 400 (non-Monday, past date, weeks out of range, `startRir < endRir`); 409 on POST while upcoming and while training; POST allowed after the previous block finished and after it was ended early; PATCH on upcoming → 409; PATCH twice → second is 409; DELETE on a started block → 409; DELETE twice → second is 404.
- Real-HTTP smoke by the main session against the dev API: `POST` a block starting next Monday, `GET /current`, then `DELETE` it (an upcoming block leaves no trace, which is why this is safe on the dev DB).
- Commit: `Add mesocycle API routes`

### 5. API client + hook — *Sonnet (high)*
- `apps/mobile/lib/api/mesocycles.ts`: `getCurrentMesocycle()`, `startMesocycle(data)`, `endMesocycle(id)`, `cancelMesocycle(id)`, typed with the shared types, using `request` from `client.ts`. A `toLocalDateString(date)` helper in `lib/dates.ts`.
- `apps/mobile/hooks/useCurrentMesocycle.ts`: loads on screen focus (like Home's `useFocusEffect`), returns `{ mesocycle, status, isLoading, error, reload }`, where `status` comes from `getMesocycleStatus(mesocycle, toLocalDateString(new Date()))`. One hook, used by Home and Log Set, so the two screens can't disagree.
- Verify: `lint`, `tsc`, and the main session's POST → GET → DELETE smoke through the client functions.
- Commit: `Add mesocycle API client and hook`

### 6. Home: the four states — *Sonnet (high)*
- `components/workout/MesocycleCard.tsx`: presentational; props are the status and callbacks. Renders the states from the mockup (active, upcoming, none, finished per D4) with the segmented bar (segment colour = the RIR colour of that week's target, deload = the `4+` colour) and the existing Iron tokens. The "THIS WEEK" strip stays where it is on Home; it is **not** merged into this card (the mockup showed it inside the card for compactness; decide on seeing it on a phone, but the default is: keep the existing card and add the new one above it).
- Wire "End block" and "Cancel block" with a confirm modal (D7). "Start mesocycle" / "Start a new block" open the modal from step 7 (a no-op stub is fine in this step).
- State screenshots: the main session inserts a **throwaway row directly into `dev.sqlite3`** for each state (past start dates can't be created through the API, by design), takes the screenshots and deletes the rows afterwards. I'll say so before doing it.
- Commit: `Show mesocycle card on Home`

### 7. Start modal — *Sonnet (high)*
- `components/workout/StartMesocycleModal.tsx`: a bordered-card modal like `SetNotesModal`. Four steppers with the limits from `MESOCYCLE_LIMITS` (changing the start RIR below the end RIR drags the end RIR down, and the reverse), the read-only "Starts" line from `getNextStartDate`, and the ramp preview from `getTargetRir`. Submits with `startMesocycle`; on failure shows `ApiError.serverMessage` when present, else a fixed message.
- Commit: `Add start mesocycle modal`

### 8. Log Set chips + target dot — *Sonnet (high)*
- Week chip and target chip in the Log Set header, only when the status is `training` or `deload` (not upcoming, finished or ended). Pass `target` through `SetForm` to `RirSlider` (add an optional `target` prop to `SetForm`; **do not change `RirSlider`**). The target is display-only: it must not preset or change the selected RIR.
- `log-set.tsx` is already ~650 lines: add the hook call and the chips only, no new state.
- Commit: `Show mesocycle target on Log Set`

### 9. Close-out (main session)
Run the whole checklist below, the debrief, then the journal via `/save`.

## Acceptance criteria

- `npm test` passes (shared unit tests + API route tests); `npm run lint -w apps/mobile` exits 0 with 0 warnings; `npx tsc --noEmit` passes in `apps/api` and `apps/mobile`; `npx expo-doctor` still passes.
- `grep -rn "fetch(" apps/mobile/{app,components,hooks}` finds nothing (all calls go through `lib/api/`).
- Starting a block on a Thursday creates an **upcoming** block starting next Monday; on a Monday it starts today. Starting a second block while one is upcoming or running is refused with a readable message.
- Home shows the right card in each of the four states (screenshots); Log Set shows the chips only inside a block, and the slider's selection is never changed by the target.
- Ending a running block asks for confirmation and then shows the "Start mesocycle" card; cancelling an upcoming block removes it completely (verified in the DB).
- **Hand-test by you afterwards:** start a block (5+1 and 3+1), look at the ramp preview, cancel it before it starts, start it again, check Log Set shows nothing yet, and (after the date has passed or with a throwaway row) check the active chips, the target dot and that logging a set still saves exactly the RIR you pick.

## Out of scope

- Everything under "Out of Scope" in the spec (history of past blocks, presetting or flagging RIR, editing a running block, concurrent blocks, a configurable first day of the week).
- Validating every route with zod (roadmap item 3), centralized errors (item 4) and moving the other models into `packages/shared` (item 2): this plan only uses the new `Mesocycle` types from there.
- Refactoring `lib/week.ts` onto the shared date helpers.
