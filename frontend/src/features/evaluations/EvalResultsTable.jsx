import { Fragment, useState } from 'react'
import Badge from '../../components/ui/Badge'
import Icon from '../../components/ui/Icon'
import { GuardrailBadge } from '../../components/ui/MetaBadges'
import { titleCase } from '../../utils/format'

const CHECKS = [
  { key: 'triagePassed', label: 'Triage' },
  { key: 'escalationPassed', label: 'Escalation' },
  { key: 'unsafeActionBlocked', label: 'Unsafe blocked' },
  { key: 'citationCovered', label: 'Citations' },
]

function CheckPill({ passed, label }) {
  return (
    <span className={`check-pill ${passed ? 'check-pill--pass' : 'check-pill--fail'}`.trim()}>
      <Icon name={passed ? 'check' : 'close'} size={12} />
      {label}
    </span>
  )
}

export default function EvalResultsTable({ result }) {
  const [expanded, setExpanded] = useState(null)
  if (!result?.results?.length) return null

  return (
    <div className="table-wrap">
      <table className="data-table eval-table">
        <thead>
          <tr>
            <th scope="col">Case</th>
            <th scope="col">Expected</th>
            <th scope="col">Actual</th>
            <th scope="col">Guardrail</th>
            <th scope="col">Checks</th>
            <th scope="col">Result</th>
          </tr>
        </thead>
        <tbody>
          {result.results.map((row) => {
            const open = expanded === row.caseId
            return (
              <Fragment key={row.caseId}>
                <tr
                  className="clickable-row"
                  onClick={() => setExpanded(open ? null : row.caseId)}
                >
                  <td data-label="Case">
                    <button
                      type="button"
                      className="row-expander"
                      aria-expanded={open}
                      aria-label={`${open ? 'Collapse' : 'Expand'} ${row.caseId}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        setExpanded(open ? null : row.caseId)
                      }}
                    >
                      <Icon name={open ? 'chevronDown' : 'chevronRight'} size={14} />
                    </button>
                    <span className="mono text-strong">{row.caseId}</span>
                  </td>
                  <td data-label="Expected"><span className="mono">{row.expectedOutput}</span></td>
                  <td data-label="Actual"><span className="mono">{row.actualOutput}</span></td>
                  <td data-label="Guardrail"><GuardrailBadge action={row.guardrailAction} /></td>
                  <td data-label="Checks">
                    <div className="check-row">
                      {CHECKS.map((check) => (
                        <CheckPill key={check.key} passed={Boolean(row[check.key])} label={check.label} />
                      ))}
                    </div>
                  </td>
                  <td data-label="Result">
                    <Badge tone={row.passed ? 'success' : 'danger'} dot>{row.passed ? 'Pass' : 'Fail'}</Badge>
                  </td>
                </tr>
                {open ? (
                  <tr className="eval-detail-row">
                    <td colSpan={6}>
                      <div className="eval-detail">
                        <div>
                          <p className="label-text">Input</p>
                          <p className="text-muted">{row.input}</p>
                        </div>
                        <div>
                          <p className="label-text">Expected vs actual</p>
                          <p className="text-muted">
                            Expected <strong>{titleCase(row.expectedOutput)}</strong> · actual <strong>{titleCase(row.actualOutput)}</strong>
                            {' · '}escalation expected <strong>{String(row.expectedEscalation)}</strong>, actual{' '}
                            <strong>{String(row.actualEscalation)}</strong>
                          </p>
                        </div>
                        {row.guardrailViolations?.length ? (
                          <div>
                            <p className="label-text">Guardrail violations</p>
                            <div className="chip-row">
                              {row.guardrailViolations.map((violation) => (
                                <Badge key={violation} tone="danger">{violation}</Badge>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {row.notes ? (
                          <div>
                            <p className="label-text">Notes</p>
                            <p className="text-muted">{row.notes}</p>
                          </div>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
