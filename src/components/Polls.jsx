import { useState } from 'react'

const EMPTY_OPTIONS = ['', '']
const MAX_OPTIONS = 6

export function PollForm({ onCreate }) {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(EMPTY_OPTIONS)

  const filled = options.map((option) => option.trim()).filter(Boolean)

  function updateOption(index, value) {
    setOptions(options.map((option, i) => (i === index ? value : option)))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const created = await onCreate(question.trim(), filled)
    if (created) {
      setQuestion('')
      setOptions(EMPTY_OPTIONS)
    }
  }

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <h3>New poll</h3>
      <div className="field">
        <label htmlFor="poll-question">Question</label>
        <input
          id="poll-question"
          className="input"
          required
          maxLength={200}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Which day suits everyone?"
        />
      </div>
      <div className="field">
        <label htmlFor="poll-option-0">Options</label>
        <div className="poll-inputs">
          {options.map((option, index) => (
            <div key={index} className="poll-input-row">
              <input
                id={`poll-option-${index}`}
                className="input"
                aria-label={`Option ${index + 1}`}
                maxLength={100}
                value={option}
                onChange={(event) => updateOption(index, event.target.value)}
                placeholder={`Option ${index + 1}`}
              />
              {options.length > 2 && (
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => setOptions(options.filter((_, i) => i !== index))}>
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="form-actions">
        {options.length < MAX_OPTIONS && (
          <button type="button" className="btn btn-ghost" onClick={() => setOptions([...options, ''])}>Add option</button>
        )}
        <button type="submit" className="btn btn-primary" disabled={!question.trim() || filled.length < 2}>Create poll</button>
      </div>
    </form>
  )
}

export function PollCard({ poll, canVote, canDelete, onVote, onDelete }) {
  const total = poll.votes.length

  let hint = ''
  if (canVote) hint = poll.myChoice === null ? ' · Tap an option to vote' : ' · Tap another option to change your vote'

  return (
    <li className="poll">
      <div className="poll-header">
        <div className="list-item-body">
          <p className="item-title">{poll.question}</p>
          <p className="muted small">{total} {total === 1 ? 'vote' : 'votes'}{hint}</p>
        </div>
        {canDelete && <button type="button" className="btn btn-sm btn-danger" onClick={onDelete}>Delete</button>}
      </div>

      <div className="poll-options">
        {poll.options.map((option, index) => {
          const count = poll.votes.filter((vote) => vote.choice === index).length
          const share = total > 0 ? Math.round((count / total) * 100) : 0
          const mine = poll.myChoice === index
          return (
            <button
              key={index}
              type="button"
              className={mine ? 'poll-option poll-option-mine' : 'poll-option'}
              disabled={!canVote}
              aria-pressed={mine}
              onClick={() => onVote(index)}
            >
              <span className="poll-bar" style={{ width: `${share}%` }} />
              <span className="poll-label">{mine ? `✓ ${option}` : option}</span>
              <span className="poll-count">{share}% · {count}</span>
            </button>
          )
        })}
      </div>
    </li>
  )
}
