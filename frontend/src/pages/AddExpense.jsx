import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { expenseAPI } from '../services/api'
import ExpenseForm from '../components/ui/ExpenseForm'
import { Card, PageHeader } from '../components/ui'

export default function AddExpense() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data) => {
    setLoading(true)
    try {
      await expenseAPI.create(data)
      toast.success('Expense added successfully!')
      navigate('/expenses')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto animate-slide-up">
      <PageHeader
        title="Add Expense"
        description="Record a new expense entry"
      />
      <Card>
        <ExpenseForm onSubmit={handleSubmit} loading={loading} />
      </Card>
    </div>
  )
}
