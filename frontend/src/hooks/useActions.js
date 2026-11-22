import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { actionsApi } from '../api/actions'
import { queryKeys } from '../api/queryKeys'

function invalidateActionData(queryClient, ticketId) {
  queryClient.invalidateQueries({ queryKey: queryKeys.actions.all })
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats })
  queryClient.invalidateQueries({ queryKey: queryKeys.traces.all })
  if (ticketId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.traces.forTicket(ticketId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.tickets.detail(ticketId) })
  }
}

export function useAllActions() {
  return useQuery({
    queryKey: queryKeys.actions.all,
    queryFn: actionsApi.listAll,
  })
}

export function usePendingActions() {
  return useQuery({
    queryKey: queryKeys.actions.pending,
    queryFn: actionsApi.listPending,
    refetchInterval: 30_000,
  })
}

export function useTicketActions(ticketId) {
  return useQuery({
    queryKey: queryKeys.actions.forTicket(ticketId),
    queryFn: () => actionsApi.listForTicket(ticketId),
    enabled: Boolean(ticketId),
  })
}

export function useRecommendAction(ticketId) {
  return useMutation({
    mutationFn: () => actionsApi.recommend(ticketId),
  })
}

export function useProposeAction(ticketId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => actionsApi.propose(ticketId, payload),
    onSuccess: () => invalidateActionData(queryClient, ticketId),
  })
}

export function useApproveAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ actionId, comments }) => actionsApi.approve(actionId, { comments }),
    onSuccess: (data, variables) => {
      invalidateActionData(queryClient, data?.ticketId ?? variables.ticketId)
    },
  })
}

export function useRejectAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ actionId, comments }) => actionsApi.reject(actionId, { comments }),
    onSuccess: (data, variables) => {
      invalidateActionData(queryClient, data?.ticketId ?? variables.ticketId)
    },
  })
}
