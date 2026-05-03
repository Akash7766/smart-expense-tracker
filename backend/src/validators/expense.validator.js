const Joi = require('joi');
const { CATEGORIES } = require('../models/expense.model');

const createExpenseSchema = Joi.object({
  amount: Joi.number().positive().max(10000000).precision(2).required().messages({
    'number.base': 'Amount must be a number',
    'number.positive': 'Amount must be greater than 0',
    'number.max': 'Amount cannot exceed 10,000,000',
    'any.required': 'Amount is required',
  }),
  category: Joi.string()
    .valid(...CATEGORIES)
    .required()
    .messages({
      'any.only': `Category must be one of: ${CATEGORIES.join(', ')}`,
      'any.required': 'Category is required',
    }),
  description: Joi.string().min(2).max(200).trim().required().messages({
    'string.min': 'Description must be at least 2 characters',
    'string.max': 'Description cannot exceed 200 characters',
    'any.required': 'Description is required',
  }),
  date: Joi.date().max('now').required().messages({
    'date.max': 'Date cannot be in the future',
    'any.required': 'Date is required',
  }),
});

const updateExpenseSchema = Joi.object({
  amount: Joi.number().positive().max(10000000).precision(2).messages({
    'number.base': 'Amount must be a number',
    'number.positive': 'Amount must be greater than 0',
  }),
  category: Joi.string()
    .valid(...CATEGORIES)
    .messages({
      'any.only': `Category must be one of: ${CATEGORIES.join(', ')}`,
    }),
  description: Joi.string().min(2).max(200).trim().messages({
    'string.min': 'Description must be at least 2 characters',
    'string.max': 'Description cannot exceed 200 characters',
  }),
  date: Joi.date().max('now').messages({
    'date.max': 'Date cannot be in the future',
  }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  category: Joi.string().valid(...CATEGORIES).optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().min(Joi.ref('startDate')).optional(),
  sortBy: Joi.string().valid('date', 'amount', 'category', 'createdAt').default('date'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

module.exports = { createExpenseSchema, updateExpenseSchema, paginationSchema };
