export default function Badge({ children, tone = 'neutral', dot = false, className = '', ...props }) {
  return (
    <span className={`badge badge--${tone} ${className}`.trim()} {...props}>
      {dot ? <span className="badge__dot" aria-hidden="true" /> : null}
      {children}
    </span>
  )
}
