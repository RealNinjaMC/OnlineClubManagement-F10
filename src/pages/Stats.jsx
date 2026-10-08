import { Link } from 'react-router-dom'
import ActivityBadge from '../components/ActivityBadge'
import { BarGauge, ColumnChart, Donut, Gauge, Panel, StatPanel, TimeSeries } from '../components/Charts'
import { ClubLogo } from '../components/ClubCard'
import EmptyState from '../components/EmptyState'
import { useClubs } from '../context/ClubsContext'
import { getUpcomingEvents } from '../utils/activity'
import { getCategoryCounts, getLeaderboard, getMembersByHost, getTimeline, getTotals, percent } from '../utils/stats'

const DAYS_BACK = 14
const DAYS_AHEAD = 14

export default function Stats() {
  const { clubs, isMember } = useClubs()

  const header = (
    <div className="page-header">
      <div>
        <h1>Stats</h1>
        <p className="page-subtitle">Live numbers across every club on campus.</p>
      </div>
      <span className="live-pill">
        <span className="live-dot" aria-hidden="true" />
        Live
      </span>
    </div>
  )

  if (clubs.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          title="No stats yet"
          text="Charts fill in as soon as the first club is created."
          action={<Link to="/" className="btn">Go to clubs</Link>}
        />
      </>
    )
  }

  const totals = getTotals(clubs)
  const leaderboard = getLeaderboard(clubs)
  const activeClubs = leaderboard.filter((row) => row.level !== 'Low').length

  const myEvents = clubs.filter(isMember).flatMap(getUpcomingEvents)
  const rsvpRate = percent(myEvents.filter((event) => event.going).length, myEvents.length)

  const statPanels = [
    { title: 'Clubs', value: totals.clubs, color: '#7CB0FF' },
    { title: 'Members', value: totals.members, color: '#34D399' },
    { title: 'Upcoming events', value: totals.upcomingEvents, color: '#FBBF24' },
    { title: 'Announcements', value: totals.announcements, color: '#F472B6' },
    { title: 'Pending requests', value: totals.requests, color: totals.requests > 0 ? '#FB923C' : '#9CA3AF' },
    { title: 'Avg activity score', value: totals.averageScore, color: '#A78BFA' },
  ]

  return (
    <>
      {header}

      <div className="panel-grid">
        {statPanels.map((panel) => (
          <StatPanel key={panel.title} {...panel} />
        ))}

        <Panel title={`Events and announcements · ${DAYS_BACK} days back, ${DAYS_AHEAD} days ahead`} className="panel-full">
          <TimeSeries
            days={getTimeline(clubs, -DAYS_BACK, DAYS_AHEAD)}
            todayIndex={DAYS_BACK}
            series={[
              { key: 'events', name: 'Events', color: '#3B82F6' },
              { key: 'announcements', name: 'Announcements', color: '#34D399' },
            ]}
          />
        </Panel>

        <Panel title="Activity score by club" className="panel-wide">
          <BarGauge items={leaderboard.map((row) => ({ label: row.club.name, value: row.score, level: row.level }))} />
        </Panel>

        <Panel title="Clubs by category" className="panel-narrow">
          <Donut items={getCategoryCounts(clubs)} />
        </Panel>

        <Panel title="Members by host" className="panel-half">
          <ColumnChart items={getMembersByHost(clubs)} />
        </Panel>

        <Panel title="Active clubs" className="panel-quarter">
          <Gauge value={percent(activeClubs, clubs.length)} caption={`${activeClubs} of ${clubs.length} at Medium or High`} />
        </Panel>

        <Panel title="Your RSVP rate" className="panel-quarter">
          <Gauge value={rsvpRate} caption={myEvents.length > 0 ? `Going to ${myEvents.filter((event) => event.going).length} of ${myEvents.length} events` : 'Join a club to RSVP'} />
        </Panel>

        <Panel title="Leaderboard" className="panel-full">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th className="num">#</th>
                  <th>Club</th>
                  <th>Host</th>
                  <th className="num">Members</th>
                  <th className="num">Upcoming events</th>
                  <th className="num">Score</th>
                  <th>Activity</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row, index) => (
                  <tr key={row.club.id}>
                    <td className="num muted">{index + 1}</td>
                    <td>
                      <Link to={`/club/${row.club.id}`} className="table-club">
                        <ClubLogo club={row.club} size="sm" />
                        {row.club.name}
                      </Link>
                    </td>
                    <td>{row.club.host}</td>
                    <td className="num">{row.club.members.length}</td>
                    <td className="num">{row.upcoming}</td>
                    <td className="num">{row.score}</td>
                    <td><ActivityBadge club={row.club} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  )
}
