import { Router } from 'express';
import exercisesRouter from './exercises';

const router = Router();

router.use('/exercises', exercisesRouter);

export default router;
