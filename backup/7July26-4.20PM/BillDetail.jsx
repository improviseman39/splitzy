import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

const API = 'http://localhost:4003'

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

  if (!data) return <div style={{padding:'20px'}}>Loading...</div>

  const { bill, items, shares } = data

  return (
    <div style={{padding:'20px', maxWidth:'800px', margin:'0 auto'}}>
      <Link to="/" style={{color:'#6c63ff'}}>← Back</Link>
      <h2>{bill.title}</h2>

      <div style={{background:'white', borderRadius:'12px',
        padding:'20px', marginBottom:'15px',
        boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
        <h3 style={{marginTop:0}}>🧾 Items</h3>
        {items.map(item => {
          const itemShares = shares.filter(s => s.item_id === item.id)
          return (
            <div key={item.id} style={{
              display:'flex', justifyContent:'space-between',
              padding:'8px 0', borderBottom:'1px solid #f0f0f0'
            }}>
              <div>
                <div>{item.name}</div>
                <div style={{fontSize:'12px', color:'#999'}}>
                  {itemShares.map(s => `${s.avatar} ${s.name}`).join(', ')}
                </div>
              </div>
              <div style={{fontWeight:'bold'}}>
                {bill.currency} {parseFloat(item.price).toFixed(2)}
              </div>
            </div>
          )
        })}
        <div style={{marginTop:'10px', textAlign:'right',
          fontWeight:'bold', fontSize:'18px', color:'#6c63ff'}}>
          Total: {bill.currency} {parseFloat(bill.total).toFixed(2)}
        </div>
      </div>

      <h3>💰 Who Pays What</h3>
      {summary.map(s => (
        <div key={s.id} style={{
          background:'white', borderRadius:'12px', padding:'15px',
          marginBottom:'10px', boxShadow:'0 2px 8px rgba(0,0,0,0.1)',
          display:'flex', justifyContent:'space-between', alignItems:'center'
        }}>
          <div style={{fontSize:'20px'}}>{s.avatar} {s.name}</div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:'20px', fontWeight:'bold', color:'#6c63ff'}}>
              {bill.currency} {s.total}
            </div>
            <div style={{fontSize:'12px', color:'#999'}}>
              Items: {s.subtotal} + Tax: {s.tax} + Tip: {s.tip}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default BillDetail