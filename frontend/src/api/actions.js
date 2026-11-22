import client from './client'

export const actionsApi = {
  listAll: () => client.get('/actions').then((response) => response.data),

  listPending: () => client.get('/actions/pending').then((response) => response.data),

  get: (actionId) => client.get(`/actions/${actionId}`).then((response) => response.data),

  listForTicket: (ticketId) =>
    client.get(`/actions/ticket/${ticketId}`).then((response) => response.data),

  recommend: (ticketId) =>
    client.post(`/tickets/${ticketId}/actions/recommend`).then((response) => response.data),

  propose: (ticketId, payload) =>
    client.post(`/tickets/${ticketId}/actions`, payload).then((response) => response.data),

  approve: (actionId, payload = {}) =>
    client.post(`/actions/${actionId}/approve`, payload).then((response) => response.data),

  reject: (actionId, payload = {}) =>
    client.post(`/actions/${actionId}/reject`, payload).then((response) => response.data),
}
