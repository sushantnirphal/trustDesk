import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import Icon from '../../components/ui/Icon'
import { RunTypeBadge, TraceStatusBadge } from '../../components/ui/MetaBadges'
import { formatDateTime, prettyJson } from '../../utils/format'

export default function TraceTimeline({ traces = [] }) {
  if (!traces.length) {
    return (
      <EmptyState
        icon="traces"
        title="No traces recorded"
        description="Triage, draft generation, and approved actions automatically produce trace records."
        compact
      />
    )
  }

  return (
    <ol className="timeline">
      {traces.map((trace) => {
        const toolActions = prettyJson(trace.toolActions)
        return (
          <li className="timeline__item" key={trace.id}>
            <span className={`timeline__dot timeline__dot--${String(trace.finalStatus || '').toLowerCase()}`} aria-hidden="true" />
            <div className="timeline__content">
              <div className="timeline__header">
                <div className="chip-row">
                  <RunTypeBadge runType={trace.runType} />
                  <TraceStatusBadge status={trace.finalStatus} />
                </div>
                <span className="text-subtle">{formatDateTime(trace.timestamp)}</span>
              </div>

              {trace.guardrailResult ? (
                <p className="timeline__guardrail">
                  <Icon name="shield" size={14} /> Guardrail: {trace.guardrailResult}
                </p>
              ) : null}

              {trace.retrievedDocIds?.length ? (
                <div className="chip-row" style={{ marginTop: 8 }}>
                  <span className="text-subtle">Retrieved:</span>
                  {trace.retrievedDocIds.map((documentId) => (
                    <Badge key={documentId} tone="neutral">{documentId}</Badge>
                  ))}
                </div>
              ) : null}

              {toolActions ? (
                <details className="trace-details">
                  <summary>Tool actions payload</summary>
                  <pre className="code-block code-block--sm">{toolActions}</pre>
                </details>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
