import Icon from './Icon'

const TONE_ICON = {
  info: 'info',
  success: 'check',
  warning: 'alert',
  error: 'alert',
}

export default function ToastViewport({ toasts, onDismiss }) {
  if (!toasts.length) return null

  return (
    <div className="toast-viewport" aria-live="polite" aria-relevant="additions">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast--${toast.tone}`}
          role={toast.tone === 'error' ? 'alert' : 'status'}
        >
          <span className="toast__icon">
            <Icon name={TONE_ICON[toast.tone] ?? 'info'} size={18} />
          </span>
          <div className="toast__content">
            {toast.title ? <p className="toast__title">{toast.title}</p> : null}
            <p className="toast__message">{toast.message}</p>
          </div>
          <button
            type="button"
            className="toast__close"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss notification"
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
