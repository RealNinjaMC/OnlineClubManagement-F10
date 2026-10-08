export const CHART_COLORS = ['#3B82F6', '#34D399', '#FBBF24', '#F472B6', '#A78BFA', '#22D3EE', '#FB923C', '#F87171']

const LEVEL_COLORS = { High: '#34D399', Medium: '#FBBF24', Low: '#F87171' }

function thresholdColor(value) {
  if (value >= 70) return LEVEL_COLORS.High
  if (value >= 40) return LEVEL_COLORS.Medium
  return LEVEL_COLORS.Low
}

function shortDate(date) {
  return new Date(`${date}T00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function Panel({ title, className = '', children }) {
  return (
    <section className={`card panel ${className}`}>
      <h2 className="panel-title">{title}</h2>
      <div className="panel-body">{children}</div>
    </section>
  )
}

export function StatPanel({ title, value, color }) {
  return (
    <Panel title={title} className="panel-stat">
      <p className="panel-stat-value" style={{ color }}>{value}</p>
    </Panel>
  )
}

export function TimeSeries({ days, series, todayIndex }) {
  const width = 720
  const height = 240
  const left = 32
  const right = 12
  const top = 12
  const bottom = 28

  const highest = Math.max(1, ...series.flatMap((line) => days.map((day) => day[line.key])))
  const max = Math.ceil(highest / 4) * 4
  const ticks = [0, 1, 2, 3, 4].map((step) => (max / 4) * step)

  const x = (index) => left + (index / (days.length - 1)) * (width - left - right)
  const y = (value) => top + (1 - value / max) * (height - top - bottom)

  return (
    <div className="timeseries">
      <div className="timeseries-scroll">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Events and announcements per day">
          <defs>
            {series.map((line) => (
              <linearGradient key={line.key} id={`fill-${line.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={line.color} stopOpacity="0.35" />
                <stop offset="100%" stopColor={line.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={left} x2={width - right} y1={y(tick)} y2={y(tick)} className="chart-grid" />
              <text x={left - 8} y={y(tick) + 4} textAnchor="end" className="chart-axis">{tick}</text>
            </g>
          ))}

          {days.map((day, index) => index % 7 === 0 && index < days.length - 1 && (
            <text key={day.date} x={x(index)} y={height - 8} textAnchor={index === 0 ? 'start' : 'middle'} className="chart-axis">
              {shortDate(day.date)}
            </text>
          ))}

          <line x1={x(todayIndex)} x2={x(todayIndex)} y1={top} y2={height - bottom} className="chart-now" />
          <text x={x(todayIndex) + 4} y={top + 10} className="chart-axis">Today</text>

          {series.map((line) => {
            const points = days.map((day, index) => `${x(index)},${y(day[line.key])}`)
            return (
              <g key={line.key}>
                <path
                  d={`M${x(0)},${y(0)} L${points.join(' L')} L${x(days.length - 1)},${y(0)} Z`}
                  fill={`url(#fill-${line.key})`}
                  className="chart-area"
                />
                <path d={`M${points.join(' L')}`} stroke={line.color} pathLength="1" className="chart-line" />
              </g>
            )
          })}
        </svg>
      </div>

      <div className="chart-legend">
        {series.map((line) => (
          <span key={line.key} className="chart-legend-item">
            <span className="chart-swatch" style={{ background: line.color }} />
            {line.name}
          </span>
        ))}
      </div>
    </div>
  )
}

export function BarGauge({ items }) {
  const max = Math.max(20, ...items.map((item) => item.value))

  return (
    <ul className="bar-gauge">
      {items.map((item) => {
        const color = LEVEL_COLORS[item.level]
        return (
          <li key={item.label} className="bar-gauge-row">
            <span className="bar-gauge-label">{item.label}</span>
            <div className="bar-gauge-track">
              <div className="bar-gauge-fill" style={{ width: `${(item.value / max) * 100}%`, '--bar': color }} />
            </div>
            <span className="bar-gauge-value" style={{ color }}>{item.value}</span>
          </li>
        )
      })}
    </ul>
  )
}

export function Donut({ items }) {
  const total = items.reduce((sum, item) => sum + item.value, 0)
  let start = 0

  return (
    <div className="donut">
      <svg viewBox="0 0 42 42" className="donut-chart" role="img" aria-label="Clubs by category">
        <circle cx="21" cy="21" r="15.915" className="donut-track" />
        {items.map((item, index) => {
          const share = (item.value / total) * 100
          const offset = 25 - start
          start += share
          return (
            <circle
              key={item.label}
              cx="21"
              cy="21"
              r="15.915"
              className="donut-slice"
              stroke={CHART_COLORS[index % CHART_COLORS.length]}
              strokeDasharray={`${share} ${100 - share}`}
              strokeDashoffset={offset}
            />
          )
        })}
        <text x="21" y="21" textAnchor="middle" className="donut-total">{total}</text>
        <text x="21" y="26.5" textAnchor="middle" className="donut-caption">clubs</text>
      </svg>

      <ul className="donut-legend">
        {items.map((item, index) => (
          <li key={item.label}>
            <span className="chart-swatch" style={{ background: CHART_COLORS[index % CHART_COLORS.length] }} />
            <span className="donut-legend-label">{item.label}</span>
            <span className="muted">{Math.round((item.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Gauge({ value, caption }) {
  const color = thresholdColor(value)

  return (
    <div className="gauge">
      <svg viewBox="0 0 100 60" role="img" aria-label={`${value}%`}>
        <path d="M10 52 A40 40 0 0 1 90 52" pathLength="100" className="gauge-track" />
        {value > 0 && (
          <path
            d="M10 52 A40 40 0 0 1 90 52"
            pathLength="100"
            className="gauge-value"
            stroke={color}
            strokeDasharray={`${value} 100`}
          />
        )}
        <text x="50" y="48" textAnchor="middle" className="gauge-text" fill={color}>{value}%</text>
      </svg>
      <p className="muted small">{caption}</p>
    </div>
  )
}

export function ColumnChart({ items }) {
  const max = Math.max(1, ...items.map((item) => item.value))

  return (
    <div className="column-chart">
      {items.map((item, index) => (
        <div key={item.label} className="column">
          <span className="column-value">{item.value}</span>
          <div className="column-slot">
            <div
              className="column-bar"
              style={{ height: `${(item.value / max) * 100}%`, background: CHART_COLORS[index % CHART_COLORS.length] }}
            />
          </div>
          <span className="column-label">{item.label}</span>
        </div>
      ))}
    </div>
  )
}
