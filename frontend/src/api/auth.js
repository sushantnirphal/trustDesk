import client from './client'

export const authApi = {
  login: (credentials) => client.post('/auth/login', credentials).then((response) => response.data),
  register: (payload) => client.post('/auth/register', payload).then((response) => response.data),
  me: () => client.get('/auth/me').then((response) => response.data),
}
