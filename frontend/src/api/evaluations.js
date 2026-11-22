import client from './client'

export const evaluationsApi = {
  listCases: () => client.get('/eval/cases').then((response) => response.data),

  getCase: (caseId) => client.get(`/eval/cases/${caseId}`).then((response) => response.data),

  run: (payload = {}) =>
    client.post('/eval/run', payload, { timeout: 180_000 }).then((response) => response.data),
}
