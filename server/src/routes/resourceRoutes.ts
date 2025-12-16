import express from 'express';
import multer from 'multer';
import { assignResource, getResources, createResource, updateResource, deleteResource, getResourceWorkingDays } from '../controllers/resourceController';
import { bulkImportResources } from '../controllers/csvController';
import { protect, admin } from '../middleware/authMiddleware';

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
router.get('/:id/working-days', protect, admin, getResourceWorkingDays);

// PUT /api/resources/:id - Update resource (admin only)
router.put('/:id', protect, admin, updateResource);

// DELETE /api/resources/:id - Delete resource (admin only)
router.delete('/:id', protect, admin, deleteResource);

export default router;
