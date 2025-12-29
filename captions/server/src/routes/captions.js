import express from 'express';
import { getHistory, deleteCaption, getCaption, createCaption } from '../controllers/captionController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authMiddleware, createCaption);
router.get('/', authMiddleware, getHistory);
router.get('/history', authMiddleware, getHistory);
router.get('/:id', authMiddleware, getCaption);
router.delete('/:id', authMiddleware, deleteCaption);

export default router;

