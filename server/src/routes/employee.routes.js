const express = require('express');
const router = express.Router();
const controller = require('../controllers/employee.controller');
const { verifyToken } = require('../middleware/authJwt');

router.post('/leaves', [verifyToken], controller.markLeave);
router.get('/leaves', [verifyToken], controller.getLeaves);
router.delete('/leaves/:id', [verifyToken], controller.deleteLeave);
router.put('/leaves/:id', [verifyToken], controller.updateLeave);
router.get('/profile', [verifyToken], controller.getProfile);

module.exports = router;
