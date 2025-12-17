import express from 'express';
import { getProjectBillingStats, getAllProjectsStats, getAnnualBillingReport, getResourceStats } from '../controllers/billingController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/stats/project/:id', protect, admin, getProjectBillingStats);
router.get('/stats/overview', protect, admin, getAllProjectsStats);
router.get('/stats/annual', protect, admin, getAnnualBillingReport);
router.get('/my-stats', protect, getResourceStats);

export default router;
