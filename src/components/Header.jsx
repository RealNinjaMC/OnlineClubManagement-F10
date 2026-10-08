import { Link, NavLink } from 'react-router-dom'
import { useClubs } from '../context/ClubsContext'
import { CURRENT_USER, HOSTS } from '../data/seed'
import { ClubLogo, getInitials } from './ClubCard'

const ROLES = [
  { id: 'member', label: 'Member' },
  { id: 'host', label: 'Host' },
]

const NAV_ITEMS = [
  { to: '/', label: 'Clubs', icon: 'clubs' },
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/match', label: 'Club Match', icon: 'match' },
  { to: '/stats', label: 'Stats', icon: 'stats' },
]

const ICONS = {
  clubs: <path d="M2.5 2.5h4v4h-4zM9.5 2.5h4v4h-4zM2.5 9.5h4v4h-4zM9.5 9.5h4v4h-4z" />,
  dashboard: <path d="M2.5 7 8 2.5 13.5 7v6.5H10v-4H6v4H2.5z" />,
  match: (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <circle cx="8" cy="8" r="2.5" />
    </>
  ),
  stats: <path d="M2.5 13.5h11M4.5 11V8.5M8 11V3.5M11.5 11V6" />,
}

function FlameIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2.5c.6 3.2 5 5.1 5 10a5 5 0 0 1-10 0c0-2.3 1.1-3.8 2.3-4.9.2 1.7 1 2.8 2 3.2-.6-2.9-.2-5.9.7-8.3z"
        fill="currentColor"
      />
      <path d="M5.5 21.5 18.5 18M5.5 18l13 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function NavIcon({ name }) {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  )
}

export default function Header() {
  const { clubs, role, setRole, host, setHost, isMember, isHostOf } = useClubs()

  const hostView = role === 'host'
  const myClubs = clubs.filter(hostView ? isHostOf : isMember)
  const pendingRequests = clubs.filter(isHostOf).reduce((total, club) => total + club.requests.length, 0)
  const userName = hostView ? host : CURRENT_USER

  return (
    <aside className="sidebar">
      <Link to="/" className="brand">
        <span className="brand-mark">
          <FlameIcon />
        </span>
        Campfire
      </Link>

      <nav className="sidebar-nav" aria-label="Main">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} className="nav-link">
            <NavIcon name={item.icon} />
            <span className="nav-link-text">{item.label}</span>
            {item.to === '/dashboard' && hostView && pendingRequests > 0 && (
              <span className="nav-badge">{pendingRequests}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {myClubs.length > 0 && (
        <div className="sidebar-section">
          <p className="sidebar-label">{hostView ? 'Clubs you host' : 'Your clubs'}</p>
          {myClubs.map((club) => (
            <NavLink key={club.id} to={`/club/${club.id}`} className="nav-link">
              <ClubLogo club={club} size="xs" />
              <span className="nav-link-text">{club.name}</span>
            </NavLink>
          ))}
        </div>
      )}

      <div className="sidebar-footer">
        <div className="segmented" role="group" aria-label="View as">
          {ROLES.map((option) => (
            <button
              key={option.id}
              type="button"
              className="segmented-option"
              aria-pressed={role === option.id}
              onClick={() => setRole(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {hostView && (
          <select className="input select" aria-label="Hosting as" value={host} onChange={(event) => setHost(event.target.value)}>
            {HOSTS.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        )}

        <div className="user-card">
          <span className="avatar" aria-hidden="true">{getInitials(userName)}</span>
          <div className="user-card-text">
            <p className="item-title">{userName}</p>
            <p className="muted small">{hostView ? 'Host view' : 'Member view'}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
