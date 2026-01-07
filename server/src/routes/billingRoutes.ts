import express from 'express';
import { getProjectBillingStats, getAllProjectsStats, getAnnualBillingReport, getResourceStats } from '../controllers/billingController';
import { protect, admin, adminViewer } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/stats/project/:id', protect, adminViewer, getProjectBillingStats);
router.get('/stats/overview', protect, adminViewer, getAllProjectsStats);
router.get('/stats/annual', protect, adminViewer, getAnnualBillingReport);
router.get('/my-stats', protect, getResourceStats);

export default router;
