import { Link } from 'react-router-dom'

function SplitzyMenu() {
  return (
    <div className="page">
      <Link to="/" className="back-link">← Back</Link>
      <h2 style={{ marginBottom: 18 }}>🧾 Splitzy</h2>
      <div className="menu-list">
        <Link to="/splitzy/bills" className="menu-row">
          Recent Bills <span className="chevron">›</span>
        </Link>
        <Link to="/new" className="menu-row">
          + New Bill <span className="chevron">›</span>
        </Link>
        <Link to="/friends" className="menu-row">
          👥 Friends <span className="chevron">›</span>
        </Link>
      </div>
    </div>
  )
}

export default SplitzyMenu
