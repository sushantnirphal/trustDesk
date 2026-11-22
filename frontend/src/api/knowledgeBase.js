import client from './client'
import { TICKET_CATEGORIES } from '../utils/constants'

export const knowledgeBaseApi = {
  search: (payload) => client.post('/kb/search', payload).then((response) => response.data),

  get: (kbId) => client.get(`/kb/${encodeURIComponent(kbId)}`).then((response) => response.data),

  byCategory: (category) =>
    client.get(`/kb/category/${encodeURIComponent(category)}`).then((response) => response.data),

  catalog: async () => {
    const categories = [...TICKET_CATEGORIES.map((category) => category.toLowerCase()), 'adversarial']
    const responses = await Promise.all(
      categories.map((category) =>
        client
          .get(`/kb/category/${encodeURIComponent(category)}`)
          .then((response) => response.data)
          .catch(() => []),
      ),
    )

    const seen = new Set()
    return responses
      .flat()
      .filter((document) => {
        if (!document?.kbId || seen.has(document.kbId)) return false
        seen.add(document.kbId)
        return true
      })
      .map(({ embedding, ...document }) => document)
  },
}
