import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4003'

function BillDetail() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [summary, setSummary] = useState([])

  useEffect(() => {
    fetch(`${API}/api/bills/${id}`)
      .then(r => r.json())
      .then(d => setData(d))
    fetch(`${API}/api/bills/${id}/summary`)
      .then(r => r.json())
      .then(d => setSummary(d))
  }, [id])

  if (!data) return <div className="page">Loading...</div>

  const { bill, items, shares } = data

  return (
    <div className="page">
      <div className="page-header">
        <Link to="/splitzy/bills" className="link">← Back</Link>
        <Link to={`/edit/${id}`}>
          <button className="btn btn-success">✏️ Edit Bill</button>
        </Link>
      </div>

      <h2 style={{ marginBottom: 16 }}>{bill.title}</h2>

      {bill.photo && (
        <div className="card">
          <h3>📷 Receipt Photo</h3>
          <img src={bill.photo} alt="Receipt" className="thumb" style={{ maxHeight: 300 }} />
        </div>
      )}

      <div className="card">
        <h3>🧾 Items</h3>
        {items.map(item => {
          const itemShares = shares.filter(s => s.item_id === item.id)
          return (
            <div key={item.id} className="item-row">
              <div>
                <div className="item-name">{item.name}</div>
                <div className="item-meta">
                  {itemShares.length > 0
                    ? itemShares.map(s => `${s.avatar} ${s.name}`).join(', ')
                    : 'No one assigned'}
                </div>
              </div>
              <div className="item-price">
                {bill.currency} {parseFloat(item.price).toFixed(2)}
              </div>
            </div>
          )
        })}

        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '2px solid var(--border)' }}>
          <div className="summary-line">
            <span>Tax:</span>
            <span>{bill.currency} {parseFloat(bill.tax).toFixed(2)}</span>
          </div>
          <div className="summary-line">
            <span>Tip:</span>
            <span>{bill.currency} {parseFloat(bill.tip).toFixed(2)}</span>
          </div>
          <div className="summary-total">
            <span>Total:</span>
            <span>{bill.currency} {parseFloat(bill.total).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <h3 style={{ margin: '18px 0 12px' }}>💰 Who Pays What</h3>
      {summary.length === 0 ? (
        <div className="card empty-state" style={{ padding: 30 }}>
          No one assigned to items yet.
          <br />
          <Link to={`/edit/${id}`} className="link">Edit bill to assign items →</Link>
        </div>
      ) : (
        summary.map(s => (
          <div key={s.id} className="card" style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', flexWrap: 'wrap', gap: 10
          }}>
            <div style={{ fontSize: 20 }}>{s.avatar} {s.name}</div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--primary-dark)' }}>
                {bill.currency} {s.total}
              </div>
              <div className="item-meta">
                Items: {s.subtotal} + Tax: {s.tax} + Tip: {s.tip}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default BillDetail
