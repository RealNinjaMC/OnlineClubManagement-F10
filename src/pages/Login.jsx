import { useState } from 'react'
import { FlameIcon } from '../components/Header'
import { useAuth } from '../context/AuthContext'

const MODES = [
  { id: 'signin', label: 'Sign in' },
  { id: 'signup', label: 'Create account' },
]

export default function Login() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('signin')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const signingUp = mode === 'signup'

  function updateField(field) {
    return (event) => setForm({ ...form, [field]: event.target.value })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    const email = form.email.trim()
    const error = signingUp ? await signUp(form.name.trim(), email, form.password) : await signIn(email, form.password)
    setMessage(error || '')
    setBusy(false)
  }

  return (
    <div className="auth-page">
      <form className="card form auth-card" onSubmit={handleSubmit}>
        <div className="brand auth-brand">
          <span className="brand-mark">
            <FlameIcon />
          </span>
          Campfire
        </div>
        <p className="muted">{signingUp ? 'Create a member account to join clubs.' : 'Sign in to see your clubs.'}</p>

        <div className="segmented" role="group" aria-label="Account">
          {MODES.map((option) => (
            <button
              key={option.id}
              type="button"
              className="segmented-option"
              aria-pressed={mode === option.id}
              onClick={() => {
                setMode(option.id)
                setMessage('')
              }}
            >
              {option.label}
            </button>
          ))}
        </div>

        {signingUp && (
          <div className="field">
            <label htmlFor="auth-name">Name</label>
            <input id="auth-name" className="input" required maxLength={40} autoComplete="name" value={form.name} onChange={updateField('name')} />
          </div>
        )}
        <div className="field">
          <label htmlFor="auth-email">Email</label>
          <input id="auth-email" type="email" className="input" required autoComplete="email" value={form.email} onChange={updateField('email')} />
        </div>
        <div className="field">
          <label htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            type="password"
            className="input"
            required
            minLength={signingUp ? 8 : undefined}
            autoComplete={signingUp ? 'new-password' : 'current-password'}
            value={form.password}
            onChange={updateField('password')}
          />
          {signingUp && <p className="muted small">At least 8 characters.</p>}
        </div>

        {message && <p className="auth-message" role="alert">{message}</p>}

        <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>
          {busy ? 'Please wait…' : signingUp ? 'Create account' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
