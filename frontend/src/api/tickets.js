import client from './client'

export const ticketsApi = {
  list: ({ status } = {}) =>
    client
      .get('/tickets', { params: status && status !== 'ALL' ? { status } : undefined })
      .then((response) => response.data),

  get: (ticketId) => client.get(`/tickets/${ticketId}`).then((response) => response.data),

  context: (ticketId) =>
    client.get(`/tickets/${ticketId}/context`).then((response) => response.data),

  create: (payload) => client.post('/tickets', payload).then((response) => response.data),

  updateStatus: (ticketId, status) =>
    client.patch(`/tickets/${ticketId}/status`, { status }).then((response) => response.data),

  triage: (ticketId) => client.post(`/tickets/${ticketId}/triage`).then((response) => response.data),

  triageStatus: (ticketId) =>
    client.get(`/tickets/${ticketId}/triage`).then((response) => response.data),

  classify: (payload) => client.post('/tickets/classify', payload).then((response) => response.data),
}
