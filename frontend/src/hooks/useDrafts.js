import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { draftsApi } from '../api/drafts'
import { queryKeys } from '../api/queryKeys'

export function useDraftsForTicket(ticketId) {
  return useQuery({
    queryKey: queryKeys.drafts.forTicket(ticketId),
    queryFn: () => draftsApi.listForTicket(ticketId),
    enabled: Boolean(ticketId),
  })
}

export function useGenerateDraft(ticketId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload = {}) =>
      draftsApi.generate({ ticketId: Number(ticketId), allowEscalation: true, ...payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drafts.forTicket(ticketId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.traces.forTicket(ticketId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.traces.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats })
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.detail(ticketId) })
    },
  })
}

export function useReviewDraft(ticketId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ draftId, decision, comments }) =>
      draftsApi.review(draftId, { decision, comments }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drafts.forTicket(ticketId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats })
    },
  })
}
