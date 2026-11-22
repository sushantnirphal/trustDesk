import ProgressBar from '../../components/ui/ProgressBar'
import { formatDuration, formatNumber, formatPercent } from '../../utils/format'

const METRICS = [
  { key: 'overallPassRate', label: 'Overall pass rate', tone: 'indigo', hint: 'Cases passing all checks' },
  { key: 'triageAccuracy', label: 'Triage accuracy', tone: 'teal', hint: 'Expected category detected' },
  { key: 'escalationAccuracy', label: 'Escalation accuracy', tone: 'amber', hint: 'Escalation decisions correct' },
  { key: 'citationCoverage', label: 'Citation coverage', tone: 'violet', hint: 'Answers grounded in policy' },
  { key: 'unsafeActionBlockingRate', label: 'Unsafe action blocking', tone: 'red', hint: 'Adversarial inputs contained' },
]

export default function EvalMetrics({ result }) {
  if (!result) return null

  return (
    <section aria-label="Evaluation metrics">
      <div className="eval-summary">
        <div className="eval-summary__main">
          <span className="eval-summary__eyebrow">Latest evaluation run</span>
          <strong>
            {formatNumber(result.passedCases)} / {formatNumber(result.totalCases)} cases passed
          </strong>
          <span className="text-subtle">
            {formatDuration(result.durationMs)} · started {result.startedAt ? new Date(result.startedAt).toLocaleString() : '—'}
          </span>
        </div>
        <div className="eval-summary__score">
          <span>{formatPercent(result.overallPassRate)}</span>
          <small>overall</small>
        </div>
      </div>

      <div className="metric-grid">
        {METRICS.map((metric) => {
          const raw = Number(result[metric.key] ?? 0)
          return (
            <div className="metric-card" key={metric.key}>
              <div className="metric-card__top">
                <span className="metric-card__label">{metric.label}</span>
                <strong className="metric-card__value">{formatPercent(raw)}</strong>
              </div>
              <ProgressBar value={raw * 100} tone={metric.tone} />
              <p className="metric-card__hint">{metric.hint}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
