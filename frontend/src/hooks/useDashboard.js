import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard'
import { queryKeys } from '../api/queryKeys'

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: dashboardApi.stats,
    refetchInterval: 60_000,
  })
}
