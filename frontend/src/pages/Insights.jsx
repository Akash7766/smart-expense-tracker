import { useState } from 'react'
import toast from 'react-hot-toast'
import { insightAPI } from '../services/api'
import { formatCurrency, getCategoryColor, getCategoryIcon } from '../utils/helpers'
import { Button, Card, PageHeader } from '../components/ui'
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts'

const severityConfig = {
  high: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', dot: 'bg-red-400' },
  medium: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-400' },
  low: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', dot: 'bg-blue-400' },
}

const typeIcon = {
  overspending: '📈',
  underspending: '📉',
  trend: '📊',
  pattern: '🔍',
}

const scoreLabelColor = {
  Poor: 'text-red-400',
  Fair: 'text-amber-400',
  Good: 'text-blue-400',
  Excellent: 'text-brand-400',
  'No Data': 'text-slate-500',
}

function ScoreGauge({ score }) {
  const data = [{ value: score, fill: score >= 75 ? '#22c55e' : score >= 50 ? '#3b82f6' : score >= 25 ? '#f59e0b' : '#ef4444' }]
  return (
    <div className="relative h-36 w-36 mx-auto">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" data={data} startAngle={180} endAngle={0}>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={8} background={{ fill: '#1e293b' }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
        <span className="text-3xl font-bold text-white">{score}</span>
        <span className="text-xs text-slate-500">/ 100</span>
      </div>
    </div>
  )
}

export default function Insights() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [months, setMonths] = useState(3)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await insightAPI.generate(months)
      const payload = res?.data
      const insights = payload?.insights

      if (!payload || !insights || typeof insights !== 'object' || Array.isArray(insights)) {
        throw new Error('Insights service returned an invalid response. Please try again.')
      }

      setData(payload)
      if (res?.success === false) {
        toast('Showing fallback insights because AI service is unavailable.')
      } else {
        toast.success('AI insights generated!')
      }
    } catch (err) {
      const message = err?.message?.includes('not valid JSON')
        ? 'Insights service returned invalid data. Please try again in a moment.'
        : (err.message || 'Failed to generate insights')
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const { insights } = data || {}

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="AI Financial Insights"
        description="AI-powered analysis of your spending patterns"
      />

      {/* Controls */}
      <Card className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-300 mb-1">Analysis Period</p>
          <div className="flex gap-2">
            {[1, 3, 6].map((m) => (
              <button
                key={m}
                onClick={() => setMonths(m)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  months === m
                    ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                    : 'text-slate-400 hover:text-slate-200 border border-surface-border'
                }`}
              >
                {m} Month{m > 1 ? 's' : ''}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={handleGenerate} loading={loading} className="w-full sm:w-auto">
          {loading ? 'Analyzing...' : '✨ Generate Insights'}
        </Button>
      </Card>

      {/* Loading state */}
      {loading && (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="card p-5 space-y-3">
              <div className="skeleton h-5 w-48 rounded" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-3/4 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty prompt */}
      {!loading && !data && (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-3xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-4">
            <span className="text-4xl">🤖</span>
          </div>
          <h3 className="text-base font-semibold text-white mb-2">Ready to Analyze Your Finances</h3>
          <p className="text-sm text-slate-500 max-w-sm mb-6">
            Our AI will analyze your expense patterns, detect overspending, and provide quantified, actionable suggestions.
          </p>
          <Button onClick={handleGenerate}>
            ✨ Generate AI Insights
          </Button>
        </Card>
      )}

      {/* Results */}
      {!loading && insights && (
        <div className="space-y-4 animate-slide-up">
          {/* Score + Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="flex flex-col items-center justify-center text-center">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Financial Health Score</p>
              <ScoreGauge score={insights.overallScore} />
              <p className={`text-sm font-semibold mt-2 ${scoreLabelColor[insights.scoreLabel] || 'text-slate-400'}`}>
                {insights.scoreLabel}
              </p>
            </Card>
            <Card className="md:col-span-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Executive Summary</p>
              <p className="text-sm text-slate-300 leading-relaxed">{insights.summary}</p>

              {insights.positives?.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium text-brand-400">✅ What you&apos;re doing well</p>
                  {insights.positives.map((p, i) => (
                    <p key={i} className="text-xs text-slate-400 pl-3 border-l border-brand-500/30">{p}</p>
                  ))}
                </div>
              )}

              {insights.nextMonthGoal && (
                <div className="mt-4 p-3 rounded-xl bg-brand-500/5 border border-brand-500/15">
                  <p className="text-xs font-medium text-brand-400 mb-1">🎯 Next Month Goal</p>
                  <p className="text-xs text-slate-400">{insights.nextMonthGoal}</p>
                </div>
              )}
            </Card>
          </div>

          {/* Key Insights */}
          {insights.insights?.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Key Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {insights.insights.map((insight, i) => {
                  const s = severityConfig[insight.severity] || severityConfig.low
                  return (
                    <div key={i} className={`p-4 rounded-xl border ${s.bg} ${s.border}`}>
                      <div className="flex items-start gap-3">
                        <span className="text-lg">{typeIcon[insight.type] || '📊'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className={`text-xs font-semibold ${s.color}`}>{insight.title}</p>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">{insight.detail}</p>
                          {insight.category && insight.category !== 'Overall' && (
                            <span className="inline-flex items-center gap-1 mt-2 text-xs text-slate-500">
                              {getCategoryIcon(insight.category)} {insight.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Recommendations */}
          {insights.recommendations?.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Actionable Recommendations</h3>
              <div className="space-y-3">
                {insights.recommendations
                  .sort((a, b) => a.priority - b.priority)
                  .map((rec, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-xl bg-surface border border-surface-border">
                    <div className="w-7 h-7 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center flex-shrink-0 text-xs font-bold text-brand-400">
                      {rec.priority}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 mb-1">{rec.action}</p>
                      <p className="text-xs text-slate-500 mb-2">{rec.rationale}</p>
                      {rec.estimatedSaving && rec.estimatedSaving !== 'Non-monetary' && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20">
                          💰 Save {rec.estimatedSaving}/mo
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Budget Allocation */}
          {insights.budgetAllocation?.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Recommended Budget Allocation</h3>
              <div className="space-y-3">
                {insights.budgetAllocation.map((item, i) => {
                  const action = item.action
                  const actionColor = action === 'reduce' ? 'text-red-400' : action === 'increase' ? 'text-brand-400' : 'text-slate-400'
                  const actionIcon = action === 'reduce' ? '↓' : action === 'increase' ? '↑' : '='
                  return (
                    <div key={i} className="flex items-center gap-4">
                      <div className="flex items-center gap-2 w-36 flex-shrink-0">
                        <span className="text-sm">{getCategoryIcon(item.category)}</span>
                        <span className="text-xs text-slate-400 truncate">{item.category}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex-1 bg-surface rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full"
                              style={{
                                width: `${Math.min(item.currentPercent, 100)}%`,
                                backgroundColor: getCategoryColor(item.category),
                                opacity: 0.6,
                              }}
                            />
                          </div>
                          <span className="text-xs text-slate-500 w-8 text-right">{item.currentPercent}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-surface rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full"
                              style={{
                                width: `${Math.min(item.recommendedPercent, 100)}%`,
                                backgroundColor: getCategoryColor(item.category),
                              }}
                            />
                          </div>
                          <span className="text-xs text-slate-400 w-8 text-right">{item.recommendedPercent}%</span>
                        </div>
                        <div className="flex gap-4 mt-1">
                          <span className="text-xs text-slate-600">Current: {formatCurrency(item.currentAmount)}</span>
                          <span className="text-xs text-slate-500">→ Recommended: {formatCurrency(item.recommendedAmount)}</span>
                        </div>
                      </div>
                      <span className={`text-sm font-bold w-5 text-center ${actionColor}`}>{actionIcon}</span>
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-4 mt-4 pt-3 border-t border-surface-border">
                <span className="text-xs text-slate-600">■ Current allocation</span>
                <span className="text-xs text-slate-400">■ Recommended</span>
              </div>
            </Card>
          )}

          {/* Metadata */}
          <p className="text-xs text-slate-600 text-center">
            Analysis of {insights.dataRange?.totalTransactions} transactions · {formatCurrency(insights.dataRange?.totalSpend)} total · Generated {new Date(insights.generatedAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  )
}
