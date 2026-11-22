import Icon from './Icon'
import Skeleton from './Skeleton'

const TONE_CLASS = {
  indigo: 'stat-card--indigo',
  teal: 'stat-card--teal',
  amber: 'stat-card--amber',
  red: 'stat-card--red',
  slate: 'stat-card--slate',
}

export default function StatCard({ label, value, meta, icon = 'dot', tone = 'indigo', loading = false }) {
  return (
    <div className={`stat-card ${TONE_CLASS[tone] ?? ''}`}>
      <div className="stat-card__top">
        <span className="stat-card__label">{label}</span>
        <span className="stat-card__icon">
          <Icon name={icon} size={18} />
        </span>
      </div>
      {loading ? (
        <Skeleton width="52%" height={30} />
      ) : (
        <div className="stat-card__value">{value ?? '—'}</div>
      )}
      {meta ? <div className="stat-card__meta">{meta}</div> : null}
    </div>
  )
}
