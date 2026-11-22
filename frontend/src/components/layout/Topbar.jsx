import { useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import Icon from '../ui/Icon'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { initials } from '../../utils/format'

function getPageTitle(pathname) {
  if (pathname.startsWith('/dashboard')) return 'Overview'
  if (pathname.startsWith('/tickets/')) return 'Ticket detail'
  if (pathname.startsWith('/tickets')) return 'Tickets'
  if (pathname.startsWith('/approvals')) return 'Approvals'
  if (pathname.startsWith('/evaluations')) return 'Evaluations'
  if (pathname.startsWith('/knowledge-base')) return 'Knowledge base'
  if (pathname.startsWith('/traces')) return 'Traces'
  if (pathname.startsWith('/guardrails')) return 'Guardrails'
  return 'TrustDesk'
}

export default function Topbar({ onOpenNav }) {
  const { user, logout } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const pageTitle = getPageTitle(location.pathname)

  const refreshWorkspace = async () => {
    await queryClient.refetchQueries({ type: 'active' })
    toast.success('Workspace refreshed.')
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button type="button" className="topbar__menu" onClick={onOpenNav} aria-label="Open navigation">
          <Icon name="menu" size={20} />
        </button>
        <div className="topbar__heading">
          <span className="topbar__eyebrow">Support operations</span>
          <h2 className="topbar__title">{pageTitle}</h2>
        </div>
      </div>

      <div className="topbar__right">
        <span className="topbar__status" title="Backend connection is configured through the Vite proxy">
          <span className="status-dot" aria-hidden="true" />
          Demo workspace
        </span>

        <button
          type="button"
          className="icon-button"
          onClick={refreshWorkspace}
          aria-label="Refresh workspace data"
          title="Refresh workspace data"
        >
          <Icon name="refresh" size={17} />
        </button>

        <div className="user-chip">
          <span className="avatar" aria-hidden="true">{initials(user?.username)}</span>
          <div className="user-chip__text">
            <strong>{user?.username ?? 'Unknown'}</strong>
            <span>{user?.role ?? '—'}</span>
          </div>
        </div>

        <button type="button" className="icon-button icon-button--danger" onClick={handleLogout} aria-label="Sign out" title="Sign out">
          <Icon name="logout" size={17} />
        </button>
      </div>
    </header>
  )
}
