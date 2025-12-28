import express from 'express';
import { applyLeave, getMyLeaves, adminMarkLeave, removeLeave, getUserLeaves } from '../controllers/leaveController';
import { bulkImportLeaves } from '../controllers/csvController';
import { protect, admin } from '../middleware/authMiddleware';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });

const router = express.Router();

router.post('/', protect, applyLeave);
router.get('/my', protect, getMyLeaves);
router.post('/upload', protect, admin, upload.single('file'), bulkImportLeaves);

// Admin specific routes
router.post('/admin/mark', protect, admin, adminMarkLeave);
router.get('/user/:userId', protect, admin, getUserLeaves);

// Delete leave
router.delete('/:id', protect, removeLeave);


export default router;
