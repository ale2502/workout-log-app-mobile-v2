# Iron Redesign Design

## Goal

Restyle the whole mobile app in the "Iron" direction: dark, athletic, with big numbers that are easy to read at arm's length in a gym. At the same time, build a small design system (tokens + reusable components) so screens stop hard-coding colors, spacing and radii.

Mockup canvas: https://claude.ai/artifact/356kHjgxGi5myWDMkC9rzQ. The frame **"Chosen · Iron + week strip, RIR slider, set notes"** is the source of truth. Press Play to try it, and use Tweaks → `mesoWeek` to preview each mesocycle week.

## Decisions

- Direction A ("Iron") was chosen over B ("Logbook") and C ("Native"). Three features were borrowed from them: B's week strip, C's segmented RIR picker, and B's note column in the set table.
- Dark only to start: background `#0D0D0F`, surfaces `#17171B` / `#212127`, border `#2A2A31`, text `#F4F4F5`, muted `#9A9AA3`.
- Fonts: Barlow Condensed (600/700) for headings and numbers, and Inter (or the system font) for body text.
- Lime accent `#C8F031` is used **only for primary actions** (Start workout, Log set). Effort is shown by the RIR colors instead.
- RIR color scale, from hot (hard) to cool (easy):

  | RIR | 0 | 1 | 2 | 3 | 4+ |
  |---|---|---|---|---|---|
  | Color | `#F87171` | `#FB923C` | `#FACC15` | `#4ADE80` | `#60A5FA` |

- Set rows get about a 12% tint of their RIR color plus a solid RIR badge. The number is always visible, so color is never the only signal (color-blind safe).
- The RIR picker is a 5-segment slider with a sliding highlight that takes the selected RIR's color. It works by tapping and by dragging (`react-native-gesture-handler` + `react-native-reanimated`, both already installed).
- Home: a week strip (Mon–Sun squares, filled = trained, outlined = today) is worked out on the phone from the workouts already fetched. It replaces the stats panel.
- Log Set: the pencil button next to "Log set" attaches a note to the *next* set, using `SetNotesModal`. It replaces the always-visible Notes input in `SetForm`. A lime dot on the pencil shows a note is attached. Tapping a saved row edits its note (existing `useSetNotes` flow).
- Remove the leftover Expo "Explore" tab. Fix the status bar, which currently shows dark text on the dark background.
- The "Last time · +2.5 kg" line in the mockup needs a new endpoint. It's a separate feature, built after the redesign.

## Implementation Order

1. **Tokens + font:** new palette in `apps/mobile/constants/theme.ts` (including `rir` colors), and load Barlow Condensed.
2. **Components** in `components/ui` / `components/workout`: `Button`, `Card`, `Screen`, `Stepper`, `RirSlider`, `WeekStrip`, `SetRow`.
3. **Screens one at a time:** Home and Log Set first, then workout detail, muscle groups, exercises, add exercise, settings / manage gyms. Remove Explore and fix the status bar along the way.

Verify each step in the simulator and commit it on its own.

## Later: Mesocycles (after the redesign)

- 4 training weeks + 1 deload. The target RIR drops each week: W1 3 → W2 2 → W3 1 → W4 0, deload 4+ (this matches the RIR color scale).
- Home: a meso card with "Week 3 of 4", a target-RIR label and a 5-segment bar. Log Set: week and target labels, a target dot on the RIR slider, and the slider pre-selects the target.
- Data: a `mesocycles` table (`start_date`, `training_weeks`, `deload_weeks`, `ended_at`), optionally `workouts.mesocycle_id`. The current week is **calculated** from `start_date`, not stored, using a pure `getMesoWeek()` in `packages/shared`.
- Open questions: does a week start on Monday or on the meso start day? Do missed weeks pause the cycle? Is the target RIR fixed or editable per meso?
