import { Router } from 'express';
import { mergePDFsController } from '../controllers/mergeController';

const router = Router();
router.post('/', mergePDFsController);
export default router;
