import { useState } from 'react'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import Card, { CardHeader } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Icon from '../components/ui/Icon'
import CopyButton from '../components/ui/CopyButton'
import { FormField, Textarea } from '../components/ui/Field'
import { GuardrailBadge } from '../components/ui/MetaBadges'
import { useGuardrailCheck } from '../hooks/useGuardrails'
import { useToast } from '../hooks/useToast'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { getErrorMessage } from '../utils/errors'
import { GUARDRAIL_SAMPLES } from '../utils/constants'
import { formatDateTime, truncate } from '../utils/format'

const GUARDRAIL_MODES = [
  { value: 'input', label: 'Inbound ticket text' },
  { value: 'output', label: 'Outbound draft text' },
]

const ACTIONS = [
  { action: 'ALLOW', title: 'Allow', text: 'Safe content passes through unchanged.', tone: 'success' },
  { action: 'WARN', title: 'Warn', text: 'Suspicious but not dangerous. Content is sanitized and logged.', tone: 'warning' },
  { action: 'ESCALATE', title: 'Escalate', text: 'Identity bypass or high-risk intent is routed to a human.', tone: 'warning' },
  { action: 'BLOCK', title: 'Block', text: 'Injection or secret extraction is stopped before the model responds.', tone: 'danger' },
]

export default function GuardrailsPage() {
  useDocumentTitle('Guardrails')
  const toast = useToast()
  const check = useGuardrailCheck()
  const [text, setText] = useState(GUARDRAIL_SAMPLES[0].text)
  const [type, setType] = useState('input')
  const [history, setHistory] = useState([])

  const result = check.data

  const applySample = (sample) => {
    setText(sample.text)
    setType(sample.type)
    check.reset()
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!text.trim()) {
      toast.error('Enter some text to check.')
      return
    }

    try {
      const data = await check.mutateAsync({ text: text.trim(), type })
      setHistory((current) => [
        { id: `${Date.now()}-${current.length}`, text: text.trim(), type, result: data, timestamp: new Date().toISOString() },
        ...current,
      ].slice(0, 8))

      if (data.action === 'BLOCK' || data.action === 'ESCALATE') {
        toast.warning(`Guardrail ${data.action.toLowerCase()}d the input.`)
      } else {
        toast.success(`Guardrail result: ${data.action}.`)
      }
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Safety"
        title="Guardrails"
        description="Test the input and output filters that protect the model, the customer, and internal secrets."
      />

      <div className="grid grid--2 guardrail-layout">
        <Card>
          <CardHeader
            title="Run a guardrail check"
            description="Inbound text is sanitized before prompting. Outbound text is redacted before delivery."
            icon={<Icon name="shield" size={18} />}
          />

          <div className="sample-buttons">
            {GUARDRAIL_SAMPLES.map((sample) => (
              <button
                key={sample.label}
                type="button"
                className="sample-button"
                onClick={() => applySample(sample)}
              >
                <Icon name={sample.type === 'input' ? 'tickets' : 'file'} size={14} />
                {sample.label}
              </button>
            ))}
          </div>

          <form className="stack" onSubmit={submit}>
            <FormField label="Mode" htmlFor="guardrail-type" hint="Choose whether the text represents customer input or an AI draft.">
              <div className="segmented" role="group" aria-label="Guardrail mode">
                {GUARDRAIL_MODES.map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    className={`segmented__option ${type === mode.value ? 'segmented__option--active' : ''}`.trim()}
                    onClick={() => setType(mode.value)}
                    aria-pressed={type === mode.value}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </FormField>

            <FormField label="Text to check" htmlFor="guardrail-text" required>
              <Textarea
                id="guardrail-text"
                rows={7}
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Paste ticket text or a draft reply…"
              />
            </FormField>

            <div className="form-actions">
              <Button type="submit" icon="shield" loading={check.isPending}>
                Run guardrail check
              </Button>
            </div>
          </form>
        </Card>

        <div className="stack">
          <Card>
            <CardHeader
              title="Result"
              description="The latest guardrail decision and sanitized text."
              icon={<Icon name="zap" size={18} />}
            />

            {check.isPending ? (
              <div className="guardrail-pending">
                <span className="spinner" style={{ width: 22, height: 22 }} aria-hidden="true" />
                <p>Evaluating input against guardrail rules…</p>
              </div>
            ) : check.isError ? (
              <div className="callout callout--danger">
                <Icon name="alert" size={16} />
                <p>{getErrorMessage(check.error)}</p>
              </div>
            ) : result ? (
              <div className="stack">
                <div className={`guardrail-result guardrail-result--${String(result.action).toLowerCase()}`}>
                  <GuardrailBadge action={result.action} />
                  <p>{result.reason}</p>
                </div>

                {result.violations?.length ? (
                  <div>
                    <p className="label-text">Violations</p>
                    <div className="chip-row">
                      {result.violations.map((violation) => (
                        <Badge key={violation} tone="danger">{violation}</Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted">No violations detected.</p>
                )}

                <div>
                  <div className="section-heading section-heading--tight">
                    <p className="label-text">Sanitized text</p>
                    <CopyButton value={result.sanitizedText} label="Copy" />
                  </div>
                  <pre className="code-block">{result.sanitizedText || '—'}</pre>
                </div>
              </div>
            ) : (
              <div className="empty-state empty-state--compact">
                <span className="empty-state__icon"><Icon name="shield" size={22} /></span>
                <h3>No check run yet</h3>
                <p>Pick a sample or paste your own text, then run the check.</p>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Recent checks" description="This browser session only." icon={<Icon name="clock" size={18} />} />
            {history.length === 0 ? (
              <p className="text-muted">Checks you run will appear here.</p>
            ) : (
              <ul className="guardrail-history">
                {history.map((entry) => (
                  <li key={entry.id}>
                    <div className="guardrail-history__top">
                      <GuardrailBadge action={entry.result.action} />
                      <span className="text-subtle">{formatDateTime(entry.timestamp)}</span>
                    </div>
                    <p className="text-muted">{truncate(entry.text, 120)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader
          title="How decisions are made"
          description="Guardrail actions are deterministic and logged with every trace."
          icon={<Icon name="info" size={18} />}
        />
        <div className="guardrail-actions">
          {ACTIONS.map((item) => (
            <div className={`guardrail-action guardrail-action--${item.tone}`} key={item.action}>
              <GuardrailBadge action={item.action} />
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
