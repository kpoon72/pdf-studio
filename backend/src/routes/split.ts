import { Router } from 'express';
import { splitPDFController } from '../controllers/splitController';

const router = Router();
router.post('/', splitPDFController);
export default router;
