import { Link, Route, Routes, useLocation } from 'react-router-dom'
import EmptyState from './components/EmptyState'
import Header from './components/Header'
import Toast from './components/Toast'
import ClubDetail from './pages/ClubDetail'
import Clubs from './pages/Clubs'
import Dashboard from './pages/Dashboard'
import Match from './pages/Match'
import Stats from './pages/Stats'

export default function App() {
  const location = useLocation()

  return (
    <div className="app">
      <Header />
      <main className="page">
        <div key={location.pathname} className="page-enter">
          <Routes>
          <Route path="/" element={<Clubs />} />
          <Route path="/club/:id" element={<ClubDetail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/match" element={<Match />} />
            <Route path="/stats" element={<Stats />} />
          <Route
            path="*"
            element={
              <EmptyState
                title="Page not found"
                text="The link may be broken or the page was moved."
                action={<Link to="/" className="btn">Browse clubs</Link>}
              />
            }
          />
          </Routes>
        </div>
      </main>
      <Toast />
    </div>
  )
}
