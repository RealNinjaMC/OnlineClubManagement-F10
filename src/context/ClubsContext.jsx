import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { CLUB_COLORS, toDateString } from '../data/seed'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const ClubsContext = createContext(null)

const CLUB_QUERY = `
  id, name, category, description, tags, color, created_at,
  host:profiles!host_id(id, name),
  memberships(status, person:profiles!user_id(id, name)),
  events(id, title, date, time, room, rsvps(user_id)),
  announcements(id, text, created_at, author:profiles!author_id(id, name)),
  feedback(id, rating, text, created_at, author:profiles!user_id(id, name)),
  polls(id, question, options, created_at, votes(user_id, choice))
`

function newestFirst(items) {
  return [...items].sort((a, b) => b.created_at.localeCompare(a.created_at))
}

function toClub(row, userId) {
  const people = (status) => row.memberships.filter((item) => item.status === status).map((item) => item.person)

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    tags: row.tags,
    color: row.color,
    host: row.host.name,
    hostId: row.host.id,
    members: people('member'),
    requests: people('requested'),
    events: row.events.map((event) => ({
      id: event.id,
      title: event.title,
      date: event.date,
      time: event.time.slice(0, 5),
      room: event.room,
      going: event.rsvps.some((rsvp) => rsvp.user_id === userId),
    })),
    announcements: newestFirst(row.announcements).map((item) => ({
      id: item.id,
      text: item.text,
      author: item.author.name,
      date: toDateString(new Date(item.created_at)),
    })),
    feedback: newestFirst(row.feedback).map((item) => ({
      id: item.id,
      rating: item.rating,
      text: item.text,
      author: item.author.name,
      authorId: item.author.id,
      date: toDateString(new Date(item.created_at)),
    })),
    polls: newestFirst(row.polls).map((poll) => ({
      id: poll.id,
      question: poll.question,
      options: poll.options,
      votes: poll.votes,
      myChoice: poll.votes.find((vote) => vote.user_id === userId)?.choice ?? null,
      date: toDateString(new Date(poll.created_at)),
    })),
  }
}

function savedView() {
  try {
    return localStorage.getItem('campfire-view') === 'host' ? 'host' : 'member'
  } catch {
    return 'member'
  }
}

export function ClubsProvider({ children }) {
  const { user, profile, canHost } = useAuth()
  const [clubs, setClubs] = useState([])
  const [ready, setReady] = useState(false)
  const [view, setView] = useState(savedView)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)
  const refreshTimer = useRef(null)
  const clubsRef = useRef([])
  const openChat = useRef(null)

  useEffect(() => {
    try {
      localStorage.setItem('campfire-view', view)
    } catch {}
  }, [view])

  const role = canHost ? view : 'member'

  function showToast(message, tone = 'success', duration = 3000) {
    clearTimeout(toastTimer.current)
    setToast({ id: Date.now(), message, tone })
    toastTimer.current = setTimeout(() => setToast(null), duration)
  }

  function notify(message) {
    showToast(message.length > 90 ? `${message.slice(0, 90)}…` : message, 'info', 5000)
  }

  async function refresh() {
    const { data, error } = await supabase.from('clubs').select(CLUB_QUERY).order('created_at')
    if (error) showToast(error.message, 'error')
    else {
      clubsRef.current = data.map((row) => toClub(row, user.id))
      setClubs(clubsRef.current)
    }
    setReady(true)
  }

  function refreshSoon() {
    clearTimeout(refreshTimer.current)
    refreshTimer.current = setTimeout(refresh, 300)
  }

  async function nameOf(personId) {
    const { data } = await supabase.from('profiles').select('name').eq('id', personId).single()
    return data?.name ?? 'Someone'
  }

  async function handleChange({ table, eventType, new: row }) {
    if (table !== 'messages' && table !== 'profiles') refreshSoon()
    if (eventType === 'DELETE') return

    if (table === 'clubs') {
      if (eventType === 'INSERT' && row.host_id !== user.id) notify(`New club: ${row.name}`)
      return
    }

    const club = clubsRef.current.find((item) => item.id === row.club_id)
    if (!club) return
    const hosting = club.hostId === user.id
    const member = club.members.some((person) => person.id === user.id)

    if (table === 'memberships' && eventType === 'INSERT' && hosting) {
      notify(`${await nameOf(row.user_id)} asked to join ${club.name}`)
    }
    if (table === 'memberships' && eventType === 'UPDATE' && row.user_id === user.id && row.status === 'member') {
      notify(`You're in! ${club.name} approved your request`)
    }
    if (table === 'feedback' && hosting) notify(`${club.name} got a new ${row.rating}★ rating`)
    if (table === 'messages' && (member || hosting) && row.user_id !== user.id && openChat.current !== club.id) {
      notify(`${await nameOf(row.user_id)} in ${club.name}: ${row.text}`)
    }
    if (!member || eventType !== 'INSERT') return
    if (table === 'events') notify(`New event in ${club.name}: ${row.title}`)
    if (table === 'announcements' && row.author_id !== user.id) notify(`New announcement in ${club.name}`)
    if (table === 'polls') notify(`New poll in ${club.name}: ${row.question}`)
  }

  useEffect(() => {
    refresh()
    const channel = supabase
      .channel('live-updates')
      .on('postgres_changes', { event: '*', schema: 'public' }, handleChange)
      .subscribe()
    return () => {
      clearTimeout(refreshTimer.current)
      supabase.removeChannel(channel)
    }
  }, [user.id])

  function setOpenChat(clubId) {
    openChat.current = clubId
  }

  async function run(request, message) {
    const { error } = await request
    if (error) {
      showToast(error.message, 'error')
      return false
    }
    await refresh()
    showToast(message)
    return true
  }

  function findClub(clubId) {
    return clubs.find((club) => club.id === clubId)
  }

  function isMember(club) {
    return club.members.some((person) => person.id === user.id)
  }

  function hasRequested(club) {
    return club.requests.some((person) => person.id === user.id)
  }

  function isHostOf(club) {
    return role === 'host' && (club.hostId === user.id || profile.role === 'root')
  }

  async function createClub({ name, category, description, tags }) {
    const color = CLUB_COLORS[clubs.length % CLUB_COLORS.length]
    const { data, error } = await supabase
      .from('clubs')
      .insert({ name, category, description, tags, color })
      .select('id')
      .single()
    if (error) {
      showToast(error.message, 'error')
      return null
    }
    await refresh()
    showToast(`${name} created`)
    return data.id
  }

  function deleteClub(clubId) {
    const club = findClub(clubId)
    return run(supabase.from('clubs').delete().eq('id', clubId), `${club.name} deleted`)
  }

  function joinClub(clubId) {
    return run(supabase.from('memberships').insert({ club_id: clubId }), `Request sent to ${findClub(clubId).name}`)
  }

  function leaveClub(clubId) {
    const club = findClub(clubId)
    return run(
      supabase.from('memberships').delete().eq('club_id', clubId).eq('user_id', user.id),
      isMember(club) ? `Left ${club.name}` : 'Request cancelled',
    )
  }

  function approveRequest(clubId, person) {
    return run(
      supabase.from('memberships').update({ status: 'member' }).eq('club_id', clubId).eq('user_id', person.id),
      `${person.name} approved`,
    )
  }

  function rejectRequest(clubId, person) {
    return run(
      supabase.from('memberships').delete().eq('club_id', clubId).eq('user_id', person.id),
      `${person.name} declined`,
    )
  }

  function addEvent(clubId, event) {
    return run(supabase.from('events').insert({ club_id: clubId, ...event }), 'Event added')
  }

  function toggleRsvp(clubId, eventId) {
    const event = findClub(clubId).events.find((item) => item.id === eventId)
    if (event.going) {
      return run(supabase.from('rsvps').delete().eq('event_id', eventId).eq('user_id', user.id), 'RSVP cancelled')
    }
    return run(supabase.from('rsvps').insert({ event_id: eventId }), `You're going to ${event.title}`)
  }

  function postAnnouncement(clubId, text) {
    return run(supabase.from('announcements').insert({ club_id: clubId, text }), 'Announcement posted')
  }

  function addFeedback(clubId, rating, text) {
    const club = findClub(clubId)
    if (!isMember(club) || club.feedback.some((item) => item.authorId === user.id)) return
    return run(supabase.from('feedback').insert({ club_id: clubId, rating, text }), 'Thanks for your feedback')
  }

  function createPoll(clubId, question, options) {
    return run(supabase.from('polls').insert({ club_id: clubId, question, options }), 'Poll created')
  }

  function deletePoll(pollId) {
    return run(supabase.from('polls').delete().eq('id', pollId), 'Poll deleted')
  }

  function vote(poll, choice) {
    if (poll.myChoice === choice) return
    const request = poll.myChoice === null
      ? supabase.from('votes').insert({ poll_id: poll.id, choice })
      : supabase.from('votes').update({ choice }).eq('poll_id', poll.id).eq('user_id', user.id)
    return run(request, poll.myChoice === null ? 'Vote counted' : 'Vote changed')
  }

  const value = {
    clubs,
    ready,
    role,
    setRole: setView,
    toast,
    showToast,
    setOpenChat,
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
    addFeedback,
    createPoll,
    deletePoll,
    vote,
  }

  return <ClubsContext.Provider value={value}>{children}</ClubsContext.Provider>
}

export function useClubs() {
  return useContext(ClubsContext)
}
