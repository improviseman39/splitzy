import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { authHeaders } from '../auth'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4003'

function TripDetail() {
  const { id } = useParams()
  const [data, setData] = useState(null)

  const load = () => {
    fetch(`${API}/api/trips/${id}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(setData)
  }

  useEffect(() => { load() }, [id])

  const deleteExpense = (expenseId) => {
    if (!window.confirm('Delete this expense?')) return
    fetch(`${API}/api/trip-expenses/${expenseId}`, { method: 'DELETE', headers: authHeaders() })
      .then(load)
  }

  if (!data || !data.trip) return <div className="page">Loading...</div>

  const { trip, expenses, total } = data

  return (
    <div className="page">
      <Link to="/travel/trips" className="back-link">← Back</Link>

      <h2 style={{ marginBottom: 4 }}>✈️ {trip.name}</h2>
      {trip.destination && <div className="item-meta" style={{ marginBottom: 16 }}>📍 {trip.destination}</div>}

      <div className="card">
        <div className="item-meta" style={{ marginBottom: 4 }}>Total spent</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary-dark)' }}>
          {trip.currency} {total}
        </div>
      </div>

      <div className="page-header">
        <h3 style={{ margin: 0 }}>Expenses</h3>
        <Link to={`/travel/trip/${id}/add`}>
          <button className="btn btn-primary btn-sm">+ Add</button>
        </Link>
      </div>

      {expenses.length === 0 ? (
        <div className="empty-state">
          <div className="icon">✈️</div>
          <p>No expenses logged for this trip yet.</p>
        </div>
      ) : (
        expenses.map(exp => (
          <div key={exp.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{exp.title}</div>
                <div className="item-meta">
                  {exp.category} · {new Date(exp.expense_date).toLocaleDateString()}
                </div>
                {exp.notes && <div className="item-meta" style={{ marginTop: 4 }}>{exp.notes}</div>}
              </div>
              <span className="item-price" style={{ fontSize: 18 }}>
                {trip.currency} {parseFloat(exp.amount).toFixed(2)}
              </span>
            </div>

            <div className="row-actions">
              <Link to={`/travel/trip/${id}/edit/${exp.id}`} style={{ flex: '1 1 90px' }}>
                <button className="btn btn-success btn-block">✏️ Edit</button>
              </Link>
              <button onClick={() => deleteExpense(exp.id)} className="btn btn-danger" style={{ flex: '1 1 90px' }}>
                🗑 Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default TripDetail
