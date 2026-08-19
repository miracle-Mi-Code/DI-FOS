const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, requireRole } = require('../middlewares/auth');

router.use(authenticate);
router.use(requireRole('STAFF', 'SUPER_ADMIN'));

router.get('/stats', adminController.getAdminStats);
router.get('/submissions', adminController.getSubmissions);
router.get('/submissions/:id', adminController.getSubmissionById);
router.patch('/documents/:id', adminController.reviewDocument);
router.patch('/submissions/:id/status', adminController.updateSubmissionStatus);
router.get('/reports/export', adminController.exportSubmissionsCsv);

module.exports = router;
