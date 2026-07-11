import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4003'

function Dashboard() {
  const [bills, setBills] = useState([])

  useEffect(() => {
    fetch(`${API}/api/bills`)
      .then(r => r.json())
      .then(d => setBills(d))
  }, [])

  const deleteBill = (id) => {
    if (!window.confirm('Delete this bill?')) return
    fetch(`${API}/api/bills/${id}`, { method: 'DELETE' })
      .then(() => setBills(bills.filter(b => b.id !== id)))
  }

  return (
    <div className="page">
      <Link to="/splitzy" className="back-link">← Back</Link>

      <div className="page-header">
        <h2>📋 Recent Bills</h2>
        <Link to="/new">
          <button className="btn btn-primary">+ New Bill</button>
        </Link>
      </div>

      {bills.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🧾</div>
          <p>No bills yet — create your first one!</p>
        </div>
      ) : (
        bills.map(b => (
          <div key={b.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{b.title}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  {new Date(b.created_at).toLocaleDateString()}
                </div>
              </div>
              <span className="item-price" style={{ fontSize: 18 }}>
                {b.currency} {parseFloat(b.total).toFixed(2)}
              </span>
            </div>

            {b.photo && (
              <img src={b.photo} alt="Receipt" className="thumb"
                style={{ maxHeight: 120, marginTop: 12 }} />
            )}

            <div className="row-actions">
              <Link to={`/bill/${b.id}`} style={{ flex: '1 1 90px' }}>
                <button className="btn btn-primary btn-block">👁 View</button>
              </Link>
              <Link to={`/edit/${b.id}`} style={{ flex: '1 1 90px' }}>
                <button className="btn btn-success btn-block">✏️ Edit</button>
              </Link>
              <button onClick={() => deleteBill(b.id)} className="btn btn-danger">
                🗑 Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default Dashboard
