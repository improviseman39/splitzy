import { useNavigate } from 'react-router-dom'

const categories = [
  { icon: '🏠', name: 'Household', path: '/household' },
  { icon: '✈️', name: 'Travel', path: '/travel' },
  { icon: '💳', name: 'Loans & Debts', path: '/loans' },
  { icon: '🛒', name: 'Shopping', path: '/shopping' },
  { icon: '🔔', name: 'Bills & Reminders', path: '/bills-reminders' },
  { icon: '🧾', name: 'Splitzy', path: '/splitzy' },
  { icon: '📊', name: 'Reports', path: '/reports' },
]

function Home() {
  const navigate = useNavigate()

  return (
    <div className="page">
      <h2 style={{ marginBottom: 18 }}>👋 Welcome back</h2>
      <div className="category-grid">
        {categories.map(cat => (
          <button key={cat.path} className="category-card" onClick={() => navigate(cat.path)}>
            <span className="category-icon">{cat.icon}</span>
            <span className="category-name">{cat.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default Home
