import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useClubs } from '../context/ClubsContext'
import { ClubLogo, getInitials } from './ClubCard'

const ROLES = [
  { id: 'member', label: 'Member' },
  { id: 'host', label: 'Host' },
]

const ROLE_LABELS = { root: 'Root', host: 'Host', member: 'Member' }

const NAV_ITEMS = [
  { to: '/', label: 'Clubs', icon: 'clubs' },
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/match', label: 'Club Match', icon: 'match' },
  { to: '/stats', label: 'Stats', icon: 'stats' },
]

const USERS_ITEM = { to: '/users', label: 'Users', icon: 'users' }

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
  users: (
    <>
      <circle cx="6" cy="5.5" r="2.5" />
      <path d="M1.5 13.5c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4M10.5 3a2.5 2.5 0 0 1 0 5M12.5 9.8c1.2.6 2 1.9 2 3.7" />
    </>
  ),
  signout: <path d="M6 2.5H3.5v11H6M10.5 5l3 3-3 3M13.5 8H6.5" />,
}

export function FlameIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
  const { profile, isRoot, canHost, signOut } = useAuth()
  const { clubs, role, setRole, isMember, isHostOf } = useClubs()

  const hostView = role === 'host'
  const myClubs = clubs.filter(hostView ? isHostOf : isMember)
  const pendingRequests = clubs.filter(isHostOf).reduce((total, club) => total + club.requests.length, 0)
  const navItems = isRoot ? [...NAV_ITEMS, USERS_ITEM] : NAV_ITEMS

  return (
    <aside className="sidebar">
      <Link to="/" className="brand">
        <span className="brand-mark">
          <FlameIcon />
        </span>
        Campfire
      </Link>

      <nav className="sidebar-nav" aria-label="Main">
        {navItems.map((item) => (
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
        {canHost && (
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
        )}

        <div className="user-card">
          <span className="avatar" aria-hidden="true">{getInitials(profile.name)}</span>
          <div className="user-card-text">
            <p className="item-title">{profile.name}</p>
            <p className="muted small">
              {ROLE_LABELS[profile.role]}
              {canHost && (hostView ? ' · Host view' : ' · Member view')}
            </p>
          </div>
        </div>

        <button type="button" className="btn btn-ghost btn-sm sign-out" onClick={signOut}>
          <NavIcon name="signout" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
