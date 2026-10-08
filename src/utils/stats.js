import { dateFromToday } from '../data/seed'
import { getActivity, getUpcomingEvents } from './activity'
import { getRating } from './rating'

function sum(clubs, getValue) {
  return clubs.reduce((total, club) => total + getValue(club), 0)
}

export function getTotals(clubs) {
  const totalScore = sum(clubs, (club) => getActivity(club).score)

  return {
    clubs: clubs.length,
    members: sum(clubs, (club) => club.members.length),
    upcomingEvents: sum(clubs, (club) => getUpcomingEvents(club).length),
    announcements: sum(clubs, (club) => club.announcements.length),
    requests: sum(clubs, (club) => club.requests.length),
    averageScore: clubs.length > 0 ? Math.round(totalScore / clubs.length) : 0,
  }
}

export function getTimeline(clubs, from, to) {
  const days = []
  for (let offset = from; offset <= to; offset += 1) {
    const date = dateFromToday(offset)
    days.push({
      date,
      events: sum(clubs, (club) => club.events.filter((event) => event.date === date).length),
      announcements: sum(clubs, (club) => club.announcements.filter((item) => item.date === date).length),
    })
  }
  return days
}

export function getCategoryCounts(clubs) {
  const counts = {}
  clubs.forEach((club) => {
    counts[club.category] = (counts[club.category] || 0) + 1
  })
  return Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
}

export function getMembersByHost(clubs) {
  const hosts = [...new Set(clubs.map((club) => club.host))].sort()
  return hosts.map((host) => ({
    label: host,
    value: sum(clubs.filter((club) => club.host === host), (club) => club.members.length),
  }))
}

export function getLeaderboard(clubs) {
  return clubs
    .map((club) => ({ club, ...getActivity(club), upcoming: getUpcomingEvents(club).length, rating: getRating(club) }))
    .sort((a, b) => b.score - a.score)
}

export function percent(part, whole) {
  return whole > 0 ? Math.round((part / whole) * 100) : 0
}
