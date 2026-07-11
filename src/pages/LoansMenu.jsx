import { Link } from 'react-router-dom'

function LoansMenu() {
  return (
    <div className="page">
      <Link to="/" className="back-link">← Back</Link>
      <h2 style={{ marginBottom: 18 }}>💳 Loans & Debts</h2>
      <div className="menu-list">
        <Link to="/loans/list" className="menu-row">
          My Loans <span className="chevron">›</span>
        </Link>
        <Link to="/loans/add" className="menu-row">
          + Add Loan <span className="chevron">›</span>
        </Link>
      </div>
    </div>
  )
}

export default LoansMenu
