const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
})

export function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormatter.format(date)
}

export function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date)
}

export function formatRelative(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  const diffMs = Date.now() - date.getTime()
  const seconds = Math.round(diffMs / 1000)
  const absSeconds = Math.abs(seconds)

  if (absSeconds < 45) return 'just now'
  if (absSeconds < 90) return 'a minute ago'

  const minutes = Math.round(seconds / 60)
  if (Math.abs(minutes) < 60) return `${minutes} min ago`

  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return `${hours} hr ago`

  const days = Math.round(hours / 24)
  if (Math.abs(days) < 7) return `${days} day${Math.abs(days) === 1 ? '' : 's'} ago`

  return formatDate(value)
}

export function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return '—'
  const number = Number(value)
  return Number.isNaN(number) ? '—' : currencyFormatter.format(number)
}

export function formatPercent(value, digits = 0) {
  if (value === null || value === undefined) return '—'
  const number = Number(value)
  if (Number.isNaN(number)) return '—'
  return `${(number * 100).toFixed(digits)}%`
}

export function formatNumber(value) {
  if (value === null || value === undefined) return '—'
  const number = Number(value)
  return Number.isNaN(number) ? '—' : new Intl.NumberFormat().format(number)
}

export function formatDuration(milliseconds) {
  if (milliseconds === null || milliseconds === undefined) return '—'
  const ms = Number(milliseconds)
  if (Number.isNaN(ms)) return '—'
  if (ms < 1000) return `${Math.round(ms)} ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`
  return `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`
}

export function humanize(value) {
  if (!value) return '—'
  const text = String(value).replaceAll('_', ' ').toLowerCase()
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function titleCase(value) {
  if (!value) return ''
  return String(value)
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

export function initials(name) {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

export function truncate(value, length = 100) {
  if (!value) return ''
  return value.length > length ? `${value.slice(0, length - 1)}…` : value
}

export function parseJson(value, fallback = null) {
  if (value === null || value === undefined || value === '') return fallback
  if (typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export function prettyJson(value) {
  if (value === null || value === undefined || value === '') return ''
  if (typeof value === 'string') {
    const parsed = parseJson(value)
    return parsed ? JSON.stringify(parsed, null, 2) : value
  }
  return JSON.stringify(value, null, 2)
}

export function splitCitations(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  return String(value)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${formatNumber(count)} ${Number(count) === 1 ? singular : plural}`
}
