import Icon from './Icon'

export default function Tabs({ tabs, value, onChange, ariaLabel = 'Sections' }) {
  const handleKeyDown = (event, index) => {
    const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End']
    if (!keys.includes(event.key)) return

    event.preventDefault()
    let nextIndex = index
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = tabs.length - 1

    onChange(tabs[nextIndex].id)
    document.getElementById(`tab-${tabs[nextIndex].id}`)?.focus()
  }

  return (
    <div className="tabs" role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab, index) => {
        const selected = tab.id === value
        return (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            className={`tab ${selected ? 'tab--active' : ''}`.trim()}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {tab.icon ? <Icon name={tab.icon} size={15} /> : null}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' ? <span className="tab__count">{tab.count}</span> : null}
          </button>
        )
      })}
    </div>
  )
}
