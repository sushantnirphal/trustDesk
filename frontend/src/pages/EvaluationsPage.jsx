import { useEffect, useMemo, useRef, useState } from 'react'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import Card, { CardHeader } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Icon from '../components/ui/Icon'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import Skeleton from '../components/ui/Skeleton'
import EvalMetrics from '../features/evaluations/EvalMetrics'
import EvalResultsTable from '../features/evaluations/EvalResultsTable'
import { useEvalCases, useRunEvaluation } from '../hooks/useEvaluations'
import { useToast } from '../hooks/useToast'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { getErrorMessage } from '../utils/errors'
import { formatDuration, formatPercent } from '../utils/format'

const RUNS_STORAGE_KEY = 'trustdesk_eval_runs'

function readStoredRuns() {
  try {
    const raw = sessionStorage.getItem(RUNS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function storeRuns(runs) {
  try {
    sessionStorage.setItem(RUNS_STORAGE_KEY, JSON.stringify(runs))
  } catch {
    // Session storage may be unavailable; run history is best-effort.
  }
}

export default function EvaluationsPage() {
  useDocumentTitle('Evaluations')
  const toast = useToast()
  const casesQuery = useEvalCases()
  const runEvaluation = useRunEvaluation()

  const [selected, setSelected] = useState([])
  const [runs, setRuns] = useState(readStoredRuns)
  const [activeRunId, setActiveRunId] = useState(() => readStoredRuns()[0]?.runId ?? null)

  const cases = casesQuery.data ?? []
  const activeRun = useMemo(
    () => runs.find((run) => run.runId === activeRunId) ?? runs[0] ?? null,
    [runs, activeRunId],
  )

  const selectionInitialized = useRef(false)

  useEffect(() => {
    if (!selectionInitialized.current && cases.length > 0) {
      selectionInitialized.current = true
      setSelected(cases.map((item) => item.caseId))
    }
  }, [cases])

  const allSelected = cases.length > 0 && selected.length === cases.length

  const toggleCase = (caseId) => {
    setSelected((current) =>
      current.includes(caseId) ? current.filter((id) => id !== caseId) : [...current, caseId],
    )
  }

  const toggleAll = () => {
    setSelected(allSelected ? [] : cases.map((item) => item.caseId))
  }

  const recordRun = (result) => {
    const next = [result, ...runs.filter((run) => run.runId !== result.runId)].slice(0, 5)
    setRuns(next)
    setActiveRunId(result.runId)
    storeRuns(next)
  }

  const run = async (caseIds) => {
    try {
      const result = await runEvaluation.mutateAsync(caseIds)
      recordRun(result)
      toast.success(`Evaluation complete: ${result.passedCases}/${result.totalCases} cases passed.`)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Quality loop"
        title="Evaluations"
        description="Measure triage accuracy, escalation behavior, citation grounding, and guardrail containment against a fixed case set."
        actions={
          <>
            <Button
              variant="secondary"
              icon="play"
              onClick={() => run(selected)}
              loading={runEvaluation.isPending && selected.length !== cases.length}
              disabled={selected.length === 0 || runEvaluation.isPending}
            >
              Run selected ({selected.length})
            </Button>
            <Button icon="play" onClick={() => run([])} loading={runEvaluation.isPending}>
              Run all cases
            </Button>
          </>
        }
      />

      {runEvaluation.isPending ? (
        <div className="callout callout--info">
          <span className="spinner" style={{ width: 16, height: 16 }} aria-hidden="true" />
          <p>Evaluation in progress. Each case runs triage, guardrails, and citation checks — this can take a moment.</p>
        </div>
      ) : null}

      {runEvaluation.isError ? (
        <ErrorState error={runEvaluation.error} title="Evaluation run failed" onRetry={() => run(selected)} />
      ) : null}

      {activeRun ? (
        <Card>
          <CardHeader
            title="Latest run"
            description={`Run ${activeRun.runId} · ${activeRun.totalCases} cases`}
            icon={<Icon name="evals" size={18} />}
            actions={
              <Badge tone={activeRun.overallPassRate === 1 ? 'success' : activeRun.overallPassRate >= 0.8 ? 'warning' : 'danger'} dot>
                {formatPercent(activeRun.overallPassRate)} pass rate
              </Badge>
            }
          />
          <EvalMetrics result={activeRun} />
          <EvalResultsTable result={activeRun} />
        </Card>
      ) : (
        <Card>
          <CardHeader
            title="No evaluation run in this session"
            description="Run the full suite or a selection to populate the report."
            icon={<Icon name="evals" size={18} />}
          />
          <EmptyState
            icon="evals"
            title="Ready to evaluate"
            description="The suite covers refunds, shipping, warranty, account security, billing, prompt injection, and identity bypass."
            action={
              <Button icon="play" onClick={() => run([])} loading={runEvaluation.isPending}>
                Run all cases
              </Button>
            }
          />
        </Card>
      )}

      <div className="grid grid--2">
        <Card>
          <CardHeader
            title="Evaluation cases"
            description="Select the cases to include in the next run."
            icon={<Icon name="file" size={18} />}
            actions={
              <Button variant="ghost" size="sm" onClick={toggleAll}>
                {allSelected ? 'Clear all' : 'Select all'}
              </Button>
            }
          />
          {casesQuery.isLoading ? (
            <div className="stack">
              <Skeleton height={54} />
              <Skeleton height={54} />
              <Skeleton height={54} />
            </div>
          ) : casesQuery.isError ? (
            <ErrorState error={casesQuery.error} title="Could not load eval cases" onRetry={casesQuery.refetch} />
          ) : (
            <ul className="eval-case-list">
              {cases.map((evalCase) => {
                const checked = selected.includes(evalCase.caseId)
                return (
                  <li key={evalCase.caseId}>
                    <label className={`eval-case ${checked ? 'eval-case--selected' : ''}`.trim()}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCase(evalCase.caseId)}
                      />
                      <div className="eval-case__body">
                        <div className="eval-case__top">
                          <span className="mono text-strong">{evalCase.caseId}</span>
                          <div className="chip-row">
                            <Badge tone="neutral">{evalCase.category}</Badge>
                            <Badge tone={evalCase.expectedEscalation ? 'warning' : 'success'}>
                              {evalCase.expectedEscalation ? 'Escalate expected' : 'No escalation'}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-muted">{evalCase.input}</p>
                        <p className="text-subtle">Expected: {evalCase.expectedOutput}</p>
                      </div>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Session history"
            description="The last five runs are kept in this browser session."
            icon={<Icon name="clock" size={18} />}
          />
          {runs.length === 0 ? (
            <EmptyState icon="clock" title="No runs yet" description="Completed evaluations appear here." compact />
          ) : (
            <ul className="run-list">
              {runs.map((runItem) => (
                <li key={runItem.runId}>
                  <button
                    type="button"
                    className={`run-item ${runItem.runId === activeRun?.runId ? 'run-item--active' : ''}`.trim()}
                    onClick={() => setActiveRunId(runItem.runId)}
                  >
                    <span className="run-item__icon">
                      <Icon name="evals" size={16} />
                    </span>
                    <span className="run-item__main">
                      <strong>{runItem.passedCases}/{runItem.totalCases} passed</strong>
                      <span className="text-subtle">
                        {formatPercent(runItem.overallPassRate)} · {formatDuration(runItem.durationMs)} ·{' '}
                        {runItem.startedAt ? new Date(runItem.startedAt).toLocaleTimeString() : '—'}
                      </span>
                    </span>
                    <Badge tone={runItem.overallPassRate === 1 ? 'success' : 'warning'}>
                      {formatPercent(runItem.overallPassRate)}
                    </Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
