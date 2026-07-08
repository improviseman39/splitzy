import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API = 'http://localhost:4003'
const CURRENCIES = ['AUD','USD','THB','SGD','GBP','EUR']

function NewBill() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [title, setTitle] = useState('')
  const [tax, setTax] = useState(0)
  const [tip, setTip] = useState(0)
  const [currency, setCurrency] = useState('AUD')
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

  const subtotal = items.reduce(
    (s, i) => s + (parseFloat(i.price) || 0), 0
  )
  const total = subtotal + parseFloat(tax||0) + parseFloat(tip||0)

  const save = () => {
    if (!title) return alert('Please enter a bill title')
    fetch(`${API}/api/bills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, total, tax, tip, currency, items })
    }).then(() => navigate('/'))
  }

  return (
    <div style={{padding:'20px', maxWidth:'800px', margin:'0 auto'}}>
      <h2>🧾 New Bill</h2>

      <div style={{background:'white', borderRadius:'12px',
        padding:'20px', marginBottom:'15px',
        boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>

        <label style={{display:'block', marginBottom:'5px', fontWeight:'bold'}}>
          Bill Title
        </label>
        <input value={title} onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Dinner at Restaurant"
          style={{width:'100%', padding:'10px', borderRadius:'8px',
            border:'1px solid #ddd', fontSize:'16px',
            boxSizing:'border-box', marginBottom:'15px'}} />

        <div style={{display:'flex', gap:'10px'}}>
          <div style={{flex:1}}>
            <label style={{display:'block', marginBottom:'5px', fontWeight:'bold'}}>
              Currency
            </label>
            <select value={currency} onChange={e => setCurrency(e.target.value)}
              style={{width:'100%', padding:'10px', borderRadius:'8px',
                border:'1px solid #ddd', fontSize:'16px'}}>
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{flex:1}}>
            <label style={{display:'block', marginBottom:'5px', fontWeight:'bold'}}>
              Tax
            </label>
            <input type="number" value={tax}
              onChange={e => setTax(e.target.value)}
              style={{width:'100%', padding:'10px', borderRadius:'8px',
                border:'1px solid #ddd', fontSize:'16px',
                boxSizing:'border-box'}} />
          </div>
          <div style={{flex:1}}>
            <label style={{display:'block', marginBottom:'5px', fontWeight:'bold'}}>
              Tip
            </label>
            <input type="number" value={tip}
              onChange={e => setTip(e.target.value)}
              style={{width:'100%', padding:'10px', borderRadius:'8px',
                border:'1px solid #ddd', fontSize:'16px',
                boxSizing:'border-box'}} />
          </div>
        </div>
      </div>

      <h3>Items</h3>
      {items.map((item, index) => (
        <div key={index} style={{background:'white', borderRadius:'12px',
          padding:'15px', marginBottom:'10px',
          boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
          <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
            <input placeholder="Item name" value={item.name}
              onChange={e => updateItem(index, 'name', e.target.value)}
              style={{flex:2, padding:'8px', borderRadius:'8px',
                border:'1px solid #ddd'}} />
            <input placeholder="Price" type="number" value={item.price}
              onChange={e => updateItem(index, 'price', e.target.value)}
              style={{flex:1, padding:'8px', borderRadius:'8px',
                border:'1px solid #ddd'}} />
            <button onClick={() => removeItem(index)}
              style={{padding:'8px 12px', background:'#ff4757',
                color:'white', border:'none', borderRadius:'8px',
                cursor:'pointer'}}>✕</button>
          </div>

          <div style={{fontSize:'13px', color:'#999', marginBottom:'5px'}}>
            Who shared this item?
          </div>
          <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
            {users.map(u => (
              <button key={u.id} onClick={() => toggleShare(index, u.id)}
                style={{padding:'5px 12px', borderRadius:'20px',
                  cursor:'pointer', border:'2px solid #6c63ff',
                  fontSize:'13px',
                  background: item.sharedBy.includes(u.id) ? '#6c63ff' : 'white',
                  color: item.sharedBy.includes(u.id) ? 'white' : '#6c63ff'}}>
                {u.avatar} {u.name}
              </button>
            ))}
          </div>
        </div>
      ))}

      <button onClick={addItem}
        style={{width:'100%', padding:'12px', background:'white',
          border:'2px dashed #6c63ff', borderRadius:'12px',
          color:'#6c63ff', cursor:'pointer', fontSize:'16px',
          marginBottom:'15px'}}>
        + Add Item
      </button>

      <div style={{background:'white', borderRadius:'12px',
        padding:'15px', marginBottom:'15px',
        boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
        <div style={{display:'flex', justifyContent:'space-between',
          marginBottom:'5px'}}>
          <span>Subtotal:</span>
          <span>{currency} {subtotal.toFixed(2)}</span>
        </div>
        <div style={{display:'flex', justifyContent:'space-between',
          marginBottom:'5px'}}>
          <span>Tax:</span>
          <span>{currency} {parseFloat(tax||0).toFixed(2)}</span>
        </div>
        <div style={{display:'flex', justifyContent:'space-between',
          marginBottom:'5px'}}>
          <span>Tip:</span>
          <span>{currency} {parseFloat(tip||0).toFixed(2)}</span>
        </div>
        <hr/>
        <div style={{display:'flex', justifyContent:'space-between',
          fontWeight:'bold', fontSize:'18px'}}>
          <span>Total:</span>
          <span style={{color:'#6c63ff'}}>{currency} {total.toFixed(2)}</span>
        </div>
      </div>

      <button onClick={save}
        style={{width:'100%', padding:'15px', background:'#6c63ff',
          color:'white', border:'none', borderRadius:'12px',
          fontSize:'18px', cursor:'pointer', fontWeight:'bold'}}>
        💾 Save Bill
      </button>
    </div>
  )
}

export default NewBill