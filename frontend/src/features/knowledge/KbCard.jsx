import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import { TICKET_CATEGORY_META } from '../../utils/constants'
import { formatPercent, titleCase, truncate } from '../../utils/format'

function categoryTone(category) {
  if (!category) return 'neutral'
  if (category === 'adversarial') return 'danger'
  return TICKET_CATEGORY_META[category.toUpperCase()]?.tone ?? 'neutral'
}

export default function KbCard({ document, onOpen, relevanceScore, snippet }) {
  const adversarial = document.category === 'adversarial'
  return (
    <article className={`kb-card ${adversarial ? 'kb-card--danger' : ''}`.trim()}>
      <div className="kb-card__top">
        <span className={`kb-card__icon ${adversarial ? 'kb-card__icon--danger' : ''}`.trim()}>
          <Icon name={adversarial ? 'shield' : 'file'} size={18} />
        </span>
        <div className="kb-card__heading">
          <h3>{document.title}</h3>
          <p className="text-subtle">{document.kbId}</p>
        </div>
        <Badge tone={categoryTone(document.category)}>{titleCase(document.category)}</Badge>
      </div>

      <p className="kb-card__snippet">{snippet || truncate(document.content, 190)}</p>

      <div className="kb-card__footer">
        {typeof relevanceScore === 'number' ? (
          <span className="text-subtle">
            <Icon name="search" size={13} /> Relevance {formatPercent(relevanceScore)}
          </span>
        ) : (
          <span className="text-subtle">Policy document</span>
        )}
        <Button size="sm" variant="secondary" icon="file" onClick={() => onOpen(document)}>
          Read
        </Button>
      </div>
    </article>
  )
}
