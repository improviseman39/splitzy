import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { authHeaders } from '../auth'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4003'

function HouseholdExpenses() {
  const [expenses, setExpenses] = useState([])
  const [summary, setSummary] = useState({ monthTotal: 0, byCategory: [] })

  const load = () => {
    fetch(`${API}/api/household`, { headers: authHeaders() })
      .then(r => r.json())
      .then(setExpenses)
    fetch(`${API}/api/household/summary`, { headers: authHeaders() })
      .then(r => r.json())
      .then(setSummary)
  }

  useEffect(() => { load() }, [])

  const deleteExpense = (id) => {
    if (!window.confirm('Delete this expense?')) return
    fetch(`${API}/api/household/${id}`, { method: 'DELETE', headers: authHeaders() })
      .then(load)
  }

  return (
    <div className="page">
      <Link to="/household" className="back-link">← Back</Link>

      <div className="page-header">
        <h2>🏠 Monthly Expenses</h2>
        <Link to="/household/add">
          <button className="btn btn-primary">+ Add</button>
        </Link>
      </div>

      <div className="card">
        <div className="item-meta" style={{ marginBottom: 4 }}>This month's total</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary-dark)' }}>
          ${parseFloat(summary.monthTotal || 0).toFixed(2)}
        </div>

        {summary.byCategory && summary.byCategory.length > 0 && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '2px solid var(--border)' }}>
            {summary.byCategory.map(c => (
              <div key={c.category} className="summary-line">
                <span>{c.category}</span>
                <span>${parseFloat(c.total).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {expenses.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🏠</div>
          <p>No expenses yet — add your first one!</p>
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
                ${parseFloat(exp.amount).toFixed(2)}
              </span>
            </div>

            <div className="row-actions">
              <Link to={`/household/edit/${exp.id}`} style={{ flex: '1 1 90px' }}>
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

export default HouseholdExpenses
