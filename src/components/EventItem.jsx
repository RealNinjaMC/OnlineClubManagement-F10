export default function EventItem({ event, clubName, canRsvp, onToggleRsvp }) {
  const date = new Date(`${event.date}T00:00`)
  const month = date.toLocaleDateString('en-US', { month: 'short' })
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' })

  return (
    <li className="list-item">
      <div className="date-block">
        <span className="date-month">{month}</span>
        <span className="date-day">{date.getDate()}</span>
      </div>

      <div className="list-item-body">
        <p className="item-title">{event.title}</p>
        <p className="muted small">
          {weekday} · {event.time} · {event.room}
          {clubName && ` · ${clubName}`}
        </p>
      </div>

      {canRsvp && (
        <button
          type="button"
          className={event.going ? 'btn btn-sm btn-going' : 'btn btn-sm'}
          aria-pressed={event.going}
          onClick={onToggleRsvp}
        >
          {event.going ? 'Going' : 'RSVP'}
        </button>
      )}
    </li>
  )
}
