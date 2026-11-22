import Button from '../../components/ui/Button'
import Card, { CardHeader } from '../../components/ui/Card'
import Icon from '../../components/ui/Icon'
import { GuardrailBadge, PriorityBadge, CategoryBadge } from '../../components/ui/MetaBadges'
import { useRunTriage, useTriageStatus } from '../../hooks/useTickets'
import { useToast } from '../../hooks/useToast'
import { getErrorMessage } from '../../utils/errors'
import { formatPercent } from '../../utils/format'

export default function TriageCard({ ticketId, ticket }) {
  const toast = useToast()
  const { data: triageStatus } = useTriageStatus(ticketId)
  const runTriage = useRunTriage(ticketId)
  const result = runTriage.data

  const category = result?.category ?? triageStatus?.category ?? ticket?.category
  const priority = result?.priority ?? triageStatus?.priority ?? ticket?.priority
  const escalation = result?.escalationNeeded ?? triageStatus?.escalationNeeded ?? ticket?.escalationNeeded

  const handleRun = async () => {
    try {
      const data = await runTriage.mutateAsync()
      if (data.guardrailAction === 'BLOCK') {
        toast.warning('Triage ran, but the input was blocked by guardrails and escalated.')
      } else {
        toast.success(`Triage complete: ${data.category} · ${data.priority}.`)
      }
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <Card>
      <CardHeader
        title="AI triage"
        description="Classifies category, priority, escalation need, and guardrail action."
        icon={<Icon name="sparkles" size={18} />}
        actions={
          <Button size="sm" icon="play" onClick={handleRun} loading={runTriage.isPending}>
            {result ? 'Re-run triage' : 'Run triage'}
          </Button>
        }
      />

      <div className="triage-summary">
        <div className="triage-summary__item">
          <span className="triage-summary__label">Category</span>
          <CategoryBadge category={category} />
        </div>
        <div className="triage-summary__item">
          <span className="triage-summary__label">Priority</span>
          <PriorityBadge priority={priority} />
        </div>
        <div className="triage-summary__item">
          <span className="triage-summary__label">Escalation</span>
          <span className={`text-strong ${escalation ? 'text-danger' : 'text-success'}`}>
            {escalation ? 'Required' : 'Not required'}
          </span>
        </div>
        <div className="triage-summary__item">
          <span className="triage-summary__label">Guardrail</span>
          <GuardrailBadge action={result?.guardrailAction} />
        </div>
      </div>

      {result?.reasoning ? (
        <div className="callout callout--info">
          <Icon name="info" size={16} />
          <p>{result.reasoning}</p>
        </div>
      ) : null}

      {result?.guardrailViolations?.length ? (
        <div className="callout callout--danger">
          <Icon name="alert" size={16} />
          <div>
            <strong>Guardrail violations</strong>
            <ul className="inline-list">
              {result.guardrailViolations.map((violation) => (
                <li key={violation}>{violation}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {result ? (
        <div className="triage-meta">
          <span>
            <Icon name="clock" size={14} /> Processed in {result.processingTimeMs ?? 0} ms
          </span>
          <span>
            <Icon name="zap" size={14} /> Confidence {formatPercent(result.confidenceScore)}
          </span>
        </div>
      ) : (
        <p className="text-muted">
          No triage run in this session yet. The ticket&apos;s current category is shown above.
        </p>
      )}
    </Card>
  )
}
