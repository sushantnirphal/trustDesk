import { useEffect, useMemo, useState } from 'react'
import Button from '../../components/ui/Button'
import Card, { CardHeader } from '../../components/ui/Card'
import Icon from '../../components/ui/Icon'
import Badge from '../../components/ui/Badge'
import CopyButton from '../../components/ui/CopyButton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Modal from '../../components/ui/Modal'
import { FormField, Select, Textarea } from '../../components/ui/Field'
import { ActionTypeBadge, ToolCallStatusBadge } from '../../components/ui/MetaBadges'
import {
  useApproveAction,
  useProposeAction,
  useRecommendAction,
  useRejectAction,
  useTicketActions,
} from '../../hooks/useActions'
import { useToast } from '../../hooks/useToast'
import { getErrorMessage } from '../../utils/errors'
import { formatDateTime, prettyJson, titleCase } from '../../utils/format'
import { ACTION_TYPES } from '../../utils/constants'

function newIdempotencyKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `idem-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const DEFAULT_PARAMETERS = {
  amount: 149.98,
  reason: 'Damaged item reported by customer',
}

export default function ActionsPanel({ ticketId }) {
  const toast = useToast()
  const { data: actions = [], isLoading, isError, error, refetch } = useTicketActions(ticketId)
  const recommendAction = useRecommendAction(ticketId)
  const proposeAction = useProposeAction(ticketId)
  const approveAction = useApproveAction()
  const rejectAction = useRejectAction()

  const [actionType, setActionType] = useState('START_REFUND_REVIEW')
  const [parametersText, setParametersText] = useState(JSON.stringify(DEFAULT_PARAMETERS, null, 2))
  const [rationale, setRationale] = useState('')
  const [formError, setFormError] = useState('')
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey)
  const [review, setReview] = useState(null)
  const [comments, setComments] = useState('')

  const recommendation = recommendAction.data
  const recommendationParams = useMemo(
    () => (recommendation?.suggestedParameters ? JSON.stringify(recommendation.suggestedParameters, null, 2) : ''),
    [recommendation],
  )

  useEffect(() => {
    if (!recommendation) return
    if (recommendation.recommendedAction) setActionType(recommendation.recommendedAction)
    if (recommendationParams) setParametersText(recommendationParams)
    if (recommendation.rationale) setRationale(recommendation.rationale)
  }, [recommendation, recommendationParams])

  const handleRecommend = async () => {
    try {
      const data = await recommendAction.mutateAsync()
      if (data.recommended) {
        toast.success(`Recommended action: ${titleCase(data.recommendedAction)}.`)
      } else {
        toast.info(data.rationale || 'No action is recommended for this ticket.')
      }
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const handlePropose = async (event) => {
    event.preventDefault()
    setFormError('')

    let parameters
    try {
      parameters = JSON.parse(parametersText)
    } catch {
      setFormError('Parameters must be valid JSON.')
      return
    }

    if (!parameters || typeof parameters !== 'object' || Array.isArray(parameters)) {
      setFormError('Parameters must be a JSON object.')
      return
    }

    try {
      const response = await proposeAction.mutateAsync({
        actionType,
        parameters,
        rationale: rationale.trim() || undefined,
        idempotencyKey,
      })
      if (response.duplicate) {
        toast.warning('A matching action already exists — no duplicate was created.')
      } else {
        toast.success(`Action proposed (#${response.toolCallId}). Approval is required before execution.`)
        setIdempotencyKey(newIdempotencyKey())
      }
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const openReview = (action, decision) => {
    setComments('')
    setReview({ action, decision })
  }

  const submitReview = async () => {
    if (!review) return
    try {
      if (review.decision === 'APPROVED') {
        const result = await approveAction.mutateAsync({
          actionId: review.action.toolCallId,
          comments: comments.trim() || undefined,
          ticketId,
        })
        toast.success(
          result.duplicate
            ? 'This action was already processed — approval replayed safely.'
            : 'Action approved and executed (simulated).',
        )
      } else {
        const result = await rejectAction.mutateAsync({
          actionId: review.action.toolCallId,
          comments: comments.trim() || undefined,
          ticketId,
        })
        toast.info(result.duplicate ? 'This action was already processed.' : 'Action rejected.')
      }
      setReview(null)
      setComments('')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const pendingReview = approveAction.isPending || rejectAction.isPending

  return (
    <div className="stack">
      <Card>
        <CardHeader
          title="Approval-gated actions"
          description="Actions are simulated, idempotent, and never execute without human approval."
          icon={<Icon name="lock" size={18} />}
          actions={
            <Button size="sm" variant="secondary" icon="sparkles" onClick={handleRecommend} loading={recommendAction.isPending}>
              Recommend action
            </Button>
          }
        />

        {recommendAction.isError ? (
          <ErrorState error={recommendAction.error} title="Recommendation failed" onRetry={handleRecommend} />
        ) : null}

        {recommendation ? (
          <div className="recommendation">
            <div className="recommendation__header">
              <div>
                <p className="recommendation__eyebrow">AI recommendation</p>
                <div className="chip-row">
                  {recommendation.recommended ? (
                    <ActionTypeBadge actionType={recommendation.recommendedAction} />
                  ) : (
                    <Badge tone="neutral">No action recommended</Badge>
                  )}
                  {recommendation.requiresHumanApproval ? <Badge tone="warning">Human approval required</Badge> : null}
                </div>
              </div>
            </div>
            <p className="text-muted">{recommendation.rationale}</p>
            {recommendation.suggestedParameters ? (
              <pre className="code-block">{prettyJson(recommendation.suggestedParameters)}</pre>
            ) : null}
          </div>
        ) : null}

        <form className="propose-form" onSubmit={handlePropose}>
          <div className="form-grid">
            <FormField label="Action type" htmlFor="action-type" required>
              <Select id="action-type" value={actionType} onChange={(event) => setActionType(event.target.value)}>
                {ACTION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {titleCase(type)}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              label="Idempotency key"
              htmlFor="idempotency-key"
              hint="Retries with the same key never create a duplicate action."
            >
              <div className="input-row">
                <input id="idempotency-key" className="input mono" value={idempotencyKey} readOnly />
                <CopyButton value={idempotencyKey} label="Copy" />
              </div>
            </FormField>

            <FormField
              label="Parameters (JSON)"
              htmlFor="action-parameters"
              error={formError}
              hint='Example: {"amount": 149.98, "reason": "damaged item"}'
              required
              className="form-grid__full"
            >
              <Textarea
                id="action-parameters"
                rows={6}
                className="mono"
                value={parametersText}
                onChange={(event) => setParametersText(event.target.value)}
                spellCheck={false}
              />
            </FormField>

            <FormField label="Rationale" htmlFor="action-rationale" hint="Why should this action be approved?" className="form-grid__full">
              <Textarea
                id="action-rationale"
                rows={2}
                value={rationale}
                onChange={(event) => setRationale(event.target.value)}
                placeholder="Explain the customer impact and policy basis…"
              />
            </FormField>
          </div>

          <div className="form-actions">
            <Button type="submit" icon="send" loading={proposeAction.isPending}>
              Propose action
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader title="Action history" description={`${actions.length} action${actions.length === 1 ? '' : 's'} for this ticket`} />
        {isLoading ? (
          <p className="text-muted">Loading actions…</p>
        ) : isError ? (
          <ErrorState error={error} title="Could not load actions" onRetry={refetch} />
        ) : actions.length === 0 ? (
          <EmptyState
            icon="inbox"
            title="No actions yet"
            description="Ask for a recommendation or propose an action above."
            compact
          />
        ) : (
          <div className="stack">
            {actions.map((action) => (
              <article className="action-card" key={action.toolCallId}>
                <div className="action-card__header">
                  <div className="chip-row">
                    <ActionTypeBadge actionType={action.actionType} />
                    <ToolCallStatusBadge status={action.status} />
                    {action.requiresApproval ? <Badge tone="warning">Approval gated</Badge> : null}
                  </div>
                  <span className="text-subtle">#{action.toolCallId}</span>
                </div>

                {action.rationale ? <p className="text-muted">{action.rationale}</p> : null}

                <div className="action-card__grid">
                  <div>
                    <p className="label-text">Parameters</p>
                    <pre className="code-block code-block--sm">{prettyJson(action.parameters)}</pre>
                  </div>
                  <div>
                    <p className="label-text">Idempotency key</p>
                    <div className="inline-meta">
                      <code className="code-inline">{action.idempotencyKey}</code>
                      <CopyButton value={action.idempotencyKey} label="Copy" />
                    </div>
                    <p className="label-text" style={{ marginTop: 12 }}>Timeline</p>
                    <ul className="mini-timeline">
                      <li>Created {formatDateTime(action.createdAt)}</li>
                      {action.approvedAt ? <li>Approved {formatDateTime(action.approvedAt)}</li> : null}
                      {action.executedAt ? <li>Executed {formatDateTime(action.executedAt)}</li> : null}
                    </ul>
                  </div>
                </div>

                {action.result ? (
                  <div className="callout callout--success">
                    <Icon name="check" size={16} />
                    <div>
                      <strong>Execution result</strong>
                      <pre className="code-block code-block--sm">{prettyJson(action.result)}</pre>
                    </div>
                  </div>
                ) : null}

                {action.status === 'PENDING_APPROVAL' ? (
                  <div className="action-card__actions">
                    <Button size="sm" variant="soft" icon="check" onClick={() => openReview(action, 'APPROVED')}>
                      Approve &amp; execute
                    </Button>
                    <Button size="sm" variant="danger" icon="close" onClick={() => openReview(action, 'REJECTED')}>
                      Reject
                    </Button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={Boolean(review)}
        onClose={pendingReview ? undefined : () => setReview(null)}
        title={review?.decision === 'APPROVED' ? 'Approve and execute action' : 'Reject action'}
        description={
          review?.decision === 'APPROVED'
            ? 'This simulates execution of the tool action. No real money moves. Approvals are idempotent.'
            : 'Rejecting prevents execution and records your decision in the audit trail.'
        }
        size="sm"
        closeOnBackdrop={!pendingReview}
        footer={
          <>
            <Button variant="secondary" onClick={() => setReview(null)} disabled={pendingReview}>
              Cancel
            </Button>
            <Button
              variant={review?.decision === 'APPROVED' ? 'primary' : 'danger'}
              onClick={submitReview}
              loading={pendingReview}
            >
              {review?.decision === 'APPROVED' ? 'Approve & execute' : 'Reject action'}
            </Button>
          </>
        }
      >
        {review ? (
          <div className="stack">
            <div className="review-summary">
              <div className="chip-row">
                <ActionTypeBadge actionType={review.action.actionType} />
                <ToolCallStatusBadge status={review.action.status} />
              </div>
              <p className="text-muted">
                Ticket #{ticketId} · action #{review.action.toolCallId}
              </p>
              <pre className="code-block code-block--sm">{prettyJson(review.action.parameters)}</pre>
            </div>
            <FormField label="Reviewer comments" htmlFor="action-review-comments" hint="Optional. Stored with the approval record.">
              <Textarea
                id="action-review-comments"
                rows={3}
                value={comments}
                onChange={(event) => setComments(event.target.value)}
                placeholder="Add a note for the audit trail…"
                data-autofocus
              />
            </FormField>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
