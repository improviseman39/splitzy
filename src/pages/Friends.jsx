import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4003'
const AVATARS = ['😊', '👦', '👩', '🧑', '👨', '👱', '🧔', '👴', '👵', '🧒']

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
    <div className="page">
      <Link to="/splitzy" className="back-link">← Back</Link>
      <h2 style={{ marginBottom: 16 }}>👥 Friends</h2>

      <div className="card">
        <h3>Add Friend</h3>

        <div style={{ marginBottom: 12 }}>
          <label className="label">Pick Avatar</label>
          <div className="pill-group">
            {AVATARS.map(a => (
              <button key={a} onClick={() => setAvatar(a)}
                className={`avatar-pill ${avatar === a ? 'active' : ''}`}
                style={{ fontSize: 20, padding: '6px 10px' }}>
                {a}
              </button>
            ))}
          </div>
        </div>

        <input className="input" placeholder="Name *" value={name}
          onChange={e => setName(e.target.value)} style={{ marginBottom: 10 }} />

        <input className="input" placeholder="Email (optional)" value={email}
          onChange={e => setEmail(e.target.value)} style={{ marginBottom: 10 }} />

        <input className="input" placeholder="Phone (optional)" value={phone}
          onChange={e => setPhone(e.target.value)} style={{ marginBottom: 14 }} />

        <button onClick={add} className="btn btn-primary btn-block">Add Friend</button>
      </div>

      {users.map(u => (
        <div key={u.id} className="card contact-card">
          <span className="icon-badge" style={{ fontSize: 22 }}>{u.avatar}</span>
          <div>
            <div style={{ fontWeight: 700 }}>{u.name}</div>
            {u.email && <div className="contact-meta">✉️ {u.email}</div>}
            {u.phone && <div className="contact-meta">📞 {u.phone}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}

export default Friends
