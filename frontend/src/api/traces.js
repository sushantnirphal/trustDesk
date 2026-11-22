import client from './client'

export const tracesApi = {
  list: () => client.get('/traces').then((response) => response.data),

  listByType: (runType) =>
    client.get(`/traces/type/${runType}`).then((response) => response.data),

  listForTicket: (ticketId) =>
    client.get(`/traces/ticket/${ticketId}`).then((response) => response.data),

  get: (traceId) => client.get(`/traces/${traceId}`).then((response) => response.data),
}
