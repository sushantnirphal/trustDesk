export default function Spinner({ size = 18, className = '', label = 'Loading' }) {
  return (
    <span
      className={`spinner ${className}`.trim()}
      style={{ width: size, height: size }}
      role="status"
      aria-label={label}
    />
  )
}

export function FullPageLoader({ label = 'Loading TrustDesk…' }) {
  return (
    <div className="full-page-loader">
      <Spinner size={30} label={label} />
      <p>{label}</p>
    </div>
  )
}
