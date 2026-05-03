const axios = require('axios');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

const IDEAL_BUDGET_RATIOS = {
  'Housing': 30,
  'Food & Dining': 15,
  'Transportation': 10,
  'Utilities': 5,
  'Healthcare': 5,
  'Entertainment': 5,
  'Shopping': 5,
  'Education': 5,
  'Travel': 5,
  'Personal Care': 3,
  'Investments': 10,
  'Other': 2,
};

class AIInsightService {
  constructor() {
    this.geminiBaseURL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    this.maxRetries = 2;
    this.retryDelay = 1000;
  }

  /**
   * Build a structured, quantified prompt for the AI model
   */
  buildPrompt(summary) {
    const { overall, categoryBreakdown, monthlyTrend, period } = summary;
    const currency = '₹';

    const categoryLines = categoryBreakdown
      .map((c) => {
        const ideal = IDEAL_BUDGET_RATIOS[c.category] || 2;
        const deviation = (c.percentage - ideal).toFixed(1);
        const deviationStr = deviation > 0 ? `+${deviation}%` : `${deviation}%`;
        return `  - ${c.category}: ${currency}${c.totalAmount.toLocaleString('en-IN')} (${c.percentage}% of spend, ideal: ${ideal}%, deviation: ${deviationStr})`;
      })
      .join('\n');

    const monthlyLines = monthlyTrend
      .map((m) => `  - ${m.label}: ${currency}${m.totalAmount.toLocaleString('en-IN')} (${m.count} transactions)`)
      .join('\n');

    return `You are an expert personal finance advisor specializing in expense analysis for Indian consumers.

## EXPENSE SUMMARY (Last ${period.months} Months)

**Overall Statistics:**
- Total Spend: ${currency}${overall.totalSpend.toLocaleString('en-IN')}
- Monthly Average: ${currency}${overall.monthlyAverage.toLocaleString('en-IN')}
- Total Transactions: ${overall.totalTransactions}
- Average Per Transaction: ${currency}${overall.avgPerTransaction.toLocaleString('en-IN')}
- Largest Single Expense: ${currency}${overall.maxSingleExpense.toLocaleString('en-IN')}

**Category Breakdown (vs Ideal Budget Ratios):**
${categoryLines}

**Monthly Trend:**
${monthlyLines}

**Ideal Budget Reference (50/30/20 rule adapted):**
${Object.entries(IDEAL_BUDGET_RATIOS).map(([k, v]) => `  - ${k}: ${v}%`).join('\n')}

## YOUR TASK

Analyze this data and respond ONLY with a valid JSON object (no markdown, no explanation outside JSON) in this exact structure:

{
  "overallScore": <number 0-100 representing financial health>,
  "scoreLabel": "<Poor|Fair|Good|Excellent>",
  "summary": "<2-3 sentence executive summary of spending behavior>",
  "insights": [
    {
      "type": "<overspending|underspending|trend|pattern>",
      "category": "<category name or 'Overall'>",
      "title": "<short title>",
      "detail": "<specific finding with exact rupee amounts and percentages>",
      "severity": "<low|medium|high>"
    }
  ],
  "recommendations": [
    {
      "priority": <1-5>,
      "action": "<specific, actionable step>",
      "estimatedSaving": "<monthly saving in ₹ if applicable, or 'Non-monetary'>",
      "rationale": "<why this matters based on their data>"
    }
  ],
  "budgetAllocation": [
    {
      "category": "<category>",
      "currentPercent": <number>,
      "recommendedPercent": <number>,
      "currentAmount": <number>,
      "recommendedAmount": <number>,
      "action": "<reduce|increase|maintain>"
    }
  ],
  "positives": ["<something they are doing well>"],
  "nextMonthGoal": "<one specific, measurable goal for next month with a rupee target>"
}

Rules:
- Use exact rupee amounts from the data, not generic advice
- All insights must reference specific categories and amounts
- Recommendations must be actionable within 30 days
- Budget allocation must be based on their actual monthly average
- Be direct and specific, not generic
- If data is insufficient (< 3 expenses), note this in the summary`;
  }

  /**
   * Gemini can sometimes return JSON wrapped in markdown fences or extra text.
   * This normalizes common formats and extracts the first valid JSON object.
   */
  parseAIJson(rawText) {
    const normalized = String(rawText || '').trim();
    if (!normalized) throw new Error('Empty response from AI');

    const candidates = [];

    // 1) Raw text as-is
    candidates.push(normalized);

    // 2) Strip fenced code blocks
    candidates.push(normalized.replace(/```[a-zA-Z]*\n?/g, '').replace(/```/g, '').trim());

    // 3) Extract first JSON object block if model adds commentary
    const firstBrace = normalized.indexOf('{');
    const lastBrace = normalized.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      candidates.push(normalized.slice(firstBrace, lastBrace + 1).trim());
    }

    for (const candidate of candidates) {
      if (!candidate) continue;
      try {
        const parsed = JSON.parse(candidate);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          continue;
        }
        return parsed;
      } catch {
        // Try next candidate.
      }
    }

    throw new Error('AI returned non-JSON output');
  }

  /**
   * Call Gemini API with retry logic
   */
  async callGeminiAPI(prompt, attempt = 1) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new AppError('AI service is not configured', 503);

    try {
      const response = await axios.post(
        `${this.geminiBaseURL}?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            topP: 0.8,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          ],
        },
        { timeout: 30000 }
      );

      const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Empty response from AI');

      return this.parseAIJson(rawText);
    } catch (error) {
      if (attempt < this.maxRetries && error.response?.status !== 400) {
        logger.warn(`AI call attempt ${attempt} failed, retrying...`);
        await new Promise((r) => setTimeout(r, this.retryDelay * attempt));
        return this.callGeminiAPI(prompt, attempt + 1);
      }

      logger.error('AI service error:', error.message);
      throw new AppError(`AI analysis failed: ${error.message}`, 503);
    }
  }

  /**
   * Generate insights from aggregated expense data
   */
  async generateInsights(summary) {
    if (summary.overall.totalTransactions === 0) {
      return this.getEmptyStateResponse();
    }

    const prompt = this.buildPrompt(summary);
    logger.info('Generating AI insights for expense data...');

    let insights;
    try {
      insights = await this.callGeminiAPI(prompt);
    } catch (error) {
      logger.warn('Falling back to deterministic insights due to AI failure', {
        reason: error.message,
      });
      return this.getFallbackResponse(summary, error.message);
    }

    // Enrich with metadata
    return {
      ...insights,
      generatedAt: new Date().toISOString(),
      dataRange: {
        months: summary.period.months,
        startDate: summary.period.startDate,
        endDate: summary.period.endDate,
        totalTransactions: summary.overall.totalTransactions,
        totalSpend: summary.overall.totalSpend,
      },
    };
  }

  getFallbackResponse(summary, reason = 'AI service unavailable') {
    const topCategory = summary.categoryBreakdown?.[0];
    const monthlyAverage = summary.overall?.monthlyAverage || 0;
    const savingsTarget = Math.max(Math.round(monthlyAverage * 0.1), 0);

    return {
      overallScore: 50,
      scoreLabel: 'Fair',
      summary: 'AI insights are temporarily unavailable. This fallback analysis is based on your latest spending summary.',
      insights: [
        {
          type: 'pattern',
          category: topCategory?.category || 'Overall',
          title: 'Fallback spending snapshot',
          detail: topCategory
            ? `${topCategory.category} is currently your highest spend category at ₹${topCategory.totalAmount.toLocaleString('en-IN')} (${topCategory.percentage}%).`
            : 'No category-level data is available yet.',
          severity: 'medium',
        },
      ],
      recommendations: [
        {
          priority: 1,
          action: 'Review your top spending category and set a spending cap for next month.',
          estimatedSaving: `₹${savingsTarget.toLocaleString('en-IN')}`,
          rationale: 'A 10% reduction in your largest spend area is a practical short-term target.',
        },
      ],
      budgetAllocation: [],
      positives: ['You are actively tracking expenses, which is the first step to better financial control.'],
      nextMonthGoal: `Reduce discretionary expenses by at least ₹${savingsTarget.toLocaleString('en-IN')} next month.`,
      generatedAt: new Date().toISOString(),
      dataRange: {
        months: summary.period.months,
        startDate: summary.period.startDate,
        endDate: summary.period.endDate,
        totalTransactions: summary.overall.totalTransactions,
        totalSpend: summary.overall.totalSpend,
      },
      fallback: true,
      fallbackReason: reason,
    };
  }

  getEmptyStateResponse() {
    return {
      overallScore: 0,
      scoreLabel: 'No Data',
      summary: 'No expense data found. Please add some expenses to receive AI-powered financial insights.',
      insights: [],
      recommendations: [
        {
          priority: 1,
          action: 'Start tracking your expenses by adding at least 10 entries across different categories.',
          estimatedSaving: 'Non-monetary',
          rationale: 'Consistent tracking is the foundation of financial awareness.',
        },
      ],
      budgetAllocation: [],
      positives: [],
      nextMonthGoal: 'Record all expenses for the entire month to establish a spending baseline.',
      generatedAt: new Date().toISOString(),
    };
  }
}

module.exports = new AIInsightService();
