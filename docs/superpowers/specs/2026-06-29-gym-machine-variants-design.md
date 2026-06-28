# Gym Machine Variants Design

## Goal

Implement gym-specific machine tracking so workout history can distinguish two similar machines at the same physical gym.

The first version keeps machine details intentionally simple: each machine variant has one user-entered `label`, such as `Pulldown 1`, `near mirror`, or `Technogym`.

## Decisions

- A gym means one physical location, not a chain brand.
- The seeded/default gym is `City Fitness Newmarket`.
- Generic exercises stay generic, for example `Lat Pulldown`.
- Gym-specific machines are represented as exercise variants tied to one generic exercise and one gym.
- Sets should point to `exercise_variant_id` so future analytics can target the exact machine used.
- The selected default gym is stored locally on the device with `AsyncStorage`.
- Existing app styling remains the visual source of truth.

## Data Model

Add a `gyms` table:

- `id`
- `name`

Add an `exercise_variants` table:

- `id`
- `exercise_id`
- `gym_id`
- `label`

Add `gym_id` to `workouts`.

Add `exercise_variant_id` to `sets`.

Existing history should be backfilled to `City Fitness Newmarket`. For each existing generic exercise with saved sets, create or reuse a `Default machine` variant for that gym and link existing sets to it.

## API Design

Add gym routes:

- `GET /gyms`: list gyms.
- `POST /gyms`: create a gym from `{ name }`.

Add exercise variant routes:

- `GET /exercise-variants?exerciseId=1&gymId=1`: list machine variants for one generic exercise at one gym.
- `POST /exercise-variants`: create a variant from `{ exerciseId, gymId, label }`.

Update workout routes:

- `POST /workouts`: accept optional `{ gymId }`. If omitted, use the seeded default gym for compatibility.
- `GET /workouts`: include `gymId` and `gymName`.
- `GET /workouts/:id/sets`: include `gymId`, `gymName`, `exerciseVariantId`, and `exerciseVariantLabel`.

Update set routes:

- `POST /sets`: save `exerciseVariantId` with each new set.
- `PATCH /sets/:id`: preserve or update `exerciseVariantId`.
- `GET /sets?workoutId=1&exerciseId=1`: keep the existing query shape and return variant fields for display/editing.

The app can keep passing `exerciseId` through Expo Router for the generic exercise flow. The selected variant is loaded and saved inside `log-set`.

## Mobile Flow

### Home

Home loads gyms and the locally stored default gym ID. Starting a workout sends the chosen `gymId` to `POST /workouts`.

Previous workout cards can show a small gym line so users can see where the workout happened.

### Settings

Settings keeps the existing dark mode control and adds a gym section.

The first version can be minimal:

- show the selected default gym
- allow adding another gym by name
- store the selected default gym ID in `AsyncStorage`

### Log Set

For a generic exercise such as `Lat Pulldown`, `log-set` shows:

```text
Lat Pulldown
City Fitness Newmarket

Machine
[ Pulldown 1 v ]

+ Add machine
```

If the user adds a machine, the form asks only for:

```text
Machine label
```

After a machine is created, it becomes selected automatically. Saving a set includes the selected `exerciseVariantId`.

If no variants exist yet for the selected exercise and gym, the screen should prompt the user to add a machine before saving a set.

### Workout Detail

Workout detail groups sets by generic exercise plus machine variant, not just generic exercise.

Example:

```text
Lat Pulldown - Pulldown 1
Lat Pulldown - near mirror
```

This keeps two similar machines in the same gym separate in the workout history.

## Error Handling

- API routes return `400` for missing or non-numeric IDs.
- Creating a gym requires a non-empty name.
- Creating an exercise variant requires valid `exerciseId`, `gymId`, and a non-empty label.
- `log-set` should block saving if no machine variant is selected.
- Mobile screens should reuse the existing simple error text pattern.

## Testing And Verification

Add focused backend coverage or a lightweight API verification script for:

- migration/backfill creates the default gym and default variants
- creating a gym
- creating and listing exercise variants by `exerciseId` plus `gymId`
- creating a workout with `gymId`
- creating a set with `exerciseVariantId`
- workout detail returns variant display fields

Run:

- `npm run db:migrate -w apps/api`
- `npm run db:seed -w apps/api`
- `npm run lint -w apps/mobile`

Smoke test in the iOS simulator:

1. Start a workout.
2. Choose an exercise.
3. Add/select a machine variant.
4. Save a set.
5. Open workout detail and confirm the machine label appears.

## Out Of Scope

- Structured machine fields such as brand, side, cable stack number, or location fields.
- Analytics charts.
- Multi-gym workout sessions.
- Gym chain modelling.
