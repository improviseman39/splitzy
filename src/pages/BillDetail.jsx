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

  if (!data) return <div style={{padding:'20px'}}>Loading...</div>

  const { bill, items, shares } = data

  return (
    <div style={{padding:'20px', maxWidth:'800px', margin:'0 auto'}}>

      {/* ── Top bar with Back and Edit ── */}
      <div style={{display:'flex', justifyContent:'space-between',
        alignItems:'center', marginBottom:'15px'}}>
        <Link to="/" style={{color:'#6c63ff', textDecoration:'none',
          fontWeight:'bold'}}>
          ← Back
        </Link>
        <Link to={`/edit/${id}`}>
          <button style={{padding:'8px 16px', background:'#2ed573',
            color:'white', border:'none', borderRadius:'8px',
            cursor:'pointer', fontWeight:'bold'}}>
            ✏️ Edit Bill
          </button>
        </Link>
      </div>

      <h2 style={{marginTop:0}}>{bill.title}</h2>

      {/* ── Receipt Photo (if exists) ── */}
      {bill.photo && (
        <div style={{background:'white', borderRadius:'12px',
          padding:'15px', marginBottom:'15px',
          boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
          <h3 style={{marginTop:0}}>📷 Receipt Photo</h3>
          <img src={bill.photo} alt="Receipt"
            style={{width:'100%', borderRadius:'8px',
              maxHeight:'300px', objectFit:'cover'}} />
        </div>
      )}

      {/* ── Items List ── */}
      <div style={{background:'white', borderRadius:'12px',
        padding:'20px', marginBottom:'15px',
        boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
        <h3 style={{marginTop:0}}>🧾 Items</h3>
        {items.map(item => {
          const itemShares = shares.filter(s => s.item_id === item.id)
          return (
            <div key={item.id} style={{
              display:'flex', justifyContent:'space-between',
              padding:'10px 0', borderBottom:'1px solid #f0f0f0'
            }}>
              <div>
                <div style={{fontWeight:'500'}}>{item.name}</div>
                <div style={{fontSize:'12px', color:'#999', marginTop:'3px'}}>
                  {itemShares.length > 0
                    ? itemShares.map(s => `${s.avatar} ${s.name}`).join(', ')
                    : 'No one assigned'}
                </div>
              </div>
              <div style={{fontWeight:'bold'}}>
                {bill.currency} {parseFloat(item.price).toFixed(2)}
              </div>
            </div>
          )
        })}

        {/* Totals */}
        <div style={{marginTop:'12px', paddingTop:'12px',
          borderTop:'2px solid #f0f0f0'}}>
          <div style={{display:'flex', justifyContent:'space-between',
            color:'#999', fontSize:'14px', marginBottom:'4px'}}>
            <span>Tax:</span>
            <span>{bill.currency} {parseFloat(bill.tax).toFixed(2)}</span>
          </div>
          <div style={{display:'flex', justifyContent:'space-between',
            color:'#999', fontSize:'14px', marginBottom:'8px'}}>
            <span>Tip:</span>
            <span>{bill.currency} {parseFloat(bill.tip).toFixed(2)}</span>
          </div>
          <div style={{display:'flex', justifyContent:'space-between',
            fontWeight:'bold', fontSize:'18px', color:'#6c63ff'}}>
            <span>Total:</span>
            <span>{bill.currency} {parseFloat(bill.total).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* ── Who Pays What ── */}
      <h3>💰 Who Pays What</h3>
      {summary.length === 0 ? (
        <div style={{background:'white', borderRadius:'12px',
          padding:'20px', textAlign:'center', color:'#999',
          boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
          No one assigned to items yet.
          <br/>
          <Link to={`/edit/${id}`} style={{color:'#6c63ff'}}>
            Edit bill to assign items →
          </Link>
        </div>
      ) : (
        summary.map(s => (
          <div key={s.id} style={{
            background:'white', borderRadius:'12px', padding:'15px',
            marginBottom:'10px', boxShadow:'0 2px 8px rgba(0,0,0,0.1)',
            display:'flex', justifyContent:'space-between', alignItems:'center'
          }}>
            <div style={{fontSize:'20px'}}>{s.avatar} {s.name}</div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:'22px', fontWeight:'bold', color:'#6c63ff'}}>
                {bill.currency} {s.total}
              </div>
              <div style={{fontSize:'12px', color:'#999', marginTop:'3px'}}>
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
