import Badge from '../../components/ui/Badge'
import CopyButton from '../../components/ui/CopyButton'
import Icon from '../../components/ui/Icon'
import Modal from '../../components/ui/Modal'
import { TICKET_CATEGORY_META } from '../../utils/constants'
import { titleCase } from '../../utils/format'

function categoryTone(category) {
  if (!category) return 'neutral'
  if (category === 'adversarial') return 'danger'
  return TICKET_CATEGORY_META[category.toUpperCase()]?.tone ?? 'neutral'
}

export default function KbDocumentModal({ open, document, onClose }) {
  if (!document) return null
  const adversarial = document.category === 'adversarial'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={document.title}
      description={`${document.kbId} · knowledge base document`}
      size="lg"
      footer={
        <>
          <CopyButton value={document.content} label="Copy content" variant="secondary" size="md" />
          <button type="button" className="btn btn--primary btn--md" onClick={onClose}>
            Close
          </button>
        </>
      }
    >
      <div className="kb-document">
        <div className="chip-row">
          <Badge tone={categoryTone(document.category)}>{titleCase(document.category)}</Badge>
          <Badge tone="neutral">{document.kbId}</Badge>
        </div>

        {adversarial ? (
          <div className="callout callout--danger">
            <Icon name="shield" size={16} />
            <p>
              This is an adversarial test document. It is deliberately unsafe and must be blocked by
              the guardrail document filter before it can reach a draft.
            </p>
          </div>
        ) : null}

        <div className="kb-document__content">
          <p>{document.content}</p>
        </div>
      </div>
    </Modal>
  )
}
