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

// POST - Create new exercise
router.post('/', async (req, res) => {
  try {
    const newExercise = req.body;

    if (
      newExercise.name === undefined ||
      newExercise.muscleGroup === undefined
    ) {
      res.status(400).json({
        error: 'name and muscleGroup are required',
      });
      return;
    }

    const exercise = await db.addNewExercise(newExercise);
    console.log(exercise);
    res.status(201).json(exercise);
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

export default router;
