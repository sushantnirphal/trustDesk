import { Link } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function NotFoundPage() {
  useDocumentTitle('Page not found')

  return (
    <div className="not-found">
      <span className="not-found__code">404</span>
      <h1>This page is outside the queue</h1>
      <p>The link may be outdated, or the page may have moved.</p>
      <Link to="/dashboard" className="btn btn--primary btn--md">
        <Icon name="arrowLeft" size={16} />
        <span className="btn__label">Back to overview</span>
      </Link>
    </div>
  )
}
