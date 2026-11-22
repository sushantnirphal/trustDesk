import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import Card, { CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Icon from '../components/ui/Icon'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import Pagination from '../components/ui/Pagination'
import Modal from '../components/ui/Modal'
import { Select } from '../components/ui/Field'
import { TableSkeleton } from '../components/ui/Skeleton'
import { RunTypeBadge, TraceStatusBadge } from '../components/ui/MetaBadges'
import { useTraces } from '../hooks/useTraces'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { RUN_TYPES, TRACE_STATUSES, TRACE_STATUS_META } from '../utils/constants'
import { formatDateTime, formatNumber, prettyJson, titleCase } from '../utils/format'

const PAGE_SIZE = 12

export default function TracesPage() {
  useDocumentTitle('Traces')
  const [runType, setRunType] = useState('ALL')
  const [status, setStatus] = useState('ALL')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [page, setPage] = useState(1)
  const [selectedTrace, setSelectedTrace] = useState(null)

  const { data: traces = [], isLoading, isError, error, refetch, isFetching } = useTraces({
    runType,
    autoRefresh,
  })

  const counts = useMemo(() => {
    return traces.reduce(
      (accumulator, trace) => {
        accumulator.ALL += 1
        accumulator[trace.finalStatus] = (accumulator[trace.finalStatus] ?? 0) + 1
        return accumulator
      },
      { ALL: 0 },
    )
  }, [traces])

  const filtered = useMemo(() => {
    const rows = status === 'ALL' ? traces : traces.filter((trace) => trace.finalStatus === status)
    return [...rows].sort((a, b) => new Date(b.timestamp ?? 0) - new Date(a.timestamp ?? 0))
  }, [traces, status])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const changeRunType = (value) => {
    setRunType(value)
    setPage(1)
  }

  const changeStatus = (value) => {
    setStatus(value)
    setPage(1)
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Audit"
        title="Run traces"
        description="Every AI run records retrieved documents, guardrail outcomes, tool actions, and a final status."
        actions={
          <Button variant="secondary" icon="refresh" onClick={() => refetch()} loading={isFetching && !isLoading}>
            Refresh
          </Button>
        }
      />

      <section className="stat-grid" aria-label="Trace metrics">
        <StatCard label="Traces" value={formatNumber(counts.ALL)} meta="All recorded runs" icon="traces" tone="indigo" loading={isLoading} />
        <StatCard label="Blocked" value={formatNumber(counts.BLOCKED ?? 0)} meta="Guardrails stopped the run" icon="shield" tone="red" loading={isLoading} />
        <StatCard label="Escalated" value={formatNumber(counts.ESCALATED ?? 0)} meta="Handed to a human" icon="alert" tone="amber" loading={isLoading} />
        <StatCard label="Failed" value={formatNumber(counts.FAILED ?? 0)} meta="Provider or processing errors" icon="close" tone="slate" loading={isLoading} />
      </section>

      <Card className="card--flush">
        <div className="table-toolbar table-toolbar--wrap">
          <div className="filters filters--inline">
            <Select aria-label="Filter by run type" value={runType} onChange={(event) => changeRunType(event.target.value)} className="filters__select">
              <option value="ALL">All run types</option>
              {RUN_TYPES.map((type) => (
                <option key={type} value={type}>{titleCase(type)}</option>
              ))}
            </Select>

            <Select aria-label="Filter by trace status" value={status} onChange={(event) => changeStatus(event.target.value)} className="filters__select">
              <option value="ALL">All statuses</option>
              {TRACE_STATUSES.map((traceStatus) => (
                <option key={traceStatus} value={traceStatus}>{TRACE_STATUS_META[traceStatus].label}</option>
              ))}
            </Select>

            <label className="checkbox-field">
              <input type="checkbox" checked={autoRefresh} onChange={(event) => setAutoRefresh(event.target.checked)} />
              Auto-refresh every 10s
            </label>
          </div>
          <p className="table-toolbar__count">{formatNumber(filtered.length)} traces</p>
        </div>

        {isLoading ? (
          <TableSkeleton rows={8} columns={6} />
        ) : isError ? (
          <ErrorState error={error} title="Could not load traces" onRetry={refetch} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon="traces"
            title="No traces match these filters"
            description="Run triage or generate a draft to create trace records."
            action={<Link to="/tickets" className="btn btn--secondary btn--sm">Go to tickets</Link>}
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Trace</th>
                    <th scope="col">Ticket</th>
                    <th scope="col">Run type</th>
                    <th scope="col">Status</th>
                    <th scope="col">Guardrail</th>
                    <th scope="col">Docs</th>
                    <th scope="col">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((trace) => (
                    <tr
                      key={trace.id}
                      className="clickable-row"
                      tabIndex={0}
                      onClick={() => setSelectedTrace(trace)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          setSelectedTrace(trace)
                        }
                      }}
                      aria-label={`Open trace ${trace.id}`}
                    >
                      <td data-label="Trace"><span className="mono text-strong">#{trace.id}</span></td>
                      <td data-label="Ticket">
                        <Link
                          to={`/tickets/${trace.ticketId}`}
                          className="text-link"
                          onClick={(event) => event.stopPropagation()}
                        >
                          #{trace.ticketId}
                        </Link>
                      </td>
                      <td data-label="Run type"><RunTypeBadge runType={trace.runType} /></td>
                      <td data-label="Status"><TraceStatusBadge status={trace.finalStatus} /></td>
                      <td data-label="Guardrail">
                        <span className="text-muted" title={trace.guardrailResult ?? ''}>{trace.guardrailResult || '—'}</span>
                      </td>
                      <td data-label="Docs">
                        <Badge tone="neutral">{trace.retrievedDocIds?.length ?? 0}</Badge>
                      </td>
                      <td data-label="Timestamp"><span className="text-muted">{formatDateTime(trace.timestamp)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} total={filtered.length} pageSize={PAGE_SIZE} />
          </>
        )}
      </Card>

      <Modal
        open={Boolean(selectedTrace)}
        onClose={() => setSelectedTrace(null)}
        title={selectedTrace ? `Trace #${selectedTrace.id}` : 'Trace'}
        description={selectedTrace ? `${selectedTrace.runType} run · ${formatDateTime(selectedTrace.timestamp)}` : undefined}
        size="lg"
        footer={
          <button type="button" className="btn btn--secondary btn--md" onClick={() => setSelectedTrace(null)}>
            Close
          </button>
        }
      >
        {selectedTrace ? (
          <div className="stack">
            <div className="chip-row">
              <RunTypeBadge runType={selectedTrace.runType} />
              <TraceStatusBadge status={selectedTrace.finalStatus} />
              <Link to={`/tickets/${selectedTrace.ticketId}`} className="text-link">Open ticket #{selectedTrace.ticketId}</Link>
            </div>

            <div className="kv-list">
              <div className="kv"><dt>Ticket</dt><dd>#{selectedTrace.ticketId}</dd></div>
              <div className="kv"><dt>Timestamp</dt><dd>{formatDateTime(selectedTrace.timestamp)}</dd></div>
              <div className="kv"><dt>Guardrail result</dt><dd>{selectedTrace.guardrailResult || '—'}</dd></div>
            </div>

            <div>
              <p className="label-text">Retrieved documents</p>
              {selectedTrace.retrievedDocIds?.length ? (
                <div className="chip-row">
                  {selectedTrace.retrievedDocIds.map((documentId) => (
                    <Badge key={documentId} tone="neutral">{documentId}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No documents retrieved for this run.</p>
              )}
            </div>

            <div>
              <p className="label-text">Tool actions</p>
              <pre className="code-block">{prettyJson(selectedTrace.toolActions) || 'No tool actions recorded.'}</pre>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
