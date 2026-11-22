import { Link } from 'react-router-dom'
import Icon from './Icon'

export default function PageHeader({ eyebrow, title, description, actions, backTo, backLabel = 'Back' }) {
  return (
    <header className="page-header">
      <div className="page-header__main">
        {backTo ? (
          <Link className="back-link" to={backTo}>
            <Icon name="arrowLeft" size={15} />
            {backLabel}
          </Link>
        ) : null}
        {eyebrow ? <p className="page-header__eyebrow">{eyebrow}</p> : null}
        <h1 className="page-header__title">{title}</h1>
        {description ? <p className="page-header__description">{description}</p> : null}
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </header>
  )
}
