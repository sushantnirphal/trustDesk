import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import Card, { CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Icon from '../components/ui/Icon'
import CopyButton from '../components/ui/CopyButton'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import Modal from '../components/ui/Modal'
import { FormField, Select, Textarea } from '../components/ui/Field'
import { ActionTypeBadge, ToolCallStatusBadge } from '../components/ui/MetaBadges'
import { useAllActions, useApproveAction, usePendingActions, useRejectAction } from '../hooks/useActions'
import { useToast } from '../hooks/useToast'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { getErrorMessage } from '../utils/errors'
import { formatDateTime, formatRelative, prettyJson, truncate } from '../utils/format'

const STATUS_FILTERS = ['ALL', 'EXECUTED', 'REJECTED', 'APPROVED', 'FAILED']

function ApprovalQueueCard({ action, onReview }) {
  return (
    <article className="approval-card">
      <div className="approval-card__top">
        <div className="chip-row">
          <ActionTypeBadge actionType={action.actionType} />
          <ToolCallStatusBadge status={action.status} />
          <Badge tone="warning">Awaiting decision</Badge>
        </div>
        <span className="text-subtle">{formatRelative(action.createdAt)}</span>
      </div>

      <div className="approval-card__body">
        <div>
          <p className="label-text">Ticket</p>
          <Link to={`/tickets/${action.ticketId}`} className="text-link">
            #{action.ticketId} — open ticket
          </Link>
        </div>
        <div>
          <p className="label-text">Rationale</p>
          <p className="text-muted">{action.rationale || 'No rationale supplied.'}</p>
        </div>
      </div>

      <div className="approval-card__params">
        <p className="label-text">Parameters</p>
        <pre className="code-block code-block--sm">{prettyJson(action.parameters)}</pre>
      </div>

      <div className="approval-card__footer">
        <div className="inline-meta">
          <Icon name="key" size={14} />
          <code className="code-inline">{truncate(action.idempotencyKey, 28)}</code>
          <CopyButton value={action.idempotencyKey} label="Copy key" />
        </div>
        <Button size="sm" icon="lock" onClick={() => onReview(action)}>
          Review &amp; decide
        </Button>
      </div>
    </article>
  )
}

export default function ApprovalsPage() {
  useDocumentTitle('Approvals')
  const toast = useToast()
  const pendingQuery = usePendingActions()
  const allQuery = useAllActions()
  const approveAction = useApproveAction()
  const rejectAction = useRejectAction()

  const [selected, setSelected] = useState(null)
  const [comments, setComments] = useState('')
  const [historyFilter, setHistoryFilter] = useState('ALL')

  const pending = pendingQuery.data ?? []
  const all = allQuery.data ?? []

  const counts = useMemo(() => {
    return all.reduce(
      (accumulator, action) => {
        accumulator.ALL += 1
        accumulator[action.status] = (accumulator[action.status] ?? 0) + 1
        return accumulator
      },
      { ALL: 0 },
    )
  }, [all])

  const history = useMemo(() => {
    const rows = all.filter((action) => action.status !== 'PENDING_APPROVAL')
    if (historyFilter === 'ALL') return rows
    return rows.filter((action) => action.status === historyFilter)
  }, [all, historyFilter])

  const refresh = () => {
    pendingQuery.refetch()
    allQuery.refetch()
  }

  const decide = async (decision) => {
    if (!selected) return
    try {
      const payload = {
        actionId: selected.toolCallId,
        comments: comments.trim() || undefined,
        ticketId: selected.ticketId,
      }
      if (decision === 'APPROVED') {
        const result = await approveAction.mutateAsync(payload)
        toast.success(
          result.duplicate
            ? 'Already processed — the idempotent approval was replayed safely.'
            : 'Action approved and executed (simulated).',
        )
      } else {
        const result = await rejectAction.mutateAsync(payload)
        toast.info(result.duplicate ? 'Already processed.' : 'Action rejected and recorded.')
      }
      setSelected(null)
      setComments('')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const busy = approveAction.isPending || rejectAction.isPending

  return (
    <div className="page">
      <PageHeader
        eyebrow="Human-in-the-loop"
        title="Approval queue"
        description="Sensitive tool actions wait here until an agent approves or rejects them. Every decision is idempotent and audited."
        actions={
          <Button variant="secondary" icon="refresh" onClick={refresh} loading={pendingQuery.isFetching || allQuery.isFetching}>
            Refresh queue
          </Button>
        }
      />

      <section className="stat-grid" aria-label="Approval metrics">
        <StatCard label="Pending" value={pending.length} meta="Awaiting a human decision" icon="clock" tone="amber" loading={pendingQuery.isLoading} />
        <StatCard label="Executed" value={counts.EXECUTED ?? 0} meta="Simulated actions completed" icon="check" tone="teal" loading={allQuery.isLoading} />
        <StatCard label="Rejected" value={counts.REJECTED ?? 0} meta="Blocked by an agent" icon="close" tone="red" loading={allQuery.isLoading} />
        <StatCard label="All actions" value={counts.ALL ?? 0} meta="Lifetime tool calls" icon="lock" tone="indigo" loading={allQuery.isLoading} />
      </section>

      <Card>
        <CardHeader
          title="Pending approval queue"
          description="Approving executes the simulated tool action. Rejecting stops it permanently."
          icon={<Icon name="approvals" size={18} />}
          actions={<Badge tone={pending.length ? 'warning' : 'success'}>{pending.length} pending</Badge>}
        />

        {pendingQuery.isLoading ? (
          <div className="stack">
            <div className="skeleton-card"><span className="skeleton" style={{ height: 90 }} /></div>
            <div className="skeleton-card"><span className="skeleton" style={{ height: 90 }} /></div>
          </div>
        ) : pendingQuery.isError ? (
          <ErrorState error={pendingQuery.error} title="Could not load the approval queue" onRetry={pendingQuery.refetch} />
        ) : pending.length === 0 ? (
          <EmptyState
            icon="approvals"
            title="The queue is clear"
            description="No tool actions are waiting for approval. Propose one from any ticket to see the workflow."
            action={<Link to="/tickets" className="btn btn--secondary btn--md">Browse tickets</Link>}
          />
        ) : (
          <div className="stack">
            {pending.map((action) => (
              <ApprovalQueueCard key={action.toolCallId} action={action} onReview={(item) => { setComments(''); setSelected(item) }} />
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Decision history"
          description="Approved, rejected, and executed actions with audit metadata."
          icon={<Icon name="clock" size={18} />}
          actions={
            <Select
              aria-label="Filter decision history"
              value={historyFilter}
              onChange={(event) => setHistoryFilter(event.target.value)}
              className="filters__select"
            >
              {STATUS_FILTERS.map((status) => (
                <option key={status} value={status}>
                  {status === 'ALL' ? 'All decisions' : status.replaceAll('_', ' ')}
                </option>
              ))}
            </Select>
          }
        />

        {allQuery.isLoading ? (
          <p className="text-muted">Loading decision history…</p>
        ) : allQuery.isError ? (
          <ErrorState error={allQuery.error} title="Could not load action history" onRetry={allQuery.refetch} />
        ) : history.length === 0 ? (
          <EmptyState icon="clock" title="No decisions recorded" description="Approvals and rejections will appear here." compact />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Action</th>
                  <th scope="col">Ticket</th>
                  <th scope="col">Status</th>
                  <th scope="col">Approver</th>
                  <th scope="col">Decision time</th>
                  <th scope="col">Result</th>
                </tr>
              </thead>
              <tbody>
                {history.map((action) => (
                  <tr key={action.toolCallId}>
                    <td data-label="Action">
                      <div className="stack-tight">
                        <ActionTypeBadge actionType={action.actionType} />
                        <span className="text-subtle">#{action.toolCallId}</span>
                      </div>
                    </td>
                    <td data-label="Ticket">
                      <Link to={`/tickets/${action.ticketId}`} className="text-link">#{action.ticketId}</Link>
                    </td>
                    <td data-label="Status"><ToolCallStatusBadge status={action.status} /></td>
                    <td data-label="Approver">{action.approvedBy ?? '—'}</td>
                    <td data-label="Decision time">{formatDateTime(action.approvedAt ?? action.createdAt)}</td>
                    <td data-label="Result">
                      <span className="text-muted" title={action.result ?? ''}>
                        {action.result ? truncate(prettyJson(action.result).replaceAll('\n', ' '), 70) : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={Boolean(selected)}
        onClose={busy ? undefined : () => setSelected(null)}
        title="Review tool action"
        description="This executes a simulated action. No real money moves. Approvals are idempotent."
        size="md"
        closeOnBackdrop={!busy}
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelected(null)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="danger" icon="close" onClick={() => decide('REJECTED')} loading={rejectAction.isPending} disabled={approveAction.isPending}>
              Reject
            </Button>
            <Button icon="check" onClick={() => decide('APPROVED')} loading={approveAction.isPending} disabled={rejectAction.isPending}>
              Approve &amp; execute
            </Button>
          </>
        }
      >
        {selected ? (
          <div className="stack">
            <div className="review-summary">
              <div className="chip-row">
                <ActionTypeBadge actionType={selected.actionType} />
                <ToolCallStatusBadge status={selected.status} />
              </div>
              <div className="kv-list">
                <div className="kv"><dt>Ticket</dt><dd><Link to={`/tickets/${selected.ticketId}`} className="text-link">#{selected.ticketId}</Link></dd></div>
                <div className="kv"><dt>Action ID</dt><dd>#{selected.toolCallId}</dd></div>
                <div className="kv"><dt>Created</dt><dd>{formatDateTime(selected.createdAt)}</dd></div>
                <div className="kv"><dt>Idempotency key</dt><dd><code className="code-inline">{selected.idempotencyKey}</code></dd></div>
              </div>
            </div>

            {selected.rationale ? (
              <div className="callout callout--info">
                <Icon name="info" size={16} />
                <p>{selected.rationale}</p>
              </div>
            ) : null}

            <div>
              <p className="label-text">Parameters</p>
              <pre className="code-block">{prettyJson(selected.parameters)}</pre>
            </div>

            <FormField label="Reviewer comments" htmlFor="approval-comments" hint="Stored with the approval record.">
              <Textarea
                id="approval-comments"
                rows={3}
                value={comments}
                onChange={(event) => setComments(event.target.value)}
                placeholder="Optional note for the audit trail…"
                data-autofocus
              />
            </FormField>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
