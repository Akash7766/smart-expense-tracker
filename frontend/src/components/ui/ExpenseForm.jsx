import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui'
import { useCategories } from '../../hooks/useExpenses'

const today = new Date().toISOString().split('T')[0]

export default function ExpenseForm({ initialData, onSubmit, loading }) {
  const categories = useCategories()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    amount: '',
    category: '',
    description: '',
    date: today,
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (initialData) {
      setForm({
        amount: initialData.amount || '',
        category: initialData.category || '',
        description: initialData.description || '',
        date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : today,
      })
    }
  }, [initialData])

  const validate = () => {
    const errs = {}
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) {
      errs.amount = 'Enter a valid amount greater than 0'
    }
    if (!form.category) errs.category = 'Please select a category'
    if (!form.description || form.description.trim().length < 2) {
      errs.description = 'Description must be at least 2 characters'
    }
    if (!form.date) errs.date = 'Date is required'
    return errs
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    onSubmit({ ...form, amount: parseFloat(form.amount) })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Amount */}
      <div>
        <label className="label">Amount (₹)</label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-mono">₹</span>
          <input
            type="number"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            min="0.01"
            className={`input pl-8 font-mono ${errors.amount ? 'border-red-500/50 focus:ring-red-500/30' : ''}`}
          />
        </div>
        {errors.amount && <p className="text-xs text-red-400 mt-1">{errors.amount}</p>}
      </div>

      {/* Category */}
      <div>
        <label className="label">Category</label>
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className={`input ${errors.category ? 'border-red-500/50' : ''}`}
        >
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        {errors.category && <p className="text-xs text-red-400 mt-1">{errors.category}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="label">Description</label>
        <input
          type="text"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="What was this expense for?"
          maxLength={200}
          className={`input ${errors.description ? 'border-red-500/50' : ''}`}
        />
        <div className="flex justify-between mt-1">
          {errors.description ? (
            <p className="text-xs text-red-400">{errors.description}</p>
          ) : <span />}
          <p className="text-xs text-slate-600">{form.description.length}/200</p>
        </div>
      </div>

      {/* Date */}
      <div>
        <label className="label">Date</label>
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          max={today}
          className={`input ${errors.date ? 'border-red-500/50' : ''}`}
        />
        {errors.date && <p className="text-xs text-red-400 mt-1">{errors.date}</p>}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={() => navigate(-1)} className="flex-1 justify-center">
          Cancel
        </Button>
        <Button type="submit" loading={loading} className="flex-1 justify-center">
          {initialData ? 'Update Expense' : 'Add Expense'}
        </Button>
      </div>
    </form>
  )
}
