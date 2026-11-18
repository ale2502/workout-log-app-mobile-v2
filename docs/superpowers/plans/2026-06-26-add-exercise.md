# Add Exercise Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the custom add-exercise flow so users can create an exercise in an existing muscle group and continue to set logging.

**Architecture:** Add a small backend route for existing muscle groups, then complete the mobile route screen and controlled form component. Keep API calls and navigation in `add-exercise.tsx`; keep rendering and dropdown UI in `NewExerciseForm`.

**Tech Stack:** Express, Knex, Expo Router, React Native, TypeScript.

---

### Task 1: Add Muscle Groups API Route

**Files:**
- Modify: `apps/api/server/routes/exercises.ts`

- [ ] Add `GET /exercises/muscle-groups` before the create route:

```ts
router.get('/muscle-groups', async (req, res) => {
  try {
    const muscleGroups = await db.getAllMuscleGroups();
    res.json(muscleGroups);
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});
```

- [ ] Verify with:

```bash
curl http://localhost:3001/exercises/muscle-groups
```

Expected: a JSON string array of muscle groups.

### Task 2: Complete NewExerciseForm

**Files:**
- Modify: `apps/mobile/components/workout/NewExerciseForm.tsx`

- [ ] Export a controlled component that renders:
  - exercise name `TextInput`
  - muscle group dropdown field
  - one attached dropdown menu when open
  - create button

- [ ] Keep styling aligned with existing workout screens: white background parent, grey borders, dark primary button, red error text.

### Task 3: Complete AddExerciseScreen

**Files:**
- Modify: `apps/mobile/app/workout/add-exercise.tsx`

- [ ] Read `workoutId` and `muscleGroup` from route params.
- [ ] Fetch `/exercises/muscle-groups` on mount.
- [ ] Preselect the route muscle group.
- [ ] Submit `POST /exercises` with `{ name, muscleGroup }`.
- [ ] Navigate to `/workout/log-set` using the returned exercise id.

### Task 4: Verify

**Commands:**

```bash
npm run lint -w apps/mobile
curl http://localhost:3001/exercises/muscle-groups
```

Manual check in Expo:

1. Start a workout.
2. Choose a muscle group.
3. Tap `Add +`.
4. Confirm the add-exercise screen uses the existing app style.
5. Open the muscle group dropdown and confirm it is one attached menu.
6. Create an exercise.
7. Confirm navigation to `log-set`.
