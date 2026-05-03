import { useState, useEffect, useCallback } from 'react'
import { expenseAPI } from '../services/api'
import toast from 'react-hot-toast'

export function useExpenses(initialParams = {}) {
  const [expenses, setExpenses] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [params, setParams] = useState({ page: 1, limit: 10, ...initialParams })

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await expenseAPI.getAll(params)
      setExpenses(res.data.expenses)
      setPagination(res.data.pagination)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  const deleteExpense = async (id) => {
    try {
      await expenseAPI.delete(id)
      toast.success('Expense deleted')
      fetchExpenses()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const updateParams = (newParams) => {
    setParams((prev) => ({ ...prev, ...newParams, page: newParams.page ?? 1 }))
  }

  return { expenses, pagination, loading, error, deleteExpense, updateParams, refetch: fetchExpenses }
}

export function useDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await expenseAPI.getDashboard()
        setData(res.data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  return { data, loading, error }
}

export function useCategories() {
  const [categories, setCategories] = useState([])

  useEffect(() => {
    expenseAPI.getCategories().then((res) => {
      setCategories(res.data.categories)
    }).catch(() => {})
  }, [])

  return categories
}
