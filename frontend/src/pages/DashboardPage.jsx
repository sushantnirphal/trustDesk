import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import Card, { CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Icon from '../components/ui/Icon'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import Skeleton, { TableSkeleton } from '../components/ui/Skeleton'
import { CategoryBadge, PriorityBadge, TicketStatusBadge } from '../components/ui/MetaBadges'
import { useDashboardStats } from '../hooks/useDashboard'
import { useTickets } from '../hooks/useTickets'
import { usePendingActions } from '../hooks/useActions'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { TICKET_STATUS_META, TICKET_CATEGORY_META } from '../utils/constants'
import { formatNumber, formatRelative, formatPercent } from '../utils/format'

function DistributionBar({ stats }) {
  const segments = [
    { key: 'OPEN', value: stats?.openTickets ?? 0, className: 'dist--info' },
    { key: 'IN_PROGRESS', value: stats?.inProgressTickets ?? 0, className: 'dist--warning' },
    { key: 'RESOLVED', value: stats?.resolvedTickets ?? 0, className: 'dist--success' },
    { key: 'ESCALATED', value: stats?.escalatedTickets ?? 0, className: 'dist--danger' },
  ]
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1

  return (
    <div className="distribution">
      <div className="distribution__bar" role="img" aria-label="Ticket status distribution">
        {segments.map((segment) =>
          segment.value > 0 ? (
            <span
              key={segment.key}
              className={`distribution__segment ${segment.className}`}
              style={{ width: `${(segment.value / total) * 100}%` }}
              title={`${TICKET_STATUS_META[segment.key].label}: ${segment.value}`}
            />
          ) : null,
        )}
      </div>
      <ul className="distribution__legend">
        {segments.map((segment) => (
          <li key={segment.key}>
            <span className={`legend-dot ${segment.className}`} aria-hidden="true" />
            <span>{TICKET_STATUS_META[segment.key].label}</span>
            <strong>{formatNumber(segment.value)}</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function DashboardPage() {
  useDocumentTitle('Overview')
  const { data: stats, isLoading: statsLoading, isError: statsError, error: statsErrorValue, refetch: refetchStats } = useDashboardStats()
  const { data: tickets = [], isLoading: ticketsLoading } = useTickets()
  const { data: pendingActions = [], isLoading: pendingLoading } = usePendingActions()

  const recentTickets = useMemo(
    () =>
      [...tickets]
        .sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0))
        .slice(0, 5),
    [tickets],
  )

  const categories = useMemo(() => {
    const entries = Object.entries(stats?.ticketsByCategory ?? {})
    const total = entries.reduce((sum, [, value]) => sum + value, 0) || 1
    return entries.sort((a, b) => b[1] - a[1]).map(([key, value]) => ({
      key,
      value,
      percent: (value / total) * 100,
    }))
  }, [stats])

  return (
    <div className="page">
      <PageHeader
        eyebrow="Support operations"
        title="Operations overview"
        description="Live snapshot of the ticket queue, AI activity, and approval workload."
        actions={
          <>
            <Button variant="secondary" icon="refresh" onClick={() => refetchStats()} loading={statsLoading}>
              Refresh
            </Button>
            <Link to="/tickets" className="btn btn--primary btn--md">
              <Icon name="tickets" size={16} />
              <span className="btn__label">Open ticket queue</span>
            </Link>
          </>
        }
      />

      {statsError ? (
        <ErrorState error={statsErrorValue} title="Dashboard metrics are unavailable" onRetry={refetchStats} />
      ) : null}

      <section className="stat-grid" aria-label="Key metrics">
        <StatCard
          label="Open tickets"
          value={formatNumber(stats?.openTickets)}
          meta={`${formatNumber(stats?.totalTickets)} total in queue`}
          icon="tickets"
          tone="indigo"
          loading={statsLoading}
        />
        <StatCard
          label="In progress"
          value={formatNumber(stats?.inProgressTickets)}
          meta={`${formatNumber(stats?.highPriorityTickets)} high priority`}
          icon="zap"
          tone="amber"
          loading={statsLoading}
        />
        <StatCard
          label="Escalated"
          value={formatNumber(stats?.escalatedTickets)}
          meta={`${formatNumber(stats?.resolvedTickets)} resolved`}
          icon="alert"
          tone="red"
          loading={statsLoading}
        />
        <StatCard
          label="Pending approvals"
          value={formatNumber(stats?.pendingApprovals)}
          meta={`${formatNumber(stats?.executedActions)} executed actions`}
          icon="approvals"
          tone="teal"
          loading={statsLoading}
        />
      </section>

      <div className="grid grid--2 dashboard-grid">
        <Card>
          <CardHeader
            title="Ticket status"
            description="Where the queue stands right now."
            icon={<Icon name="dashboard" size={18} />}
          />
          {statsLoading ? <Skeleton height={120} /> : <DistributionBar stats={stats} />}
        </Card>

        <Card>
          <CardHeader
            title="Category mix"
            description="Volume by support category."
            icon={<Icon name="filter" size={18} />}
          />
          {statsLoading ? (
            <div className="stack">
              <Skeleton height={18} />
              <Skeleton height={18} />
              <Skeleton height={18} />
            </div>
          ) : categories.length === 0 ? (
            <EmptyState icon="filter" title="No category data" compact />
          ) : (
            <ul className="category-list">
              {categories.map((category) => (
                <li key={category.key}>
                  <div className="category-list__top">
                    <CategoryBadge category={category.key} />
                    <span className="text-muted">{formatNumber(category.value)}</span>
                  </div>
                  <div className="category-list__track">
                    <span
                      className={`category-list__bar category-list__bar--${(TICKET_CATEGORY_META[category.key]?.tone ?? 'neutral')}`}
                      style={{ width: `${category.percent}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid--2">
        <Card>
          <CardHeader
            title="Recent tickets"
            description="Newest conversations in the queue."
            actions={<Link to="/tickets" className="text-link">View all</Link>}
          />
          {ticketsLoading ? (
            <TableSkeleton rows={4} columns={4} />
          ) : recentTickets.length === 0 ? (
            <EmptyState icon="tickets" title="No tickets yet" description="Create a ticket to start the workflow." compact />
          ) : (
            <ul className="recent-list">
              {recentTickets.map((ticket) => (
                <li key={ticket.id}>
                  <Link to={`/tickets/${ticket.id}`} className="recent-list__item">
                    <div className="recent-list__main">
                      <div className="recent-list__title">
                        <span className="text-subtle">#{ticket.id}</span>
                        <span className="recent-list__subject">{ticket.subject}</span>
                      </div>
                      <div className="chip-row">
                        <CategoryBadge category={ticket.category} />
                        <PriorityBadge priority={ticket.priority} />
                        <TicketStatusBadge status={ticket.status} />
                      </div>
                    </div>
                    <span className="text-subtle recent-list__time">{formatRelative(ticket.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Approval queue"
            description="Sensitive tool actions waiting on a human."
            actions={<Link to="/approvals" className="text-link">Review queue</Link>}
          />
          {pendingLoading ? (
            <div className="stack">
              <Skeleton height={58} />
              <Skeleton height={58} />
            </div>
          ) : pendingActions.length === 0 ? (
            <EmptyState
              icon="approvals"
              title="Queue is clear"
              description="No tool actions are waiting for approval."
              compact
            />
          ) : (
            <ul className="approval-preview">
              {pendingActions.slice(0, 3).map((action) => (
                <li key={action.toolCallId}>
                  <Link to="/approvals" className="approval-preview__item">
                    <span className="approval-preview__icon">
                      <Icon name="lock" size={16} />
                    </span>
                    <div>
                      <p className="approval-preview__title">{action.actionType?.replaceAll('_', ' ')}</p>
                      <p className="text-subtle">Ticket #{action.ticketId} · {formatRelative(action.createdAt)}</p>
                    </div>
                    <Badge tone="warning">Pending</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader
          title="AI operations snapshot"
          description="Everything the agent has produced in this workspace."
          icon={<Icon name="traces" size={18} />}
        />
        <div className="snapshot-grid">
          <div className="snapshot">
            <span className="snapshot__value">{formatNumber(stats?.totalDrafts)}</span>
            <span className="snapshot__label">Drafts generated</span>
          </div>
          <div className="snapshot">
            <span className="snapshot__value">{formatNumber(stats?.totalTraces)}</span>
            <span className="snapshot__label">Traces recorded</span>
          </div>
          <div className="snapshot">
            <span className="snapshot__value">{formatNumber(stats?.executedActions)}</span>
            <span className="snapshot__label">Approved actions</span>
          </div>
          <div className="snapshot">
            <span className="snapshot__value">{formatPercent(stats?.pendingApprovals ? stats.pendingApprovals / Math.max(stats.executedActions + stats.pendingApprovals, 1) : 0)}</span>
            <span className="snapshot__label">Queue awaiting review</span>
          </div>
        </div>
        <div className="quick-links">
          <Link to="/evaluations" className="quick-link">
            <Icon name="evals" size={18} />
            <div>
              <strong>Run evaluations</strong>
              <span>Measure triage, citations, and guardrails.</span>
            </div>
            <Icon name="chevronRight" size={16} />
          </Link>
          <Link to="/knowledge-base" className="quick-link">
            <Icon name="kb" size={18} />
            <div>
              <strong>Browse knowledge base</strong>
              <span>Inspect the policy documents behind citations.</span>
            </div>
            <Icon name="chevronRight" size={16} />
          </Link>
          <Link to="/guardrails" className="quick-link">
            <Icon name="shield" size={18} />
            <div>
              <strong>Test guardrails</strong>
              <span>Try injection, PII, and secret-extraction prompts.</span>
            </div>
            <Icon name="chevronRight" size={16} />
          </Link>
        </div>
      </Card>
    </div>
  )
}
