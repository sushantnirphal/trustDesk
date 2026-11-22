import { useEffect } from 'react'

export function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title
    document.title = title ? `${title} · TrustDesk` : 'TrustDesk · AI Support Operations'
    return () => {
      document.title = previous
    }
  }, [title])
}
