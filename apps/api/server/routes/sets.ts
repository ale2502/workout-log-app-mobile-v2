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

router.post('/', async (req, res) => {
  try {
    const newSet = req.body;
    const set = await db.addSet(newSet);
    console.log(set);
    res.status(201).json(set);
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

export default router;
