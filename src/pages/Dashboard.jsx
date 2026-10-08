import { Link } from 'react-router-dom'
import ActivityBadge from '../components/ActivityBadge'
import AnnouncementItem from '../components/AnnouncementItem'
import { ClubLogo, getInitials, memberCount } from '../components/ClubCard'
import EmptyState from '../components/EmptyState'
import EventItem from '../components/EventItem'
import { useAuth } from '../context/AuthContext'
import { useClubs } from '../context/ClubsContext'
import { dateFromToday } from '../data/seed'
import { getUpcomingEvents } from '../utils/activity'

function PendingRequests({ clubs, onApprove, onReject }) {
  const requests = clubs.flatMap((club) => club.requests.map((person) => ({ person, club })))

  return (
    <section className="section">
      <div className="section-header">
        <h2>Pending requests</h2>
        <span className="muted small">{requests.length} waiting</span>
      </div>
      {requests.length > 0 ? (
        <ul className="list">
          {requests.map(({ person, club }) => (
            <li key={`${club.id}-${person.id}`} className="list-item">
              <span className="avatar" aria-hidden="true">{getInitials(person.name)}</span>
              <div className="list-item-body">
                <p className="item-title">{person.name}</p>
                <p className="muted small">Wants to join {club.name}</p>
              </div>
              <div className="button-row">
                <button type="button" className="btn btn-sm btn-danger" onClick={() => onReject(club.id, person)}>Reject</button>
                <button type="button" className="btn btn-sm btn-primary" onClick={() => onApprove(club.id, person)}>Approve</button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="All caught up" text="There are no join requests waiting for review." />
      )}
    </section>
  )
}

export default function Dashboard() {
  const { profile } = useAuth()
  const { clubs, role, isMember, isHostOf, toggleRsvp, approveRequest, rejectRequest } = useClubs()

  const hostView = role === 'host'
  const hostedClubs = clubs.filter(isHostOf)
  const myClubs = clubs.filter(isMember)

  const upcoming = myClubs
    .flatMap((club) => getUpcomingEvents(club).map((event) => ({ event, club })))
    .sort((a, b) => a.event.date.localeCompare(b.event.date) || a.event.time.localeCompare(b.event.time))

  const latestAnnouncements = myClubs
    .flatMap((club) => club.announcements.map((announcement) => ({ announcement, club })))
    .sort((a, b) => b.announcement.date.localeCompare(a.announcement.date))
    .slice(0, 5)

  const lastWeek = dateFromToday(-7)
  const stats = [
    { label: 'Clubs joined', value: myClubs.length },
    { label: 'Upcoming events', value: upcoming.length },
    { label: 'Going', value: upcoming.filter((item) => item.event.going).length },
    { label: 'New announcements', value: latestAnnouncements.filter((item) => item.announcement.date >= lastWeek).length, hint: 'Last 7 days' },
  ]

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">{profile.name} · {today}</p>
        </div>
      </div>

      {hostView && (
        <>
          <PendingRequests clubs={hostedClubs} onApprove={approveRequest} onReject={rejectRequest} />
          <section className="section">
            <div className="section-header">
              <h2>Clubs you host</h2>
            </div>
            {hostedClubs.length > 0 ? (
              <ul className="list">
                {hostedClubs.map((club) => (
                  <li key={club.id}>
                    <Link to={`/club/${club.id}`} className="list-item list-link">
                      <ClubLogo club={club} size="sm" />
                      <div className="list-item-body">
                        <p className="item-title">{club.name}</p>
                        <p className="muted small">{memberCount(club)} · {club.requests.length} pending</p>
                      </div>
                      <ActivityBadge club={club} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="You don't host any clubs yet"
                text="Create a club and it will show up here."
                action={<Link to="/" className="btn btn-primary">Go to clubs</Link>}
              />
            )}
          </section>
        </>
      )}

      {!hostView && (myClubs.length === 0 ? (
        <section className="section">
          <EmptyState
            title="You haven't joined any clubs yet"
            text="Once a host approves your request, the club's events and announcements show up here."
            action={<Link to="/" className="btn btn-primary">Browse clubs</Link>}
          />
        </section>
      ) : (
        <section className="section">
          <div className="stats">
            {stats.map((stat) => (
              <div key={stat.label} className="card stat">
                <p className="stat-label">{stat.label}</p>
                <p className="stat-value">{stat.value}</p>
                {stat.hint && <p className="stat-hint">{stat.hint}</p>}
              </div>
            ))}
          </div>

          <div className="dashboard-grid">
            <div>
              <section className="section">
                <div className="section-header">
                  <h2>Upcoming events</h2>
                  <span className="muted small">Sorted by date</span>
                </div>
                {upcoming.length > 0 ? (
                  <ul className="list">
                    {upcoming.map(({ event, club }) => (
                      <EventItem
                        key={event.id}
                        event={event}
                        clubName={club.name}
                        canRsvp
                        onToggleRsvp={() => toggleRsvp(club.id, event.id)}
                      />
                    ))}
                  </ul>
                ) : (
                  <EmptyState title="No upcoming events" text="Your clubs haven't scheduled anything yet." />
                )}
              </section>

              <section className="section">
                <div className="section-header">
                  <h2>Latest announcements</h2>
                </div>
                {latestAnnouncements.length > 0 ? (
                  <ul className="list">
                    {latestAnnouncements.map(({ announcement, club }) => (
                      <AnnouncementItem key={announcement.id} announcement={announcement} clubName={club.name} />
                    ))}
                  </ul>
                ) : (
                  <EmptyState title="No announcements yet" text="Updates from your clubs will show up here." />
                )}
              </section>
            </div>

            <section className="section">
              <div className="section-header">
                <h2>My clubs</h2>
                <Link to="/" className="text-link small">Browse all</Link>
              </div>
              <ul className="list">
                {myClubs.map((club) => (
                  <li key={club.id}>
                    <Link to={`/club/${club.id}`} className="list-item list-link">
                      <ClubLogo club={club} size="sm" />
                      <div className="list-item-body">
                        <p className="item-title">{club.name}</p>
                        <p className="muted small">{memberCount(club)}</p>
                      </div>
                      <ActivityBadge club={club} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </section>
      ))}
    </>
  )
}
