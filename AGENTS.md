# Repository Guidelines

## Project Structure & Module Organization

This is an npm workspaces monorepo for a workout log app. The Expo app lives in `apps/mobile`, with routes in `app`, reusable UI in `components`, hooks in `hooks`, theme constants in `constants`, and assets in `assets`. The API lives in `apps/api`, with Express entry points under `server`, routes in `server/routes`, data access in `server/models`, and Knex files under `server/db`. `packages/shared` is reserved for shared code and types.

## Build, Test, and Development Commands

- `npm install`: install all workspace dependencies from the root lockfile.
- `npm run dev:api`: start the API with `tsx watch`.
- `npm run dev:mobile`: update the mobile env file, then start Expo.
- `npm run update:mobile-env`: refresh mobile environment settings from `scripts/update-mobile-env.mjs`.
- `npm run lint -w apps/mobile`: run Expo ESLint for the mobile app.
- `npm run db:migrate -w apps/api`: apply API database migrations.
- `npm run db:seed -w apps/api`: seed the API database.
- `npx playwright --version`: verify the installed Playwright CLI.

## Coding Style & Naming Conventions

Use TypeScript for application code. Match existing style: two-space indentation in the mobile app and four-space indentation in API package JSON/config files where already present. Use PascalCase for React components and type names, camelCase for functions and variables, and route/file names that follow Expo Router conventions such as `_layout.tsx` and grouped routes under `app/(tabs)`. Prefer colocated component code in `components/workout` or `components/ui` before adding top-level folders.

## Testing Guidelines

There is no established test runner or coverage threshold yet. When adding tests, place them near covered code and use `.test.ts`, `.test.tsx`, or `.spec.ts` naming. For UI/browser flows, use the installed Playwright CLI and add `playwright.config.*` before introducing end-to-end tests. Always run relevant lint, migration, and app startup commands for the area changed.

## Commit & Pull Request Guidelines

Recent commits use short imperative messages, for example `Create add-exercise page` and `Fix add exercise route`. Keep commit subjects concise and action-oriented. Pull requests should include a brief summary, testing performed, linked issue or task when available, and screenshots or screen recordings for mobile UI changes. Note any database migrations, seed changes, or environment variable updates explicitly.

## Security & Configuration Tips

Do not commit local secrets. `apps/mobile/.env.local` is local configuration and should stay environment-specific. Keep generated output such as `apps/mobile/dist` out of reviews unless the change intentionally updates built assets.

## Session start guidance

Use PromptKit as project memory at the start of each session: read
`promptkit/notes/session-memory.md`, `promptkit/notes/learning-plan.md`, and recent
`promptkit/notes/progress-journal.md` entries to continue where we left off.

Do not activate the Tutor workflow by default. Build, edit, debug, and commit normally
when asked. Use the Tutor or Reflect workflows only when the user explicitly asks for
tutoring, guided learning, reflection, or journaling.
