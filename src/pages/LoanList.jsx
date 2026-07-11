import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { authHeaders } from '../auth'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4003'

function LoanList() {
  const [loans, setLoans] = useState([])
  const [totalOwed, setTotalOwed] = useState(0)

  useEffect(() => {
    fetch(`${API}/api/loans`, { headers: authHeaders() })
      .then(r => r.json())
      .then(setLoans)
    fetch(`${API}/api/loans-summary`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setTotalOwed(d.totalOwed))
  }, [])

  const percentPaid = (loan) => {
    const principal = parseFloat(loan.principal_amount)
    const balance = parseFloat(loan.current_balance)
    if (principal <= 0) return 0
    return Math.round(((principal - balance) / principal) * 100)
  }

  return (
    <div className="page">
      <Link to="/loans" className="back-link">← Back</Link>

      <div className="page-header">
        <h2>💳 My Loans</h2>
        <Link to="/loans/add">
          <button className="btn btn-primary">+ Add</button>
        </Link>
      </div>

      <div className="card">
        <div className="item-meta" style={{ marginBottom: 4 }}>Total still owed</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--danger)' }}>
          ${parseFloat(totalOwed).toFixed(2)}
        </div>
      </div>

      {loans.length === 0 ? (
        <div className="empty-state">
          <div className="icon">💳</div>
          <p>No loans tracked yet — add your first one!</p>
        </div>
      ) : (
        loans.map(loan => (
          <Link key={loan.id} to={`/loans/loan/${loan.id}`} style={{ textDecoration: 'none' }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>{loan.name}</div>
                  <div className="item-meta">
                    {loan.loan_type}{loan.lender ? ` · ${loan.lender}` : ''}
                  </div>
                </div>
                {loan.status === 'paid_off' ? (
                  <span style={{ background: 'var(--success-light)', color: 'var(--success)', padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                    Paid off
                  </span>
                ) : (
                  <span className="item-price" style={{ fontSize: 17 }}>
                    ${parseFloat(loan.current_balance).toFixed(2)}
                  </span>
                )}
              </div>

              {loan.status === 'active' && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ height: 6, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${percentPaid(loan)}%`,
                      background: 'var(--primary-gradient)', borderRadius: 999
                    }} />
                  </div>
                  <div className="item-meta" style={{ marginTop: 4 }}>{percentPaid(loan)}% paid off</div>
                </div>
              )}
            </div>
          </Link>
        ))
      )}
    </div>
  )
}

export default LoanList
