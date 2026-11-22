import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import { FormField, Input } from '../components/ui/Field'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { getErrorMessage } from '../utils/errors'
import { DEMO_ACCOUNTS } from '../utils/constants'

const highlights = [
  {
    icon: 'sparkles',
    title: 'Guardrailed triage',
    text: 'Prompt-injection and identity-bypass attempts are blocked or escalated before they reach the model.',
  },
  {
    icon: 'file',
    title: 'Cited drafts',
    text: 'Every reply is grounded in retrieved policy documents, with citations and a grounding score.',
  },
  {
    icon: 'lock',
    title: 'Human-in-the-loop actions',
    text: 'Refunds and replacements stay pending until an agent approves them. Execution is idempotent.',
  },
]

export default function LoginPage() {
  useDocumentTitle('Sign in')
  const { isAuthenticated, login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({ username: 'agent', password: 'agent123' })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [authError, setAuthError] = useState('')

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
    setAuthError('')
  }

  const submit = async (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!form.username.trim()) nextErrors.username = 'Username is required.'
    if (!form.password) nextErrors.password = 'Password is required.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    setAuthError('')
    try {
      const user = await login({ username: form.username.trim(), password: form.password })
      toast.success(`Signed in as ${user.username} (${user.role}).`)
      const destination = location.state?.from?.pathname || '/dashboard'
      navigate(destination, { replace: true })
    } catch (error) {
      setAuthError(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  const fillDemo = (account) => {
    setForm({ username: account.username, password: account.password })
    setErrors({})
    setAuthError('')
  }

  return (
    <div className="auth-page">
      <section className="auth-visual" aria-label="TrustDesk overview">
        <div className="auth-visual__glow" aria-hidden="true" />
        <div className="auth-brand">
          <span className="brand-mark brand-mark--lg" aria-hidden="true">
            <Icon name="shield" size={26} />
          </span>
          <div>
            <p className="auth-brand__name">TrustDesk</p>
            <p className="auth-brand__tagline">AI Support Operations Agent</p>
          </div>
        </div>

        <div className="auth-hero">
          <p className="auth-hero__eyebrow">Capstone operations console</p>
          <h1>Resolve support tickets with AI you can audit.</h1>
          <p>
            Triage, cite policy, draft replies, and gate sensitive actions behind human approval —
            with a full trace and evaluation loop behind every decision.
          </p>
        </div>

        <ul className="auth-highlights">
          {highlights.map((item) => (
            <li key={item.title}>
              <span className="auth-highlights__icon">
                <Icon name={item.icon} size={18} />
              </span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.text}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="auth-workflow" aria-hidden="true">
          <span>Ticket</span>
          <Icon name="arrowRight" size={14} />
          <span>Triage</span>
          <Icon name="arrowRight" size={14} />
          <span>Cited draft</span>
          <Icon name="arrowRight" size={14} />
          <span>Approval</span>
          <Icon name="arrowRight" size={14} />
          <span>Trace</span>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-card__header">
            <span className="auth-card__badge">
              <Icon name="lock" size={13} /> Secure workspace
            </span>
            <h2>Sign in to TrustDesk</h2>
            <p>Use a demo account to explore the support operations workflow.</p>
          </div>

          {authError ? (
            <div className="callout callout--danger" role="alert">
              <Icon name="alert" size={16} />
              <p>{authError}</p>
            </div>
          ) : null}

          <form className="auth-form" onSubmit={submit} noValidate>
            <FormField label="Username" htmlFor="login-username" error={errors.username} required>
              <Input
                id="login-username"
                autoComplete="username"
                value={form.username}
                onChange={(event) => update('username', event.target.value)}
                placeholder="agent"
                invalid={Boolean(errors.username)}
                autoFocus
              />
            </FormField>

            <FormField label="Password" htmlFor="login-password" error={errors.password} required>
              <div className="password-field">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(event) => update('password', event.target.value)}
                  placeholder="••••••••"
                  invalid={Boolean(errors.password)}
                />
                <button
                  type="button"
                  className="password-field__toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} size={16} />
                </button>
              </div>
            </FormField>

            <Button type="submit" block size="lg" loading={submitting} icon="arrowRight">
              Sign in
            </Button>
          </form>

          <div className="auth-demo">
            <p className="auth-demo__label">Demo accounts</p>
            <div className="auth-demo__buttons">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.username}
                  type="button"
                  className="demo-account"
                  onClick={() => fillDemo(account)}
                >
                  <span className="demo-account__role">{account.role}</span>
                  <span className="demo-account__credentials">
                    {account.username} / {account.password}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <p className="auth-footnote">
            <Icon name="info" size={14} />
            This capstone runs in simulation mode. Tool actions never move real money.
          </p>
        </div>
      </section>
    </div>
  )
}
