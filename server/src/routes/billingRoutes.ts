import express from 'express';
import { getProjectBillingStats, getAllProjectsStats } from '../controllers/billingController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/stats/project/:id', protect, admin, getProjectBillingStats);
router.get('/stats/overview', protect, admin, getAllProjectsStats);

export default router;
