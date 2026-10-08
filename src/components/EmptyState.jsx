export default function EmptyState({ title, text, action }) {
  return (
    <div className="empty-state">
      <p className="empty-state-title">{title}</p>
      {text && <p className="muted">{text}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  )
}
