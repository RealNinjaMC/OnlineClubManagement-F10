export default function Setup() {
  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1>Connect Supabase</h1>
        <p className="muted">
          Campfire needs <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_KEY</code>. Add them to <code>.env.local</code> for
          local development or to the Vercel project settings, then reload.
        </p>
      </div>
    </div>
  )
}
