import { Router } from 'express';
import * as db from '../db/workouts';

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

export default router;
