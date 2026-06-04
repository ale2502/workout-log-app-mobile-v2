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

router.get('/:id/sets', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      res.status(400).json({ error: 'set id must be a number' });
      return;
    }

    const workoutSets = await setDb.getSetsByWorkoutId(id);

    res.status(200).json(workoutSets);
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

export default router;
