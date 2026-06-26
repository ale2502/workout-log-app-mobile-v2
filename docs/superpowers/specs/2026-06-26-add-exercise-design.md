# Add Exercise Design

## Goal

Add a custom exercise flow inside the existing workout flow. A user can create a reusable catalogue exercise, assign it to an existing muscle group, then continue directly to logging sets for the new exercise.

## Scope

This version only supports existing muscle groups. Users cannot create a new muscle group yet.

The screen must use the existing workout-flow visual style as the source of truth:

- White screen background
- `24` screen padding
- Existing title scale and weight
- Existing grey bordered inputs and rows
- Existing dark primary action button
- Existing placeholder treatment
- Existing error text treatment
- `borderRadius: 8` where current workout screens use it

No new colour palette, font treatment, or unrelated visual style should be introduced.

## Backend

Add `GET /exercises/muscle-groups`.

The route calls `getAllMuscleGroups()` from `apps/api/server/db/exercises.ts` and returns a sorted `string[]`, for example:

```json
["Arms", "Back", "Chest", "Legs"]
```

The existing `POST /exercises` route remains the creation endpoint. It validates that `name` and `muscleGroup` are non-empty strings, creates the exercise with `addNewExercise()`, and returns the created `Exercise` with `201 Created`.

## Mobile Data Flow

`apps/mobile/app/workout/add-exercise.tsx` reads route params:

- `workoutId`
- `muscleGroup`

The screen owns:

- `exerciseName`
- `selectedMuscleGroup`
- `muscleGroupOptions`
- `isLoading`
- `isSaving`
- `error`

When the screen opens, it fetches `${EXPO_PUBLIC_API_URL}/exercises/muscle-groups`. The route `muscleGroup` is preselected. If the fetched options do not include the route group, the route group should still be available as a fallback option.

On submit, the screen trims the exercise name, validates that a name and selected group exist, sends:

```ts
{ name: exerciseName.trim(), muscleGroup: selectedMuscleGroup }
```

to `POST /exercises`, then navigates to `/workout/log-set` with:

- `workoutId`
- selected `muscleGroup`
- returned `exerciseId`

## Component Design

`NewExerciseForm` stays controlled and reusable. It receives values and callbacks from `AddExerciseScreen`; it does not own API calls or navigation.

The form renders:

- Exercise name input
- Muscle group dropdown field
- Inline dropdown menu when open
- Create exercise button
- Saving disabled state

The dropdown behavior:

- Closed state looks like one normal field row showing the selected group and a down chevron.
- Open state connects one menu directly below the field.
- The options are compact rows inside one shared bordered menu.
- Options must not look like separate exercise buttons stacked under the field.
- Selecting an option updates the selected group and closes the menu.

## Error Handling

If muscle groups fail to load, show a simple error message and keep the route muscle group available so the user is not blocked unnecessarily.

If create fails, show an error message and keep the form values intact.

If the exercise name is blank after trimming, show a validation error and do not call the API.

## Verification

Run the relevant checks:

- `npm run lint -w apps/mobile`
- API route smoke test for `GET /exercises/muscle-groups`
- API route smoke test for `POST /exercises`

Manual flow:

1. Start the API.
2. Start Expo.
3. Navigate to exercise selection.
4. Open add exercise.
5. Confirm the route muscle group is preselected.
6. Open the dropdown and select another existing group.
7. Create an exercise.
8. Confirm the app navigates to `log-set` for the created exercise.
