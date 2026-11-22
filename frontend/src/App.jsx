import { lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import ProtectedRoute from './components/layout/ProtectedRoute'
import ScrollToTop from './components/layout/ScrollToTop'
import { FullPageLoader } from './components/ui/Spinner'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const TicketsPage = lazy(() => import('./pages/TicketsPage'))
const TicketDetailPage = lazy(() => import('./pages/TicketDetailPage'))
const ApprovalsPage = lazy(() => import('./pages/ApprovalsPage'))
const EvaluationsPage = lazy(() => import('./pages/EvaluationsPage'))
const KnowledgeBasePage = lazy(() => import('./pages/KnowledgeBasePage'))
const TracesPage = lazy(() => import('./pages/TracesPage'))
const GuardrailsPage = lazy(() => import('./pages/GuardrailsPage'))

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="tickets" element={<TicketsPage />} />
          <Route path="tickets/:id" element={<TicketDetailPage />} />
          <Route path="approvals" element={<ApprovalsPage />} />
          <Route path="evaluations" element={<EvaluationsPage />} />
          <Route path="knowledge-base" element={<KnowledgeBasePage />} />
          <Route path="traces" element={<TracesPage />} />
          <Route path="guardrails" element={<GuardrailsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
