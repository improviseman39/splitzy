import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import NewBill from './pages/NewBill'
import BillDetail from './pages/BillDetail'
import EditBill from './pages/EditBill'
import Friends from './pages/Friends'

function Nav() {
  const location = useLocation()
  const active = (path) => location.pathname === path
  return (
    <nav style={{
      background:'#6c63ff', padding:'0',
      display:'flex', justifyContent:'space-around',
      position:'fixed', bottom:0, left:0, right:0,
      boxShadow:'0 -2px 10px rgba(0,0,0,0.1)'
    }}>
      {[
        { to:'/', label:'🏠 Home' },
        { to:'/new', label:'➕ New Bill' },
        { to:'/friends', label:'👥 Friends' },
      ].map(item => (
        <Link key={item.to} to={item.to} style={{
          flex:1, textAlign:'center', padding:'12px',
          color: active(item.to) ? 'white' : 'rgba(255,255,255,0.7)',
          textDecoration:'none',
          fontWeight: active(item.to) ? 'bold' : 'normal',
          borderTop: active(item.to) ? '3px solid white' : '3px solid transparent'
        }}>
          {item.label}
        </Link>
      ))}
    </nav>
  )
}

function App() {
  return (
    <BrowserRouter>
      <div style={{
        minHeight:'100vh',
        background:'#f5f5f5',
        paddingBottom:'70px',
        fontFamily:'Arial, sans-serif'
      }}>
        <div style={{
          background:'#6c63ff', color:'white',
          padding:'15px 20px', textAlign:'center',
          boxShadow:'0 2px 10px rgba(0,0,0,0.2)'
        }}>
          <h1 style={{margin:0, fontSize:'24px'}}>💜 Splitzy</h1>
          <p style={{margin:0, fontSize:'12px', opacity:0.8}}>
            Split bills. Keep friends.
          </p>
        </div>

        <Routes>
          <Route path="/"          element={<Dashboard />} />
          <Route path="/new"       element={<NewBill />} />
          <Route path="/bill/:id"  element={<BillDetail />} />
          <Route path="/edit/:id"  element={<EditBill />} />
          <Route path="/friends"   element={<Friends />} />
        </Routes>

        <Nav />
      </div>
    </BrowserRouter>
  )
}

export default App
