import { Router } from 'express';
import * as db from '../db/workouts';
import * as setDb from '../db/sets';

const router = Router();

// Create new workout
router.post('/', async (req, res) => {
  try {
    const workout = await db.addWorkout();
    console.log(workout);
    res.status(201).json(workout);
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

// Get all workouts
router.get('/', async (req, res) => {
  try {
    const workoutsArr = await db.getWorkouts();
    console.log(workoutsArr);
    res.status(200).json(workoutsArr);
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

// Get all the sets for a specific workout
router.get('/:id/sets', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      res.status(400).json({ error: 'workout id must be a number' });
      return;
    }

    const workoutSets = await setDb.getSetsByWorkoutId(id);

    res.status(200).json(workoutSets);
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

// Delete workout and its sets
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      res.status(400).json({ error: 'workout id must be a number' });
      return;
    }

    const deletedCount = await db.deleteWorkoutById(id);

    if (deletedCount === 0) {
      res.status(404).json({ error: 'Workout not found' });
      return;
    }

    res.sendStatus(204);
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

router.delete('/:workoutId/exercises/:exerciseId/sets', async (req, res) => {
  try {
    const workoutId = Number(req.params.workoutId);
    const exerciseId = Number(req.params.exerciseId);

    if (Number.isNaN(workoutId) || Number.isNaN(exerciseId)) {
      res
        .status(400)
        .json({ error: 'workout or exercise id must be a number' });
      return;
    }

    const deletedCount = await setDb.deleteSetsByWorkoutAndExercise(
      workoutId,
      exerciseId,
    );

    if (deletedCount === 0) {
      res
        .status(404)
        .json({ error: 'No sets found for that workout and exercise' });
      return;
    }

    res.sendStatus(204);
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

export default router;
