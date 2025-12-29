import express from 'express';
import { register, login, getProfile, updatePreferences } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authMiddleware, getProfile);
router.put('/preferences', authMiddleware, updatePreferences);

export default router;

