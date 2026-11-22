import Icon from './Icon'

function getPages(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)

  const pages = new Set([1, total, current - 1, current, current + 1])
  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b)

  const result = []
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push(`ellipsis-${page}`)
    result.push(page)
  })
  return result
}

export default function Pagination({ page, pageCount, onChange, total, pageSize }) {
  if (!pageCount || pageCount <= 1) {
    if (!total) return null
    return (
      <p className="pagination__summary">
        {total} {total === 1 ? 'result' : 'results'}
      </p>
    )
  }

  const pages = getPages(page, pageCount)
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <nav className="pagination" aria-label="Pagination">
      <p className="pagination__summary">
        Showing {from}–{to} of {total}
      </p>
      <div className="pagination__controls">
        <button
          type="button"
          className="pagination__button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <Icon name="chevronLeft" size={16} />
        </button>

        {pages.map((item) =>
          typeof item === 'number' ? (
            <button
              key={item}
              type="button"
              className={`pagination__button ${item === page ? 'pagination__button--active' : ''}`.trim()}
              onClick={() => onChange(item)}
              aria-current={item === page ? 'page' : undefined}
            >
              {item}
            </button>
          ) : (
            <span key={item} className="pagination__ellipsis" aria-hidden="true">
              …
            </span>
          ),
        )}

        <button
          type="button"
          className="pagination__button"
          onClick={() => onChange(page + 1)}
          disabled={page >= pageCount}
          aria-label="Next page"
        >
          <Icon name="chevronRight" size={16} />
        </button>
      </div>
    </nav>
  )
}
