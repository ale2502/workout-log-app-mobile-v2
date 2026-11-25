# API client layer plan (roadmap item 1)

**Goal:** every call from the app to the API goes through typed functions in `apps/mobile/lib/api/`, so URLs, methods, JSON bodies, response typing and error handling live in one place instead of 27 `fetch(...)` calls spread over 8 files. **Pure refactor: no change in behavior or UI.**

**Why now:** the mesocycle feature will add endpoints. Without this layer each one would add more copy-pasted `fetch` blocks. It is also the step that makes shared contract types (item 2) and TanStack Query (item 7) cheap later: both will only touch `lib/api/`.

## Inventory (checked 2026-11-25)

27 `fetch` calls: `app/workout/log-set.tsx` 8, `app/settings/manage-gyms.tsx` 7, `app/(tabs)/index.tsx` 4, `app/workout/[workoutId].tsx` 2, `app/workout/add-exercise.tsx` 2, `app/workout/muscle-groups.tsx` 1, `app/workout/exercises.tsx` 1, `hooks/useSetNotes.ts` 1. 13 of them write data (POST/PATCH/DELETE). Each builds its own `${process.env.EXPO_PUBLIC_API_URL}/...` string. 24 hand-written `response.ok` checks with different error messages.

API resources (from `apps/api/server/routes`): `gyms` (list, create, rename, machines of a gym), `exercises` (list, muscle groups, create), `exercise-variants` (filtered list, create, relabel), `workouts` (create, list, get, sets of a workout, delete workout, delete an exercise's sets, delete a variant's sets), `sets` (filtered list, create, patch, delete).

**Server error styles to absorb** (see roadmap item 4, which fixes this on the server): 400/404/409 respond `{ "error": "message" }` as JSON, every 500 responds with the plain text `Something went wrong`. Today only `manage-gyms.tsx` shows the server's message (via its own `getErrorMessage` helper); other screens show their own fixed text.

## Decisions (yours to approve)

- **D1. Shape: one module per resource plus a tiny core.**
  - `lib/api/client.ts`: reads `EXPO_PUBLIC_API_URL` (the only place that does), `request<T>(path, options)`, and `ApiError`.
  - `lib/api/gyms.ts`, `exercises.ts`, `exerciseVariants.ts`, `workouts.ts`, `sets.ts`: one exported function per endpoint, e.g. `getGyms()`, `createGym({ name })`, `updateSet(id, patch)`.
  - Screens import what they need (`import { getGyms } from '@/lib/api/gyms'`). No barrel file and no class: plain functions are easy to read and to mock.
  - *Alternative:* one `api` object (`api.gyms.list()`). Reads nicely, but one big file/namespace grows with every feature.
- **D2. Errors: `request` throws `ApiError { status, message }`.** `message` is the server's `{ error }` text when the body is JSON, otherwise a generic fallback. Screens keep their own `catch` and their own fallback texts, so **what the user sees stays exactly the same**; the one place that already shows server messages (Gyms: "Gym name already exists") keeps doing it through `error.message`.
  - *Alternative:* the client maps every status to a user-facing message. That changes UX copy in a refactor, so no.
- **D3. Types: functions return the existing API model types** (`SetDisplay`, `Exercise`, `Gym`, `ExerciseVariantDisplay`, …) imported from `apps/api/server/models/*`, the same way the screens do today. After this step only `lib/api/` (plus the screens' type imports) depend on those paths, and the local duplicate interfaces in `manage-gyms.tsx` (`Gym`, `Exercise`, `ExerciseVariantDisplay`) are replaced by the shared ones. Moving the types into `packages/shared` is item 2 and is out of scope.
- **D4. No new libraries** (no axios, no TanStack Query yet). `fetch` stays; query caching is item 7, *after* this, so you see what it replaces.
- **D5. No endpoint, body, status handling or UX change.** A call's URL, method, headers and JSON body must be byte-for-byte what it is today.

## Decisions log (added during execution)

- **Step 1 done (2026-11-25):** 20 functions in `lib/api/` (`client.ts` + `gyms`, `exercises`, `exerciseVariants`, `workouts`, `sets`), 26 call sites to migrate (not 27). `deleteExerciseSets` is not exposed because the app never calls that route.
- **Error text on the Gyms screen (Step 5):** that screen shows the server's message only when the response body is JSON `{ error }` and otherwise its own per-call fallback ("Could not update gym"). To keep that exactly, `ApiError` gets an extra field `serverMessage: string | null` (set only for JSON `{ error }` bodies) in Step 5; the screen then uses `error instanceof ApiError && error.serverMessage !== null ? error.serverMessage : 'Could not update gym'`. `ApiError.message` stays as it is (server text, else `Request failed with status N`). Screens that never showed server messages keep their fixed texts.
- **IDs:** the client takes `number` ids; route params are strings, so screens convert with `Number(...)` where they call the client.
- **Server quirk noticed, left alone:** `PATCH /sets/:id` for an unknown id answers 200 with an empty body (`updateSet` then resolves to `undefined`); fix belongs to roadmap items 3/4.
- **Tooling note:** the API has no env var to choose its database file; the smoke test patches the knex config at runtime from outside the repo. A `DB_FILE`-style setting will be needed for tests (roadmap item 8).

## Acceptance criteria

- `grep -rn "fetch(" apps/mobile/{app,components,hooks,lib}` finds only `lib/api/client.ts`; `EXPO_PUBLIC_API_URL` appears only there.
- `npm run lint -w apps/mobile` exits 0 with 0 warnings, `npx tsc --noEmit` passes, `expo-doctor` still passes.
- A smoke script (below) exercises **every** client function, including all writes, against a throwaway copy of the API and the dev database, and checks the results.
- Every screen still loads in the simulator, and the user-visible error texts are unchanged (checked by reading the diffs).
- Hand-test by you afterwards: log a set, edit and delete a set, add/edit/delete a note, add a gym and a machine, delete an exercise and a workout. (I can't tap in the simulator.)

## Verification without tapping

The 13 write calls can't be exercised from the simulator by me, and the real dev DB must not be written to. So Step 1 ends with a throwaway **smoke script in the scratchpad (not in the repo)**: copy `apps/api/server/db/dev.sqlite3` to the scratchpad, start a second API instance against the copy on port 3999, point `EXPO_PUBLIC_API_URL` at it, and run a Node script (Node 24 strips TypeScript types) that calls each function in `lib/api/` and asserts on the responses and on `ApiError` for a 404 and a 409. Check first how `apps/api/server/db/knexfile.js` / `connection.ts` pick the database file; if there's no clean way to point at a copy, stop and ask.

## Steps (one commit each; the main session reviews, runs lint/tsc, commits)

1. **Core + resource modules, no screen touched.** `lib/api/client.ts` and the five resource files, derived from reading all 27 call sites (the function list above is the expected shape; the real list comes from the call sites, with parameter and return types from the models). Add the smoke script and run it. *Opus (it sets the pattern for the other steps).* Commit: `Add typed API client`
2. **Home** (`app/(tabs)/index.tsx`, 4 calls). Commit: `Use API client on Home`
3. **Exercise picker flow** (`muscle-groups.tsx`, `exercises.tsx`, `add-exercise.tsx`, 4 calls). Commit: `Use API client in exercise picker`
4. **Workout detail and notes** (`[workoutId].tsx`, `hooks/useSetNotes.ts`, 3 calls). Commit: `Use API client in workout detail`
5. **Gyms** (`manage-gyms.tsx`, 7 calls; delete `getErrorMessage` and the local duplicate interfaces). Commit: `Use API client in Gyms screen`
6. **Log Set** (`log-set.tsx`, 8 calls, the largest and the one with the most write paths). *Opus.* Commit: `Use API client in Log Set`
7. **Close-out** (main session): the grep criteria above, `expo-doctor`, a full simulator walk-through by deep link, then the debrief.

Steps 2 to 5 are mechanical and go to Sonnet (high). Each executor gets: the files it may touch, "no commits, no DB writes, no taps, no `.ts/.tsx` scratch files in the repo", and a before → after table of every call it replaced (URL, method, body). The main session reads that table against the old code.

## Out of scope (noted for later)

- Request/response validation with zod (item 3) and a consistent server error shape (item 4): the client will simply get simpler when the server sends one shape.
- Request cancellation / stale-response races (e.g. fast gym switching on the Gyms screen): a separate bug-fix, easier once TanStack Query (item 7) is in.
- Moving types to `packages/shared` (item 2).
