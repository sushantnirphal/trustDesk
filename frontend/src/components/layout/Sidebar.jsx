import { NavLink } from 'react-router-dom'
import Icon from '../ui/Icon'
import { NAV_SECTIONS } from '../../utils/constants'
import { usePendingActions } from '../../hooks/useActions'

export default function Sidebar({ open, onClose }) {
  const { data: pendingActions = [] } = usePendingActions()
  const pendingCount = Array.isArray(pendingActions) ? pendingActions.length : 0

  return (
    <aside className={`sidebar ${open ? 'sidebar--open' : ''}`.trim()} aria-label="Primary navigation">
      <div className="sidebar__brand">
        <span className="brand-mark" aria-hidden="true">
          <Icon name="shield" size={22} />
        </span>
        <div className="brand-text">
          <span className="brand-name">TrustDesk</span>
          <span className="brand-subtitle">AI Support Operations</span>
        </div>
        <button type="button" className="sidebar__close" onClick={onClose} aria-label="Close navigation">
          <Icon name="close" size={18} />
        </button>
      </div>

      <nav className="sidebar__nav">
        {NAV_SECTIONS.map((section) => (
          <div className="sidebar__section" key={section.label}>
            <p className="sidebar__section-label">{section.label}</p>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`.trim()}
              >
                <Icon name={item.icon} size={18} />
                <span>{item.label}</span>
                {item.showPendingCount && pendingCount > 0 ? (
                  <span className="sidebar__count" aria-label={`${pendingCount} pending approvals`}>
                    {pendingCount}
                  </span>
                ) : null}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__notice">
          <Icon name="lock" size={15} />
          <div>
            <strong>Simulation mode</strong>
            <p>Actions are approval-gated. No real money moves.</p>
          </div>
        </div>
        <p className="sidebar__version">TrustDesk v1.0 · Capstone build</p>
      </div>
    </aside>
  )
}
