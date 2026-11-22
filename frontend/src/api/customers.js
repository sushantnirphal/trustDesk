import client from './client'

export const customersApi = {
  list: () => client.get('/customers').then((response) => response.data),
  get: (customerId) => client.get(`/customers/${customerId}`).then((response) => response.data),
}

export const ordersApi = {
  list: ({ customerId } = {}) =>
    client
      .get('/orders', { params: customerId ? { customerId } : undefined })
      .then((response) => response.data),
  get: (orderId) => client.get(`/orders/${orderId}`).then((response) => response.data),
}
