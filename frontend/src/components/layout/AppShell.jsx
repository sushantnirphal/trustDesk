import { Suspense, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import Skeleton from '../ui/Skeleton'

function PageFallback() {
  return (
    <div className="page">
      <div className="stack">
        <Skeleton width="34%" height={28} />
        <Skeleton width="62%" height={14} />
        <div className="stat-grid">
          <Skeleton height={118} />
          <Skeleton height={118} />
          <Skeleton height={118} />
          <Skeleton height={118} />
        </div>
        <Skeleton height={320} />
      </div>
    </div>
  )
}

export default function AppShell() {
  const [navOpen, setNavOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.classList.toggle('nav-open', navOpen)
    return () => document.body.classList.remove('nav-open')
  }, [navOpen])

  useEffect(() => {
    if (!navOpen) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setNavOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [navOpen])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />

      {navOpen ? (
        <button
          type="button"
          className="sidebar-scrim"
          onClick={() => setNavOpen(false)}
          aria-label="Close navigation"
        />
      ) : null}

      <div className="app-main">
        <Topbar onOpenNav={() => setNavOpen(true)} />
        <main id="main-content" className="app-content" tabIndex={-1}>
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
