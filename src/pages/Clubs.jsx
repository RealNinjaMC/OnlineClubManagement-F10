import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ActivityBadge from '../components/ActivityBadge'
import ClubCard, { ClubLogo } from '../components/ClubCard'
import EmptyState from '../components/EmptyState'
import { useClubs } from '../context/ClubsContext'
import { CATEGORIES, dateFromToday } from '../data/seed'
import { getActivity, getUpcomingEvents } from '../utils/activity'

const SORT_OPTIONS = [
  { id: 'activity', label: 'Most active' },
  { id: 'members', label: 'Most members' },
  { id: 'name', label: 'Name A–Z' },
]

const VIEWS = [
  { id: 'grid', label: 'Grid' },
  { id: 'table', label: 'Table' },
]

const EMPTY_CLUB = { name: '', category: CATEGORIES[0], description: '', tags: '' }

function CreateClubForm({ onCreate, onCancel }) {
  const [form, setForm] = useState(EMPTY_CLUB)

  function updateField(field) {
    return (event) => setForm({ ...form, [field]: event.target.value })
  }

  function handleSubmit(event) {
    event.preventDefault()
    const tags = [...new Set(form.tags.split(',').map((tag) => tag.trim().toLowerCase()).filter(Boolean))]
    onCreate({ name: form.name.trim(), category: form.category, description: form.description.trim(), tags })
  }

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <h3>New club</h3>
      <div className="form-grid">
        <div className="field field-span-2">
          <label htmlFor="club-name">Name</label>
          <input id="club-name" className="input" required autoFocus value={form.name} onChange={updateField('name')} />
        </div>
        <div className="field">
          <label htmlFor="club-category">Category</label>
          <select id="club-category" className="input select" value={form.category} onChange={updateField('category')}>
            {CATEGORIES.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
        <div className="field field-wide">
          <label htmlFor="club-description">Description</label>
          <textarea id="club-description" className="input" required value={form.description} onChange={updateField('description')} />
        </div>
        <div className="field field-wide">
          <label htmlFor="club-tags">Interests</label>
          <input id="club-tags" className="input" required value={form.tags} onChange={updateField('tags')} placeholder="Separate with commas" />
        </div>
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary">Create club</button>
      </div>
    </form>
  )
}

function sortClubs(clubs, sortBy) {
  return [...clubs].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    if (sortBy === 'members') return b.members.length - a.members.length
    return getActivity(b).score - getActivity(a).score
  })
}

export default function Clubs() {
  const { clubs, role, setRole, isMember, hasRequested, createClub } = useClubs()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [sortBy, setSortBy] = useState('activity')
  const [view, setView] = useState('grid')
  const searchRef = useRef(null)

  useEffect(() => {
    function handleKeyDown(event) {
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)
      if (event.key === '/' && !isTyping) {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const weekAhead = dateFromToday(7)
  const stats = [
    { label: 'Clubs', value: clubs.length },
    { label: 'Total members', value: clubs.reduce((sum, club) => sum + club.members.length, 0) },
    {
      label: 'Events this week',
      value: clubs.reduce((sum, club) => sum + getUpcomingEvents(club).filter((event) => event.date <= weekAhead).length, 0),
    },
    { label: 'Joined by you', value: clubs.filter(isMember).length },
  ]

  const categories = ['All', ...new Set(clubs.map((club) => club.category))]
  const query = search.trim().toLowerCase()

  const filteredClubs = clubs.filter((club) => {
    const inCategory = category === 'All' || club.category === category
    const matchesSearch = club.name.toLowerCase().includes(query) || club.tags.some((tag) => tag.includes(query))
    return inCategory && matchesSearch
  })
  const visibleClubs = sortClubs(filteredClubs, sortBy)

  const isHost = role === 'host'

  function handleCreate(club) {
    navigate(`/club/${createClub(club)}`)
  }

  function clearFilters() {
    setSearch('')
    setCategory('All')
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Clubs</h1>
          <p className="page-subtitle">Browse, compare and join clubs on campus.</p>
        </div>
        {isHost && !creating && (
          <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>New club</button>
        )}
      </div>

      {isHost && creating && <CreateClubForm onCreate={handleCreate} onCancel={() => setCreating(false)} />}

      {clubs.length === 0 && !creating && (
        <EmptyState
          title="No clubs yet"
          text={isHost ? 'Create the first club to get started.' : 'Switch to Host view to create the first club.'}
          action={
            isHost ? (
              <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>New club</button>
            ) : (
              <button type="button" className="btn" onClick={() => setRole('host')}>Switch to Host</button>
            )
          }
        />
      )}

      {clubs.length > 0 && (
        <>
          <div className="stats">
            {stats.map((stat) => (
              <div key={stat.label} className="card stat">
                <p className="stat-label">{stat.label}</p>
                <p className="stat-value">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="toolbar">
            <div className="search">
              <svg className="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <label htmlFor="club-search" className="visually-hidden">Search clubs</label>
              <input
                id="club-search"
                ref={searchRef}
                type="search"
                className="input"
                placeholder="Search by name or interest"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <kbd className="kbd" aria-hidden="true">/</kbd>
            </div>

            <div className="toolbar-end">
              <label htmlFor="club-sort" className="visually-hidden">Sort clubs</label>
              <select id="club-sort" className="input select" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                {SORT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>

              <div className="segmented" role="group" aria-label="Layout">
                {VIEWS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className="segmented-option"
                    aria-pressed={view === option.id}
                    onClick={() => setView(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pill-group filter-row" role="group" aria-label="Filter by category">
            {categories.map((name) => (
              <button
                key={name}
                type="button"
                className="pill"
                aria-pressed={category === name}
                onClick={() => setCategory(name)}
              >
                {name}
              </button>
            ))}
            <span className="muted small result-count">{visibleClubs.length} of {clubs.length}</span>
          </div>

          {visibleClubs.length === 0 && (
            <EmptyState
              title="No clubs found"
              text="Try a different search or category."
              action={<button type="button" className="btn" onClick={clearFilters}>Clear filters</button>}
            />
          )}

          {visibleClubs.length > 0 && view === 'grid' && (
            <div className="club-grid">
              {visibleClubs.map((club, index) => (
                <ClubCard key={club.id} club={club} index={index} joined={isMember(club)} requested={hasRequested(club)} />
              ))}
            </div>
          )}

          {visibleClubs.length > 0 && view === 'table' && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Club</th>
                    <th>Category</th>
                    <th className="num">Members</th>
                    <th className="num">Upcoming events</th>
                    <th>Activity</th>
                    <th><span className="visually-hidden">Status</span></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleClubs.map((club) => (
                    <tr key={club.id}>
                      <td>
                        <Link to={`/club/${club.id}`} className="table-club">
                          <ClubLogo club={club} size="sm" />
                          <span className="item-title">{club.name}</span>
                        </Link>
                      </td>
                      <td className="muted">{club.category}</td>
                      <td className="num">{club.members.length}</td>
                      <td className="num">{getUpcomingEvents(club).length}</td>
                      <td><ActivityBadge club={club} /></td>
                      <td className="cell-end">
                        {isMember(club) && <span className="chip chip-accent">Member</span>}
                        {hasRequested(club) && <span className="chip">Requested</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  )
}
