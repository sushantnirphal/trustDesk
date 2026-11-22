import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { evaluationsApi } from '../api/evaluations'
import { queryKeys } from '../api/queryKeys'

export function useEvalCases() {
  return useQuery({
    queryKey: queryKeys.evaluations.cases,
    queryFn: evaluationsApi.listCases,
    staleTime: 5 * 60_000,
  })
}

export function useRunEvaluation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (caseIds) => evaluationsApi.run({ caseIds: caseIds ?? [] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.traces.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats })
    },
  })
}
