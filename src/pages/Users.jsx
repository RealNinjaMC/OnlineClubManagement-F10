import { useEffect, useState } from 'react'
import { getInitials } from '../components/ClubCard'
import EmptyState from '../components/EmptyState'
import { useAuth } from '../context/AuthContext'
import { useClubs } from '../context/ClubsContext'
import { supabase } from '../lib/supabase'

const ROLE_LABELS = { root: 'Root', host: 'Host', member: 'Member' }

export default function Users() {
  const { isRoot, listUsers, setUserRole } = useAuth()
  const { showToast } = useClubs()
  const [users, setUsers] = useState(null)
  const [search, setSearch] = useState('')

  async function load() {
    const { data, error } = await listUsers()
    if (error) showToast(error.message, 'error')
    else setUsers(data)
  }

  useEffect(() => {
    if (!isRoot) return
    load()
    const channel = supabase
      .channel('user-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, load)
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [isRoot])

  async function changeRole(person, role) {
    const { error } = await setUserRole(person.id, role)
    if (error) {
      showToast(error.message, 'error')
      return
    }
    showToast(role === 'host' ? `${person.name} is now a host` : `${person.name} is no longer a host`)
    load()
  }

  const header = (
    <div className="page-header">
      <div>
        <h1>Users</h1>
        <p className="page-subtitle">Make people hosts so they can create and run clubs.</p>
      </div>
    </div>
  )

  if (!isRoot) {
    return (
      <>
        {header}
        <EmptyState title="Root only" text="Only the root user can manage hosts." />
      </>
    )
  }

  const query = search.trim().toLowerCase()
  const visibleUsers = (users || []).filter(
    (person) => person.name.toLowerCase().includes(query) || person.email.toLowerCase().includes(query),
  )
  const hostCount = (users || []).filter((person) => person.role === 'host').length

  return (
    <>
      {header}

      <div className="toolbar">
        <div className="search">
          <label htmlFor="user-search" className="visually-hidden">Search users</label>
          <input
            id="user-search"
            type="search"
            className="input"
            placeholder="Search by name or email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <span className="muted small">{users ? `${users.length} users · ${hostCount} hosts` : 'Loading…'}</span>
      </div>

      {users && visibleUsers.length === 0 && <EmptyState title="No users found" text="Try a different name or email." />}

      {visibleUsers.length > 0 && (
        <ul className="list">
          {visibleUsers.map((person) => (
            <li key={person.id} className="list-item">
              <span className="avatar" aria-hidden="true">{getInitials(person.name)}</span>
              <div className="list-item-body">
                <p className="item-title">{person.name}</p>
                <p className="muted small">{person.email}</p>
              </div>
              <span className={person.role === 'member' ? 'chip' : 'chip chip-accent'}>{ROLE_LABELS[person.role]}</span>
              {person.role === 'member' && (
                <button type="button" className="btn btn-sm btn-primary" onClick={() => changeRole(person, 'host')}>Make host</button>
              )}
              {person.role === 'host' && (
                <button type="button" className="btn btn-sm btn-danger" onClick={() => changeRole(person, 'member')}>Remove host</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
