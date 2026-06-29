import { Router } from 'express';
import * as db from '../db/gyms.ts';

const router = Router();

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
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

export default router;
