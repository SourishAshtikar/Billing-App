import express from 'express';
import { getAllUsers, updateUserRole, createUser, updateUser } from '../controllers/userController';
import { protect, admin, adminViewer } from '../middleware/authMiddleware';

const router = express.Router();

// GET /api/users - Get all users (admin only)
router.get('/', protect, adminViewer, getAllUsers);

// POST /api/users - Create a new user (admin only)
router.post('/', protect, admin, createUser);

// PUT /api/users/:id - Update user (admin only)
router.put('/:id', protect, admin, updateUser);

// PUT /api/users/:id/role - Update user role (admin only)
router.put('/:id/role', protect, admin, updateUserRole);

export default router;
