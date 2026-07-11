import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setTempToken } from '../auth'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4003'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Login failed')
        setLoading(false)
        return
      }
      setTempToken(data.tempToken)
      navigate(data.step === 'setup-2fa' ? '/setup-2fa' : '/verify-2fa')
    } catch {
      setError('Could not reach the server')
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">💜</div>
        <h2>Welcome back</h2>
        <p className="auth-subtitle">Log in to Splitzy</p>

        {error && <div className="error-text">{error}</div>}

        <form onSubmit={submit}>
          <input className="input" type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)} required
            style={{ marginBottom: 10 }} />
          <input className="input" type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)} required
            style={{ marginBottom: 18 }} />
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Checking...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
