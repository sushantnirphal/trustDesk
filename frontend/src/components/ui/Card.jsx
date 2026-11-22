export function Card({ children, className = '', as: Tag = 'section', ...props }) {
  return (
    <Tag className={`card ${className}`.trim()} {...props}>
      {children}
    </Tag>
  )
}

export function CardHeader({ title, description, actions, icon }) {
  return (
    <div className="card__header">
      <div className="card__heading">
        {icon ? <span className="card__icon">{icon}</span> : null}
        <div>
          <h2 className="card__title">{title}</h2>
          {description ? <p className="card__description">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="card__actions">{actions}</div> : null}
    </div>
  )
}

export function CardBody({ children, className = '' }) {
  return <div className={`card__body ${className}`.trim()}>{children}</div>
}

export function CardFooter({ children, className = '' }) {
  return <div className={`card__footer ${className}`.trim()}>{children}</div>
}

export default Card
