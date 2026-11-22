import Icon from './Icon'

export default function EmptyState({
  icon = 'inbox',
  title = 'Nothing here yet',
  description,
  action,
  compact = false,
}) {
  return (
    <div className={`empty-state ${compact ? 'empty-state--compact' : ''}`.trim()}>
      <span className="empty-state__icon">
        <Icon name={icon} size={22} />
      </span>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  )
}
