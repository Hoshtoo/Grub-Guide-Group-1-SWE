import './Progress.css'

const STEPS = ['Shopping List', 'Select Store', 'Choose Products', 'Receipt']

export default function Progress({ step }) {
  return (
    <nav className="progress-bar" aria-label="Steps">
      {STEPS.map((label, i) => {
        const num    = i + 1
        const active = num === step
        const done   = num < step
        return (
          <div key={num} className="progress-item">
            <div className={`step-pill ${active ? 'active' : ''} ${done ? 'done' : ''}`}>
              <div className="step-num">
                {done ? '✓' : num}
              </div>
              <span className="step-label">{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`step-divider ${done ? 'done' : ''}`} />
            )}
          </div>
        )
      })}
    </nav>
  )
}