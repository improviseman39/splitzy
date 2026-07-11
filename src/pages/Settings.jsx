import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authHeaders, clearToken } from '../auth'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4003'

function Settings() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')
  const [pwLoading, setPwLoading] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/auth/me`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setEmail(d.email || ''))
  }, [])

  const logout = () => {
    clearToken()
    navigate('/login')
  }

  const resetTwoFA = async () => {
    if (!window.confirm(
      "Reset 2FA? You'll need to scan a new QR code next time you log in."
    )) return

    const res = await fetch(`${API}/api/auth/reset-2fa`, {
      method: 'POST',
      headers: authHeaders()
    })
    if (res.ok) {
      setMessage('2FA reset. Logging you out so you can set it up again...')
      setTimeout(() => {
        clearToken()
        navigate('/login')
      }, 1800)
    } else {
      setMessage('Something went wrong, please try again.')
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    setPwError('')
    setPwSuccess('')

    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      setPwError('New password must be at least 6 characters')
      return
    }

    setPwLoading(true)
    const res = await fetch(`${API}/api/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ currentPassword, newPassword })
    })
    const data = await res.json()
    setPwLoading(false)

    if (!res.ok) {
      setPwError(data.error || 'Could not change password')
      return
    }

    setPwSuccess('Password changed successfully')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="page">
      <h2 style={{ marginBottom: 16 }}>⚙️ Settings</h2>

      <div className="card">
        <h3>Account</h3>
        <div className="item-meta" style={{ marginBottom: 4 }}>Logged in as</div>
        <div style={{ fontWeight: 600, fontSize: 16 }}>{email || '...'}</div>
      </div>

      <div className="card">
        <h3>Change Password</h3>

        {pwError && <div className="error-text">{pwError}</div>}
        {pwSuccess && (
          <div style={{ color: 'var(--success)', fontSize: 13, marginBottom: 12, fontWeight: 600 }}>
            {pwSuccess}
          </div>
        )}

        <form onSubmit={changePassword}>
          <label className="label">Current password</label>
          <input className="input" type="password" value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)} required
            style={{ marginBottom: 10 }} />

          <label className="label">New password</label>
          <input className="input" type="password" value={newPassword}
            onChange={e => setNewPassword(e.target.value)} required
            style={{ marginBottom: 10 }} />

          <label className="label">Confirm new password</label>
          <input className="input" type="password" value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)} required
            style={{ marginBottom: 14 }} />

          <button type="submit" className="btn btn-primary btn-block" disabled={pwLoading}>
            {pwLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Security</h3>
        <p className="item-meta" style={{ marginBottom: 14 }}>
          Lost your phone or switching devices? Reset your 2FA and set it up again with a new QR code.
        </p>
        <button onClick={resetTwoFA} className="btn btn-outline btn-block">
          Reset 2FA
        </button>
      </div>

      {message && (
        <div className="card" style={{ color: 'var(--primary-dark)', fontWeight: 600 }}>
          {message}
        </div>
      )}

      <button onClick={logout} className="btn btn-danger btn-block" style={{ marginTop: 6 }}>
        Log Out
      </button>
    </div>
  )
}

export default Settings
