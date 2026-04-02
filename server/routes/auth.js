import { Router } from 'express';
import { register, login, getProfile, updateProfile } from '../controllers/auth.js';
import { validateRegister, validateLogin } from '../middleware/validate.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

// Protected routes
router.get('/me', verifyToken, getProfile);
router.put('/me', verifyToken, updateProfile);

export default router;
