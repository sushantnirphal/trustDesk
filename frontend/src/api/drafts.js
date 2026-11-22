import client from './client'

export const draftsApi = {
  generate: (payload) =>
    client.post('/drafts/generate', payload).then((response) => response.data),

  get: (draftId) => client.get(`/drafts/${draftId}`).then((response) => response.data),

  listForTicket: (ticketId) =>
    client.get(`/drafts/ticket/${ticketId}`).then((response) => response.data),

  review: (draftId, payload) =>
    client.patch(`/drafts/${draftId}/review`, payload).then((response) => response.data),
}
