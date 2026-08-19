const express = require('express');
const router = express.Router();
const documentsController = require('../controllers/documentsController');
const { authenticate } = require('../middlewares/auth');

router.get('/departments', documentsController.getDepartments);
router.get('/required', authenticate, documentsController.getRequiredDocuments);

module.exports = router;
