import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { authHeaders } from '../auth'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4003'

function daysUntil(dateStr) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr)
  return Math.round((due - today) / (1000 * 60 * 60 * 24))
}

function ReminderList() {
  const [items, setItems] = useState([])

  const load = () => {
    fetch(`${API}/api/bills-reminders`, { headers: authHeaders() })
      .then(r => r.json())
      .then(setItems)
  }

  useEffect(() => { load() }, [])

  const markPaid = (id) => {
    fetch(`${API}/api/bills-reminders/${id}/mark-paid`, {
      method: 'POST', headers: authHeaders()
    }).then(load)
  }

  const deleteItem = (id) => {
    if (!window.confirm('Delete this reminder?')) return
    fetch(`${API}/api/bills-reminders/${id}`, { method: 'DELETE', headers: authHeaders() })
      .then(load)
  }

  const unpaid = items.filter(i => !i.is_paid)
  const overdue = unpaid.filter(i => daysUntil(i.due_date) < 0)
  const thisWeek = unpaid.filter(i => daysUntil(i.due_date) >= 0 && daysUntil(i.due_date) <= 7)
  const later = unpaid.filter(i => daysUntil(i.due_date) > 7)
  const done = items.filter(i => i.is_paid)

  const Section = ({ title, list, tone }) => list.length === 0 ? null : (
    <>
      <h3 style={{ margin: '18px 0 10px', fontSize: 14, color: 'var(--text-muted)' }}>{title}</h3>
      {list.map(item => {
        const d = daysUntil(item.due_date)
        return (
          <div key={item.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{item.title}</div>
                <div className="item-meta">
                  {item.category}
                  {item.recurrence !== 'none' && ` · repeats ${item.recurrence}`}
                </div>
                <div className="item-meta" style={{ marginTop: 2, color: tone }}>
                  {new Date(item.due_date).toLocaleDateString()}
                  {!item.is_paid && (
                    d < 0 ? ` · ${Math.abs(d)}d overdue` : d === 0 ? ' · due today' : ` · in ${d}d`
                  )}
                </div>
              </div>
              {item.amount && (
                <span className="item-price" style={{ fontSize: 17 }}>${parseFloat(item.amount).toFixed(2)}</span>
              )}
            </div>

            <div className="row-actions">
              {!item.is_paid && (
                <button onClick={() => markPaid(item.id)} className="btn btn-success" style={{ flex: '1 1 90px' }}>
                  ✓ {item.recurrence === 'none' ? 'Mark Paid' : 'Paid — Next Due'}
                </button>
              )}
              <Link to={`/bills-reminders/edit/${item.id}`} style={{ flex: '1 1 90px' }}>
                <button className="btn btn-ghost btn-block">✏️ Edit</button>
              </Link>
              <button onClick={() => deleteItem(item.id)} className="btn btn-danger" style={{ flex: '1 1 90px' }}>
                🗑 Delete
              </button>
            </div>
          </div>
        )
      })}
    </>
  )

  return (
    <div className="page">
      <Link to="/bills-reminders" className="back-link">← Back</Link>

      <div className="page-header">
        <h2>🔔 Upcoming</h2>
        <Link to="/bills-reminders/add">
          <button className="btn btn-primary">+ Add</button>
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🔔</div>
          <p>Nothing tracked yet — add your first bill or reminder!</p>
        </div>
      ) : (
        <>
          <Section title={`Overdue (${overdue.length})`} list={overdue} tone="var(--danger)" />
          <Section title={`Due This Week (${thisWeek.length})`} list={thisWeek} tone="var(--primary-dark)" />
          <Section title={`Later (${later.length})`} list={later} tone="var(--text-muted)" />
          <Section title={`Done (${done.length})`} list={done} tone="var(--text-muted)" />
        </>
      )}
    </div>
  )
}

export default ReminderList
