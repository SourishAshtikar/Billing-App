const express = require('express');
const router = express.Router();
const controller = require('../controllers/billing.controller');
const { verifyToken, isAdmin } = require('../middleware/authJwt');

router.post('/generate', [verifyToken, isAdmin], controller.generateBill);
router.get('/project/:projectId', [verifyToken, isAdmin], controller.getProjectBills);

module.exports = router;
