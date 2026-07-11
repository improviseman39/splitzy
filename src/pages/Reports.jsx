import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { authHeaders } from '../auth'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4003'

const SOURCE_ICON = { household: '🏠', travel: '✈️', loan: '💳' }

function Reports() {
  const [summary, setSummary] = useState(null)
  const [history, setHistory] = useState([])

  useEffect(() => {
    fetch(`${API}/api/reports/summary`, { headers: authHeaders() })
      .then(r => r.json())
      .then(setSummary)
    fetch(`${API}/api/reports/history?limit=25`, { headers: authHeaders() })
      .then(r => r.json())
      .then(setHistory)
  }, [])

  const breakdown = summary ? [
    { label: '🏠 Household', value: parseFloat(summary.household) },
    { label: '✈️ Travel', value: parseFloat(summary.travel) },
    { label: '💳 Loan Payments', value: parseFloat(summary.loanPayments) },
  ] : []
  const maxValue = Math.max(1, ...breakdown.map(b => b.value))

  return (
    <div className="page">
      <Link to="/" className="back-link">← Back</Link>
      <h2 style={{ marginBottom: 16 }}>📊 Reports</h2>

      {summary && (
        <>
          <div className="card">
            <div className="item-meta" style={{ marginBottom: 4 }}>Total spent this month</div>
            <div style={{ fontSize: 30, fontWeight: 700, color: 'var(--primary-dark)' }}>
              ${summary.overallTotal}
            </div>
          </div>

          <div className="card">
            <h3>By Category</h3>
            {breakdown.map(b => (
              <div key={b.label} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
                  <span>{b.label}</span>
                  <span style={{ fontWeight: 700 }}>${b.value.toFixed(2)}</span>
                </div>
                <div style={{ height: 8, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${(b.value / maxValue) * 100}%`,
                    background: 'var(--primary-gradient)', borderRadius: 999
                  }} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <h3 style={{ margin: '18px 0 10px' }}>Recent Activity</h3>
      {history.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📊</div>
          <p>No spending recorded yet.</p>
        </div>
      ) : (
        history.map((item, i) => (
          <div key={i} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="icon-badge">{SOURCE_ICON[item.source] || '💰'}</span>
              <div>
                <div style={{ fontWeight: 600 }}>{item.title}</div>
                <div className="item-meta">
                  {item.category} · {new Date(item.date).toLocaleDateString()}
                </div>
              </div>
            </div>
            <span className="item-price">${parseFloat(item.amount).toFixed(2)}</span>
          </div>
        ))
      )}
    </div>
  )
}

export default Reports
