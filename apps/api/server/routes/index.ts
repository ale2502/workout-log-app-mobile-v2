import { Router } from 'express';
import exercisesRouter from './exercises';
import setsRouter from './sets';

const router = Router();

router.use('/exercises', exercisesRouter);
router.use('/sets', setsRouter);

export default router;
