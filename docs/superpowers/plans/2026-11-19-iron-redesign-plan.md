# Iron Redesign: Implementation Plan

Builds on the design spec `docs/superpowers/specs/2026-11-18-iron-redesign-design.md`. The spec says **what** the app should look like. This plan says **how to build it, step by step**. It's written so an executor agent can run any single step cold, without the conversation that produced it.

Mockup: https://claude.ai/artifact/356kHjgxGi5myWDMkC9rzQ, frame "Chosen · Iron + week strip, RIR slider, set notes". All the visual values the executor needs are copied into this file, so it never has to open the mockup.

---

## How to execute a step (read this first, executor)

1. **One step per run.** Do only the step you were given. Don't touch files outside its file list. If a step can't be finished without leaving that list, stop and report back.
2. **Stop on ambiguity.** If something isn't covered here (a value, a behavior, a file that's missing), don't invent an answer. Stop and report the question.
3. **Match existing idioms:** two-space indent, PascalCase components, camelCase functions, `StyleSheet.create` at the bottom of the file, `@/` imports, comment density similar to the surrounding code. Only change UI and styling. Keep fetch logic, handlers and API calls as they are unless the step says otherwise.
4. **Use tokens, never raw values.** Screens and components must not contain hex colors, font family strings or one-off radii. Use `Colors`, `Fonts`, `Radius`, `Spacing` and `Type` from `@/constants/theme` (step 1 defines them).
5. **Verify** (all three are required):
   - `npm run lint -w apps/mobile` must pass.
   - `cd apps/mobile && npx tsc --noEmit -p . 2>&1 | grep -c "error TS"` must be **≤ 19** (the baseline before step 1). It must never go up. After step 13 it must be **0**.
   - Screenshot: `xcrun simctl io booted screenshot <scratchpad>/step-N.png`, opening the screen first with a deep link if needed, e.g. `xcrun simctl openurl booted "exp://localhost:8081/--/workout/log-set?workoutId=1&exerciseId=1"`. Look at the screenshot and compare it with the "Acceptance" list for the step. Metro and the API are normally already running (SessionStart hook). If the simulator isn't booted, say so in the report rather than trying to fix it.
6. **Don't commit.** Leave the changes in the working tree. The orchestrator reviews them, then commits with the subject given in the step.
7. **Report:** files changed, the verification output (lint result, tsc count, screenshot path), any deviations from the plan, and open questions.

---

## Decisions (confirmed by the tech lead before execution)

| # | Decision | Choice |
|---|---|---|
| D1 | Light mode | Dark only. Remove the Settings "Dark mode" toggle in step 1. Keep the `Colors.light` / `Colors.dark` shape as a **temporary shim**, with both pointing to the same Iron palette, so untouched screens keep compiling. Step 13 deletes the shim and the theme plumbing. |
| D2 | Fonts | Add `@expo-google-fonts/barlow-condensed` (600 SemiBold, 700 Bold) for headings and numbers. Body text uses the system font (SF Pro); no Inter. |
| D3 | RIR values | Whole numbers only. The slider has 0, 1, 2, 3, 4+, and "4+" is stored as `4`. Any saved value > 4 is shown as "4+". Tapping the selected segment again clears it (`null` = not recorded). The old ±0.5 stepper is removed. The current DB only holds whole-number RIRs (checked 2026-11-19). |
| D4 | Load step | The load steppers change the value by ±2.5 kg and reps by ±1. The big number is a `TextInput` (`keyboardType="decimal-pad"`), so typing still works. |
| D5 | Set row interactions (Log Set) | **Tap** a row opens its note (the existing `useSetNotes` flow). **Long-press** a row enters edit mode, as it does today: the form is filled from the set, the main button becomes "Update set N", and Delete/Cancel buttons appear. While in edit mode, tapping another row switches the edit target (today's behavior). |
| D6 | Machine picker (Log Set) | It isn't in the mockup, but we keep it. The subtitle reads "Chest · Gym · **Machine ▾**", and tapping the machine name opens the existing dropdown and "+ Add machine" flow, restyled. The logic doesn't change. |
| D7 | Tabs | Two tabs: **Train** (the old Home) and **Settings**. Delete Explore. No Progress tab yet. The active tab uses the `accent` color, as in the mockup. |
| D8 | Home "This week" card | Shows the session count only ("2 SESSIONS") and the week strip. The set count waits for an endpoint. No meso card and no "See all" link. A history row's subtitle is the gym name, because `/workouts` doesn't return muscle groups yet. |
| D9 | Week strip logic | Weeks start on Monday, in the device's local time zone. Pure function in `apps/mobile/lib/week.ts`, because `packages/shared` isn't wired up as a workspace yet (that's roadmap item 2). |

---

## Tokens (step 1 writes these into `apps/mobile/constants/theme.ts`)

```ts
const iron = {
  // existing keys (kept so current screens restyle automatically)
  background: '#0D0D0F',
  surface: '#17171B',
  surfaceMuted: '#212127',   // raised: stepper buttons, chips, icon tiles
  text: '#F4F4F5',
  mutedText: '#9A9AA3',
  placeholder: '#55555D',
  border: '#2A2A31',
  tint: '#C8F031',
  icon: '#9A9AA3',
  tabIconDefault: '#9A9AA3',
  tabIconSelected: '#C8F031',
  primary: '#F4F4F5',        // neutral buttons (NOT lime: steppers use this today)
  onPrimary: '#0D0D0F',
  destructive: '#F87171',
  success: '#4ADE80',
  noteIndicator: '#D4D4D8',
  // new keys
  accent: '#C8F031',         // ONLY for primary actions, the active tab and the week strip
  onAccent: '#0D0D0F',
  tabBar: '#121215',
  noteText: '#D4D4D8',
};
export const Colors = { light: iron, dark: iron }; // shim: see D1, removed in step 13

// RIR effort scale, index = RIR (4 means 4+). Hot = hard, cool = easy.
export const RirColors = ['#F87171', '#FB923C', '#FACC15', '#4ADE80', '#60A5FA'] as const;
export const rirTint = (rir: number) => RirColors[Math.min(rir, 4)] + '1F'; // ~12% alpha row background
export const rirLabel = (rir: number) => (rir >= 4 ? '4+' : String(rir));

export const Radius = { sm: 8, md: 12, lg: 16, xl: 18, pill: 999 };
export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 };

export const Fonts = { display: 'BarlowCondensed_700Bold', displaySemi: 'BarlowCondensed_600SemiBold' };
// Text styles. Uppercase labels use letterSpacing in px (RN has no em): 0.14em × 11px ≈ 1.5
export const Type = {
  hero:    { fontFamily: Fonts.display, fontSize: 46, lineHeight: 46, textTransform: 'uppercase' },
  title:   { fontFamily: Fonts.display, fontSize: 34, lineHeight: 36, textTransform: 'uppercase' },
  number:  { fontFamily: Fonts.display, fontSize: 64, lineHeight: 64 },
  button:  { fontFamily: Fonts.display, fontSize: 22, letterSpacing: 0.9, textTransform: 'uppercase' },
  cell:    { fontFamily: Fonts.displaySemi, fontSize: 20 },
  label:   { fontSize: 11, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase' }, // color: mutedText
  body:    { fontSize: 15, fontWeight: '600' },
  caption: { fontSize: 13 },
} as const;
```

The old `Fonts` export (`sans` / `serif` / `rounded` / `mono`) is only used by template files that step 3 deletes. Step 1 replaces it. If anything else still imports `Fonts.sans` at that point, report it.

---

## Steps

Each step is one commit. A step marked **(Opus)** is one where an executor model mistake is likely to be subtle, so run it on Opus or review it on the device yourself.

### Step 1: Tokens, font, status bar
**Files:** `apps/mobile/constants/theme.ts`, `apps/mobile/app/_layout.tsx`, `apps/mobile/app/(tabs)/settings.tsx`, `apps/mobile/hooks/theme-context.tsx`, `apps/mobile/app.json`, `apps/mobile/package.json` (+ root lockfile).
- `npx expo install @expo-google-fonts/barlow-condensed` (from `apps/mobile`).
- Write the tokens above.
- `_layout.tsx`: call `useFonts({ BarlowCondensed_600SemiBold, BarlowCondensed_700Bold })` and keep the splash screen up until the fonts load (`expo-splash-screen` `preventAutoHideAsync` / `hideAsync`). Change `<StatusBar style="auto">` to `style="light"`. The navigation theme always uses `DarkTheme` with Iron colors (`card` = `surface`, `primary` = `accent`).
- `theme-context.tsx`: `colorScheme` is always `'dark'`. Remove the AsyncStorage read/write and the system scheme lookup. Keep the exports (`ThemeProvider`, `useColorScheme`, `useThemeMode`) so nothing else breaks. Add a comment pointing to step 13.
- `settings.tsx`: delete the Dark mode card and its `Switch`.
- `app.json`: `"userInterfaceStyle": "dark"`, splash `backgroundColor` `#0D0D0F`.

**Acceptance:** every screen is on the near-black background with Iron surfaces and borders. Status bar text is white. No light-mode flash on launch. Settings shows only "Manage gyms and machines".
**Commit:** `Add Iron design tokens and Barlow font`

### Step 2: UI primitives
**Files (new):** `apps/mobile/components/ui/AppText.tsx`, `Button.tsx`, `Card.tsx`, `Screen.tsx`, `IconButton.tsx`.
- `AppText`: `variant: keyof typeof Type` (default `body`), `color?: keyof typeof Colors.dark` (default `text`; `label` defaults to `mutedText`). Forwards all other `TextProps`.
- `Button`: `title`, `onPress`, `variant: 'primary' | 'secondary' | 'destructive'`, `size: 'lg' | 'md'` (height 64 / 56), `icon?: ReactNode`, `disabled?`, `loading?` (shows `ActivityIndicator`). Primary = `accent` background with `onAccent` text. Secondary = `surface`. Destructive = `destructive` background. Text uses `Type.button` (24px for `lg`). Radius `lg`. Press feedback: opacity 0.85.
- `Card`: `View` with `surface` background, radius `xl`, padding `lg`, gap `md`. Accepts `style`.
- `Screen`: safe-area top padding + `background` color + horizontal padding `xl`. Props: `scroll?: boolean` (wraps in `ScrollView`), `contentStyle?`. Use `react-native-safe-area-context`.
- `IconButton`: 44×44 (or `size` prop), `surface` background, radius `md`, child icon, `accessibilityLabel` required, optional `badge?: boolean` (9px `accent` dot at top-right, as on the mockup's pencil button).

**Acceptance:** nothing visible changes (no screen uses these yet). Lint and tsc pass.
**Commit:** `Add Iron UI primitives`

### Step 3: Tabs and template cleanup
**Files:** `apps/mobile/app/(tabs)/_layout.tsx`. Delete: `app/(tabs)/explore.tsx`, `app/modal.tsx` (and its `Stack.Screen` in `app/_layout.tsx`), `components/parallax-scroll-view.tsx`, `components/hello-wave.tsx`, `components/ui/collapsible.tsx`, `components/external-link.tsx`. Before deleting each file, `grep` to confirm nothing else imports it. If something does, keep the file and report it.
- Tabs: `index` → title **"Train"**, Ionicons `barbell-outline`. `settings` → Ionicons `settings-outline`. Tab bar background `tabBar`, top border `border`, active `accent`, inactive `mutedText`, label 11px weight 600. Keep `HapticTab`.

**Acceptance:** two tabs with the right colors, and the app still boots.
**Commit:** `Remove Explore tab and restyle tab bar`

### Step 4: Week strip logic + component
**Files (new):** `apps/mobile/lib/week.ts`, `apps/mobile/components/workout/WeekStrip.tsx`.
- `getWeekStrip(performedOnDates: Date[], today: Date): { label: string; state: 'done' | 'today' | 'future' | 'missed' }[]`, which returns 7 items, Monday→Sunday, for the week that contains `today`, in local time. `done` = a workout that day (this wins over `today`). `today` = no workout yet today. Past days without a workout = `missed`. Labels: `M T W T F S S`. Pure function: no React, no `Date.now()` inside it.
- Also export `countSessionsThisWeek(performedOnDates, today): number`.
- `WeekStrip` props: `days` (the output above). Seven equal columns with gap 6. Box height 36, radius `sm`. `done` = `accent` fill, `today` = 2px `accent` border, `future` and `missed` = `surfaceMuted`. Label below in 11px/600: `accent` for today, `mutedText` otherwise. Each box gets `accessibilityLabel` "Trained", "Today" or "Not trained".

**Acceptance:** lint and tsc pass. In the report, include a small hand-traced example: today = Wed 2026-11-18 with workouts on Mon 16 and Tue 17 → `done, done, today, future, future, future, future`.
**Commit:** `Add week strip logic and component`

### Step 5: Home screen
**Files:** `apps/mobile/app/(tabs)/index.tsx`.
Rebuild the render with the primitives. Keep all the data and handlers (load, start, long-press delete, modal). Top to bottom, gap `xl`:
1. Date label (`label` variant, e.g. "WEDNESDAY 18 NOV") above the `hero` "Grind Notes".
2. `Button` primary `lg` "Start workout" with a play icon (Ionicons `play`); shows "Starting…" while loading.
3. `Card`: a row with the `label` "THIS WEEK" on the left and "{n} SESSIONS" (display 18px) on the right, then `WeekStrip`.
4. A "HISTORY" label (13px variant of `label`).
5. History rows: a `surface` row, radius `lg`, padding `md`, gap 14. On the left, a 52×52 `surfaceMuted` tile (radius `md`) with the day number (display 24) over the month (10px/600 `mutedText`, uppercase). In the middle, the title "Tuesday · 10:17 AM" (`body`) and the gym name (`caption`, `mutedText`). On the right, `chevron-forward` in `mutedText`. A selected row (after long-press) gets a 1px `destructive` border and shows the trash icon instead of the chevron, as today.
6. Delete confirmation modal: restyle it with `Card`, `Button` secondary (Cancel) and `Button` destructive (Delete).

**Acceptance:** matches the mockup's Home frame, minus the meso card and "See all". Start workout still navigates. Long-press → delete still works.
**Commit:** `Rebuild Home screen in Iron style`

### Step 6: Stepper card
**Files (new):** `apps/mobile/components/workout/Stepper.tsx`.
- Props: `label` (e.g. "REPS", "LOAD · KG"), `value: string`, `onChangeText`, `onDecrease`, `onIncrease`, `accessibilityNoun` (e.g. "reps", which gives "Decrease reps").
- A `Card` with centred contents: the `label` text aligned to the start, then the value as a `TextInput` styled with `Type.number` and centred (`decimal-pad`, placeholder "0" in `placeholder` color), then a row of two equal buttons (height 44, `surfaceMuted`, radius `md`, "−" / "+" at 22px).

**Acceptance:** lint and tsc pass (it's used in step 9).
**Commit:** `Add Stepper component`

### Step 7: RIR slider **(Opus)**
**Files (new):** `apps/mobile/components/workout/RirSlider.tsx`.
- Props: `value: number | null`, `onChange: (rir: number | null) => void`, `target?: number` (for mesocycles later: draws a 4px dot under that segment, `onAccent`-colored when selected, its RIR color otherwise).
- Track: `surface`, radius 14, padding 4, five equal segments, each 44 high. Labels `0 1 2 3 4+` in the display font at 20px, each colored with its `RirColors[i]`. The selected label is `onAccent` (dark).
- Highlight: an absolutely positioned view, width = segment width, radius 10, background = `RirColors[value]`. It slides to the selected segment with `withTiming(…, { duration: 240, easing: Easing.bezier(0.3, 0.7, 0.4, 1) })`. When `value` is `null` the highlight is hidden (opacity 0).
- Interaction (`react-native-gesture-handler` v2 `Gesture.Pan()` + `Gesture.Tap()` composed with `Gesture.Exclusive` or `Race`, with the root wrapped in `GestureHandlerRootView` in `_layout.tsx` if it isn't already):
  - Tap a segment → `onChange(i)`. Tapping the already-selected segment → `onChange(null)` (D3).
  - Dragging moves the highlight with the finger, snaps to the nearest segment on release, and calls `onChange` once on release. Haptic `selectionAsync()` each time the segment under the finger changes.
  - Get the segment width from `onLayout`. Run worklet → JS calls through `scheduleOnRN` / `runOnJS` (whichever the installed reanimated 4 / worklets version exports).
- Accessibility: each segment `accessibilityRole="button"`, with `accessibilityState={{ selected }}` and the label "RIR 2", plus "(this week's target)" when it matches `target`.

**Acceptance:** on the simulator, tap and drag both select, the highlight animates smoothly and changes color, tapping again clears, and nothing jitters at the segment edges.
**Commit:** `Add RIR slider component`

### Step 8: Set rows
**Files:** `apps/mobile/components/workout/SavedSetsTable.tsx` (restyle; keep the props API the same).
- A `Card` with padding `6 6 8`. Header row (height 30, horizontal padding 10): `SET KG REPS RIR NOTE` in the `label` style. Columns: 34 / 44 / 44 / 36 / flex.
- Each row: min height 40, 4px top margin, horizontal padding 10, radius 10. Background `rirTint(set.rir)`, or `surfaceMuted` when `rir` is null. Set number in `Type.cell` `mutedText`, then kg and reps in `Type.cell` `text` (load `null` → "—"). The RIR badge is 26×26, radius 7, `RirColors[min(rir,4)]` fill, `rirLabel(rir)` in display 17 `onAccent`. A `null` RIR gets "—" with no badge. Note: 13px, one line, ellipsized, `noteText` when present, "—" in `placeholder` otherwise.
- **The column order changes to SET · KG · REPS** (as in the mockup; today it's Set · Reps · Load).
- Remove the separate notes-icon cell. The whole row's `onPress` → `onPressNotes?.(set)` **if `onPressSet` is not provided or not in edit mode**. Keep the existing callback props. The screen decides what a tap means (see step 10). Selected row (`selectedSetId`): 1.5px `text` border.

**Acceptance:** rows show RIR tints and badges on both Log Set and Workout detail. Tapping a row on Workout detail still navigates to Log Set (that screen passes `onPressSet`).
**Commit:** `Restyle set rows with RIR colors`

### Step 9: Log Set layout
**Files:** `apps/mobile/app/workout/log-set.tsx`, `apps/mobile/components/workout/SetForm.tsx`.
- Wrap the screen in `Screen scroll`. Header row: back `IconButton` (`chevron-back`, `router.back()`) on the left, and a "SET {next}" pill on the right (1px `accent` border, `accent` text, 12px/700, letterSpacing 1.2, radius pill).
- Title: the exercise name (`title` variant). Subtitle (`caption` `mutedText`): "Muscle · Gym · Machine ▾". Tapping the machine name toggles the existing machine dropdown and add-machine UI (D6), restyled with `surface` / `surfaceMuted`, radius `md`, `accent` text for "+ Add machine".
- `SetForm` rewritten: two `Stepper`s side by side (gap `md`, flex 1 each), then the label row "RIR · REPS IN RESERVE", then `RirSlider`, then the action row. Props change: `rir` becomes `number | null` with `onChangeRir`; remove `onDecreaseRir`, `onIncreaseRir` and the note props (the note moves to step 10). Action row when not editing: a primary `Button` "Log set {next}" (flex 1, size `md`). When editing: "Update set {n}" primary, then `Button` destructive "Delete" and secondary "Cancel" in a row underneath.
- In `log-set.tsx`, `rir` state becomes `number | null`. Load steppers change by ±2.5 (D4). Clamp RIR to 4 when entering edit mode on an older set.
- Remove the stray `<Text>Selected set id: …</Text>` debug line.

**Acceptance:** matches the mockup's Log Set frame down to the action row (no pencil yet). Logging, editing and deleting a set all still work. Check them in the simulator and with `curl $API/sets?...` if useful.
**Commit:** `Rebuild Log Set form with steppers and RIR slider`

### Step 10: Note for the next set + row taps
**Files:** `apps/mobile/app/workout/log-set.tsx`, `apps/mobile/components/workout/SetForm.tsx`.
- Add an `IconButton` (56×56, radius `lg`, `create-outline` icon) to the left of "Log set". `badge` is shown when a pending note exists. `accessibilityLabel` "Add note to next set" or "Edit note for next set".
- State in `log-set.tsx`: `pendingNote: string` (committed) and `pendingNoteDraft: string` (the text being edited in the modal). Pressing the pencil copies `pendingNote` into the draft and opens `SetNotesModal`. Save commits the draft, Clear empties the draft, Close discards the draft. Reuse `SetNotesModal` as-is (it's already a controlled component). Keep this separate from the saved-set `useSetNotes` state.
- Below the action row, when `pendingNote` isn't empty: "Note for set {next}: <muted note>" (13px).
- `handleSaveSet` sends `note: pendingNote === '' ? null : pendingNote`, then clears `pendingNote` once the save succeeds.
- Row taps (D5): pass `onPressSet` so that in edit mode it switches the edit target (today's `handlePressSet`), and outside edit mode it calls `openNotes(set)`. Long-press is unchanged.
- Delete the old `note` / `setNote` state.

**Acceptance:** pencil → type → Save shows the lime dot and the preview line. Log set → the row shows the note and the dot disappears. Tapping a saved row opens its note. Long-press enters edit mode.
**Commit:** `Attach notes to the next set from Log Set`

### Step 11: Workout detail
**Files:** `apps/mobile/app/workout/[workoutId].tsx`.
- `Screen scroll`. Header: back `IconButton`, the workout date (`title` variant, e.g. "TUE 17 NOV") and the gym name (`caption` `mutedText`). Primary `Button` `md` "Add exercise".
- Each exercise section: `Card`, with the exercise name (display 22 uppercase), the machine label (`caption` `mutedText`), a chevron or the trash icon (long-press selection, as today), then `SavedSetsTable`. Selected section: 1px `destructive` border.
- Restyle the delete modal like Home's (step 5). Leave the logic alone.

**Commit:** `Restyle workout detail screen`

### Step 12: Pick flows + settings
**Files:** `app/workout/muscle-groups.tsx`, `exercises.tsx`, `add-exercise.tsx`, `components/workout/NewExerciseForm.tsx`, `app/(tabs)/settings.tsx`, `app/settings/manage-gyms.tsx`.
- The same patterns everywhere: `Screen`, a `title` heading, list rows styled like Home's history rows (a `surface` row, radius `lg`, padding `md`, `body` text, chevron), `Button` for actions, inputs with `surface` background, 1px `border` border, radius `md`, `text` color and `placeholder` placeholder, and modals like step 5.
- `manage-gyms.tsx` is about 1,160 lines. **Restyle only**: swap colors, radii and buttons, and don't restructure it. If the diff gets above roughly 400 changed lines, split it into "12a pick flows" and "12b settings" and report back.

**Commit:** `Restyle exercise pickers and settings` (or two commits if split)

### Step 13: Remove the theme shim
**Files:** `constants/theme.ts`, `hooks/theme-context.tsx`, `hooks/use-color-scheme*.ts`, `hooks/use-theme-color.ts`, `components/themed-text.tsx`, `components/themed-view.tsx`, `app/_layout.tsx`, every file that still uses `Colors[colorScheme]`.
- `Colors` becomes the flat Iron palette (`export const Colors = iron`). Replace every `const colors = Colors[colorScheme]` with `Colors` directly, and delete the color-scheme hooks, the `ThemeProvider` and the themed-* components. Drop `@react-native-async-storage/async-storage` from the theme code only (`lib/gyms.ts` still uses it).
- Delete now-unused keys (`tint`, `tabIconDefault`, `tabIconSelected`, `icon`, `noteIndicator`), but only after `grep` shows nothing uses them.

**Acceptance:** `npx tsc --noEmit` shows **0** errors. Lint passes. The app looks the same as after step 12.
**Commit:** `Remove light/dark theme shim`

---

## Out of scope (separate features)
- Mesocycles (the meso card, week/target chips, slider pre-selecting the target). `RirSlider`'s `target` prop is the only hook for it here.
- "Last time · +2.5 kg" on Log Set (needs a new endpoint).
- Set count in "This week", the "See all" link, the Progress tab.
