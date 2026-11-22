import client from './client'

export const guardrailsApi = {
  check: (payload) => client.post('/guardrails/check', payload).then((response) => response.data),
}
