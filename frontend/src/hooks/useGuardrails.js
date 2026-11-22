import { useMutation } from '@tanstack/react-query'
import { guardrailsApi } from '../api/guardrails'

export function useGuardrailCheck() {
  return useMutation({
    mutationFn: (payload) => guardrailsApi.check(payload),
  })
}
