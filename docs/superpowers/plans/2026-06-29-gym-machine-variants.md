# Gym Machine Variants Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add gym-specific machine variants so every newly logged set can be tied to the exact machine used at a physical gym.

**Architecture:** Add `gyms` and `exercise_variants` as first-class API resources, then attach `workouts` to a gym and `sets` to an exercise variant. Keep the current Expo Router flow passing `workoutId` and generic `exerciseId`; `log-set` loads the workout gym and machine variants internally.

**Tech Stack:** Express, Knex, SQLite, TypeScript, Expo Router, React Native, AsyncStorage, Node test runner or lightweight TS verification scripts.

---

## File Structure

- Create `apps/api/server/db/migrations/20260629000000_add_gyms_and_exercise_variants.js`: creates `gyms`, `exercise_variants`, `workouts.gym_id`, and `sets.exercise_variant_id`, with a migration-time backfill.
- Create `apps/api/server/db/gyms.ts`: DB functions for listing, creating, and getting the default gym.
- Create `apps/api/server/db/exercise-variants.ts`: DB functions for listing and creating variants.
- Create `apps/api/server/models/gym.ts`: gym API types.
- Create `apps/api/server/models/exercise-variant.ts`: exercise variant API types.
- Modify `apps/api/server/models/workout.ts`: add `gymId` and `gymName` to returned workouts; allow `gymId` on create.
- Modify `apps/api/server/models/set.ts`: add `exerciseVariantId`, `exerciseVariantLabel`, `gymId`, and `gymName` where returned by display queries.
- Create `apps/api/server/routes/gyms.ts`: `GET /gyms`, `POST /gyms`.
- Create `apps/api/server/routes/exercise-variants.ts`: `GET /exercise-variants`, `POST /exercise-variants`.
- Modify `apps/api/server/routes/index.ts`: mount the new routers.
- Modify `apps/api/server/db/workouts.ts` and `apps/api/server/routes/workouts.ts`: accept and return gym fields.
- Modify `apps/api/server/db/sets.ts` and `apps/api/server/routes/sets.ts`: save and return variant fields.
- Modify `apps/api/server/db/seeds/01_exercises.js`, `02_workouts.js`, and `03_sets.js`: keep seed data compatible with the new schema.
- Create `apps/api/server/scripts/verify-gym-machine-variants.ts`: smoke-test the backend route contract until a formal test runner exists.
- Create `apps/mobile/lib/gyms.ts`: `AsyncStorage` helpers for the selected default gym.
- Modify `apps/mobile/app/(tabs)/index.tsx`: load gyms/default gym, send `gymId` when starting workouts, display gym on workout cards.
- Modify `apps/mobile/app/(tabs)/settings.tsx`: display selected gym, create a gym, and save default gym locally.
- Modify `apps/mobile/app/workout/log-set.tsx`: load workout gym, list/create/select exercise variants, require variant before save/update.
- Modify `apps/mobile/app/workout/[workoutId].tsx`: group by generic exercise plus variant label and show gym context.

## Task 1: Add Backend Type Models

**Files:**
- Create: `apps/api/server/models/gym.ts`
- Create: `apps/api/server/models/exercise-variant.ts`
- Modify: `apps/api/server/models/workout.ts`
- Modify: `apps/api/server/models/set.ts`

- [ ] **Step 1: Add gym model**

Create `apps/api/server/models/gym.ts`:

```ts
export interface GymData {
  name: string;
}

export interface Gym extends GymData {
  id: number;
}
```

- [ ] **Step 2: Add exercise variant model**

Create `apps/api/server/models/exercise-variant.ts`:

```ts
export interface ExerciseVariantData {
  exerciseId: number;
  gymId: number;
  label: string;
}

export interface ExerciseVariant extends ExerciseVariantData {
  id: number;
}
```

- [ ] **Step 3: Update workout model**

Replace `apps/api/server/models/workout.ts` with:

```ts
export interface WorkoutData {
  performedOn?: string;
  gymId?: number;
}

export interface Workout {
  id: number;
  performedOn: string;
  createdAt: string;
  gymId: number;
  gymName: string;
}
```

- [ ] **Step 4: Update set model**

Replace `apps/api/server/models/set.ts` with:

```ts
export interface SetData {
  exerciseId: number;
  workoutId: number;
  exerciseVariantId: number;
  setNumber: number;
  reps: number;
  load: number | null;
  rir: number | null;
  note: string | null;
}

export interface Set extends SetData {
  id: number;
}

export interface SetDisplay {
  id: number;
  exerciseId: number;
  workoutId: number;
  exerciseVariantId: number;
  performedOn: string;
  gymId: number;
  gymName: string;
  exerciseName: string;
  exerciseVariantLabel: string;
  setNumber: number;
  reps: number;
  load: number | null;
  rir: number | null;
  note: string | null;
}
```

- [ ] **Step 5: Run TypeScript check by starting API once**

Run:

```bash
npm run start -w apps/api
```

Expected: the command starts or reaches the next known missing DB/schema errors. Stop the command with `Ctrl+C` after confirming there are no syntax errors in the new model files.

## Task 2: Add Migration And Seed-Compatible Backfill

**Files:**
- Create: `apps/api/server/db/migrations/20260629000000_add_gyms_and_exercise_variants.js`
- Modify: `apps/api/server/db/seeds/01_exercises.js`
- Modify: `apps/api/server/db/seeds/02_workouts.js`
- Modify: `apps/api/server/db/seeds/03_sets.js`

- [ ] **Step 1: Write the migration**

Create `apps/api/server/db/migrations/20260629000000_add_gyms_and_exercise_variants.js`:

```js
const DEFAULT_GYM_NAME = 'City Fitness Newmarket';
const DEFAULT_VARIANT_LABEL = 'Default machine';

export const config = { transaction: false };

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async function (knex) {
  await knex.raw('PRAGMA foreign_keys = OFF');

  await knex.schema.createTable('gyms', (table) => {
    table.increments('id');
    table.string('name').notNullable().unique();
  });

  await knex.schema.createTable('exercise_variants', (table) => {
    table.increments('id');
    table.integer('exercise_id').references('exercises.id').notNullable();
    table.integer('gym_id').references('gyms.id').notNullable();
    table.string('label').notNullable();
    table.unique(['exercise_id', 'gym_id', 'label']);
  });

  await knex('gyms').insert({ id: 1, name: DEFAULT_GYM_NAME });

  await knex.schema.alterTable('workouts', (table) => {
    table.integer('gym_id').references('gyms.id');
  });

  await knex.schema.alterTable('sets', (table) => {
    table.integer('exercise_variant_id').references('exercise_variants.id');
  });

  await knex('workouts').update({ gym_id: 1 });

  const exerciseRows = await knex('sets')
    .distinct('exercise_id as exerciseId')
    .whereNotNull('exercise_id');

  for (const row of exerciseRows) {
    const [variant] = await knex('exercise_variants')
      .insert({
        exercise_id: row.exerciseId,
        gym_id: 1,
        label: DEFAULT_VARIANT_LABEL,
      })
      .returning(['id']);

    await knex('sets')
      .where('exercise_id', row.exerciseId)
      .update({ exercise_variant_id: variant.id });
  }

  await knex.raw('PRAGMA foreign_keys = ON');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = async function (knex) {
  await knex.raw('PRAGMA foreign_keys = OFF');

  await knex.schema.alterTable('sets', (table) => {
    table.dropColumn('exercise_variant_id');
  });

  await knex.schema.alterTable('workouts', (table) => {
    table.dropColumn('gym_id');
  });

  await knex.schema.dropTable('exercise_variants');
  await knex.schema.dropTable('gyms');

  await knex.raw('PRAGMA foreign_keys = ON');
};
```

Important implementation note: SQLite cannot add a `NOT NULL` column to a populated table without a default, and Knex rebuilds SQLite tables during `alterTable`. Keep the new foreign-key columns nullable at the schema level in this migration, run this migration outside a transaction, temporarily disable foreign-key checks for the rebuild, and enforce required values in the API.

- [ ] **Step 2: Update seed cleanup order**

In `apps/api/server/db/seeds/01_exercises.js`, replace the cleanup block with:

```js
  await knex('sets').del();
  await knex('exercise_variants').del();
  await knex('workouts').del();
  await knex('gyms').del();
  await knex('exercises').del();
```

Then insert the default gym before exercises:

```js
  await knex('gyms').insert([
    { id: 1, name: 'City Fitness Newmarket' },
  ]);
```

- [ ] **Step 3: Update workout seed rows**

In `apps/api/server/db/seeds/02_workouts.js`, add `gym_id: 1` to every workout row:

```js
{ id: 1, performed_on: '2026-04-20', gym_id: 1 }
```

- [ ] **Step 4: Update set seed rows**

Create default exercise variants before inserting sets. The simplest approach is to add this before the `sets` insert in `03_sets.js`:

```js
  await knex('exercise_variants').insert([
    { id: 1, exercise_id: 1, gym_id: 1, label: 'Default machine' },
  ]);
```

Then add `exercise_variant_id: 1` to each seeded set.

- [ ] **Step 5: Verify migration and seed**

Run:

```bash
npm run db:migrate -w apps/api
npm run db:seed -w apps/api
```

Expected: both commands exit successfully.

## Task 3: Add Gym DB And Routes

**Files:**
- Create: `apps/api/server/db/gyms.ts`
- Create: `apps/api/server/routes/gyms.ts`
- Modify: `apps/api/server/routes/index.ts`

- [ ] **Step 1: Write DB functions**

Create `apps/api/server/db/gyms.ts`:

```ts
import db from './connection.ts';
import { Gym, GymData } from '../models/gym.ts';

const columns = ['id', 'name'];
const DEFAULT_GYM_NAME = 'City Fitness Newmarket';

export async function getGyms(): Promise<Gym[]> {
  return db('gyms').orderBy('name', 'asc').select(columns);
}

export async function getDefaultGym(): Promise<Gym> {
  const gym = await db('gyms').where('name', DEFAULT_GYM_NAME).first(columns);

  if (gym) {
    return gym;
  }

  const [createdGym] = await db('gyms')
    .insert({ name: DEFAULT_GYM_NAME })
    .returning(columns);

  return createdGym;
}

export async function addGym(newGym: GymData): Promise<Gym> {
  const [gym] = await db('gyms')
    .insert({ name: newGym.name.trim() })
    .returning(columns);

  return gym;
}
```

- [ ] **Step 2: Write gym routes**

Create `apps/api/server/routes/gyms.ts`:

```ts
import { Router } from 'express';
import * as db from '../db/gyms.ts';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const gyms = await db.getGyms();
    res.json(gyms);
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

router.post('/', async (req, res) => {
  try {
    const name = req.body.name;

    if (typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    const gym = await db.addGym({ name });
    res.status(201).json(gym);
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

export default router;
```

- [ ] **Step 3: Mount gym router**

In `apps/api/server/routes/index.ts`, add:

```ts
import gymsRouter from './gyms';
```

and:

```ts
router.use('/gyms', gymsRouter);
```

- [ ] **Step 4: Verify manually**

Run API:

```bash
npm run dev:api
```

In another terminal:

```bash
curl http://localhost:3001/gyms
curl -X POST http://localhost:3001/gyms \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test Gym"}'
```

Expected: `GET /gyms` returns `City Fitness Newmarket`; `POST /gyms` returns the created gym with an `id`.

## Task 4: Add Exercise Variant DB And Routes

**Files:**
- Create: `apps/api/server/db/exercise-variants.ts`
- Create: `apps/api/server/routes/exercise-variants.ts`
- Modify: `apps/api/server/routes/index.ts`

- [ ] **Step 1: Write DB functions**

Create `apps/api/server/db/exercise-variants.ts`:

```ts
import db from './connection.ts';
import {
  ExerciseVariant,
  ExerciseVariantData,
} from '../models/exercise-variant.ts';

const columns = [
  'id',
  'exercise_id as exerciseId',
  'gym_id as gymId',
  'label',
];

export async function getExerciseVariants(
  exerciseId: number,
  gymId: number,
): Promise<ExerciseVariant[]> {
  return db('exercise_variants')
    .where('exercise_id', exerciseId)
    .where('gym_id', gymId)
    .orderBy('label', 'asc')
    .select(columns);
}

export async function addExerciseVariant(
  newVariant: ExerciseVariantData,
): Promise<ExerciseVariant> {
  const [variant] = await db('exercise_variants')
    .insert({
      exercise_id: newVariant.exerciseId,
      gym_id: newVariant.gymId,
      label: newVariant.label.trim(),
    })
    .returning(columns);

  return variant;
}
```

- [ ] **Step 2: Write variant routes**

Create `apps/api/server/routes/exercise-variants.ts`:

```ts
import { Router } from 'express';
import * as db from '../db/exercise-variants.ts';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const exerciseId = Number(req.query.exerciseId);
    const gymId = Number(req.query.gymId);

    if (Number.isNaN(exerciseId) || Number.isNaN(gymId)) {
      res.status(400).json({ error: 'exerciseId and gymId must be numbers' });
      return;
    }

    const variants = await db.getExerciseVariants(exerciseId, gymId);
    res.json(variants);
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

router.post('/', async (req, res) => {
  try {
    const exerciseId = Number(req.body.exerciseId);
    const gymId = Number(req.body.gymId);
    const label = req.body.label;

    if (
      Number.isNaN(exerciseId) ||
      Number.isNaN(gymId) ||
      typeof label !== 'string' ||
      label.trim() === ''
    ) {
      res
        .status(400)
        .json({ error: 'exerciseId, gymId and label are required' });
      return;
    }

    const variant = await db.addExerciseVariant({ exerciseId, gymId, label });
    res.status(201).json(variant);
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

export default router;
```

- [ ] **Step 3: Mount variant router**

In `apps/api/server/routes/index.ts`, add:

```ts
import exerciseVariantsRouter from './exercise-variants';
```

and:

```ts
router.use('/exercise-variants', exerciseVariantsRouter);
```

- [ ] **Step 4: Verify manually**

Run:

```bash
curl "http://localhost:3001/exercise-variants?exerciseId=1&gymId=1"
curl -X POST http://localhost:3001/exercise-variants \
  -H 'Content-Type: application/json' \
  -d '{"exerciseId":1,"gymId":1,"label":"Pulldown 1"}'
```

Expected: list returns seeded/default variants; create returns a variant with `exerciseId`, `gymId`, and `label`.

## Task 5: Update Workout DB And Routes

**Files:**
- Modify: `apps/api/server/db/workouts.ts`
- Modify: `apps/api/server/routes/workouts.ts`

- [ ] **Step 1: Update workout DB columns and insert**

Replace `apps/api/server/db/workouts.ts` with:

```ts
import db from './connection';
import { Workout, WorkoutData } from '../models/workout';
import { getDefaultGym } from './gyms.ts';

const columns = [
  'workouts.id as id',
  'workouts.performed_on as performedOn',
  'workouts.created_at as createdAt',
  'workouts.gym_id as gymId',
  'gyms.name as gymName',
];

export async function addWorkout(newWorkout: WorkoutData = {}): Promise<Workout> {
  const gymId = newWorkout.gymId ?? (await getDefaultGym()).id;

  const insertData: { gym_id: number; performed_on?: string } = {
    gym_id: gymId,
  };

  if (newWorkout.performedOn !== undefined) {
    insertData.performed_on = newWorkout.performedOn;
  }

  const [newWorkoutRow] = await db('workouts').insert(insertData).returning('id');

  return getWorkoutById(newWorkoutRow.id);
}

export async function getWorkoutById(id: number): Promise<Workout> {
  return db('workouts')
    .join('gyms', 'workouts.gym_id', 'gyms.id')
    .where('workouts.id', id)
    .first(columns);
}

export async function getWorkouts(): Promise<Workout[]> {
  return db('workouts')
    .join('gyms', 'workouts.gym_id', 'gyms.id')
    .orderBy('created_at', 'desc')
    .select(columns);
}

export async function deleteWorkoutById(id: number): Promise<number> {
  await db('sets').where('workout_id', id).delete();
  return db('workouts').where('id', id).delete();
}
```

- [ ] **Step 2: Update workout route POST**

In `apps/api/server/routes/workouts.ts`, replace the POST handler body with:

```ts
  try {
    const workout = await db.addWorkout(req.body);
    res.status(201).json(workout);
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
```

- [ ] **Step 3: Add single workout route**

Add this before `router.get('/:id/sets', ...)`:

```ts
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      res.status(400).json({ error: 'workout id must be a number' });
      return;
    }

    const workout = await db.getWorkoutById(id);

    if (!workout) {
      res.status(404).json({ error: 'Workout not found' });
      return;
    }

    res.json(workout);
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});
```

- [ ] **Step 4: Verify workout routes**

Run:

```bash
curl http://localhost:3001/workouts
curl -X POST http://localhost:3001/workouts \
  -H 'Content-Type: application/json' \
  -d '{"gymId":1}'
```

Expected: both responses include `gymId` and `gymName`.

## Task 6: Update Set DB And Routes For Variants

**Files:**
- Modify: `apps/api/server/db/sets.ts`
- Modify: `apps/api/server/routes/sets.ts`

- [ ] **Step 1: Update display columns**

In `apps/api/server/db/sets.ts`, replace `columnsSetDisplay` with:

```ts
const columnsSetDisplay = [
  'sets.id as id',
  'sets.exercise_id as exerciseId',
  'sets.workout_id as workoutId',
  'sets.exercise_variant_id as exerciseVariantId',
  'workouts.performed_on as performedOn',
  'workouts.gym_id as gymId',
  'gyms.name as gymName',
  'exercises.name as exerciseName',
  'exercise_variants.label as exerciseVariantLabel',
  'set_number as setNumber',
  'reps',
  'load',
  'rir',
  'note',
];
```

- [ ] **Step 2: Update new-set columns**

Replace `columnsNewSet` with:

```ts
const columnsNewSet = [
  'id',
  'exercise_id as exerciseId',
  'workout_id as workoutId',
  'exercise_variant_id as exerciseVariantId',
  'set_number as setNumber',
  'reps',
  'load',
  'rir',
  'note',
];
```

- [ ] **Step 3: Insert and update `exercise_variant_id`**

In `addSet`, add:

```ts
exercise_variant_id: newSet.exerciseVariantId,
```

In `updateSetById`, add:

```ts
exercise_variant_id: updatedSet.exerciseVariantId,
```

- [ ] **Step 4: Join gyms and variants in display queries**

In `getSetsByWorkoutAndExercise` and `getSetsByWorkoutId`, add joins:

```ts
.join('exercise_variants', 'sets.exercise_variant_id', 'exercise_variants.id')
.join('gyms', 'workouts.gym_id', 'gyms.id')
```

Place them after the existing `workouts` join.

- [ ] **Step 5: Resequence by exercise and variant**

In `deleteSetById`, add:

```ts
.where('exercise_variant_id', setToDelete.exercise_variant_id)
```

to the `remainingSets` query so deleting one machine variant does not resequence another machine variant.

- [ ] **Step 6: Validate `exerciseVariantId` in set routes**

In `apps/api/server/routes/sets.ts`, update POST validation to require `exerciseVariantId`:

```ts
if (
  newSet.workoutId === undefined ||
  newSet.exerciseId === undefined ||
  newSet.exerciseVariantId === undefined ||
  newSet.setNumber === undefined ||
  newSet.reps === undefined
) {
  res.status(400).json({
    error:
      'workoutId, exerciseId, exerciseVariantId, setNumber and reps are required',
  });
  return;
}
```

- [ ] **Step 7: Verify set routes**

Run:

```bash
curl "http://localhost:3001/sets?workoutId=1&exerciseId=1"
curl -X POST http://localhost:3001/sets \
  -H 'Content-Type: application/json' \
  -d '{"workoutId":1,"exerciseId":1,"exerciseVariantId":1,"setNumber":4,"reps":8,"load":20,"rir":2,"note":null}'
```

Expected: returned set includes `exerciseVariantId`; list response includes `exerciseVariantLabel` and `gymName`.

## Task 7: Add Backend Verification Script

**Files:**
- Create: `apps/api/server/scripts/verify-gym-machine-variants.ts`
- Modify: `apps/api/package.json`

- [ ] **Step 1: Create verification script**

Create `apps/api/server/scripts/verify-gym-machine-variants.ts`:

```ts
const API_URL = process.env.API_URL ?? 'http://localhost:3001';

async function request(path: string, options?: RequestInit) {
  const response = await fetch(`${API_URL}${path}`, options);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${path} failed with ${response.status}: ${body}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function main() {
  const gyms = await request('/gyms');
  const defaultGym = gyms.find(
    (gym: { name: string }) => gym.name === 'City Fitness Newmarket',
  );

  if (!defaultGym) {
    throw new Error('Default gym was not returned by GET /gyms');
  }

  const variant = await request('/exercise-variants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      exerciseId: 1,
      gymId: defaultGym.id,
      label: `Verification ${Date.now()}`,
    }),
  });

  const workout = await request('/workouts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gymId: defaultGym.id }),
  });

  const set = await request('/sets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workoutId: workout.id,
      exerciseId: 1,
      exerciseVariantId: variant.id,
      setNumber: 1,
      reps: 10,
      load: 50,
      rir: 2,
      note: null,
    }),
  });

  if (set.exerciseVariantId !== variant.id) {
    throw new Error('Created set did not return exerciseVariantId');
  }

  const detailSets = await request(`/workouts/${workout.id}/sets`);
  const detailSet = detailSets.find((row: { id: number }) => row.id === set.id);

  if (detailSet.exerciseVariantLabel !== variant.label) {
    throw new Error('Workout detail did not return variant label');
  }

  console.log('Gym machine variant verification passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

- [ ] **Step 2: Add script**

In `apps/api/package.json`, add:

```json
"verify:gym-machines": "tsx server/scripts/verify-gym-machine-variants.ts"
```

- [ ] **Step 3: Run verification**

With the API running, run:

```bash
npm run verify:gym-machines -w apps/api
```

Expected: `Gym machine variant verification passed`.

## Task 8: Add Mobile Gym Storage Helper

**Files:**
- Create: `apps/mobile/lib/gyms.ts`

- [ ] **Step 1: Create helper**

Create `apps/mobile/lib/gyms.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_GYM_ID_KEY = 'defaultGymId';

export async function getStoredDefaultGymId(): Promise<number | null> {
  const value = await AsyncStorage.getItem(DEFAULT_GYM_ID_KEY);

  if (value === null) {
    return null;
  }

  const parsedValue = Number(value);
  return Number.isNaN(parsedValue) ? null : parsedValue;
}

export async function storeDefaultGymId(gymId: number): Promise<void> {
  await AsyncStorage.setItem(DEFAULT_GYM_ID_KEY, String(gymId));
}
```

- [ ] **Step 2: Verify import path**

Run:

```bash
npm run lint -w apps/mobile
```

Expected: lint exits without a module-resolution error for `@react-native-async-storage/async-storage`.

## Task 9: Wire Home To Default Gym

**Files:**
- Modify: `apps/mobile/app/(tabs)/index.tsx`

- [ ] **Step 1: Add gym type and state**

Add near the existing `Workout` interface:

```ts
interface Gym {
  id: number;
  name: string;
}
```

Update `Workout`:

```ts
interface Workout {
  id: number;
  performedOn: string;
  createdAt: string;
  gymId: number;
  gymName: string;
}
```

Add state:

```ts
const [gyms, setGyms] = useState<Gym[]>([]);
const [defaultGymId, setDefaultGymId] = useState<number | null>(null);
```

- [ ] **Step 2: Load gyms and default gym**

Import helpers:

```ts
import { getStoredDefaultGymId, storeDefaultGymId } from '@/lib/gyms';
```

Add:

```ts
const loadGyms = useCallback(async () => {
  const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/gyms`);

  if (!response.ok) {
    throw new Error('Failed to load gyms');
  }

  const data: Gym[] = await response.json();
  setGyms(data);

  const storedGymId = await getStoredDefaultGymId();
  const nextDefaultGymId = storedGymId ?? data[0]?.id ?? null;

  if (nextDefaultGymId !== null) {
    setDefaultGymId(nextDefaultGymId);
    await storeDefaultGymId(nextDefaultGymId);
  }
}, []);
```

Call `loadGyms()` inside the existing `useFocusEffect` callback before or after `loadWorkouts()`.

- [ ] **Step 3: Send gym ID when starting workout**

In `handleStartWorkout`, add a guard before the `fetch`:

```ts
if (defaultGymId === null) {
  setError('Could not find a default gym');
  setIsStartingWorkout(false);
  return;
}
```

Update the fetch options:

```ts
{
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ gymId: defaultGymId }),
}
```

- [ ] **Step 4: Display gym on workout cards**

Inside each previous-workout card, render:

```tsx
<Text style={{ color: colors.mutedText }}>{workout.gymName}</Text>
```

Place it below the date and above weekday/time.

- [ ] **Step 5: Lint Home**

Run:

```bash
npm run lint -w apps/mobile
```

Expected: no new lint errors from Home.

## Task 10: Add Settings Gym Section

**Files:**
- Modify: `apps/mobile/app/(tabs)/settings.tsx`

- [ ] **Step 1: Add state and imports**

Add imports:

```ts
import { useCallback, useState } from 'react';
import { Pressable, Switch, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getStoredDefaultGymId, storeDefaultGymId } from '@/lib/gyms';
```

Replace the current `react-native` import with the combined import above.

Add:

```ts
interface Gym {
  id: number;
  name: string;
}
```

Add state:

```ts
const [gyms, setGyms] = useState<Gym[]>([]);
const [defaultGymId, setDefaultGymId] = useState<number | null>(null);
const [newGymName, setNewGymName] = useState('');
const [error, setError] = useState<string | null>(null);
```

- [ ] **Step 2: Load gyms**

Add:

```ts
const loadGyms = useCallback(async () => {
  try {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/gyms`);

    if (!response.ok) {
      throw new Error('Failed to load gyms');
    }

    const data: Gym[] = await response.json();
    setGyms(data);

    const storedGymId = await getStoredDefaultGymId();
    const nextDefaultGymId = storedGymId ?? data[0]?.id ?? null;

    setDefaultGymId(nextDefaultGymId);

    if (nextDefaultGymId !== null) {
      await storeDefaultGymId(nextDefaultGymId);
    }
  } catch {
    setError('Could not load gyms');
  }
}, []);

useFocusEffect(
  useCallback(() => {
    loadGyms();
  }, [loadGyms]),
);
```

- [ ] **Step 3: Add create gym handler**

Add:

```ts
async function handleAddGym() {
  if (newGymName.trim() === '') {
    setError('Gym name is required');
    return;
  }

  try {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/gyms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newGymName }),
    });

    if (!response.ok) {
      throw new Error('Failed to add gym');
    }

    const gym: Gym = await response.json();
    await storeDefaultGymId(gym.id);
    setDefaultGymId(gym.id);
    setNewGymName('');
    await loadGyms();
  } catch {
    setError('Could not add gym');
  }
}
```

- [ ] **Step 4: Render gym section**

Below the dark mode card, add a second card:

```tsx
<View
  style={[
    styles.settingCard,
    {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
  ]}
>
  <View style={styles.settingCopy}>
    <ThemedText type="defaultSemiBold">Default gym</ThemedText>
    {gyms.map((gym) => {
      const isSelected = gym.id === defaultGymId;

      return (
        <Pressable
          key={gym.id}
          style={[
            styles.gymOption,
            { borderColor: isSelected ? colors.primary : colors.border },
          ]}
          onPress={async () => {
            await storeDefaultGymId(gym.id);
            setDefaultGymId(gym.id);
          }}
        >
          <ThemedText>{gym.name}</ThemedText>
        </Pressable>
      );
    })}

    <TextInput
      style={[
        styles.input,
        {
          color: colors.text,
          borderColor: colors.border,
          backgroundColor: colors.background,
        },
      ]}
      placeholder="Add gym"
      placeholderTextColor={colors.mutedText}
      value={newGymName}
      onChangeText={setNewGymName}
    />

    <Pressable
      style={[styles.addButton, { backgroundColor: colors.primary }]}
      onPress={handleAddGym}
    >
      <ThemedText style={{ color: colors.onPrimary }}>Add gym</ThemedText>
    </Pressable>

    {error && (
      <ThemedText style={{ color: colors.destructive }}>{error}</ThemedText>
    )}
  </View>
</View>
```

- [ ] **Step 5: Add styles**

Add:

```ts
gymOption: {
  borderWidth: 1,
  borderRadius: 8,
  padding: 12,
},
input: {
  borderWidth: 1,
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 10,
},
addButton: {
  borderRadius: 8,
  padding: 12,
  alignItems: 'center',
},
```

- [ ] **Step 6: Lint Settings**

Run:

```bash
npm run lint -w apps/mobile
```

Expected: no new lint errors from Settings.

## Task 11: Wire `log-set` To Machine Variants

**Files:**
- Modify: `apps/mobile/app/workout/log-set.tsx`

- [ ] **Step 1: Add local types**

Add:

```ts
interface Workout {
  id: number;
  performedOn: string;
  createdAt: string;
  gymId: number;
  gymName: string;
}

interface ExerciseVariant {
  id: number;
  exerciseId: number;
  gymId: number;
  label: string;
}
```

- [ ] **Step 2: Add state**

Add:

```ts
const [workout, setWorkout] = useState<Workout | null>(null);
const [exerciseVariants, setExerciseVariants] = useState<ExerciseVariant[]>([]);
const [selectedExerciseVariantId, setSelectedExerciseVariantId] = useState<number | null>(null);
const [newVariantLabel, setNewVariantLabel] = useState('');
const [isAddingVariant, setIsAddingVariant] = useState(false);
```

- [ ] **Step 3: Load workout and variants**

Add:

```ts
const loadWorkout = useCallback(async () => {
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_URL}/workouts/${workoutId}`,
  );

  if (!response.ok) {
    throw new Error('Could not load workout');
  }

  const data: Workout = await response.json();
  setWorkout(data);
  return data;
}, [workoutId]);

const loadExerciseVariants = useCallback(
  async (gymId: number) => {
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/exercise-variants?exerciseId=${exerciseId}&gymId=${gymId}`,
    );

    if (!response.ok) {
      throw new Error('Could not load machines');
    }

    const data: ExerciseVariant[] = await response.json();
    setExerciseVariants(data);
    setSelectedExerciseVariantId((currentValue) => currentValue ?? data[0]?.id ?? null);
  },
  [exerciseId],
);
```

Update the main loading effect so it calls `loadWorkout()`, then `loadExerciseVariants(workout.gymId)`, plus existing `loadExercises()` and `loadSets()`.

- [ ] **Step 4: Add create machine handler**

Add:

```ts
async function handleAddExerciseVariant() {
  if (workout === null) {
    setError('Could not find workout gym');
    return;
  }

  if (newVariantLabel.trim() === '') {
    setError('Machine label is required');
    return;
  }

  try {
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/exercise-variants`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseId: Number(exerciseId),
          gymId: workout.gymId,
          label: newVariantLabel,
        }),
      },
    );

    if (!response.ok) {
      throw new Error('Failed to add machine');
    }

    const variant: ExerciseVariant = await response.json();
    setExerciseVariants((currentVariants) => [...currentVariants, variant]);
    setSelectedExerciseVariantId(variant.id);
    setNewVariantLabel('');
    setIsAddingVariant(false);
  } catch {
    setError('Could not add machine');
  }
}
```

- [ ] **Step 5: Include variant ID in save/update**

In `handleSaveSet`, before `requestBody`:

```ts
if (selectedExerciseVariantId === null) {
  setError('Choose or add a machine before saving');
  setIsLoading(false);
  return;
}
```

Add to the save request body:

```ts
exerciseVariantId: selectedExerciseVariantId,
```

In `handleUpdateSet`, add to request body:

```ts
exerciseVariantId: selectedSet.exerciseVariantId,
```

This preserves the machine variant for existing saved rows during edit.

- [ ] **Step 6: Render gym and machine controls**

Below the title, render:

```tsx
{workout && (
  <Text style={{ color: colors.mutedText }}>{workout.gymName}</Text>
)}

<View style={styles.variantSection}>
  <Text style={[styles.variantLabel, { color: colors.text }]}>Machine</Text>
  {exerciseVariants.map((variant) => {
    const isSelected = variant.id === selectedExerciseVariantId;

    return (
      <Pressable
        key={variant.id}
        style={[
          styles.variantOption,
          {
            borderColor: isSelected ? colors.primary : colors.border,
            backgroundColor: colors.surface,
          },
        ]}
        onPress={() => setSelectedExerciseVariantId(variant.id)}
      >
        <Text style={{ color: colors.text }}>{variant.label}</Text>
      </Pressable>
    );
  })}

  {isAddingVariant ? (
    <View style={styles.addVariantContainer}>
      <TextInput
        style={[
          styles.variantInput,
          {
            color: colors.text,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          },
        ]}
        placeholder="Machine label"
        placeholderTextColor={colors.mutedText}
        value={newVariantLabel}
        onChangeText={setNewVariantLabel}
      />
      <Pressable onPress={() => setIsAddingVariant(false)}>
        <Text style={{ color: colors.mutedText }}>Cancel</Text>
      </Pressable>
      <Pressable onPress={handleAddExerciseVariant}>
        <Text style={{ color: colors.primary }}>Add</Text>
      </Pressable>
    </View>
  ) : (
    <Pressable onPress={() => setIsAddingVariant(true)}>
      <Text style={{ color: colors.primary }}>+ Add machine</Text>
    </Pressable>
  )}
</View>
```

Add missing imports:

```ts
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
```

- [ ] **Step 7: Add styles**

Add:

```ts
variantSection: {
  gap: 8,
},
variantLabel: {
  fontWeight: '700',
},
variantOption: {
  borderWidth: 1,
  borderRadius: 8,
  padding: 10,
},
addVariantContainer: {
  gap: 8,
},
variantInput: {
  borderWidth: 1,
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 10,
},
```

- [ ] **Step 8: Lint `log-set`**

Run:

```bash
npm run lint -w apps/mobile
```

Expected: no new lint errors from `log-set`.

## Task 12: Group Workout Detail By Exercise And Variant

**Files:**
- Modify: `apps/mobile/app/workout/[workoutId].tsx`

- [ ] **Step 1: Change grouping key**

Replace the grouping reducer key with:

```ts
const groupKey = `${currentSet.exerciseName} - ${currentSet.exerciseVariantLabel}`;
```

Use `groupKey` instead of `exerciseName` for the record key.

- [ ] **Step 2: Render variant-aware section title**

In the `Object.entries(groupedSets).map`, rename `[exerciseName, sets]` to `[sectionTitle, sets]`.

Use:

```tsx
<Text style={[styles.exerciseTitle, { color: colors.text }]}>
  {sectionTitle}
</Text>
```

Keep `const exerciseId = sets[0].exerciseId;`.

- [ ] **Step 3: Include gym label near top**

Compute:

```ts
const gymName = workoutSets[0]?.gymName;
```

Render below the Add exercise button:

```tsx
{gymName && <Text style={{ color: colors.mutedText }}>{gymName}</Text>}
```

- [ ] **Step 4: Lint detail screen**

Run:

```bash
npm run lint -w apps/mobile
```

Expected: no new lint errors from workout detail.

## Task 13: Full Verification

**Files:**
- No planned file changes.

- [ ] **Step 1: Reset and migrate local DB**

Run:

```bash
npm run db:migrate -w apps/api
npm run db:seed -w apps/api
```

Expected: both commands pass.

- [ ] **Step 2: Run API**

Run:

```bash
npm run dev:api
```

Expected: `API running on http://localhost:3001`.

- [ ] **Step 3: Run backend verification**

In a second terminal:

```bash
npm run verify:gym-machines -w apps/api
```

Expected: `Gym machine variant verification passed`.

- [ ] **Step 4: Run mobile lint**

Run:

```bash
npm run lint -w apps/mobile
```

Expected: lint exits successfully.

- [ ] **Step 5: Run iOS simulator smoke test**

Run:

```bash
npm run update:mobile-env
cd apps/mobile
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer npx expo start --ios
```

Manual smoke test:

1. Open Home.
2. Start a workout.
3. Choose a muscle group and exercise.
4. Add a machine label.
5. Save a set.
6. Open the workout detail page.
7. Confirm the section title includes the machine label.

Expected: no red screen; the saved set is attached to the chosen machine.

- [ ] **Step 6: Inspect final git diff**

Run:

```bash
git status --short
git diff --stat
```

Expected: only files listed in this plan changed.
