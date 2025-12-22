import express from 'express';
import { applyLeave, getMyLeaves } from '../controllers/leaveController';
import { bulkImportLeaves } from '../controllers/csvController';
import { protect, admin } from '../middleware/authMiddleware';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });

const router = express.Router();

router.post('/', protect, applyLeave);
router.get('/my', protect, getMyLeaves);
router.post('/upload', protect, admin, upload.single('file'), bulkImportLeaves);

export default router;
