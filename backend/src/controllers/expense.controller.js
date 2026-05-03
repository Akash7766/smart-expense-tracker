const expenseService = require('../services/expense.service');
const { createExpenseSchema, updateExpenseSchema, paginationSchema } = require('../validators/expense.validator');
const { sendSuccess } = require('../utils/response');
const AppError = require('../utils/AppError');
const { CATEGORIES } = require('../models/expense.model');

const stripUserIdFromBody = (body) => {
  if (!body || typeof body !== 'object') return body;
  const rest = { ...body };
  delete rest.userId;
  return rest;
};

/**
 * POST /api/expenses
 */
const createExpense = async (req, res, next) => {
  try {
    const body = stripUserIdFromBody(req.body);
    const { error, value } = createExpenseSchema.validate(body, { abortEarly: false });
    if (error) {
      const messages = error.details.map((d) => d.message);
      return next(new AppError(messages.join('; '), 400));
    }

    const expense = await expenseService.createExpense(req.user.uid, value);
    return sendSuccess(res, expense, 'Expense created successfully', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/expenses
 */
const getExpenses = async (req, res, next) => {
  try {
    const { error, value } = paginationSchema.validate(req.query, { abortEarly: false });
    if (error) {
      const messages = error.details.map((d) => d.message);
      return next(new AppError(messages.join('; '), 400));
    }

    const result = await expenseService.getExpenses(req.user.uid, value);
    return sendSuccess(res, result, 'Expenses retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/expenses/dashboard
 */
const getDashboard = async (req, res, next) => {
  try {
    const summary = await expenseService.getDashboardSummary(req.user.uid);
    return sendSuccess(res, summary, 'Dashboard data retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/expenses/categories
 */
const getCategories = async (req, res, next) => {
  try {
    return sendSuccess(res, { categories: CATEGORIES }, 'Categories retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/expenses/:id
 */
const getExpenseById = async (req, res, next) => {
  try {
    const expense = await expenseService.getExpenseById(req.user.uid, req.params.id);
    return sendSuccess(res, expense, 'Expense retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/expenses/:id
 */
const updateExpense = async (req, res, next) => {
  try {
    const body = stripUserIdFromBody(req.body);
    const { error, value } = updateExpenseSchema.validate(body, { abortEarly: false });
    if (error) {
      const messages = error.details.map((d) => d.message);
      return next(new AppError(messages.join('; '), 400));
    }

    const expense = await expenseService.updateExpense(req.user.uid, req.params.id, value);
    return sendSuccess(res, expense, 'Expense updated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/expenses/:id
 */
const deleteExpense = async (req, res, next) => {
  try {
    await expenseService.deleteExpense(req.user.uid, req.params.id);
    return sendSuccess(res, null, 'Expense deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getDashboard,
  getCategories,
};
