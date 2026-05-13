import { Router } from 'express';
import * as db from '../db/sets';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const workoutIdString = req.query.workoutId;
    const exerciseIdString = req.query.exerciseId;

    if (workoutIdString === undefined || exerciseIdString === undefined) {
      res.status(400).json({ error: 'Could not find workoutId or exerciseId' });
      return;
    }

    const workoutId = Number(workoutIdString);
    const exerciseId = Number(exerciseIdString);

    // isNaN explanation: did workoutId fail to become a real number?
    if (Number.isNaN(workoutId) || Number.isNaN(exerciseId)) {
      res
        .status(400)
        .json({ error: 'workoutId and exerciseId must be numbers' });
      return;
    }

    const sets = await db.getSetsByWorkoutAndExercise(workoutId, exerciseId);
    console.log(sets);
    res.json(sets);
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

router.post('/', async (req, res) => {
  try {
    const newSet = req.body;

    if (
      newSet.workoutId === undefined ||
      newSet.exerciseId === undefined ||
      newSet.setNumber === undefined ||
      newSet.reps === undefined
    ) {
      res.status(400).json({
        error: 'workoutId, exerciseId, setNumber and reps are required',
      });
      return;
    }

    const set = await db.addSet(newSet);
    console.log(set);
    res.status(201).json(set);
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      res.status(400).json({ error: 'set id must be a number' });
      return;
    }

    const updatedSet = req.body;
    const set = await db.updateSetById(id, updatedSet);

    res.json(set);
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

export default router;
