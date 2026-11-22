export default function ProgressBar({ value = 0, tone = 'indigo', label, showValue = false }) {
  const clamped = Math.min(100, Math.max(0, Number(value) || 0))
  return (
    <div className="progress">
      {label || showValue ? (
        <div className="progress__meta">
          {label ? <span>{label}</span> : null}
          {showValue ? <span>{clamped.toFixed(0)}%</span> : null}
        </div>
      ) : null}
      <div
        className="progress__track"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Progress'}
      >
        <div className={`progress__bar progress__bar--${tone}`} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  )
}
