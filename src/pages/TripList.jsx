import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { authHeaders } from '../auth'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4003'

function TripList() {
  const [trips, setTrips] = useState([])

  useEffect(() => {
    fetch(`${API}/api/trips`, { headers: authHeaders() })
      .then(r => r.json())
      .then(setTrips)
  }, [])

  const formatDates = (t) => {
    if (!t.start_date) return null
    const start = new Date(t.start_date).toLocaleDateString()
    const end = t.end_date ? new Date(t.end_date).toLocaleDateString() : ''
    return end ? `${start} – ${end}` : start
  }

  return (
    <div className="page">
      <Link to="/travel" className="back-link">← Back</Link>

      <div className="page-header">
        <h2>✈️ My Trips</h2>
        <Link to="/travel/add">
          <button className="btn btn-primary">+ New Trip</button>
        </Link>
      </div>

      {trips.length === 0 ? (
        <div className="empty-state">
          <div className="icon">✈️</div>
          <p>No trips yet — add your first one!</p>
        </div>
      ) : (
        trips.map(trip => (
          <Link key={trip.id} to={`/travel/trip/${trip.id}`} style={{ textDecoration: 'none' }}>
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--text)' }}>{trip.name}</div>
              {trip.destination && (
                <div className="item-meta" style={{ marginTop: 4 }}>📍 {trip.destination}</div>
              )}
              {formatDates(trip) && (
                <div className="item-meta" style={{ marginTop: 2 }}>{formatDates(trip)}</div>
              )}
            </div>
          </Link>
        ))
      )}
    </div>
  )
}

export default TripList
