import { Link } from 'react-router-dom'
import { getRating } from '../utils/rating'
import ActivityBadge from './ActivityBadge'

export function memberCount(club) {
  const count = club.members.length
  return `${count} ${count === 1 ? 'member' : 'members'}`
}

export function getInitials(name) {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function ClubLogo({ club, size = 'md' }) {
  return (
    <span className={`club-logo club-logo-${size}`} style={{ backgroundColor: club.color }} aria-hidden="true">
      {getInitials(club.name)}
    </span>
  )
}

export default function ClubCard({ club, index, joined, requested }) {
  const rating = getRating(club)

  return (
    <Link to={`/club/${club.id}`} className="card club-card" style={{ '--i': index }}>
      <div className="club-card-top">
        <ClubLogo club={club} />
        <div className="club-card-title">
          <h3>{club.name}</h3>
          <p className="muted small">{club.category} · {club.host}</p>
        </div>
        {joined && <span className="chip chip-accent">Member</span>}
        {requested && <span className="chip">Requested</span>}
      </div>

      <p className="club-card-description">{club.description}</p>

      <div className="tag-list">
        {club.tags.map((tag) => (
          <span key={tag} className="tag">{tag}</span>
        ))}
      </div>

      <div className="club-card-footer">
        <span className="muted small">
          {memberCount(club)}
          {rating.count > 0 && <span className="card-rating"> · ★ {rating.average.toFixed(1)}</span>}
        </span>
        <ActivityBadge club={club} />
      </div>
    </Link>
  )
}
