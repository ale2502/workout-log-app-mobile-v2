import { Router } from 'express';
import exercisesRouter from './exercises';
import setsRouter from './sets';
import workoutsRouter from './workouts';

const router = Router();

router.use('/exercises', exercisesRouter);
router.use('/sets', setsRouter);
router.use('/workouts', workoutsRouter);

export default router;
