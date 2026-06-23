import { Router } from 'express';
import * as db from '../db/exercises';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const exercises = await db.getAllExercises();
    res.json(exercises);
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

router.post('/', async (req, res) => {
  try {
    const newExercise = req.body;

    if (
      newExercise.name === undefined || newExercise.muscleGroup === undefined
    )
  }
})

export default router;
