import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AuthContext } from './AuthContext'
import { authApi } from '../api/auth'
import { TOKEN_STORAGE_KEY, UNAUTHORIZED_EVENT, USER_STORAGE_KEY } from '../utils/constants'
import { useToast } from '../hooks/useToast'

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

function persistSession(token, user) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token)
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
}

function clearSession() {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(USER_STORAGE_KEY)
}

export default function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [user, setUser] = useState(() => readStoredUser())
  const [status, setStatus] = useState(() => (getStoredToken() ? 'loading' : 'anonymous'))

  const logout = useCallback(
    ({ message, silent = false } = {}) => {
      clearSession()
      setUser(null)
      setStatus('anonymous')
      queryClient.clear()
      if (message && !silent) {
        toast.info(message)
      }
    },
    [queryClient, toast],
  )

  useEffect(() => {
    const token = getStoredToken()
    if (!token) {
      setStatus('anonymous')
      return undefined
    }

    let active = true
    authApi
      .me()
      .then((profile) => {
        if (!active) return
        const nextUser = { username: profile.username, role: profile.role }
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser))
        setUser(nextUser)
        setStatus('authenticated')
      })
      .catch(() => {
        if (!active) return
        clearSession()
        setUser(null)
        setStatus('anonymous')
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => {
      if (!getStoredToken()) return
      logout({ message: 'Your session expired. Please sign in again.' })
    }

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [logout])

  const login = useCallback(
    async (credentials) => {
      const data = await authApi.login(credentials)
      const nextUser = { username: data.username, role: data.role }
      persistSession(data.token, nextUser)
      queryClient.clear()
      setUser(nextUser)
      setStatus('authenticated')
      return nextUser
    },
    [queryClient],
  )

  const hasRole = useCallback(
    (...roles) => Boolean(user?.role && roles.flat().includes(user.role)),
    [user],
  )

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated',
      isBootstrapping: status === 'loading',
      login,
      logout,
      hasRole,
    }),
    [user, status, login, logout, hasRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
