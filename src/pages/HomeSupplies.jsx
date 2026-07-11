import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { authHeaders } from '../auth'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4003'

function HomeSupplies() {
  const [items, setItems] = useState([])
  const [name, setName] = useState('')
  const [stockLevel, setStockLevel] = useState(1)
  const [reorderAt, setReorderAt] = useState(1)

  const load = () => {
    fetch(`${API}/api/shopping`, { headers: authHeaders() })
      .then(r => r.json())
      .then(all => setItems(all.filter(i => i.item_type === 'supply')))
  }

  useEffect(() => { load() }, [])

  const addItem = () => {
    if (!name) return
    fetch(`${API}/api/shopping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ name, item_type: 'supply', stock_level: stockLevel, reorder_at: reorderAt })
    }).then(() => {
      setName('')
      setStockLevel(1)
      setReorderAt(1)
      load()
    })
  }

  const adjustStock = (item, delta) => {
    const newLevel = Math.max(0, item.stock_level + delta)
    fetch(`${API}/api/shopping/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ ...item, stock_level: newLevel })
    }).then(load)
  }

  const deleteItem = (id) => {
    fetch(`${API}/api/shopping/${id}`, { method: 'DELETE', headers: authHeaders() })
      .then(load)
  }

  return (
    <div className="page">
      <Link to="/shopping" className="back-link">← Back</Link>
      <h2 style={{ marginBottom: 16 }}>📦 Home Supplies</h2>
      <p className="item-meta" style={{ marginBottom: 14 }}>
        Track everyday items like tissue, toothpaste, or cleaning supplies — see what's running low at a glance.
      </p>

      <div className="card">
        <h3>Add Supply</h3>
        <input className="input" placeholder="e.g. Toothpaste" value={name}
          onChange={e => setName(e.target.value)} style={{ marginBottom: 10 }} />
        <div className="form-row">
          <div className="field">
            <label className="label">Current stock</label>
            <input className="input" type="number" min="0" value={stockLevel}
              onChange={e => setStockLevel(e.target.value)} />
          </div>
          <div className="field">
            <label className="label">Reorder when at</label>
            <input className="input" type="number" min="0" value={reorderAt}
              onChange={e => setReorderAt(e.target.value)} />
          </div>
        </div>
        <button onClick={addItem} className="btn btn-primary btn-block" style={{ marginTop: 12 }}>
          + Add Supply
        </button>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📦</div>
          <p>No supplies tracked yet.</p>
        </div>
      ) : (
        items.map(item => {
          const low = item.stock_level <= item.reorder_at
          return (
            <div key={item.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{item.name}</div>
                  {low && (
                    <span style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                      Running low
                    </span>
                  )}
                </div>
                <button onClick={() => deleteItem(item.id)} className="btn btn-danger btn-icon">✕</button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, marginTop: 14 }}>
                <button onClick={() => adjustStock(item, -1)} className="btn btn-ghost btn-icon" style={{ fontSize: 18 }}>−</button>
                <div style={{ fontSize: 24, fontWeight: 700, minWidth: 40, textAlign: 'center' }}>
                  {item.stock_level}
                </div>
                <button onClick={() => adjustStock(item, 1)} className="btn btn-ghost btn-icon" style={{ fontSize: 18 }}>+</button>
              </div>
              <div className="item-meta" style={{ textAlign: 'center', marginTop: 4 }}>
                Reorder at {item.reorder_at}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

export default HomeSupplies
