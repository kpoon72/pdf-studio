import { Router } from 'express';
import { rotatePagesController, deletePageController, reorderPagesController } from '../controllers/pagesController';

const router = Router();
router.post('/rotate', rotatePagesController);
router.post('/delete', deletePageController);
router.post('/reorder', reorderPagesController);
export default router;
