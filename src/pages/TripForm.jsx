import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authHeaders } from '../auth'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4003'
const CURRENCIES = ['AUD', 'USD', 'THB', 'SGD', 'GBP', 'EUR']

function TripForm() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [currency, setCurrency] = useState('AUD')

  const save = () => {
    if (!name) return alert('Please enter a trip name')
    fetch(`${API}/api/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({
        name, destination, start_date: startDate || null, end_date: endDate || null, currency
      })
    }).then(() => navigate('/travel/trips'))
  }

  return (
    <div className="page">
      <Link to="/travel/trips" className="back-link">← Back</Link>
      <h2 style={{ marginBottom: 16 }}>✈️ Add Trip</h2>

      <div className="card">
        <label className="label">Trip Name</label>
        <input className="input" value={name} onChange={e => setName(e.target.value)}
          placeholder="e.g. Bali 2026" style={{ marginBottom: 14 }} />

        <label className="label">Destination (optional)</label>
        <input className="input" value={destination} onChange={e => setDestination(e.target.value)}
          placeholder="e.g. Bali, Indonesia" style={{ marginBottom: 14 }} />

        <div className="form-row">
          <div className="field">
            <label className="label">Start Date</label>
            <input className="input" type="date" value={startDate}
              onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="field">
            <label className="label">End Date</label>
            <input className="input" type="date" value={endDate}
              onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>

        <label className="label" style={{ marginTop: 14, display: 'block' }}>Currency</label>
        <select className="input" value={currency} onChange={e => setCurrency(e.target.value)}>
          {CURRENCIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <button onClick={save} className="btn btn-primary btn-block" style={{ padding: 15, fontSize: 17 }}>
        💾 Save Trip
      </button>
    </div>
  )
}

export default TripForm
