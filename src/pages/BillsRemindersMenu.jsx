import { Link } from 'react-router-dom'

function BillsRemindersMenu() {
  return (
    <div className="page">
      <Link to="/" className="back-link">← Back</Link>
      <h2 style={{ marginBottom: 18 }}>🔔 Bills & Reminders</h2>
      <div className="menu-list">
        <Link to="/bills-reminders/list" className="menu-row">
          Upcoming <span className="chevron">›</span>
        </Link>
        <Link to="/bills-reminders/add" className="menu-row">
          + Add Bill / Reminder <span className="chevron">›</span>
        </Link>
      </div>
    </div>
  )
}

export default BillsRemindersMenu
