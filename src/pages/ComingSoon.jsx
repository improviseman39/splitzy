import { Link } from 'react-router-dom'

function ComingSoon({ name, icon }) {
  return (
    <div className="page">
      <Link to="/" className="back-link">← Back</Link>
      <div className="coming-soon">
        <div className="icon">{icon}</div>
        <h2>{name}</h2>
        <p>This section is coming soon.</p>
      </div>
    </div>
  )
}

export default ComingSoon
