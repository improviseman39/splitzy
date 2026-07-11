import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authHeaders } from '../auth'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4003'
const LOAN_TYPES = ['Car Loan', 'Credit Card', 'Personal Loan', 'Mortgage', 'Student Loan', 'Other']

function LoanForm() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [lender, setLender] = useState('')
  const [loanType, setLoanType] = useState('Other')
  const [principalAmount, setPrincipalAmount] = useState('')
  const [interestRate, setInterestRate] = useState('')
  const [minimumPayment, setMinimumPayment] = useState('')
  const [dueDay, setDueDay] = useState('')
  const [startDate, setStartDate] = useState('')
  const [notes, setNotes] = useState('')

  const save = () => {
    if (!name || !principalAmount) return alert('Please fill in a name and the loan amount')
    fetch(`${API}/api/loans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({
        name, lender, loan_type: loanType,
        principal_amount: principalAmount,
        current_balance: principalAmount,
        interest_rate: interestRate || null,
        minimum_payment: minimumPayment || null,
        due_day: dueDay || null,
        start_date: startDate || null,
        notes
      })
    }).then(() => navigate('/loans/list'))
  }

  return (
    <div className="page">
      <Link to="/loans/list" className="back-link">← Back</Link>
      <h2 style={{ marginBottom: 16 }}>💳 Add Loan</h2>

      <div className="card">
        <label className="label">Loan Name</label>
        <input className="input" value={name} onChange={e => setName(e.target.value)}
          placeholder="e.g. Car Loan" style={{ marginBottom: 14 }} />

        <div className="form-row">
          <div className="field">
            <label className="label">Type</label>
            <select className="input" value={loanType} onChange={e => setLoanType(e.target.value)}>
              {LOAN_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="label">Lender (optional)</label>
            <input className="input" value={lender} onChange={e => setLender(e.target.value)}
              placeholder="e.g. Commonwealth Bank" />
          </div>
        </div>

        <label className="label" style={{ marginTop: 14, display: 'block' }}>Total Loan Amount</label>
        <input className="input" type="number" value={principalAmount}
          onChange={e => setPrincipalAmount(e.target.value)} placeholder="0.00"
          style={{ marginBottom: 14 }} />

        <div className="form-row">
          <div className="field">
            <label className="label">Interest Rate % (optional)</label>
            <input className="input" type="number" step="0.01" value={interestRate}
              onChange={e => setInterestRate(e.target.value)} placeholder="e.g. 6.5" />
          </div>
          <div className="field">
            <label className="label">Minimum Payment (optional)</label>
            <input className="input" type="number" value={minimumPayment}
              onChange={e => setMinimumPayment(e.target.value)} placeholder="0.00" />
          </div>
        </div>

        <div className="form-row" style={{ marginTop: 14 }}>
          <div className="field">
            <label className="label">Due Day of Month (optional)</label>
            <input className="input" type="number" min="1" max="31" value={dueDay}
              onChange={e => setDueDay(e.target.value)} placeholder="e.g. 15" />
          </div>
          <div className="field">
            <label className="label">Start Date (optional)</label>
            <input className="input" type="date" value={startDate}
              onChange={e => setStartDate(e.target.value)} />
          </div>
        </div>

        <label className="label" style={{ marginTop: 14, display: 'block' }}>Notes (optional)</label>
        <input className="input" value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Any extra detail" />
      </div>

      <button onClick={save} className="btn btn-primary btn-block" style={{ padding: 15, fontSize: 17 }}>
        💾 Save Loan
      </button>
    </div>
  )
}

export default LoanForm
