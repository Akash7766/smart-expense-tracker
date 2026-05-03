import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { expenseAPI } from '../services/api'
import ExpenseForm from '../components/ui/ExpenseForm'
import { Card, PageHeader, SkeletonCard } from '../components/ui'

export default function EditExpense() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [expense, setExpense] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    expenseAPI.getById(id)
      .then((res) => setExpense(res.data))
      .catch((err) => { toast.error(err.message); navigate('/expenses') })
      .finally(() => setFetching(false))
  }, [id, navigate])

  const handleSubmit = async (data) => {
    setLoading(true)
    try {
      await expenseAPI.update(id, data)
      toast.success('Expense updated!')
      navigate('/expenses')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto animate-slide-up">
      <PageHeader title="Edit Expense" description="Update expense details" />
      <Card>
        {fetching ? <SkeletonCard /> : <ExpenseForm initialData={expense} onSubmit={handleSubmit} loading={loading} />}
      </Card>
    </div>
  )
}
