const express = require('express');
const { getBudgets, createOrUpdateBudget, deleteBudget } = require('../controllers/budgetController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect);

router.get('/', getBudgets);
router.post('/', createOrUpdateBudget);
router.delete('/:id', deleteBudget);

module.exports = router;
