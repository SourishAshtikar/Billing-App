import express from 'express';
import { getAllUsers, updateUserRole } from '../controllers/userController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

// GET /api/users - Get all users (admin only)
router.get('/', protect, admin, getAllUsers);

// PUT /api/users/:id/role - Update user role (admin only)
router.put('/:id/role', protect, admin, updateUserRole);

export default router;
