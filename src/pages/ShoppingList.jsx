import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { authHeaders } from '../auth'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4003'

function ShoppingList() {
  const [items, setItems] = useState([])
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState(1)

  const load = () => {
    fetch(`${API}/api/shopping`, { headers: authHeaders() })
      .then(r => r.json())
      .then(all => setItems(all.filter(i => i.item_type === 'list')))
  }

  useEffect(() => { load() }, [])

  const addItem = () => {
    if (!name) return
    fetch(`${API}/api/shopping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ name, item_type: 'list', quantity })
    }).then(() => {
      setName('')
      setQuantity(1)
      load()
    })
  }

  const togglePurchased = (item) => {
    fetch(`${API}/api/shopping/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ ...item, is_purchased: !item.is_purchased })
    }).then(load)
  }

  const deleteItem = (id) => {
    fetch(`${API}/api/shopping/${id}`, { method: 'DELETE', headers: authHeaders() })
      .then(load)
  }

  const pending = items.filter(i => !i.is_purchased)
  const purchased = items.filter(i => i.is_purchased)

  return (
    <div className="page">
      <Link to="/shopping" className="back-link">← Back</Link>
      <h2 style={{ marginBottom: 16 }}>🛒 Shopping List</h2>

      <div className="card">
        <div className="item-edit-row">
          <input className="input" placeholder="Add an item..." value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addItem()} />
          <input className="input" type="number" min="1" value={quantity}
            onChange={e => setQuantity(e.target.value)} />
          <button onClick={addItem} className="btn btn-primary btn-icon">+</button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🛒</div>
          <p>Your shopping list is empty.</p>
        </div>
      ) : (
        <>
          {pending.map(item => (
            <div key={item.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input type="checkbox" checked={false} onChange={() => togglePurchased(item)}
                style={{ width: 20, height: 20, accentColor: 'var(--primary)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{item.name}</div>
                {item.quantity > 1 && <div className="item-meta">Qty: {item.quantity}</div>}
              </div>
              <button onClick={() => deleteItem(item.id)} className="btn btn-danger btn-icon">✕</button>
            </div>
          ))}

          {purchased.length > 0 && (
            <>
              <h3 style={{ margin: '18px 0 10px', color: 'var(--text-muted)', fontSize: 14 }}>
                Purchased ({purchased.length})
              </h3>
              {purchased.map(item => (
                <div key={item.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: 0.6 }}>
                  <input type="checkbox" checked={true} onChange={() => togglePurchased(item)}
                    style={{ width: 20, height: 20, accentColor: 'var(--primary)' }} />
                  <div style={{ flex: 1, textDecoration: 'line-through' }}>{item.name}</div>
                  <button onClick={() => deleteItem(item.id)} className="btn btn-danger btn-icon">✕</button>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  )
}

export default ShoppingList
