import { Router } from 'express';
import * as db from '../db/workouts';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const newWorkout = req.body;
    const workout = await db.addWorkout(newWorkout);
    console.log(workout);
    res.json(workout);
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

export default router;
