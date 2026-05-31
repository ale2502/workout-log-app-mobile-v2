import { Router } from 'express';
import * as db from '../db/workouts';

const router = Router();

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

export default router;
