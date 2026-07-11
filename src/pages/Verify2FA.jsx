import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTempToken, clearTempToken, setToken } from '../auth'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4003'

function Verify2FA() {
  const navigate = useNavigate()
  const tempToken = getTempToken()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!tempToken) navigate('/login')
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch(`${API}/api/auth/verify-2fa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tempToken, code })
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Incorrect code')
      setLoading(false)
      return
    }
    setToken(data.token)
    clearTempToken()
    navigate('/')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🔐</div>
        <h2>Enter your code</h2>
        <p className="auth-subtitle">Open your authenticator app</p>

        {error && <div className="error-text">{error}</div>}

        <form onSubmit={submit}>
          <input className="code-input" type="text" inputMode="numeric" maxLength={6}
            placeholder="000000" value={code} autoFocus
            onChange={e => setCode(e.target.value.replace(/\D/g, ''))} required />
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify & Log In'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Verify2FA
