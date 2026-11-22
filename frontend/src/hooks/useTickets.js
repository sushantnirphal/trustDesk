import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ticketsApi } from '../api/tickets'
import { queryKeys } from '../api/queryKeys'

export function useTickets({ status } = {}) {
  return useQuery({
    queryKey: queryKeys.tickets.list({ status }),
    queryFn: () => ticketsApi.list({ status }),
    placeholderData: keepPreviousData,
  })
}

export function useTicket(ticketId) {
  return useQuery({
    queryKey: queryKeys.tickets.detail(ticketId),
    queryFn: () => ticketsApi.get(ticketId),
    enabled: Boolean(ticketId),
  })
}

export function useTicketContext(ticketId) {
  return useQuery({
    queryKey: queryKeys.tickets.context(ticketId),
    queryFn: () => ticketsApi.context(ticketId),
    enabled: Boolean(ticketId),
  })
}

export function useTriageStatus(ticketId) {
  return useQuery({
    queryKey: queryKeys.tickets.triage(ticketId),
    queryFn: () => ticketsApi.triageStatus(ticketId),
    enabled: Boolean(ticketId),
    retry: false,
  })
}

export function useCreateTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => ticketsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats })
    },
  })
}

export function useUpdateTicketStatus(ticketId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (status) => ticketsApi.updateStatus(ticketId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.detail(ticketId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats })
    },
  })
}

export function useRunTriage(ticketId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => ticketsApi.triage(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.detail(ticketId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.triage(ticketId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.traces.forTicket(ticketId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.traces.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats })
    },
  })
}
