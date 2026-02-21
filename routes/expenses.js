const express = require('express');
const router = express.Router();
const { getExpenses, createExpense, getExpensesByVehicle } = require('../controllers/expenseController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getExpenses)
  .post(authorize('manager', 'finance', 'dispatcher'), createExpense);

router.get('/by-vehicle', getExpensesByVehicle);

module.exports = router;
