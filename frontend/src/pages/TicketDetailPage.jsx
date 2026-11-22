import { useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import Tabs from '../components/ui/Tabs'
import Card, { CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Icon from '../components/ui/Icon'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import Skeleton from '../components/ui/Skeleton'
import { Select } from '../components/ui/Field'
import { CategoryBadge, PriorityBadge, TicketStatusBadge } from '../components/ui/MetaBadges'
import ContextCards from '../features/tickets/ContextCards'
import TriageCard from '../features/tickets/TriageCard'
import DraftsPanel from '../features/tickets/DraftsPanel'
import ActionsPanel from '../features/tickets/ActionsPanel'
import TraceTimeline from '../features/tickets/TraceTimeline'
import { useTicket, useTicketContext, useUpdateTicketStatus } from '../hooks/useTickets'
import { useDraftsForTicket } from '../hooks/useDrafts'
import { useTicketActions } from '../hooks/useActions'
import { useTicketTraces } from '../hooks/useTraces'
import { useToast } from '../hooks/useToast'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { getErrorMessage } from '../utils/errors'
import { TICKET_STATUSES, TICKET_STATUS_META } from '../utils/constants'
import { formatDateTime, formatRelative, initials, titleCase } from '../utils/format'

export default function TicketDetailPage() {
  const { id } = useParams()
  const ticketId = Number(id)
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') ?? 'overview'

  const ticketQuery = useTicket(ticketId)
  const contextQuery = useTicketContext(ticketId)
  const draftsQuery = useDraftsForTicket(ticketId)
  const actionsQuery = useTicketActions(ticketId)
  const tracesQuery = useTicketTraces(ticketId)
  const updateStatus = useUpdateTicketStatus(ticketId)

  const ticket = ticketQuery.data
  useDocumentTitle(ticket ? `Ticket #${ticket.id}` : 'Ticket')

  const tabs = useMemo(
    () => [
      { id: 'overview', label: 'Overview', icon: 'dashboard' },
      { id: 'drafts', label: 'Drafts', icon: 'file', count: draftsQuery.data?.length ?? 0 },
      { id: 'actions', label: 'Actions', icon: 'lock', count: actionsQuery.data?.length ?? 0 },
      { id: 'traces', label: 'Traces', icon: 'traces', count: tracesQuery.data?.length ?? 0 },
    ],
    [draftsQuery.data, actionsQuery.data, tracesQuery.data],
  )

  const setTab = (tab) => {
    const params = new URLSearchParams(searchParams)
    if (tab === 'overview') params.delete('tab')
    else params.set('tab', tab)
    setSearchParams(params, { replace: true })
  }

  const handleStatusChange = async (event) => {
    const nextStatus = event.target.value
    if (!ticket || nextStatus === ticket.status) return
    try {
      await updateStatus.mutateAsync(nextStatus)
      toast.success(`Status updated to ${TICKET_STATUS_META[nextStatus]?.label ?? titleCase(nextStatus)}.`)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  if (Number.isNaN(ticketId)) {
    return (
      <div className="page">
        <EmptyState
          icon="search"
          title="Ticket not found"
          description="The ticket identifier in the URL is not valid."
          action={<Link to="/tickets" className="btn btn--primary btn--md">Back to tickets</Link>}
        />
      </div>
    )
  }

  if (ticketQuery.isLoading) {
    return (
      <div className="page">
        <div className="stack">
          <Skeleton width="42%" height={28} />
          <Skeleton width="70%" height={14} />
          <Skeleton height={140} />
          <div className="grid grid--3">
            <Skeleton height={150} />
            <Skeleton height={150} />
            <Skeleton height={150} />
          </div>
        </div>
      </div>
    )
  }

  if (ticketQuery.isError) {
    return (
      <div className="page">
        <ErrorState
          error={ticketQuery.error}
          title="Could not load this ticket"
          onRetry={ticketQuery.refetch}
          action={<Link to="/tickets" className="btn btn--secondary btn--sm">Back to tickets</Link>}
        />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="page">
        <EmptyState
          icon="search"
          title="Ticket not found"
          description="This ticket may have been removed."
          action={<Link to="/tickets" className="btn btn--primary btn--md">Back to tickets</Link>}
        />
      </div>
    )
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow={`Ticket #${ticket.id}`}
        backTo="/tickets"
        backLabel="Back to ticket queue"
        title={ticket.subject}
        description={`Opened ${formatRelative(ticket.createdAt)} · Updated in the support queue`}
        actions={
          <div className="status-control">
            <label htmlFor="ticket-status" className="status-control__label">Status</label>
            <Select
              id="ticket-status"
              value={ticket.status}
              onChange={handleStatusChange}
              disabled={updateStatus.isPending}
              className="status-select"
            >
              {TICKET_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {TICKET_STATUS_META[status].label}
                </option>
              ))}
            </Select>
          </div>
        }
      />

      <div className="ticket-banner">
        <div className="ticket-banner__customer">
          <span className="avatar avatar--lg" aria-hidden="true">{initials(ticket.customer?.name)}</span>
          <div>
            <p className="ticket-banner__name">{ticket.customer?.name ?? 'Unknown customer'}</p>
            <p className="text-subtle">{ticket.customer?.email ?? 'No email on file'}</p>
          </div>
        </div>
        <div className="ticket-banner__badges">
          <CategoryBadge category={ticket.category} />
          <PriorityBadge priority={ticket.priority} />
          <TicketStatusBadge status={ticket.status} />
          {ticket.escalationNeeded ? <span className="badge badge--danger badge--dot">Escalation required</span> : null}
        </div>
        <div className="ticket-banner__meta">
          <span><Icon name="calendar" size={14} /> {formatDateTime(ticket.createdAt)}</span>
          {ticket.order ? <span><Icon name="package" size={14} /> Order #{ticket.order.id}</span> : <span><Icon name="package" size={14} /> No order linked</span>}
        </div>
      </div>

      {ticket.escalationNeeded ? (
        <div className="callout callout--warning">
          <Icon name="alert" size={16} />
          <p>
            This ticket is flagged for escalation. Review the AI triage reasoning and follow the account-security or
            legal escalation path before replying.
          </p>
        </div>
      ) : null}

      <Tabs tabs={tabs} value={activeTab} onChange={setTab} ariaLabel="Ticket workspace" />

      <div
        className="tab-panel"
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
      >
        {activeTab === 'overview' ? (
          <div className="stack">
            <Card>
              <CardHeader
                title="Customer conversation"
                description="The inbound request exactly as the AI sees it."
                icon={<Icon name="tickets" size={18} />}
              />
              <p className="conversation-text">{ticket.description}</p>
              <div className="conversation-meta">
                <span><Icon name="user" size={14} /> {ticket.customer?.name}</span>
                <span><Icon name="clock" size={14} /> {formatDateTime(ticket.createdAt)}</span>
                <span><Icon name="package" size={14} /> {ticket.order ? `Order #${ticket.order.id}` : 'No order'}</span>
              </div>
            </Card>

            {contextQuery.isError ? (
              <ErrorState error={contextQuery.error} title="Could not load customer context" onRetry={contextQuery.refetch} />
            ) : contextQuery.isLoading ? (
              <div className="grid grid--3">
                <Skeleton height={170} />
                <Skeleton height={170} />
                <Skeleton height={170} />
              </div>
            ) : (
              <ContextCards context={contextQuery.data} />
            )}

            <TriageCard ticketId={ticketId} ticket={ticket} />
          </div>
        ) : null}

        {activeTab === 'drafts' ? <DraftsPanel ticketId={ticketId} /> : null}

        {activeTab === 'actions' ? <ActionsPanel ticketId={ticketId} /> : null}

        {activeTab === 'traces' ? (
          <Card>
            <CardHeader
              title="Run traces"
              description="Every triage, draft, and approved action is recorded for auditability."
              icon={<Icon name="traces" size={18} />}
              actions={
                <Button size="sm" variant="secondary" icon="refresh" onClick={() => tracesQuery.refetch()} loading={tracesQuery.isFetching}>
                  Refresh
                </Button>
              }
            />
            {tracesQuery.isLoading ? (
              <div className="stack">
                <Skeleton height={70} />
                <Skeleton height={70} />
              </div>
            ) : tracesQuery.isError ? (
              <ErrorState error={tracesQuery.error} title="Could not load traces" onRetry={tracesQuery.refetch} />
            ) : (
              <TraceTimeline traces={tracesQuery.data ?? []} />
            )}
          </Card>
        ) : null}
      </div>
    </div>
  )
}
