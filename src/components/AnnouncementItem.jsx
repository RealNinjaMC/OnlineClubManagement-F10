function formatDaysAgo(dateString) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.round((today - new Date(`${dateString}T00:00`)) / 86400000)

  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

export default function AnnouncementItem({ announcement, clubName }) {
  return (
    <li className="list-item list-item-stacked">
      <div className="announcement-meta">
        <span className="item-title">{announcement.author}</span>
        <span className="muted small">
          {clubName && `${clubName} · `}
          {formatDaysAgo(announcement.date)}
        </span>
      </div>
      <p>{announcement.text}</p>
    </li>
  )
}
