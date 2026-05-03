const expenseService = require('../services/expense.service');
const aiService = require('../services/ai.service');
const Joi = require('joi');

const insightQuerySchema = Joi.object({
  months: Joi.number().integer().min(1).max(12).default(3),
});

/**
 * POST /api/insights
 * Aggregates expense data then sends structured summary to AI
 */
const generateInsights = async (req, res) => {
  try {
    const { error, value } = insightQuerySchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        data: null,
      });
    }

    // Step 1: Aggregate data efficiently via MongoDB (user-scoped)
    const summary = await expenseService.getAggregatedSummary(req.user.uid, value.months);

    // Step 2: Send structured summary (not raw data) to AI
    const insights = await aiService.generateInsights(summary);

    const payload = { summary: summary || {}, insights: insights || {} };
    const isFallback = Boolean(payload.insights?.fallback);

    console.log('[insights] response payload', {
      months: value.months,
      isFallback,
      totalTransactions: payload.summary?.overall?.totalTransactions || 0,
      hasInsightsObject: typeof payload.insights === 'object' && payload.insights !== null,
    });

    return res.status(200).json({
      success: !isFallback,
      message: isFallback
        ? 'Insights generated using fallback response'
        : 'Insights generated successfully',
      data: payload,
    });
  } catch (err) {
    console.log('[insights] failed to generate response', {
      message: err.message,
      months: req.query?.months,
    });

    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Failed to generate insights',
      data: {
        summary: {},
        insights: aiService.getFallbackResponse(
          {
            overall: {
              totalTransactions: 0,
              totalSpend: 0,
              monthlyAverage: 0,
            },
            categoryBreakdown: [],
            monthlyTrend: [],
            period: {
              months: Number(req.query?.months || 3),
              startDate: null,
              endDate: null,
            },
          },
          err.message || 'Unexpected AI service error'
        ),
      },
    });
  }
};

module.exports = { generateInsights };
