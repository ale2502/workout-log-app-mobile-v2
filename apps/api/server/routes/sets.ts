import { Router } from 'express';
import * as db from '../db/sets';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const sets = await db.getAllSets();
    res.json(sets);
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

export default router;
