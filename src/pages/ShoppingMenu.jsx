import { Link } from 'react-router-dom'

function ShoppingMenu() {
  return (
    <div className="page">
      <Link to="/" className="back-link">← Back</Link>
      <h2 style={{ marginBottom: 18 }}>🛒 Shopping</h2>
      <div className="menu-list">
        <Link to="/shopping/list" className="menu-row">
          Shopping List <span className="chevron">›</span>
        </Link>
        <Link to="/shopping/supplies" className="menu-row">
          Home Supplies <span className="chevron">›</span>
        </Link>
      </div>
    </div>
  )
}

export default ShoppingMenu
