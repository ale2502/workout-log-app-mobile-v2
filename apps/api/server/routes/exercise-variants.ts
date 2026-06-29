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
