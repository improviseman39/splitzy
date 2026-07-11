import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { authHeaders } from '../auth'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4003'

function LoanPaymentForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [amount, setAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')

  const save = () => {
    if (!amount) return alert('Please enter a payment amount')
    fetch(`${API}/api/loans/${id}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ amount, payment_date: paymentDate, notes })
    }).then(() => navigate(`/loans/loan/${id}`))
  }

  return (
    <div className="page">
      <Link to={`/loans/loan/${id}`} className="back-link">← Back</Link>
      <h2 style={{ marginBottom: 16 }}>💵 Log a Payment</h2>

      <div className="card">
        <label className="label">Amount Paid</label>
        <input className="input" type="number" value={amount}
          onChange={e => setAmount(e.target.value)} placeholder="0.00"
          style={{ marginBottom: 14 }} />

        <label className="label">Date</label>
        <input className="input" type="date" value={paymentDate}
          onChange={e => setPaymentDate(e.target.value)} style={{ marginBottom: 14 }} />

        <label className="label">Notes (optional)</label>
        <input className="input" value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Any extra detail" />
      </div>

      <button onClick={save} className="btn btn-primary btn-block" style={{ padding: 15, fontSize: 17 }}>
        💾 Log Payment
      </button>
    </div>
  )
}

export default LoanPaymentForm
