import { Router } from 'express';
import exercisesRouter from './exercises';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true });
});

router.use('/exercises', exercisesRouter);

export default router;
