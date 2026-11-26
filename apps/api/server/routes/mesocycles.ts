import { Router } from 'express';
import {
  getMesocycleInputError,
  getMesocycleStatus,
  type NewMesocycle,
} from 'workout-log-shared';
import * as db from '../db/mesocycles.ts';
import { getToday } from '../clock.ts';

const router = Router();

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

router.get('/current', async (req, res) => {
  try {
    const mesocycle = await db.getCurrentMesocycle();
    // Always 200: "no mesocycle yet" is a normal state, not a missing resource.
    res.json(mesocycle ?? null);
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

router.post('/', async (req, res) => {
  try {
    const today = getToday();
    const inputError = getMesocycleInputError(req.body, today);

    if (inputError) {
      res.status(400).json({ error: inputError });
      return;
    }

    // Only one block at a time: a new one may start once the latest has
    // finished or been ended. Not atomic (check, then insert), which is fine
    // for a single user.
    const current = await db.getCurrentMesocycle();

    if (current && getMesocycleStatus(current, today).phase !== 'completed') {
      res
        .status(409)
        .json({ error: 'A mesocycle is already running or scheduled' });
      return;
    }

    // Pick the known fields so extra body fields (id, endedAt, ...) are never stored.
    const { startDate, trainingWeeks, deloadWeeks, startRir, endRir } =
      req.body as NewMesocycle;
    const mesocycle = await db.createMesocycle({
      startDate,
      trainingWeeks,
      deloadWeeks,
      startRir,
      endRir,
    });

    res.status(201).json(mesocycle);
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

// Ending is only for a block that has started. A block that never ran is
// cancelled (DELETE) instead, otherwise it would be a row that "ended before
// it began".
router.patch('/:id/end', async (req, res) => {
  try {
    const id = parseId(req.params.id);

    if (id === null) {
      res.status(400).json({ error: 'mesocycle id must be a number' });
      return;
    }

    const mesocycle = await db.getMesocycleById(id);

    if (!mesocycle) {
      res.status(404).json({ error: 'Mesocycle not found' });
      return;
    }

    const today = getToday();
    const { phase } = getMesocycleStatus(mesocycle, today);

    if (phase === 'upcoming') {
      res.status(409).json({
        error: 'This mesocycle has not started yet, cancel it instead',
      });
      return;
    }

    if (phase === 'completed') {
      res.status(409).json({ error: 'This mesocycle has already ended' });
      return;
    }

    const ended = await db.endMesocycle(id, today);
    res.json(ended);
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

// Cancelling deletes the row, so it is only allowed before the block starts:
// a block that never ran leaves no trace, while a started one is history and
// is ended (PATCH /:id/end) instead.
router.delete('/:id', async (req, res) => {
  try {
    const id = parseId(req.params.id);

    if (id === null) {
      res.status(400).json({ error: 'mesocycle id must be a number' });
      return;
    }

    const mesocycle = await db.getMesocycleById(id);

    if (!mesocycle) {
      res.status(404).json({ error: 'Mesocycle not found' });
      return;
    }

    const { phase } = getMesocycleStatus(mesocycle, getToday());

    if (phase !== 'upcoming') {
      res.status(409).json({
        error: 'Only a mesocycle that has not started can be cancelled',
      });
      return;
    }

    await db.deleteMesocycle(id);
    res.sendStatus(204);
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong');
  }
});

export default router;
