import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ActivityBadge from '../components/ActivityBadge'
import AnnouncementItem from '../components/AnnouncementItem'
import ClubChat from '../components/ClubChat'
import { ClubLogo, getInitials, memberCount } from '../components/ClubCard'
import EmptyState from '../components/EmptyState'
import EventItem from '../components/EventItem'
import { FeedbackForm, FeedbackItem, RatingSummary, Stars } from '../components/Feedback'
import { PollCard, PollForm } from '../components/Polls'
import { useAuth } from '../context/AuthContext'
import { useClubs } from '../context/ClubsContext'
import { dateFromToday } from '../data/seed'
import { getActivity, getUpcomingEvents } from '../utils/activity'
import { getRating } from '../utils/rating'

const EMPTY_EVENT = { title: '', date: '', time: '18:00', room: '' }

function AddEventForm({ onAdd }) {
  const [form, setForm] = useState(EMPTY_EVENT)

  function updateField(field) {
    return (event) => setForm({ ...form, [field]: event.target.value })
  }

  function handleSubmit(event) {
    event.preventDefault()
    onAdd(form)
    setForm(EMPTY_EVENT)
  }

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <h3>Add event</h3>
      <div className="form-grid">
        <div className="field field-wide">
          <label htmlFor="event-title">Title</label>
          <input id="event-title" className="input" required value={form.title} onChange={updateField('title')} placeholder="Build night" />
        </div>
        <div className="field">
          <label htmlFor="event-date">Date</label>
          <input id="event-date" type="date" className="input" required min={dateFromToday(0)} value={form.date} onChange={updateField('date')} />
        </div>
        <div className="field">
          <label htmlFor="event-time">Time</label>
          <input id="event-time" type="time" className="input" required value={form.time} onChange={updateField('time')} />
        </div>
        <div className="field">
          <label htmlFor="event-room">Room</label>
          <input id="event-room" className="input" required value={form.room} onChange={updateField('room')} placeholder="Engineering 204" />
        </div>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">Add event</button>
      </div>
    </form>
  )
}

function PostAnnouncementForm({ onPost }) {
  const [text, setText] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    onPost(text.trim())
    setText('')
  }

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <h3>Post announcement</h3>
      <div className="field">
        <label htmlFor="announcement-text" className="visually-hidden">Announcement</label>
        <textarea
          id="announcement-text"
          className="input"
          required
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Share an update with members"
        />
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={!text.trim()}>Post</button>
      </div>
    </form>
  )
}

export default function ClubDetail() {
  const { id } = useParams()
  const { user, isRoot, canHost } = useAuth()
  const {
    clubs, role, isMember, hasRequested, isHostOf, joinClub, leaveClub, toggleRsvp,
    approveRequest, rejectRequest, addEvent, postAnnouncement, deleteClub, addFeedback,
    createPoll, deletePoll, vote,
  } = useClubs()
  const [tab, setTab] = useState('events')
  const navigate = useNavigate()

  const club = clubs.find((item) => item.id === id)

  if (!club) {
    return (
      <EmptyState
        title="Club not found"
        text="The link may be wrong or the club no longer exists."
        action={<Link to="/" className="btn">Browse clubs</Link>}
      />
    )
  }

  const hostView = role === 'host'
  const isHost = isHostOf(club)
  const member = isMember(club)
  const requested = hasRequested(club)
  const upcomingEvents = getUpcomingEvents(club)
  const activeTab = tab === 'requests' && !isHost ? 'events' : tab
  const rating = getRating(club)
  const myFeedback = club.feedback.find((item) => item.authorId === user.id)
  const canModerate = canHost && (club.hostId === user.id || isRoot)
  const canChat = member || canModerate

  const tabs = [
    { id: 'events', label: 'Events', count: upcomingEvents.length },
    { id: 'members', label: 'Members', count: club.members.length },
    { id: 'announcements', label: 'Announcements', count: club.announcements.length },
    { id: 'chat', label: 'Chat' },
    { id: 'polls', label: 'Polls', count: club.polls.length },
    { id: 'feedback', label: 'Feedback', count: club.feedback.length },
  ]
  if (isHost) tabs.push({ id: 'requests', label: 'Requests', count: club.requests.length })

  function handleDelete() {
    if (!window.confirm(`Delete ${club.name}? This removes its members, events and announcements.`)) return
    navigate('/')
    deleteClub(club.id)
  }

  function handleDeletePoll(poll) {
    if (!window.confirm(`Delete the poll "${poll.question}"? Its votes are removed too.`)) return
    deletePoll(poll.id)
  }

  const activity = getActivity(club)
  const stats = [
    { label: 'Members', value: club.members.length },
    { label: 'Upcoming events', value: upcomingEvents.length },
    { label: 'Activity score', value: activity.score, hint: `${activity.level} activity` },
    hostView
      ? { label: 'Pending requests', value: club.requests.length }
      : { label: 'Your RSVPs', value: upcomingEvents.filter((event) => event.going).length },
  ]

  return (
    <>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Clubs</Link>
        <span aria-hidden="true">/</span>
        <span className="breadcrumbs-current" aria-current="page">{club.name}</span>
      </nav>

      <header className="club-header">
        <ClubLogo club={club} size="lg" />
        <div className="club-header-main">
          <h1>{club.name}</h1>
          <div className="club-meta">
            <span>{club.category}</span>
            <span aria-hidden="true">·</span>
            <span>{memberCount(club)}</span>
            <span aria-hidden="true">·</span>
            <span>Hosted by {club.host}</span>
            {rating.count > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="rating-inline">
                  <Stars value={rating.average} />
                  {rating.average.toFixed(1)}
                </span>
              </>
            )}
            <ActivityBadge club={club} />
          </div>
          <p className="club-description">{club.description}</p>
        </div>
        {!hostView && member && <button type="button" className="btn btn-leave" onClick={() => leaveClub(club.id)}>Leave</button>}
        {!hostView && requested && <button type="button" className="btn" onClick={() => leaveClub(club.id)}>Cancel request</button>}
        {!hostView && !member && !requested && (
          <button type="button" className="btn btn-primary" onClick={() => joinClub(club.id)}>Request to join</button>
        )}
        {isHost && <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete club</button>}
      </header>

      <div className="stats">
        {stats.map((stat) => (
          <div key={stat.label} className="card stat">
            <p className="stat-label">{stat.label}</p>
            <p className="stat-value">{stat.value}</p>
            {stat.hint && <p className="stat-hint">{stat.hint}</p>}
          </div>
        ))}
      </div>

      {isHost && (
        <p className="host-note">You host this club: review requests, add events, post announcements, run polls, moderate the chat or delete it.</p>
      )}
      {hostView && !isHost && (
        <p className="host-note">Only {club.host} can manage this club.</p>
      )}

      <div className="tabs" role="tablist" aria-label="Club sections">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            className="tab"
            aria-selected={activeTab === item.id}
            onClick={() => setTab(item.id)}
          >
            {item.label}
            {item.count !== undefined && (
              <span className={item.id === 'requests' && item.count > 0 ? 'tab-count tab-count-alert' : 'tab-count'}>
                {item.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="tab-panel" role="tabpanel" key={activeTab}>
        {activeTab === 'events' && (
          <>
            {isHost && <AddEventForm onAdd={(event) => addEvent(club.id, event)} />}
            {!hostView && !member && upcomingEvents.length > 0 && <p className="muted panel-note">Join this club to RSVP to events.</p>}
            {upcomingEvents.length > 0 ? (
              <ul className="list">
                {upcomingEvents.map((event) => (
                  <EventItem
                    key={event.id}
                    event={event}
                    canRsvp={member && !hostView}
                    onToggleRsvp={() => toggleRsvp(club.id, event.id)}
                  />
                ))}
              </ul>
            ) : (
              <EmptyState title="No upcoming events" text="Check back soon or ask a host what's planned." />
            )}
          </>
        )}

        {activeTab === 'members' && (
          club.members.length > 0 ? (
            <ul className="list">
              {club.members.map((person) => (
                <li key={person.id} className="list-item">
                  <span className="avatar" aria-hidden="true">{getInitials(person.name)}</span>
                  <span className="item-title list-item-body">{person.name}</span>
                  {person.id === user.id && <span className="chip chip-accent">You</span>}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No members yet" text="Approved join requests will show up here." />
          )
        )}

        {activeTab === 'announcements' && (
          <>
            {isHost && <PostAnnouncementForm onPost={(text) => postAnnouncement(club.id, text)} />}
            {club.announcements.length > 0 ? (
              <ul className="list">
                {club.announcements.map((announcement) => (
                  <AnnouncementItem key={announcement.id} announcement={announcement} />
                ))}
              </ul>
            ) : (
              <EmptyState title="No announcements yet" text="Updates from hosts will show up here." />
            )}
          </>
        )}

        {activeTab === 'chat' && (
          canChat ? (
            <ClubChat key={club.id} club={club} canModerate={canModerate} />
          ) : (
            <EmptyState title="Members only" text="Join this club to read and send messages." />
          )
        )}

        {activeTab === 'polls' && (
          <>
            {isHost && <PollForm onCreate={(question, options) => createPoll(club.id, question, options)} />}
            {!hostView && !member && club.polls.length > 0 && <p className="muted panel-note">Join this club to vote.</p>}
            {club.polls.length > 0 ? (
              <ul className="list">
                {club.polls.map((poll) => (
                  <PollCard
                    key={poll.id}
                    poll={poll}
                    canVote={member && !hostView}
                    canDelete={isHost}
                    onVote={(choice) => vote(poll, choice)}
                    onDelete={() => handleDeletePoll(poll)}
                  />
                ))}
              </ul>
            ) : (
              <EmptyState title="No polls yet" text="Hosts can ask the club a question here and see the votes come in live." />
            )}
          </>
        )}

        {activeTab === 'feedback' && (
          <>
            {rating.count > 0 && <RatingSummary rating={rating} />}
            {member && !hostView && !myFeedback && (
              <FeedbackForm key={club.id} onSubmit={(stars, text) => addFeedback(club.id, stars, text)} />
            )}
            {member && !hostView && myFeedback && (
              <p className="muted panel-note">You rated this club {myFeedback.rating} out of 5. Feedback is final once posted.</p>
            )}
            {!hostView && !member && <p className="muted panel-note">Join this club to leave feedback.</p>}
            {club.feedback.length > 0 ? (
              <ul className="list">
                {club.feedback.map((item) => (
                  <FeedbackItem key={item.id} feedback={item} />
                ))}
              </ul>
            ) : (
              <EmptyState title="No feedback yet" text="Members can rate the club out of 5 stars and say what they think." />
            )}
          </>
        )}

        {activeTab === 'requests' && (
          club.requests.length > 0 ? (
            <ul className="list">
              {club.requests.map((person) => (
                <li key={person.id} className="list-item">
                  <span className="avatar" aria-hidden="true">{getInitials(person.name)}</span>
                  <div className="list-item-body">
                    <p className="item-title">{person.name}</p>
                    <p className="muted small">Wants to join</p>
                  </div>
                  <div className="button-row">
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => rejectRequest(club.id, person)}>Reject</button>
                    <button type="button" className="btn btn-sm btn-primary" onClick={() => approveRequest(club.id, person)}>Approve</button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No pending requests" text="New join requests will show up here." />
          )
        )}
      </div>
    </>
  )
}
