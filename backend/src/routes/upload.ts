import { Router } from 'express';
import { uploadMiddleware } from '../middleware/upload';
import { uploadFiles } from '../controllers/uploadController';

const router = Router();
router.post('/', uploadMiddleware.array('files', 10), uploadFiles);
export default router;
