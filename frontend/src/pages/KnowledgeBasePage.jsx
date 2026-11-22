import { useMemo, useState } from 'react'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import Card, { CardHeader } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Icon from '../components/ui/Icon'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import Skeleton from '../components/ui/Skeleton'
import KbCard from '../features/knowledge/KbCard'
import KbDocumentModal from '../features/knowledge/KbDocumentModal'
import { useKnowledgeBaseCatalog, useKnowledgeBaseSearch } from '../hooks/useKnowledgeBase'
import { useToast } from '../hooks/useToast'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { getErrorMessage } from '../utils/errors'
import { formatNumber } from '../utils/format'

const CATEGORY_FILTERS = [
  { value: 'ALL', label: 'All documents' },
  { value: 'refund', label: 'Refund' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'warranty', label: 'Warranty' },
  { value: 'billing', label: 'Billing' },
  { value: 'account_security', label: 'Account security' },
  { value: 'adversarial', label: 'Adversarial' },
]

export default function KnowledgeBasePage() {
  useDocumentTitle('Knowledge base')
  const toast = useToast()
  const catalogQuery = useKnowledgeBaseCatalog()
  const search = useKnowledgeBaseSearch()

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('ALL')
  const [selectedDocument, setSelectedDocument] = useState(null)

  const catalog = catalogQuery.data ?? []
  const searchResult = search.data
  const documents = searchResult?.documents ?? []

  const counts = useMemo(() => {
    return catalog.reduce(
      (accumulator, document) => {
        accumulator.ALL += 1
        accumulator[document.category] = (accumulator[document.category] ?? 0) + 1
        return accumulator
      },
      { ALL: 0 },
    )
  }, [catalog])

  const filteredCatalog = useMemo(() => {
    if (category === 'ALL') return catalog
    return catalog.filter((document) => document.category === category)
  }, [catalog, category])

  const changeCategory = (nextCategory) => {
    setCategory(nextCategory)
    search.reset()
  }

  const runSearch = async () => {
    if (!query.trim()) {
      search.reset()
      return
    }

    try {
      await search.mutateAsync({
        query: query.trim(),
        category: category === 'ALL' ? undefined : category,
        maxResults: 20,
      })
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const submitSearch = (event) => {
    event.preventDefault()
    runSearch()
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Retrieval"
        title="Knowledge base"
        description="The policy corpus behind every citation. Retrieved documents are treated as untrusted input."
        actions={
          <Button
            variant="secondary"
            icon="refresh"
            onClick={() => catalogQuery.refetch()}
            loading={catalogQuery.isFetching}
          >
            Refresh catalog
          </Button>
        }
      />

      <div className="callout callout--info">
        <Icon name="shield" size={16} />
        <p>
          The corpus includes an intentionally unsafe adversarial document. If retrieval returns it,
          the guardrail filter must block it before draft generation.
        </p>
      </div>

      <Card>
        <CardHeader
          title="Search policy documents"
          description="Semantic search with a keyword fallback when no embedding provider is configured."
          icon={<Icon name="search" size={18} />}
          actions={
            searchResult ? (
              <Badge tone="info">
                {formatNumber(searchResult.totalFound)} matches · {searchResult.mode} · {searchResult.searchTimeMs} ms
              </Badge>
            ) : null
          }
        />

        <form className="kb-search" onSubmit={submitSearch}>
          <div className="search-input search-input--lg">
            <Icon name="search" size={18} className="search-input__icon" />
            <input
              type="search"
              className="search-input__field"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="e.g. refund window for damaged items"
              aria-label="Search the knowledge base"
            />
            {query ? (
              <button
                type="button"
                className="search-input__clear"
                onClick={() => {
                  setQuery('')
                  search.reset()
                }}
                aria-label="Clear search"
              >
                <Icon name="close" size={14} />
              </button>
            ) : null}
          </div>
          <Button type="submit" icon="search" loading={search.isPending}>
            Search
          </Button>
        </form>

        <div className="status-chips kb-category-chips" role="group" aria-label="Filter knowledge base by category">
          {CATEGORY_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={`chip ${category === filter.value ? 'chip--active' : ''}`.trim()}
              onClick={() => changeCategory(filter.value)}
            >
              {filter.label}
              <span className="chip__count">{formatNumber(counts[filter.value] ?? 0)}</span>
            </button>
          ))}
        </div>
      </Card>

      {search.isError ? (
        <ErrorState error={search.error} title="Search failed" onRetry={runSearch} />
      ) : null}

      {searchResult ? (
        <section className="stack" aria-label="Search results">
          <div className="section-heading">
            <h2>Search results</h2>
            <span className="text-subtle">
              Query “{query}” · {documents.length} documents
            </span>
          </div>
          {documents.length === 0 ? (
            <EmptyState
              icon="search"
              title="No documents matched"
              description="Try broader language, or clear the search to browse the full catalog."
              action={<Button variant="secondary" size="sm" onClick={() => { setQuery(''); search.reset() }}>Clear search</Button>}
            />
          ) : (
            <div className="grid grid--2">
              {documents.map((document) => (
                <KbCard
                  key={document.kbId}
                  document={document}
                  relevanceScore={document.relevanceScore}
                  snippet={document.matchedSnippet || document.content}
                  onOpen={setSelectedDocument}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="stack" aria-label="Knowledge base catalog">
          <div className="section-heading">
            <h2>Catalog</h2>
            <span className="text-subtle">
              {formatNumber(filteredCatalog.length)} {filteredCatalog.length === 1 ? 'document' : 'documents'}
            </span>
          </div>

          {catalogQuery.isLoading ? (
            <div className="grid grid--2">
              <Skeleton height={190} />
              <Skeleton height={190} />
              <Skeleton height={190} />
              <Skeleton height={190} />
            </div>
          ) : catalogQuery.isError ? (
            <ErrorState error={catalogQuery.error} title="Could not load the knowledge base" onRetry={catalogQuery.refetch} />
          ) : filteredCatalog.length === 0 ? (
            <EmptyState icon="kb" title="No documents in this category" compact />
          ) : (
            <div className="grid grid--2">
              {filteredCatalog.map((document) => (
                <KbCard key={document.kbId} document={document} onOpen={setSelectedDocument} />
              ))}
            </div>
          )}
        </section>
      )}

      <KbDocumentModal
        open={Boolean(selectedDocument)}
        document={selectedDocument}
        onClose={() => setSelectedDocument(null)}
      />
    </div>
  )
}
