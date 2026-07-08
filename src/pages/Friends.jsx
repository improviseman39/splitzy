import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4003'
const AVATARS = ['😊','👦','👩','🧑','👨','👱','🧔','👴','👵','🧒']

function Friends() {
  const [users, setUsers] = useState([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [avatar, setAvatar] = useState('😊')

  useEffect(() => {
    fetch(`${API}/api/users`)
      .then(r => r.json())
      .then(d => setUsers(d))
  }, [])

  const add = () => {
    if (!name) return alert('Please fill in a name')
    fetch(`${API}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email: email || null, avatar, phone: phone || null })
    })
      .then(r => r.json())
      .then(u => {
        setUsers([...users, u])
        setName('')
        setEmail('')
        setPhone('')
        setAvatar('😊')
      })
  }

  return (
    <div style={{padding:'20px', maxWidth:'800px', margin:'0 auto'}}>
      <h2>👥 Friends</h2>

      <div style={{background:'white', borderRadius:'12px',
        padding:'20px', marginBottom:'20px',
        boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
        <h3 style={{marginTop:0}}>Add Friend</h3>

        <div style={{marginBottom:'10px'}}>
          <label style={{display:'block', marginBottom:'5px'}}>
            Pick Avatar
          </label>
          <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
            {AVATARS.map(a => (
              <button key={a} onClick={() => setAvatar(a)}
                style={{fontSize:'24px', padding:'5px', cursor:'pointer',
                  border: avatar === a
                    ? '2px solid #6c63ff'
                    : '2px solid transparent',
                  borderRadius:'8px', background:'transparent'}}>
                {a}
              </button>
            ))}
          </div>
        </div>

        <input placeholder="Name *" value={name}
          onChange={e => setName(e.target.value)}
          style={{width:'100%', padding:'10px', borderRadius:'8px',
            border:'1px solid #ddd', marginBottom:'10px',
            boxSizing:'border-box', fontSize:'16px'}} />

        <input placeholder="Email (optional)" value={email}
          onChange={e => setEmail(e.target.value)}
          style={{width:'100%', padding:'10px', borderRadius:'8px',
            border:'1px solid #ddd', marginBottom:'10px',
            boxSizing:'border-box', fontSize:'16px'}} />

        <input placeholder="Phone (optional)" value={phone}
          onChange={e => setPhone(e.target.value)}
          style={{width:'100%', padding:'10px', borderRadius:'8px',
            border:'1px solid #ddd', marginBottom:'10px',
            boxSizing:'border-box', fontSize:'16px'}} />

        <button onClick={add}
          style={{width:'100%', padding:'12px', background:'#6c63ff',
            color:'white', border:'none', borderRadius:'8px',
            fontSize:'16px', cursor:'pointer'}}>
          Add Friend
        </button>
      </div>

      {users.map(u => (
        <div key={u.id} style={{
          background:'white', borderRadius:'12px', padding:'15px',
          marginBottom:'10px', boxShadow:'0 2px 8px rgba(0,0,0,0.1)',
          display:'flex', alignItems:'center', gap:'15px'
        }}>
          <span style={{fontSize:'30px'}}>{u.avatar}</span>
          <div>
            <div style={{fontWeight:'bold'}}>{u.name}</div>
            {u.email && (
              <div style={{color:'#999', fontSize:'13px'}}>✉️ {u.email}</div>
            )}
            {u.phone && (
              <div style={{color:'#999', fontSize:'13px'}}>📞 {u.phone}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default Friends
