# CLAUDE.md

## Project Overview

A mobile-first full-stack monorepo for a workout log app ("Grind Notes"), built as a learning project. Users start a workout, pick a muscle group and exercise, log sets (reps/load/RIR/notes), and review past workouts. Gym-specific machine variants are tracked so history stays accurate per exact machine.

Stack: TypeScript, React Native (Expo/Expo Router), Node/Express, Knex.js, SQLite3.

## Project Structure & Module Organization

npm workspaces monorepo:
- `apps/mobile` — Expo app. Routes in `app` (Expo Router: `_layout.tsx`, grouped routes under `app/(tabs)`), reusable UI in `components` (e.g. `components/workout`, `components/ui`), hooks in `hooks`, theme constants in `constants`, assets in `assets`.
- `apps/api` — Express API under `server`: routes in `server/routes`, data access in `server/models` and `server/db`, Knex config/migrations/seeds under `server/db`.
- `packages/shared` — reserved for shared types/validation/pure logic (not app-specific UI or server handlers).

Prefer colocated component code in `components/workout` or `components/ui` before adding new top-level folders.

## Build, Test, and Development Commands

- `npm install` — install all workspace dependencies from the root lockfile.
- `npm run dev:api` — start the API with `tsx watch`.
- `npm run dev:mobile` — refresh the mobile env file, then start Expo.
- `npm run update:mobile-env` — refresh `apps/mobile/.env.local` from `scripts/update-mobile-env.mjs` (writes the current macOS `en0` IP so Expo Go on a phone can reach the API).
- `npm run lint -w apps/mobile` — Expo ESLint for the mobile app.
- `npm run db:migrate -w apps/api` — apply API database migrations.
- `npm run db:seed -w apps/api` — seed the API database.
- iOS Simulator: `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer` is needed if `xcode-select` points at Command Line Tools instead of Xcode.

## Coding Style & Naming Conventions

- TypeScript throughout. Two-space indentation in the mobile app; four-space indentation in API package JSON/config files where already present.
- PascalCase for React components and type names, camelCase for functions/variables.
- API responses/request bodies use camelCase (matching app models); DB columns are snake_case — map explicitly between them in `server/db/*` rather than spreading objects directly into Knex `.update()`/`.insert()`.
- Nullable DB columns (e.g. `load`, `rir`, `note`) should be typed `T | null` in models, not just `T | undefined`.
- Route files (`app/`) are Expo Router routes; non-route reusable UI belongs outside `app/`, in `components/`.

## Testing Guidelines

No established test runner yet. When adding tests, place them near the covered code using `.test.ts`/`.test.tsx`/`.spec.ts` naming. Playwright is installed at the root for future UI/browser flows. Always run relevant lint, migration, and app-startup commands for the area you changed.

## Commit & Pull Request Guidelines

Keep commit subjects short and imperative (e.g. `Add gym machine variants`, `Fix add exercise route`). PRs should include a brief summary, testing performed, and screenshots/recordings for mobile UI changes. Call out any DB migrations, seed changes, or env var updates explicitly.

## Security & Configuration Tips

Never commit local secrets. `apps/mobile/.env.local` is environment-specific and gitignored. Keep generated output like `apps/mobile/dist` out of reviews unless the change intentionally updates built assets.

## Working Style (read this first)

This repo exists so I (the user) can **learn** full-stack/mobile development by building it, not to have it built for me. Default behavior for any new feature or non-trivial change:

1. **Don't just write the code into the files yourself.** Instead, tell me exactly what to do:
   - Which file(s) need to change (full path).
   - The code snippet for that change.
   - A short explanation of *why* — what the change does and how it fits the surrounding flow.
2. Keep snippets scoped to one logical step at a time rather than dumping an entire feature at once, unless I ask for the full picture up front.
3. I'll apply the changes myself (or ask you to apply them once I understand them) — don't assume I want you to edit files automatically for feature work.
4. This mode applies to **feature/functionality work**. Routine tasks I explicitly hand off wholesale (repo cleanup, config changes, refactors I ask you to just do, debugging where I ask you to fix it directly) don't need this treatment — do those normally.
5. Favor a clean, explainable setup over unnecessary tooling complexity. Prefer step-by-step setup over large implicit jumps. Match existing UI styling/patterns as the source of truth — don't introduce new colors, fonts, or component patterns for new screens without asking.
6. `packages/shared` should only ever hold runtime-agnostic shared code (types, validation, constants) — never backend or mobile-specific logic.

## Project Journal

`PROGRESS_JOURNAL.md` at the repo root is the running log of sessions: what was explored, learned, and the next action. Skim recent entries at the start of a session to pick up context, and add a new row after a focused session (date, what was done, what was learned, next action).
