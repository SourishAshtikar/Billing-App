import express from 'express';
import { applyLeave, getMyLeaves } from '../controllers/leaveController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', protect, applyLeave);
router.get('/my', protect, getMyLeaves);

export default router;
