import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ClubLogo } from '../components/ClubCard'
import EmptyState from '../components/EmptyState'
import { useClubs } from '../context/ClubsContext'
import { getAllTags, getMatches } from '../utils/match'

export default function Match() {
  const { clubs } = useClubs()
  const [selected, setSelected] = useState([])

  const tags = getAllTags(clubs)
  const matches = getMatches(clubs, selected)

  function toggleTag(tag) {
    setSelected(selected.includes(tag) ? selected.filter((item) => item !== tag) : [...selected, tag])
  }

  const header = (
    <div className="page-header">
      <div>
        <h1>Club Match</h1>
        <p className="page-subtitle">Pick your interests to see which clubs fit you best.</p>
      </div>
    </div>
  )

  if (tags.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          title="No clubs to match yet"
          text="Interests come from the clubs on campus. Create a club first."
          action={<Link to="/" className="btn">Go to clubs</Link>}
        />
      </>
    )
  }

  return (
    <>
      {header}

      <section className="card interest-panel">
        <div className="section-header">
          <h2>Interests</h2>
          {selected.length > 0 && (
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setSelected([])}>Clear</button>
          )}
        </div>
        <div className="pill-group" role="group" aria-label="Interests">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              className="pill"
              aria-pressed={selected.includes(tag)}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>Results</h2>
          {selected.length > 0 && <span className="muted small">{matches.length} clubs</span>}
        </div>

        {selected.length === 0 && (
          <EmptyState title="Pick at least one interest" text="Your matches will be ranked here." />
        )}

        {selected.length > 0 && matches.length === 0 && (
          <EmptyState title="No matches yet" text="Try picking a few more interests." />
        )}

        {matches.length > 0 && (
          <ol className="list">
            {matches.map(({ club, shared, score }) => (
              <li key={club.id}>
                <Link to={`/club/${club.id}`} className="list-item list-link match-row">
                  <ClubLogo club={club} />
                  <div className="list-item-body">
                    <p className="item-title">{club.name}</p>
                    <p className="muted small">Matches: {shared.join(', ')}</p>
                  </div>
                  <div className="match-bar" aria-hidden="true">
                    <div className="match-bar-fill" style={{ width: `${score}%` }} />
                  </div>
                  <span className="match-score">{score}%</span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  )
}
