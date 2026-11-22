import { useQuery } from '@tanstack/react-query'
import { tracesApi } from '../api/traces'
import { queryKeys } from '../api/queryKeys'

export function useTraces({ runType, autoRefresh = false } = {}) {
  const hasType = Boolean(runType && runType !== 'ALL')
  return useQuery({
    queryKey: queryKeys.traces.list(hasType ? runType : null),
    queryFn: () => (hasType ? tracesApi.listByType(runType) : tracesApi.list()),
    refetchInterval: autoRefresh ? 10_000 : false,
  })
}

export function useTicketTraces(ticketId) {
  return useQuery({
    queryKey: queryKeys.traces.forTicket(ticketId),
    queryFn: () => tracesApi.listForTicket(ticketId),
    enabled: Boolean(ticketId),
  })
}
