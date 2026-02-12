import express from 'express';
import multer from 'multer';
import * as rtoController from '../controllers/rtoController';

const router = express.Router();

// Configure Multer for file upload
const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('file'), rtoController.uploadRtoCsv);
router.post('/upload-attendance', upload.single('file'), rtoController.uploadRtoAttendanceCsv);
router.get('/analytics', rtoController.getRtoAnalytics);

export default router;
