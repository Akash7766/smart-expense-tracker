const express = require('express');
const router = express.Router();
const {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getDashboard,
  getCategories,
} = require('../controllers/expense.controller');
const { validateObjectId } = require('../middleware/validateObjectId');
const { requireAuth } = require('../middleware/requireAuth');

router.use(requireAuth);

// Special routes (must come before :id routes)
router.get('/dashboard', getDashboard);
router.get('/categories', getCategories);

// CRUD routes
router.route('/').get(getExpenses).post(createExpense);

router
  .route('/:id')
  .get(validateObjectId, getExpenseById)
  .put(validateObjectId, updateExpense)
  .delete(validateObjectId, deleteExpense);

module.exports = router;
