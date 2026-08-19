const express = require('express');
const router = express.Router();
const submissionsController = require('../controllers/submissionsController');
const { authenticate } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

router.use(authenticate);

router.get('/my', submissionsController.getMySubmissions);
router.post('/', submissionsController.getOrCreateSubmission);
router.get('/:id', submissionsController.getSubmissionById);
router.post('/:id/documents', upload.single('file'), submissionsController.uploadDocument);
router.delete('/:id/documents/:docId', submissionsController.deleteDocument);
router.post('/:id/submit', submissionsController.finalizeSubmission);
router.get('/:id/acknowledgement', submissionsController.downloadAcknowledgementPdf);

module.exports = router;
