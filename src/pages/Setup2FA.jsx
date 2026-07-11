import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTempToken, clearTempToken, setToken } from '../auth'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4003'

function Setup2FA() {
  const navigate = useNavigate()
  const tempToken = getTempToken()
  const [qrCode, setQrCode] = useState(null)
  const [secret, setSecret] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!tempToken) {
      navigate('/login')
      return
    }
    fetch(`${API}/api/auth/setup-2fa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tempToken })
    })
      .then(r => r.json())
      .then(d => {
        if (d.qrCode) {
          setQrCode(d.qrCode)
          setSecret(d.secret)
        } else {
          setError(d.error || 'Could not generate QR code')
        }
      })
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch(`${API}/api/auth/verify-2fa-setup`, {
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
        <h2>Set up 2FA</h2>
        <p className="auth-subtitle">Scan this with Google Authenticator or Authy</p>

        {qrCode && (
          <div className="qr-box">
            <img src={qrCode} alt="2FA QR code" />
          </div>
        )}

        {secret && (
          <div className="secret-fallback">
            Can't scan? Enter manually: {secret}
          </div>
        )}

        {error && <div className="error-text">{error}</div>}

        <form onSubmit={submit}>
          <input className="code-input" type="text" inputMode="numeric" maxLength={6}
            placeholder="000000" value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, ''))} required />
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Verifying...' : 'Confirm & Activate'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Setup2FA
