import { useState } from 'react'
import Button from '../../components/ui/Button'
import Card, { CardHeader } from '../../components/ui/Card'
import Icon from '../../components/ui/Icon'
import Badge from '../../components/ui/Badge'
import CopyButton from '../../components/ui/CopyButton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Modal from '../../components/ui/Modal'
import { FormField, Textarea } from '../../components/ui/Field'
import { DraftStatusBadge, GuardrailBadge } from '../../components/ui/MetaBadges'
import { useDraftsForTicket, useGenerateDraft, useReviewDraft } from '../../hooks/useDrafts'
import { useToast } from '../../hooks/useToast'
import { getErrorMessage } from '../../utils/errors'
import { formatDateTime, formatPercent, splitCitations } from '../../utils/format'
import Skeleton from '../../components/ui/Skeleton'

function DraftBody({ draft }) {
  const citations = Array.isArray(draft.citationIds) ? draft.citationIds : splitCitations(draft.citationIds)
  const score = Number(draft.groundingScore ?? 0)

  return (
    <>
      <div className="draft-meta">
        <DraftStatusBadge status={draft.status} />
        <span className="text-subtle">{formatDateTime(draft.createdAt)}</span>
        <span className="text-subtle">Grounding {formatPercent(score)}</span>
      </div>
      <p className="draft-content">{draft.content}</p>
      <div className="draft-footer">
        <div className="chip-row">
          {citations.length ? (
            citations.map((citation) => (
              <Badge key={citation} tone="neutral">
                {citation}
              </Badge>
            ))
          ) : (
            <span className="text-subtle">No citations</span>
          )}
        </div>
        <CopyButton value={draft.content} label="Copy draft" />
      </div>
    </>
  )
}

export default function DraftsPanel({ ticketId }) {
  const toast = useToast()
  const { data: drafts = [], isLoading, isError, error, refetch } = useDraftsForTicket(ticketId)
  const generateDraft = useGenerateDraft(ticketId)
  const reviewDraft = useReviewDraft(ticketId)
  const [review, setReview] = useState(null)
  const [comments, setComments] = useState('')

  const handleGenerate = async () => {
    try {
      const data = await generateDraft.mutateAsync({})
      if (data.status === 'REFUSED' || data.status === 'ESCALATED') {
        toast.warning(`Draft ${data.status.toLowerCase()}: ${data.refusalReason ?? 'review recommended.'}`)
      } else {
        toast.success('Grounded draft generated.')
      }
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const openReview = (draft, decision) => {
    setComments('')
    setReview({ draft, decision })
  }

  const submitReview = async () => {
    if (!review) return
    try {
      await reviewDraft.mutateAsync({
        draftId: review.draft.id,
        decision: review.decision,
        comments: comments.trim() || undefined,
      })
      toast.success(review.decision === 'APPROVED' ? 'Draft approved.' : 'Draft rejected.')
      setReview(null)
      setComments('')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const generated = generateDraft.data

  return (
    <Card>
      <CardHeader
        title="Grounded drafts"
        description="Drafts cite retrieved policy documents and require human review before use."
        icon={<Icon name="file" size={18} />}
        actions={
          <Button size="sm" icon="sparkles" onClick={handleGenerate} loading={generateDraft.isPending}>
            Generate draft
          </Button>
        }
      />

      {generateDraft.isError ? (
        <ErrorState error={generateDraft.error} title="Draft generation failed" onRetry={handleGenerate} />
      ) : null}

      {generated ? (
        <div className={`generated-card generated-card--${(generated.status || '').toLowerCase()}`}>
          <div className="generated-card__header">
            <div>
              <p className="generated-card__eyebrow">Latest generation</p>
              <h3>Draft #{generated.draftId}</h3>
            </div>
            <div className="chip-row">
              <DraftStatusBadge status={generated.status} />
              <GuardrailBadge action={generated.guardrailAction} />
            </div>
          </div>

          <p className="draft-content">{generated.content}</p>

          <div className="draft-footer">
            <div className="chip-row">
              {generated.citationIds?.length ? (
                generated.citationIds.map((citation) => (
                  <Badge key={citation} tone="neutral">{citation}</Badge>
                ))
              ) : (
                <span className="text-subtle">No citations</span>
              )}
              <Badge tone="info">Grounding {formatPercent(generated.groundingScore)}</Badge>
              <Badge tone="neutral">{generated.processingTimeMs ?? 0} ms</Badge>
            </div>
            <CopyButton value={generated.content} label="Copy" />
          </div>

          {generated.refusalReason ? (
            <div className="callout callout--warning">
              <Icon name="alert" size={16} />
              <p>{generated.refusalReason}</p>
            </div>
          ) : null}

          {generated.blockedDocumentIds?.length ? (
            <div className="callout callout--danger">
              <Icon name="shield" size={16} />
              <p>
                Blocked unsafe retrieved documents: {generated.blockedDocumentIds.join(', ')}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {isLoading ? (
        <div className="stack">
          <Skeleton height={88} />
          <Skeleton height={88} />
        </div>
      ) : isError ? (
        <ErrorState error={error} title="Could not load drafts" onRetry={refetch} />
      ) : drafts.length === 0 ? (
        <EmptyState
          icon="file"
          title="No drafts yet"
          description="Generate a grounded reply to see citations, grounding score, and guardrail outcome."
          action={<Button size="sm" icon="sparkles" onClick={handleGenerate} loading={generateDraft.isPending}>Generate first draft</Button>}
        />
      ) : (
        <div className="stack">
          {drafts.map((draft) => (
            <article className="draft-card" key={draft.id}>
              <div className="draft-card__header">
                <div>
                  <h3>Draft #{draft.id}</h3>
                  <DraftStatusBadge status={draft.status} />
                </div>
                <div className="draft-card__actions">
                  <CopyButton value={draft.content} label="Copy" />
                  {draft.status !== 'APPROVED' && draft.status !== 'REJECTED' ? (
                    <>
                      <Button size="sm" variant="soft" icon="check" onClick={() => openReview(draft, 'APPROVED')}>
                        Approve
                      </Button>
                      <Button size="sm" variant="danger" icon="close" onClick={() => openReview(draft, 'REJECTED')}>
                        Reject
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
              <DraftBody draft={draft} />
            </article>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(review)}
        onClose={reviewDraft.isPending ? undefined : () => setReview(null)}
        title={review?.decision === 'APPROVED' ? 'Approve draft' : 'Reject draft'}
        description={
          review?.decision === 'APPROVED'
            ? 'Approving marks the draft as ready for the agent to send. It does not send the message.'
            : 'Rejecting keeps the draft in the audit trail with your feedback.'
        }
        size="sm"
        closeOnBackdrop={!reviewDraft.isPending}
        footer={
          <>
            <Button variant="secondary" onClick={() => setReview(null)} disabled={reviewDraft.isPending}>
              Cancel
            </Button>
            <Button
              variant={review?.decision === 'APPROVED' ? 'primary' : 'danger'}
              onClick={submitReview}
              loading={reviewDraft.isPending}
            >
              {review?.decision === 'APPROVED' ? 'Approve draft' : 'Reject draft'}
            </Button>
          </>
        }
      >
        <FormField label="Review comments" htmlFor="draft-review-comments" hint="Optional, but useful for the audit trail.">
          <Textarea
            id="draft-review-comments"
            rows={4}
            value={comments}
            onChange={(event) => setComments(event.target.value)}
            placeholder="Add context for the reviewer…"
            data-autofocus
          />
        </FormField>
      </Modal>
    </Card>
  )
}
