import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import SplitzyMenu from './pages/SplitzyMenu'
import HouseholdMenu from './pages/HouseholdMenu'
import HouseholdExpenses from './pages/HouseholdExpenses'
import HouseholdForm from './pages/HouseholdForm'
import TravelMenu from './pages/TravelMenu'
import TripList from './pages/TripList'
import TripForm from './pages/TripForm'
import TripDetail from './pages/TripDetail'
import TripExpenseForm from './pages/TripExpenseForm'
import LoansMenu from './pages/LoansMenu'
import LoanList from './pages/LoanList'
import LoanForm from './pages/LoanForm'
import LoanDetail from './pages/LoanDetail'
import LoanPaymentForm from './pages/LoanPaymentForm'
import ShoppingMenu from './pages/ShoppingMenu'
import ShoppingList from './pages/ShoppingList'
import HomeSupplies from './pages/HomeSupplies'
import BillsRemindersMenu from './pages/BillsRemindersMenu'
import ReminderList from './pages/ReminderList'
import ReminderForm from './pages/ReminderForm'
import CalendarView from './pages/CalendarView'
import Reports from './pages/Reports'
import Dashboard from './pages/Dashboard'
import NewBill from './pages/NewBill'
import BillDetail from './pages/BillDetail'
import EditBill from './pages/EditBill'
import Friends from './pages/Friends'
import Login from './pages/Login'
import Setup2FA from './pages/Setup2FA'
import Verify2FA from './pages/Verify2FA'
import Settings from './pages/Settings'
import { isLoggedIn } from './auth'

function Nav() {
  const location = useLocation()
  const active = (path) => location.pathname === path
  const items = [
    { to: '/', label: 'Home', icon: '🏠' },
    { to: '/settings', label: 'Settings', icon: '⚙️' },
  ]
  return (
    <nav className="bottom-nav">
      {items.map(item => (
        <Link key={item.to} to={item.to} className={`nav-link ${active(item.to) ? 'active' : ''}`}>
          <span className="nav-icon">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  )
}

// Wraps every page that requires a logged-in session.
function ProtectedLayout({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />
  }
  return (
    <div className="app-shell">
      <div className="header-bar">
        <h1>💜 Splitzy</h1>
        <p>Split bills. Keep friends.</p>
      </div>
      {children}
      <Nav />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public — auth flow */}
        <Route path="/login" element={<Login />} />
        <Route path="/setup-2fa" element={<Setup2FA />} />
        <Route path="/verify-2fa" element={<Verify2FA />} />

        {/* Home + Settings */}
        <Route path="/" element={<ProtectedLayout><Home /></ProtectedLayout>} />
        <Route path="/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />

        {/* Splitzy category */}
        <Route path="/splitzy" element={<ProtectedLayout><SplitzyMenu /></ProtectedLayout>} />
        <Route path="/splitzy/bills" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
        <Route path="/new" element={<ProtectedLayout><NewBill /></ProtectedLayout>} />
        <Route path="/bill/:id" element={<ProtectedLayout><BillDetail /></ProtectedLayout>} />
        <Route path="/edit/:id" element={<ProtectedLayout><EditBill /></ProtectedLayout>} />
        <Route path="/friends" element={<ProtectedLayout><Friends /></ProtectedLayout>} />

        {/* Household category */}
        <Route path="/household" element={<ProtectedLayout><HouseholdMenu /></ProtectedLayout>} />
        <Route path="/household/expenses" element={<ProtectedLayout><HouseholdExpenses /></ProtectedLayout>} />
        <Route path="/household/add" element={<ProtectedLayout><HouseholdForm /></ProtectedLayout>} />
        <Route path="/household/edit/:id" element={<ProtectedLayout><HouseholdForm /></ProtectedLayout>} />

        {/* Travel category */}
        <Route path="/travel" element={<ProtectedLayout><TravelMenu /></ProtectedLayout>} />
        <Route path="/travel/trips" element={<ProtectedLayout><TripList /></ProtectedLayout>} />
        <Route path="/travel/add" element={<ProtectedLayout><TripForm /></ProtectedLayout>} />
        <Route path="/travel/trip/:id" element={<ProtectedLayout><TripDetail /></ProtectedLayout>} />
        <Route path="/travel/trip/:tripId/add" element={<ProtectedLayout><TripExpenseForm /></ProtectedLayout>} />
        <Route path="/travel/trip/:tripId/edit/:expenseId" element={<ProtectedLayout><TripExpenseForm /></ProtectedLayout>} />

        {/* Loans & Debts category */}
        <Route path="/loans" element={<ProtectedLayout><LoansMenu /></ProtectedLayout>} />
        <Route path="/loans/list" element={<ProtectedLayout><LoanList /></ProtectedLayout>} />
        <Route path="/loans/add" element={<ProtectedLayout><LoanForm /></ProtectedLayout>} />
        <Route path="/loans/loan/:id" element={<ProtectedLayout><LoanDetail /></ProtectedLayout>} />
        <Route path="/loans/loan/:id/pay" element={<ProtectedLayout><LoanPaymentForm /></ProtectedLayout>} />

        {/* Shopping category */}
        <Route path="/shopping" element={<ProtectedLayout><ShoppingMenu /></ProtectedLayout>} />
        <Route path="/shopping/list" element={<ProtectedLayout><ShoppingList /></ProtectedLayout>} />
        <Route path="/shopping/supplies" element={<ProtectedLayout><HomeSupplies /></ProtectedLayout>} />

        {/* Bills & Reminders category */}
        <Route path="/bills-reminders" element={<ProtectedLayout><BillsRemindersMenu /></ProtectedLayout>} />
        <Route path="/bills-reminders/list" element={<ProtectedLayout><ReminderList /></ProtectedLayout>} />
        <Route path="/bills-reminders/add" element={<ProtectedLayout><ReminderForm /></ProtectedLayout>} />
        <Route path="/bills-reminders/edit/:id" element={<ProtectedLayout><ReminderForm /></ProtectedLayout>} />
        <Route path="/bills-reminders/calendar" element={<ProtectedLayout><CalendarView /></ProtectedLayout>} />

        {/* Reports */}
        <Route path="/reports" element={<ProtectedLayout><Reports /></ProtectedLayout>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
