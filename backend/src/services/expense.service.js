const { Expense } = require('../models/expense.model');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

class ExpenseService {
  /**
   * Create a new expense (scoped to user)
   */
  async createExpense(userId, data) {
    const expense = await Expense.create({ ...data, userId });
    logger.info(`Expense created: ${expense._id} user=${userId}`);
    return expense;
  }

  /**
   * Get paginated expenses with optional filters
   */
  async getExpenses(userId, { page = 1, limit = 10, category, startDate, endDate, sortBy = 'date', sortOrder = 'desc' }) {
    const filter = { userId };

    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (page - 1) * limit;

    const [expenses, total] = await Promise.all([
      Expense.find(filter).sort(sortOptions).skip(skip).limit(limit).lean(),
      Expense.countDocuments(filter),
    ]);

    return {
      expenses,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Get a single expense by ID (must belong to user)
   */
  async getExpenseById(userId, id) {
    const expense = await Expense.findOne({ _id: id, userId }).lean();
    if (!expense) throw new AppError('Expense not found', 404);
    return expense;
  }

  /**
   * Update expense
   */
  async updateExpense(userId, id, data) {
    const expense = await Expense.findOneAndUpdate({ _id: id, userId }, data, {
      new: true,
      runValidators: true,
    }).lean();
    if (!expense) throw new AppError('Expense not found', 404);
    logger.info(`Expense updated: ${id} user=${userId}`);
    return expense;
  }

  /**
   * Delete expense
   */
  async deleteExpense(userId, id) {
    const expense = await Expense.findOneAndDelete({ _id: id, userId }).lean();
    if (!expense) throw new AppError('Expense not found', 404);
    logger.info(`Expense deleted: ${id} user=${userId}`);
    return expense;
  }

  /**
   * Aggregate expense data for AI insights (user-scoped)
   */
  async getAggregatedSummary(userId, months = 3) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const baseMatch = { userId, date: { $gte: startDate } };

    const [categoryBreakdown, monthlyTrend, overallStats] = await Promise.all([
      Expense.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: '$category',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
            avgAmount: { $avg: '$amount' },
            maxAmount: { $max: '$amount' },
          },
        },
        { $sort: { totalAmount: -1 } },
      ]),

      Expense.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
            },
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),

      Expense.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            totalTransactions: { $sum: 1 },
            avgPerTransaction: { $avg: '$amount' },
            maxSingleExpense: { $max: '$amount' },
          },
        },
      ]),
    ]);

    const totalSpend = overallStats[0]?.totalAmount || 0;

    return {
      period: { months, startDate, endDate: new Date() },
      overall: {
        totalSpend: Math.round(totalSpend * 100) / 100,
        totalTransactions: overallStats[0]?.totalTransactions || 0,
        avgPerTransaction: Math.round((overallStats[0]?.avgPerTransaction || 0) * 100) / 100,
        maxSingleExpense: overallStats[0]?.maxSingleExpense || 0,
        monthlyAverage: Math.round((totalSpend / months) * 100) / 100,
      },
      categoryBreakdown: categoryBreakdown.map((cat) => ({
        category: cat._id,
        totalAmount: Math.round(cat.totalAmount * 100) / 100,
        percentage: totalSpend > 0 ? Math.round((cat.totalAmount / totalSpend) * 10000) / 100 : 0,
        count: cat.count,
        avgAmount: Math.round(cat.avgAmount * 100) / 100,
        maxAmount: Math.round(cat.maxAmount * 100) / 100,
      })),
      monthlyTrend: monthlyTrend.map((m) => ({
        year: m._id.year,
        month: m._id.month,
        label: new Date(m._id.year, m._id.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' }),
        totalAmount: Math.round(m.totalAmount * 100) / 100,
        count: m.count,
      })),
    };
  }

  /**
   * Get dashboard summary (lightweight, for UI) — user-scoped
   */
  async getDashboardSummary(userId) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const matchThisMonth = { userId, date: { $gte: startOfMonth } };
    const matchLastMonth = {
      userId,
      date: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    };

    const [currentMonth, lastMonth, categoryBreakdown, recentExpenses] = await Promise.all([
      Expense.aggregate([
        { $match: matchThisMonth },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Expense.aggregate([
        { $match: matchLastMonth },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Expense.aggregate([
        { $match: matchThisMonth },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      Expense.find({ userId }).sort({ date: -1 }).limit(5).lean(),
    ]);

    const currentTotal = currentMonth[0]?.total || 0;
    const lastTotal = lastMonth[0]?.total || 0;
    const changePercent = lastTotal > 0 ? ((currentTotal - lastTotal) / lastTotal) * 100 : 0;

    return {
      currentMonth: {
        total: Math.round(currentTotal * 100) / 100,
        count: currentMonth[0]?.count || 0,
      },
      lastMonth: {
        total: Math.round(lastTotal * 100) / 100,
        count: lastMonth[0]?.count || 0,
      },
      changePercent: Math.round(changePercent * 10) / 10,
      categoryBreakdown: categoryBreakdown.map((c) => ({
        category: c._id,
        total: Math.round(c.total * 100) / 100,
        count: c.count,
        percentage: currentTotal > 0 ? Math.round((c.total / currentTotal) * 10000) / 100 : 0,
      })),
      recentExpenses,
    };
  }
}

module.exports = new ExpenseService();
