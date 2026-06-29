import { Router } from 'express';
import exercisesRouter from './exercises';
import exerciseVariantsRouter from './exercise-variants';
import gymsRouter from './gyms';
import setsRouter from './sets';
import workoutsRouter from './workouts';

const router = Router();

router.use('/exercises', exercisesRouter);
router.use('/exercise-variants', exerciseVariantsRouter);
router.use('/gyms', gymsRouter);
router.use('/sets', setsRouter);
router.use('/workouts', workoutsRouter);

export default router;
