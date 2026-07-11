import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { authHeaders } from '../auth'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4003'

function LoanDetail() {
  const { id } = useParams()
  const [data, setData] = useState(null)

  const load = () => {
    fetch(`${API}/api/loans/${id}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(setData)
  }

  useEffect(() => { load() }, [id])

  const deletePayment = (paymentId) => {
    if (!window.confirm('Delete this payment? The amount will be added back to the balance.')) return
    fetch(`${API}/api/loan-payments/${paymentId}`, { method: 'DELETE', headers: authHeaders() })
      .then(load)
  }

  const deleteLoan = () => {
    if (!window.confirm('Delete this loan and all its payment history? This cannot be undone.')) return
    fetch(`${API}/api/loans/${id}`, { method: 'DELETE', headers: authHeaders() })
      .then(() => window.location.href = '/loans/list')
  }

  if (!data || !data.loan) return <div className="page">Loading...</div>

  const { loan, payments } = data
  const principal = parseFloat(loan.principal_amount)
  const balance = parseFloat(loan.current_balance)
  const percentPaid = principal > 0 ? Math.round(((principal - balance) / principal) * 100) : 0

  return (
    <div className="page">
      <Link to="/loans/list" className="back-link">← Back</Link>

      <h2 style={{ marginBottom: 4 }}>💳 {loan.name}</h2>
      <div className="item-meta" style={{ marginBottom: 16 }}>
        {loan.loan_type}{loan.lender ? ` · ${loan.lender}` : ''}
      </div>

      <div className="card">
        {loan.status === 'paid_off' ? (
          <div style={{ textAlign: 'center', color: 'var(--success)', fontWeight: 700, fontSize: 18 }}>
            ✅ Paid off!
          </div>
        ) : (
          <>
            <div className="item-meta" style={{ marginBottom: 4 }}>Remaining balance</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--danger)' }}>
              ${balance.toFixed(2)}
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ height: 8, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${percentPaid}%`,
                  background: 'var(--primary-gradient)', borderRadius: 999
                }} />
              </div>
              <div className="item-meta" style={{ marginTop: 4 }}>
                {percentPaid}% paid off · ${principal.toFixed(2)} original
              </div>
            </div>
          </>
        )}

        {(loan.interest_rate || loan.minimum_payment || loan.due_day) && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '2px solid var(--border)' }}>
            {loan.interest_rate && (
              <div className="summary-line"><span>Interest rate</span><span>{loan.interest_rate}%</span></div>
            )}
            {loan.minimum_payment && (
              <div className="summary-line"><span>Minimum payment</span><span>${parseFloat(loan.minimum_payment).toFixed(2)}</span></div>
            )}
            {loan.due_day && (
              <div className="summary-line"><span>Due day</span><span>{loan.due_day}th of each month</span></div>
            )}
          </div>
        )}
      </div>

      {loan.status === 'active' && (
        <Link to={`/loans/loan/${id}/pay`}>
          <button className="btn btn-primary btn-block" style={{ marginBottom: 15 }}>
            💵 Log a Payment
          </button>
        </Link>
      )}

      <h3 style={{ margin: '18px 0 10px' }}>Payment History</h3>
      {payments.length === 0 ? (
        <div className="empty-state">
          <div className="icon">💵</div>
          <p>No payments logged yet.</p>
        </div>
      ) : (
        payments.map(p => (
          <div key={p.id} className="card" style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <div style={{ fontWeight: 600 }}>${parseFloat(p.amount).toFixed(2)}</div>
              <div className="item-meta">{new Date(p.payment_date).toLocaleDateString()}</div>
              {p.notes && <div className="item-meta">{p.notes}</div>}
            </div>
            <button onClick={() => deletePayment(p.id)} className="btn btn-danger btn-sm">
              Undo
            </button>
          </div>
        ))
      )}

      <button onClick={deleteLoan} className="btn btn-outline btn-block" style={{ marginTop: 20, borderColor: 'var(--danger)', color: 'var(--danger)' }}>
        Delete This Loan
      </button>
    </div>
  )
}

export default LoanDetail
