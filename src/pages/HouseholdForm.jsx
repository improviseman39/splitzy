import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { authHeaders } from '../auth'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4003'
const CATEGORIES = ['Rent', 'Utilities', 'Groceries', 'Internet', 'Insurance', 'Maintenance', 'Other']

function HouseholdForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Other')
  const [amount, setAmount] = useState('')
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(isEdit)

  useEffect(() => {
    if (!isEdit) return
    fetch(`${API}/api/household`, { headers: authHeaders() })
      .then(r => r.json())
      .then(list => {
        const exp = list.find(e => e.id === parseInt(id))
        if (exp) {
          setTitle(exp.title)
          setCategory(exp.category)
          setAmount(exp.amount)
          setExpenseDate(exp.expense_date.slice(0, 10))
          setNotes(exp.notes || '')
        }
        setLoading(false)
      })
  }, [id])

  const save = () => {
    if (!title || !amount) return alert('Please fill in a title and amount')

    const body = JSON.stringify({ title, category, amount, expense_date: expenseDate, notes })
    const url = isEdit ? `${API}/api/household/${id}` : `${API}/api/household`
    const method = isEdit ? 'PUT' : 'POST'

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body
    }).then(() => navigate('/household/expenses'))
  }

  if (loading) return <div className="page">Loading...</div>

  return (
    <div className="page">
      <Link to="/household/expenses" className="back-link">← Back</Link>
      <h2 style={{ marginBottom: 16 }}>{isEdit ? '✏️ Edit Expense' : '🏠 Add Expense'}</h2>

      <div className="card">
        <label className="label">Title</label>
        <input className="input" value={title} onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Electricity bill" style={{ marginBottom: 14 }} />

        <div className="form-row">
          <div className="field">
            <label className="label">Category</label>
            <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="label">Amount</label>
            <input className="input" type="number" value={amount}
              onChange={e => setAmount(e.target.value)} placeholder="0.00" />
          </div>
        </div>

        <label className="label" style={{ marginTop: 14, display: 'block' }}>Date</label>
        <input className="input" type="date" value={expenseDate}
          onChange={e => setExpenseDate(e.target.value)} style={{ marginBottom: 14 }} />

        <label className="label">Notes (optional)</label>
        <input className="input" value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Any extra detail" />
      </div>

      <button onClick={save} className="btn btn-primary btn-block" style={{ padding: 15, fontSize: 17 }}>
        💾 {isEdit ? 'Save Changes' : 'Save Expense'}
      </button>
    </div>
  )
}

export default HouseholdForm
