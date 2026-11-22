import Button from './Button'
import Icon from './Icon'
import { getErrorMessage } from '../../utils/errors'

export default function ErrorState({ error, title = 'Could not load this view', onRetry, action }) {
  return (
    <div className="error-state" role="alert">
      <span className="error-state__icon">
        <Icon name="alert" size={22} />
      </span>
      <div className="error-state__content">
        <h3>{title}</h3>
        <p>{getErrorMessage(error)}</p>
      </div>
      <div className="error-state__actions">
        {action}
        {onRetry ? (
          <Button variant="secondary" size="sm" icon="refresh" onClick={onRetry}>
            Retry
          </Button>
        ) : null}
      </div>
    </div>
  )
}
