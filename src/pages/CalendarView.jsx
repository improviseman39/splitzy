import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { authHeaders } from '../auth'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4003'
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTH_LABELS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

function toDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function CalendarView() {
  const [items, setItems] = useState([])
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selected, setSelected] = useState(() => toDateStr(new Date()))

  useEffect(() => {
    fetch(`${API}/api/bills-reminders`, { headers: authHeaders() })
      .then(r => r.json())
      .then(setItems)
  }, [])

  const markPaid = (id) => {
    fetch(`${API}/api/bills-reminders/${id}/mark-paid`, {
      method: 'POST', headers: authHeaders()
    }).then(() =>
      fetch(`${API}/api/bills-reminders`, { headers: authHeaders() })
        .then(r => r.json())
        .then(setItems)
    )
  }

  const itemsByDate = {}
  items.forEach(item => {
    const key = item.due_date.slice(0, 10)
    if (!itemsByDate[key]) itemsByDate[key] = []
    itemsByDate[key].push(item)
  })

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstDay = new Date(year, month, 1)
  const startOffset = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayStr = toDateStr(new Date())

  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))

  const dotColor = (dayItems) => {
    if (dayItems.every(i => i.is_paid)) return 'var(--text-muted)'
    if (dayItems.some(i => !i.is_paid && i.due_date.slice(0, 10) < todayStr)) return 'var(--danger)'
    return 'var(--primary)'
  }

  const selectedItems = itemsByDate[selected] || []

  return (
    <div className="page">
      <Link to="/bills-reminders" className="back-link">← Back</Link>
      <h2 style={{ marginBottom: 16 }}>📅 Calendar</h2>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <button className="btn btn-ghost btn-icon"
            onClick={() => setCursor(new Date(year, month - 1, 1))}>‹</button>
          <div style={{ fontWeight: 700, fontFamily: 'var(--font-display)' }}>
            {MONTH_LABELS[month]} {year}
          </div>
          <button className="btn btn-ghost btn-icon"
            onClick={() => setCursor(new Date(year, month + 1, 1))}>›</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
          {DAY_LABELS.map((d, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>{d}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {cells.map((date, i) => {
            if (!date) return <div key={i} />
            const dateStr = toDateStr(date)
            const dayItems = itemsByDate[dateStr] || []
            const isToday = dateStr === todayStr
            const isSelected = dateStr === selected
            return (
              <button key={i} onClick={() => setSelected(dateStr)}
                style={{
                  aspectRatio: '1', border: 'none', borderRadius: 10,
                  background: isSelected ? 'var(--primary-light)' : 'transparent',
                  outline: isToday ? '1.5px solid var(--primary)' : 'none',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 2, padding: 0
                }}>
                <span style={{ fontSize: 13, fontWeight: isSelected ? 700 : 500, color: 'var(--text)' }}>
                  {date.getDate()}
                </span>
                {dayItems.length > 0 && (
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: dotColor(dayItems) }} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <h3 style={{ margin: '18px 0 10px' }}>
        {new Date(selected).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
      </h3>

      {selectedItems.length === 0 ? (
        <div className="empty-state" style={{ padding: 30 }}>
          <p>Nothing due this day.</p>
        </div>
      ) : (
        selectedItems.map(item => (
          <div key={item.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <div>
                <div style={{ fontWeight: 700 }}>{item.title}</div>
                <div className="item-meta">{item.category}</div>
              </div>
              {item.amount && <span className="item-price">${parseFloat(item.amount).toFixed(2)}</span>}
            </div>
            {!item.is_paid && (
              <button onClick={() => markPaid(item.id)} className="btn btn-success btn-block" style={{ marginTop: 10 }}>
                ✓ Mark Paid
              </button>
            )}
          </div>
        ))
      )}
    </div>
  )
}

export default CalendarView
