import { useMutation, useQuery } from '@tanstack/react-query'
import { knowledgeBaseApi } from '../api/knowledgeBase'
import { queryKeys } from '../api/queryKeys'

export function useKnowledgeBaseCatalog() {
  return useQuery({
    queryKey: queryKeys.knowledgeBase.catalog,
    queryFn: knowledgeBaseApi.catalog,
    staleTime: 5 * 60_000,
  })
}

export function useKnowledgeBaseDocument(kbId) {
  return useQuery({
    queryKey: queryKeys.knowledgeBase.document(kbId),
    queryFn: () => knowledgeBaseApi.get(kbId),
    enabled: Boolean(kbId),
  })
}

export function useKnowledgeBaseSearch() {
  return useMutation({
    mutationFn: (payload) => knowledgeBaseApi.search(payload),
  })
}
