import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useExpenses, useCategories } from '../hooks/useExpenses'
import { formatCurrency, formatDate, getCategoryIcon, getCategoryColor } from '../utils/helpers'
import { Button, PageHeader, EmptyState, ErrorState, SkeletonRow, Badge } from '../components/ui'

export default function Expenses() {
  const navigate = useNavigate()
  const categories = useCategories()
  const [filters, setFilters] = useState({ category: '', sortBy: 'date', sortOrder: 'desc' })
  const { expenses, pagination, loading, error, deleteExpense, updateParams } = useExpenses()

  const handleFilter = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    updateParams({ ...newFilters, page: 1 })
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this expense?')) {
      await deleteExpense(id)
    }
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="All Expenses"
        description={pagination ? `${pagination.totalItems} total records` : 'Loading...'}
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

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filters.category}
          onChange={(e) => handleFilter('category', e.target.value)}
          className="input w-auto text-sm"
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={filters.sortBy}
          onChange={(e) => handleFilter('sortBy', e.target.value)}
          className="input w-auto text-sm"
        >
          <option value="date">Sort by Date</option>
          <option value="amount">Sort by Amount</option>
          <option value="category">Sort by Category</option>
        </select>
        <select
          value={filters.sortOrder}
          onChange={(e) => handleFilter('sortOrder', e.target.value)}
          className="input w-auto text-sm"
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {/* Desktop header */}
        <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 border-b border-surface-border text-xs font-medium text-slate-500 uppercase tracking-wider">
          <div className="col-span-5">Description</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-2 text-right">Amount</div>
          <div className="col-span-1" />
        </div>

        {error && <ErrorState message={error} />}

        {loading ? (
          Array(8).fill(0).map((_, i) => <SkeletonRow key={i} />)
        ) : expenses.length === 0 ? (
          <EmptyState
            title="No expenses found"
            description="Try adjusting your filters or add your first expense."
            action={<Link to="/expenses/add"><Button>Add Expense</Button></Link>}
          />
        ) : (
          expenses.map((expense) => (
            <div
              key={expense._id}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-5 py-4 border-b border-surface-border last:border-0 hover:bg-surface-border/20 transition-colors group"
            >
              {/* Description */}
              <div className="col-span-5 flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                  style={{ backgroundColor: `${getCategoryColor(expense.category)}15` }}
                >
                  {getCategoryIcon(expense.category)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{expense.description}</p>
                  <p className="text-xs text-slate-500 sm:hidden">{expense.category} · {formatDate(expense.date)}</p>
                </div>
              </div>

              {/* Category */}
              <div className="hidden sm:flex col-span-2 items-center">
                <Badge>
                  <span className="mr-1">{getCategoryIcon(expense.category)}</span>
                  {expense.category}
                </Badge>
              </div>

              {/* Date */}
              <div className="hidden sm:flex col-span-2 items-center text-sm text-slate-400">
                {formatDate(expense.date)}
              </div>

              {/* Amount */}
              <div className="col-span-2 flex items-center justify-end">
                <span className="text-sm font-semibold text-white font-mono">
                  {formatCurrency(expense.amount)}
                </span>
              </div>

              {/* Actions */}
              <div className="col-span-1 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => navigate(`/expenses/edit/${expense._id}`)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(expense._id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {pagination.currentPage} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => updateParams({ page: pagination.currentPage - 1 })}
              disabled={!pagination.hasPrevPage}
              className="text-sm"
            >
              ← Previous
            </Button>
            <Button
              variant="secondary"
              onClick={() => updateParams({ page: pagination.currentPage + 1 })}
              disabled={!pagination.hasNextPage}
              className="text-sm"
            >
              Next →
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
