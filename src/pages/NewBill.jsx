import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4003'
const CURRENCIES = ['AUD', 'USD', 'THB', 'SGD', 'GBP', 'EUR']

function NewBill() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [title, setTitle] = useState('')
  const [tax, setTax] = useState(0)
  const [tip, setTip] = useState(0)
  const [currency, setCurrency] = useState('AUD')
  const [photo, setPhoto] = useState(null)
  const [items, setItems] = useState([
    { name: '', price: '', sharedBy: [] }
  ])

  useEffect(() => {
    fetch(`${API}/api/users`)
      .then(r => r.json())
      .then(d => setUsers(d))
  }, [])

  const addItem = () => {
    setItems([...items, { name: '', price: '', sharedBy: [] }])
  }

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index, field, value) => {
    const updated = [...items]
    updated[index][field] = value
    setItems(updated)
  }

  const toggleShare = (itemIndex, userId) => {
    const updated = [...items]
    const shared = updated[itemIndex].sharedBy
    if (shared.includes(userId)) {
      updated[itemIndex].sharedBy = shared.filter(id => id !== userId)
    } else {
      updated[itemIndex].sharedBy = [...shared, userId]
    }
    setItems(updated)
  }

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setPhoto(reader.result)
    reader.readAsDataURL(file)
  }

  const subtotal = items.reduce((s, i) => s + (parseFloat(i.price) || 0), 0)
  const total = subtotal + parseFloat(tax || 0) + parseFloat(tip || 0)

  const save = () => {
    if (!title) return alert('Please enter a bill title')
    fetch(`${API}/api/bills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, total, tax, tip, currency, items, photo })
    }).then(() => navigate("/splitzy/bills"))
  }

  return (
    <div className="page">
      <Link to="/splitzy" className="back-link">← Back</Link>
      <h2 style={{ marginBottom: 16 }}>🧾 New Bill</h2>

      <div className="card">
        <label className="label">Bill Title</label>
        <input className="input" value={title} onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Dinner at Restaurant" style={{ marginBottom: 15 }} />

        <div className="form-row">
          <div className="field">
            <label className="label">Currency</label>
            <select className="input" value={currency} onChange={e => setCurrency(e.target.value)}>
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="label">Tax</label>
            <input className="input" type="number" value={tax} onChange={e => setTax(e.target.value)} />
          </div>
          <div className="field">
            <label className="label">Tip</label>
            <input className="input" type="number" value={tip} onChange={e => setTip(e.target.value)} />
          </div>
        </div>
      </div>

      <h3 style={{ margin: '18px 0 10px' }}>Items</h3>
      {items.map((item, index) => (
        <div key={index} className="card">
          <div className="item-edit-row">
            <input className="input" placeholder="Item name" value={item.name}
              onChange={e => updateItem(index, 'name', e.target.value)} />
            <input className="input" placeholder="Price" type="number" value={item.price}
              onChange={e => updateItem(index, 'price', e.target.value)} />
            <button onClick={() => removeItem(index)} className="btn btn-danger btn-icon">✕</button>
          </div>

          <div className="item-meta" style={{ marginBottom: 6 }}>Who shared this item?</div>
          <div className="pill-group">
            {users.map(u => (
              <button key={u.id} onClick={() => toggleShare(index, u.id)}
                className={`avatar-pill ${item.sharedBy.includes(u.id) ? 'active' : ''}`}>
                {u.avatar} {u.name}
              </button>
            ))}
          </div>
        </div>
      ))}

      <button onClick={addItem} className="btn btn-outline btn-block" style={{ marginBottom: 15 }}>
        + Add Item
      </button>

      <div className="card">
        <h3>📷 Receipt Photo (Optional)</h3>
        <input type="file" accept="image/*" onChange={handlePhoto} style={{ marginBottom: 10, width: '100%' }} />
        {photo && (
          <div>
            <img src={photo} alt="Receipt" className="thumb" style={{ maxHeight: 250, marginBottom: 8 }} />
            <button onClick={() => setPhoto(null)} className="btn btn-danger btn-sm">
              ✕ Remove Photo
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <div className="summary-line"><span>Subtotal:</span><span>{currency} {subtotal.toFixed(2)}</span></div>
        <div className="summary-line"><span>Tax:</span><span>{currency} {parseFloat(tax || 0).toFixed(2)}</span></div>
        <div className="summary-line"><span>Tip:</span><span>{currency} {parseFloat(tip || 0).toFixed(2)}</span></div>
        <div className="summary-total"><span>Total:</span><span>{currency} {total.toFixed(2)}</span></div>
      </div>

      <button onClick={save} className="btn btn-primary btn-block" style={{ padding: 15, fontSize: 17 }}>
        💾 Save Bill
      </button>
    </div>
  )
}

export default NewBill
