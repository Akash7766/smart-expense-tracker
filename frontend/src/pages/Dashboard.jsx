import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { useDashboard } from '../hooks/useExpenses'
import { formatCurrency, formatDate, getCategoryColor, getCategoryIcon } from '../utils/helpers'
import { StatCard, SkeletonCard, ErrorState, Card, PageHeader, Button } from '../components/ui'

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    const { name, value } = payload[0]
    return (
      <div className="card px-3 py-2 text-sm shadow-xl">
        <p className="text-slate-300">{name}</p>
        <p className="font-bold text-white">{formatCurrency(value)}</p>
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const { data, loading, error } = useDashboard()

  if (error) return <ErrorState message={error} />

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Dashboard"
        description="Your financial overview at a glance"
        action={
          <Link to="/expenses/add">
            <Button>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Expense
            </Button>
          </Link>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              title="This Month"
              value={formatCurrency(data?.currentMonth?.total || 0)}
              sub={`${data?.currentMonth?.count || 0} transactions`}
              trend={data?.changePercent}
              color="brand"
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <StatCard
              title="Last Month"
              value={formatCurrency(data?.lastMonth?.total || 0)}
              sub={`${data?.lastMonth?.count || 0} transactions`}
              color="blue"
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
            />
            <StatCard
              title="Categories Used"
              value={data?.categoryBreakdown?.length || 0}
              sub="this month"
              color="purple"
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>}
            />
            <StatCard
              title="Top Category"
              value={data?.categoryBreakdown?.[0]?.category?.split(' ')[0] || '—'}
              sub={data?.categoryBreakdown?.[0] ? formatCurrency(data.categoryBreakdown[0].total) : 'No data'}
              color="amber"
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
            />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie chart */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Spending by Category</h3>
          {loading ? (
            <div className="skeleton h-56 rounded-xl" />
          ) : data?.categoryBreakdown?.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoryBreakdown}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {data.categoryBreakdown.map((entry) => (
                      <Cell key={entry.category} fill={getCategoryColor(entry.category)} opacity={0.9} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-56 text-slate-500 text-sm">No data for this month</div>
          )}
        </Card>

        {/* Bar chart */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Category Breakdown</h3>
          {loading ? (
            <div className="skeleton h-56 rounded-xl" />
          ) : data?.categoryBreakdown?.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.categoryBreakdown.slice(0, 6)} margin={{ top: 5, right: 5, bottom: 20, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="category" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-20} textAnchor="end" />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                    {data.categoryBreakdown.slice(0, 6).map((entry) => (
                      <Cell key={entry.category} fill={getCategoryColor(entry.category)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-56 text-slate-500 text-sm">No data for this month</div>
          )}
        </Card>
      </div>

      {/* Recent expenses */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-300">Recent Expenses</h3>
          <Link to="/expenses" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
            View all →
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton h-10 w-10 rounded-xl" />
                <div className="flex-1 space-y-1">
                  <div className="skeleton h-3.5 w-36 rounded" />
                  <div className="skeleton h-3 w-24 rounded" />
                </div>
                <div className="skeleton h-4 w-16 rounded" />
              </div>
            ))}
          </div>
        ) : data?.recentExpenses?.length > 0 ? (
          <div className="space-y-1">
            {data.recentExpenses.map((expense) => (
              <div key={expense._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-border/30 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center text-base flex-shrink-0">
                  {getCategoryIcon(expense.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{expense.description}</p>
                  <p className="text-xs text-slate-500">{expense.category} · {formatDate(expense.date)}</p>
                </div>
                <p className="text-sm font-semibold text-white font-mono">{formatCurrency(expense.amount)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-8">No recent expenses. <Link to="/expenses/add" className="text-brand-400">Add one →</Link></p>
        )}
      </Card>

      {/* AI Insights teaser */}
      <div className="card p-5 border-brand-500/20 bg-gradient-to-r from-brand-500/5 to-transparent">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white">Get AI Financial Insights</h3>
            <p className="text-xs text-slate-500 mt-0.5">Let AI analyze your spending patterns and suggest personalized savings strategies.</p>
          </div>
          <Link to="/insights">
            <Button className="whitespace-nowrap text-sm">
              Analyze Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
