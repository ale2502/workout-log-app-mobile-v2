# Expo SDK 54 → 58 upgrade plan

**Goal:** the app runs in the current Expo Go (SDK 58) on a physical phone, with every screen behaving as it does today on SDK 54.

**Why now:** Expo Go only runs one SDK. The App Store build is SDK 58 and older Expo Go builds can't be installed on an iPhone, so the phone can't open the project until it's on SDK 58.

**Acceptance criteria**
- `expo-doctor` reports no issues; `npm run lint -w apps/mobile` and `npx tsc --noEmit` (in `apps/mobile`) pass.
- In the iOS Simulator, on each SDK: the app boots past the splash screen with Barlow Condensed loaded, the dark theme is intact, and Home, Settings, Manage Gyms, the exercise picker, Workout detail and Log Set all render.
- The `RirSlider` still works by drag and by tap (including tap again to clear) with haptics.
- After the last step, the app opens on the phone through `npm run dev:mobile` and Expo Go SDK 58.

Scope: `apps/mobile` only. The API, DB and `packages/shared` don't change. No migrations, no seeds, no new env vars.

## Baseline (checked 2026-11-25)

- `expo ~54.0.37`, RN 0.81.5, React 19.1, `expo-router ~6.0.24`, reanimated 4.1, worklets 0.5.1, gesture-handler 2.28.
- Node 24.12 (SDK 58 needs 22.13+/24.3+/26+, even majors only) and Xcode 26.6 (SDK 55+ needs Xcode 26). No toolchain changes needed.
- `expo-doctor`: 18/18 checks pass.
- No `metro.config.js`, no native `ios/`/`android/` folders (Expo Go only), no component refs, no `react-native/Libraries/*` deep imports.

## What can break us (from the official notes)

| SDK | Change | Where it hits this app |
|---|---|---|
| 55 | `newArchEnabled` and `edgeToEdgeEnabled` removed (New Arch and edge-to-edge are mandatory). All Expo packages are now versioned with the SDK major (e.g. `expo-router@55.x`). | `app.json`: `expo.newArchEnabled`, `expo.android.edgeToEdgeEnabled` |
| 56 | Expo Router no longer depends on React Navigation; importing `@react-navigation/*` in app code is a **bundler error**. Hermes V1 is the default, with a known memory regression for reanimated/worklets apps (fixed in 57.0.9). Metro "watchFolders-free" mode is on by default. | `app/_layout.tsx:6-9` (`DarkTheme`, `ThemeProvider`), `components/haptic-tab.tsx:1-2` (`BottomTabBarButtonProps`, `PlatformPressable`); the type-only imports from `../../../api/server/models/*` (6 files) |
| 57 | RN 0.86 (no breaking changes); reanimated 4.3→4.5, worklets 0.8→0.10, gesture-handler 2.31→2.32. Dev startup regression fixed in 57.0.17. Expo Go on iOS requires being logged in to an Expo account to run a dev project (to be confirmed in Step 5). | `components/workout/RirSlider.tsx` (`Gesture.Pan/Tap/Exclusive`, `scheduleOnRN`, `withTiming`, `.set()`) |
| 58 | RN 0.88 (0.86→0.88, includes 0.87's changes): Strict TypeScript API is the default (deep imports and some ref types become type errors; `InteractionManager` removed). Expo Router navigation core reworked: `initialRouteName` and `beforeRemove` removed, `useNavigation` throws outside a navigator, JS tabs only show routes declared in the layout, `unstable_settings.anchor` is read per layout. | `app/_layout.tsx:22` (`anchor: '(tabs)'`), `app/(tabs)/_layout.tsx` (declares both tabs: fine); `tsc` will surface anything else |

Sources: [SDK 55](https://expo.dev/changelog/sdk-55), [SDK 56](https://expo.dev/changelog/sdk-56), [SDK 57](https://expo.dev/changelog/sdk-57), [SDK 58](https://expo.dev/changelog/sdk-58), [Router 55→56](https://docs.expo.dev/router/migrate/sdk-55-to-56/), [Router 57→58](https://docs.expo.dev/router/migrate/sdk-57-to-58/), [upgrade walkthrough](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/).

## Decisions

- **D1. One SDK per step (55 → 56 → 57 → 58), one commit each.** This is what Expo recommends. If something breaks, we know which SDK caused it, and any commit can be reverted on its own. The alternative is one jump with `expo@^58`: faster, but four SDKs of breakage arrive in one diff, and a regression could come from any of them. SDK 56 is a stepping stone only; we don't hand-test it on device because of its known Hermes memory regression.
- **D2. Replace `@react-navigation/*` imports with Expo Router's own entry points in Step 2, and remove the three `@react-navigation/*` dependencies.** From SDK 56, Expo Router owns navigation and re-exports what we need (`expo-router/react-navigation`, `expo-router/js-tabs`). Keeping the packages installed next to `expo-router` is a pairing `expo-doctor` warns about, and a second copy of navigation in `node_modules` is how theme/context mismatches happen. The bundler-check escape hatch (`EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK=1`) would hide the problem, not fix it.
- **D3. Keep the type-only `apps/api` model imports unless Metro rejects them.** If SDK 56's Metro mode breaks them, switch them to `import type { … }` (the import is erased at build time, so there's no behavior change). Moving the types into `packages/shared` is roadmap item 2 and is out of scope here.
- **D4. Let `npx expo install --fix` choose every version.** No hand-picked versions. The only manual edits are the ones the notes require.
- **D5. Executors:** Sonnet (high) for Steps 1 and 3 (mostly mechanical), Opus for Steps 2 and 4 (import rewrites and the router rework). The main session verifies in the simulator, reviews and commits between steps.

## Rules for every step

- Work in `apps/mobile`. Run `npx expo install expo@^<N>.0.0 --fix` from `apps/mobile`. It updates `apps/mobile/package.json` and the **root** `package-lock.json`.
- After installing, run `npx expo-doctor@latest`, `npm run lint` and `npx tsc --noEmit`. Fix what they report, but only issues caused by the upgrade.
- Don't add libraries, don't refactor, and don't touch the API, DB, `CLAUDE.md` or `.claude/`. Don't create `.ts/.tsx` scratch files.
- No DB writes and no taps in the simulator. The main session does the simulator check.
- Don't commit. Report back: the diff summary, versions before → after for `expo`, `react-native`, `expo-router`, reanimated, worklets and gesture-handler, plus the output of the three checks.

**Simulator check (main session, every step):** stop Metro on :8081, run `npm run update:mobile-env:sim`, start `npx expo start --localhost --ios --clear` (the CLI installs the matching Expo Go in the simulator), then screenshot each screen, opening routes by deep link (`xcrun simctl openurl booted exp://127.0.0.1:8081/--/<route>`) instead of taps. The API on :3001 keeps running.

## Steps

### Step 1: SDK 55
1. `npx expo install expo@^55.0.0 --fix`
2. `app.json`: delete `expo.newArchEnabled` and `expo.android.edgeToEdgeEnabled`. Keep `predictiveBackGestureEnabled` unless doctor flags it.
3. Checks + simulator check.
4. Commit: `Upgrade to Expo SDK 55`

### Step 2: SDK 56
1. `npx expo install expo@^56.0.0 --fix`
2. Rewrite the `@react-navigation/*` imports (try the codemod first: `npx expo-codemod sdk-56-expo-router-react-navigation-replace app components hooks lib`). Expected targets: `DarkTheme`, `ThemeProvider` → `expo-router/react-navigation`; `PlatformPressable` → `expo-router/react-navigation`; `BottomTabBarButtonProps` → `expo-router/js-tabs`. **Confirm each name is actually exported** by checking the `.d.ts` files under `node_modules/expo-router` before relying on it, and report what you found.
3. Remove `@react-navigation/bottom-tabs`, `@react-navigation/elements` and `@react-navigation/native` from `apps/mobile/package.json` (`npm uninstall -w apps/mobile …` from the repo root).
4. If Metro fails to resolve `../../../api/server/models/*`, apply D3.
5. Checks + simulator check (boot and render only; Hermes memory regression is known).
6. Commit: `Upgrade to Expo SDK 56`

### Step 3: SDK 57
1. `npx expo install expo@^57.0.0 --fix`, then confirm the installed `expo` is ≥ 57.0.17.
2. Check `RirSlider.tsx` against the installed reanimated/worklets/gesture-handler typings (`scheduleOnRN`, `Gesture.*`, shared value `.set()`); `tsc` should be enough to catch renames.
3. Checks + simulator check, plus the main session drags and taps the `RirSlider` on Log Set (this is the one step where it taps, and it doesn't save a set).
4. Commit: `Upgrade to Expo SDK 57`

### Step 4: SDK 58
1. `npx expo install expo@^58.0.0 --fix`
2. Fix the type errors from RN's Strict TypeScript API. Read the Router 57→58 guide and check our usage: `unstable_settings.anchor` in `app/_layout.tsx` (should still be valid on the root Stack), both tab routes are declared in `app/(tabs)/_layout.tsx`, and nothing uses `initialRouteName`, `beforeRemove`, `freezeOnBlur`, or `useNavigation` outside a navigator.
3. Checks + full simulator check, including the `RirSlider` and opening and closing the notes modal.
4. Commit: `Upgrade to Expo SDK 58`

### Step 5: On the phone (the user)
1. Run `npm run dev:mobile` (this writes the LAN IP back into `.env.local`) and scan the QR code with Expo Go SDK 58. If Expo Go asks you to log in, use the Expo account that owns the EAS project.
2. Run the hand-test checklist from the 2026-11-19 journal entry: Log Set flows, the notes modal with the keyboard, note taps on Workout detail, long-press delete on Home, and the Gyms dropdowns and placeholder.
3. Debrief, then `/save`.

## Rollback

Each step is one commit touching `apps/mobile/package.json`, `apps/mobile/app.json`, the root `package-lock.json` and a few source files. `git revert <sha>` followed by `npm install` returns to the previous SDK. Expo Go in the simulator follows the project's SDK on the next `expo start`.

## Learnings from Step 1 (apply to Steps 2–4)

- **Duplicate `react-native` after `expo install --fix`.** In this workspace the first install left a stale hoisted `react-native@0.81.5` in the root `node_modules` next to the new one in `apps/mobile`, which made `expo-doctor` fail ("no duplicate dependencies"). The executor fixed it by taking the lockfile from HEAD, deleting only the mobile/Expo-related entries and reinstalling, so the API's dependencies stayed at their HEAD versions. After every install, run `npm ls react-native expo-constants` and expect a single copy of each; if not, repeat that pruning approach and diff the API deps in the lockfile against HEAD.
- **Metro binds to IPv6 only with `--localhost` on Node 24.** Expo Go is told to fetch from `127.0.0.1`, so it shows "Could not connect to the server". Start Metro with `NODE_OPTIONS=--dns-result-order=ipv4first` for simulator checks (`lsof -nP -iTCP:8081 -sTCP:LISTEN` should show `127.0.0.1:8081`). The SessionStart hook needs the same option.
- **Expo Go install prompt.** `expo start --ios` asks to install the matching Expo Go and refuses in non-interactive mode. Run it under a pseudo-terminal and answer `Y`, or install it from an interactive shell once per SDK.
- **Expo Go first-run intro** (tools menu sheet) needs one manual tap on *Continue* per Expo Go install; the main session cannot tap (no accessibility access for `osascript`).
- `expo install` writes `"expo": "^N.0.0"` (caret) rather than `~`, and adds `"expo-image"` to the `app.json` plugins by itself. Both are accepted.

## Learnings from Step 2 (apply to Steps 3–4)

- **Duplicate cleanup: prune by name.** Step 2 left stale hoisted copies again (`expo-constants@55`, `expo-router@55`, `expo-image`/`expo-symbols`@55). Prune from the HEAD lockfile only the entries whose package name is Expo, React Native, React, React Navigation, Metro or `eslint-config-expo`, then reinstall. Pruning "everything the API doesn't need" instead bumped about 8 of the API's transitive dependencies. Always compare the API's whole resolved tree against HEAD afterwards.
- **`react-hooks/set-state-in-effect` is now an error** (SDK 56's `eslint-config-expo` pulls in `eslint-plugin-react-hooks` 7). `app/settings/manage-gyms.tsx` has three spots (state set inside `useEffect`), so `apps/mobile/eslint.config.js` downgrades that one rule to `warn`. **Follow-up:** refactor those effects (derive state or reset it in the handlers) and then remove the override; it needs its own hand-test of the Gyms screen.
- **Deprecated imports that still work:** `PlatformPressable` from `expo-router/react-navigation` ("copy the component into your codebase", removal in a later SDK) and `Tabs` from `expo-router` (the notes point at `expo-router/js-tabs`). `DarkTheme`/`ThemeProvider` now come from the root `expo-router`. Check each again in Step 4.
- `expo install --fix` moved mobile's TypeScript to 6.0.x (the API stays on 5.9.x). The editor flags `eslint.config.js` (CommonJS `require`, no types for `eslint-config-expo/flat`); that is cosmetic.
- **Step 3 hand-check:** the main session can't tap in the simulator (no accessibility access), so the `RirSlider` drag/tap check has to be done by the user.

## Learnings from Step 4 (SDK 58)

- **Installed:** RN 0.88.1, React 19.3.0, `expo-router` 58.0.32, reanimated 4.7.1, worklets 0.13.0, **gesture-handler 3.3.0 (a major bump)**. Expo Go 58.0.7 exists and the CLI installs it in the simulator (the SDK 58 changelog's "Expo Go will be released within a few weeks" is stale).
- **One source fix:** with RN's strict types, `tabBarIcon`'s `color` is `ColorValue`, but `@expo/vector-icons` types `color` as `string | OpaqueColorValue`. `app/(tabs)/_layout.tsx` casts `color as string` (our tint colours are always strings).
- **Still-working but deprecated:** `Tabs` from `expo-router` (use `expo-router/js-tabs`), `PlatformPressable` from `expo-router/react-navigation` (copy it into the codebase), and the `Gesture.Pan/Tap/Exclusive` builder API used by `RirSlider` (gesture-handler 3 prefers `usePanGesture`, `useTapGesture`, `useExclusiveGestures`). None is removed in SDK 58.
- `unstable_settings = { anchor: '(tabs)' }` on the root Stack is still valid (`(tabs)` is a direct child of the layout).
- **Follow-ups (not part of this upgrade):** refactor the three set-state-in-effect spots in `manage-gyms.tsx`; migrate `RirSlider` to the hook-based gesture API; replace `PlatformPressable` with a local component; move `Tabs` to `expo-router/js-tabs`.
