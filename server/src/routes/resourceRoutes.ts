import express from 'express';
import multer from 'multer';
import { assignResource, getResources, createResource, updateResource, deleteResource, getResourceWorkingDays, getAnnualMonthlyBreakdown } from '../controllers/resourceController';
import { bulkImportResources } from '../controllers/csvController';
import { protect, admin, adminViewer } from '../middleware/authMiddleware';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// POST /api/resources - Create a new resource (admin only)
router.post('/', protect, admin, createResource);

// POST /api/resources/bulk-import - Import resources efficiently from CSV
router.post('/bulk-import', protect, admin, upload.single('file'), bulkImportResources);

// POST /api/resources/assign - Assign resource to project (admin only)
router.post('/assign', protect, admin, assignResource);

// GET /api/resources - Get all resources (any authenticated user)
router.get('/', protect, getResources);

// GET /api/resources/:id/working-days - Get working days analytics
router.get('/:id/working-days', protect, adminViewer, getResourceWorkingDays);

// GET /api/resources/annual-breakdown - Get annual breakdown for all resources
router.get('/annual-breakdown', protect, adminViewer, getAnnualMonthlyBreakdown);

// PUT /api/resources/:id - Update resource (admin only)
router.put('/:id', protect, admin, updateResource);

// DELETE /api/resources/:id - Delete resource (admin only)
router.delete('/:id', protect, admin, deleteResource);

export default router;
