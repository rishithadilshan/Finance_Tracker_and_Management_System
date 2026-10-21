const express = require('express');
const { monthlyReport, yearlyReport, categoryReport } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect);

router.get('/monthly', monthlyReport);
router.get('/yearly', yearlyReport);
router.get('/category', categoryReport);

module.exports = router;
