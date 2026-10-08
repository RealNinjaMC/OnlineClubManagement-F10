import { useState } from 'react'
import { STARS } from '../utils/rating'
import { formatDaysAgo } from './AnnouncementItem'
import { getInitials } from './ClubCard'

const RATING_LABELS = ['Tap a star', 'Poor', 'Fair', 'Good', 'Great', 'Loved it']

export function Stars({ value }) {
  return (
    <span className="stars" role="img" aria-label={`${value} out of 5 stars`}>
      {STARS.map((star) => (
        <span
          key={star}
          className={star <= Math.round(value) ? 'star star-on' : 'star'}
          style={{ '--i': star }}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </span>
  )
}

export function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  const shown = hovered || value

  return (
    <div className="star-picker" role="radiogroup" aria-label="Rating" onMouseLeave={() => setHovered(0)}>
      {STARS.map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          className={star <= shown ? 'star star-on' : 'star'}
          style={{ '--i': star }}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
        >
          <span
            key={value}
            className={`star-glyph${star <= value ? ' star-picked' : ''}${star === value ? ' star-burst' : ''}`}
          >
            ★
          </span>
        </button>
      ))}
      <span className={shown ? 'star-label star-label-on' : 'star-label'}>{RATING_LABELS[shown]}</span>
    </div>
  )
}

export function RatingSummary({ rating }) {
  return (
    <div className="card rating-summary">
      <div className="rating-average">
        <span className="rating-average-value">{rating.average.toFixed(1)}</span>
        <Stars value={rating.average} />
        <span className="muted small">{rating.count} {rating.count === 1 ? 'review' : 'reviews'}</span>
      </div>
      <ul className="rating-bars">
        {rating.breakdown.map((row) => (
          <li key={row.star} className="rating-bar">
            <span>{row.star} ★</span>
            <div className="rating-bar-track">
              <div className="rating-bar-fill" style={{ width: `${(row.count / rating.count) * 100}%` }} />
            </div>
            <span>{row.count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function FeedbackForm({ onSubmit }) {
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit(rating, text.trim())
  }

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <h3>Rate this club</h3>
      <StarPicker value={rating} onChange={setRating} />
      <div className="field">
        <label htmlFor="feedback-text" className="visually-hidden">Feedback</label>
        <textarea
          id="feedback-text"
          className="input"
          required
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="What do you enjoy, and what could be better?"
        />
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={rating === 0 || !text.trim()}>
          Submit feedback
        </button>
      </div>
    </form>
  )
}

export function FeedbackItem({ feedback }) {
  return (
    <li className="list-item feedback-item">
      <span className="avatar" aria-hidden="true">{getInitials(feedback.author)}</span>
      <div className="list-item-body feedback-body">
        <div className="announcement-meta">
          <span className="item-title">{feedback.author}</span>
          <Stars value={feedback.rating} />
          <span className="muted small">{formatDaysAgo(feedback.date)}</span>
        </div>
        <p>{feedback.text}</p>
      </div>
    </li>
  )
}
