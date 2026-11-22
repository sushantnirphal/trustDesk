import Badge from './Badge'
import {
  ACTION_TYPE_META,
  DRAFT_STATUS_META,
  GUARDRAIL_ACTION_META,
  RUN_TYPE_META,
  TICKET_CATEGORY_META,
  TICKET_PRIORITY_META,
  TICKET_STATUS_META,
  TOOL_CALL_STATUS_META,
  TRACE_STATUS_META,
} from '../../utils/constants'
import { humanize } from '../../utils/format'

function metaBadge(value, meta, fallbackTone = 'neutral') {
  const entry = meta[value]
  return {
    label: entry?.label ?? humanize(value),
    tone: entry?.tone ?? fallbackTone,
  }
}

export function TicketStatusBadge({ status, dot = true }) {
  const entry = metaBadge(status, TICKET_STATUS_META)
  return <Badge tone={entry.tone} dot={dot}>{entry.label}</Badge>
}

export function PriorityBadge({ priority, dot = true }) {
  const entry = metaBadge(priority, TICKET_PRIORITY_META)
  return <Badge tone={entry.tone} dot={dot}>{entry.label}</Badge>
}

export function CategoryBadge({ category }) {
  const entry = metaBadge(category, TICKET_CATEGORY_META)
  return <Badge tone={entry.tone}>{entry.label}</Badge>
}

export function DraftStatusBadge({ status, dot = true }) {
  const entry = metaBadge(status, DRAFT_STATUS_META)
  return <Badge tone={entry.tone} dot={dot}>{entry.label}</Badge>
}

export function ToolCallStatusBadge({ status, dot = true }) {
  const entry = metaBadge(status, TOOL_CALL_STATUS_META)
  return <Badge tone={entry.tone} dot={dot}>{entry.label}</Badge>
}

export function TraceStatusBadge({ status, dot = true }) {
  const entry = metaBadge(status, TRACE_STATUS_META)
  return <Badge tone={entry.tone} dot={dot}>{entry.label}</Badge>
}

export function RunTypeBadge({ runType }) {
  const entry = metaBadge(runType, RUN_TYPE_META)
  return <Badge tone={entry.tone}>{entry.label}</Badge>
}

export function GuardrailBadge({ action }) {
  if (!action) return <Badge tone="neutral">Not checked</Badge>
  const entry = metaBadge(action, GUARDRAIL_ACTION_META)
  return <Badge tone={entry.tone} dot>{entry.label}</Badge>
}

export function ActionTypeBadge({ actionType }) {
  const entry = metaBadge(actionType, ACTION_TYPE_META)
  return <Badge tone={entry.tone}>{entry.label}</Badge>
}
