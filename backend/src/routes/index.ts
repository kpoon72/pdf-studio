import { Router } from 'express';
import uploadRouter from './upload';
import mergeRouter from './merge';
import splitRouter from './split';
import pagesRouter from './pages';

const router = Router();

router.use('/upload', uploadRouter);
router.use('/merge', mergeRouter);
router.use('/split', splitRouter);
router.use('/pages', pagesRouter);

export default router;
