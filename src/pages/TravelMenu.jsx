import { Link } from 'react-router-dom'

function TravelMenu() {
  return (
    <div className="page">
      <Link to="/" className="back-link">← Back</Link>
      <h2 style={{ marginBottom: 18 }}>✈️ Travel</h2>
      <div className="menu-list">
        <Link to="/travel/trips" className="menu-row">
          My Trips <span className="chevron">›</span>
        </Link>
        <Link to="/travel/add" className="menu-row">
          + Add Trip <span className="chevron">›</span>
        </Link>
      </div>
    </div>
  )
}

export default TravelMenu
