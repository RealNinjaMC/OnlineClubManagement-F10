import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { CLUB_COLORS, CURRENT_USER, HOSTS, dateFromToday } from '../data/seed'

const STORAGE_KEY = 'campfire-clubs'

const ClubsContext = createContext(null)

function loadClubs() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved).map((club) => ({ host: HOSTS[0], ...club })) : []
  } catch {
    return []
  }
}

export function ClubsProvider({ children }) {
  const [clubs, setClubs] = useState(loadClubs)
  const [role, setRole] = useState('member')
  const [host, setHost] = useState(HOSTS[0])
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clubs))
  }, [clubs])

  function showToast(message) {
    clearTimeout(toastTimer.current)
    setToast({ id: Date.now(), message })
    toastTimer.current = setTimeout(() => setToast(null), 2500)
  }

  function findClub(clubId) {
    return clubs.find((club) => club.id === clubId)
  }

  function isMember(club) {
    return club.members.includes(CURRENT_USER)
  }

  function hasRequested(club) {
    return club.requests.includes(CURRENT_USER)
  }

  function isHostOf(club) {
    return role === 'host' && club.host === host
  }

  function updateClub(clubId, change) {
    setClubs((current) =>
      current.map((club) => (club.id === clubId ? { ...club, ...change(club) } : club)),
    )
  }

  function createClub({ name, category, description, tags }) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const id = clubs.some((club) => club.id === slug) ? `${slug}-${Date.now()}` : slug
    const club = {
      id,
      name,
      category,
      description,
      tags,
      host,
      color: CLUB_COLORS[clubs.length % CLUB_COLORS.length],
      members: [],
      requests: [],
      events: [],
      announcements: [],
    }
    setClubs((current) => [...current, club])
    showToast(`${name} created`)
    return id
  }

  function deleteClub(clubId) {
    const club = findClub(clubId)
    setClubs((current) => current.filter((item) => item.id !== clubId))
    showToast(`${club.name} deleted`)
  }

  function joinClub(clubId) {
    updateClub(clubId, (club) => ({ requests: [...club.requests, CURRENT_USER] }))
    showToast(`Request sent to ${findClub(clubId).name}`)
  }

  function leaveClub(clubId) {
    const club = findClub(clubId)
    updateClub(clubId, (current) => ({
      members: current.members.filter((name) => name !== CURRENT_USER),
      requests: current.requests.filter((name) => name !== CURRENT_USER),
      events: current.events.map((event) => ({ ...event, going: false })),
    }))
    showToast(isMember(club) ? `Left ${club.name}` : 'Request cancelled')
  }

  function approveRequest(clubId, name) {
    updateClub(clubId, (club) => ({
      requests: club.requests.filter((request) => request !== name),
      members: [...club.members, name],
    }))
    showToast(`${name} approved`)
  }

  function rejectRequest(clubId, name) {
    updateClub(clubId, (club) => ({
      requests: club.requests.filter((request) => request !== name),
    }))
    showToast(`${name} declined`)
  }

  function addEvent(clubId, event) {
    const newEvent = { ...event, id: `event-${Date.now()}`, going: false }
    updateClub(clubId, (club) => ({ events: [...club.events, newEvent] }))
    showToast('Event added')
  }

  function toggleRsvp(clubId, eventId) {
    const event = findClub(clubId).events.find((item) => item.id === eventId)
    updateClub(clubId, (club) => ({
      events: club.events.map((item) => (item.id === eventId ? { ...item, going: !item.going } : item)),
    }))
    showToast(event.going ? 'RSVP cancelled' : `You're going to ${event.title}`)
  }

  function postAnnouncement(clubId, text) {
    const announcement = { id: `announcement-${Date.now()}`, author: host, date: dateFromToday(0), text }
    updateClub(clubId, (club) => ({ announcements: [announcement, ...club.announcements] }))
    showToast('Announcement posted')
  }

  const value = {
    clubs,
    role,
    setRole,
    host,
    setHost,
    toast,
    isMember,
    hasRequested,
    isHostOf,
    createClub,
    deleteClub,
    joinClub,
    leaveClub,
    approveRequest,
    rejectRequest,
    addEvent,
    toggleRsvp,
    postAnnouncement,
  }

  return <ClubsContext.Provider value={value}>{children}</ClubsContext.Provider>
}

export function useClubs() {
  return useContext(ClubsContext)
}
