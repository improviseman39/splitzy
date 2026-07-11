import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { authHeaders } from '../auth'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4003'
const CATEGORIES = ['Utilities', 'Rent', 'Insurance', 'Subscription', 'Registration', 'Service', 'Other']
const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'One-off (no repeat)' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
]

function ReminderForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Other')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [recurrence, setRecurrence] = useState('none')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(isEdit)

  useEffect(() => {
    if (!isEdit) return
    fetch(`${API}/api/bills-reminders`, { headers: authHeaders() })
      .then(r => r.json())
      .then(list => {
        const item = list.find(i => i.id === parseInt(id))
        if (item) {
          setTitle(item.title)
          setCategory(item.category)
          setAmount(item.amount || '')
          setDueDate(item.due_date.slice(0, 10))
          setRecurrence(item.recurrence)
          setNotes(item.notes || '')
        }
        setLoading(false)
      })
  }, [id])

  const save = () => {
    if (!title || !dueDate) return alert('Please fill in a title and due date')

    const body = JSON.stringify({
      title, category, amount: amount || null, due_date: dueDate, recurrence, notes,
      ...(isEdit ? { is_paid: false } : {})
    })
    const url = isEdit ? `${API}/api/bills-reminders/${id}` : `${API}/api/bills-reminders`
    const method = isEdit ? 'PUT' : 'POST'

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body
    }).then(() => navigate('/bills-reminders/list'))
  }

  if (loading) return <div className="page">Loading...</div>

  return (
    <div className="page">
      <Link to="/bills-reminders/list" className="back-link">← Back</Link>
      <h2 style={{ marginBottom: 16 }}>{isEdit ? '✏️ Edit Reminder' : '🔔 Add Bill / Reminder'}</h2>

      <div className="card">
        <label className="label">Title</label>
        <input className="input" value={title} onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Car Registration" style={{ marginBottom: 14 }} />

        <div className="form-row">
          <div className="field">
            <label className="label">Category</label>
            <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="label">Amount (optional)</label>
            <input className="input" type="number" value={amount}
              onChange={e => setAmount(e.target.value)} placeholder="0.00" />
          </div>
        </div>

        <label className="label" style={{ marginTop: 14, display: 'block' }}>Due Date</label>
        <input className="input" type="date" value={dueDate}
          onChange={e => setDueDate(e.target.value)} style={{ marginBottom: 14 }} />

        <label className="label">Repeats</label>
        <select className="input" value={recurrence} onChange={e => setRecurrence(e.target.value)}
          style={{ marginBottom: 14 }}>
          {RECURRENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <label className="label">Notes (optional)</label>
        <input className="input" value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Any extra detail" />
      </div>

      <button onClick={save} className="btn btn-primary btn-block" style={{ padding: 15, fontSize: 17 }}>
        💾 {isEdit ? 'Save Changes' : 'Save Reminder'}
      </button>
    </div>
  )
}

export default ReminderForm
