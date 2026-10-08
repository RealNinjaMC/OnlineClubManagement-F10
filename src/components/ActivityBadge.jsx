import { getActivity } from '../utils/activity'

export default function ActivityBadge({ club }) {
  const { level, score } = getActivity(club)

  return (
    <span className={`activity activity-${level.toLowerCase()}`} title={`Activity score: ${score}`}>
      <span className="activity-dot" aria-hidden="true" />
      {level} activity
    </span>
  )
}
