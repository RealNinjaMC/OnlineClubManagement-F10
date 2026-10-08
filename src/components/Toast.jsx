import { useClubs } from '../context/ClubsContext'

export default function Toast() {
  const { toast } = useClubs()

  return (
    <div className="toast-region" role="status" aria-live="polite">
      {toast && (
        <div key={toast.id} className={`toast toast-${toast.tone}`}>
          <svg className="toast-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" fill="currentColor" />
            {toast.tone === 'error' && (
              <path d="M8 4.5v4M8 11.2v.1" stroke="var(--color-raised)" strokeWidth="1.6" strokeLinecap="round" />
            )}
            {toast.tone === 'info' && (
              <path d="M5.5 10.5h5M6 10.5V7.8a2 2 0 0 1 4 0v2.7M7.3 12h1.4" stroke="var(--color-raised)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            )}
            {toast.tone === 'success' && (
              <path d="M5 8.2 7 10l4-4" stroke="var(--color-raised)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            )}
          </svg>
          {toast.message}
        </div>
      )}
    </div>
  )
}
