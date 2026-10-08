import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useClubs } from '../context/ClubsContext'
import { supabase } from '../lib/supabase'
import { getInitials } from './ClubCard'

function formatTime(value) {
  const date = new Date(value)
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (date.toDateString() === new Date().toDateString()) return time
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${time}`
}

export default function ClubChat({ club, canModerate }) {
  const { user } = useAuth()
  const { showToast, setOpenChat } = useClubs()
  const [messages, setMessages] = useState(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const scroller = useRef(null)

  async function load() {
    const { data, error } = await supabase
      .from('messages')
      .select('id, text, created_at, author:profiles!user_id(id, name)')
      .eq('club_id', club.id)
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) showToast(error.message, 'error')
    else setMessages(data.reverse())
  }

  function removeMessage(id) {
    setMessages((list) => list && list.filter((message) => message.id !== id))
  }

  useEffect(() => {
    load()
    setOpenChat(club.id)
    const channel = supabase
      .channel(`chat-${club.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `club_id=eq.${club.id}` }, load)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, (payload) => removeMessage(payload.old.id))
      .subscribe()
    return () => {
      setOpenChat(null)
      supabase.removeChannel(channel)
    }
  }, [club.id])

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight
  }, [messages])

  async function handleSend(event) {
    event.preventDefault()
    const body = text.trim()
    if (!body) return
    setSending(true)
    const { error } = await supabase.from('messages').insert({ club_id: club.id, text: body })
    setSending(false)
    if (error) {
      showToast(error.message, 'error')
      return
    }
    setText('')
    load()
  }

  async function handleDelete(message) {
    const { error } = await supabase.from('messages').delete().eq('id', message.id)
    if (error) showToast(error.message, 'error')
    else removeMessage(message.id)
  }

  return (
    <div className="card chat">
      <div className="chat-messages" ref={scroller}>
        {messages === null && <p className="muted chat-note">Loading messages…</p>}
        {messages?.length === 0 && <p className="muted chat-note">No messages yet. Say hi to the club!</p>}
        {messages?.map((message) => {
          const mine = message.author.id === user.id
          return (
            <div key={message.id} className={mine ? 'chat-message chat-message-mine' : 'chat-message'}>
              {!mine && <span className="avatar avatar-sm" aria-hidden="true">{getInitials(message.author.name)}</span>}
              <div className="chat-bubble">
                <p className="chat-meta">
                  {!mine && <span className="chat-author">{message.author.name}</span>}
                  {message.author.id === club.hostId && <span className="chat-host">Host</span>}
                  <span>{formatTime(message.created_at)}</span>
                </p>
                <p className="chat-text">{message.text}</p>
              </div>
              {(mine || canModerate) && (
                <button type="button" className="chat-delete" aria-label="Delete message" onClick={() => handleDelete(message)}>
                  ×
                </button>
              )}
            </div>
          )
        })}
      </div>

      <form className="chat-form" onSubmit={handleSend}>
        <label htmlFor="chat-input" className="visually-hidden">Message</label>
        <input
          id="chat-input"
          className="input"
          autoComplete="off"
          maxLength={500}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={`Message ${club.name}`}
        />
        <button type="submit" className="btn btn-primary" disabled={sending || !text.trim()}>Send</button>
      </form>
    </div>
  )
}
