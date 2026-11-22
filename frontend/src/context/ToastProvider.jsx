import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ToastContext } from './ToastContext'
import ToastViewport from '../components/ui/ToastViewport'

let toastSequence = 0

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    const timer = timers.current.get(id)
    if (timer) clearTimeout(timer)
    timers.current.delete(id)
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    (message, { tone = 'info', title, duration = 4500 } = {}) => {
      const id = `toast-${++toastSequence}`
      setToasts((current) => [...current.slice(-3), { id, tone, title, message }])

      if (duration > 0) {
        const timer = setTimeout(() => dismiss(id), duration)
        timers.current.set(id, timer)
      }

      return id
    },
    [dismiss],
  )

  useEffect(() => {
    const activeTimers = timers.current
    return () => {
      activeTimers.forEach((timer) => clearTimeout(timer))
      activeTimers.clear()
    }
  }, [])

  const api = useMemo(
    () => ({
      push,
      dismiss,
      info: (message, options) => push(message, { ...options, tone: 'info' }),
      success: (message, options) => push(message, { ...options, tone: 'success' }),
      warning: (message, options) => push(message, { ...options, tone: 'warning' }),
      error: (message, options) =>
        push(message, { tone: 'error', duration: 7000, ...options }),
    }),
    [push, dismiss],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}
