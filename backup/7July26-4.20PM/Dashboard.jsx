import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const API = 'http://localhost:4003'

function Dashboard() {
  const [bills, setBills] = useState([])

  useEffect(() => {
    fetch(`${API}/api/bills`)
      .then(r => r.json())
      .then(d => setBills(d))
  }, [])

  const deleteBill = (id) => {
    fetch(`${API}/api/bills/${id}`, { method: 'DELETE' })
      .then(() => setBills(bills.filter(b => b.id !== id)))
  }

  return (
    <div style={{padding:'20px', maxWidth:'800px', margin:'0 auto'}}>
      <div style={{display:'flex', justifyContent:'space-between',
        alignItems:'center', marginBottom:'20px'}}>
        <h2 style={{margin:0}}>📋 Recent Bills</h2>
        <Link to="/new">
          <button style={{padding:'10px 20px', background:'#6c63ff',
            color:'white', border:'none', borderRadius:'8px',
            cursor:'pointer', fontSize:'16px'}}>
            + New Bill
          </button>
        </Link>
      </div>

      {bills.length === 0 ? (
        <div style={{textAlign:'center', padding:'60px', color:'#999'}}>
          <div style={{fontSize:'60px'}}>🧾</div>
          <p>No bills yet — create your first one!</p>
        </div>
      ) : (
        bills.map(b => (
          <div key={b.id} style={{
            background:'white', borderRadius:'12px', padding:'15px',
            marginBottom:'10px', boxShadow:'0 2px 8px rgba(0,0,0,0.1)',
            display:'flex', justifyContent:'space-between', alignItems:'center'
          }}>
            <div>
              <div style={{fontWeight:'bold', fontSize:'16px'}}>{b.title}</div>
              <div style={{color:'#999', fontSize:'13px'}}>
                {new Date(b.created_at).toLocaleDateString()}
              </div>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
              <span style={{fontWeight:'bold', fontSize:'18px', color:'#6c63ff'}}>
                {b.currency} {parseFloat(b.total).toFixed(2)}
              </span>
              <Link to={`/bill/${b.id}`}>
                <button style={{padding:'6px 12px', background:'#6c63ff',
                  color:'white', border:'none', borderRadius:'6px',
                  cursor:'pointer'}}>
                  View
                </button>
              </Link>
              <button onClick={() => deleteBill(b.id)}
                style={{padding:'6px 12px', background:'#ff4757',
                  color:'white', border:'none', borderRadius:'6px',
                  cursor:'pointer'}}>
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default Dashboard