import express from 'express';
import { register, login, logout, getMe, changePassword } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.put('/update-password', protect, changePassword);

export default router;
