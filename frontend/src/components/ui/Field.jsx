import { useId } from 'react'

export function FormField({ label, htmlFor, hint, error, required = false, children, className = '' }) {
  return (
    <div className={`field ${error ? 'field--invalid' : ''} ${className}`.trim()}>
      {label ? (
        <label className="field__label" htmlFor={htmlFor}>
          {label}
          {required ? <span className="field__required" aria-hidden="true"> *</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="field__error" role="alert">{error}</p>
      ) : hint ? (
        <p className="field__hint">{hint}</p>
      ) : null}
    </div>
  )
}

export function Input({ id, className = '', invalid = false, ...props }) {
  return (
    <input
      id={id}
      className={`input ${invalid ? 'input--invalid' : ''} ${className}`.trim()}
      aria-invalid={invalid || undefined}
      {...props}
    />
  )
}

export function Select({ id, className = '', invalid = false, children, ...props }) {
  return (
    <select
      id={id}
      className={`select ${invalid ? 'select--invalid' : ''} ${className}`.trim()}
      aria-invalid={invalid || undefined}
      {...props}
    >
      {children}
    </select>
  )
}

export function Textarea({ id, className = '', invalid = false, rows = 4, ...props }) {
  return (
    <textarea
      id={id}
      rows={rows}
      className={`textarea ${invalid ? 'textarea--invalid' : ''} ${className}`.trim()}
      aria-invalid={invalid || undefined}
      {...props}
    />
  )
}

export function useFieldId(providedId) {
  const generated = useId()
  return providedId || `field-${generated.replaceAll(':', '')}`
}
