export default function Skeleton({ width = '100%', height = 16, radius = 8, className = '' }) {
  return (
    <span
      className={`skeleton ${className}`.trim()}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  )
}

export function CardSkeleton({ lines = 3 }) {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <Skeleton width="38%" height={18} />
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} width={index === lines - 1 ? '64%' : '100%'} height={12} />
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 5, columns = 5 }) {
  return (
    <div className="table-skeleton" aria-hidden="true">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div className="table-skeleton__row" key={rowIndex} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <Skeleton key={columnIndex} height={13} width={columnIndex === 0 ? '80%' : '58%'} />
          ))}
        </div>
      ))}
    </div>
  )
}
