const express = require('express');
const {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  transfer,
} = require('../controllers/accountController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect);

router.get('/', getAccounts);
router.post('/', createAccount);
router.post('/transfer', transfer);
router.put('/:id', updateAccount);
router.delete('/:id', deleteAccount);

module.exports = router;
