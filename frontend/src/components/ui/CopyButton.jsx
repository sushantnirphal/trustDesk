import { useState } from 'react'
import Button from './Button'

export default function CopyButton({ value, label = 'Copy', copiedLabel = 'Copied', size = 'sm', variant = 'ghost' }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(String(value ?? ''))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      icon={copied ? 'check' : 'copy'}
      onClick={copy}
      aria-label={copied ? copiedLabel : label}
    >
      {copied ? copiedLabel : label}
    </Button>
  )
}
