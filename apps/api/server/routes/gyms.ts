import { Router } from 'express';
import * as db from '../db/gyms.ts';
import * as exerciseVariantDb from '../db/exercise-variants.ts';

const router = Router();

function isUniqueConstraintError(error: unknown) {
  return error instanceof Error && error.message.includes('SQLITE_CONSTRAINT');
}

router.get('/', async (req, res) => {
  try {
    const gyms = await db.getGyms();
    res.json(gyms);
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

router.post('/', async (req, res) => {
  try {
    const name = req.body.name;

    if (typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    const gym = await db.addGym({ name });
    res.status(201).json(gym);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      res.status(409).json({ error: 'Gym name already exists' });
      return;
    }

    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const name = req.body.name;

    if (Number.isNaN(id)) {
      res.status(400).json({ error: 'gym id must be a number' });
      return;
    }

    if (typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    const gym = await db.updateGymById(id, { name });

    if (!gym) {
      res.status(404).json({ error: 'Gym not found' });
      return;
    }

    res.json(gym);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      res.status(409).json({ error: 'Gym name already exists' });
      return;
    }

    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

router.get('/:id/exercise-variants', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      res.status(400).json({ error: 'gym id must be a number' });
      return;
    }

    const variants = await exerciseVariantDb.getExerciseVariantsByGymId(id);
    res.json(variants);
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

export default router;
