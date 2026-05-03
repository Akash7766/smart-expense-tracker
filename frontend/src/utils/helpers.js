import { format, parseISO } from 'date-fns'

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export const formatDate = (date) => {
  try {
    const d = typeof date === 'string' ? parseISO(date) : new Date(date)
    return format(d, 'dd MMM yyyy')
  } catch {
    return 'Invalid date'
  }
}

export const formatDateShort = (date) => {
  try {
    const d = typeof date === 'string' ? parseISO(date) : new Date(date)
    return format(d, 'MMM dd')
  } catch {
    return ''
  }
}

export const CATEGORY_COLORS = {
  'Food & Dining': '#22c55e',
  'Transportation': '#3b82f6',
  'Housing': '#8b5cf6',
  'Utilities': '#f59e0b',
  'Healthcare': '#ef4444',
  'Entertainment': '#ec4899',
  'Shopping': '#06b6d4',
  'Education': '#10b981',
  'Travel': '#f97316',
  'Personal Care': '#a78bfa',
  'Investments': '#84cc16',
  'Other': '#6b7280',
}

export const getCategoryColor = (category) => CATEGORY_COLORS[category] || '#6b7280'

export const getCategoryIcon = (category) => {
  const icons = {
    'Food & Dining': '🍽️',
    'Transportation': '🚗',
    'Housing': '🏠',
    'Utilities': '⚡',
    'Healthcare': '❤️',
    'Entertainment': '🎬',
    'Shopping': '🛍️',
    'Education': '📚',
    'Travel': '✈️',
    'Personal Care': '💆',
    'Investments': '📈',
    'Other': '📦',
  }
  return icons[category] || '📦'
}
