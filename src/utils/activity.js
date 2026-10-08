import { dateFromToday } from '../data/seed'

export function getUpcomingEvents(club) {
  const today = dateFromToday(0)
  return club.events
    .filter((event) => event.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
}

export function getActivity(club) {
  const cutoff = dateFromToday(-14)
  const recentAnnouncements = club.announcements.filter((item) => item.date >= cutoff).length
  const score = club.members.length + getUpcomingEvents(club).length * 3 + recentAnnouncements * 2

  let level = 'Low'
  if (score >= 20) level = 'High'
  else if (score >= 10) level = 'Medium'

  return { score, level }
}
