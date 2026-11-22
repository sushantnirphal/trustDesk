import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import Pagination from '../components/ui/Pagination'
import { TableSkeleton } from '../components/ui/Skeleton'
import TicketFilters from '../features/tickets/TicketFilters'
import TicketTable from '../features/tickets/TicketTable'
import CreateTicketModal from '../features/tickets/CreateTicketModal'
import { useTickets } from '../hooks/useTickets'
import { useDebounce } from '../hooks/useDebounce'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { TICKET_STATUSES, TICKET_STATUS_META } from '../utils/constants'
import { formatNumber } from '../utils/format'

const PAGE_SIZE = 10

const PRIORITY_RANK = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
const STATUS_RANK = { ESCALATED: 5, OPEN: 4, IN_PROGRESS: 3, RESOLVED: 2, CLOSED: 1 }

function getFilters(searchParams) {
  return {
    q: searchParams.get('q') ?? '',
    status: searchParams.get('status') ?? 'ALL',
    category: searchParams.get('category') ?? 'ALL',
    priority: searchParams.get('priority') ?? 'ALL',
    sort: searchParams.get('sort') ?? 'newest',
    page: Number(searchParams.get('page') ?? 1),
  }
}

export default function TicketsPage() {
  useDocumentTitle('Tickets')
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [createOpen, setCreateOpen] = useState(false)
  const filters = useMemo(() => getFilters(searchParams), [searchParams])
  const debouncedQuery = useDebounce(filters.q, 250)

  const { data: tickets = [], isLoading, isError, error, refetch, isFetching } = useTickets({
    status: filters.status,
  })

  const counts = useMemo(() => {
    return tickets.reduce(
      (accumulator, ticket) => {
        accumulator.ALL += 1
        accumulator[ticket.status] = (accumulator[ticket.status] ?? 0) + 1
        return accumulator
      },
      { ALL: 0 },
    )
  }, [tickets])

  const filtered = useMemo(() => {
    const query = debouncedQuery.trim().toLowerCase()
    const status = filters.status
    const category = filters.category
    const priority = filters.priority
    const sort = filters.sort

    const result = tickets.filter((ticket) => {
      if (status !== 'ALL' && ticket.status !== status) return false
      if (category !== 'ALL' && ticket.category !== category) return false
      if (priority !== 'ALL' && ticket.priority !== priority) return false
      if (!query) return true

      const haystack = [
        ticket.id,
        ticket.subject,
        ticket.description,
        ticket.customer?.name,
        ticket.customer?.email,
      ]
        .map((value) => String(value ?? '').toLowerCase())
        .join(' ')

      return haystack.includes(query)
    })

    result.sort((a, b) => {
      if (sort === 'oldest') return new Date(a.createdAt ?? 0) - new Date(b.createdAt ?? 0)
      if (sort === 'priority') {
        const difference = (PRIORITY_RANK[b.priority] ?? 0) - (PRIORITY_RANK[a.priority] ?? 0)
        return difference !== 0 ? difference : new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0)
      }
      if (sort === 'status') {
        const difference = (STATUS_RANK[b.status] ?? 0) - (STATUS_RANK[a.status] ?? 0)
        return difference !== 0 ? difference : new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0)
      }
      return new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0)
    })

    return result
  }, [tickets, debouncedQuery, filters.status, filters.category, filters.priority, filters.sort])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(Math.max(1, filters.page), pageCount)
  const visibleTickets = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const hasActiveFilters =
    filters.q !== '' ||
    filters.status !== 'ALL' ||
    filters.category !== 'ALL' ||
    filters.priority !== 'ALL' ||
    filters.sort !== 'newest'

  const updateFilters = (next) => {
    const merged = { ...filters, ...next, page: next.page ?? 1 }
    const params = new URLSearchParams()
    if (merged.q) params.set('q', merged.q)
    if (merged.status !== 'ALL') params.set('status', merged.status)
    if (merged.category !== 'ALL') params.set('category', merged.category)
    if (merged.priority !== 'ALL') params.set('priority', merged.priority)
    if (merged.sort !== 'newest') params.set('sort', merged.sort)
    if (Number(merged.page) > 1) params.set('page', String(merged.page))
    setSearchParams(params, { replace: true })
  }

  const resetFilters = () => setSearchParams(new URLSearchParams(), { replace: true })

  const setPage = (page) => updateFilters({ page })

  return (
    <div className="page">
      <PageHeader
        eyebrow="Workspace"
        title="Ticket queue"
        description="Search, prioritize, and open any customer conversation."
        actions={
          <>
            <Button variant="secondary" icon="refresh" onClick={() => refetch()} loading={isFetching && !isLoading}>
              Refresh
            </Button>
            <Button icon="plus" onClick={() => setCreateOpen(true)}>
              New ticket
            </Button>
          </>
        }
      />

      <div className="status-chips" role="group" aria-label="Filter by status">
        <button
          type="button"
          className={`chip ${filters.status === 'ALL' ? 'chip--active' : ''}`.trim()}
          onClick={() => updateFilters({ status: 'ALL' })}
        >
          All <span className="chip__count">{formatNumber(counts.ALL)}</span>
        </button>
        {TICKET_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            className={`chip ${filters.status === status ? 'chip--active' : ''}`.trim()}
            onClick={() => updateFilters({ status })}
          >
            <span className={`legend-dot legend-dot--${TICKET_STATUS_META[status].tone}`} aria-hidden="true" />
            {TICKET_STATUS_META[status].label}
            <span className="chip__count">{formatNumber(counts[status] ?? 0)}</span>
          </button>
        ))}
      </div>

      <Card className="card--flush">
        <div className="table-toolbar">
          <TicketFilters
            value={filters}
            onChange={updateFilters}
            onReset={resetFilters}
            hasActiveFilters={hasActiveFilters}
          />
          <p className="table-toolbar__count">
            {formatNumber(filtered.length)} {filtered.length === 1 ? 'ticket' : 'tickets'}
          </p>
        </div>

        {isLoading ? (
          <TableSkeleton rows={8} columns={6} />
        ) : isError ? (
          <ErrorState error={error} title="Could not load tickets" onRetry={refetch} />
        ) : visibleTickets.length === 0 ? (
          <EmptyState
            icon="search"
            title={hasActiveFilters ? 'No tickets match these filters' : 'No tickets yet'}
            description={
              hasActiveFilters
                ? 'Try a different search term or clear the filters.'
                : 'Create the first ticket to start the triage workflow.'
            }
            action={
              hasActiveFilters ? (
                <Button variant="secondary" size="sm" icon="close" onClick={resetFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button size="sm" icon="plus" onClick={() => setCreateOpen(true)}>
                  Create ticket
                </Button>
              )
            }
          />
        ) : (
          <>
            <TicketTable tickets={visibleTickets} />
            <Pagination
              page={currentPage}
              pageCount={pageCount}
              onChange={setPage}
              total={filtered.length}
              pageSize={PAGE_SIZE}
            />
          </>
        )}
      </Card>

      <CreateTicketModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(ticket) => navigate(`/tickets/${ticket.id}`)}
      />
    </div>
  )
}
