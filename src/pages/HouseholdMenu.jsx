import { Link } from 'react-router-dom'

function HouseholdMenu() {
  return (
    <div className="page">
      <Link to="/" className="back-link">← Back</Link>
      <h2 style={{ marginBottom: 18 }}>🏠 Household</h2>
      <div className="menu-list">
        <Link to="/household/expenses" className="menu-row">
          Monthly Expenses <span className="chevron">›</span>
        </Link>
        <Link to="/household/add" className="menu-row">
          + Add Expense <span className="chevron">›</span>
        </Link>
      </div>
    </div>
  )
}

export default HouseholdMenu
