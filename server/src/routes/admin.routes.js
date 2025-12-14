const express = require('express');
const router = express.Router();
const controller = require('../controllers/admin.controller');
const { verifyToken, isAdmin } = require('../middleware/authJwt');

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/projects', [verifyToken, isAdmin], controller.createProject);
router.get('/projects', [verifyToken, isAdmin], controller.getAllProjects);
router.get('/employees', [verifyToken, isAdmin], controller.getAllEmployees);
router.post('/assign', [verifyToken, isAdmin], controller.assignEmployee);
router.get('/projects/:projectId/employees', [verifyToken, isAdmin], controller.getProjectEmployees);
router.post('/upload-users', [verifyToken, isAdmin, upload.single('file')], controller.uploadUsers);
router.put('/employees/:id', [verifyToken, isAdmin], controller.updateEmployee);
router.delete('/employees/:id', [verifyToken, isAdmin], controller.deleteEmployee);

module.exports = router;
