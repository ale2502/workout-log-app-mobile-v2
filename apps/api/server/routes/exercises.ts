import { Router } from 'express';
import * as db from '../db/exercises';

const router = Router();

// GET /api/v1/exercises
router.get('/', async (req, res) => {
  try {
    const exercises = await db.getAllExercises();
    res.json(exercises);
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

export default router;
